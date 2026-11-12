const mongoose = require('mongoose');

// Leadership / team member (Admin → Leadership, shown on /leadership and /leadership/<slug>)
module.exports = mongoose.model('TeamMember', new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, unique: true, index: true },
  role: { type: String, default: '' },
  photo: { type: String, default: '' },
  bio: { type: String, default: '' },        // short, shown on the card
  details: { type: String, default: '' },    // full profile, paragraphs separated by a blank line
  linkedin: { type: String, default: '' },
  email: { type: String, default: '' },
  founder: { type: Boolean, default: false }, // NEW — shown in the Founders row on top of the leadership page
  order: { type: Number, default: 0 },
  published: { type: Boolean, default: true },
}, { timestamps: true, strict: false }));   // strict:false keeps any extra fields your data already has
