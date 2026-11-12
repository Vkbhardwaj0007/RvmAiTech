RvmAiTech website
server/ = backend (port 4000)
web/    = frontend (port 5173)

FIRST RUN
  1. cp server/.env.example server/.env
  2. Set JWT_SECRET in server/.env:   openssl rand -base64 48
     (the server refuses to start with the placeholder or anything under 32 chars)
  3. Set MONGO_URI.
  4. cd server  ->  npm install  ->  npm run seed  ->  npm run dev
  5. cd web     ->  npm install  ->  npm run dev

LOGIN
  `npm run seed` creates the admin account and prints a generated password
  ONCE. Copy it into a password manager — it cannot be recovered afterwards.
  To choose your own instead, set SEED_ADMIN_PASSWORD in server/.env before
  seeding; it must be at least 12 characters and not a common password.

  (Earlier versions of this file published a fixed default password. If this
  site was ever seeded with that, change the password now — see SECURITY.md.)

TESTS
  cd server
  npm test              # security + HTTP tests, no database needed
  npm run test:integration   # full flows against an ephemeral MongoDB

See SECURITY.md for how authentication works and what each setting does,
and DEPLOY.md for deployment.
