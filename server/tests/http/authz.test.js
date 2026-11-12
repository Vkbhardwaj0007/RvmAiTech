/**
 * Authorisation on the content routes.
 *
 * These cover the two access-control bugs found during the audit:
 *
 *   1. `GET /api/<collection>?all=1` disabled the `published` filter for
 *      anyone, so unpublished drafts were one query parameter from public.
 *   2. `GET /api/<collection>/:slug` had no `published` check at all.
 */
const { request, app, fakeQuery, fakeUser } = require('../helpers/http');

const test = require('node:test');
const assert = require('node:assert/strict');
const { mock } = require('node:test');

const Service = require('../../src/models/Service');
const User = require('../../src/models/User');
const AuthEvent = require('../../src/models/AuthEvent');
const { signAccessToken } = require('../../src/lib/tokens');

const PUBLISHED = { slug: 'live-one', title: 'Live', published: true };
const DRAFT = { slug: 'secret-one', title: 'Unreleased', published: false };

/** Captures the filter Service.find was called with. */
function stubFind(returnValue = []) {
  const calls = [];
  mock.method(Service, 'find', (filter) => {
    calls.push(filter);
    return fakeQuery(returnValue);
  });
  return calls;
}

test.beforeEach(() => {
  mock.method(AuthEvent, 'create', async () => ({}));
});

test.afterEach(() => {
  mock.restoreAll();
});

/* ------------------------------------------------------------- list route */

test('an anonymous list request is filtered to published items', async () => {
  const calls = stubFind([PUBLISHED]);

  await request(app()).get('/api/services').expect(200);

  assert.equal(calls.length, 1);
  assert.equal(calls[0].published, true, 'the published filter must be applied');
});

test('?all=1 does NOT bypass the published filter for an anonymous caller', async () => {
  const calls = stubFind([PUBLISHED]);

  const res = await request(app()).get('/api/services?all=1').expect(200);

  assert.equal(
    calls[0].published,
    true,
    'an anonymous caller must not be able to list unpublished drafts'
  );
  assert.ok(!JSON.stringify(res.body).includes('Unreleased'));
});

test('?all=1 is ignored for a caller with a forged token', async () => {
  const calls = stubFind([PUBLISHED]);
  const jwt = require('jsonwebtoken');
  const forged = jwt.sign({ sub: '507f1f77bcf86cd799439011', typ: 'access', ver: 0 }, 'wrong-secret');

  await request(app()).get('/api/services?all=1').set('Authorization', `Bearer ${forged}`).expect(200);

  assert.equal(calls[0].published, true, 'a bad token must be treated as anonymous');
});

test('?all=1 works for a signed-in admin', async () => {
  const calls = stubFind([PUBLISHED, DRAFT]);
  const user = fakeUser();
  mock.method(User, 'findById', () => fakeQuery(user));

  await request(app())
    .get('/api/services?all=1')
    .set('Authorization', `Bearer ${signAccessToken(user)}`)
    .expect(200);

  assert.equal(calls[0].published, undefined, 'an admin should see drafts too');
});

/* ----------------------------------------------------------- getOne route */

test('an unpublished item is a 404 for an anonymous caller', async () => {
  mock.method(Service, 'findOne', () => fakeQuery(DRAFT));

  const res = await request(app()).get('/api/services/secret-one');

  assert.equal(res.status, 404, 'a draft must not be readable by slug');
  assert.deepEqual(res.body, { message: 'Not found' });
});

test('a draft and a non-existent slug give the identical 404', async () => {
  mock.method(Service, 'findOne', () => fakeQuery(DRAFT));
  const draft = await request(app()).get('/api/services/secret-one');

  mock.restoreAll();
  mock.method(AuthEvent, 'create', async () => ({}));
  mock.method(Service, 'findOne', () => fakeQuery(null));
  const missing = await request(app()).get('/api/services/no-such-thing');

  assert.equal(draft.status, missing.status);
  assert.deepEqual(draft.body, missing.body, 'a 404 must not confirm that a draft exists');
});

test('a published item is readable by anyone', async () => {
  mock.method(Service, 'findOne', () => fakeQuery(PUBLISHED));

  const res = await request(app()).get('/api/services/live-one').expect(200);
  assert.equal(res.body.item.slug, 'live-one');
});

test('an admin can read an unpublished item by slug', async () => {
  mock.method(Service, 'findOne', () => fakeQuery(DRAFT));
  const user = fakeUser();
  mock.method(User, 'findById', () => fakeQuery(user));

  const res = await request(app())
    .get('/api/services/secret-one')
    .set('Authorization', `Bearer ${signAccessToken(user)}`);

  assert.equal(res.status, 200);
});

/* ------------------------------------------------------------ write routes */

test('content writes require authentication', async () => {
  for (const [method, path] of [
    ['post', '/api/services'],
    ['put', '/api/services/507f1f77bcf86cd799439011'],
    ['delete', '/api/services/507f1f77bcf86cd799439011'],
  ]) {
    // eslint-disable-next-line no-await-in-loop
    const res = await request(app())[method](path).send({ title: 'x' });
    assert.equal(res.status, 401, `${method.toUpperCase()} ${path} must require auth`);
  }
});

test('protected fields cannot be mass-assigned through a content write', async () => {
  const user = fakeUser();
  mock.method(User, 'findById', () => fakeQuery(user));

  let received = null;
  mock.method(Service, 'create', async (body) => {
    received = body;
    return { ...body, _id: 'new' };
  });
  mock.method(Service, 'exists', () => fakeQuery(null));

  await request(app())
    .post('/api/services')
    .set('Authorization', `Bearer ${signAccessToken(user)}`)
    .send({
      title: 'A service',
      _id: '507f1f77bcf86cd799439099',
      __v: 42,
      createdAt: '1999-01-01T00:00:00Z',
      updatedAt: '1999-01-01T00:00:00Z',
    });

  assert.ok(received, 'create should have been called');
  for (const field of ['_id', '__v', 'createdAt', 'updatedAt']) {
    assert.equal(received[field], undefined, `${field} must be stripped from the body`);
  }
  assert.equal(received.title, 'A service');
});

test('a malformed id on a content write is a 400, not a 500', async () => {
  const user = fakeUser();
  mock.method(User, 'findById', () => fakeQuery(user));

  const res = await request(app())
    .put('/api/services/not-an-object-id')
    .set('Authorization', `Bearer ${signAccessToken(user)}`)
    .send({ title: 'x' });

  assert.equal(res.status, 400);
});

test('operator injection in a query parameter is stripped', async () => {
  const calls = stubFind([]);

  await request(app()).get('/api/services?category[$ne]=nothing').expect(200);

  const filter = calls[0];
  assert.ok(
    filter.category === undefined || typeof filter.category === 'string',
    `category should never be an operator object, got ${JSON.stringify(filter.category)}`
  );
});
