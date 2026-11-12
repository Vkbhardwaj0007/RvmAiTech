const mongoose = require('mongoose');

module.exports = mongoose.model('Stack', new mongoose.Schema({
  title: { type: String, required: true },
  category: { type: String, default: 'Core Tech' },
  color: { type: String, default: 'orange' },
  order: { type: Number, default: 0 },
  published: { type: Boolean, default: true },
}, { timestamps: true }));
