/**
 * Rate limiting for the authentication endpoints.
 *
 * Two dimensions, because either one alone is easy to sidestep:
 *
 *   per IP       stops one host grinding through many accounts
 *   per account  stops a botnet grinding one account from many hosts
 *
 * The account dimension uses *escalating backoff* rather than a lockout:
 * after N consecutive failures the account pauses for a few seconds, then
 * longer, up to a ceiling. A permanent lockout is itself a denial-of-service —
 * anyone who knows an admin's user id could keep them locked out for free — so
 * every block here expires on its own.
 *
 * Successful logins clear the account counter, so a legitimate user who
 * mistypes twice and then succeeds starts from zero again.
 */
const { createLimiter } = require('../lib/rateLimitStore');
const { config } = require('../config/env');
const audit = require('../lib/audit');

const { rateLimit: limits } = config;

/* ------------------------------------------------------------- the limiters */

// Built lazily: the Mongo-backed store needs an open Mongoose connection, and
// this module is imported while routes are being defined, before connect().
const cache = new Map();
function limiter(name, opts) {
  if (!cache.has(name)) cache.set(name, createLimiter({ keyPrefix: name, ...opts }));
  return cache.get(name);
}

const loginIpLimiter = () =>
  limiter('rl_login_ip', { points: limits.loginPerIp, duration: 15 * 60, blockDuration: 15 * 60 });

const authIpLimiter = () =>
  limiter('rl_auth_ip', { points: limits.authPerIp, duration: 60, blockDuration: 60 });

const forgotIpLimiter = () =>
  limiter('rl_forgot_ip', { points: limits.forgotPerIp, duration: 3600, blockDuration: 3600 });

const forgotAccountLimiter = () =>
  limiter('rl_forgot_acct', { points: limits.forgotPerAccount, duration: 3600, blockDuration: 3600 });

const resetIpLimiter = () =>
  limiter('rl_reset_ip', { points: limits.resetPerIp, duration: 3600, blockDuration: 3600 });

/**
 * Account-scoped failure tracking uses TWO keys, and the split is load-bearing.
 *
 * rate-limiter-flexible's `block(key, seconds)` works by overwriting the key's
 * TTL with `seconds`. If the failure counter and the penalty shared one key, a
 * short early backoff would *shorten* the counter's lifetime: a 2-second block
 * would expire and take the whole failure streak with it. The attacker would
 * then get the full allowance again, every two seconds, and the backoff would
 * never escalate past its first step.
 *
 * So the counter is kept separately from the penalty.
 */

/**
 * Counts consecutive failures. `points` is deliberately enormous — this is a
 * counter, not a gate, and it must never reject or block, because being
 * blocked is what would reset it.
 */
const loginFailureCounter = () =>
  limiter('rl_login_fail', {
    points: Number.MAX_SAFE_INTEGER,
    duration: limits.accountFailureWindowSeconds,
  });

/**
 * Holds the penalty. Written only by `block()`, whose duration becomes this
 * key's TTL, so the block expires on its own and the counter outlives it.
 */
const loginBlock = () =>
  limiter('rl_login_block', {
    points: 1,
    duration: 1,
  });

/* ----------------------------------------------------------------- helpers */

function retryAfterSeconds(rejection) {
  const ms = Number(rejection?.msBeforeNext ?? 0);
  return Math.max(1, Math.ceil(ms / 1000));
}

function tooMany(res, rejection, message) {
  const retryAfter = retryAfterSeconds(rejection);
  res.set('Retry-After', String(retryAfter));
  return res.status(429).json({
    message: message || 'Too many attempts. Please wait and try again.',
    retryAfter,
  });
}

/**
 * Generic IP-based limiter middleware.
 *
 * Keyed on `req.ip`, which is only trustworthy because TRUST_PROXY is an
 * explicit hop count (see config/env.js). With `app.set('trust proxy', true)`
 * a client could spoof X-Forwarded-For and reset its own counter at will.
 */
