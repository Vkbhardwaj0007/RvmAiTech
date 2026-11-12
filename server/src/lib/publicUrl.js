const { config } = require('../config/env');

/**
 * Works out the public origin of THIS API — the origin that actually serves
 * `/uploads` — for building absolute URLs to store in the CMS.
 *
 * Two mistakes to avoid, and an earlier version of the upload route made the
 * second one:
 *
 *   1. Trusting `req.get('host')` outright. It is attacker-controlled, so a
 *      crafted Host header makes the API hand back a URL on someone else's
 *      domain, which an admin then saves into the CMS in good faith.
 *
 *   2. Substituting the CLIENT's origin. The frontend and the API are usually
 *      different origins in development (5173 vs 4000), and the client does
 *      not serve `/uploads` — so every uploaded image 404s.
 *
 * So: use an explicitly configured origin when there is one, otherwise accept
 * the request's own host but only if it is one we already recognise.
 */

/** Hosts we are willing to echo back, derived from configuration. */
function allowedHosts() {
  const hosts = new Set();

  const add = (value) => {
    if (!value) return;
    try {
      hosts.add(new URL(value).host);
    } catch {
      /* not a URL; ignore */
    }
  };

  add(config.siteUrl);
  add(config.apiPublicUrl);
  for (const origin of config.corsOrigins) add(origin);

  // Loopback on any port is fine in development; it cannot be spoofed from
  // outside, and it is what makes `npm run dev` work with no configuration.
  if (!config.isProd) {
    hosts.add(`localhost:${config.port}`);
    hosts.add(`127.0.0.1:${config.port}`);
  }

  return hosts;
}

/**
 * Returns the origin to prefix paths with, e.g. "https://rvmaitech.com",
 * or '' when nothing trustworthy is available (callers then emit a relative
 * URL, which is correct when the API also serves the site).
 */
function publicOrigin(req) {
  // 1. Explicit configuration always wins.
  if (config.apiPublicUrl) return config.apiPublicUrl.replace(/\/+$/, '');

  // 2. When this server also serves the frontend, the site URL IS this origin.
  if (config.serveClient && config.siteUrl) return config.siteUrl.replace(/\/+$/, '');

  // 3. Otherwise believe the request's host only if we already know it.
  const host = req?.get?.('host');
  if (host && allowedHosts().has(host)) {
    const proto = config.isProd ? 'https' : req.protocol || 'http';
    return `${proto}://${host}`;
  }

  // 4. Nothing we trust: a relative URL is better than a wrong absolute one.
  return '';
}

/** Absolute (or relative) URL for a path this API serves. */
function publicUrlFor(req, pathname) {
  const path = pathname.startsWith('/') ? pathname : `/${pathname}`;
  return `${publicOrigin(req)}${path}`;
}

module.exports = { publicUrlFor, publicOrigin, allowedHosts };
