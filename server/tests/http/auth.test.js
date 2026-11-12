/**
 * Authentication flows over real HTTP.
 *
 * The data layer is mocked (there is no MongoDB in this tier of the suite),
 * but everything above it is the real thing: Express, the middleware chain,
 * rate limiting, schema validation, the controllers, cookie serialisation and
 * the error handler. Database-level guarantees — unique indexes, TTL expiry,
 * reuse detection across documents — are covered by tests/integration.
 */
const { request, app, fakeQuery, fakeUser } = require('../helpers/http');

const test = require('node:test');
const assert = require('node:assert/strict');
const { mock } = require('node:test');

const User = require('../../src/models/User');
const RefreshToken = require('../../src/models/RefreshToken');
const AuthEvent = require('../../src/models/AuthEvent');
const { hashPassword } = require('../../src/lib/passwords');
const { signAccessToken, hashToken } = require('../../src/lib/tokens');

const GOOD_PASSWORD = 'a-perfectly-good-passphrase';

/** Unique client IP per test, so rate-limit buckets never collide. */
let ipCounter = 0;
function freshIp() {
  ipCounter += 1;
  return `198.51.100.${ipCounter % 250}:${ipCounter}`.split(':')[0] === '198.51.100.0'
    ? `198.51.100.1`
    : `198.51.100.${(ipCounter % 250) + 1}`;
}

function post(path, body, ip = freshIp()) {
  return request(app()).post(path).set('X-Forwarded-For', ip).send(body);
}

/** Silences the audit trail and the session writes. */
function stubWrites() {
  mock.method(AuthEvent, 'create', async () => ({}));
  mock.method(RefreshToken, 'create', async () => ({}));
  mock.method(RefreshToken, 'updateMany', async () => ({}));
  mock.method(RefreshToken, 'updateOne', async () => ({}));
}

test.beforeEach(() => {
  stubWrites();
});

test.afterEach(() => {
  mock.restoreAll();
});

/* ------------------------------------------------------------- happy path */

test('a correct password returns an access token and sets an HttpOnly refresh cookie', async () => {
  const hash = await hashPassword(GOOD_PASSWORD);
  const user = fakeUser({
    passwordHash: hash,
    checkPassword: async (p) => require('../../src/lib/passwords').verifyPassword(p, hash),
  });
  mock.method(User, 'findOne', () => fakeQuery(user));

  const res = await post('/api/auth/login', { userId: 'admin', password: GOOD_PASSWORD });

  assert.equal(res.status, 200);
  assert.ok(res.body.token, 'an access token should be returned');
  assert.ok(res.body.csrfToken, 'a CSRF token should be returned');
  assert.equal(res.body.user.userId, 'admin');
  assert.equal(res.body.user.role, 'admin');

  // Nothing secret in the body.
  const body = JSON.stringify(res.body);
  assert.ok(!body.includes(GOOD_PASSWORD), 'the password must not be echoed');
  assert.ok(!body.includes(hash), 'the hash must never be sent to a client');
  assert.equal(res.body.user.passwordHash, undefined);

  // The refresh cookie must be HttpOnly and scoped.
  const cookies = res.headers['set-cookie'] || [];
  const refresh = cookies.find((c) => c.startsWith('rv_rt='));
  assert.ok(refresh, 'a refresh cookie should be set');
  assert.match(refresh, /HttpOnly/i, 'the refresh cookie must be HttpOnly');
  assert.match(refresh, /SameSite=Lax/i);
  assert.match(refresh, /Path=\/api\/auth/i);

  // The CSRF cookie is readable by design.
  const csrf = cookies.find((c) => c.startsWith('rv_csrf='));
  assert.ok(csrf, 'a CSRF cookie should be set');
  assert.ok(!/HttpOnly/i.test(csrf), 'the CSRF cookie must be readable by the page');
});

