require('../helpers/env');

const test = require('node:test');
const assert = require('node:assert/strict');

const { load } = require('../../src/config/env');

const PROD = { NODE_ENV: 'production', CORS_ORIGIN: 'https://rvmaitech.com' };
const STRONG = 'x'.repeat(40);

function problemsFor(env) {
  return load({ ...PROD, JWT_SECRET: STRONG, ...env }).problems;
}

test('a missing JWT secret is a boot-time failure', () => {
  assert.ok(load({ ...PROD }).problems.some((p) => /JWT_SECRET is required/.test(p)));
});

test('the placeholder secret from .env.example is refused', () => {
  const problems = problemsFor({ JWT_SECRET: 'change_this_to_a_long_random_string' });
  assert.ok(problems.some((p) => /placeholder/i.test(p)));
});

test('a short JWT secret is refused', () => {
  // The secret shipped in the uploaded .env was well under this length.
  assert.ok(problemsFor({ JWT_SECRET: 'rvmaitech-secret' }).some((p) => /at least 32/.test(p)));
  assert.ok(problemsFor({ JWT_SECRET: 'x'.repeat(31) }).some((p) => /at least 32/.test(p)));
  assert.deepEqual(problemsFor({ JWT_SECRET: 'x'.repeat(32) }), []);
});

test('a wildcard CORS origin is refused', () => {
  assert.ok(problemsFor({ CORS_ORIGIN: '*' }).some((p) => /"\*" is not allowed/.test(p)));
});

test('production without a CORS origin is refused unless it serves the client itself', () => {
  assert.ok(
    problemsFor({ CORS_ORIGIN: '' }).some((p) => /CORS_ORIGIN must be set/.test(p)),
    'an API on another origin needs an allowlist'
  );

  assert.deepEqual(
    problemsFor({ CORS_ORIGIN: '', SERVE_CLIENT: 'true' }),
    [],
    'serving the built frontend itself is same-origin, so no allowlist is needed'
  );
});

test('an over-long access token lifetime is refused', () => {
  // A long-lived access token cannot be revoked; that is the refresh token's job.
  assert.ok(problemsFor({ ACCESS_TOKEN_TTL: '12h' }).some((p) => /1h or less/.test(p)));
  assert.deepEqual(problemsFor({ ACCESS_TOKEN_TTL: '15m' }), []);
});

test('the old JWT_EXPIRES_IN value is still read, and still bounded', () => {
  // The previous .env used JWT_EXPIRES_IN=12h for the only token there was.
  const cfg = load({ ...PROD, JWT_SECRET: STRONG, JWT_EXPIRES_IN: '15m' });
  assert.equal(cfg.accessTokenTtl, 900);

  assert.ok(problemsFor({ JWT_EXPIRES_IN: '12h' }).some((p) => /1h or less/.test(p)));
});

test('trust proxy defaults to zero hops, never true', () => {
  // `trust proxy: true` lets a client spoof X-Forwarded-For and reset its own
  // IP rate limit at will.
  assert.equal(load({ ...PROD, JWT_SECRET: STRONG }).trustProxy, 0);
  assert.equal(load({ ...PROD, JWT_SECRET: STRONG, TRUST_PROXY: '' }).trustProxy, 0);
  assert.equal(load({ ...PROD, JWT_SECRET: STRONG, TRUST_PROXY: '1' }).trustProxy, 1);
  assert.equal(
    load({ ...PROD, JWT_SECRET: STRONG, TRUST_PROXY: 'true' }).trustProxy,
    0,
    'a non-numeric value must fall back to 0, not to "trust everything"'
  );
});

test('Argon2 parameters are clamped to the algorithm minimums', () => {
  // argon2 throws on timeCost < 2; an unclamped override would break hashing
  // at runtime rather than at boot.
  const cfg = load({ ...PROD, JWT_SECRET: STRONG, ARGON2_TIME_COST: '1', ARGON2_MEMORY_KIB: '16' });
  assert.ok(cfg.argon2.timeCost >= 2, `timeCost was ${cfg.argon2.timeCost}`);
  assert.ok(cfg.argon2.memoryCost >= 8192, `memoryCost was ${cfg.argon2.memoryCost}`);
  assert.ok(cfg.argon2.parallelism >= 1);
});

test('production defaults meet the OWASP floor for Argon2id', () => {
  const cfg = load({ ...PROD, JWT_SECRET: STRONG });
  assert.ok(cfg.argon2.memoryCost >= 19456, 'OWASP minimum is m=19456');
  assert.ok(cfg.argon2.timeCost >= 2, 'OWASP minimum is t=2');
});

test('a valid production configuration produces no problems', () => {
  assert.deepEqual(
    load({
      NODE_ENV: 'production',
      JWT_SECRET: STRONG,
      CORS_ORIGIN: 'https://rvmaitech.com,https://www.rvmaitech.com',
      MONGO_URI: 'mongodb://localhost/x',
      TRUST_PROXY: '1',
    }).problems,
    []
  );
});

test('the rate-limit store is Redis when configured and Mongo otherwise', () => {
  assert.equal(load({ ...PROD, JWT_SECRET: STRONG }).rateLimit.store, 'mongo');
  assert.equal(
    load({ ...PROD, JWT_SECRET: STRONG, REDIS_URL: 'redis://localhost:6379' }).rateLimit.store,
    'redis'
  );
});

test('reset tokens are short-lived by default', () => {
  const cfg = load({ ...PROD, JWT_SECRET: STRONG });
  assert.ok(cfg.resetTokenTtl <= 3600, 'a reset link should not outlive the hour');
});

test('development reset-link logging cannot be switched on in production', () => {
  const prod = load({ ...PROD, JWT_SECRET: STRONG, DEV_LOG_RESET_LINKS: 'true' });
  assert.equal(prod.devLogResetLinks, false, 'reset links must never be logged in production');

  const dev = load({ NODE_ENV: 'development', JWT_SECRET: STRONG, DEV_LOG_RESET_LINKS: 'true' });
  assert.equal(dev.devLogResetLinks, true);
});
