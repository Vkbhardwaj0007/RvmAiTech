/**
 * Request authentication and authorisation.
 *
 * Changes from the previous version, each one load-bearing:
 *
 *  - the token's `typ` and `ver` claims are checked, so a refresh/reset token
 *    cannot be replayed as an access token and a password change kills
 *    outstanding sessions;
 *  - every failure answers the same opaque 401, instead of distinguishing
 *    "Invalid token" from "User gone" (which told an attacker whether a user
 *    id existed);
 *  - `requireRole` exists, so adding a non-admin role later does not silently
 *    grant it the whole CMS.
 */
const { verifyAccessToken, bearerFrom } = require('../lib/tokens');
const User = require('../models/User');
const audit = require('../lib/audit');

/** One message for every authentication failure. */
function unauthorized(res) {
  return res.status(401).json({ message: 'Not signed in' });
}

/**
 * Requires a valid access token. Loads the user and attaches it to `req.user`.
 *
 * The database lookup on each request is deliberate: it is what makes
 * deletion and tokenVersion bumps take effect immediately rather than at the
 * end of the token's lifetime.
 */
async function protect(req, res, next) {
  const token = bearerFrom(req);
  if (!token) return unauthorized(res);

  const payload = verifyAccessToken(token);
  if (!payload) return unauthorized(res);

  let user;
  try {
    user = await User.findById(payload.sub);
  } catch {
    // A malformed `sub` makes Mongoose throw a CastError. That is a bad token,
    // not a server fault.
    return unauthorized(res);
  }

  if (!user) return unauthorized(res);

  // Credentials changed after this token was minted.
  if ((user.tokenVersion || 0) !== (payload.ver || 0)) return unauthorized(res);

  req.user = user;
  req.auth = payload;
  return next();
}

/**
 * Requires one of `roles`. Must be used after `protect`.
 *
 * Denials are audited: an authenticated user probing endpoints above their
 * level is worth knowing about.
 */
function requireRole(...roles) {
  const allowed = new Set(roles.flat());
  return function requireRoleMiddleware(req, res, next) {
    if (!req.user) return unauthorized(res);
    if (!allowed.has(req.user.role)) {
      audit.record('authz.denied', req, {
        user: req.user,
        meta: { reason: 'role', need: [...allowed], have: req.user.role, route: req.path },
      });
      return res.status(403).json({ message: 'Not allowed' });
    }
    return next();
  };
}

/**
 * Attaches `req.user` when a valid token is present, but does not require one.
 *
 * Used by the public content routes, which show published items to everyone
 * and unpublished drafts only to a signed-in admin.
 */
async function optionalAuth(req, _res, next) {
  const token = bearerFrom(req);
  if (!token) return next();

  const payload = verifyAccessToken(token);
  if (!payload) return next();

  try {
    const user = await User.findById(payload.sub);
    if (user && (user.tokenVersion || 0) === (payload.ver || 0)) {
      req.user = user;
      req.auth = payload;
    }
  } catch {
    /* treat as anonymous */
  }
  return next();
}

const requireAdmin = requireRole('admin');

module.exports = { protect, requireRole, requireAdmin, optionalAuth, unauthorized };