test('the access token is short-lived', async () => {
  const hash = await hashPassword(GOOD_PASSWORD);
  mock.method(User, 'findOne', () =>
    fakeQuery(
      fakeUser({
        passwordHash: hash,
        checkPassword: async (p) => require('../../src/lib/passwords').verifyPassword(p, hash),
      })
    )
  );

  const res = await post('/api/auth/login', { userId: 'admin', password: GOOD_PASSWORD });
  assert.ok(res.body.expiresIn <= 3600, `expiresIn was ${res.body.expiresIn}`);
});

/* --------------------------------------------------------- generic failures */

test('a wrong password is rejected with the generic message', async () => {
  const hash = await hashPassword(GOOD_PASSWORD);
  mock.method(User, 'findOne', () =>
    fakeQuery(
      fakeUser({
        passwordHash: hash,
        checkPassword: async (p) => require('../../src/lib/passwords').verifyPassword(p, hash),
      })
    )
  );

  const res = await post('/api/auth/login', { userId: 'admin', password: 'wrong-but-long-enough' });

  assert.equal(res.status, 401);
  assert.equal(res.body.message, 'Invalid user ID or password');
  assert.equal(res.body.token, undefined);
  assert.equal(res.headers['set-cookie'], undefined, 'no session cookie on a failed login');
});

test('an unknown account gets a byte-identical response to a wrong password', async () => {
  const hash = await hashPassword(GOOD_PASSWORD);

  mock.method(User, 'findOne', () =>
    fakeQuery(
      fakeUser({
        passwordHash: hash,
        checkPassword: async (p) => require('../../src/lib/passwords').verifyPassword(p, hash),
      })
    )
  );
  const wrongPassword = await post('/api/auth/login', { userId: 'admin', password: 'wrong-but-long-enough' });

  mock.restoreAll();
  stubWrites();
  mock.method(User, 'findOne', () => fakeQuery(null));
  const noSuchUser = await post('/api/auth/login', { userId: 'nobody', password: 'wrong-but-long-enough' });

  assert.equal(noSuchUser.status, wrongPassword.status, 'same status code');
  assert.deepEqual(noSuchUser.body, wrongPassword.body, 'same body — no account enumeration');
});

test('the login response does not hint at account existence in any field', async () => {
  mock.method(User, 'findOne', () => fakeQuery(null));

  const res = await post('/api/auth/login', { userId: 'ghost', password: 'wrong-but-long-enough' });
  const serialised = JSON.stringify(res.body).toLowerCase();

  for (const tell of ['not found', 'no such', 'does not exist', 'unknown user', 'user gone', 'wrong password', 'incorrect password']) {
    assert.ok(!serialised.includes(tell), `response must not say "${tell}"`);
  }
});

test('an unknown account still costs real hashing time (timing equalisation)', async () => {
  mock.method(User, 'findOne', () => fakeQuery(null));

  const start = process.hrtime.bigint();
  await post('/api/auth/login', { userId: 'ghost', password: 'wrong-but-long-enough' });
  const ms = Number(process.hrtime.bigint() - start) / 1e6;

  // Argon2 at test parameters is fast but not free. A no-op path would return
  // in well under a millisecond.
  assert.ok(ms > 1, `expected the dummy verification to cost time, took ${ms.toFixed(2)}ms`);
});

/* ---------------------------------------------- server-side validation */

