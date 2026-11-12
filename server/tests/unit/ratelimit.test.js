require('../helpers/env');

const test = require('node:test');
const assert = require('node:assert/strict');

const rl = require('../../src/middleware/rateLimit');
const { config } = require('../../src/config/env');

function fakeReq(ip, body = {}) {
  return { ip, body, headers: {}, path: '/api/auth/login' };
}

/**
 * Runs one middleware and resolves with what it decided:
 *   { passed: true }                      next() was called
 *   { passed: false, status, body, headers }  a response was written
 *
 * Resolving from both paths (rather than polling) is what keeps this from
 * hanging when the middleware does the opposite of what a test expects.
 */
function run(mw, req) {
  return new Promise((resolve, reject) => {
    const headers = {};
    let status = null;

    const res = {
      set(k, v) {
        headers[k.toLowerCase()] = v;
        return this;
      },
      status(code) {
        status = code;
        return this;
      },
      json(body) {
        resolve({ passed: false, status, body, headers });
        return this;
      },
    };

    const timer = setTimeout(() => reject(new Error('middleware never settled')), 5000);
    const done = (result) => {
      clearTimeout(timer);
      resolve(result);
    };

    // Wrap resolve so the timer is always cleared.
    res.json = (body) => {
      done({ passed: false, status, body, headers });
      return res;
    };

    try {
      mw(req, res, () => done({ passed: true }));
    } catch (err) {
      clearTimeout(timer);
      reject(err);
    }
  });
}

const unique = (() => {
  let n = 0;
  return (p) => `${p}-${process.pid}-${(n += 1)}`;
})();

/* ---------------------------------------------------------- account backoff */

test('an account is not blocked before the failure threshold', async () => {
  const userId = unique('acct');

  for (let i = 0; i < config.rateLimit.accountFailuresBeforeBackoff; i += 1) {
    await rl.registerLoginFailure(userId);
  }
  // Exactly at the threshold, the account is still allowed to try.
  assert.equal(await rl.accountBlock(userId), null);
});

test('an account is blocked after exceeding the threshold', async () => {
  const userId = unique('acct');

  for (let i = 0; i < config.rateLimit.accountFailuresBeforeBackoff + 1; i += 1) {
    await rl.registerLoginFailure(userId);
  }

  const blocked = await rl.accountBlock(userId);
  assert.ok(blocked, 'account should now be in backoff');
  assert.ok(blocked.msBeforeNext > 0);
});

test('backoff escalates with each further failure', async () => {
  const userId = unique('acct');
  const threshold = config.rateLimit.accountFailuresBeforeBackoff;

  for (let i = 0; i < threshold + 1; i += 1) await rl.registerLoginFailure(userId);
  const first = (await rl.accountBlock(userId)).msBeforeNext;

  for (let i = 0; i < 3; i += 1) await rl.registerLoginFailure(userId);
  const later = (await rl.accountBlock(userId)).msBeforeNext;

  assert.ok(later > first, `backoff should grow: ${first}ms -> ${later}ms`);
});

test('backoff is capped — no permanent lockout', async () => {
  const userId = unique('acct');

  // 40 failures: without a cap, doubling would reach years.
  for (let i = 0; i < 40; i += 1) await rl.registerLoginFailure(userId);

  const blocked = await rl.accountBlock(userId);
  const seconds = blocked.msBeforeNext / 1000;

  assert.ok(
    seconds <= config.rateLimit.accountMaxBlockSeconds + 1,
    `block of ${seconds}s must not exceed the ${config.rateLimit.accountMaxBlockSeconds}s ceiling`
  );
  assert.ok(seconds > 0, 'and it must still expire on its own');
});

