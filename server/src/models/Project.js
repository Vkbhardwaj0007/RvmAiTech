const mongoose = require('mongoose');
module.exports = mongoose.model('Project', new mongoose.Schema({
  title: { type: String, required: true },
  slug: { type: String, unique: true, index: true },
  client: { type: String, default: '' },
  summary: { type: String, default: '' },
  description: { type: String, default: '' },
  image: { type: String, default: '' },
  video: { type: String, default: '' },       // uploaded mp4 URL
  videoUrl: { type: String, default: '' },     // external YouTube/link
  year: { type: String, default: '' },
  order: { type: Number, default: 0 },
  published: { type: Boolean, default: true },
}, { timestamps: true }));
