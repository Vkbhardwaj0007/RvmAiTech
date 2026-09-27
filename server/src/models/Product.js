const mongoose = require('mongoose');
module.exports = mongoose.model('Product', new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, unique: true, index: true },
  category: { type: String, default: 'General', index: true },
  summary: { type: String, default: '' },
  description: { type: String, default: '' },
  purpose: { type: String, default: '' },
  positioning: { type: String, default: '' },
  features: { type: [String], default: [] },
  buildsOn: { type: String, default: '' },
  image: { type: String, default: '' },
  specs: { type: [{ label: String, value: String }], default: [] },
  order: { type: Number, default: 0 },
  published: { type: Boolean, default: true },
}, { timestamps: true }));
