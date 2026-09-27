const mongoose = require('mongoose');
module.exports = mongoose.model('Stat', new mongoose.Schema({
  label: { type: String, required: true },
  slug: { type: String, unique: true, index: true },
  value: { type: String, default: '' },
  order: { type: Number, default: 0 },
  published: { type: Boolean, default: true },
}, { timestamps: true }));
