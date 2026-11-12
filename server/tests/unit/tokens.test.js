require('../helpers/env');

const test = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');

const {
  signAccessToken,
  verifyAccessToken,
  bearerFrom,
  randomToken,
  hashToken,
  safeEqual,
  refreshCookieOptions,
  csrfCookieOptions,
  ISSUER,
  AUDIENCE,
} = require('../../src/lib/tokens');
const { config } = require('../../src/config/env');

const user = { _id: '507f1f77bcf86cd799439011', role: 'admin', tokenVersion: 3 };

test('an access token round-trips and carries the expected claims', () => {
  const payload = verifyAccessToken(signAccessToken(user));

  assert.equal(payload.sub, String(user._id));
  assert.equal(payload.role, 'admin');
  assert.equal(payload.ver, 3);
  assert.equal(payload.typ, 'access');
  assert.equal(payload.iss, ISSUER);
  assert.equal(payload.aud, AUDIENCE);
});

test('access tokens are short-lived', () => {
  const { iat, exp } = verifyAccessToken(signAccessToken(user));
  const ttl = exp - iat;

  assert.equal(ttl, config.accessTokenTtl);
  assert.ok(ttl <= 3600, 'an access token must not live longer than an hour');
});

test('a token signed with another secret is rejected', () => {
  const forged = jwt.sign({ sub: user._id, typ: 'access', ver: 3 }, 'some-other-secret-entirely', {
    issuer: ISSUER,
    audience: AUDIENCE,
  });
  assert.equal(verifyAccessToken(forged), null);
});

test('an unsigned (alg=none) token is rejected', () => {
  // The classic JWT bypass: strip the signature and set the algorithm to none.
  const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(
    JSON.stringify({ sub: user._id, typ: 'access', ver: 3, iss: ISSUER, aud: AUDIENCE })
  ).toString('base64url');

  assert.equal(verifyAccessToken(`${header}.${body}.`), null);
});

test('an expired token is rejected', () => {
  const expired = jwt.sign({ sub: user._id, typ: 'access', ver: 3 }, config.jwtSecret, {
    issuer: ISSUER,
    audience: AUDIENCE,
    expiresIn: -10,
  });
  assert.equal(verifyAccessToken(expired), null);
});

test('a token of another type cannot be replayed as an access token', () => {
  // Same secret, same issuer, wrong purpose.
  const other = jwt.sign({ sub: user._id, typ: 'refresh', ver: 3 }, config.jwtSecret, {
    issuer: ISSUER,
    audience: AUDIENCE,
    expiresIn: 600,
  });
  assert.equal(verifyAccessToken(other), null);

  const noTyp = jwt.sign({ sub: user._id, ver: 3 }, config.jwtSecret, {
    issuer: ISSUER,
    audience: AUDIENCE,
    expiresIn: 600,
  });
  assert.equal(verifyAccessToken(noTyp), null, 'a legacy token with no typ claim must not pass');
});

test('a token minted for a different audience or issuer is rejected', () => {
  const wrongAud = jwt.sign({ sub: user._id, typ: 'access', ver: 3 }, config.jwtSecret, {
    issuer: ISSUER,
    audience: 'somebody-else',
    expiresIn: 600,
  });
  assert.equal(verifyAccessToken(wrongAud), null);
});

test('garbage input is rejected without throwing', () => {
  for (const bad of ['', 'not.a.token', 'a.b.c', null, undefined, '....', 'Bearer x']) {
    assert.equal(verifyAccessToken(bad), null);
  }
});

test('bearerFrom reads only a well-formed Authorization header', () => {
  assert.equal(bearerFrom({ headers: { authorization: 'Bearer abc123' } }), 'abc123');
  assert.equal(bearerFrom({ headers: { authorization: 'bearer abc123' } }), null, 'case-sensitive');
  assert.equal(bearerFrom({ headers: { authorization: 'Basic abc123' } }), null);
  assert.equal(bearerFrom({ headers: { authorization: 'Bearer ' } }), null);
  assert.equal(bearerFrom({ headers: {} }), null);
  assert.equal(bearerFrom({}), null);
});

/* ------------------------------------------------------------ opaque tokens */

test('random tokens have 256 bits of entropy and do not repeat', () => {
  const seen = new Set();
  for (let i = 0; i < 500; i += 1) {
    const t = randomToken(32);
    assert.ok(t.length >= 42, 'base64url of 32 bytes should be ~43 chars');
    assert.match(t, /^[A-Za-z0-9_-]+$/, 'must be url-safe');
    assert.ok(!seen.has(t), 'tokens must never collide');
    seen.add(t);
  }
});

test('token hashing is deterministic, one-way and fixed-length', () => {
  const raw = randomToken(32);
  assert.equal(hashToken(raw), hashToken(raw));
  assert.equal(hashToken(raw).length, 64);
  assert.ok(!hashToken(raw).includes(raw), 'the hash must not contain the token');
  assert.notEqual(hashToken(raw), hashToken(randomToken(32)));
});

test('safeEqual compares correctly and survives length mismatches', () => {
  assert.equal(safeEqual('abcdef', 'abcdef'), true);
  assert.equal(safeEqual('abcdef', 'abcdeg'), false);
  assert.equal(safeEqual('abcdef', 'abc'), false, 'must not throw on differing lengths');
  assert.equal(safeEqual('', ''), true);
  assert.equal(safeEqual(null, undefined), true, 'both normalise to empty');
  assert.equal(safeEqual('x', null), false);
});

/* ------------------------------------------------------------ cookie flags */

test('the refresh cookie is HttpOnly and scoped to the auth routes', () => {
  const opts = refreshCookieOptions();

  assert.equal(opts.httpOnly, true, 'must be unreadable from JavaScript');
  assert.equal(opts.path, '/api/auth', 'must not be attached to every request');
  assert.ok(['lax', 'strict', 'none'].includes(opts.sameSite));
  assert.equal(opts.maxAge, config.refreshTokenTtl * 1000);
});

test('the CSRF cookie is readable by design, so the page can echo it', () => {
  assert.equal(csrfCookieOptions().httpOnly, false);
});

test('cookies are marked Secure in production, and SameSite=None requires it', () => {
  const { load } = require('../../src/config/env');

  const prod = load({
    NODE_ENV: 'production',
    JWT_SECRET: 'x'.repeat(40),
    CORS_ORIGIN: 'https://rvmaitech.com',
  });
  assert.equal(prod.cookieSecure, true, 'Secure must default on in production');

  // A cross-site deployment without Secure is rejected at boot, because
  // browsers silently drop SameSite=None cookies that are not Secure.
  const broken = load({
    NODE_ENV: 'production',
    JWT_SECRET: 'x'.repeat(40),
    CORS_ORIGIN: 'https://rvmaitech.com',
    CROSS_SITE_COOKIES: 'true',
    COOKIE_SECURE: 'false',
  });
  assert.ok(broken.problems.some((p) => /COOKIE_SECURE/.test(p)));
});