test('server-side validation cannot be bypassed by posting directly', async () => {
  mock.method(User, 'findOne', () => fakeQuery(null));

  // Every one of these is blocked in the browser, and must also be blocked here.
  const cases = [
    [{}, 'no fields at all'],
    [{ userId: 'admin' }, 'password missing'],
    [{ password: GOOD_PASSWORD }, 'user id missing'],
    [{ userId: '', password: '' }, 'empty strings'],
    [{ userId: 'ab', password: GOOD_PASSWORD }, 'user id too short'],
    [{ userId: 'has space', password: GOOD_PASSWORD }, 'illegal characters'],
    [{ userId: 'a'.repeat(200), password: GOOD_PASSWORD }, 'user id too long'],
    [{ userId: 'admin', password: 'x'.repeat(500) }, 'password too long'],
  ];

  for (const [body, label] of cases) {
    // eslint-disable-next-line no-await-in-loop
    const res = await post('/api/auth/login', body);
    assert.equal(res.status, 400, `${label} should be a 400, got ${res.status}`);
    assert.ok(res.body.errors || res.body.message, `${label} should explain the problem`);
    assert.equal(res.body.token, undefined, `${label} must not return a token`);
  }
});

test('a request with no body at all is a 400, not a crash', async () => {
  const res = await request(app())
    .post('/api/auth/login')
    .set('X-Forwarded-For', freshIp());

  assert.equal(res.status, 400);
});

/* ------------------------------------------------------- NoSQL injection */

test('operator injection in the login body is refused', async () => {
  // If any of these reached Mongoose, findOne would match the first user.
  let queried = false;
  mock.method(User, 'findOne', () => {
    queried = true;
    return fakeQuery(fakeUser());
  });

  const payloads = [
    { userId: { $ne: null }, password: { $ne: null } },
    { userId: { $gt: '' }, password: GOOD_PASSWORD },
    { userId: { $regex: '^adm' }, password: GOOD_PASSWORD },
    { userId: 'admin', password: { $ne: null } },
    { userId: ['admin'], password: GOOD_PASSWORD },
  ];

  for (const body of payloads) {
    // eslint-disable-next-line no-await-in-loop
    const res = await post('/api/auth/login', body);
    assert.equal(res.status, 400, `${JSON.stringify(body)} should be rejected`);
    assert.equal(res.body.token, undefined);
  }

  assert.equal(queried, false, 'no injection payload should ever reach the database layer');
});

test('extra fields cannot be smuggled into the login body', async () => {
  mock.method(User, 'findOne', () => fakeQuery(fakeUser()));

  const res = await post('/api/auth/login', {
    userId: 'admin',
    password: GOOD_PASSWORD,
    role: 'superadmin',
    tokenVersion: 999,
  });

  assert.equal(res.status, 400, 'a strict schema should refuse unknown keys');
});

/* ---------------------------------------------------------- rate limiting */

test('repeated failures from one IP eventually return 429', async () => {
  mock.method(User, 'findOne', () => fakeQuery(null));

  const ip = '203.0.113.77';
  const statuses = [];

  for (let i = 0; i < 25; i += 1) {
    // eslint-disable-next-line no-await-in-loop
    const res = await post('/api/auth/login', { userId: 'victim', password: 'wrong-but-long-enough' }, ip);
    statuses.push(res.status);
    if (res.status === 429) {
      assert.ok(res.headers['retry-after'], 'a 429 must carry Retry-After');
      assert.ok(res.body.retryAfter > 0);
      break;
    }
  }

  assert.ok(statuses.includes(429), `expected a 429 within 25 attempts, saw ${statuses.join(',')}`);
});

test('a 429 reveals nothing about the account', async () => {
  mock.method(User, 'findOne', () => fakeQuery(null));

  const ip = '203.0.113.78';
  let limited = null;

  for (let i = 0; i < 30; i += 1) {
    // eslint-disable-next-line no-await-in-loop
    const res = await post('/api/auth/login', { userId: 'victim', password: 'wrong-but-long-enough' }, ip);
    if (res.status === 429) {
      limited = res;
      break;
    }
  }

  assert.ok(limited, 'should have been limited');
  const body = JSON.stringify(limited.body).toLowerCase();
  assert.ok(!body.includes('victim'), 'must not echo the attempted user id');
  assert.ok(!/exists|no such|unknown/.test(body));
});

/* ---------------------------------------------------- protected endpoints */

