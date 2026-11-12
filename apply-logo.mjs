#!/usr/bin/env node
/**
 * Applies the new brand mark and the upload-URL fix.
 *
 * Written as a script rather than a patch because a patch has to know exactly
 * what your files look like beforehand, and yours already carry the security
 * and 3D changes. This only looks for the specific lines it needs, so it works
 * whatever else has been applied — and it is safe to run twice: anything
 * already done is reported as "skipped" rather than duplicated.
 *
 * Run from the project root (the folder holding server/ and web/):
 *   node apply-logo.mjs
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';

const WHOLE = {
 "web/src/components/Logo.jsx": "import { useSite } from '../api/SiteContext';\n\n/**\n * Brand mark.\n *\n * Order of preference:\n *   1. a logo uploaded in Admin \u2192 Settings (content.logo) \u2014 always wins\n *   2. the bundled RvmAiTech mark in web/public/brand/\n *\n * Two bundled files, not one. The supplied artwork is blue and red, which\n * measures 3.5:1 and 3.2:1 against the navy header \u2014 under the 4.5:1 needed to\n * read comfortably. So the header and footer, which sit on navy, use a\n * reversed version (near-white wordmark, lifted coral accent: 14:1 and 5.4:1),\n * and the original is kept for light backgrounds.\n *\n * `dark` means \"this logo is sitting on a LIGHT background\" \u2014 the same meaning\n * the previous version of this component gave the prop.\n */\nconst MARK_ON_LIGHT = '/brand/rvmaitech-logo.png';\nconst MARK_ON_DARK = '/brand/rvmaitech-logo-light.png';\n\n// Intrinsic size of both files. Declared so the browser reserves the right box\n// before the image loads and the header does not jump.\nconst MARK_W = 563;\nconst MARK_H = 150;\n\nexport default function Logo({ dark = false }) {\n  const { content } = useSite();\n  const uploaded = content?.logo;\n\n  if (uploaded) {\n    return (\n      <a href=\"/\" className=\"logo\" aria-label=\"RvmAiTech \u2014 home\">\n        <img src={uploaded} alt=\"RvmAiTech\" className=\"logo-img\" />\n      </a>\n    );\n  }\n\n  return (\n    <a href=\"/\" className=\"logo\" aria-label=\"RvmAiTech \u2014 home\">\n      <img\n        src={dark ? MARK_ON_LIGHT : MARK_ON_DARK}\n        alt=\"RvmAiTech \u2014 Robotics, Vision, Intelligence\"\n        className=\"logo-img\"\n        width={MARK_W}\n        height={MARK_H}\n        // The mark is above the fold in the header, so it should not be\n        // deferred behind anything else.\n        fetchPriority=\"high\"\n        decoding=\"async\"\n      />\n    </a>\n  );\n}\n",
 "server/src/lib/publicUrl.js": "const { config } = require('../config/env');\n\n/**\n * Works out the public origin of THIS API \u2014 the origin that actually serves\n * `/uploads` \u2014 for building absolute URLs to store in the CMS.\n *\n * Two mistakes to avoid, and an earlier version of the upload route made the\n * second one:\n *\n *   1. Trusting `req.get('host')` outright. It is attacker-controlled, so a\n *      crafted Host header makes the API hand back a URL on someone else's\n *      domain, which an admin then saves into the CMS in good faith.\n *\n *   2. Substituting the CLIENT's origin. The frontend and the API are usually\n *      different origins in development (5173 vs 4000), and the client does\n *      not serve `/uploads` \u2014 so every uploaded image 404s.\n *\n * So: use an explicitly configured origin when there is one, otherwise accept\n * the request's own host but only if it is one we already recognise.\n */\n\n/** Hosts we are willing to echo back, derived from configuration. */\nfunction allowedHosts() {\n  const hosts = new Set();\n\n  const add = (value) => {\n    if (!value) return;\n    try {\n      hosts.add(new URL(value).host);\n    } catch {\n      /* not a URL; ignore */\n    }\n  };\n\n  add(config.siteUrl);\n  add(config.apiPublicUrl);\n  for (const origin of config.corsOrigins) add(origin);\n\n  // Loopback on any port is fine in development; it cannot be spoofed from\n  // outside, and it is what makes `npm run dev` work with no configuration.\n  if (!config.isProd) {\n    hosts.add(`localhost:${config.port}`);\n    hosts.add(`127.0.0.1:${config.port}`);\n  }\n\n  return hosts;\n}\n\n/**\n * Returns the origin to prefix paths with, e.g. \"https://rvmaitech.com\",\n * or '' when nothing trustworthy is available (callers then emit a relative\n * URL, which is correct when the API also serves the site).\n */\nfunction publicOrigin(req) {\n  // 1. Explicit configuration always wins.\n  if (config.apiPublicUrl) return config.apiPublicUrl.replace(/\\/+$/, '');\n\n  // 2. When this server also serves the frontend, the site URL IS this origin.\n  if (config.serveClient && config.siteUrl) return config.siteUrl.replace(/\\/+$/, '');\n\n  // 3. Otherwise believe the request's host only if we already know it.\n  const host = req?.get?.('host');\n  if (host && allowedHosts().has(host)) {\n    const proto = config.isProd ? 'https' : req.protocol || 'http';\n    return `${proto}://${host}`;\n  }\n\n  // 4. Nothing we trust: a relative URL is better than a wrong absolute one.\n  return '';\n}\n\n/** Absolute (or relative) URL for a path this API serves. */\nfunction publicUrlFor(req, pathname) {\n  const path = pathname.startsWith('/') ? pathname : `/${pathname}`;\n  return `${publicOrigin(req)}${path}`;\n}\n\nmodule.exports = { publicUrlFor, publicOrigin, allowedHosts };\n",
 "server/src/routes/uploadRoutes.js": "const router = require('express').Router();\nconst { protect, requireAdmin } = require('../middleware/auth');\nconst { upload } = require('../middleware/upload');\nconst { uploadLimiter } = require('../middleware/publicLimit');\nconst { publicUrlFor } = require('../lib/publicUrl');\n\n/**\n * Admin-only media upload.\n *\n * The response URL is never built from a bare `req.get('host')`: that header is\n * attacker-controlled, so a crafted request makes the API hand back a URL on\n * someone else's domain, which an admin then saves into the CMS in good faith.\n *\n * It is also NOT built from the client's origin \u2014 an earlier attempt at the\n * fix did that, and broke every upload in development, because the frontend\n * (5173) does not serve `/uploads`; this API (4000) does. See lib/publicUrl.js.\n */\nrouter.post(\n  '/',\n  protect,\n  requireAdmin,\n  uploadLimiter(),\n  (req, res, next) =>\n    upload.single('file')(req, res, (err) => {\n      if (err) {\n        return res.status(400).json({\n          message:\n            err.code === 'LIMIT_FILE_SIZE'\n              ? 'That file is too large'\n              : 'Only image or video files are allowed',\n        });\n      }\n      next();\n    }),\n  (req, res) => {\n    if (!req.file) return res.status(400).json({ message: 'No file received' });\n\n    res.json({ url: publicUrlFor(req, `/uploads/${req.file.filename}`) });\n  }\n);\n\nmodule.exports = router;\n"
};
const EDITS = [
 {
  "file": "server/src/config/env.js",
  "find": "    siteUrl: env.SITE_URL || '',",
  "already": "apiPublicUrl",
  "replace": "    siteUrl: env.SITE_URL || '',\n    /**\n     * Public origin of this API, used to build URLs for uploaded files.\n     * Only needed when the API is on its own domain and that domain is not\n     * already in CORS_ORIGIN \u2014 see lib/publicUrl.js.\n     */\n    apiPublicUrl: (env.API_PUBLIC_URL || '').replace(/\\/+$/, ''),"
 },
 {
  "file": "server/src/controllers/applicationController.js",
  "find": "const { sendContactAlert } = require('../utils/mailer');",
  "already": "publicUrlFor",
  "replace": "const { sendContactAlert } = require('../utils/mailer');\nconst { publicUrlFor } = require('../lib/publicUrl');"
 },
 {
  "file": "server/src/controllers/applicationController.js",
  "find": "  const resumeUrl = `${req.protocol}://${req.get('host')}/uploads/resumes/${req.file.filename}`;",
  "already": "publicUrlFor(req, `/uploads/resumes",
  "replace": "  // Built through publicUrl: a bare req.get('host') is attacker-controlled,\n  // and a resume link stored in the CMS pointing at someone else's domain is\n  // exactly the kind of thing an admin would click in good faith.\n  const resumeUrl = publicUrlFor(req, `/uploads/resumes/${req.file.filename}`);"
 },
 {
  "file": "server/src/routes/sitemapRoutes.js",
  "find": "  return process.env.SITE_URL || `${req.protocol}://${req.get('host')}`;",
  "already": "publicOrigin(req)",
  "replace": "  return process.env.SITE_URL || publicOrigin(req) || `http://localhost:${process.env.PORT || 4000}`;"
 },
 {
  "file": "server/src/routes/sitemapRoutes.js",
  "find": "const router = require('express').Router();",
  "already": "require('../lib/publicUrl')",
  "replace": "const router = require('express').Router();\nconst { publicOrigin } = require('../lib/publicUrl');"
 },
 {
  "file": "web/src/styles.css",
  "find": ".logo-img{max-height:46px;width:auto}",
  "already": ".site-footer .logo-img",
  "replace": ".logo-img{max-height:46px;width:auto;height:auto}\n/* The bundled mark is wider than the old icon+text lockup, so it needs its own\n   ceiling on narrow screens rather than the shared 46px. */\n@media (max-width:1400px){.logo-img{max-height:40px}}\n@media (max-width:760px){.logo-img{max-height:34px}}\n.site-footer .logo-img{max-height:52px}"
 }
];

