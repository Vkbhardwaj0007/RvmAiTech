const mongoose = require('mongoose');

module.exports = mongoose.model('Process', new mongoose.Schema({
  title: { type: String, required: true },
  slug: { type: String, unique: true, index: true },
  summary: { type: String, default: '' },
  description: { type: String, default: '' },
  deliverables: { type: [String], default: [] },
  icon: { type: String, default: 'Layers' },
  order: { type: Number, default: 0 },
  published: { type: Boolean, default: true },
}, { timestamps: true }));
