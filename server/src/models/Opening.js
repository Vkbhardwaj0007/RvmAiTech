const mongoose = require('mongoose');
module.exports = mongoose.model('Opening', new mongoose.Schema({
  title: { type: String, required: true },
  slug: { type: String, unique: true, index: true },
  location: { type: String, default: '' },
  type: { type: String, default: 'Full-time' },
  summary: { type: String, default: '' },            // one line shown on the careers card
  description: { type: String, default: '' },        // full description (paragraphs)
  department: { type: String, default: '' },
  experience: { type: String, default: '' },         // e.g. "2–5 years"
  salary: { type: String, default: '' },             // e.g. "₹4–7 LPA" (optional)
  positions: { type: Number, default: 1 },           // number of openings
  responsibilities: { type: [String], default: [] },
  requirements: { type: [String], default: [] },
  skills: { type: [String], default: [] },
  benefits: { type: [String], default: [] },
  order: { type: Number, default: 0 },
  published: { type: Boolean, default: true },
}, { timestamps: true }));
