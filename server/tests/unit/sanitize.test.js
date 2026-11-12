require('../helpers/env');

const test = require('node:test');
const assert = require('node:assert/strict');

const { scrub, mongoSanitize } = require('../../src/lib/sanitize');

function fakeReq(parts) {
  return { body: {}, query: {}, params: {}, headers: {}, path: '/t', ...parts };
}

test('top-level MongoDB operators are removed from the body', () => {
  const req = fakeReq({ body: { userId: 'admin', $where: 'sleep(5000)' } });
  const { stripped, tooDeep } = scrub(req);

  assert.deepEqual(req.body, { userId: 'admin' });
  assert.deepEqual(stripped, ['$where']);
  assert.equal(tooDeep, false);
});

test('nested operators are removed', () => {
  const req = fakeReq({ body: { userId: { $ne: null }, nested: { deep: { $gt: '' } } } });
  scrub(req);

  assert.deepEqual(req.body, { userId: {}, nested: { deep: {} } });
});

test('operators inside arrays are removed', () => {
  const req = fakeReq({ body: { items: [{ $ne: 1 }, { ok: 2 }] } });
  scrub(req);

  assert.deepEqual(req.body, { items: [{}, { ok: 2 }] });
});

test('dotted keys are removed (they reach into subdocuments)', () => {
  const req = fakeReq({ body: { 'user.role': 'superadmin', name: 'fine' } });
  scrub(req);

  assert.deepEqual(req.body, { name: 'fine' });
});

test('query and params are scrubbed too', () => {
  const req = fakeReq({
    query: { all: '1', $where: 'x' },
    params: { id: 'abc', $ne: 'y' },
  });
  scrub(req);

  assert.deepEqual(req.query, { all: '1' });
  assert.deepEqual(req.params, { id: 'abc' });
});

test('ordinary values are left completely alone', () => {
  const body = {
    userId: 'admin',
    password: 'p@ssw0rd$with$dollars',
    price: 10.5,
    note: 'costs $5.00 — a.b.c',
    nested: { a: [1, 2, { b: 'c' }] },
    nothing: null,
    flag: false,
  };
  const req = fakeReq({ body: structuredClone(body) });
  const { stripped } = scrub(req);

  assert.deepEqual(req.body, body, 'values containing $ or . must not be touched');
  assert.deepEqual(stripped, []);
});

test('scrubbing mutates in place rather than reassigning', () => {
  // req.query is a getter in Express 5; reassigning it throws. This asserts we
  // never try.
  const query = { $where: 'x', keep: '1' };
  const req = fakeReq({ query });
  scrub(req);

  assert.equal(req.query, query, 'the same object must still be in place');
  assert.deepEqual(query, { keep: '1' });
});

test('deeply nested structures do not cause unbounded recursion', () => {
  let deep = { $bad: 1 };
  for (let i = 0; i < 400; i += 1) deep = { nest: deep };

  const req = fakeReq({ body: deep });
  assert.doesNotThrow(() => scrub(req));
});

test('nesting past the depth cap is reported, not silently passed through', () => {
  /**
   * The depth cap used to `return` quietly, which meant an operator key
   * nested below it survived untouched — the exact thing this module exists
   * to stop. It must now be reported so the request can be refused.
   */
  let deep = { $where: 'sleep(5000)' };
  for (let i = 0; i < 20; i += 1) deep = { nest: deep };

  const { tooDeep } = scrub(fakeReq({ body: deep }));
  assert.equal(tooDeep, true, 'over-deep input must be flagged');
});

test('the middleware refuses an over-deep body with 400', () => {
  let deep = { $where: 'x' };
  for (let i = 0; i < 20; i += 1) deep = { nest: deep };

  let status = null;
  let nextCalls = 0;
  const res = {
    status(code) { status = code; return this; },
    json() { return this; },
  };

  mongoSanitize()(fakeReq({ body: deep }), res, () => { nextCalls += 1; });

  assert.equal(status, 400);
  assert.equal(nextCalls, 0, 'must not forward input it could not fully inspect');
});

test('cookies are scrubbed too', () => {
  /**
   * cookie-parser always runs JSONCookies, so a cookie value beginning with
   * `j:` is JSON.parse'd and req.cookies can hold an attacker-supplied
   * object rather than a string.
   */
  const req = fakeReq({ cookies: { rv_csrf: 'abc', evil: { $ne: null } } });
  scrub(req);

  assert.deepEqual(req.cookies, { rv_csrf: 'abc', evil: {} });
});

test('prototype-reaching keys are stripped', () => {
  const req = fakeReq({
    body: JSON.parse('{"__proto__":{"polluted":true},"constructor":{"x":1},"ok":1}'),
  });
  const { stripped } = scrub(req);

  assert.equal(req.body.ok, 1);
  assert.ok(stripped.includes('constructor'));
  assert.equal({}.polluted, undefined, 'Object.prototype must be untouched');
  assert.equal(Object.keys(req.body).includes('__proto__'), false);
});

test('prototype-pollution style keys are not treated as operators but cannot pollute', () => {
  const req = fakeReq({ body: JSON.parse('{"__proto__":{"polluted":true},"ok":1}') });
  scrub(req);

  // JSON.parse does not set the prototype, so this is about not crashing and
  // not leaking into Object.prototype.
  assert.equal({}.polluted, undefined, 'Object.prototype must be untouched');
  assert.equal(req.body.ok, 1);
});

test('the middleware reports stripped keys and calls next exactly once', () => {
  const seen = [];
  const mw = mongoSanitize((req, keys) => seen.push(keys));

  let nextCalls = 0;
  const req = fakeReq({ body: { $ne: 1, $gt: 2, fine: 3 } });
  mw(req, {}, () => {
    nextCalls += 1;
  });

  assert.equal(nextCalls, 1);
  assert.deepEqual(seen, [['$ne', '$gt']]);
  assert.deepEqual(req.body, { fine: 3 });
});

test('the middleware passes a res through without touching it on clean input', () => {
  let nextCalls = 0;
  const res = {
    status() { throw new Error('must not respond on clean input'); },
  };
  mongoSanitize()(fakeReq({ body: { userId: 'admin' } }), res, () => { nextCalls += 1; });
  assert.equal(nextCalls, 1);
});

test('the middleware does not invoke the reporter when input is clean', () => {
  let called = false;
  const mw = mongoSanitize(() => {
    called = true;
  });

  mw(fakeReq({ body: { userId: 'admin' } }), {}, () => {});
  assert.equal(called, false);
});

test('a missing body does not throw', () => {
  const mw = mongoSanitize();
  let nextCalls = 0;
  mw({ headers: {} }, { status() { throw new Error("no response expected"); } }, () => {
    nextCalls += 1;
  });
  assert.equal(nextCalls, 1);
});
