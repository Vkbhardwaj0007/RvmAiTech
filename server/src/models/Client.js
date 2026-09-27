const mongoose = require('mongoose');
module.exports = mongoose.model('Client', new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, unique: true, index: true },
  logo: { type: String, default: '' },
  url: { type: String, default: '' },
  order: { type: Number, default: 0 },
  published: { type: Boolean, default: true },
}, { timestamps: true }));
