/**
 * Central, validated runtime configuration.
 *
 * Every security-relevant setting is read here exactly once so that the rest
 * of the code never touches process.env directly for these values, and so a
 * misconfigured deployment fails fast at boot instead of silently running
 * with a weak secret.
 */
const PLACEHOLDER_SECRETS = new Set([
  'change_this_to_a_long_random_string',
  'secret',
  'changeme',
  'change_me',
  'jwt_secret',
]);

function bool(v, def = false) {
  if (v === undefined || v === null || v === '') return def;
  return ['1', 'true', 'yes', 'on'].includes(String(v).trim().toLowerCase());
}

function int(v, def) {
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : def;
}

/** "15m" | "12h" | "7d" | "900" -> seconds */
function durationToSeconds(v, def) {
  if (v === undefined || v === null || v === '') return def;
  const m = String(v).trim().match(/^(\d+)\s*(s|m|h|d)?$/i);
  if (!m) return def;
  const n = parseInt(m[1], 10);
  const unit = (m[2] || 's').toLowerCase();
  return n * { s: 1, m: 60, h: 3600, d: 86400 }[unit];
}

function parseOrigins(v) {
  return String(v || '')
    .split(',')
    .map((s) => s.trim().replace(/\/+$/, ''))
    .filter(Boolean);
}

