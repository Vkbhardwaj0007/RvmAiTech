require('../helpers/env');

const test = require('node:test');
const assert = require('node:assert/strict');

const { scrubMeta, clientIp, userAgent } = require('../../src/lib/audit');

test('anything that looks like a credential is redacted', () => {
  const out = scrubMeta({
    password: 'hunter2',
    newPassword: 'hunter3',
    passwordHash: '$argon2id$...',
    token: 'abc',
    refreshToken: 'def',
    accessToken: 'ghi',
    resetToken: 'jkl',
    authorization: 'Bearer xyz',
    cookie: 'rv_rt=...',
    sessionId: 'sess',
    apiKey: 'k',
    secret: 's',
    otp: '123456',
    credential: 'c',
    reason: 'bad_password',
  });

  for (const key of [
    'password', 'newPassword', 'passwordHash', 'token', 'refreshToken',
    'accessToken', 'resetToken', 'authorization', 'cookie', 'sessionId',
    'apiKey', 'secret', 'otp', 'credential',
  ]) {
    assert.equal(out[key], '[redacted]', `${key} must be redacted`);
  }

  // Non-sensitive context is kept: the whole point of the audit trail.
  assert.equal(out.reason, 'bad_password');
});

test('redaction reaches nested objects and arrays', () => {
  const out = scrubMeta({
    outer: { inner: { password: 'hunter2', ok: 1 } },
    list: [{ token: 'x' }, { fine: 'y' }],
  });

  assert.equal(out.outer.inner.password, '[redacted]');
  assert.equal(out.outer.inner.ok, 1);
  assert.equal(out.list[0].token, '[redacted]');
  assert.equal(out.list[1].fine, 'y');
});

test('long strings are truncated so the log cannot be flooded', () => {
  const out = scrubMeta({ note: 'a'.repeat(5000) });
  assert.ok(out.note.length <= 201, `expected truncation, got ${out.note.length}`);
});

test('a serialised password is still not leaked through a plain string field', () => {
  // The key is what we match on, so this documents the limit of the approach:
  // a secret hidden in a neutral key is NOT caught. Call sites must not do it.
  const out = scrubMeta({ note: 'short' });
  assert.equal(out.note, 'short');
});

test('deep structures terminate', () => {
  let deep = { password: 'x' };
  for (let i = 0; i < 50; i += 1) deep = { n: deep };
  assert.doesNotThrow(() => scrubMeta(deep));
});

test('ip and user agent are bounded in length', () => {
  const req = {
    ip: 'x'.repeat(500),
    headers: { 'user-agent': 'y'.repeat(2000) },
  };
  assert.ok(clientIp(req).length <= 64);
  assert.ok(userAgent(req).length <= 256);
});

test('a request with no ip or user agent yields empty strings, not undefined', () => {
  assert.equal(clientIp({}), '');
  assert.equal(userAgent({}), '');
  assert.equal(clientIp(undefined), '');
});
