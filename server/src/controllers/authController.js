/**
 * Authentication endpoints.
 *
 * Input is already validated and type-checked by the route's schema (see
 * lib/schemas.js), so everything here can assume `req.body.userId` is a
 * trimmed lower-case string and not an object.
 */
const crypto = require('crypto');
const User = require('../models/User');
const sessions = require('../lib/sessions');
const audit = require('../lib/audit');
const rl = require('../middleware/rateLimit');
const { config } = require('../config/env');
const { randomToken, hashToken, REFRESH_COOKIE } = require('../lib/tokens');
const { dummyVerify, passwordProblems } = require('../lib/passwords');
const { sendPasswordReset } = require('../utils/mailer');

/**
 * The one and only message for a failed sign-in.
 *
 * It does not say whether the account exists, and it is identical for
 * "no such user", "wrong password" and "malformed stored hash". The login
 * form's own wording is "Wrong user ID or password", which matches.
 */
const LOGIN_FAILED = 'Invalid user ID or password';

/* -------------------------------------------------------------------- login */

async function login(req, res) {
  const { userId, password } = req.body;

  /**
   * Account-scoped backoff is checked first, before any hashing. This both
   * makes the block cheap to serve and prevents the hash work itself being
   * used as an oracle.
   */
  const blocked = await rl.accountBlock(userId);
  if (blocked) {
    audit.record('login.ratelimited', req, { userIdAttempted: userId, meta: { scope: 'account' } });
    return rl.tooMany(res, blocked, 'Too many failed attempts for this account. Please wait and try again.');
  }

  const user = await User.findOne({ userId }).select('+passwordHash');

  /**
   * Both branches do comparable work. When the account does not exist we still
   * run an Argon2 verification against a throwaway hash, so "unknown user" and
   * "wrong password" take similar time. Without this, response timing alone
   * enumerates valid admin ids.
   */
  const { ok, needsRehash } = user ? await user.checkPassword(password) : await dummyVerify();

  if (!ok) {
    await rl.registerLoginFailure(userId);
    audit.record('login.failure', req, {
      user: user || null,
      userIdAttempted: userId,
      // Recorded server-side only. The client is told nothing of this.
      meta: { reason: user ? 'bad_password' : 'no_such_user' },
    });
    return res.status(401).json({ message: LOGIN_FAILED });
  }

  // Correct password still stored as legacy bcrypt (or weaker Argon2
  // parameters): upgrade it now, while we have the plaintext. Does not touch
  // tokenVersion — the credential has not changed, so sessions survive.
  if (needsRehash) {
    try {
      await user.upgradeHash(password);
      audit.record('password.changed', req, { user, meta: { reason: 'hash_upgraded_to_argon2id' } });
    } catch (err) {
      // A failed upgrade must not fail the login.
      console.error('[auth] hash upgrade failed: %s', err.message);
    }
  }

  await rl.clearLoginFailures(userId);

  const session = await sessions.startSession(user, req, res);
  audit.record('login.success', req, { user, userIdAttempted: userId });

  return res.json({
    token: session.token,
    expiresIn: session.expiresIn,
    csrfToken: session.csrfToken,
    user: user.toSafe(),
  });
}

/* ------------------------------------------------------------------ refresh */

/**
 * Exchanges the HttpOnly refresh cookie for a new access token.
 *
 * Every failure mode answers the same 401. In particular a detected token
 * reuse is not announced to the caller — telling an attacker that their stolen
 * token was spotted only helps them.
 */
async function refresh(req, res) {
  const raw = req.cookies?.[REFRESH_COOKIE];
  const result = await sessions.rotate(raw, req, res, User);

  if (!result.ok) {
    if (result.reason !== 'missing') {
      audit.record('refresh.failure', req, { meta: { reason: result.reason } });
    }
    return res.status(401).json({ message: 'Session expired. Please sign in again.' });
  }

  return res.json({
    token: result.token,
    expiresIn: result.expiresIn,
    csrfToken: result.csrfToken,
    user: result.user.toSafe(),
  });
}

/* ------------------------------------------------------------------- logout */

/**
 * Ends this session. Always answers 200: there is nothing useful to tell a
 * caller who was not signed in, and a failing logout is worse than a no-op.
 */
async function logout(req, res) {
  const raw = req.cookies?.[REFRESH_COOKIE];

  // `revokeByRawToken` returns the session it ended, so the audit row can name
  // the account. This route has no `protect`, so `req.user` is always
  // undefined here and every logout would otherwise be an anonymous entry.
  let revoked = null;
  try {
    revoked = await sessions.revokeByRawToken(raw, 'logout');
  } catch (err) {
    console.error('[auth] logout revoke failed: %s', err.message);
  }

  sessions.clearSessionCookies(res);
  audit.record('logout', req, { user: req.user || revoked?.user || null });
  return res.json({ ok: true });
}

/* ----------------------------------------------------------------------- me */

