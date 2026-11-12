/**
 * Regression cover for the public forms.
 *
 * The new schemas are strict (unknown keys rejected), which is what closes off
 * mass assignment — but it also means a mismatch between a form's payload and
 * its schema turns into a 400 for real users. These tests assert the payloads
 * the existing React forms actually send still work, alongside the hardening.
 */
const { request, app, fakeQuery, fakeUser } = require('../helpers/http');

const test = require('node:test');
const assert = require('node:assert/strict');
const { mock } = require('node:test');

const ContactMessage = require('../../src/models/ContactMessage');
const SiteContent = require('../../src/models/SiteContent');
const AuthEvent = require('../../src/models/AuthEvent');
const User = require('../../src/models/User');
const { signAccessToken } = require('../../src/lib/tokens');

let ipN = 0;
function freshIp() {
  ipN += 1;
  return `192.0.2.${(ipN % 250) + 1}`;
}

test.beforeEach(() => {
  mock.method(AuthEvent, 'create', async () => ({}));
});

test.afterEach(() => {
  mock.restoreAll();
});

/* ------------------------------------------------------------ contact form */

test('the contact form payload the React page sends is accepted', async () => {
  let created = null;
  mock.method(ContactMessage, 'create', async (doc) => {
    created = doc;
    return { ...doc, _id: 'abc' };
  });

  // Exactly the shape of Contact.jsx's `form` state, blanks included.
  const res = await request(app())
    .post('/api/contact')
    .set('X-Forwarded-For', freshIp())
    .send({ name: 'Asha Rao', email: '', phone: '', subject: '', message: '' });

  assert.equal(res.status, 201, `contact form must still work, got ${res.status}`);
  assert.equal(created.name, 'Asha Rao');
});

test('a fully populated contact submission is accepted and normalised', async () => {
  let created = null;
  mock.method(ContactMessage, 'create', async (doc) => {
    created = doc;
    return { ...doc, _id: 'abc' };
  });

  const res = await request(app())
    .post('/api/contact')
    .set('X-Forwarded-For', freshIp())
    .send({
      name: '  Asha Rao  ',
      email: 'ASHA@Example.COM',
      phone: '+91 90000 00000',
      subject: 'Automation enquiry',
      message: 'We would like to discuss a project.',
    });

  assert.equal(res.status, 201);
  assert.equal(created.name, 'Asha Rao', 'whitespace should be trimmed');
  assert.equal(created.email, 'asha@example.com', 'email should be lower-cased');
});

test('the contact form rejects a missing name and a bad email', async () => {
  mock.method(ContactMessage, 'create', async (doc) => doc);

  const noName = await request(app())
    .post('/api/contact')
    .set('X-Forwarded-For', freshIp())
    .send({ name: '', email: '', phone: '', subject: '', message: '' });
  assert.equal(noName.status, 400);

  const badEmail = await request(app())
    .post('/api/contact')
    .set('X-Forwarded-For', freshIp())
    .send({ name: 'Asha', email: 'not-an-email', phone: '', subject: '', message: '' });
  assert.equal(badEmail.status, 400);
});

test('the contact form caps field lengths', async () => {
  mock.method(ContactMessage, 'create', async (doc) => doc);

  const res = await request(app())
    .post('/api/contact')
    .set('X-Forwarded-For', freshIp())
    .send({ name: 'Asha', message: 'x'.repeat(6000), email: '', phone: '', subject: '' });

  assert.equal(res.status, 400, 'an unbounded message field is a database-filling lever');
});

test('reading the contact inbox requires admin auth', async () => {
  const res = await request(app()).get('/api/contact');
  assert.equal(res.status, 401);
});

test('the contact form is rate limited', async () => {
  mock.method(ContactMessage, 'create', async (doc) => doc);

  const ip = '192.0.2.251';
  let limited = false;

  for (let i = 0; i < 15; i += 1) {
    // eslint-disable-next-line no-await-in-loop
    const res = await request(app())
      .post('/api/contact')
      .set('X-Forwarded-For', ip)
      .send({ name: 'Spammer', email: '', phone: '', subject: '', message: 'buy things' });

    if (res.status === 429) {
      limited = true;
      assert.ok(res.headers['retry-after']);
      break;
    }
  }

  assert.ok(limited, 'an unthrottled form that sends email is a spam relay');
});

/* -------------------------------------------------------------- site content */

test('the admin site-content payload is accepted', async () => {
  const user = fakeUser();
  mock.method(User, 'findById', () => fakeQuery(user));

  let written = null;
  mock.method(SiteContent, 'findOneAndUpdate', (filter, update) => {
    written = { filter, update };
    return fakeQuery({});
  });

  // Exactly what SettingsAdmin.jsx / PagesAdmin.jsx send.
  const res = await request(app())
    .put('/api/site')
    .set('X-Forwarded-For', freshIp())
    .set('Authorization', `Bearer ${signAccessToken(user)}`)
    .send({ key: 'social', value: { linkedin: 'https://example.com' } });

  assert.equal(res.status, 200, `settings save must still work, got ${res.status}`);
  assert.equal(written.filter.key, 'social');
});

test('site content keys are constrained to a safe alphabet', async () => {
  const user = fakeUser();
  mock.method(User, 'findById', () => fakeQuery(user));
  mock.method(SiteContent, 'findOneAndUpdate', () => fakeQuery({}));

  for (const key of ['', 'has space', 'a'.repeat(100), '../etc/passwd', 'key;drop']) {
    // eslint-disable-next-line no-await-in-loop
    const res = await request(app())
      .put('/api/site')
      .set('X-Forwarded-For', freshIp())
      .set('Authorization', `Bearer ${signAccessToken(user)}`)
      .send({ key, value: 'x' });

    assert.equal(res.status, 400, `key ${JSON.stringify(key)} should be refused`);
  }
});

test('writing site content requires admin auth', async () => {
  const res = await request(app())
    .put('/api/site')
    .set('X-Forwarded-For', freshIp())
    .send({ key: 'social', value: {} });

  assert.equal(res.status, 401);
});

test('reading site content stays public', async () => {
  mock.method(SiteContent, 'find', () => fakeQuery([{ key: 'social', value: {} }]));

  const res = await request(app()).get('/api/site').expect(200);
  assert.ok(res.body.content, 'the public site needs this endpoint');
});

/* ---------------------------------------------------------------- menu etc. */

test('the public menu and health endpoints still work', async () => {
  const menu = await request(app()).get('/api/menu').expect(200);
  assert.ok(Array.isArray(menu.body.menu));
  assert.ok(menu.body.menu.length > 0);

  const health = await request(app()).get('/api/health').expect(200);
  assert.equal(health.body.ok, true);
});