function limitByIp(getLimiter, { message, event } = {}) {
  return async function limitByIpMiddleware(req, res, next) {
    try {
      await getLimiter().consume(req.ip || 'unknown');
      return next();
    } catch (rejection) {
      // A thrown Error (not a rejection object) means the store itself broke.
      if (rejection instanceof Error) {
        console.error('[ratelimit] store failure: %s', rejection.message);
        return next(); // insuranceLimiter already tried; do not lock everyone out
      }
      if (event) {
        audit.record(event, req, {
          userIdAttempted: req.body?.userId || '',
          meta: { scope: 'ip' },
        });
      }
      return tooMany(res, rejection, message);
    }
  };
}

/* ------------------------------------------------- account-scoped (login) */

/**
 * Checks whether this account is currently in backoff. Called before the
 * password is verified, so a blocked account costs no hashing work.
 *
 * Returns null when the attempt may proceed, or a rejection object when not.
 */
async function accountBlock(userId) {
  if (!userId) return null;
  try {
    // `block()` sets consumedPoints to points + 1, so anything above the
    // limiter's own `points` means a penalty is live.
    const state = await loginBlock().get(String(userId));
    if (state && state.consumedPoints > 1 && state.msBeforeNext > 0) return state;
    return null;
  } catch (err) {
    console.error('[ratelimit] account check failed: %s', err.message);
    return null;
  }
}

/**
 * Records one failed login and applies escalating backoff.
 *
 * Delay doubles per failure past the threshold — 2s, 4s, 8s … — capped at
 * RL_ACCOUNT_MAX_BLOCK (default 15 min). Slow enough to make online guessing
 * useless, bounded so a legitimate user is never locked out for good.
 */
async function registerLoginFailure(userId) {
  if (!userId) return;
  const key = String(userId);

  let failures;
  try {
    const result = await loginFailureCounter().consume(key);
    failures = result.consumedPoints;
  } catch (rejection) {
    // The counter should never reject; if the store itself failed there is
    // nothing useful to do here.
    if (rejection instanceof Error) {
      console.error('[ratelimit] failure counter unavailable: %s', rejection.message);
      return;
    }
    failures = rejection.consumedPoints;
  }

  if (failures <= limits.accountFailuresBeforeBackoff) return;

  // 2s, 4s, 8s, … bounded by the ceiling. Never permanent: the penalty key
  // carries its own TTL, so it lapses whether or not anyone intervenes.
  const over = failures - limits.accountFailuresBeforeBackoff;
  const seconds = Math.min(limits.accountMaxBlockSeconds, 2 ** Math.min(over, 30));

  try {
    await loginBlock().block(key, seconds);
  } catch {
    /* best effort: a missed penalty is still counted for next time */
  }
}

/** Clears both the failure streak and any live penalty after a real sign-in. */
async function clearLoginFailures(userId) {
  if (!userId) return;
  const key = String(userId);
  await Promise.all([
    loginFailureCounter().delete(key).catch(() => {}),
    loginBlock().delete(key).catch(() => {}),
  ]);
}

/** One forgot-password request per account, rate limited. */
async function consumeForgotAccount(userId) {
  try {
    await forgotAccountLimiter().consume(String(userId));
    return null;
  } catch (rejection) {
    if (rejection instanceof Error) return null;
    return rejection;
  }
}

/* ------------------------------------------------------------------ exports */

module.exports = {
  // middleware
  limitLoginIp: () => limitByIp(loginIpLimiter, {
    message: 'Too many sign-in attempts from this network. Please wait and try again.',
    event: 'login.ratelimited',
  }),
  limitAuthIp: () => limitByIp(authIpLimiter),
  limitForgotIp: () => limitByIp(forgotIpLimiter, {
    message: 'Too many password-reset requests. Please wait and try again.',
  }),
  limitResetIp: () => limitByIp(resetIpLimiter, {
    message: 'Too many attempts. Please wait and try again.',
  }),

  // account-scoped helpers used inside the login controller
  accountBlock,
  registerLoginFailure,
  clearLoginFailures,
  consumeForgotAccount,

  // shared response helper
  tooMany,
  retryAfterSeconds,

  // test seam
  _limiters: {
    loginFailureCounter,
    loginBlock,
    loginIpLimiter,
    forgotAccountLimiter,
    forgotIpLimiter,
    resetIpLimiter,
    authIpLimiter,
  },
  _resetAll: () => cache.clear(),
};
