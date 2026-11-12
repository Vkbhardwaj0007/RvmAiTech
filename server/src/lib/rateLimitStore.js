/**
 * Shared rate-limit storage.
 *
 * The store must be shared across application instances. An in-memory counter
 * silently multiplies every limit by the number of running processes — on a
 * two-dyno deployment "5 attempts" quietly becomes 10, and on Vercel's
 * serverless runtime it becomes "5 per cold start", which is no limit at all.
 *
 * So there are exactly two backends:
 *
 *   redis  when REDIS_URL is set. Preferred: atomic, cheap, purpose-built.
 *   mongo  otherwise. Uses the database this app already has, so correct
 *          multi-instance limiting needs no new infrastructure.
 *
 * RateLimiterMemory is used only when NODE_ENV=test, where there is one
 * process by definition.
 */
const { RateLimiterRedis, RateLimiterMongo, RateLimiterMemory } = require('rate-limiter-flexible');
const { config } = require('../config/env');

let redisClient = null;
let warnedAboutMongo = false;

/**
 * Lazily built so that importing this module does not open a socket — which
 * matters for tests and for serverless cold starts.
 */
function getRedis() {
  if (redisClient) return redisClient;

  // Required lazily: ioredis is only needed on the Redis path.
  const Redis = require('ioredis');
  redisClient = new Redis(config.redisUrl, {
    // Fail fast instead of queueing auth requests behind a dead Redis.
    enableOfflineQueue: false,
    maxRetriesPerRequest: 2,
    lazyConnect: false,
  });

  redisClient.on('error', (err) => {
    console.error('[ratelimit] redis error: %s', err.message);
  });

  return redisClient;
}

/**
 * Builds one limiter.
 *
 * `insuranceLimiter` is the important detail: if the backing store is
 * unreachable, rate-limiter-flexible falls back to this in-memory limiter
 * rather than throwing. That keeps the endpoint limited (imperfectly, per
 * instance) instead of unlimited, which is the right way to fail.
 *
 * @param {string} keyPrefix  namespace, e.g. 'login_ip'
 * @param {number} points     allowed events per duration
 * @param {number} duration   window in seconds
 * @param {number} blockDuration  seconds to refuse once exhausted
 */
function createLimiter({ keyPrefix, points, duration, blockDuration = 0 }) {
  const common = { keyPrefix, points, duration, blockDuration };

  if (config.isTest) return new RateLimiterMemory(common);

  const insuranceLimiter = new RateLimiterMemory(common);

  if (config.rateLimit.store === 'redis') {
    return new RateLimiterRedis({ ...common, storeClient: getRedis(), insuranceLimiter });
  }

  if (!warnedAboutMongo) {
    warnedAboutMongo = true;
    console.log(
      '[ratelimit] using MongoDB as the shared store. Set REDIS_URL for a dedicated store.'
    );
  }

  // Reuses the app's existing Mongoose connection, so there is no second
  // connection pool to size or monitor.
  const mongoose = require('mongoose');
  return new RateLimiterMongo({
    ...common,
    storeClient: mongoose.connection,
    tableName: 'ratelimits',
    insuranceLimiter,
  });
}

/** Closes the Redis socket. Used by tests and graceful shutdown. */
async function closeStore() {
  if (redisClient) {
    try {
      await redisClient.quit();
    } catch {
      /* already gone */
    }
    redisClient = null;
  }
}

module.exports = { createLimiter, closeStore, getRedis };
