/**
 * NoSQL operator stripping.
 *
 * Mongoose casts most things safely, but an object where a string is expected
 * still reaches the query builder as an operator. The classic break is:
 *
 *   POST /api/auth/login  { "userId": { "$ne": null }, "password": ... }
 *
 * which turns `findOne({ userId })` into "any user". We cast scalars at the
 * validation layer too (see lib/schemas.js), but this runs first and globally
 * so a route added later without a schema is not automatically exploitable.
 *
 * Keys are mutated in place rather than reassigned: `req.query` is a getter in
 * Express 5 and assigning to it throws, while deleting keys works in both 4
 * and 5.
 */

const FORBIDDEN_KEY = /^\$|\./;

// Keys that can poison Object.prototype if a value is ever assigned through
// them. No current sink does, but the cost of excluding them is nil.
const PROTOTYPE_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

const MAX_DEPTH = 12;

function scrubInPlace(node, depth, report) {
  if (node === null || typeof node !== 'object') return true;

  /**
   * Too deep to inspect. Returning false rather than quietly stopping is the
   * point: bailing out used to mean that a `$`-prefixed key nested 13 levels
   * down was passed through untouched, which is precisely what this module
   * exists to prevent. The caller turns this into a 400.
   */
  if (depth > MAX_DEPTH) return false;

  if (Array.isArray(node)) {
    let ok = true;
    for (const item of node) {
      if (!scrubInPlace(item, depth + 1, report)) ok = false;
    }
    return ok;
  }

  let ok = true;
  for (const key of Object.keys(node)) {
    if (FORBIDDEN_KEY.test(key) || PROTOTYPE_KEYS.has(key)) {
      delete node[key];
      report.push(key);
      continue;
    }
    if (!scrubInPlace(node[key], depth + 1, report)) ok = false;
  }
  return ok;
}

/**
 * Removes any key beginning with `$`, containing `.`, or able to reach
 * Object.prototype, from body, query, params and cookies.
 *
 * Cookies are included because cookie-parser always runs JSONCookies, so a
 * cookie value starting with `j:` is JSON.parse'd and `req.cookies` can hold
 * an attacker-supplied object, not just strings.
 *
 * Returns { stripped, tooDeep }.
 */
function scrub(req) {
  const report = [];
  let withinDepth = true;

  for (const bag of [req.body, req.query, req.params, req.cookies]) {
    if (bag && typeof bag === 'object') {
      if (!scrubInPlace(bag, 0, report)) withinDepth = false;
    }
  }

  return { stripped: report, tooDeep: !withinDepth };
}

function mongoSanitize(onStrip) {
  return function mongoSanitizeMiddleware(req, res, next) {
    const { stripped, tooDeep } = scrub(req);

    if (stripped.length && typeof onStrip === 'function') {
      onStrip(req, stripped);
    }

    // Refuse rather than forward something we could not fully inspect.
    if (tooDeep) {
      if (typeof onStrip === 'function') onStrip(req, ['<nesting too deep>']);
      return res.status(400).json({ message: 'Request structure is too deeply nested' });
    }

    return next();
  };
}

module.exports = { mongoSanitize, scrub, MAX_DEPTH };