test('/api/auth/me requires a token', async () => {
  const res = await request(app()).get('/api/auth/me');
  assert.equal(res.status, 401);
  assert.equal(res.body.message, 'Not signed in');
});

test('/api/auth/me rejects forged, malformed and expired tokens identically', async () => {
  mock.method(User, 'findById', () => fakeQuery(fakeUser()));

  const jwt = require('jsonwebtoken');
  const forged = jwt.sign({ sub: '507f1f77bcf86cd799439011', typ: 'access', ver: 0 }, 'wrong-secret');

  const bad = ['', 'garbage', 'a.b.c', forged];
  const bodies = [];

  for (const token of bad) {
    // eslint-disable-next-line no-await-in-loop
    const res = await request(app()).get('/api/auth/me').set('Authorization', `Bearer ${token}`);
    assert.equal(res.status, 401, `token "${token.slice(0, 12)}" should be refused`);
    bodies.push(JSON.stringify(res.body));
  }

  assert.equal(new Set(bodies).size, 1, 'every rejection must look the same');
});

test('a token issued before a password change is refused', async () => {
  // The user's tokenVersion has moved on; the token still claims the old one.
  const user = fakeUser({ tokenVersion: 5 });
  const staleToken = signAccessToken({ ...user, tokenVersion: 4 });

  mock.method(User, 'findById', () => fakeQuery(user));

  const res = await request(app()).get('/api/auth/me').set('Authorization', `Bearer ${staleToken}`);
  assert.equal(res.status, 401, 'a password change must invalidate existing access tokens');
});

test('a valid token is accepted and returns only safe fields', async () => {
  const user = fakeUser({ tokenVersion: 2 });
  mock.method(User, 'findById', () => fakeQuery(user));

  const res = await request(app())
    .get('/api/auth/me')
    .set('Authorization', `Bearer ${signAccessToken(user)}`);

  assert.equal(res.status, 200);
  assert.deepEqual(Object.keys(res.body.user).sort(), ['_id', 'email', 'name', 'role', 'userId']);
});

test('a deleted user’s token stops working immediately', async () => {
  const user = fakeUser();
  const token = signAccessToken(user);

  mock.method(User, 'findById', () => fakeQuery(null)); // deleted

  const res = await request(app()).get('/api/auth/me').set('Authorization', `Bearer ${token}`);
  assert.equal(res.status, 401);
});

test('admin endpoints are unreachable without a token', async () => {
  const guarded = [
    ['get', '/api/users'],
    ['post', '/api/users'],
    ['get', '/api/contact'],
    ['get', '/api/applications'],
    ['post', '/api/services'],
    ['put', '/api/site'],
    ['post', '/api/upload'],
  ];

  for (const [method, path] of guarded) {
    // eslint-disable-next-line no-await-in-loop
    const res = await request(app())[method](path).set('X-Forwarded-For', freshIp()).send({});
    assert.equal(res.status, 401, `${method.toUpperCase()} ${path} should require auth`);
  }
});

/* ------------------------------------------------------------------ forgot */

test('forgot-password answers identically whether or not the account exists', async () => {
  mock.method(User, 'findOne', () => fakeQuery(null));
  const missing = await post('/api/auth/forgot', { userId: 'nobody' });

  mock.restoreAll();
  stubWrites();
  mock.method(User, 'findOne', () =>
    fakeQuery(fakeUser({ save: async () => {}, email: 'admin@rvmaitech.com' }))
  );
  const exists = await post('/api/auth/forgot', { userId: 'admin' });

  assert.equal(missing.status, 200);
  assert.equal(exists.status, 200);
  assert.deepEqual(missing.body, exists.body, 'no account enumeration via the reset form');
});

