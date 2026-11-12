/**
 * Full authentication flows against a real MongoDB.
 *
 * This tier covers what the mocked tier cannot: unique indexes, TTL fields,
 * refresh-token rotation and reuse detection across documents, single-use
 * reset tokens under genuine concurrency, and the audit trail as actually
 * written.
 */
const { connect, disconnect, clear, mongoose } = require('./setup');

const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');

const app = require('../../src/app');
const User = require('../../src/models/User');
const RefreshToken = require('../../src/models/RefreshToken');
const AuthEvent = require('../../src/models/AuthEvent');

const PASSWORD = 'a-perfectly-good-passphrase';
const WRONG = 'definitely-not-the-password';

let ip = 0;
/** A fresh client IP per call, so tests do not consume each other's budgets. */
function freshIp() {
  ip += 1;
  return `198.51.100.${(ip % 250) + 1}`;
}

function post(path, body, clientIp = freshIp()) {
  return request(app).post(path).set('X-Forwarded-For', clientIp).send(body);
}

async function makeAdmin(overrides = {}) {
  const user = new User({
    name: 'Admin',
    userId: 'admin',
    email: 'admin@rvmaitech.com',
    password: PASSWORD,
    ...overrides,
  });
  await user.save();
  return user;
}

/** Parses the refresh cookie value out of a Set-Cookie array. */
function cookieValue(res, name) {
  const line = (res.headers['set-cookie'] || []).find((c) => c.startsWith(`${name}=`));
  if (!line) return null;
  const value = line.split(';')[0].slice(name.length + 1);
  return value || null;
}

test.before(async () => {
  await connect();
});

test.after(async () => {
  await disconnect();
});

test.beforeEach(async () => {
  await clear();
  const rl = require('../../src/middleware/rateLimit');
  rl._resetAll();
});

/* ------------------------------------------------------------- persistence */

test('a saved password is stored as Argon2id and is not recoverable', async () => {
  await makeAdmin();

  // Read the raw document: passwordHash is select:false, so it takes an
  // explicit ask — which is itself the point.
  const raw = await User.findOne({ userId: 'admin' }).select('+passwordHash').lean();

  assert.match(raw.passwordHash, /^\$argon2id\$/);
  assert.ok(!raw.passwordHash.includes(PASSWORD));
  assert.equal(raw.password, undefined, 'no plaintext field should exist');
});

test('an ordinary query never returns the password hash', async () => {
  await makeAdmin();

  const user = await User.findOne({ userId: 'admin' }).lean();
  assert.equal(user.passwordHash, undefined);
  assert.equal(user.resetTokenHash, undefined);
});

test('the userId unique index is enforced', async () => {
  await makeAdmin();

  await assert.rejects(
    () => makeAdmin({ email: 'other@rvmaitech.com' }),
    (err) => err.code === 11000,
    'a duplicate user id must be refused by the database, not just by application code'
  );
});

test('an invalid email is refused by the model', async () => {
  await assert.rejects(
    () => makeAdmin({ email: 'not-an-email' }),
    (err) => err.name === 'ValidationError'
  );
});

/* -------------------------------------------------------------- login flow */

test('login succeeds, persists a refresh token, and stores only its hash', async () => {
  await makeAdmin();

  const res = await post('/api/auth/login', { userId: 'admin', password: PASSWORD });
  assert.equal(res.status, 200);

  const raw = cookieValue(res, 'rv_rt');
  assert.ok(raw, 'a refresh cookie should be set');

  const stored = await RefreshToken.findOne({});
  assert.ok(stored, 'a refresh token row should exist');
  assert.notEqual(stored.tokenHash, raw, 'the raw token must not be stored');
  assert.match(stored.tokenHash, /^[a-f0-9]{64}$/);
  assert.equal(stored.usedAt, null);
  assert.ok(stored.expiresAt > new Date());
});

test('login is refused after the password is wrong too many times, then recovers', async () => {
  await makeAdmin();
  const attacker = freshIp();

  let sawLimit = false;
  for (let i = 0; i < 12; i += 1) {
    // eslint-disable-next-line no-await-in-loop
    const res = await post('/api/auth/login', { userId: 'admin', password: WRONG }, attacker);
    if (res.status === 429) {
      sawLimit = true;
      break;
    }
    assert.equal(res.status, 401);
  }
  assert.ok(sawLimit, 'repeated failures should eventually be rate limited');

  // The block is temporary, not a lockout: clearing the streak (as a
  // successful login does) restores access immediately.
  const rl = require('../../src/middleware/rateLimit');
  await rl.clearLoginFailures('admin');
  rl._resetAll();

  const ok = await post('/api/auth/login', { userId: 'admin', password: PASSWORD });
  assert.equal(ok.status, 200, 'the account must not be permanently locked');
});

