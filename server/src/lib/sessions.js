/**
 * Session lifecycle: issuing, rotating and revoking refresh tokens.
 *
 * Kept out of the controller so the rotation and reuse-detection rules live in
 * one auditable place.
 */
const crypto = require('crypto');
const RefreshToken = require('../models/RefreshToken');
const {
  randomToken,
  hashToken,
  signAccessToken,
  refreshCookieOptions,
  csrfCookieOptions,
  REFRESH_COOKIE,
  CSRF_COOKIE,
} = require('../lib/tokens');
const { config } = require('../config/env');
const audit = require('../lib/audit');

/**
 * Creates a refresh token row and returns the raw token (the only time it
 * exists in plaintext).
 *
 * @param {string} family  omit to start a new session family
 */
async function issueRefreshToken(user, req, family = null) {
  const raw = randomToken(32);
  const expiresAt = new Date(Date.now() + config.refreshTokenTtl * 1000);

  await RefreshToken.create({
    tokenHash: hashToken(raw),
    user: user._id,
    family: family || crypto.randomUUID(),
    expiresAt,
    ip: audit.clientIp(req),
    userAgent: audit.userAgent(req),
  });

  return { raw, expiresAt };
}

/**
 * Writes the refresh + CSRF cookies and returns the access token.
 *
 * Called on sign-in and on every rotation, so the CSRF value changes with the
 * session.
 */
async function startSession(user, req, res, family = null) {
  const { raw } = await issueRefreshToken(user, req, family);
  const csrf = randomToken(16);

  res.cookie(REFRESH_COOKIE, raw, refreshCookieOptions());
  res.cookie(CSRF_COOKIE, csrf, csrfCookieOptions());

  return {
    token: signAccessToken(user),
    expiresIn: config.accessTokenTtl,
    csrfToken: csrf,
  };
}

/** Clears both cookies. Must mirror the attributes used when setting them. */
function clearSessionCookies(res) {
  res.clearCookie(REFRESH_COOKIE, { ...refreshCookieOptions(0), maxAge: undefined });
  res.clearCookie(CSRF_COOKIE, { ...csrfCookieOptions(0), maxAge: undefined });
}

/**
 * Exchanges a refresh token for a new pair.
 *
 * Outcomes:
 *   { ok: true, ... }                    rotated
 *   { ok: false, reason: 'missing' }     no cookie
 *   { ok: false, reason: 'unknown' }     not a token we issued (or expired out)
 *   { ok: false, reason: 'reuse' }       already spent -> whole family revoked
 *   { ok: false, reason: 'revoked' }     family was killed earlier
 *   { ok: false, reason: 'expired' }
 *
 * Callers answer all of these identically to the client.
 */
