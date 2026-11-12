#!/usr/bin/env node
/**
 * Cross-version test runner.
 *
 * `npm test` used to be `node --test --test-force-exit tests/unit/*.test.js …`,
 * which quietly required Node 22: `--test-force-exit` does not exist before
 * then, and `node --test` only learned to expand glob patterns in Node 21.
 * On anything older the command fails with `bad option` or finds no tests —
 * a confusing failure that has nothing to do with the code under test.
 *
 * This discovers the files itself and passes explicit paths, so glob support
 * is irrelevant, and adds `--test-force-exit` only where it exists.
 *
 *   node tests/run.js unit http
 *   node tests/run.js integration
 */
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const TESTS_DIR = __dirname;
const PROJECT_DIR = path.join(__dirname, '..');

const requested = process.argv.slice(2);
if (requested.length === 0) {
  console.error('usage: node tests/run.js <dir> [<dir>...]   e.g. unit http');
  process.exit(1);
}

const files = [];
for (const dir of requested) {
  const abs = path.join(TESTS_DIR, dir);
  if (!fs.existsSync(abs)) {
    console.error(`[run] no such test directory: tests/${dir}`);
    process.exit(1);
  }
  for (const entry of fs.readdirSync(abs).sort()) {
    if (entry.endsWith('.test.js')) {
      // Relative to the project directory, so failure output stays readable.
      files.push(path.join('tests', dir, entry));
    }
  }
}

if (files.length === 0) {
  console.error(`[run] found no *.test.js files in: ${requested.join(', ')}`);
  process.exit(1);
}

const major = Number(process.versions.node.split('.')[0]);

if (major < 18) {
  console.error(
    `[run] Node ${process.versions.node} is too old — the test runner needs Node 18 or newer.\n` +
      '      The application itself also expects a current Node; please upgrade.'
  );
  process.exit(1);
}

const args = ['--test'];

/**
 * Without this the runner can sit waiting on handles a test left open (a
 * Redis socket, a Mongoose pool) instead of exiting. It landed in Node 22, so
 * on older versions we fall back to a watchdog below.
 */
const hasForceExit = major >= 22;
if (hasForceExit) args.push('--test-force-exit');

args.push(...files);

console.log(`[run] Node ${process.versions.node} — ${files.length} test file(s)`);
if (!hasForceExit) {
  console.log('[run] Node < 22: --test-force-exit unavailable, using a watchdog instead');
}

const child = spawn(process.execPath, args, { stdio: 'inherit', cwd: PROJECT_DIR });

// Watchdog for older Node: if the suite has clearly finished but the process
// is being held open, stop waiting rather than hanging a CI job forever.
let watchdog = null;
if (!hasForceExit) {
  const LIMIT_MS = Number(process.env.TEST_TIMEOUT_MS || 10 * 60 * 1000);
  watchdog = setTimeout(() => {
    console.error(`\n[run] no exit after ${Math.round(LIMIT_MS / 1000)}s — killing the runner.`);
    console.error('[run] If the tests themselves passed above, this is a lingering handle,');
    console.error('[run] not a test failure. Node 22+ handles this with --test-force-exit.');
    child.kill('SIGKILL');
    process.exit(1);
  }, LIMIT_MS);
  watchdog.unref?.();
}

child.on('exit', (code, signal) => {
  if (watchdog) clearTimeout(watchdog);
  if (signal) {
    console.error(`[run] test process terminated by ${signal}`);
    process.exit(1);
  }
  process.exit(code ?? 1);
});

child.on('error', (err) => {
  if (watchdog) clearTimeout(watchdog);
  console.error(`[run] could not start the test process: ${err.message}`);
  process.exit(1);
});
