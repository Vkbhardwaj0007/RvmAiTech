require('../helpers/env');

const test = require('node:test');
const assert = require('node:assert/strict');
const bcrypt = require('bcryptjs');

const {
  hashPassword,
  verifyPassword,
  dummyVerify,
  passwordProblems,
  isArgon2Hash,
  isBcryptHash,
} = require('../../src/lib/passwords');

test('passwords are stored as Argon2id, never in plain text', async () => {
  const plain = 'a-perfectly-fine-passphrase';
  const hash = await hashPassword(plain);

  assert.ok(isArgon2Hash(hash), 'hash should be an Argon2 encoded string');
  assert.match(hash, /^\$argon2id\$/, 'must be the id variant, not argon2i or argon2d');
  assert.ok(!hash.includes(plain), 'the plaintext must not appear in the hash');
});

test('the same password hashes differently every time (unique salts)', async () => {
  const a = await hashPassword('identical-password-value');
  const b = await hashPassword('identical-password-value');

  assert.notEqual(a, b, 'two hashes of one password must differ');
  assert.ok((await verifyPassword('identical-password-value', a)).ok);
  assert.ok((await verifyPassword('identical-password-value', b)).ok);
});

test('verification accepts the right password and rejects everything else', async () => {
  const hash = await hashPassword('correct-horse-battery');

  assert.equal((await verifyPassword('correct-horse-battery', hash)).ok, true);
  assert.equal((await verifyPassword('correct-horse-batter', hash)).ok, false);
  assert.equal((await verifyPassword('Correct-Horse-Battery', hash)).ok, false);
  assert.equal((await verifyPassword('', hash)).ok, false);
});

test('legacy bcrypt hashes still authenticate, and are flagged for upgrade', async () => {
  // Exactly what the previous version of the app wrote: bcrypt, 10 rounds.
  const legacy = await bcrypt.hash('old-account-password', await bcrypt.genSalt(10));
  assert.ok(isBcryptHash(legacy));

  const good = await verifyPassword('old-account-password', legacy);
  assert.equal(good.ok, true, 'existing admins must not be locked out');
  assert.equal(good.needsRehash, true, 'and the hash must be marked for upgrade');

  const bad = await verifyPassword('wrong', legacy);
  assert.equal(bad.ok, false);
  assert.equal(bad.needsRehash, false);
});

test('an Argon2id hash at current parameters does not ask to be rehashed', async () => {
  const hash = await hashPassword('steady-state-password');
  const { ok, needsRehash } = await verifyPassword('steady-state-password', hash);
  assert.equal(ok, true);
  assert.equal(needsRehash, false);
});

test('SHA-256 and other non-password digests are rejected, not accepted', async () => {
  // Guards against a regression to "just hash it with sha256".
  const sha = require('node:crypto').createHash('sha256').update('hunter2').digest('hex');

  for (const stored of [sha, 'hunter2', '', null, undefined, 42, {}]) {
    const { ok } = await verifyPassword('hunter2', stored);
    assert.equal(ok, false, `must not authenticate against ${JSON.stringify(stored)}`);
  }
});

test('a corrupt stored hash is an auth failure, not a thrown error', async () => {
  const { ok } = await verifyPassword('anything', '$argon2id$v=19$m=8,t=1,p=1$truncated');
  assert.equal(ok, false);
});

test('dummyVerify always fails but does real work (timing equalisation)', async () => {
  const result = await dummyVerify();
  assert.deepEqual(result, { ok: false, needsRehash: false });

  // It must cost something; a zero-cost stub would reintroduce the timing
  // oracle it exists to remove.
  const start = process.hrtime.bigint();
  await dummyVerify();
  const micros = Number(process.hrtime.bigint() - start) / 1000;
  assert.ok(micros > 100, `expected real hashing work, took ${micros.toFixed(0)}µs`);
});

/* ------------------------------------------------------------------- policy */

test('policy rejects passwords that are too short', () => {
  assert.ok(passwordProblems('short').length > 0);
  assert.ok(passwordProblems('elevenchars').length > 0, '11 characters is below the 12 minimum');
  assert.equal(passwordProblems('twelvecharsxx').length, 0);
});

test('policy rejects absurdly long passwords (hashing-cost denial of service)', () => {
  assert.ok(passwordProblems('a'.repeat(200)).length > 0);
});

test('policy rejects common and repeated passwords', () => {
  for (const bad of ['password1234', 'admin@12345', 'aaaaaaaaaaaaaa', 'rvmaitech@123']) {
    assert.ok(passwordProblems(bad).length > 0, `${bad} should be refused`);
  }
});

test('policy rejects a password containing the user id or name', () => {
  const problems = passwordProblems('rvmaitech-admin-2026', { 'user ID': 'rvmaitech' });
  assert.ok(problems.some((p) => /must not contain/.test(p)));

  assert.equal(
    passwordProblems('unrelated-good-passphrase', { 'user ID': 'rvmaitech' }).length,
    0
  );
});

test('policy accepts a reasonable passphrase', () => {
  assert.deepEqual(passwordProblems('rolling thunder marmalade 7'), []);
});