let wrote = 0, skipped = 0, failed = 0;
const ok   = (m) => console.log('  \u001b[32mok\u001b[0m      ' + m);
const skip = (m) => console.log('  \u001b[33mskipped\u001b[0m ' + m);
const bad  = (m) => console.log('  \u001b[31mFAILED\u001b[0m  ' + m);

if (!existsSync('server') || !existsSync('web')) {
  console.error('Run this from the project root — the folder that contains server/ and web/.');
  process.exit(1);
}

console.log('\nWhole files:');
for (const [rel, body] of Object.entries(WHOLE)) {
  try {
    mkdirSync(dirname(rel), { recursive: true });
    const existed = existsSync(rel);
    if (existed && readFileSync(rel, 'utf8') === body) { skip(rel + ' (identical)'); skipped++; continue; }
    if (existed) writeFileSync(rel + '.bak', readFileSync(rel));
    writeFileSync(rel, body);
    ok(rel + (existed ? ' (replaced, .bak kept)' : ' (new)'));
    wrote++;
  } catch (e) { bad(rel + ' — ' + e.message); failed++; }
}

console.log('\nTargeted edits:');
for (const e of EDITS) {
  try {
    if (!existsSync(e.file)) { bad(e.file + ' — not found'); failed++; continue; }
    let s = readFileSync(e.file, 'utf8');
    if (e.already && s.includes(e.already)) { skip(e.file + ' (already applied)'); skipped++; continue; }
    const n = s.split(e.find).length - 1;
    if (n !== 1) { bad(e.file + ' — expected its anchor line once, found ' + n); failed++; continue; }
    writeFileSync(e.file + '.bak', s);
    writeFileSync(e.file, s.replace(e.find, e.replace));
    ok(e.file);
    wrote++;
  } catch (err) { bad(e.file + ' — ' + err.message); failed++; }
}

