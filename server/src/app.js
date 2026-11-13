/**
 * Express application assembly.
 *
 * Split out of server.js so that tests (and the Vercel entrypoint) can import
 * a fully configured app without opening a port or connecting to MongoDB.
 * server.js is now only "connect, then listen".
 */
require('./models/heroPlugin'); // must load before the models (adds per-page hero fields)

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const { config } = require('./config/env');
const { mongoSanitize } = require('./lib/sanitize');
const audit = require('./lib/audit');

const contentRouter = require('./routes/contentRoutes');

const Service = require('./models/Service');
const Product = require('./models/Product');
const Project = require('./models/Project');
const SoftwareDev = require('./models/SoftwareDev');
const ErpCard = require('./models/ErpCard');
const Capability = require('./models/Capability');
const Stack = require('./models/Stack');
const Process = require('./models/Process');
const Technology = require('./models/Technology');
const Workflow = require('./models/Workflow');
const Industry = require('./models/Industry');
const Testimonial = require('./models/Testimonial');
const Stat = require('./models/Stat');
const Post = require('./models/Post');
const TeamMember = require('./models/TeamMember');
const Opening = require('./models/Opening');
const Client = require('./models/Client');

const app = express();

/* =========================
   INLINE SCRIPT HASHES
   ========================= */

function findClientDist() {
  const candidates = [
    path.resolve(__dirname, '../../web/dist'),
    path.resolve(process.cwd(), 'web/dist'),
    path.resolve(process.cwd(), 'dist'),
    path.resolve(__dirname, '../web/dist'),
    path.resolve(__dirname, '../../../web/dist'),
  ];
  for (const c of candidates) {
    if (fs.existsSync(path.join(c, 'index.html'))) {
      return c;
    }
  }
  return null;
}

const CLIENT_DIST = findClientDist() || path.resolve(__dirname, '../../web/dist');

/**
 * When this server also serves the built frontend, its index.html contains an
 * inline `application/ld+json` block (SEO structured data). CSP applies to
 * that block, so a strict `script-src` would silently drop it and quietly
 * damage search results.
 *
 * Rather than adding 'unsafe-inline' — which would defeat most of the point of
 * having a CSP — we hash each inline block at boot and allow exactly those.
 * New builds are picked up on restart; a changed block whose hash is missing
 * simply stops working, which is a visible failure rather than a silent
 * weakening.
 */
function inlineScriptHashes() {
  if (!config.serveClient) return [];

  const indexFile = path.join(CLIENT_DIST, 'index.html');
  if (!fs.existsSync(indexFile)) return [];

  try {
    const html = fs.readFileSync(indexFile, 'utf8');
    const hashes = [];

    // Inline <script> blocks only: those with a src attribute are covered by
    // the origin allowlist instead.
    const pattern = /<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi;
    for (const match of html.matchAll(pattern)) {
      const body = match[1];
      if (!body.trim()) continue;
      const digest = crypto.createHash('sha256').update(body, 'utf8').digest('base64');
      hashes.push(`'sha256-${digest}'`);
    }

    if (hashes.length) {
      console.log(`CSP: allowing ${hashes.length} inline script block(s) from web/dist by hash`);
    }
    return hashes;
  } catch (err) {
    console.error('CSP: could not hash inline scripts: %s', err.message);
    return [];
  }
}

const INLINE_SCRIPT_HASHES = inlineScriptHashes();

/* =========================
   PROXY
   ========================= */

/**
 * An explicit hop count, never `true`.
 *
 * With `trust proxy` set to `true`, Express believes the whole
 * X-Forwarded-For chain, which a client writes. Every IP-based rate limit
 * then becomes bypassable by adding a header. TRUST_PROXY must be the number
 * of proxies actually in front of this app (Nginx = 1, Render/Railway = 1).
 */
app.set('trust proxy', config.trustProxy);

// Do not advertise the framework.
app.disable('x-powered-by');