async function me(req, res) {
  return res.json({ user: req.user.toSafe() });
}

/* ------------------------------------------------------------------- forgot */

// Identical for every outcome: account missing, account without an email,
// account rate-limited, SMTP down. The caller learns nothing about who exists.
const FORGOT_REPLY = {
  ok: true,
  message: 'If that account exists and has an email address on file, a reset link has been sent.',
};

async function forgot(req, res) {
  const { userId } = req.body;

  /**
   * The per-account limit is consumed before the lookup, and exhausting it
   * still returns the same 200 body — a 429 here would itself reveal that the
   * account exists.
   */
  const limited = await rl.consumeForgotAccount(userId);

  const user = limited ? null : await User.findOne({ userId }).select('+resetTokenHash +resetTokenExp');

  if (user) {
    const target = user.email || (/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(user.userId) ? user.userId : '');

    if (target) {
      // Issuing a new token invalidates any previous one for this account,
      // because only one hash is stored.
      const raw = randomToken(32);
      user.resetTokenHash = hashToken(raw);
      user.resetTokenExp = new Date(Date.now() + config.resetTokenTtl * 1000);
      user.resetTokenUsedAt = null;
      await user.save({ validateBeforeSave: false });

      const link = `${config.clientUrl}/admin/reset?token=${encodeURIComponent(raw)}`;
      // Not awaited into the response: delivery time must not be observable.
      sendPasswordReset(target, link).catch(() => {});

      audit.record('password.reset.requested', req, {
        user,
        userIdAttempted: userId,
        meta: { delivered: 'queued' }, // the token and address are deliberately absent
      });
    } else {
      audit.record('password.reset.requested', req, {
        user,
        userIdAttempted: userId,
        meta: { outcome: 'no_email_on_file' },
      });
    }
  } else {
    audit.record('password.reset.requested', req, {
      userIdAttempted: userId,
      meta: { outcome: limited ? 'rate_limited' : 'no_such_user' },
    });
  }

  return res.json(FORGOT_REPLY);
}

/* -------------------------------------------------------------------- reset */

const RESET_FAILED = 'That reset link is invalid or has expired. Please request a new one.';

async function reset(req, res) {
  const { token, password } = req.body;

  const user = await User.findOne({ resetTokenHash: hashToken(token) }).select(
    '+resetTokenHash +resetTokenExp +resetTokenUsedAt +passwordHash'
  );

  /**
   * One message for: unknown token, expired token, already-used token. A
   * distinct "already used" reply would confirm to an attacker holding an old
   * link that it was once valid.
   */
  const usable =
    user && user.resetTokenExp && user.resetTokenExp > new Date() && !user.resetTokenUsedAt;

  if (!usable) {
    audit.record('password.reset.failure', req, {
      user: user || null,
      meta: {
        reason: !user ? 'unknown_token' : user.resetTokenUsedAt ? 'already_used' : 'expired',
      },
    });
    return res.status(400).json({ message: RESET_FAILED });
  }

  /**
   * Policy is enforced here, not only in the browser. Checked before the token
   * is spent, so a rejected password does not cost the user their link.
   */
  const problems = passwordProblems(password, { 'user ID': user.userId, name: user.name });
  if (problems.length) {
    return res.status(400).json({ message: problems[0], errors: { password: problems[0] } });
  }

  /**
   * Claim the token AND set the password in one atomic write.
   *
   * Two properties matter here, and they are easy to get wrong separately:
   *
   *  - Restating the validity conditions inside the filter is what makes the
   *    link genuinely single-use. Two requests arriving with the same token in
   *    the same instant both pass the read above, but only one can match this
   *    write; the loser is told the link is invalid, which it now is.
   *
   *  - Claiming and setting together means there is no window where the token
   *    is spent but the password is unchanged. An earlier version of this did
   *    claim-then-save(), and a full save runs document-wide validation — so a
   *    user whose stored `email` predates the current validator had their
   *    reset link burned by a ValidationError without ever getting a new
   *    password. See User.applyNewPassword.
   */
  const target = await User.applyNewPassword(
    {
      _id: user._id,
      resetTokenHash: hashToken(token),
      resetTokenUsedAt: null,
      resetTokenExp: { $gt: new Date() },
    },
    password,
    { resetTokenUsedAt: new Date() }
  );

  if (!target) {
    audit.record('password.reset.failure', req, { user, meta: { reason: 'lost_claim_race' } });
    return res.status(400).json({ message: RESET_FAILED });
  }

  // A reset must not leave an intruder's session alive.
  await sessions.revokeAllForUser(target._id, 'password_reset');
  sessions.clearSessionCookies(res);

  audit.record('password.reset.completed', req, { user: target, userIdAttempted: target.userId });

  return res.json({ ok: true, message: 'Password changed. You can sign in now.' });
}

module.exports = { login, refresh, logout, me, forgot, reset, LOGIN_FAILED };