test('a short backoff expiring does NOT reset the failure streak', async () => {
  /**
   * Regression test for a real bug.
   *
   * rate-limiter-flexible's block() overwrites the key's TTL. When the failure
   * counter and the penalty shared one key, the first 2-second backoff expired
   * and took the whole streak with it — so an attacker got the full allowance
   * back every two seconds and the backoff never escalated past step one.
   *
   * This waits for an early penalty to lapse for real, then checks the streak
   * survived. The other tests in this file fire their failures back to back
   * and cannot see this.
   */
  const userId = unique('acct');
  const threshold = config.rateLimit.accountFailuresBeforeBackoff;

  // One past the threshold: penalty is 2 ** 1 = 2 seconds.
  for (let i = 0; i < threshold + 1; i += 1) await rl.registerLoginFailure(userId);

  const firstBlock = await rl.accountBlock(userId);
  assert.ok(firstBlock, 'should be in backoff');
  assert.ok(firstBlock.msBeforeNext <= 3000, `expected a short first backoff, got ${firstBlock.msBeforeNext}ms`);

  // Wait for it to lapse.
  await new Promise((resolve) => setTimeout(resolve, firstBlock.msBeforeNext + 400));

  assert.equal(await rl.accountBlock(userId), null, 'the backoff should have lapsed on its own');

  // The streak must have survived, so the NEXT failure escalates rather than
  // starting over at the threshold.
  await rl.registerLoginFailure(userId);

  const secondBlock = await rl.accountBlock(userId);
  assert.ok(secondBlock, 'one more failure after the lapse must block immediately');
  assert.ok(
    secondBlock.msBeforeNext > firstBlock.msBeforeNext,
    `backoff must keep growing across lapses: ${firstBlock.msBeforeNext}ms -> ${secondBlock.msBeforeNext}ms`
  );
});

test('a successful login clears the failure streak', async () => {
  const userId = unique('acct');

  for (let i = 0; i < config.rateLimit.accountFailuresBeforeBackoff + 2; i += 1) {
    await rl.registerLoginFailure(userId);
  }
  assert.ok(await rl.accountBlock(userId), 'should be blocked first');

  await rl.clearLoginFailures(userId);
  assert.equal(await rl.accountBlock(userId), null, 'streak should be cleared');
});

test('one account being blocked does not block another', async () => {
  const victim = unique('acct');
  const bystander = unique('acct');

  for (let i = 0; i < 20; i += 1) await rl.registerLoginFailure(victim);

  assert.ok(await rl.accountBlock(victim));
  assert.equal(await rl.accountBlock(bystander), null);
});

/* --------------------------------------------------------------- IP limiting */

test('the per-IP login limiter answers 429 with Retry-After once exhausted', async () => {
  const mw = rl.limitLoginIp();
  const ip = unique('10.1.1');
  const allowance = config.rateLimit.loginPerIp;
  let allowed = 0;
  let rejected = 0;

  for (let i = 0; i < allowance + 5; i += 1) {
    // eslint-disable-next-line no-await-in-loop
    const result = await run(mw, fakeReq(ip));

    if (result.passed) {
      allowed += 1;
    } else {
      rejected += 1;
      assert.equal(result.status, 429);
      assert.ok(result.body.retryAfter > 0, 'retryAfter should be a positive number of seconds');
      assert.ok(result.headers['retry-after'], 'Retry-After header must be set');
      assert.match(result.body.message, /too many/i);
      // A rate-limit reply must not say anything about the account.
      assert.ok(
        !/exists|unknown user|no such/i.test(JSON.stringify(result.body)),
        'must not leak account existence'
      );
    }
  }

  assert.equal(allowed, allowance, 'exactly the allowance should pass');
  assert.equal(rejected, 5, 'everything beyond it should be refused');
});

test('a different IP has its own budget', async () => {
  const mw = rl.limitLoginIp();
  const busy = unique('10.2.2');
  const fresh = unique('10.3.3');

  for (let i = 0; i < config.rateLimit.loginPerIp + 2; i += 1) {
    // eslint-disable-next-line no-await-in-loop
    await run(mw, fakeReq(busy));
  }

  assert.equal((await run(mw, fakeReq(busy))).passed, false, 'the busy IP stays blocked');
  assert.equal(
    (await run(mw, fakeReq(fresh))).passed,
    true,
    'an unrelated IP must not be caught in the block'
  );
});

/* ------------------------------------------------------------ forgot limiter */

test('forgot-password is limited per account and reports the rejection', async () => {
  const userId = unique('acct');

  for (let i = 0; i < config.rateLimit.forgotPerAccount; i += 1) {
    // eslint-disable-next-line no-await-in-loop
    assert.equal(await rl.consumeForgotAccount(userId), null, `request ${i + 1} should pass`);
  }

  const limited = await rl.consumeForgotAccount(userId);
  assert.ok(limited, 'the next request should be limited');
  assert.ok(limited.msBeforeNext > 0);
});
