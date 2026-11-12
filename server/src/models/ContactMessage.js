const mongoose = require('mongoose');
module.exports = mongoose.model('ContactMessage', new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, default: '' },
  phone: { type: String, default: '' },
  company: { type: String, default: '' },
  subject: { type: String, default: '' },
  budget: { type: String, default: '' },
  timeline: { type: String, default: '' },
  message: { type: String, default: '' },
  read: { type: Boolean, default: false },
}, { timestamps: true }));
