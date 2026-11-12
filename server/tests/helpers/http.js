require('./env');

/**
 * One trusted proxy hop, so a test can choose its own client IP with
 * X-Forwarded-For and therefore get its own rate-limit bucket. Without this
 * every supertest request arrives from 127.0.0.1 and the tests exhaust each
 * other's budgets.
 *
 * That this header is only believed because TRUST_PROXY says so is itself
 * tested — see tests/http/proxy.test.js.
 */
process.env.TRUST_PROXY = '1';

const mongoose = require('mongoose');

/**
 * No MongoDB in these tests.
 *
 * Turning off command buffering makes any un-mocked database call fail
 * immediately instead of hanging for bufferTimeoutMS. That keeps the suite
 * fast and, more usefully, makes an accidental real query an obvious error
 * rather than a mysterious timeout.
 */
mongoose.set('bufferCommands', false);

const request = require('supertest');

function app() {
  // Required lazily so env is set first.
  return require('../../src/app');
}

/** A Mongoose Query stand-in: awaitable and chainable through .select(). */
function fakeQuery(value) {
  const promise = Promise.resolve(value);
  const chain = {
    select: () => chain,
    lean: () => chain,
    sort: () => chain,
    limit: () => chain,
    then: (res, rej) => promise.then(res, rej),
    catch: (rej) => promise.catch(rej),
    finally: (f) => promise.finally(f),
  };
  return chain;
}

/** A user document stand-in, with the methods the controllers call. */
function fakeUser(overrides = {}) {
  const user = {
    _id: '507f1f77bcf86cd799439011',
    name: 'Admin',
    userId: 'admin',
    email: 'admin@rvmaitech.com',
    role: 'admin',
    tokenVersion: 0,
    passwordHash: '$argon2id$placeholder',
    checkPassword: async () => ({ ok: false, needsRehash: false }),
    upgradeHash: async () => {},
    save: async () => user,
    toSafe() {
      return {
        _id: this._id,
        name: this.name,
        userId: this.userId,
        email: this.email,
        role: this.role,
      };
    },
    ...overrides,
  };
  return user;
}

module.exports = { request, app, fakeQuery, fakeUser };
