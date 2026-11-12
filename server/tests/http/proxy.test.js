/**
 * Proves that X-Forwarded-For is only believed because TRUST_PROXY says so.
 *
 * This matters because every IP-based rate limit keys on `req.ip`. With
 * `app.set('trust proxy', true)` — a very common default — a client can send
 * its own X-Forwarded-For and get a fresh rate-limit bucket on every request,
 * which silently removes the brute-force protection entirely.
 *
 * The app's own setting is asserted in tests/unit/config.test.js; this builds
 * bare Express apps to demonstrate the actual behaviour of each setting.
 */
require('../helpers/env');

const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const request = require('supertest');

function appWithTrust(value) {
  const app = express();
  app.set('trust proxy', value);
  app.get('/ip', (req, res) => res.json({ ip: req.ip }));
  return app;
}

const SPOOFED = '1.2.3.4';

test('with no trusted proxies, a spoofed X-Forwarded-For is ignored', async () => {
  const res = await request(appWithTrust(0))
    .get('/ip')
    .set('X-Forwarded-For', SPOOFED)
    .expect(200);

  assert.notEqual(res.body.ip, SPOOFED, 'the client must not be able to choose its own IP');
  assert.match(res.body.ip, /127\.0\.0\.1|::1|::ffff:127/, `got ${res.body.ip}`);
});

test('with one trusted hop, the last proxy-supplied address is used', async () => {
  const res = await request(appWithTrust(1))
    .get('/ip')
    .set('X-Forwarded-For', SPOOFED)
    .expect(200);

  // Correct behaviour when there genuinely is one proxy in front.
  assert.equal(res.body.ip, SPOOFED);
});

test('with one trusted hop, a client cannot reach past the proxy by chaining addresses', async () => {
  // A client sending "evil, real" tries to make the app read the leftmost
  // entry. With a hop count of 1, Express takes the rightmost-but-one, so the
  // client controls only the value its own proxy would have overwritten.
  const res = await request(appWithTrust(1))
    .get('/ip')
    .set('X-Forwarded-For', '9.9.9.9, 8.8.8.8')
    .expect(200);

  assert.equal(res.body.ip, '8.8.8.8', 'only the nearest hop should be honoured');
  assert.notEqual(res.body.ip, '9.9.9.9');
});

test('trusting everything lets a client pick any IP it likes', async () => {
  // Documents precisely why the app must not do this.
  const res = await request(appWithTrust(true))
    .get('/ip')
    .set('X-Forwarded-For', SPOOFED)
    .expect(200);

  assert.equal(
    res.body.ip,
    SPOOFED,
    'this is the failure mode TRUST_PROXY=<hop count> exists to avoid'
  );
});

test('the application itself defaults to zero trusted hops', () => {
  const { config } = require('../../src/config/env');
  // tests/helpers/http.js sets TRUST_PROXY=1 for the HTTP suite, so assert on
  // a freshly loaded default rather than the ambient one.
  const { load } = require('../../src/config/env');
  assert.equal(load({ JWT_SECRET: 'x'.repeat(40) }).trustProxy, 0);
  assert.equal(typeof config.trustProxy, 'number', 'never a boolean');
});
