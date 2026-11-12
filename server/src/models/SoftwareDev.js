const mongoose = require('mongoose');

module.exports = mongoose.model('SoftwareDev', new mongoose.Schema({
  title: { type: String, required: true },
  slug: { type: String, unique: true, index: true },
  client: { type: String, default: '' },
  summary: { type: String, default: '' },
  description: { type: String, default: '' },
  problemStatement: { type: String, default: '' },
  solution: { type: String, default: '' },
  stack: { type: [String], default: [] },
  photos: { type: [String], default: [] },
  video: { type: String, default: '' },
  videoUrl: { type: String, default: '' },
  year: { type: String, default: '' },
  order: { type: Number, default: 0 },
  published: { type: Boolean, default: true },
}, { timestamps: true }));
