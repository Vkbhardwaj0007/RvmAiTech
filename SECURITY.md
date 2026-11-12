# RvmAiTech — Authentication & Security

How authentication works in this application, what was changed, and what you
have to do operationally.

---

## 1. Act on these first

### 1.1 Rotate the credentials that were in the shared archive

`server/.env` is correctly listed in `.gitignore` and is **not** in git
history — but it was included in the project archive, so treat everything in
it as disclosed:

| Secret | Action |
|---|---|
| `SMTP_PASS` | Revoke the Gmail app password, generate a new one |
| `JWT_SECRET` | Replace: `openssl rand -base64 48` (signs out all admins) |
| `MONGO_URI` | Rotate the Atlas database user's password |
| Admin password | Change it — the old default was published (below) |

Your previous `.env` is saved as `server/.env.backup-before-hardening`.
**Delete that file once you have migrated**, and never commit it.

### 1.2 The published default admin password

The old `README.txt` ended with `Login (content admin): admin / Admin@123`,
and `seedAdmin.js` used `Admin@123` as its fallback and printed it. Any
deployment seeded without an explicit `SEED_ADMIN_PASSWORD` has an admin
account whose password is in the repository.

Change it now, and check `AuthEvent` for `login.success` events you do not
recognise.

### 1.3 Config changes required before the server will start

The server now validates its configuration at boot and **refuses to start**
on a dangerous combination. Two existing values are rejected:

- `JWT_EXPIRES_IN=12h` → access tokens are capped at 1 hour. Use
  `ACCESS_TOKEN_TTL=15m` plus `REFRESH_TOKEN_TTL=7d`.
- `CORS_ORIGIN=*` → a wildcard origin cannot be combined with credentialed
  requests. List your origins explicitly.

Both have already been migrated in `server/.env`. Set `TRUST_PROXY` to the
number of proxies in front of the app (`1` behind Nginx, Render or Railway;
`0` if nothing).

---

## 2. How authentication works now

### 2.1 Two credentials, not one

Previously a single 12-hour JWT was stored in `localStorage` and sent as a
bearer token. It could not be revoked: a stolen token worked until it expired,
and changing a password did nothing to existing sessions.

Now:

| | Access token | Refresh token |
|---|---|---|
| Format | JWT (HS256) | opaque, 256 bits of CSPRNG output |
| Lifetime | 15 minutes | 7 days |
| Sent as | `Authorization: Bearer` | `HttpOnly` cookie, `Path=/api/auth` |
| Readable by JS | yes | **no** |
| Stored server-side | no | yes, SHA-256 only |
| Revocable | via `tokenVersion` | yes, individually |

The bearer-token flow was kept deliberately: it is what the existing admin UI
uses, so the interface did not have to be rewritten. What changed is that the
long-lived credential is no longer the one JavaScript can read.

### 2.2 Rotation and theft detection

Every refresh issues a new token and marks the old one spent. Tokens from one
sign-in share a `family` id.

If a **spent** token is presented again, two parties hold it — the real user
and whoever copied it. We cannot tell which is asking, so the entire family is
revoked and a `refresh.reuse` event is recorded. The client is told only
"Session expired", because announcing the detection helps nobody but an
attacker.

The rotation is a single conditional write (`findOneAndUpdate` on
`usedAt: null`), not a read followed by a save. This is deliberate: with
read-then-write, two requests arriving together with the same token both
observe `usedAt: null`, both mint a replacement, and an attacker racing the
real user gets a working session while reuse detection never fires. Only one
writer can match the condition, so the loser is correctly treated as a second
use. The same pattern is used to claim password-reset tokens, and both races
have integration tests that fire the requests simultaneously.

### 2.3 What invalidates a session

| Event | Access tokens | Refresh tokens |
|---|---|---|
| Password changed by the user | killed (`tokenVersion`) | revoked |
| Password changed by an admin | killed | revoked |
| Password reset via email | killed | revoked |
| User deleted | killed (lookup fails) | revoked |
| Sign out | expire in ≤15 min | that session only |
| Refresh token reuse detected | — | whole family |

`protect` reads the user on every request, which is what makes deletion and
`tokenVersion` bumps take effect immediately rather than at token expiry.

