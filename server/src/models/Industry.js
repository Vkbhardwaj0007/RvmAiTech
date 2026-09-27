const mongoose = require('mongoose');
module.exports = mongoose.model('Industry', new mongoose.Schema({
  title: { type: String, required: true },
  slug: { type: String, unique: true, index: true },
  order: { type: Number, default: 0 },
  published: { type: Boolean, default: true },
}, { timestamps: true }));