test('a successful login clears the failure streak', async () => {
  await makeAdmin();
  const client = freshIp();

  await post('/api/auth/login', { userId: 'admin', password: WRONG }, client);
  await post('/api/auth/login', { userId: 'admin', password: WRONG }, client);

  assert.equal((await post('/api/auth/login', { userId: 'admin', password: PASSWORD }, client)).status, 200);

  // Two more failures should not immediately re-block, because the streak reset.
  const after = await post('/api/auth/login', { userId: 'admin', password: WRONG }, client);
  assert.equal(after.status, 401, 'expected a normal rejection, not a 429');
});

/* --------------------------------------------------- refresh and rotation */

test('a refresh token rotates: the old one is spent and a new one issued', async () => {
  await makeAdmin();

  const login = await post('/api/auth/login', { userId: 'admin', password: PASSWORD });
  const firstToken = cookieValue(login, 'rv_rt');
  const csrf = cookieValue(login, 'rv_csrf');

  const refreshed = await request(app)
    .post('/api/auth/refresh')
    .set('X-Forwarded-For', freshIp())
    .set('Cookie', `rv_rt=${firstToken}; rv_csrf=${csrf}`)
    .set('X-CSRF-Token', csrf);

  assert.equal(refreshed.status, 200);
  assert.ok(refreshed.body.token, 'a new access token should be issued');

  const secondToken = cookieValue(refreshed, 'rv_rt');
  assert.ok(secondToken);
  assert.notEqual(secondToken, firstToken, 'the refresh token must be rotated');

  const rows = await RefreshToken.find({}).sort({ createdAt: 1 });
  assert.equal(rows.length, 2, 'the old row is kept, marked used');
  assert.ok(rows[0].usedAt, 'the presented token must be marked spent');
  assert.equal(rows[1].usedAt, null);
  assert.equal(rows[0].family, rows[1].family, 'both belong to one session family');
});

test('reusing a spent refresh token revokes the whole session family', async () => {
  await makeAdmin();

  const login = await post('/api/auth/login', { userId: 'admin', password: PASSWORD });
  const stolen = cookieValue(login, 'rv_rt');
  const csrf = cookieValue(login, 'rv_csrf');

  const headers = (token) => ({ Cookie: `rv_rt=${token}; rv_csrf=${csrf}`, 'X-CSRF-Token': csrf });

  // Legitimate rotation.
  const first = await request(app)
    .post('/api/auth/refresh')
    .set('X-Forwarded-For', freshIp())
    .set(headers(stolen));
  assert.equal(first.status, 200);
  const live = cookieValue(first, 'rv_rt');

  // The attacker replays the token they copied earlier.
  const replay = await request(app)
    .post('/api/auth/refresh')
    .set('X-Forwarded-For', freshIp())
    .set(headers(stolen));

  assert.equal(replay.status, 401, 'a spent token must be refused');
  assert.match(replay.body.message, /session expired/i, 'and must not announce the detection');

  // The real user's current token is now dead too: we cannot tell the two
  // parties apart, so the safe response is to end the session.
  const victim = await request(app)
    .post('/api/auth/refresh')
    .set('X-Forwarded-For', freshIp())
    .set(headers(live));
  assert.equal(victim.status, 401, 'the whole family should be revoked');

  const revoked = await RefreshToken.find({ revokedReason: 'reuse_detected' });
  assert.ok(revoked.length >= 1, 'the revocation should be recorded');

  const event = await AuthEvent.findOne({ type: 'refresh.reuse' });
  assert.ok(event, 'token reuse must be audited');
});

