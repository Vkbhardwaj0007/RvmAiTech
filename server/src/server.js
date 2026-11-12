/**
 * Process entrypoint: validate configuration, connect, listen.
 *
 * The app itself is built in app.js. Keeping them apart means the test suite
 * and the Vercel handler can use the configured app without starting a
 * listener.
 */
require('dotenv').config();

const { config, assertValid } = require('./config/env');

/**
 * Fail fast on a bad configuration.
 *
 * This is deliberately before anything else: a deployment with a placeholder
 * JWT secret, a wildcard CORS origin or insecure cookies in production should
 * refuse to start, not come up and quietly serve forgeable tokens. The old
 * behaviour — `process.env.JWT_SECRET` read inline wherever it was needed —
 * meant a missing secret produced runtime errors on the login path instead.
 */
try {
  assertValid();
} catch (err) {
  console.error(err.message);
  console.error('\nSee server/.env.example for the expected values.');
  process.exit(1);
}

const connectDB = require('./config/db');
const app = require('./app');

// Vercel imports api/index.js and runs the exported handler itself.
if (process.env.VERCEL !== '1') {
  connectDB()
    .then(() => {
      const server = app.listen(config.port, () => {
        console.log(`Rvmaitech API on http://localhost:${config.port} (${config.nodeEnv})`);
      });

      const shutdown = async (signal) => {
        console.log(`\n${signal} received — shutting down`);
        server.close(() => process.exit(0));
        // Do not wait forever for in-flight requests.
        setTimeout(() => process.exit(1), 10000).unref();
      };
      process.on('SIGTERM', () => shutdown('SIGTERM'));
      process.on('SIGINT', () => shutdown('SIGINT'));
    })
    .catch((err) => {
      console.error('Failed to start server:', err);
      process.exit(1);
    });
}

module.exports = app;
