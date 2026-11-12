/**
 * Shared setup for the database-backed tier.
 *
 * Uses an ephemeral in-memory MongoDB by default. Point MONGO_TEST_URI at a
 * real server to run against that instead — useful in CI images where the
 * mongodb-memory-server binary download is blocked.
 *
 *   npm run test:integration
 *   MONGO_TEST_URI=mongodb://127.0.0.1:27017/rvmaitech_test npm run test:integration
 */
require('../helpers/env');

/**
 * One trusted proxy hop, so each test can pick its own client IP with
 * X-Forwarded-For and get its own rate-limit bucket.
 *
 * Without this the app correctly ignores the header (TRUST_PROXY defaults to
 * 0), every request arrives from 127.0.0.1, and the tests exhaust each
 * other's login budget — producing spurious 429s part-way through the run.
 *
 * Must be set before src/app is required: config/env.js snapshots the
 * environment at import time.
 */
process.env.TRUST_PROXY = '1';

const mongoose = require('mongoose');

let memoryServer = null;

async function connect() {
  let uri = process.env.MONGO_TEST_URI;

  if (!uri) {
    // Required lazily so the package is only needed when it is actually used.
    const { MongoMemoryServer } = require('mongodb-memory-server');
    memoryServer = await MongoMemoryServer.create();
    uri = memoryServer.getUri();
  }

  mongoose.set('strictQuery', true);
  await mongoose.connect(uri, { dbName: 'rvmaitech_test' });

  // Indexes are what enforce uniqueness and TTL expiry, and Mongoose builds
  // them in the background by default — so tests that depend on them must wait.
  await Promise.all(
    Object.values(mongoose.models).map((model) => model.createIndexes().catch(() => {}))
  );

  return uri;
}

async function disconnect() {
  await mongoose.connection.dropDatabase().catch(() => {});
  await mongoose.disconnect();
  if (memoryServer) await memoryServer.stop();

  const { closeStore } = require('../../src/lib/rateLimitStore');
  await closeStore();
}

async function clear() {
  const { collections } = mongoose.connection;
  await Promise.all(Object.values(collections).map((c) => c.deleteMany({})));
}

module.exports = { connect, disconnect, clear, mongoose };
