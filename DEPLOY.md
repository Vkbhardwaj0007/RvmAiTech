# RvmAiTech — Deploy Guide

Do parts: BACKEND (Node/Express + MongoDB) and FRONTEND (React build).
3 common ways:

============================================================
BEFORE ANY OF THEM — required settings
============================================================
The server validates its configuration at boot and REFUSES TO START on a
dangerous combination. Get these right or it will not come up:

  JWT_SECRET      at least 32 chars, not the placeholder.
                    openssl rand -base64 48
                  Changing it signs out every admin.

  CORS_ORIGIN     explicit list, e.g. https://rvmaitech.com
                  "*" is rejected (it cannot be combined with the session
                  cookie). Not needed when SERVE_CLIENT=true.

  TRUST_PROXY     the NUMBER of proxies in front of the app:
                    0  nothing in front
                    1  Nginx / Render / Railway / Fly / one load balancer
                  Never "true" — that lets a client spoof X-Forwarded-For
                  and escape the login rate limits entirely.

  ACCESS_TOKEN_TTL=15m  and  REFRESH_TOKEN_TTL=7d
                  The old JWT_EXPIRES_IN=12h is rejected: access tokens are
                  capped at 1h because they cannot be revoked.

  CROSS_SITE_COOKIES=true   ONLY when the API and the site are on different
                  registrable domains (api.rvmaitech.com + rvmaitech.com, or
                  a Netlify/Vercel frontend with a Render backend). Requires
                  COOKIE_SECURE=true. Leave it off for Option A.

  REDIS_URL       optional. Without it, MongoDB is used as the shared
                  rate-limit store, which is correct but chattier. Set it if
                  you run more than one instance and have Redis available.

HTTPS is assumed: Secure cookies and HSTS depend on TLS terminating in front
of the app. Run `cd server && npm test` before deploying.

See SECURITY.md for the full picture.

============================================================
OPTION A — One VPS (backend serves frontend)  [simplest, 1 server]
============================================================
Good for: your own VPS / DigitalOcean / Hostinger VPS / any Linux.

1. Build frontend:
   cd web
   npm install
   npm run build          -> creates web/dist

2. Backend .env (server/.env), set:
   NODE_ENV=production
   SERVE_CLIENT=true
   SITE_URL=https://yourdomain.com
   CORS_ORIGIN=https://yourdomain.com
   MONGO_URI=<your Atlas URI>
   TRUST_PROXY=1            # Nginx is in front (step 4)
   ACCESS_TOKEN_TTL=15m
   REFRESH_TOKEN_TTL=7d
   (keep JWT_SECRET, SMTP_*, PORT=4000)

   Same-origin here, so leave CROSS_SITE_COOKIES unset.
   Rebuild web/dist and restart after any frontend change: the server hashes
   index.html's inline script at boot for the Content-Security-Policy.

3. Run backend (it now also serves the website + /uploads + sitemap):
   cd server
   npm install
   npm run seed
   npm start              -> site live on http://SERVER_IP:4000

4. Put Nginx in front (port 80/443) -> proxy to localhost:4000, add SSL (Let's Encrypt / Certbot).
   Point your domain (rvmaitech.com) A-record to the server IP.

Keep it running: use pm2
   npm i -g pm2
   pm2 start src/server.js --name rvmaitech
   pm2 save && pm2 startup

============================================================
OPTION B — Netlify (frontend) + Render/Railway (backend)  [free tiers]
============================================================
FRONTEND (Netlify):
   - New site from Git (or drag web/dist folder)
   - Build command: npm run build   | Publish dir: dist   | Base: web
   - Env: VITE_API_URL=https://your-backend.onrender.com
   - Add _redirects file in web/public with:  /*  /index.html  200   (for React routes)

BACKEND (Render.com or Railway):
   - New Web Service from repo, root = server
   - Build: npm install    | Start: npm start
   - Env vars: MONGO_URI, JWT_SECRET, CORS_ORIGIN=https://your-netlify-site,
     SMTP_*, CONTACT_EMAIL, SITE_URL, SERVE_CLIENT=false
   - ALSO required for this split-domain setup:
       TRUST_PROXY=1
       CROSS_SITE_COOKIES=true    # SameSite=None, so the session cookie
       COOKIE_SECURE=true         # is sent from the Netlify origin
       ACCESS_TOKEN_TTL=15m
       REFRESH_TOKEN_TTL=7d
     Without the two cookie settings the browser silently drops the refresh
     cookie and admins get signed out every 15 minutes.
   - Deploy -> get https URL, put it in Netlify VITE_API_URL

Note: uploaded images (server/uploads) are local. On Render/Railway free tier
disk is ephemeral -> use Cloudinary/S3 for images in production (ask me to add).

============================================================
OPTION C — Vercel (frontend) + any backend
============================================================
Same idea as B: Vercel hosts web/, set VITE_API_URL to backend URL,
add a vercel.json rewrite so all routes -> index.html.

------------------------------------------------------------
DNS: point rvmaitech.com to your host (A record for VPS IP, or CNAME for Netlify/Vercel).
SSL: Netlify/Vercel/Render give free HTTPS automatically. VPS -> Certbot.
------------------------------------------------------------