async function rotate(rawToken, req, res, User) {
  if (!rawToken) return { ok: false, reason: 'missing' };

  const tokenHash = hashToken(rawToken);
  const now = new Date();

  /**
   * Claim the token atomically.
   *
   * This is a single conditional write rather than a read followed by a save,
   * and that matters: with a read-then-write, two requests arriving together
   * with the same token both observe `usedAt: null`, both proceed, and both
   * mint a new token in the same family — so an attacker racing the real user
   * gets a working session and reuse detection never fires.
   *
   * Only one writer can match `usedAt: null`, so a concurrent second request
   * falls through to the classification below and is correctly treated as what
   * it is: a second use of a single-use token.
   */
  const claimed = await RefreshToken.findOneAndUpdate(
    { tokenHash, usedAt: null, revokedAt: null, expiresAt: { $gt: now } },
    { $set: { usedAt: now } },
    { new: true }
  );

  if (!claimed) {
    // We did not get the token. Work out why, so a genuine replay triggers
    // family revocation while an expired or already-revoked token does not.
    const existing = await RefreshToken.findOne({ tokenHash });

    // Clear the cookie in every failure case, including an unrecognised
    // token: leaving a dead credential in the browser just makes the SPA
    // 401 against it on every subsequent request.
    clearSessionCookies(res);

    if (!existing) return { ok: false, reason: 'unknown' };

    /**
     * Reuse detection. A refresh token is single-use; seeing a spent one means
     * two parties hold it — the legitimate client and whoever copied it. We
     * cannot tell which one is asking, so the safe move is to end the whole
     * family and make everyone re-authenticate.
     */
    if (existing.usedAt) {
      await RefreshToken.updateMany(
        { family: existing.family, revokedAt: null },
        { $set: { revokedAt: new Date(), revokedReason: 'reuse_detected' } }
      );
      audit.record('refresh.reuse', req, {
        user: existing.user,
        meta: { family: existing.family, action: 'family_revoked' },
      });
      return { ok: false, reason: 'reuse' };
    }

    if (existing.revokedAt) return { ok: false, reason: 'revoked' };

    return { ok: false, reason: 'expired' };
  }

  const user = await User.findById(claimed.user);
  if (!user) {
    // The token was valid but its owner is gone. It is already spent, which is
    // the safe outcome.
    clearSessionCookies(res);
    return { ok: false, reason: 'unknown' };
  }

  /**
   * The credential behind this session must still be the current one.
   *
   * Without this check, rotation quietly undoes the tokenVersion mechanism:
   * `signAccessToken` stamps the user's *current* tokenVersion onto the new
   * token, so a surviving refresh token heals a session that a password change
   * was supposed to end. Both callers that bump tokenVersion do also revoke
   * refresh tokens, so there is no live bypass — but that makes the invariant
   * a convention held at two call sites instead of a rule enforced by the one
   * function that issues credentials.
   */
  if (user.passwordChangedAt && claimed.createdAt && claimed.createdAt < user.passwordChangedAt) {
    await RefreshToken.updateMany(
      { family: claimed.family, revokedAt: null },
      { $set: { revokedAt: new Date(), revokedReason: 'password_changed' } }
    );
    clearSessionCookies(res);
    return { ok: false, reason: 'stale_credential' };
  }

  /**
   * Absolute session lifetime.
   *
   * Each rotation sets a fresh `expiresAt`, which makes the refresh window
   * sliding rather than bounded — a session, including a stolen one, could be
   * kept alive indefinitely by refreshing inside it. The family's oldest token
   * fixes when the session actually began, and nothing may outlive that by
   * more than the ceiling.
   */
  const oldest = await RefreshToken.findOne({ family: claimed.family })
    .sort({ createdAt: 1 })
    .select('createdAt');

  if (oldest?.createdAt && Date.now() - oldest.createdAt.getTime() > config.sessionMaxLifetime * 1000) {
    await RefreshToken.updateMany(
      { family: claimed.family, revokedAt: null },
      { $set: { revokedAt: new Date(), revokedReason: 'max_lifetime' } }
    );
    clearSessionCookies(res);
    return { ok: false, reason: 'max_lifetime' };
  }

  const session = await startSession(user, req, res, claimed.family);
  audit.record('refresh.success', req, { user, meta: { family: claimed.family } });

  return { ok: true, user, ...session };
}

/**
 * Ends one session (the token presented), leaving other devices signed in.
 *
 * Returns the revoked record, so the caller can attribute an audit entry —
 * /auth/logout is not behind `protect`, so it has no other way to know whose
 * session it just ended.
 */
async function revokeByRawToken(rawToken, reason = 'logout') {
  if (!rawToken) return null;
  return RefreshToken.findOneAndUpdate(
    { tokenHash: hashToken(rawToken), revokedAt: null },
    { $set: { revokedAt: new Date(), revokedReason: reason } },
    { new: true }
  );
}

/**
 * Ends every session for a user. Used on password change and reset — a
 * password change must not leave an attacker's existing session alive.
 */
async function revokeAllForUser(userId, reason = 'password_changed') {
  await RefreshToken.updateMany(
    { user: userId, revokedAt: null },
    { $set: { revokedAt: new Date(), revokedReason: reason } }
  );
}

module.exports = {
  startSession,
  clearSessionCookies,
  rotate,
  revokeByRawToken,
  revokeAllForUser,
  issueRefreshToken,
};