test('two concurrent refreshes with the same token: exactly one wins', async () => {
  /**
   * A refresh token is single-use, and that has to hold under concurrency.
   * With a read-then-write rotation, both requests observe `usedAt: null` and
   * both mint a new token in the same family — so an attacker racing the real
   * user gets a working session and reuse detection never fires.
   */
  await makeAdmin();

  const login = await post('/api/auth/login', { userId: 'admin', password: PASSWORD });
  const token = cookieValue(login, 'rv_rt');
  const csrf = cookieValue(login, 'rv_csrf');

  const attempt = () =>
    request(app)
      .post('/api/auth/refresh')
      .set('X-Forwarded-For', freshIp())
      .set('Cookie', `rv_rt=${token}; rv_csrf=${csrf}`)
      .set('X-CSRF-Token', csrf);

  const results = await Promise.all([attempt(), attempt(), attempt()]);
  const winners = results.filter((r) => r.status === 200);

  assert.equal(
    winners.length,
    1,
    `exactly one refresh should succeed, got ${results.map((r) => r.status).join(',')}`
  );

  // The losers were a second use of a single-use token, so the family is dead.
  const live = await RefreshToken.countDocuments({ revokedAt: null, usedAt: null });
  assert.equal(live, 0, 'the race should have been treated as token reuse');
});

test('a refresh token older than the password change is refused', async () => {
  /**
   * Rotation stamps the user's CURRENT tokenVersion onto the new access
   * token, so without this check a surviving refresh token would quietly heal
   * a session that a password change was meant to end. Both callers that bump
   * tokenVersion also revoke refresh tokens, so this is defence in the one
   * place that issues credentials rather than a convention at each call site.
   */
  const user = await makeAdmin();

  const login = await post('/api/auth/login', { userId: 'admin', password: PASSWORD });
  const token = cookieValue(login, 'rv_rt');
  const csrf = cookieValue(login, 'rv_csrf');

  // Move passwordChangedAt forward WITHOUT revoking refresh tokens, which is
  // exactly the state this check exists to catch.
  await User.updateOne({ _id: user._id }, { $set: { passwordChangedAt: new Date(Date.now() + 1000) } });

  const res = await request(app)
    .post('/api/auth/refresh')
    .set('X-Forwarded-For', freshIp())
    .set('Cookie', `rv_rt=${token}; rv_csrf=${csrf}`)
    .set('X-CSRF-Token', csrf);

  assert.equal(res.status, 401, 'a token predating the password change must not rotate');

  const revoked = await RefreshToken.countDocuments({ revokedReason: 'password_changed' });
  assert.ok(revoked >= 1, 'and the family should be revoked');
});

test('a session cannot outlive the absolute lifetime by refreshing', async () => {
  await makeAdmin();

  const login = await post('/api/auth/login', { userId: 'admin', password: PASSWORD });
  const token = cookieValue(login, 'rv_rt');
  const csrf = cookieValue(login, 'rv_csrf');

  const { config } = require('../../src/config/env');

  // Backdate the family's origin past the ceiling. expiresAt is left valid,
  // so only the absolute-lifetime rule can reject this.
  await RefreshToken.updateMany(
    {},
    { $set: { createdAt: new Date(Date.now() - (config.sessionMaxLifetime + 60) * 1000) } },
    { timestamps: false }
  );

  const res = await request(app)
    .post('/api/auth/refresh')
    .set('X-Forwarded-For', freshIp())
    .set('Cookie', `rv_rt=${token}; rv_csrf=${csrf}`)
    .set('X-CSRF-Token', csrf);

  assert.equal(res.status, 401, 'the sliding refresh window must not extend a session forever');
  assert.ok(await RefreshToken.countDocuments({ revokedReason: 'max_lifetime' }));
});

test('a legacy record with an invalid email can still complete a password reset', async () => {
  /**
   * The reset flow used to claim the token and THEN call save(), which runs
   * document-wide validation. A user whose stored email predated the current
   * validator therefore had their link burned by a ValidationError with the
   * password unchanged — and no way to retry, because the token was spent.
   */
  await makeAdmin();

  // Write an email that the current schema validator rejects, bypassing
  // validation the way out-of-band data or an older schema would have.
  await User.collection.updateOne({ userId: 'admin' }, { $set: { email: 'not-an-email' } });

  const { randomToken, hashToken } = require('../../src/lib/tokens');
  const raw = randomToken(32);
  await User.collection.updateOne(
    { userId: 'admin' },
    {
      $set: {
        resetTokenHash: hashToken(raw),
        resetTokenExp: new Date(Date.now() + 600000),
        resetTokenUsedAt: null,
      },
    }
  );

  const NEW_PASSWORD = 'a-legacy-safe-new-passphrase';
  const res = await post('/api/auth/reset', { token: raw, password: NEW_PASSWORD });

  assert.equal(res.status, 200, 'an invalid stored email must not block the reset');
  assert.equal(
    (await post('/api/auth/login', { userId: 'admin', password: NEW_PASSWORD })).status,
    200,
    'and the new password must actually work'
  );
});

