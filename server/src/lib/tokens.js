/**
 * Token handling.
 *
 * Two credentials, on purpose:
 *
 *   access token   JWT, 15 minutes, sent in the Authorization header. Readable
 *                  by JavaScript, so it is short-lived and carries no secrets.
 *   refresh token  opaque 256-bit random string in an HttpOnly cookie. Only
 *                  the SHA-256 of it is stored, so a database dump does not
 *                  hand over live sessions. Rotated on every use, with reuse
 *                  detection (see models/RefreshToken.js).
 *
 * The refresh token is deliberately NOT a JWT: we need to revoke individual
 * sessions, and a stateless token cannot be revoked.
 */
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { config } = require('../config/env');

const ISSUER = 'rvmaitech-api';
const AUDIENCE = 'rvmaitech-admin';

/* ------------------------------------------------------------ access tokens */

/**
 * `ver` pins the token to the user's current tokenVersion. Bumping that field
 * (password change, forced sign-out) invalidates every access token already
 * issued, which a plain `{ id }` payload cannot do.
 */
function signAccessToken(user) {
  return jwt.sign(
    {
      sub: String(user._id),
      role: user.role || 'admin',
      ver: user.tokenVersion || 0,
      typ: 'access',
    },
    config.jwtSecret,
    {
      expiresIn: config.accessTokenTtl,
      issuer: ISSUER,
      audience: AUDIENCE,
      algorithm: 'HS256',
    }
  );
}

/**
 * Verifies an access token.
 *
 * `algorithms` is pinned: without it, a token with `"alg": "none"` is accepted
 * by some verifier configurations. `typ` is checked so a token minted for
 * another purpose cannot be replayed as an access token.
 *
 * Returns the payload, or null for any failure. Callers must not distinguish
 * between "expired" and "forged" in what they send to the client.
 */
function verifyAccessToken(token) {
  try {
    const payload = jwt.verify(String(token), config.jwtSecret, {
      issuer: ISSUER,
      audience: AUDIENCE,
      algorithms: ['HS256'],
    });
    if (!payload || payload.typ !== 'access') return null;
    return payload;
  } catch {
    return null;
  }
}

/** Pulls a bearer token out of the Authorization header, or null. */
function bearerFrom(req) {
  const header = req.headers?.authorization || '';
  if (!header.startsWith('Bearer ')) return null;
  const token = header.slice(7).trim();
  return token || null;
}

/* ----------------------------------------------------------- opaque secrets */

/** 256 bits of CSPRNG output, url-safe. Used for refresh and reset tokens. */
function randomToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString('base64url');
}

/**
 * The only form we ever persist. SHA-256 is correct here (unlike for
 * passwords): the input is already 256 bits of uniform randomness, so there is
 * nothing to brute-force and a slow KDF would only add latency to every
 * request.
 */
function hashToken(raw) {
  return crypto.createHash('sha256').update(String(raw)).digest('hex');
}

/** Length-safe constant-time compare for two hex/ascii strings. */
function safeEqual(a, b) {
  const bufA = Buffer.from(String(a ?? ''), 'utf8');
  const bufB = Buffer.from(String(b ?? ''), 'utf8');
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

/* -------------------------------------------------------------- cookie flags */

const REFRESH_COOKIE = 'rv_rt';
const CSRF_COOKIE = 'rv_csrf';

/**
 * Cookie attributes for the refresh token.
 *
 *   httpOnly  keeps it away from XSS and from any third-party script on the page
 *   secure    mandatory in production; browsers also require it for SameSite=None
 *   sameSite  'lax' when the API and site share a registrable domain, which
 *             blocks cross-site POSTs outright. A split deployment
 *             (api.example.com + site.netlify.app) needs 'none', and that is
 *             exactly when the CSRF token stops being belt-and-braces.
 *   path      scoped to the auth routes so it is not attached to every request
 */
function refreshCookieOptions(maxAgeSeconds = config.refreshTokenTtl) {
  return {
    httpOnly: true,
    secure: config.cookieSecure,
    sameSite: config.crossSiteCookies ? 'none' : 'lax',
    domain: config.cookieDomain,
    path: '/api/auth',
    maxAge: maxAgeSeconds * 1000,
  };
}

/**
 * The CSRF cookie is readable by JavaScript by design: the browser sends the
 * cookie, the page copies it into a header, and the server checks they match.
 * An attacker on another origin can cause the cookie to be sent but cannot
 * read it to set the header.
 */
function csrfCookieOptions(maxAgeSeconds = config.refreshTokenTtl) {
  return {
    httpOnly: false,
    secure: config.cookieSecure,
    sameSite: config.crossSiteCookies ? 'none' : 'lax',
    domain: config.cookieDomain,
    path: '/',
    maxAge: maxAgeSeconds * 1000,
  };
}

module.exports = {
  signAccessToken,
  verifyAccessToken,
  bearerFrom,
  randomToken,
  hashToken,
  safeEqual,
  refreshCookieOptions,
  csrfCookieOptions,
  REFRESH_COOKIE,
  CSRF_COOKIE,
  ISSUER,
  AUDIENCE,
};
