const mongoose = require('mongoose');
module.exports = mongoose.model('Testimonial', new mongoose.Schema({
  author: { type: String, required: true },
  slug: { type: String, unique: true, index: true },
  role: { type: String, default: '' },
  quote: { type: String, default: '' },
  order: { type: Number, default: 0 },
  published: { type: Boolean, default: true },
}, { timestamps: true }));