---

## 3. Password storage

**Argon2id**, with unique per-password salts, at parameters above the OWASP
floor (default `m=65536 KiB, t=3, p=1`; the floor is `m=19456, t=2, p=1`).

Existing **bcrypt** hashes still authenticate. On a successful login with a
legacy hash, the password is re-stored as Argon2id in that moment — without
bumping `tokenVersion`, because the credential has not changed, only its
encoding. Nobody has to reset their password.

What is never done: plain SHA-256 or MD5, reversible encryption, a shared
salt, logging a password, or putting one in a URL. There is a test asserting
that a SHA-256 digest in the `passwordHash` field does **not** authenticate.

### Policy

- 12–128 characters (`PASSWORD_MIN_LENGTH`, was 6)
- screened against a common-password denylist
- must not contain the user's own id or name
- enforced server-side on reset, admin creation and admin password change

Length is preferred over character-class rules, per NIST SP 800-63B. Point
`PASSWORD_DENYLIST_FILE` at a real breach corpus for production-grade
screening.

---

## 4. Account enumeration

A login failure returns exactly `{"message":"Invalid user ID or password"}`
with status 401, identically for an unknown account and a wrong password.
There is a test asserting the two responses are **byte-identical**.

Timing is also equalised: when no such account exists, the server still runs
an Argon2 verification against a throwaway hash. Without that, "unknown user"
returns much faster than "wrong password" and the timing alone enumerates
valid admin ids.

`POST /api/auth/forgot` always answers 200 with the same body — whether the
account exists, has no email on file, or is rate-limited. A 429 there would
itself confirm the account exists.

The reset endpoint uses one message for unknown, expired and already-used
tokens, because a distinct "already used" would confirm to an attacker holding
an old link that it was once valid.

---

## 5. Rate limiting

| Endpoint | Limit |
|---|---|
| `POST /auth/login` | 20 per 15 min per IP |
| `POST /auth/login` | escalating backoff per account after 5 failures |
| `POST /auth/forgot` | 5/hour per IP, 3/hour per account |
| `POST /auth/reset` | 10/hour per IP |
| any `/api/auth/*` | 60/minute per IP |
| contact form, job applications | 10/hour per IP |
| uploads | 60/hour per IP |

Exceeding a limit returns **429** with a `Retry-After` header.

**No permanent lockouts.** Account backoff doubles — 2s, 4s, 8s … — capped at
15 minutes, and clears entirely on a successful login. A permanent lockout is
itself a denial of service: anyone who knows an admin's user id could keep them
locked out for free.

The failure streak is remembered for 30 minutes (`RL_ACCOUNT_WINDOW`) in a key
*separate* from the penalty. This separation is load-bearing, and getting it
wrong is subtle: `rate-limiter-flexible`'s `block()` overwrites the key's TTL,
so a shared key meant the first 2-second backoff expired and took the whole
failure streak with it — handing an attacker the full allowance back every two
seconds, with the backoff never escalating past its first step. The first
implementation here had exactly that bug; it is now two keys, with a test that
waits for a real backoff to lapse and asserts the streak survived.

### The store is shared, and this matters

An in-memory limiter keeps a separate counter per process, so on two instances
"5 attempts" silently becomes 10, and on a serverless runtime it becomes "5 per
cold start" — effectively no limit.

So there are two backends and no in-memory option: **Redis** when `REDIS_URL`
is set, **MongoDB** otherwise (shared across instances, no new
infrastructure). There is a test that builds two independent limiters over one
Redis and asserts the budget is shared, plus one asserting that if the store
goes down the in-memory insurance limiter still enforces rather than failing
open.

---

## 6. Input validation

Every endpoint validates against a schema (`src/lib/schemas.js`) before the
controller runs. Browser-side checks exist only for immediate feedback;
bypassing the form changes nothing.

Three properties do real work:

- **Everything is typed as a string.** `{"userId":{"$ne":null}}` fails the
  schema, so the classic NoSQL authentication bypass cannot reach Mongoose.
- **Schemas are strict.** Unknown keys are rejected, so `{"role":"superadmin"}`
  is a 400 rather than a silent privilege escalation.
