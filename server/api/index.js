/**
 * Vercel serverless entrypoint.
 *
 * Imports the app directly (not server.js) so no listener is created, and
 * connects to MongoDB lazily, reusing the connection across warm invocations.
 */
require('dotenv').config();

const mongoose = require('mongoose');
const { assertValid, config } = require('../src/config/env');

assertValid();

const app = require('../src/app');

let connecting = null;

function ready() {
  // 1 = connected, 2 = connecting
  if (mongoose.connection.readyState === 1) return Promise.resolve();
  if (!connecting) {
    mongoose.set('strictQuery', true);
    connecting = mongoose.connect(config.mongoUri).catch((err) => {
      // Clear the memo so the next invocation retries rather than being stuck
      // with a permanently rejected promise.
      connecting = null;
      throw err;
    });
  }
  return connecting;
}

module.exports = async (req, res) => {
  try {
    await ready();
  } catch (err) {
    console.error('[vercel] mongo connect failed:', err.message);
    res.statusCode = 503;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ message: 'Service unavailable' }));
  }
  return app(req, res);
};
