/**
 * When this server also serves the built frontend, the strict `script-src`
 * must still allow index.html's inline JSON-LD block — by hash, not by
 * 'unsafe-inline'.
 *
 * Without this, the structured-data block is silently dropped by the browser
 * and the site's search-result markup quietly stops working.
 *
 * Runs with its own app instance (SERVE_CLIENT=true) and skips when the
 * frontend has not been built.
 */
require('../helpers/env');

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const crypto = require('node:crypto');

const DIST_INDEX = path.join(__dirname, '..', '..', '..', 'web', 'dist', 'index.html');
const built = fs.existsSync(DIST_INDEX);

test(
  'inline scripts in the built index.html are allowed by hash, not by unsafe-inline',
  { skip: built ? false : 'web/dist not built — run `npm run build` in web/' },
  async () => {
    // A separate module registry, so this app is built with SERVE_CLIENT=true
    // without disturbing the other HTTP tests.
    process.env.SERVE_CLIENT = 'true';
    for (const key of Object.keys(require.cache)) {
      if (key.includes(`${path.sep}src${path.sep}`)) delete require.cache[key];
    }

    const request = require('supertest');
    const app = require('../../src/app');

    const res = await request(app).get('/api/health').expect(200);
    const csp = res.headers['content-security-policy'];
    const scriptSrc = csp.split(';').map((s) => s.trim()).find((s) => s.startsWith('script-src'));

    assert.ok(scriptSrc, 'script-src must be present');
    assert.ok(!scriptSrc.includes("'unsafe-inline'"), 'must not fall back to unsafe-inline');

    // Independently compute what the browser will compute.
    const html = fs.readFileSync(DIST_INDEX, 'utf8');
    const expected = [];
    for (const match of html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)) {
      if (!match[1].trim()) continue;
      expected.push(crypto.createHash('sha256').update(match[1], 'utf8').digest('base64'));
    }

    assert.ok(expected.length > 0, 'the built index.html should contain an inline block');

    for (const digest of expected) {
      assert.ok(
        scriptSrc.includes(`'sha256-${digest}'`),
        `script-src must allow sha256-${digest}; got ${scriptSrc}`
      );
    }

    delete process.env.SERVE_CLIENT;
  }
);
