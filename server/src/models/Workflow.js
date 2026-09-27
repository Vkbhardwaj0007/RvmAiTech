const mongoose = require('mongoose');
module.exports = mongoose.model('Workflow', new mongoose.Schema({
  title: { type: String, required: true },
  slug: { type: String, unique: true, index: true },
  summary: { type: String, default: '' },     // one-line
  intro: { type: String, default: '' },        // paragraph
  groups: { type: [{ heading: String, items: [String] }], default: [] },
  example: { type: String, default: '' },
  output: { type: String, default: '' },
  order: { type: Number, default: 0 },
  published: { type: Boolean, default: true },
}, { timestamps: true }));
