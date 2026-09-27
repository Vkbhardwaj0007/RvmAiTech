const mongoose = require('mongoose');
module.exports = mongoose.model('TeamMember', new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, unique: true, index: true },
  role: { type: String, default: '' },
  photo: { type: String, default: '' },
  bio: { type: String, default: '' },
  details: { type: String, default: '' },   // full profile page text
  linkedin: { type: String, default: '' },
  email: { type: String, default: '' },
  order: { type: Number, default: 0 },
  published: { type: Boolean, default: true },
}, { timestamps: true }));