- **Everything is bounded.** A 5,000-character password is refused before it
  reaches the hasher, so password hashing cannot be used as a CPU-exhaustion
  lever.

A global sanitizer additionally strips any key starting with `$` or containing
`.` from bodies, queries and params, as a backstop for routes added later
without a schema. Stripped keys are audited.

---

## 7. Sessions, CSRF and headers

### CSRF

`POST /auth/refresh` and `POST /auth/logout` authenticate by cookie, so they
carry a double-submit token: the server sets a readable `rv_csrf` cookie, the
page echoes it in `X-CSRF-Token`, and the two are compared in constant time. A
cross-origin page can cause the cookie to be sent but cannot read it to
produce the header.

Every other endpoint authenticates with a bearer header, which a cross-site
page cannot set — so those are not CSRF-reachable by construction, and adding
tokens to them would be noise.

### Cookies

`HttpOnly`, `Secure` (mandatory in production), `SameSite=Lax`, scoped to
`Path=/api/auth`. Set `CROSS_SITE_COOKIES=true` only when the API and site are
on different registrable domains — that switches to `SameSite=None`, which is
precisely when the CSRF token stops being belt-and-braces.

### Headers

Via helmet: CSP, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`,
`Referrer-Policy: strict-origin-when-cross-origin`, and HSTS **in production
only** (sending it from a dev host can lock a browser out of plain HTTP for
that domain).

The CSP's `script-src` has no `'unsafe-inline'`. When this server also serves
the built frontend, the inline JSON-LD block in `index.html` is allowed **by
SHA-256 hash**, computed at boot — so the SEO structured data keeps working
without weakening the policy. If you add third-party scripts, list their
origins in `CSP_EXTRA_SCRIPT_SRC` rather than loosening the defaults.

### Uploads

`/uploads` is served under `default-src 'none'; sandbox` plus `nosniff`. This
matters because SVG is an allowed upload type and an SVG can carry script —
served from the app's own origin under the default policy, a malicious SVG
would be stored XSS against the admin panel.

---

## 8. Other issues fixed during the audit

These were found while reading the existing code, beyond the brief:

1. **Unpublished content was publicly readable.**
   `GET /api/<collection>?all=1` disabled the `published` filter for *anyone* —
   drafts were one query parameter from public. `?all=1` now requires a
   signed-in admin.

2. **Drafts were readable by slug.** `GET /api/<collection>/:slug` had no
   `published` check at all. Anonymous callers now get a 404 — the same answer
   as a slug that does not exist, so the endpoint does not confirm a draft is
   in progress.

3. **`env.js` was dead code.** It contained a well-formed hardened
   configuration that nothing imported; the app read `process.env` directly and
   none of it applied. It is now the single source of truth and is enforced at
   boot.

4. **`Argon2 timeCost` was set to 1**, below the algorithm's minimum of 2, so
   hashing would have thrown at runtime. Caught by a test; all parameters are
   now clamped to their minimums.

4a. **A bug in the first version of the new rate limiter**, found by probing
   its behaviour rather than trusting it: the account failure counter and the
   backoff penalty shared one key, and because `block()` overwrites a key's
   TTL, the first short backoff wiped the failure streak when it expired. Net
   effect was ~5 attempts every 2 seconds per account, indefinitely. Now split
   across two keys, with a regression test that waits for a real backoff to
   lapse. Recorded here because it is the kind of defect that passes a
   casually-written test suite.

5. **Upload URLs were built from the `Host` header**, which the client
   controls — the API could be made to return a URL pointing at an attacker's
   domain, to be stored in the CMS by an admin acting in good faith. Now built
   from `SITE_URL`.

6. **Error responses leaked internals.** The handler returned `err.message` for
   500s (exposing Mongo connection strings and filesystem paths),
   `err.keyValue` on duplicate keys (naming the colliding field — on the user
   collection that confirms whether an id exists), and Mongoose `CastError`
   text (naming schema paths). Responses now carry a category and a short
   `ref`; the full error and stack go to the server log under that same `ref`.

7. **Mass assignment on content writes.** Request bodies could set `_id`,
   `__v` and timestamps, and `PUT` ran without `runValidators`, bypassing every
   schema rule `create` enforced.

8. **Missing authorisation layer.** Routes used `protect` (authenticated) with
   no role check. `requireAdmin` is now applied, so adding a non-admin role
   later does not silently grant it the whole CMS.

9. **The login form retried with a lower-cased id on failure**, spending a
   second attempt against the brute-force limiter for every mistyped capital.
   The server normalises the id itself, so the retry was removed.

10. **No limits on the public forms.** The contact form and job-application
    endpoint write to the database and send email with no throttle — a spam
    relay and a way to burn the SMTP quota. Both are now limited, and the limit
    runs *before* multer, so a flood of 5 MB uploads is refused without
    touching the disk.

---

## 8a. Findings from the independent review

The auth code was reviewed by a second reviewer that had not seen it being
written. It independently reproduced both bugs listed above (§8 items 4a and
the rotation race) and proposed the same fixes, which is useful corroboration.
It also found these, all now fixed:

1. **Password reset could be permanently bricked for a legacy account.**
   `reset()` claimed the token and *then* called `doc.save()`. A full save runs
   document-wide validation on every path hydrated from the database, not just
   the modified ones — so a user whose stored `email` predated the current
   validator hit a `ValidationError` *after* their token had been spent. The
   link was consumed, the password unchanged, and with `forgotPerAccount` at
   3/hour such an account could effectively never reset. `forgot()` already
   used `validateBeforeSave: false` for precisely this reason, so the two
   halves of one flow disagreed about whether stored records were valid.
   Now a single atomic, targeted write (`User.applyNewPassword`) both claims
   the token and sets the password — no validation of unrelated fields, and no
   window where one happened without the other.

2. **The CSRF check failed open on a missing or falsy cookie.** `if
   (!cookieValue) return next()` is the wrong default for a security control.
   It was also weaker than it looked: `cookie-parser` always runs
   `JSONCookies`, so `rv_csrf=j:0`, `j:null` or `j:false` arrives as a falsy
   non-string and took the pass branch outright. Now a request carrying a
   session cookie must present a valid string token or it is refused; only a
   request with no session cookie at all is allowed through to the route's
   401.

3. **Rotation ignored `passwordChangedAt`, and sessions had no absolute
   lifetime.** `signAccessToken` stamps the user's *current* `tokenVersion`
   onto the new token, so a surviving refresh token would quietly heal a
   session a password change was meant to end — the `tokenVersion` mechanism
   was being upheld by convention at two call sites rather than by the
   function that issues credentials. And because each rotation set a fresh
   `expiresAt`, the refresh window was sliding, so a session could be kept
   alive forever by refreshing. Both are now enforced in `rotate()`, with
   `SESSION_MAX_LIFETIME` (default 30 days) as the hard ceiling.

4. **`TRUST_PROXY=0` shipped alongside `vercel.json`.** On a platform that
   always terminates in front of the app, `req.ip` is the proxy's address —
   identical for every client — so every IP limiter collapses into one global
   bucket. One client sending 61 requests a minute would 429 the whole
   `/api/auth` router, `/refresh` included, for every admin. The boot check
   now refuses to start when a known platform is detected and `TRUST_PROXY` is
   still 0.

5. **Sanitizer gaps.** It did not scrub `req.cookies` (which, per the
   `JSONCookies` note above, can hold attacker-supplied objects); its depth cap
   *silently stopped scrubbing* rather than rejecting, so an operator key
   nested past it survived; and it did not filter `__proto__` / `constructor`.
   No live exploit path existed for the last one, but all three are closed and
   an over-deep body is now a 400 rather than something forwarded uninspected.

6. **Smaller items:** an admin password change left any pending reset link
   usable (it could overwrite the new password); logout audit rows were never
   attributed to an account, because `/auth/logout` has no `protect` so
   `req.user` was always undefined; `rotate()` left a dead cookie in place on
   an unrecognised token; and `pre('validate')` being the only thing that
   hashes meant a future `save({ validateBeforeSave: false })` with a password
   set would silently discard it — now guarded by a `pre('save')` assertion
   that fails loudly.

Two things it raised that are **not** fixed, recorded in §11 instead: the
login timing-parity crack for not-yet-migrated bcrypt accounts, and
`forgotPerAccount` being an availability lever against a known user id.

### Unauthenticated access to applicant résumés

The reviewer also found, outside the auth brief: `app.js` serves all of
`uploads/` statically and `upload.js` writes résumés to `uploads/resumes/`, so
every CV is fetchable without authentication at
`/uploads/resumes/<timestamp>-<name>.<ext>`. There is no directory listing and
the filename carries some entropy, but the URL is permanent, unauthenticated,
and leaks through referrers, logs and sharing — and the filenames embed the
applicant's name.

This is the same class of problem as the résumé committed to git history. It
needs a decision rather than a patch: serve résumés through an authenticated
route that checks the admin session before streaming the file, and move them
out of the statically-served directory. I have not changed it, because it
would alter how the admin UI links to them.

---

## 9. Audit logging

Authentication events are written to the `AuthEvent` collection: logins,
failures (with the reason, server-side only), rate-limit hits, refreshes, token
reuse, resets, password changes, user creation and deletion, authorisation
denials and rejected input.

Secrets are stripped by the writer rather than left to call sites: any key
matching `pass|secret|token|auth|cookie|hash|credential|otp|session|bearer|key`
is replaced with `[redacted]`, recursively, and long strings are truncated.
There is a test asserting no password or hash appears anywhere in the log after
a sequence of real logins.

Retention is 180 days via a TTL index (`AUDIT_RETENTION_DAYS`) — long enough
to investigate, short enough not to become a liability of its own.

Useful queries:

```js
// Failed logins in the last hour, busiest source first
db.authevents.aggregate([
  { $match: { type: 'login.failure', createdAt: { $gt: new Date(Date.now() - 3600e3) } } },
  { $group: { _id: '$ip', n: { $sum: 1 }, accounts: { $addToSet: '$userIdAttempted' } } },
  { $sort: { n: -1 } }
])