test('changing a password clears any pending reset link', async () => {
  const admin = await makeAdmin();
  const login = await post('/api/auth/login', { userId: 'admin', password: PASSWORD });

  // A reset link is in flight...
  const { randomToken, hashToken } = require('../../src/lib/tokens');
  const raw = randomToken(32);
  await User.collection.updateOne(
    { userId: 'admin' },
    {
      $set: {
        resetTokenHash: hashToken(raw),
        resetTokenExp: new Date(Date.now() + 600000),
        resetTokenUsedAt: null,
      },
    }
  );

  // ...and then the password is changed directly.
  await request(app)
    .put(`/api/users/${admin._id}/password`)
    .set('X-Forwarded-For', freshIp())
    .set('Authorization', `Bearer ${login.body.token}`)
    .send({ password: 'a-deliberate-new-passphrase' })
    .expect(200);

  // The old link must not be able to overwrite the new password.
  const res = await post('/api/auth/reset', { token: raw, password: 'an-attacker-chosen-passphrase' });
  assert.equal(res.status, 400, 'a reset link issued before the change must be dead');
});

test('a revoked refresh token cannot be used', async () => {
  await makeAdmin();

  const login = await post('/api/auth/login', { userId: 'admin', password: PASSWORD });
  const token = cookieValue(login, 'rv_rt');
  const csrf = cookieValue(login, 'rv_csrf');

  await RefreshToken.updateMany({}, { $set: { revokedAt: new Date(), revokedReason: 'test' } });

  const res = await request(app)
    .post('/api/auth/refresh')
    .set('X-Forwarded-For', freshIp())
    .set('Cookie', `rv_rt=${token}; rv_csrf=${csrf}`)
    .set('X-CSRF-Token', csrf);

  assert.equal(res.status, 401);
});

test('an expired refresh token cannot be used', async () => {
  await makeAdmin();

  const login = await post('/api/auth/login', { userId: 'admin', password: PASSWORD });
  const token = cookieValue(login, 'rv_rt');
  const csrf = cookieValue(login, 'rv_csrf');

  await RefreshToken.updateMany({}, { $set: { expiresAt: new Date(Date.now() - 1000) } });

  const res = await request(app)
    .post('/api/auth/refresh')
    .set('X-Forwarded-For', freshIp())
    .set('Cookie', `rv_rt=${token}; rv_csrf=${csrf}`)
    .set('X-CSRF-Token', csrf);

  assert.equal(res.status, 401, 'expiry must be checked in code, not left to the TTL sweep');
});

test('logout revokes only the session that was used', async () => {
  const user = await makeAdmin();

  const deviceA = await post('/api/auth/login', { userId: 'admin', password: PASSWORD });
  const deviceB = await post('/api/auth/login', { userId: 'admin', password: PASSWORD });

  const tokenA = cookieValue(deviceA, 'rv_rt');
  const csrfA = cookieValue(deviceA, 'rv_csrf');
  const tokenB = cookieValue(deviceB, 'rv_rt');
  const csrfB = cookieValue(deviceB, 'rv_csrf');

  await request(app)
    .post('/api/auth/logout')
    .set('X-Forwarded-For', freshIp())
    .set('Cookie', `rv_rt=${tokenA}; rv_csrf=${csrfA}`)
    .set('X-CSRF-Token', csrfA)
    .expect(200);

  // Device B is still signed in.
  const stillValid = await request(app)
    .post('/api/auth/refresh')
    .set('X-Forwarded-For', freshIp())
    .set('Cookie', `rv_rt=${tokenB}; rv_csrf=${csrfB}`)
    .set('X-CSRF-Token', csrfB);
  assert.equal(stillValid.status, 200, 'signing out of one device must not sign out the others');

  // Device A is not.
  const dead = await request(app)
    .post('/api/auth/refresh')
    .set('X-Forwarded-For', freshIp())
    .set('Cookie', `rv_rt=${tokenA}; rv_csrf=${csrfA}`)
    .set('X-CSRF-Token', csrfA);
  assert.equal(dead.status, 401);

  assert.ok(await AuthEvent.findOne({ type: 'logout' }));
  assert.ok(user);
});