/* =========================
   SECURITY HEADERS
   ========================= */

const SELF = "'self'";

app.use(
  helmet({
    /**
     * CSP. The script policy has no 'unsafe-inline': a Vite production build
     * does not need it, and leaving it out is most of the value of having a
     * CSP at all. Styles do allow inline, because the React app (framer-motion
     * in particular) sets element styles directly.
     *
     * Add any third-party origins you actually use via CSP_EXTRA_* env vars
     * rather than loosening the defaults.
     */
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        defaultSrc: [SELF],
        baseUri: [SELF],
        frameAncestors: ["'none'"],
        objectSrc: ["'none'"],
        scriptSrc: [SELF, ...INLINE_SCRIPT_HASHES, ...extra('CSP_EXTRA_SCRIPT_SRC')],
        styleSrc: [SELF, "'unsafe-inline'", ...extra('CSP_EXTRA_STYLE_SRC')],
        imgSrc: [SELF, 'data:', 'blob:', ...extra('CSP_EXTRA_IMG_SRC')],
        mediaSrc: [SELF, 'data:', 'blob:', ...extra('CSP_EXTRA_MEDIA_SRC')],
        fontSrc: [SELF, 'data:', ...extra('CSP_EXTRA_FONT_SRC')],
        connectSrc: [SELF, ...config.corsOrigins, ...extra('CSP_EXTRA_CONNECT_SRC')],
        formAction: [SELF],
        upgradeInsecureRequests: config.isProd ? [] : null,
      },
    },

    // HSTS only in production: sending it from a dev server over http is
    // pointless, and sending it from a staging host can lock a browser out of
    // plain http for that domain.
    hsts: config.isProd ? { maxAge: 31536000, includeSubDomains: true, preload: false } : false,

    // The API is JSON; nothing here should ever be framed or sniffed.
    frameguard: { action: 'deny' },
    noSniff: true,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    crossOriginResourcePolicy: { policy: 'cross-origin' }, // uploads are served to the site
    crossOriginOpenerPolicy: { policy: 'same-origin' },
  })
);