// Token theft signals — investigate every one of these
db.authevents.find({ type: 'refresh.reuse' }).sort({ createdAt: -1 })
```

---

## 10. Tests

```bash
cd server
npm test                  # 169 tests, no database required
npm run test:integration  # full flows against an ephemeral MongoDB
```

**`npm test`** — verified passing, 169/169. Security primitives (hashing,
tokens, schemas, sanitization, audit redaction, config validation, rate-limit
behaviour including the cross-instance Redis check) and HTTP-level tests
through the real Express stack with the data layer mocked: security headers,
CORS, generic errors, enumeration, injection, rate limiting, CSRF, token
rejection.

**`npm run test:integration`** — needs MongoDB. Covers what the mocked tier
cannot: unique indexes, TTL indexes, refresh rotation and reuse detection
across documents, single-use reset tokens under genuine concurrency, the
bcrypt→Argon2id migration as actually persisted, and the audit trail as
written. It uses `mongodb-memory-server` by default, or set
`MONGO_TEST_URI=mongodb://127.0.0.1:27017/rvmaitech_test`.

> **This tier was written but its assertions have not been executed.** The
> environment it was built in has no MongoDB, and `mongodb-memory-server`'s
> binary download is blocked there by network policy
> (`fastdl.mongodb.org` → 403).
>
> What *was* verified: every file parses, the suite loads, and the hooks
> register and run — the run fails solely in the `before` hook at the database
> connection, with all test bodies untouched. So it is wired correctly, but
> the database-level guarantees it asserts (unique and TTL indexes, the
> concurrency behaviour of the refresh and reset claims, the persisted
> bcrypt→Argon2id migration) are **claims backed by unrun tests**.
>
> Run `npm run test:integration` once locally before deploying, and treat any
> failure there as a finding rather than a test problem.