/* ---------------------------------------------------------- password reset */

test('a reset link works once and only once', async () => {
  await makeAdmin();

  // The real flow emails the raw token and stores only its hash, so a test
  // cannot read it back. Confirm the request did store one...
  await post('/api/auth/forgot', { userId: 'admin' });
  const stored = await User.findOne({ userId: 'admin' }).select('+resetTokenHash +resetTokenExp');
  assert.ok(stored.resetTokenHash, 'a reset token should be stored');
  assert.ok(stored.resetTokenExp > new Date(), 'and it should expire in the future');

  // ...then install a token whose plaintext we know, so the redemption half
  // of the flow can be exercised.
  const { randomToken, hashToken } = require('../../src/lib/tokens');
  const raw = randomToken(32);
  stored.resetTokenHash = hashToken(raw);
  stored.resetTokenExp = new Date(Date.now() + 600000);
  stored.resetTokenUsedAt = null;
  await stored.save({ validateBeforeSave: false });

  const NEW_PASSWORD = 'a-brand-new-good-passphrase';

  const first = await post('/api/auth/reset', { token: raw, password: NEW_PASSWORD });
  assert.equal(first.status, 200);

  const second = await post('/api/auth/reset', { token: raw, password: 'yet-another-passphrase' });
  assert.equal(second.status, 400, 'a reset link must be single-use');

  // The first reset actually took effect.
  assert.equal((await post('/api/auth/login', { userId: 'admin', password: NEW_PASSWORD })).status, 200);
  assert.equal((await post('/api/auth/login', { userId: 'admin', password: PASSWORD })).status, 401);
});

test('concurrent resets with the same token: exactly one wins', async () => {
  await makeAdmin();

  const { randomToken, hashToken } = require('../../src/lib/tokens');
  const raw = randomToken(32);

  await User.updateOne(
    { userId: 'admin' },
    {
      $set: {
        resetTokenHash: hashToken(raw),
        resetTokenExp: new Date(Date.now() + 600000),
        resetTokenUsedAt: null,
      },
    }
  );

  // Fired together: both pass the validity read, only one may claim the token.
  const results = await Promise.all([
    post('/api/auth/reset', { token: raw, password: 'first-new-passphrase-x' }),
    post('/api/auth/reset', { token: raw, password: 'second-new-passphrase-y' }),
  ]);

  const succeeded = results.filter((r) => r.status === 200);
  assert.equal(succeeded.length, 1, `exactly one should win, got ${results.map((r) => r.status).join(',')}`);
});

test('an expired reset token is refused', async () => {
  await makeAdmin();

  const { randomToken, hashToken } = require('../../src/lib/tokens');
  const raw = randomToken(32);

  await User.updateOne(
    { userId: 'admin' },
    {
      $set: {
        resetTokenHash: hashToken(raw),
        resetTokenExp: new Date(Date.now() - 1000),
        resetTokenUsedAt: null,
      },
    }
  );

  const res = await post('/api/auth/reset', { token: raw, password: 'a-new-good-passphrase' });
  assert.equal(res.status, 400);
});