function extra(name) {
  return String(process.env[name] || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

/* =========================
   CORS
   ========================= */

/**
 * An explicit allowlist with credentials enabled.
 *
 * The previous `origin: '*'` could not be kept: the refresh cookie requires
 * `credentials: true`, and the combination of a wildcard origin and
 * credentials is rejected by browsers. Listing origins is also what stops any
 * website from calling this API with a visitor's cookies attached.
 */
const corsOptions = {
  origin(origin, callback) {
    // No Origin header: same-origin navigation, curl, server-to-server.
    if (!origin) return callback(null, true);
    const normalised = origin.replace(/\/+$/, '');
    if (config.corsOrigins.includes(normalised)) return callback(null, true);
    // Answer without CORS headers rather than throwing a 500.
    return callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
  maxAge: 600,
};

app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));

/* =========================
   PARSERS
   ========================= */

// Bounded: an unauthenticated caller should not be able to make the process
// allocate megabytes per request.
app.use(express.json({ limit: config.jsonBodyLimit }));
app.use(express.urlencoded({ extended: false, limit: config.jsonBodyLimit }));
app.use(cookieParser());

/**
 * Automatically normalizes any localhost:4000/uploads/... or absolute uploads
 * URLs in JSON responses to same-origin relative /uploads/... so images load
 * properly across any environment (Render, domain, or dev).
 */
app.use((req, res, next) => {
  const originalJson = res.json.bind(res);
  res.json = function (body) {
    if (body && typeof body === 'object') {
      try {
        const text = JSON.stringify(body);
        if (text.includes('/uploads/')) {
          const cleaned = text.replace(/https?:\/\/[a-zA-Z0-9.-]+(?::\d+)?\/uploads\//g, '/uploads/');
          return originalJson(JSON.parse(cleaned));
        }
      } catch (e) {
        // pass through
      }
    }
    return originalJson(body);
  };
  next();
});

/**
 * Strips MongoDB operators from every request. The route schemas would catch
 * these anyway on the endpoints that have them; this is the backstop for any
 * route added later without one.
 */
app.use(
  mongoSanitize((req, keys) => {
    audit.record('input.rejected', req, {
      meta: { reason: 'mongo_operator_in_input', keys: keys.slice(0, 10), route: req.path },
    });
  })
);

/* =========================
   UPLOADS
   ========================= */

const { UP } = require('./middleware/upload');

/**
 * Uploaded files are served with their own, much stricter headers.
 *
 * This matters because SVG is an allowed upload type, and an SVG is a
 * document that can carry script. Served from the application's own origin
 * under the default policy, a malicious SVG would be stored XSS against the
 * admin panel. `default-src 'none'` neutralises it, `nosniff` stops a
 * mislabelled file being re-interpreted as HTML, and the sandbox strips
 * script execution and same-origin privileges.
 */
app.use(
  '/uploads',
  (req, res, next) => {
    res.setHeader('Content-Security-Policy', "default-src 'none'; sandbox; frame-ancestors 'none'");
    res.setHeader('X-Content-Type-Options', 'nosniff');
    next();
  },
  express.static(UP, {
    index: false,
    dotfiles: 'deny',
    // Never execute anything from the upload directory.
    setHeaders: (res) => res.setHeader('X-Download-Options', 'noopen'),
  })
);

/* =========================
   HEALTH CHECK
   ========================= */

app.get('/api/health', (req, res) => {
  res.json({ ok: true, ts: Date.now() });
});

/* =========================
   SITEMAP + ROBOTS
   ========================= */

app.use('/', require('./routes/sitemapRoutes'));

/* =========================
   API ROUTES
   ========================= */

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/upload', require('./routes/uploadRoutes'));

app.use('/api/services', contentRouter(Service, 'title'));
app.use('/api/products', contentRouter(Product, 'name'));
app.use('/api/projects', contentRouter(Project, 'title'));
app.use('/api/software-development', contentRouter(SoftwareDev, 'title'));
app.use('/api/erp-cards', contentRouter(ErpCard, 'title'));
app.use('/api/capabilities', contentRouter(Capability, 'title'));
app.use('/api/stack', contentRouter(Stack, 'title'));
app.use('/api/process', contentRouter(Process, 'title'));
app.use('/api/technologies', contentRouter(Technology, 'title'));
app.use('/api/workflow', contentRouter(Workflow, 'title'));
app.use('/api/industries', contentRouter(Industry, 'title'));
app.use('/api/testimonials', contentRouter(Testimonial, 'author'));
app.use('/api/stats', contentRouter(Stat, 'label'));
app.use('/api/posts', contentRouter(Post, 'title'));
app.use('/api/team', contentRouter(TeamMember, 'name'));
app.use('/api/openings', contentRouter(Opening, 'title'));
app.use('/api/clients', contentRouter(Client, 'name'));

app.use('/api/contact', require('./routes/contactRoutes'));
app.use('/api/applications', require('./routes/applicationRoutes'));
app.use('/api/site', require('./routes/siteRoutes'));
app.use('/api/ai', require('./routes/aiRoutes'));

/* =========================
   PUBLIC MENU
   ========================= */

app.get('/api/menu', (req, res) => {
  res.json({
    menu: [
      { label: 'Home', path: '/' },
      {
        label: 'About Us',
        path: '/about',
        children: [
          { label: 'About Us', path: '/about' },
          { label: 'Our Leadership', path: '/leadership' },
          { label: 'In News', path: '/news' },
          { label: 'Careers', path: '/careers' },
        ],
      },
      { label: 'Services', path: '/services' },
      { label: 'Technologies', path: '/technologies' },
      {
        label: 'Products',
        path: '/products',
        children: [
          { label: 'All Products', path: '/products' },
          { label: 'MDMS', path: '/products?category=MDMS' },
          { label: 'Datalogger', path: '/products?category=Datalogger' },
          { label: 'Smart Parking', path: '/products?category=Smart%20Parking' },
          { label: 'Smart Home Automation', path: '/products?category=Smart%20Home%20Automation' },
        ],
      },
      { label: 'Projects', path: '/projects' },
      {
        label: 'Hardware & Software Development',
        path: '/software-development',
        children: [
          { label: 'Overview & Capabilities', path: '/software-development' },
          { label: 'What We Develop (8 Categories)', path: '/software-development#categories' },
          { label: 'Technical Capabilities Stack', path: '/software-development#stack' },
          { label: 'Our Development Process', path: '/software-development#process' },
          { label: 'Industries & Applications', path: '/software-development#industries' },
          { label: 'Featured Real Projects', path: '/software-development#projects' },
          { label: 'Technical FAQ', path: '/software-development#faq' },
          { label: 'Project Inquiry & Quote', path: '/software-development#inquiry' },
        ],
      },
      {
        label: 'More',
        path: '#',
        children: [
          { label: 'Blogs', path: '/blog' },
          { label: 'Contact', path: '/contact' },
        ],
      },
    ],
  });
});

/* =========================
   FRONTEND SERVING
   ========================= */

const resolvedClientDist = findClientDist();
if (config.serveClient !== false && resolvedClientDist) {
  app.use(express.static(resolvedClientDist));
  app.get('*', (req, res, next) => {
    if (
      req.path.startsWith('/api') ||
      req.path.startsWith('/uploads') ||
      req.path === '/sitemap.xml' ||
      req.path === '/robots.txt'
    ) {
      return next();
    }
    res.sendFile(path.join(resolvedClientDist, 'index.html'));
  });
  console.log(`Serving frontend from: ${resolvedClientDist}`);
} else {
  console.warn('⚠️ Frontend dist folder not found or SERVE_CLIENT=false');
}

/* =========================
   404 HANDLER
   ========================= */

app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

/* =========================
   ERROR HANDLER
   ========================= */

/**
 * The client gets a category and nothing else. The full error — including the
 * stack — goes to the server log, tagged with a short reference that is also
 * returned, so a user can quote it in a bug report and an operator can find
 * the matching log line.
 *
 * Specifically NOT returned any more: `err.message` for 500s (which leaked
 * Mongo connection strings and internal paths), `err.keyValue` (which leaked
 * which field collided), and Mongoose's CastError text (which named internal
 * schema paths).
 */
// eslint-disable-next-line no-unused-vars -- Express needs the 4-arg signature
app.use((err, req, res, next) => {
  const ref = crypto.randomBytes(6).toString('hex');

  console.error(
    '[error] ref=%s %s %s -> %s',
    ref,
    req.method,
    req.originalUrl,
    err?.stack || err?.message || err
  );

  // Body parser rejections: malformed JSON, body over the limit.
  if (err?.type === 'entity.too.large') {
    return res.status(413).json({ message: 'Request body is too large', ref });
  }
  if (err instanceof SyntaxError && 'body' in err) {
    return res.status(400).json({ message: 'Request body is not valid JSON', ref });
  }

  // Duplicate key. The colliding field is not named: on the user collection
  // that would confirm whether a given admin id exists.
  if (err?.code === 11000) {
    return res.status(409).json({ message: 'That value is already taken', ref });
  }

  if (err?.name === 'CastError') {
    return res.status(400).json({ message: 'Malformed request', ref });
  }

  if (err?.name === 'ValidationError') {
    // Mongoose validator messages are authored in our own schemas, so they are
    // safe to show — but only the messages, not the error object.
    const errors = {};
    for (const [field, detail] of Object.entries(err.errors || {})) {
      errors[field] = detail?.message || 'Invalid value';
    }
    return res.status(400).json({ message: 'Please check the highlighted fields', errors, ref });
  }

  return res.status(500).json({ message: 'Server error', ref });
});

module.exports = app;
