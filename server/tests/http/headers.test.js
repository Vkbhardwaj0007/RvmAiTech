const { request, app } = require('../helpers/http');

const test = require('node:test');
const assert = require('node:assert/strict');

test('security headers are present on API responses', async () => {
  const res = await request(app()).get('/api/health').expect(200);

  assert.match(res.headers['content-security-policy'] || '', /default-src 'self'/);
  assert.equal(res.headers['x-content-type-options'], 'nosniff');
  assert.equal(res.headers['x-frame-options'], 'DENY');
  assert.match(res.headers['referrer-policy'] || '', /strict-origin/);
  assert.equal(res.headers['x-powered-by'], undefined, 'must not advertise Express');
});

test("the CSP does not allow inline scripts", async () => {
  const res = await request(app()).get('/api/health').expect(200);
  const csp = res.headers['content-security-policy'];

  const scriptSrc = csp.split(';').map((s) => s.trim()).find((s) => s.startsWith('script-src'));
  assert.ok(scriptSrc, 'script-src must be set explicitly');
  assert.ok(!scriptSrc.includes("'unsafe-inline'"), `script-src must not allow inline: ${scriptSrc}`);
  assert.ok(!scriptSrc.includes("'unsafe-eval'"), `script-src must not allow eval: ${scriptSrc}`);
});

test('object-src and frame-ancestors are locked down', async () => {
  const csp = (await request(app()).get('/api/health')).headers['content-security-policy'];
  assert.match(csp, /object-src 'none'/);
  assert.match(csp, /frame-ancestors 'none'/);
});

test('HSTS is not sent outside production', async () => {
  // Sending HSTS from a dev or staging host can lock a browser out of plain
  // http for that whole domain.
  const res = await request(app()).get('/api/health');
  assert.equal(res.headers['strict-transport-security'], undefined);
});

test('uploaded files are served under a locked-down policy', async () => {
  // Hits the /uploads header middleware. SVG uploads are allowed, so this
  // policy is what stops a malicious SVG becoming stored XSS.
  const res = await request(app()).get('/uploads/does-not-exist.svg');

  assert.match(res.headers['content-security-policy'] || '', /default-src 'none'/);
  assert.match(res.headers['content-security-policy'] || '', /sandbox/);
  assert.equal(res.headers['x-content-type-options'], 'nosniff');
});

/* -------------------------------------------------------------------- CORS */

test('an allowlisted origin is accepted with credentials', async () => {
  const res = await request(app())
    .get('/api/health')
    .set('Origin', 'http://localhost:5173')
    .expect(200);

  assert.equal(res.headers['access-control-allow-origin'], 'http://localhost:5173');
  assert.equal(res.headers['access-control-allow-credentials'], 'true');
});

test('an unknown origin gets no CORS grant', async () => {
  const res = await request(app()).get('/api/health').set('Origin', 'https://evil.example');

  assert.notEqual(res.headers['access-control-allow-origin'], 'https://evil.example');
  assert.notEqual(res.headers['access-control-allow-origin'], '*');
});

test('the wildcard origin is never sent', async () => {
  for (const origin of ['http://localhost:5173', 'https://evil.example', undefined]) {
    const req = request(app()).get('/api/health');
    if (origin) req.set('Origin', origin);
    // eslint-disable-next-line no-await-in-loop
    const res = await req;
    assert.notEqual(
      res.headers['access-control-allow-origin'],
      '*',
      'a wildcard origin with credentials would let any site read authenticated responses'
    );
  }
});

test('preflight advertises the CSRF header the client needs', async () => {
  const res = await request(app())
    .options('/api/auth/refresh')
    .set('Origin', 'http://localhost:5173')
    .set('Access-Control-Request-Method', 'POST')
    .set('Access-Control-Request-Headers', 'x-csrf-token');

  assert.ok(res.status < 400, `preflight should succeed, got ${res.status}`);
  assert.match((res.headers['access-control-allow-headers'] || '').toLowerCase(), /x-csrf-token/);
});

/* ------------------------------------------------------- bodies and errors */

test('malformed JSON is a 400, not a 500, and leaks nothing', async () => {
  const res = await request(app())
    .post('/api/auth/login')
    .set('Content-Type', 'application/json')
    .send('{"userId": "admin", oops}');

  assert.equal(res.status, 400);
  assert.match(res.body.message, /not valid JSON/i);
  assert.ok(!JSON.stringify(res.body).includes('at JSON.parse'), 'no stack trace');
});

test('an oversized body is refused with 413', async () => {
  const res = await request(app())
    .post('/api/auth/login')
    .set('Content-Type', 'application/json')
    .send(JSON.stringify({ userId: 'admin', password: 'x'.repeat(200 * 1024) }));

  assert.equal(res.status, 413);
});

test('an unknown route is a clean 404', async () => {
  const res = await request(app()).get('/api/not-a-real-route').expect(404);
  assert.deepEqual(res.body, { message: 'Route not found' });
});

test('error responses never contain a stack trace or internal paths', async () => {
  const probes = [
    request(app()).get('/api/not-a-real-route'),
    request(app()).post('/api/auth/login').send({}),
    request(app()).post('/api/auth/login').set('Content-Type', 'application/json').send('{bad'),
  ];

  for (const probe of probes) {
    // eslint-disable-next-line no-await-in-loop
    const res = await probe;
    const body = JSON.stringify(res.body);

    assert.ok(!/\/home\/|\/var\/|node_modules/.test(body), `leaked a path: ${body}`);
    assert.ok(!/at .*\(.*:\d+:\d+\)/.test(body), `leaked a stack frame: ${body}`);
    assert.ok(!/mongodb(\+srv)?:\/\//.test(body), `leaked a connection string: ${body}`);
    assert.ok(!/MongoError|MongooseError|ECONNREFUSED/.test(body), `leaked an internal error: ${body}`);
  }
});
