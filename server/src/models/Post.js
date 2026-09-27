const mongoose = require('mongoose');
module.exports = mongoose.model('Post', new mongoose.Schema({
  title: { type: String, required: true },
  slug: { type: String, unique: true, index: true },
  category: { type: String, default: 'Blog', index: true }, // Blog | News
  excerpt: { type: String, default: '' },
  content: { type: String, default: '' },
  coverImage: { type: String, default: '' },
  author: { type: String, default: '' },
  date: { type: Date, default: Date.now },
  order: { type: Number, default: 0 },
  published: { type: Boolean, default: true },
}, { timestamps: true }));
