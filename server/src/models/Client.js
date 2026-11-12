const mongoose = require('mongoose');

/**
 * Client / company shown in "Companies we work with" (homepage + /clients).
 * Clicking a card opens /clients/<slug>: the company's video + details.
 *
 * Old fields (name, logo, url, order, published) are kept as they were, so
 * nothing that is already saved is lost. New fields are optional.
 * strict:false keeps any extra keys your data already has.
 */

// One detail section on the company page (like service "Detail cards"):
// image on one side, heading + text on the other.
const SectionSchema = new mongoose.Schema({
  image: { type: String, default: '' },
  heading: { type: String, default: '' },
  body: { type: String, default: '' },      // paragraphs; lines starting with "- " become points
}, { _id: false });

const ClientSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  slug: { type: String, index: true },      // filled automatically from the name (see hooks below)

  // card (homepage grid)
  logo: { type: String, default: '' },
  url: { type: String, default: '' },      // company website (optional)

  // detail page — header
  tagline: { type: String, default: '' },   // one line under the name
  industry: { type: String, default: '' },  // e.g. Packaging, Automotive parts
  location: { type: String, default: '' },  // e.g. Gurugram, Haryana
  since: { type: String, default: '' },     // e.g. 2021

  // detail page — video (either an uploaded file or a link) + cover image
  video: { type: String, default: '' },     // uploaded through /upload (mp4, max 60 MB)
  videoUrl: { type: String, default: '' },  // OR YouTube / Vimeo / direct .mp4 link
  image: { type: String, default: '' },     // cover image; also used as the video poster

  // detail page — text
  summary: { type: String, default: '' },   // short, shown on top of the page
  description: { type: String, default: '' }, // paragraphs (blank line between); "- " lines become points
  highlights: { type: [String], default: [] }, // "What we did" points
  sections: { type: [SectionSchema], default: [] }, // extra image + heading + text blocks

  order: { type: Number, default: 0 },
  published: { type: Boolean, default: true },
}, { timestamps: true, strict: false });

/* ---------- slug helpers ---------- */
const slugify = (s = '') => String(s)
  .toLowerCase()
  .normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
  .replace(/&/g, ' and ')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '')
  .slice(0, 80) || 'company';

// Make the slug unique (jain-cord-industries, jain-cord-industries-2, …)
async function uniqueSlug(Model, base, excludeId) {
  let slug = base; let n = 1;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const q = { slug };
    if (excludeId) q._id = { $ne: excludeId };
    if (!(await Model.exists(q))) return slug;
    n += 1; slug = `${base}-${n}`;
  }
}

// doc.save()  (create through the generic POST route, or the backfill script)
ClientSchema.pre('validate', async function () {
  if (!this.slug || this.isModified('slug')) {
    const base = slugify(this.slug || this.name);
    this.slug = await uniqueSlug(this.constructor, base, this._id);
  }
});

// findByIdAndUpdate / findOneAndUpdate  (the generic PUT route)
ClientSchema.pre(['findOneAndUpdate', 'updateOne'], async function () {
  const upd = this.getUpdate() || {};
  const $set = upd.$set || upd;
  let wanted = typeof $set.slug === 'string' ? $set.slug.trim() : '';
  if (!wanted) {
    // no slug sent: keep the existing one, or make one from the (new or old) name
    const cur = await this.model.findOne(this.getQuery()).select('slug name').lean();
    if (cur?.slug) return;
    wanted = $set.name || cur?.name || '';
    if (!wanted) return;
  }
  const cur = await this.model.findOne(this.getQuery()).select('_id').lean();
  const slug = await uniqueSlug(this.model, slugify(wanted), cur?._id);
  if (upd.$set) upd.$set.slug = slug; else upd.slug = slug;
  this.setUpdate(upd);
});

module.exports = mongoose.models.Client || mongoose.model('Client', ClientSchema);
