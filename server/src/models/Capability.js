const mongoose = require('mongoose');

module.exports = mongoose.model('Capability', new mongoose.Schema({
  title: { type: String, required: true },
  slug: { type: String, unique: true, index: true },
  summary: { type: String, default: '' },
  description: { type: String, default: '' },
  problemStatement: { type: String, default: '' },
  solution: { type: String, default: '' },
  features: { type: [String], default: [] },
  hardwareUsed: { type: [String], default: [] },
  softwareUsed: { type: [String], default: [] },
  icon: { type: String, default: 'Cpu' },
  image: { type: String, default: '' },
  order: { type: Number, default: 0 },
  published: { type: Boolean, default: true },
}, { timestamps: true }));
