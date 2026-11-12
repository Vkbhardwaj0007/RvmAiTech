const mongoose = require('mongoose');

module.exports = mongoose.model('ErpCard', new mongoose.Schema({
  title: { type: String, required: true },
  slug: { type: String, unique: true, index: true },
  badge: { type: String, default: '' },
  summary: { type: String, default: '' },
  description: { type: String, default: '' },
  problemStatement: { type: String, default: '' },
  solution: { type: String, default: '' },
  features: { type: [String], default: [] },
  highlights: { type: [String], default: [] },
  softwareUsed: { type: [String], default: [] },
  icon: { type: String, default: 'Database' },
  image: { type: String, default: '' },
  order: { type: Number, default: 0 },
  published: { type: Boolean, default: true },
}, { timestamps: true }));
