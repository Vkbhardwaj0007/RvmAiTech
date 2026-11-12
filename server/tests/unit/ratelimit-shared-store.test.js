/**
 * Verifies the claim that rate limiting holds ACROSS application instances.
 *
 * This is the property that an in-memory limiter silently fails: two app
 * processes each keep their own counter, so a "5 attempts" rule becomes 10.
 * The test builds two independent limiters — standing in for two dynos — over
 * one shared Redis, and asserts the budget is shared.
 *
 * Skipped automatically when no Redis is reachable, so the suite still runs on
 * a machine without one. Set REDIS_TEST_URL to point at your own instance.
 */
require('../helpers/env');

const test = require('node:test');
const assert = require('node:assert/strict');
const { spawn, execFileSync } = require('node:child_process');
const net = require('node:net');
const os = require('node:os');
const path = require('node:path');
const fs = require('node:fs');

const PORT = 6399 + (process.pid % 100);
const URL = process.env.REDIS_TEST_URL || `redis://127.0.0.1:${PORT}`;

function haveRedisServer() {
  if (process.env.REDIS_TEST_URL) return true;
  try {
    execFileSync('redis-server', ['--version'], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

function waitForPort(port, timeoutMs = 8000) {
  const deadline = Date.now() + timeoutMs;
  return new Promise((resolve, reject) => {
    const attempt = () => {
      const socket = net.connect(port, '127.0.0.1');
      socket.once('connect', () => {
        socket.destroy();
        resolve();
      });
      socket.once('error', () => {
        socket.destroy();
        if (Date.now() > deadline) reject(new Error(`port ${port} never opened`));
        else setTimeout(attempt, 150);
      });
    };
    attempt();
  });
}

const enabled = haveRedisServer();

test(
  'the rate limit is shared between two independent app instances',
  { skip: enabled ? false : 'redis-server not installed and REDIS_TEST_URL not set' },
  async (t) => {
    let server = null;
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'rl-redis-'));

    if (!process.env.REDIS_TEST_URL) {
      server = spawn(
        'redis-server',
        ['--port', String(PORT), '--save', '', '--appendonly', 'no', '--dir', dir],
        { stdio: 'ignore' }
      );
      await waitForPort(PORT);
    }

    const Redis = require('ioredis');
    const { RateLimiterRedis } = require('rate-limiter-flexible');

    // Two clients and two limiters, deliberately constructed separately:
    // this is what two processes would each build on boot.
    const clientA = new Redis(URL, { enableOfflineQueue: false, maxRetriesPerRequest: 2, lazyConnect: true });
    const clientB = new Redis(URL, { enableOfflineQueue: false, maxRetriesPerRequest: 2, lazyConnect: true });

    // With enableOfflineQueue:false, commands issued before the socket is
    // ready are rejected outright, so both clients must be connected first.
    await Promise.all([clientA.connect(), clientB.connect()]);

    const opts = { keyPrefix: `shared_test_${process.pid}`, points: 5, duration: 60 };
    const instanceA = new RateLimiterRedis({ ...opts, storeClient: clientA });
    const instanceB = new RateLimiterRedis({ ...opts, storeClient: clientB });

    t.after(async () => {
      await clientA.quit().catch(() => {});
      await clientB.quit().catch(() => {});
      if (server) server.kill('SIGKILL');
      fs.rmSync(dir, { recursive: true, force: true });
    });

    const key = `203.0.113.${process.pid % 255}`;

    // Spend three of five through instance A.
    for (let i = 0; i < 3; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      await instanceA.consume(key);
    }

    // Instance B must see only two left — not a fresh five.
    const afterFourth = await instanceB.consume(key);
    assert.equal(afterFourth.remainingPoints, 1, 'instance B should see A’s consumption');

    await instanceB.consume(key); // fifth, exhausts the budget

    await assert.rejects(
      () => instanceB.consume(key),
      (err) => {
        assert.ok(!(err instanceof Error), 'should be a rate-limit rejection, not a crash');
        assert.ok(err.msBeforeNext > 0);
        return true;
      },
      'the sixth attempt must be refused'
    );

    // And instance A agrees, which is the whole point.
    await assert.rejects(
      () => instanceA.consume(key),
      (err) => !(err instanceof Error),
      'the block must be visible from the other instance too'
    );
  }
);

test(
  'an unreachable shared store falls back to a local limiter rather than allowing everything',
  async () => {
    const Redis = require('ioredis');
    const { RateLimiterRedis, RateLimiterMemory } = require('rate-limiter-flexible');

    // Port 1 is never listening.
    const dead = new Redis('redis://127.0.0.1:1', {
      enableOfflineQueue: false,
      maxRetriesPerRequest: 1,
      retryStrategy: () => null,
      lazyConnect: true,
    });
    dead.on('error', () => {});

    const opts = { keyPrefix: `insurance_${process.pid}`, points: 2, duration: 60 };
    const limiter = new RateLimiterRedis({
      ...opts,
      storeClient: dead,
      insuranceLimiter: new RateLimiterMemory(opts),
    });

    const key = 'fallback-key';
    await limiter.consume(key);
    await limiter.consume(key);

    // The third must still be refused: failing open would turn a Redis outage
    // into an unlimited login endpoint.
    await assert.rejects(
      () => limiter.consume(key),
      (err) => !(err instanceof Error),
      'with the store down, the in-memory insurance limiter must still enforce'
    );

    await dead.quit().catch(() => {});
  }
);