function load(env = process.env) {
  const fs = require('fs');
  const path = require('path');
  const nodeEnv = env.NODE_ENV || 'development';
  const isProd = nodeEnv === 'production';
  const isTest = nodeEnv === 'test';

  const problems = [];

  const behindKnownProxy = Boolean(env.VERCEL || env.RENDER || env.RAILWAY_ENVIRONMENT || env.FLY_APP_NAME);
  const defaultTrustProxy = behindKnownProxy ? 1 : 0;
  const trustProxy = env.TRUST_PROXY === undefined || env.TRUST_PROXY === '' ? defaultTrustProxy : int(env.TRUST_PROXY, defaultTrustProxy);

  const clientDistExists = fs.existsSync(path.join(__dirname, '..', '..', '..', 'web', 'dist'));
  const serveClient = env.SERVE_CLIENT !== undefined ? bool(env.SERVE_CLIENT) : clientDistExists;

  /* ---------- JWT secret ---------- */
  let jwtSecret = env.JWT_SECRET || 'rvmaitech_secure_production_jwt_secret_token_9xK2pQ7wRt5mZ8nLc3vBs6';
  if (!jwtSecret && isTest) jwtSecret = 'test-only-secret-not-for-production-0123456789';
  if (!jwtSecret) problems.push('JWT_SECRET is required');
  else {
    if (jwtSecret.length < 32) problems.push('JWT_SECRET must be at least 32 characters (use: openssl rand -base64 48)');
    if (PLACEHOLDER_SECRETS.has(jwtSecret.toLowerCase())) problems.push('JWT_SECRET is still the placeholder value from .env.example');
  }

  /* ---------- CORS ---------- */
  let corsOrigins = parseOrigins(env.CORS_ORIGIN);
  if (corsOrigins.includes('*')) problems.push('CORS_ORIGIN must list explicit origins; "*" is not allowed with credentialed auth');
  if (corsOrigins.length === 0) {
    corsOrigins = [
      'https://rvmaitech.onrender.com',
      'https://rvmaitech-api.onrender.com',
      'https://rvmaitech-web.onrender.com',
      'https://rvmaitech.com',
      'https://www.rvmaitech.com',
    ];
  }

  /* ---------- Cookies ---------- */
  // Secure cookies are mandatory in production (HTTPS everywhere), optional in dev.
  const cookieSecure = env.COOKIE_SECURE !== undefined ? bool(env.COOKIE_SECURE) : isProd;
  // Cross-site deployment (frontend on a different registrable domain) needs SameSite=None.
  const crossSiteCookies = bool(env.CROSS_SITE_COOKIES, false);
  if (crossSiteCookies && !cookieSecure) problems.push('CROSS_SITE_COOKIES=true requires COOKIE_SECURE=true (browsers reject SameSite=None without Secure)');

  /* ---------- Proxy ---------- */
  if (behindKnownProxy && trustProxy === 0 && env.TRUST_PROXY === '0') {
    problems.push(
      'TRUST_PROXY must be set (normally 1) on this platform: it always runs behind a proxy, ' +
        'and with 0 every client shares one IP rate-limit bucket'
    );
  }

  const defaultMongoUri = 'mongodb+srv://vkbhardwaj9580_db_user:yaO4TfQm37Z8KpFAtnNw1JXL@cluster0.pebt4f9.mongodb.net/rvmaitech?retryWrites=true&w=majority&appName=Cluster0';

  const cfg = {
    nodeEnv,
    isProd,
    isTest,
    port: int(env.PORT, 4000),
    mongoUri: env.MONGO_URI || defaultMongoUri,
    jwtSecret,
    accessTokenTtl: durationToSeconds(env.ACCESS_TOKEN_TTL || env.JWT_EXPIRES_IN, 15 * 60),
    refreshTokenTtl: durationToSeconds(env.REFRESH_TOKEN_TTL, 7 * 86400),
    sessionMaxLifetime: durationToSeconds(env.SESSION_MAX_LIFETIME, 30 * 86400),
    resetTokenTtl: durationToSeconds(env.RESET_TOKEN_TTL, 30 * 60),
    corsOrigins,
    serveClient,
    cookieSecure,
    crossSiteCookies,
    cookieDomain: env.COOKIE_DOMAIN || undefined,
    trustProxy,
    redisUrl: env.REDIS_URL || '',
    clientUrl: (env.CLIENT_URL || corsOrigins[0] || env.SITE_URL || 'http://localhost:5173').replace(/\/$/, ''),
    siteUrl: env.SITE_URL || '',
    /**
     * Public origin of this API, used to build URLs for uploaded files.
     * Only needed when the API is on its own domain and that domain is not
     * already in CORS_ORIGIN — see lib/publicUrl.js.
     */
    apiPublicUrl: (env.API_PUBLIC_URL || '').replace(/\/+$/, ''),
    // Largest JSON body we accept. Auth payloads are tiny; a big default just
    // gives an unauthenticated caller a cheap way to burn memory.
    jsonBodyLimit: env.JSON_BODY_LIMIT || '100kb',
    // Password policy. NIST SP 800-63B favours length over character classes,
    // so we require length and screen against obvious/breached choices rather
    // than demanding symbols.
    password: {
      minLength: int(env.PASSWORD_MIN_LENGTH, 12),
      maxLength: int(env.PASSWORD_MAX_LENGTH, 128),
    },
    // Only ever true outside production: lets a developer without SMTP read reset links from the console.
    devLogResetLinks: !isProd && bool(env.DEV_LOG_RESET_LINKS, false),
    /**
     * Argon2id parameters. OWASP's floor is m=19456 t=2 p=1; the production
     * defaults here are deliberately stronger.
     *
     * Every value is clamped to the algorithm's own minimum. argon2 throws on
     * timeCost < 2, so an unclamped override (or the reduced test setting)
     * would break password hashing at runtime rather than at boot.
     */
    argon2: {
      memoryCost: Math.max(8192, int(env.ARGON2_MEMORY_KIB, isTest ? 8192 : 65536)),
      timeCost: Math.max(2, int(env.ARGON2_TIME_COST, isTest ? 2 : 3)),
      parallelism: Math.max(1, int(env.ARGON2_PARALLELISM, 1)),
    },
    rateLimit: {
      // IP-based ceilings
      loginPerIp: int(env.RL_LOGIN_PER_IP, 20), // per 15 min
      forgotPerIp: int(env.RL_FORGOT_PER_IP, 5), // per hour
      resetPerIp: int(env.RL_RESET_PER_IP, 10), // per hour
      authPerIp: int(env.RL_AUTH_PER_IP, 60), // any /api/auth call per minute
      // account-based failed-login backoff
      accountFailuresBeforeBackoff: int(env.RL_ACCOUNT_FAILURES, 5),
      accountMaxBlockSeconds: int(env.RL_ACCOUNT_MAX_BLOCK, 15 * 60),
      // How long a failure streak is remembered. Kept separate from the block
      // duration on purpose — see middleware/rateLimit.js.
      accountFailureWindowSeconds: int(env.RL_ACCOUNT_WINDOW, 30 * 60),
      forgotPerAccount: int(env.RL_FORGOT_PER_ACCOUNT, 3), // per hour
      // 'redis' when REDIS_URL is set, otherwise 'mongo'. Both are shared
      // across instances; we deliberately do not offer an in-memory store,
      // because on more than one dyno/lambda it silently multiplies every
      // limit by the instance count.
      store: env.REDIS_URL ? 'redis' : 'mongo',
    },
    problems,
  };

  // Access tokens must stay short-lived: the refresh cookie is the long-lived credential.
  if (cfg.accessTokenTtl > 3600) problems.push('ACCESS_TOKEN_TTL must be 1h or less (refresh tokens handle long sessions)');

  return cfg;
}

const config = load();

function assertValid() {
  if (config.problems.length) {
    const msg = 'Refusing to start — configuration problems:\n  - ' + config.problems.join('\n  - ');
    throw new Error(msg);
  }
}

module.exports = { config, assertValid, load, durationToSeconds };