test('a reset ends every existing session', async () => {
  await makeAdmin();

  const login = await post('/api/auth/login', { userId: 'admin', password: PASSWORD });
  const token = cookieValue(login, 'rv_rt');
  const csrf = cookieValue(login, 'rv_csrf');
  const accessToken = login.body.token;

  const { randomToken, hashToken } = require('../../src/lib/tokens');
  const raw = randomToken(32);
  await User.updateOne(
    { userId: 'admin' },
    {
      $set: {
        resetTokenHash: hashToken(raw),
        resetTokenExp: new Date(Date.now() + 600000),
        resetTokenUsedAt: null,
      },
    }
  );

  await post('/api/auth/reset', { token: raw, password: 'a-new-good-passphrase-z' });

  // The old access token is dead (tokenVersion moved on).
  const me = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${accessToken}`);
  assert.equal(me.status, 401, 'an access token issued before the reset must stop working');

  // So is the old refresh token.
  const refreshed = await request(app)
    .post('/api/auth/refresh')
    .set('X-Forwarded-For', freshIp())
    .set('Cookie', `rv_rt=${token}; rv_csrf=${csrf}`)
    .set('X-CSRF-Token', csrf);
  assert.equal(refreshed.status, 401, 'a reset must not leave an intruder signed in');
});

test('forgot-password does not reveal which accounts exist, with a real database', async () => {
  await makeAdmin();

  const exists = await post('/api/auth/forgot', { userId: 'admin' });
  const missing = await post('/api/auth/forgot', { userId: 'nobodyhere' });

  assert.equal(exists.status, missing.status);
  assert.deepEqual(exists.body, missing.body);
});

/* ------------------------------------------------- bcrypt migration, for real */

test('a legacy bcrypt admin signs in and is migrated to Argon2id in the database', async () => {
  const bcrypt = require('bcryptjs');

  // Write a user exactly as the previous version of the app would have.
  await User.collection.insertOne({
    name: 'Legacy',
    userId: 'legacy',
    email: '',
    passwordHash: await bcrypt.hash(PASSWORD, await bcrypt.genSalt(10)),
    role: 'admin',
    tokenVersion: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const res = await post('/api/auth/login', { userId: 'legacy', password: PASSWORD });
  assert.equal(res.status, 200, 'existing admins must still be able to sign in');

  const after = await User.findOne({ userId: 'legacy' }).select('+passwordHash');
  assert.match(after.passwordHash, /^\$argon2id\$/, 'the stored hash should now be Argon2id');
  assert.equal(after.tokenVersion, 0, 'a transparent rehash must not invalidate the new session');

  // And the password still works on the next sign-in.
  assert.equal((await post('/api/auth/login', { userId: 'legacy', password: PASSWORD })).status, 200);
});

/* -------------------------------------------------------------- audit trail */

test('authentication events are recorded without any secrets', async () => {
  await makeAdmin();

  await post('/api/auth/login', { userId: 'admin', password: PASSWORD });
  await post('/api/auth/login', { userId: 'admin', password: WRONG });
  await post('/api/auth/login', { userId: 'ghost', password: WRONG });

  const events = await AuthEvent.find({}).lean();
  assert.ok(events.length >= 3, 'logins and failures should be recorded');

  assert.ok(events.some((e) => e.type === 'login.success'));
  assert.ok(events.some((e) => e.type === 'login.failure'));

  const serialised = JSON.stringify(events);
  assert.ok(!serialised.includes(PASSWORD), 'the password must never be logged');
  assert.ok(!serialised.includes(WRONG), 'nor a wrong password attempt');
  assert.ok(!/\$argon2/.test(serialised), 'nor a password hash');

  // A failure against an unknown account is still attributable.
  const ghost = events.find((e) => e.userIdAttempted === 'ghost');
  assert.ok(ghost, 'an attempt on a non-existent account should still be recorded');
});

test('the audit trail distinguishes failure reasons server-side only', async () => {
  await makeAdmin();

  await post('/api/auth/login', { userId: 'admin', password: WRONG });
  await post('/api/auth/login', { userId: 'ghost', password: WRONG });

  const events = await AuthEvent.find({ type: 'login.failure' }).lean();
  const reasons = events.map((e) => e.meta?.reason);

  assert.ok(reasons.includes('bad_password'), 'operators need to tell these apart');
  assert.ok(reasons.includes('no_such_user'));
});

test('rejected operator injection is audited', async () => {
  await makeAdmin();

  await post('/api/services', { title: 'x', $where: 'sleep(1000)' });

  const event = await AuthEvent.findOne({ type: 'input.rejected' });
  assert.ok(event, 'an injection attempt should be recorded');
  assert.ok(event.meta.keys.includes('$where'));
});

/* ------------------------------------------------------ admin user management */

test('an admin cannot escalate a new user’s role through the API', async () => {
  await makeAdmin();

  const login = await post('/api/auth/login', { userId: 'admin', password: PASSWORD });
  const token = login.body.token;

  const res = await request(app)
    .post('/api/users')
    .set('X-Forwarded-For', freshIp())
    .set('Authorization', `Bearer ${token}`)
    .send({ userId: 'second', password: 'another-good-passphrase', role: 'superadmin' });

  assert.equal(res.status, 400, 'the strict schema should refuse the role field');
  assert.equal(await User.countDocuments({ userId: 'second' }), 0);
});

test('a weak password is refused when creating an admin', async () => {
  await makeAdmin();
  const login = await post('/api/auth/login', { userId: 'admin', password: PASSWORD });

  for (const password of ['short', 'password1234', 'admin@12345']) {
    // eslint-disable-next-line no-await-in-loop
    const res = await request(app)
      .post('/api/users')
      .set('X-Forwarded-For', freshIp())
      .set('Authorization', `Bearer ${login.body.token}`)
      .send({ userId: 'second', password });

    assert.equal(res.status, 400, `"${password}" should be refused`);
  }
});

test('changing a user’s password signs them out everywhere', async () => {
  const admin = await makeAdmin();
  const other = new User({ name: 'Other', userId: 'other', password: 'other-good-passphrase' });
  await other.save();

  // "other" signs in on two devices.
  const sessionA = await post('/api/auth/login', { userId: 'other', password: 'other-good-passphrase' });
  assert.equal(sessionA.status, 200);
  const otherAccessToken = sessionA.body.token;

  // The admin resets their password.
  const adminLogin = await post('/api/auth/login', { userId: 'admin', password: PASSWORD });
  const res = await request(app)
    .put(`/api/users/${other._id}/password`)
    .set('X-Forwarded-For', freshIp())
    .set('Authorization', `Bearer ${adminLogin.body.token}`)
    .send({ password: 'a-replacement-good-passphrase' });

  assert.equal(res.status, 200);

  // "other"'s existing session is dead.
  const me = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${otherAccessToken}`);
  assert.equal(me.status, 401);

  const live = await RefreshToken.countDocuments({ user: other._id, revokedAt: null });
  assert.equal(live, 0, 'their refresh tokens should be revoked too');

  assert.ok(admin);
});