test('forgot-password never returns the reset token', async () => {
  let saved = null;
  mock.method(User, 'findOne', () =>
    fakeQuery(
      fakeUser({
        email: 'admin@rvmaitech.com',
        save: async function save() {
          saved = this.resetTokenHash;
        },
      })
    )
  );

  const res = await post('/api/auth/forgot', { userId: 'admin' });
  const body = JSON.stringify(res.body);

  assert.ok(saved, 'a reset token hash should have been stored');
  assert.ok(!body.includes(saved), 'the stored hash must not be returned');

  // The generic message legitimately contains the words "reset link"; what it
  // must not contain is an actual URL, query string or token value.
  assert.ok(!/https?:\/\//i.test(body), `the response must not carry a URL: ${body}`);
  assert.ok(!/[?&]token=/i.test(body), `the response must not carry a token: ${body}`);
  assert.ok(!/[A-Za-z0-9_-]{30,}/.test(body), `the response must not carry a secret: ${body}`);
});

test('the stored reset value is a hash, not the token itself', async () => {
  let stored = null;
  let expiry = null;
  mock.method(User, 'findOne', () =>
    fakeQuery(
      fakeUser({
        email: 'admin@rvmaitech.com',
        save: async function save() {
          stored = this.resetTokenHash;
          expiry = this.resetTokenExp;
        },
      })
    )
  );

  await post('/api/auth/forgot', { userId: 'admin' });

  assert.match(stored, /^[a-f0-9]{64}$/, 'should be a SHA-256 hex digest');
  assert.ok(expiry instanceof Date && expiry > new Date(), 'and it must expire');
  assert.ok(expiry - Date.now() <= 60 * 60 * 1000, 'within an hour');
});

/* ------------------------------------------------------------------- reset */

test('a reset with an unknown token is refused generically', async () => {
  mock.method(User, 'findOne', () => fakeQuery(null));

  const res = await post('/api/auth/reset', { token: 'A'.repeat(43), password: GOOD_PASSWORD });

  assert.equal(res.status, 400);
  assert.match(res.body.message, /invalid or has expired/i);
});

test('an expired reset token is refused with the same message as an unknown one', async () => {
  mock.method(User, 'findOne', () => fakeQuery(null));
  const unknown = await post('/api/auth/reset', { token: 'A'.repeat(43), password: GOOD_PASSWORD });

  mock.restoreAll();
  stubWrites();
  mock.method(User, 'findOne', () =>
    fakeQuery(
      fakeUser({
        resetTokenHash: hashToken('B'.repeat(43)),
        resetTokenExp: new Date(Date.now() - 1000), // expired
        resetTokenUsedAt: null,
      })
    )
  );
  const expired = await post('/api/auth/reset', { token: 'B'.repeat(43), password: GOOD_PASSWORD });

  assert.equal(expired.status, 400);
  assert.equal(expired.body.message, unknown.body.message, 'same message for both');
});

test('an already-used reset token is refused', async () => {
  mock.method(User, 'findOne', () =>
    fakeQuery(
      fakeUser({
        resetTokenHash: hashToken('C'.repeat(43)),
        resetTokenExp: new Date(Date.now() + 60000),
        resetTokenUsedAt: new Date(), // already spent
      })
    )
  );

  const res = await post('/api/auth/reset', { token: 'C'.repeat(43), password: GOOD_PASSWORD });
  assert.equal(res.status, 400);
  assert.match(res.body.message, /invalid or has expired/i);
});

test('reset enforces the password policy server-side', async () => {
  mock.method(User, 'findOne', () =>
    fakeQuery(
      fakeUser({
        resetTokenHash: hashToken('D'.repeat(43)),
        resetTokenExp: new Date(Date.now() + 60000),
        resetTokenUsedAt: null,
      })
    )
  );

  // Too short: rejected by the schema.
  const short = await post('/api/auth/reset', { token: 'D'.repeat(43), password: 'short' });
  assert.equal(short.status, 400);

  // Long enough but a known-common password: rejected by the policy.
  const common = await post('/api/auth/reset', { token: 'D'.repeat(43), password: 'password1234' });
  assert.equal(common.status, 400);
  assert.match(common.body.message, /too common/i);
});

test('a weak password at reset does not consume the token', async () => {
  let claimAttempted = false;
  mock.method(User, 'findOne', () =>
    fakeQuery(
      fakeUser({
        resetTokenHash: hashToken('E'.repeat(43)),
        resetTokenExp: new Date(Date.now() + 60000),
        resetTokenUsedAt: null,
      })
    )
  );
  mock.method(User, 'applyNewPassword', async () => {
    claimAttempted = true;
    return null;
  });

  await post('/api/auth/reset', { token: 'E'.repeat(43), password: 'password1234' });

  assert.equal(claimAttempted, false, 'the token must not be spent on a rejected password');
});

test('reset claims the token and sets the password in ONE write', async () => {
  /**
   * These were two steps once: claim, then `doc.save()`. Because a full save
   * runs document-wide validation, a user whose stored email predated the
   * current validator had their link burned by a ValidationError while their
   * password stayed unchanged — an unrecoverable reset, since the token was
   * already spent. The write must be indivisible.
   */
  const user = fakeUser({
    resetTokenHash: hashToken('F'.repeat(43)),
    resetTokenExp: new Date(Date.now() + 60000),
    resetTokenUsedAt: null,
    // Exactly the legacy record that used to break: invalid under the
    // current email validator.
    email: 'not-a-valid-email',
    save: async () => {
      throw new Error('save() must not be used on the reset path');
    },
  });

  mock.method(User, 'findOne', () => fakeQuery(user));

  let filter = null;
  let extraSet = null;
  mock.method(User, 'applyNewPassword', async (f, _plain, extra) => {
    filter = f;
    extraSet = extra;
    return user;
  });

  const res = await post('/api/auth/reset', {
    token: 'F'.repeat(43),
    password: 'a-perfectly-good-passphrase',
  });

  assert.equal(res.status, 200, 'a legacy record must not block its own password reset');

  // The claim conditions must be inside the same write.
  assert.equal(filter.resetTokenUsedAt, null, 'single-use must be enforced in the filter');
  assert.ok(filter.resetTokenExp?.$gt instanceof Date, 'expiry must be enforced in the filter');
  assert.ok(filter.resetTokenHash, 'the token hash must be matched in the filter');
  assert.ok(extraSet.resetTokenUsedAt instanceof Date, 'the token must be marked spent');
});

test('losing the reset claim race is a generic 400', async () => {
  mock.method(User, 'findOne', () =>
    fakeQuery(
      fakeUser({
        resetTokenHash: hashToken('G'.repeat(43)),
        resetTokenExp: new Date(Date.now() + 60000),
        resetTokenUsedAt: null,
      })
    )
  );
  mock.method(User, 'applyNewPassword', async () => null); // someone else claimed it

  const res = await post('/api/auth/reset', {
    token: 'G'.repeat(43),
    password: 'a-perfectly-good-passphrase',
  });

  assert.equal(res.status, 400);
  assert.match(res.body.message, /invalid or has expired/i);
});

/* ------------------------------------------------------------------ CSRF */

test('refresh without a cookie is a 401, not a 403', async () => {
  const res = await post('/api/auth/refresh', {});
  assert.equal(res.status, 401, 'no session to protect yet');
});

test('refresh with a cookie but no CSRF header is blocked', async () => {
  const res = await request(app())
    .post('/api/auth/refresh')
    .set('X-Forwarded-For', freshIp())
    .set('Cookie', 'rv_rt=some-token; rv_csrf=abc123');

  assert.equal(res.status, 403);
  assert.match(res.body.message, /blocked/i);
});

test('a session cookie with a falsy JSON CSRF cookie is blocked, not waved through', async () => {
  /**
   * cookie-parser always runs JSONCookies, so `rv_csrf=j:0` arrives in
   * req.cookies as the number 0 — falsy and not a string. An earlier version
   * guarded with `if (!cookieValue) return next()`, so these slipped straight
   * past the CSRF check while a session cookie was still attached.
   */
  mock.method(RefreshToken, 'findOneAndUpdate', () => fakeQuery(null));
  mock.method(RefreshToken, 'findOne', () => fakeQuery(null));

  for (const csrf of ['j:0', 'j:null', 'j:false', 'j:{}', 'j:[]']) {
    // eslint-disable-next-line no-await-in-loop
    const res = await request(app())
      .post('/api/auth/refresh')
      .set('X-Forwarded-For', freshIp())
      .set('Cookie', `rv_rt=some-token; rv_csrf=${csrf}`)
      .set('X-CSRF-Token', '0');

    assert.equal(res.status, 403, `rv_csrf=${csrf} must be refused`);
  }
});

test('a session cookie with no CSRF cookie at all is blocked', async () => {
  const res = await request(app())
    .post('/api/auth/refresh')
    .set('X-Forwarded-For', freshIp())
    .set('Cookie', 'rv_rt=some-token');

  assert.equal(res.status, 403, 'a missing CSRF cookie must fail closed, not open');
});

test('refresh with a mismatched CSRF header is blocked', async () => {
  const res = await request(app())
    .post('/api/auth/refresh')
    .set('X-Forwarded-For', freshIp())
    .set('Cookie', 'rv_rt=some-token; rv_csrf=abc123')
    .set('X-CSRF-Token', 'def456');

  assert.equal(res.status, 403);
});

test('refresh with a matching CSRF header gets past CSRF to the token check', async () => {
  // Rotation claims the token atomically first, then classifies a failed
  // claim; an unknown token means both return nothing.
  mock.method(RefreshToken, 'findOneAndUpdate', () => fakeQuery(null));
  mock.method(RefreshToken, 'findOne', () => fakeQuery(null));

  const res = await request(app())
    .post('/api/auth/refresh')
    .set('X-Forwarded-For', freshIp())
    .set('Cookie', 'rv_rt=some-token; rv_csrf=abc123')
    .set('X-CSRF-Token', 'abc123');

  assert.equal(res.status, 401, 'CSRF passed; the refresh token itself is invalid');
  assert.match(res.body.message, /session expired/i);
});

test('logout clears both cookies and always succeeds', async () => {
  const res = await request(app())
    .post('/api/auth/logout')
    .set('X-Forwarded-For', freshIp())
    .set('Cookie', 'rv_rt=some-token; rv_csrf=abc123')
    .set('X-CSRF-Token', 'abc123');

  assert.equal(res.status, 200);

  const cookies = (res.headers['set-cookie'] || []).join(';');
  assert.match(cookies, /rv_rt=;/, 'the refresh cookie should be cleared');
  assert.match(cookies, /rv_csrf=;/, 'the CSRF cookie should be cleared');
});

/* ------------------------------------------------- bcrypt migration path */

test('an admin with a legacy bcrypt hash can sign in, and the hash is upgraded', async () => {
  const bcrypt = require('bcryptjs');
  const legacyHash = await bcrypt.hash(GOOD_PASSWORD, await bcrypt.genSalt(10));

  let upgradedTo = null;
  const user = fakeUser({
    passwordHash: legacyHash,
    checkPassword: async (p) => require('../../src/lib/passwords').verifyPassword(p, legacyHash),
    upgradeHash: async (plain) => {
      upgradedTo = await hashPassword(plain);
    },
  });
  mock.method(User, 'findOne', () => fakeQuery(user));

  const res = await post('/api/auth/login', { userId: 'admin', password: GOOD_PASSWORD });

  assert.equal(res.status, 200, 'existing admins must not be locked out by the migration');
  assert.ok(res.body.token);
  assert.ok(upgradedTo, 'the hash should have been upgraded during login');
  assert.match(upgradedTo, /^\$argon2id\$/);
});
