const mongoose = require('mongoose');

// One card on a service detail page (/services/<slug>): image + heading + body.
const CardSchema = new mongoose.Schema({
  image: { type: String, default: '' },
  heading: { type: String, default: '' },
  body: { type: String, default: '' },      // paragraphs; lines starting with "- " become bullets
}, { _id: false });

const GroupSchema = new mongoose.Schema({
  heading: { type: String, default: '' },
  items: { type: [String], default: [] },
}, { _id: false });

module.exports = mongoose.model('Service', new mongoose.Schema({
  title: { type: String, required: true },
  slug: { type: String, unique: true, index: true },
  summary: { type: String, default: '' },
  description: { type: String, default: '' },
  intro: { type: String, default: '' },
  icon: { type: String, default: '' },          // process | home | industry | robot | vision | ai
  image: { type: String, default: '' },
  features: { type: [mongoose.Schema.Types.Mixed], default: [] }, // "text" or { title, description, icon }
  groups: { type: [GroupSchema], default: [] }, // older "heading + bullet list" blocks (used to build cards when none are set)
  cards: { type: [CardSchema], default: [] },   // NEW — detail-page cards with image + heading + body
  order: { type: Number, default: 0 },
  published: { type: Boolean, default: true },
}, { timestamps: true, strict: false }));      // strict:false keeps any extra fields your data already has