### Verifying by hand

```bash
# Generic error, no enumeration — both must be identical
curl -s -X POST localhost:4000/api/auth/login \
  -H 'Content-Type: application/json' -d '{"userId":"admin","password":"wrongwrongwrong"}'
curl -s -X POST localhost:4000/api/auth/login \
  -H 'Content-Type: application/json' -d '{"userId":"ghost","password":"wrongwrongwrong"}'

# NoSQL injection — must be 400, never a token
curl -s -X POST localhost:4000/api/auth/login \
  -H 'Content-Type: application/json' -d '{"userId":{"$ne":null},"password":{"$ne":null}}'

# Rate limiting — expect 429 with Retry-After
for i in $(seq 1 25); do
  curl -s -o /dev/null -w "%{http_code} " -X POST localhost:4000/api/auth/login \
    -H 'Content-Type: application/json' -d '{"userId":"admin","password":"wrongwrongwrong"}'
done; echo

# Unpublished content must NOT be listed
curl -s 'localhost:4000/api/services?all=1' | grep -c '"published":false'   # expect 0

# Refresh cookie must be HttpOnly
curl -si -X POST localhost:4000/api/auth/login \
  -H 'Content-Type: application/json' -d '{"userId":"admin","password":"<real>"}' \
  | grep -i set-cookie
```

