/**
 * Rate limits for the public, unauthenticated forms (contact, job
 * applications) and for uploads.
 *
 * These are not authentication endpoints, but they write to the database, send
 * email and accept files, so leaving them unlimited means anyone can fill the
 * inbox, burn the SMTP quota or fill the disk.
 */
const { createLimiter } = require('../lib/rateLimitStore');
const { tooMany } = require('./rateLimit');

const cache = new Map();
function limiter(name, opts) {
  if (!cache.has(name)) cache.set(name, createLimiter({ keyPrefix: name, ...opts }));
  return cache.get(name);
}

function byIp(getLimiter, message) {
  return async function limitPublic(req, res, next) {
    try {
      await getLimiter().consume(req.ip || 'unknown');
      return next();
    } catch (rejection) {
      if (rejection instanceof Error) {
        console.error('[ratelimit] store failure: %s', rejection.message);
        return next();
      }
      return tooMany(res, rejection, message);
    }
  };
}

/** Contact form / job application: 10 per hour per IP. */
const publicFormLimiter = () =>
  byIp(
    () => limiter('rl_public_form', {
      points: Number(process.env.RL_PUBLIC_FORM_PER_IP || 10),
      duration: 3600,
      blockDuration: 900,
    }),
    'Too many submissions. Please try again later.'
  );

/** Authenticated uploads: generous, but not unbounded. 60 per hour per IP. */
const uploadLimiter = () =>
  byIp(
    () => limiter('rl_upload', {
      points: Number(process.env.RL_UPLOAD_PER_IP || 60),
      duration: 3600,
      blockDuration: 300,
    }),
    'Too many uploads. Please wait and try again.'
  );

module.exports = { publicFormLimiter, uploadLimiter };
