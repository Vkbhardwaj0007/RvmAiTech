# RvmAiTech — Deploy Guide

Do parts: BACKEND (Node/Express + MongoDB) and FRONTEND (React build).
3 common ways:

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
   (keep JWT_SECRET, SMTP_*, PORT=4000)

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
