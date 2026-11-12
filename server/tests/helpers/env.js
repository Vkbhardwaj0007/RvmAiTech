/**
 * Test environment. MUST be required before anything that reads config,
 * because config/env.js snapshots process.env at import time.
 *
 * Argon2 parameters are deliberately weak here (see config/env.js: isTest) so
 * the suite runs in seconds rather than minutes. Production parameters are
 * exercised by the config test instead.
 */
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-only-secret-not-for-production-0123456789';
process.env.CORS_ORIGIN = 'http://localhost:5173,https://rvmaitech.com';
process.env.CLIENT_URL = 'http://localhost:5173';
process.env.MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/rvmaitech_test';
process.env.TRUST_PROXY = '0';
process.env.PASSWORD_MIN_LENGTH = process.env.PASSWORD_MIN_LENGTH || '12';

// Keep the audit trail out of the way unless a test opts in.
process.env.AUDIT_RETENTION_DAYS = '1';

module.exports = {};
