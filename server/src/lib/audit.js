/**
 * Audit logging for authentication events.
 *
 * Two rules, enforced here rather than left to call sites:
 *
 *  1. Secrets never reach the log. `meta` is scrubbed of anything whose key
 *     looks like a credential, and long strings are truncated, so a future
 *     caller that passes `{ password }` by mistake cannot leak it.
 *  2. Logging never breaks a request. A failed audit write is reported to the
 *     console and swallowed; refusing a valid login because the audit
 *     collection is unavailable would be a worse outcome.
 */
const AuthEvent = require('../models/AuthEvent');

const SECRET_KEY = /pass|secret|token|auth|cookie|hash|credential|otp|session|bearer|key/i;
const MAX_META_STRING = 200;

function scrubMeta(meta, depth = 0) {
  if (meta === null || typeof meta !== 'object' || depth > 4) {
    return typeof meta === 'string' && meta.length > MAX_META_STRING
      ? `${meta.slice(0, MAX_META_STRING)}…`
      : meta;
  }
  if (Array.isArray(meta)) return meta.slice(0, 20).map((v) => scrubMeta(v, depth + 1));

  const out = {};
  for (const [key, value] of Object.entries(meta)) {
    if (SECRET_KEY.test(key)) {
      out[key] = '[redacted]';
      continue;
    }
    out[key] = scrubMeta(value, depth + 1);
  }
  return out;
}

/** Client IP, honouring only as many proxy hops as TRUST_PROXY allows. */
function clientIp(req) {
  return String(req?.ip || req?.socket?.remoteAddress || '').slice(0, 64);
}

function userAgent(req) {
  return String(req?.headers?.['user-agent'] || '').slice(0, 256);
}

/**
 * Writes one audit row. Fire-and-forget by design: callers do not await it on
 * the request path.
 *
 * @param {string} type one of AuthEvent.EVENT_TYPES
 */
function record(type, req, { user = null, userIdAttempted = '', meta = {} } = {}) {
  const doc = {
    type,
    user: user?._id || user || null,
    userIdAttempted: String(userIdAttempted || '').slice(0, 100).toLowerCase(),
    ip: clientIp(req),
    userAgent: userAgent(req),
    meta: scrubMeta(meta),
  };

  return AuthEvent.create(doc).catch((err) => {
    // Still surface it: a silently broken audit trail is its own problem.
    console.error('[audit] could not record %s: %s', type, err.message);
  });
}

module.exports = { record, clientIp, userAgent, scrubMeta };