console.log('\nFavicon:');
try {
  const f = 'web/index.html';
  let s = readFileSync(f, 'utf8');
  if (s.includes('/brand/favicon')) { skip(f + ' (already applied)'); skipped++; }
  else {
    const line = s.split('\n').find((l) => l.includes("<link rel=\"icon\" href=\"data:image/svg+xml"));
    if (!line) { bad(f + ' — could not find the existing <link rel="icon"> line'); failed++; }
    else {
      writeFileSync(f + '.bak', s);
      writeFileSync(f, s.replace(line + '\n', "    <link rel=\"icon\" type=\"image/png\" sizes=\"32x32\" href=\"/brand/favicon-32.png\" />\n    <link rel=\"icon\" type=\"image/png\" sizes=\"256x256\" href=\"/brand/favicon.png\" />\n    <link rel=\"apple-touch-icon\" href=\"/brand/favicon.png\" />\n"));
      ok(f); wrote++;
    }
  }
} catch (e) { bad('web/index.html — ' + e.message); failed++; }

console.log('\nBrand images:');
for (const img of ['rvmaitech-logo.png','rvmaitech-logo-light.png','favicon.png','favicon-32.png']) {
  const p = join('web/public/brand', img);
  if (existsSync(p)) ok(p);
  else { bad(p + ' — MISSING. Extract brand-assets.tar.gz into web/ first.'); failed++; }
}

console.log(`\nDone. ${wrote} changed, ${skipped} skipped, ${failed} failed.`);
if (failed) { console.log('Nothing was rolled back — each file it touched has a .bak beside it.'); process.exit(1); }
console.log('Next: cd web && npm run dev   (then hard-reload with Ctrl+Shift+R)');
