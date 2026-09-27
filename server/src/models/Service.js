const mongoose = require('mongoose');
module.exports = mongoose.model('Service', new mongoose.Schema({
  title: { type: String, required: true },
  slug: { type: String, unique: true, index: true },
  summary: { type: String, default: '' },
  description: { type: String, default: '' },
  intro: { type: String, default: '' },
  groups: { type: [{ heading: String, items: [String] }], default: [] },
  icon: { type: String, default: '' },
  image: { type: String, default: '' },
  features: { type: [String], default: [] },
  order: { type: Number, default: 0 },
  published: { type: Boolean, default: true },
}, { timestamps: true }));
