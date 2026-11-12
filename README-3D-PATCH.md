# RvmAiTech — 3D website + admin login fix + company pages + Home scroll (patch v16)

Copy this folder over your project (same paths). Changed / new files:

    -- v16: "Home" lands directly on the hero --
    web/src/components/ScrollTop.jsx NEW — scroll handling for every navigation (replaces the old ScrollTop in App.jsx)
    web/src/App.jsx                  uses components/ScrollTop.jsx
    web/src/pages/Home.jsx           hero section gets id="hero" (so /#hero, /#home work)
    web/src/styles.css               scroll-margin for sections opened through /#workflow etc.

    -- v15: "Companies we work with" → click a company for its video + details --
    server/src/models/Client.js      REPLACED — adds slug (automatic), tagline, industry, location, since, video,
                                     videoUrl, image, summary, description, highlights, sections (restart the server!)
    server/src/scripts/backfillClientSlugs.js  NEW — optional one-off: slugs for companies saved before this patch
    web/src/pages/ClientDetail.jsx   NEW — /clients/<slug>: the company page (video | details, sections, projects, others)
    web/src/pages/Clients.jsx        NEW — /clients: every company as a card
    web/src/components/ClientCard.jsx NEW — clickable company card (homepage grid, /clients, "more companies")
    web/src/components/SplitSection.jsx NEW — image | heading + text block (same look as the service pages)
    web/src/components/videoEmbed.js NEW — uploaded file / YouTube / Vimeo / direct .mp4 link → player
    web/src/pages/Home.jsx           company cards open /clients/<slug>; "All companies →" under the grid
    web/src/App.jsx                  routes /clients and /clients/:slug
    web/src/admin/collections.js     Admin → Clients gets the new fields
    web/src/components/heroMedia.js  "Companies we work with" page in Admin → Pages (hero + intro)
    web/src/styles.css               company card badge / caption + company page styles (appended at the end)

    -- earlier patches (unchanged) --
    web/src/api/client.js            fixed API base URL (production login was calling localhost:4000)
    web/src/admin/AdminLogin.jsx     new 3D glass login card + hardened login logic
    web/src/components/Effects3D.jsx NEW — site-wide 3D (tilt cards, hero parallax, 3D reveal)
    web/src/App.jsx                  mounts <Effects3D /> in the public layout
    web/src/pages/Home.jsx           tech-card link colour moved to CSS (so hover can recolour it)
    web/src/pages/_hero.jsx          REPLACED — inner-page hero with its own video/image per page
    web/src/components/heroMedia.js  NEW — per-page hero defaults + admin modes + resolver
    web/src/admin/PagesAdmin.jsx     NEW — Admin → Pages: per page hero background + intro (heading, text, image)
    web/src/admin/AdminLayout.jsx    "Pages (hero + intro)" link in the admin sidebar
    web/src/admin/SettingsAdmin.jsx  note pointing to Pages (homepage hero still lives here)
    web/src/components/PageIntro.jsx NEW — intro block + default text/image for every page
    web/src/pages/ServiceDetail.jsx  NEW — /services/<slug> page as split sections (big image | heading + text + icon points)
    web/src/pages/Leadership.jsx     REPLACED — centred "The People | Behind Our Success" title + team grid (photo, name, role)
    web/src/components/serviceCards.js NEW — cards resolver (saved cards, else built from old groups)
    web/src/admin/Manage.jsx         "Detail cards" editor (image upload, heading, body, reorder) in the Services form
    web/src/admin/collections.js     services get the `cards` field
    server/src/models/Service.js     REPLACED — adds `cards: [{image, heading, body}]` (restart the server!)
    server/src/models/TeamMember.js  REPLACED — adds `founder: Boolean` (restart the server!)
    web/public/hero/hero-1..3-still.jpg  NEW — one frame from each built-in clip, used as page images
    web/src/styles.css               3D layer + hover colours + header/footer 3D + login styles
    web/.env.example                 NEW — VITE_API_URL note

## 1. Install (inside /web)

    npm install framer-motion lucide-react

## 2. Run

    cd server && npm run dev        # API on :4000  (seed admin: npm run seed)
    cd web && npm run dev           # site on :5173

Admin: http://localhost:5173/admin/login  →  admin / Admin@123 (from server/.env SEED_ADMIN_*)

## 3. Production

- Same-domain deploy (SERVE_CLIENT=true): leave VITE_API_URL empty, `npm run build` in /web.
- API on a different domain: put `VITE_API_URL=https://api.yourdomain.com` in web/.env, then build.
- CORS_ORIGIN in server/.env must be the site's URL (or *).

## v16 changes — Home opens directly on the hero
- Clicking Home (menu, logo, breadcrumb — any link to `/`) from another page lands **directly** on top
  of the homepage, on the hero. Before, `html{scroll-behavior:smooth}` made every page change animate
  from the old scroll position. Same for every other page: it opens at its top instantly.
- Clicking Home while already on the homepage (scrolled down) smooth-scrolls back up to the hero.
- Links with a hash (`/#workflow`, `/#hero`, `/#home`) scroll to that section, also from other pages,
  and stop below the sticky header.
- All of this is in `components/ScrollTop.jsx`, mounted in App.jsx — nothing in Header.jsx has to change.
  If your header has no "Home" entry and you want one, add `<NavLink to="/" end>Home</NavLink>` there
  (or send Header.jsx and it will be added).

## v15 changes — "Companies we work with": click a company → its video + details

**What the visitor sees**
- The homepage cards (Jain Cord Industries, JP Minda Group …) now open `/clients/<slug>`
  (e.g. `/clients/jain-cord-industries`) instead of the website link. A card shows a ▶ badge when the
  company has a video and "Watch video →" / "View details →" on hover. "All companies →" under the
  grid opens `/clients`, where every company is a bigger card.
- Company page: hero (name, tagline, industry · location · since · website chips) → the video on
  the left (uploaded mp4 starts muted with a "Tap to unmute" button; a YouTube / Vimeo link is
  embedded; a link that cannot be embedded, e.g. Google Drive, shows a "Watch the video" button;
  no video → cover image or logo) and, on the right, "About <Company>": summary, details, the
  "What we did for <Company>" icon points, "Discuss a similar project" + "Visit website" buttons.
  Below that: the "Detail sections" (image | heading + text, alternating — same blocks as the
  service pages), "What we built for <Company>" = projects whose Client field matches the company
  (Admin → Projects → Client), "More companies we work with", and the CTA.

**What you edit (Admin → Clients → Add / Edit)**
- Company name, Logo, Tagline, Industry, Location, Working together since, Website URL
- Video upload (mp4, max 60 MB) — OR a video link (YouTube / Vimeo / direct .mp4); the upload wins
- Cover image (video poster; shown when there is no video)
- Summary (short), Details (paragraphs; lines starting with "- " become points),
  What we did (one point per line), Detail sections (image + heading + text, ↑↓ order)
- Order, Published — old fields keep working; nothing already saved is lost.
- Admin → Pages has a new entry "Companies we work with" for the hero background / intro of /clients.

**Server**
- `server/src/models/Client.js` is REPLACED (new fields + automatic slug from the name; a typed slug
  is cleaned and kept unique). **Restart the server** after copying, otherwise the new fields are
  dropped on save. Check the file name first: `ls server/src/models` — if your client model has
  another name (Clients.js, Company.js …), paste this file's content into that file instead.
- Nothing changes in the routes: the existing `/api/clients` list / create / update / delete keep
  being used. The company page loads `GET /api/clients/<slug>` and, if the API does not resolve it
  (an older record without a slug, or an id in the link), falls back to the public list.
- Companies saved before this patch have no slug yet: their cards link by id (`/clients/<id>`) and a
  slug is created the next time you press Save on them in Admin. To do all at once:
  `cd server && node src/scripts/backfillClientSlugs.js` (reads the Mongo URI from server/.env).
- If one company shows "Company not found": Admin → Clients → Edit → tick Published → Save.

## v2 changes
- Floating cubes / rings removed from the homepage hero.
- Every inner page hero (About, Services, Products, Careers, Contact…) shows the hero video, or the
  admin-uploaded hero image when one is set (Settings → Homepage hero image) — same as the homepage.
- Every card changes colour under the cursor: light cards → navy with white text, dark-section cards → orange.
- `pages/_hero.jsx` is replaced. It exports `PageHero` (named + default). If your old `_hero.jsx`
  exported anything else, copy those exports back into the new file.

## v14 changes
- Leadership intro paragraph replaced with the client's new text ("Our team combines expertise in
  industrial automation, embedded systems, robotics, machine vision, and software…"). If the old
  paragraph was saved in the database, it is replaced automatically on the site and in Admin → Pages.

## v13 changes
- Leadership: if nobody is flagged as founder (checkbox / "Founder" in role), the first two members
  (Order 1 and 2) are shown on top automatically, labelled Founder / Co-Founder when their role is
  empty. Everyone else goes under the title. 1–2 cards in the grid are centred.

## v12 changes
- Admin → Leadership → Edit now has a "Founder / Co-Founder" checkbox; ticked members show in the big
  cards on top (no need to write "Founder" in the role, though that still works). Requires the new
  server/src/models/TeamMember.js → restart the server.
- Leadership title auto-splits into a light + bold line even without "|" (first two words light).
- Note: text saved in Admin → Pages always overrides the built-in defaults — edit it there (or
  "Reset to default text") if you want the new default wording.

## v11 changes
- Leadership page: Founder / Co-Founder on top as large cards (photo | role, name, bio, links) —
  anyone whose Role contains "Founder" (Admin → Leadership) is shown there — then the centred
  "The People | Behind Our Success" title, then the grid of the other heads.

## v14 changes
- Leadership intro paragraph replaced with the client's new text ("Our team combines expertise in
  industrial automation, embedded systems, robotics, machine vision, and software…"). If the old
  paragraph was saved in the database, it is replaced automatically on the site and in Admin → Pages.

## v13 changes
- Leadership: if nobody is flagged as founder (checkbox / "Founder" in role), the first two members
  (Order 1 and 2) are shown on top automatically, labelled Founder / Co-Founder when their role is
  empty. Everyone else goes under the title. 1–2 cards in the grid are centred.

## v12 changes
- Admin → Leadership → Edit now has a "Founder / Co-Founder" checkbox; ticked members show in the big
  cards on top (no need to write "Founder" in the role, though that still works). Requires the new
  server/src/models/TeamMember.js → restart the server.
- Leadership title auto-splits into a light + bold line even without "|" (first two words light).
- Note: text saved in Admin → Pages always overrides the built-in defaults — edit it there (or
  "Reset to default text") if you want the new default wording.

## v11 changes
- Leadership page: members whose role contains "Founder" (Founder, Co-Founder, Founder & CEO …) are
  shown first as large cards (photo | role, name, bio, links). Below them the centred title, then the
  grid of the other heads. Set the role text in Admin → Leadership.

## v10 changes
- Leadership page like the reference: centred two-line title (Admin → Pages → Our Leadership → Heading,
  "|" splits light / bold lines), then a 3-column grid: photo, name, role, small LinkedIn/email icons.
  No "Full profile" button — clicking the photo or the name opens /leadership/<slug>.
- Any intro heading can use "First part | Second part" for a light + bold split.

## v9 changes
- Leadership page: no intro image; each leader (Admin → Leadership: photo, role, bio, full profile,
  LinkedIn, email) is a full-width section — photo on one side, text on the other, alternating.
  "The people behind the systems" is text only and sits at the bottom of the page.
- Admin → Pages → every page now has "Position on the page": right below the hero, or at the bottom.
  (Leadership defaults to bottom.)

## v8 changes
- Service-page image is now top-aligned with the heading (not vertically centred), stays on screen
  (sticky) while long text scrolls, and keeps its natural ratio (infographics are no longer cropped;
  max 520px tall).

## v7 changes
- Service-page images made smaller: ~40% of the row, max 420px tall, rounded, centred beside the text
  (was an edge-to-edge half-screen image). Tweak in styles.css: `.split-in` column widths and
  `.split-media{aspect-ratio;max-height}`.

## v6 changes
- Service detail pages rebuilt in the split-section style (like the reference screenshot): each block is
  an edge-to-edge image on one side and, on the other, a big heading with the accent word in orange, the
  text, and "- " lines shown as icon points. Blocks alternate image left / right.
- First block is "Why <Service>?" — from the service's Intro, Description, Highlights and the new
  "Main image" field (Admin → Services → Edit). Each "Detail section" card is one more block.

## v5 changes
- Homepage and Services-list intro blocks are text only (no image). Any page's intro image can be
  added/removed in Admin → Pages.
- Service detail pages (/services/process-automation …) now show one card per item, each with an image,
  a heading and a body. Edit them in Admin → Services → Edit → "Detail cards" (upload image, heading,
  body, ↑↓ order, remove, add). Until you save cards for a service, its old "groups" are shown as cards
  with placeholder images, so nothing looks empty.
- server/src/models/Service.js is replaced (adds the `cards` field, keeps every other field via
  strict:false). Restart the server after applying, otherwise saved cards are dropped.

## v4 changes
- Every page now has an intro block under its hero: heading, text (paragraphs; lines starting with "- "
  become bullets) and an image, left or right. Default text and image are filled in for all pages.
- Admin → Pages: pick a page, set its hero background (moved here from Settings) and edit the intro;
  live preview below. "Hide this block" hides it on that page; "Reset to default text" restores the
  built-in copy. Saved as site keys `pageHero` and `pageIntro` (whitelist note below applies to both).
- The intro shows on top-level pages only (/about, /products, /careers…), not on detail pages
  (/products/mdms-1, /careers/apply). Home shows it after the stats band.

## v3 changes
- Every inner page gets a different hero background by default (components/heroMedia.js →
  PAGE_HERO_DEFAULTS): About/Services/Technologies/Products/Projects/News/Workflow → one of the three
  built-in videos each, Careers/Leadership/Blog/Contact → a still image.
- Admin → Pages (was Settings in v3): per page choose Default / homepage playlist / built-in
  video 1-3 / built-in image 1-3 / upload a video / upload an image. Saved as site key `pageHero`.
  If Save shows "pageHero save failed", the server whitelists keys: add 'pageHero' to the allowed
  list in server/src/routes/siteRoutes.js.
- Header 3D: glass slab with depth, nav links lift with an orange underline, dropdown menus flip open
  in 3D, logo and "Get a quote" tilt with the mouse, mobile menu drops down in 3D.
- Footer 3D: perspective floor grid + glow, columns tilt with the mouse, links slide forward with a dot,
  social icons pop; footer blocks reveal in 3D on scroll.

## Tweaks

- Login accent colour: `.l3d-btn` / `.l3d-check input:checked` in styles.css (orange by default).
- Tilt strength per element: add `data-tilt="12"` (degrees) to any card.
- Add tilt / reveal to more elements: edit TILT_SEL / REVEAL_SEL in Effects3D.jsx.
- Everything switches off automatically for touch screens and "reduce motion".
