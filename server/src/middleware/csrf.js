/**
 * CSRF protection — double-submit cookie.
 *
 * Scope: this guards the endpoints that authenticate with a *cookie*, which
 * are `POST /api/auth/refresh` and `POST /api/auth/logout`.
 *
 * Everything else in this API authenticates with an `Authorization: Bearer`
 * header. A cross-site attacker can make the browser send cookies but cannot
 * make it attach a header it does not control, so those routes are not
 * CSRF-reachable by construction. Adding a token to them would be noise.
 *
 * How it works: at sign-in the server sets a random value in a readable
 * `rv_csrf` cookie. The page reads it and echoes it in `X-CSRF-Token`. An
 * attacker's page can cause the cookie to be *sent* but cannot *read* it
 * (different origin), so it cannot produce the matching header.
 *
 * SameSite=lax on the refresh cookie already blocks cross-site POSTs in
 * current browsers. This is the second layer, and it is the only layer when
 * the deployment is split across domains and needs SameSite=None.
 */
const { safeEqual, CSRF_COOKIE, REFRESH_COOKIE } = require('../lib/tokens');
const audit = require('../lib/audit');

const HEADER = 'x-csrf-token';

function blocked(req, res, reason) {
  audit.record('authz.denied', req, { meta: { reason, route: req.path } });
  return res.status(403).json({ message: 'Request blocked. Please reload the page and try again.' });
}

function requireCsrfToken(req, res, next) {
  const cookieValue = req.cookies?.[CSRF_COOKIE];
  const headerValue = req.headers?.[HEADER];
  const refreshCookie = req.cookies?.[REFRESH_COOKIE];

  /**
   * No session cookie at all: there is genuinely nothing to protect, so let
   * the route answer 401 for the missing refresh token rather than a
   * confusing 403. This is scoped to "no refresh cookie either" — it is NOT a
   * general fail-open.
   */
  if (!refreshCookie && !cookieValue) return next();

  /**
   * From here the request carries a session cookie, so the CSRF token is
   * mandatory and anything unusable is a refusal, not a pass.
   *
   * Both values must be non-empty strings. The type check is load-bearing:
   * cookie-parser always runs JSONCookies, so a cookie whose value begins
   * with `j:` is JSON.parse'd into req.cookies. `rv_csrf=j:0` or `j:null`
   * would arrive as a falsy non-string, and `j:{}` as an object whose
   * stringification is "[object Object]" — a previous version let the first
   * case through the `!cookieValue` guard entirely.
   */
  if (typeof cookieValue !== 'string' || cookieValue.length === 0) {
    return blocked(req, res, 'csrf_cookie_missing_or_malformed');
  }
  if (typeof headerValue !== 'string' || headerValue.length === 0) {
    return blocked(req, res, 'csrf_header_missing');
  }
  if (!safeEqual(cookieValue, headerValue)) {
    return blocked(req, res, 'csrf_mismatch');
  }

  return next();
}

module.exports = { requireCsrfToken, CSRF_HEADER: HEADER };