---

## 11. Known limitations

Stated plainly, because "secure" without caveats is not a useful claim.

1. **The integration tier has not been run.** See §10. The code it exercises is
   covered indirectly by the mocked tier, but the database-level guarantees —
   unique indexes, TTL expiry, the concurrency behaviour of the reset claim —
   are asserted by tests nobody has executed yet. Run it before deploying.

2. **Login is by `userId`, not email.** The brief asked for email validation
   throughout; this application authenticates with a `userId` handle that may
   or may not be an email, and the admin UI says "User ID or email". Preserving
   that was the explicit instruction, so `userId` is validated as a handle
   (length, safe alphabet, normalisation) and email-format validation is applied
   to the `email` field, where an email is actually what is meant. If you want
   email-only login, that is a product decision and a data migration.

3. **The access token is still readable by JavaScript.** It lives in
   `localStorage`, so an XSS hole in the admin panel can steal it — for up to
   15 minutes, and it cannot be used to mint new tokens, because the refresh
   cookie is `HttpOnly`. Fully closing this means moving the access token into
   a second cookie and adding CSRF to every write endpoint, which would require
   rewriting the admin UI's request layer. The 15-minute window is the
   deliberate compromise.

4. **No multi-factor authentication.** The highest-value next addition for a
   CMS whose admin panel can publish to a public site.

5. **The password denylist is short.** 23 entries, covering what people
   actually pick when told "12 characters". It is not a breach corpus — set
   `PASSWORD_DENYLIST_FILE` for real screening.

6. **`uploads/` is local disk.** Already noted in `DEPLOY.md`: on Render,
   Railway or Vercel this is ephemeral, and uploads vanish on redeploy. It is
   also unscanned — an authenticated admin can upload any permitted file type.

7. **Audit events are written fire-and-forget.** A failed audit write is logged
   to the console and swallowed, so under database trouble the trail can have
   gaps. Refusing valid logins because the audit collection is unavailable
   would be the worse failure.

8. **HTTPS is assumed, not enforced by this app.** `Secure` cookies and HSTS
   depend on TLS terminating correctly in front of the app. Check `TRUST_PROXY`
   matches your real topology — too high a value lets clients spoof their IP
   and escape the rate limits, too low collapses every client into one bucket.

9. **Login timing parity is imperfect for not-yet-migrated accounts.**
   `dummyVerify` burns an Argon2id verification at the configured parameters,
   which matches an Argon2 user closely. An account still on a legacy bcrypt
   hash takes a measurably different amount of time — and `bcryptjs` is pure
   JavaScript, so it blocks the event loop rather than using the threadpool as
   native argon2 does. The window closes as accounts log in and migrate. It is
   a narrow crack in an otherwise careful constant-time story, and the fix
   (migrating all hashes eagerly, or matching the dummy to the stored
   algorithm) is worth doing if enumeration is a concern for you.

10. **`forgotPerAccount` is an availability lever.** Anyone who knows an
    admin's user id can exhaust that account's 3-per-hour reset budget and keep
    them from requesting a link. This is inherent to per-account limiting —
    the alternative is letting one account's resets be used to spam an inbox —
    but it is worth knowing it exists.

11. **Applicant résumés are served without authentication.** See §8a. Needs a
    product decision, not just a patch.
