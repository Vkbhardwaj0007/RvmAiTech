/**
 * One-off: give every existing client a slug (jain-cord-industries …) so that
 * /clients/<slug> works for companies saved before this patch.
 *
 *   cd server && node src/scripts/backfillClientSlugs.js
 *
 * Not required — links fall back to the id (/clients/<id>) and a slug is
 * created automatically the next time you press Save on that client in Admin.
 */
const path = require('path');
try { require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') }); } catch { /* dotenv optional */ }
const mongoose = require('mongoose');
const Client = require('../models/Client');

const uri = process.env.MONGODB_URI || process.env.MONGO_URI || process.env.MONGO_URL || process.env.DATABASE_URL;
if (!uri) { console.error('Mongo URI not found in server/.env (MONGODB_URI / MONGO_URI).'); process.exit(1); }

(async () => {
  await mongoose.connect(uri);
  const list = await Client.find({ $or: [{ slug: { $exists: false } }, { slug: '' }, { slug: null }] });
  for (const c of list) {
    await c.save();                       // pre('validate') hook fills the slug
    console.log(`${c.name}  ->  /clients/${c.slug}`);
  }
  console.log(`${list.length} client(s) updated.`);
  await mongoose.disconnect();
})().catch((e) => { console.error(e); process.exit(1); });