test('deleting a user revokes their sessions', async () => {
  await makeAdmin();
  const doomed = new User({ name: 'Doomed', userId: 'doomed', password: 'doomed-good-passphrase' });
  await doomed.save();

  const theirLogin = await post('/api/auth/login', { userId: 'doomed', password: 'doomed-good-passphrase' });
  const theirToken = theirLogin.body.token;

  const adminLogin = await post('/api/auth/login', { userId: 'admin', password: PASSWORD });
  await request(app)
    .delete(`/api/users/${doomed._id}`)
    .set('X-Forwarded-For', freshIp())
    .set('Authorization', `Bearer ${adminLogin.body.token}`)
    .expect(200);

  const me = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${theirToken}`);
  assert.equal(me.status, 401, 'a deleted user must not keep working until their token expires');

  assert.equal(await RefreshToken.countDocuments({ user: doomed._id, revokedAt: null }), 0);
});

test('the last admin cannot be deleted, and nobody can delete themselves', async () => {
  const admin = await makeAdmin();
  const login = await post('/api/auth/login', { userId: 'admin', password: PASSWORD });

  const self = await request(app)
    .delete(`/api/users/${admin._id}`)
    .set('X-Forwarded-For', freshIp())
    .set('Authorization', `Bearer ${login.body.token}`);

  assert.equal(self.status, 400);
  assert.equal(await User.countDocuments(), 1);
});

/* ---------------------------------------------- NoSQL injection, end to end */

test('operator injection cannot authenticate against a real database', async () => {
  await makeAdmin();

  const payloads = [
    { userId: { $ne: null }, password: { $ne: null } },
    { userId: { $gt: '' }, password: { $gt: '' } },
    { userId: { $regex: '^adm' }, password: PASSWORD },
    { userId: 'admin', password: { $ne: null } },
  ];

  for (const body of payloads) {
    // eslint-disable-next-line no-await-in-loop
    const res = await post('/api/auth/login', body);
    assert.ok(res.status === 400 || res.status === 401, `got ${res.status}`);
    assert.equal(res.body.token, undefined, `${JSON.stringify(body)} must not authenticate`);
  }
});

test('TTL indexes exist on the refresh-token and audit collections', async () => {
  const refreshIndexes = await RefreshToken.collection.indexes();
  const auditIndexes = await AuthEvent.collection.indexes();

  assert.ok(
    refreshIndexes.some((i) => i.expireAfterSeconds !== undefined),
    'expired refresh tokens should be swept automatically'
  );
  assert.ok(
    auditIndexes.some((i) => i.expireAfterSeconds !== undefined),
    'the audit trail should not grow without bound'
  );

  assert.ok(mongoose.connection.readyState === 1);
});
