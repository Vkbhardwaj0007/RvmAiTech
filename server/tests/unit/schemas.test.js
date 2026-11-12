require('../helpers/env');

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  loginSchema,
  forgotSchema,
  resetSchema,
  createUserSchema,
  setPasswordSchema,
  contactSchema,
  idParamSchema,
} = require('../../src/lib/schemas');

/* ------------------------------------------------- NoSQL operator injection */

test('login rejects an operator object where a user id belongs', () => {
  // The canonical NoSQL auth bypass: turn findOne({userId}) into "any user".
  const attacks = [
    { userId: { $ne: null }, password: 'whatever-value' },
    { userId: { $gt: '' }, password: 'whatever-value' },
    { userId: { $regex: '.*' }, password: 'whatever-value' },
    { userId: ['admin'], password: 'whatever-value' },
    { userId: 'admin', password: { $ne: null } },
    { userId: 'admin', password: { $gt: '' } },
  ];

  for (const body of attacks) {
    const result = loginSchema.safeParse(body);
    assert.equal(result.success, false, `must reject ${JSON.stringify(body)}`);
  }
});

test('login requires both fields and says so without leaking anything', () => {
  assert.equal(loginSchema.safeParse({}).success, false);
  assert.equal(loginSchema.safeParse({ userId: 'admin' }).success, false);
  assert.equal(loginSchema.safeParse({ password: 'x'.repeat(12) }).success, false);
  assert.equal(loginSchema.safeParse({ userId: '', password: '' }).success, false);
  assert.equal(loginSchema.safeParse(null).success, false);
});

test('login rejects unknown fields, closing off mass assignment', () => {
  const result = loginSchema.safeParse({
    userId: 'admin',
    password: 'a-good-password',
    role: 'superadmin',
    tokenVersion: 0,
  });
  assert.equal(result.success, false, 'strict schema must refuse extra keys');
});

test('login normalises the user id: trimmed and lower-cased', () => {
  const result = loginSchema.safeParse({ userId: '  ADMIN  ', password: 'a-good-password' });
  assert.equal(result.success, true);
  assert.equal(result.data.userId, 'admin');
});

test('user ids are restricted to a safe alphabet', () => {
  const bad = [
    'ad min', // internal whitespace
    'ad\nmin', // embedded newline: log / header injection
    'admin;drop', // punctuation used in injection payloads
    'ad', // too short
    'a'.repeat(101), // too long
    '<script>x</script>',
    'admin\u0000', // NUL byte
    'admin%0d%0a',
  ];
  for (const userId of bad) {
    assert.equal(
      loginSchema.safeParse({ userId, password: 'a-good-password' }).success,
      false,
      `must reject user id ${JSON.stringify(userId)}`
    );
  }

  // Surrounding whitespace, including a trailing newline, is stripped rather
  // than rejected — so nothing unsafe survives into the query or the logs.
  const trimmed = loginSchema.safeParse({ userId: ' admin\n', password: 'a-good-password' });
  assert.equal(trimmed.success, true);
  assert.equal(trimmed.data.userId, 'admin');

  // An email address is a valid user id — that is the existing product
  // behaviour and the admin UI says "User ID or email".
  assert.equal(
    loginSchema.safeParse({ userId: 'admin@rvmaitech.com', password: 'a-good-password' }).success,
    true
  );
});

test('an oversized password is refused before it reaches the hasher', () => {
  const result = loginSchema.safeParse({ userId: 'admin', password: 'a'.repeat(5000) });
  assert.equal(result.success, false);
});

/* ------------------------------------------------------------------- forgot */

test('forgot takes only a user id', () => {
  assert.equal(forgotSchema.safeParse({ userId: 'admin' }).success, true);
  assert.equal(forgotSchema.safeParse({ userId: { $ne: null } }).success, false);
  assert.equal(forgotSchema.safeParse({ userId: 'admin', email: 'x@y.com' }).success, false);
});

/* -------------------------------------------------------------------- reset */

test('reset requires a well-formed token and a policy-length password', () => {
  const token = 'A'.repeat(43);

  assert.equal(resetSchema.safeParse({ token, password: 'twelvecharsxx' }).success, true);
  assert.equal(resetSchema.safeParse({ token, password: 'short' }).success, false);
  assert.equal(resetSchema.safeParse({ token: 'tiny', password: 'twelvecharsxx' }).success, false);
  assert.equal(
    resetSchema.safeParse({ token: { $ne: null }, password: 'twelvecharsxx' }).success,
    false
  );
  // Characters outside base64url cannot appear in a token we issued.
  assert.equal(
    resetSchema.safeParse({ token: `${'A'.repeat(40)}%2e%2e`, password: 'twelvecharsxx' }).success,
    false
  );
});

/* -------------------------------------------------------------------- users */

test('creating a user cannot set its own role', () => {
  const result = createUserSchema.safeParse({
    userId: 'newadmin',
    password: 'a-reasonable-passphrase',
    role: 'superadmin',
  });
  assert.equal(result.success, false, 'role must not be settable from the request');
});

test('creating a user validates the optional email', () => {
  const base = { userId: 'newadmin', password: 'a-reasonable-passphrase' };

  assert.equal(createUserSchema.safeParse(base).success, true);
  assert.equal(createUserSchema.safeParse({ ...base, email: '' }).success, true);
  assert.equal(
    createUserSchema.safeParse({ ...base, email: 'Person@RvmAiTech.com' }).data.email,
    'person@rvmaitech.com',
    'email should be lower-cased'
  );

  for (const email of ['not-an-email', 'a@b', 'a@b.', '@b.com', 'a b@c.com']) {
    assert.equal(
      createUserSchema.safeParse({ ...base, email }).success,
      false,
      `must reject email ${email}`
    );
  }
});

test('setting a password enforces the minimum length server-side', () => {
  assert.equal(setPasswordSchema.safeParse({ password: 'elevenchars' }).success, false);
  assert.equal(setPasswordSchema.safeParse({ password: 'twelvecharsxx' }).success, true);
  assert.equal(setPasswordSchema.safeParse({ password: { $ne: null } }).success, false);
});

test('id parameters must be real ObjectIds', () => {
  assert.equal(idParamSchema.safeParse({ id: '507f1f77bcf86cd799439011' }).success, true);
  for (const id of ['1', 'abc', '507f1f77bcf86cd79943901', '../../etc/passwd', '']) {
    assert.equal(idParamSchema.safeParse({ id }).success, false, `must reject id ${id}`);
  }
});

/* ------------------------------------------------------------------ contact */

test('the contact form requires a name and bounds every field', () => {
  assert.equal(contactSchema.safeParse({ name: 'Asha' }).success, true);
  assert.equal(contactSchema.safeParse({}).success, false);
  assert.equal(contactSchema.safeParse({ name: '   ' }).success, false);
  assert.equal(contactSchema.safeParse({ name: 'a'.repeat(121) }).success, false);
  assert.equal(contactSchema.safeParse({ name: 'Asha', message: 'a'.repeat(5001) }).success, false);
  assert.equal(contactSchema.safeParse({ name: 'Asha', email: 'bad' }).success, false);
  assert.equal(contactSchema.safeParse({ name: 'Asha', extra: 'x' }).success, false);
});
