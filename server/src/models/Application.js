const mongoose = require('mongoose');
// Job application submitted from the public Careers page
module.exports = mongoose.model('Application', new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true, lowercase: true },
  phone: { type: String, required: true, trim: true },
  position: { type: String, default: 'General application', trim: true },
  opening: { type: mongoose.Schema.Types.ObjectId, ref: 'Opening' },
  qualification: { type: String, required: true, trim: true },
  experienceYears: { type: String, default: '', trim: true },
  currentCompany: { type: String, default: '', trim: true },
  currentDesignation: { type: String, default: '', trim: true },
  currentSalary: { type: String, default: '', trim: true },
  expectedSalary: { type: String, default: '', trim: true },
  noticePeriod: { type: String, default: '', trim: true },
  location: { type: String, default: '', trim: true },
  linkedin: { type: String, default: '', trim: true },
  coverNote: { type: String, default: '', trim: true },
  resumeUrl: { type: String, default: '' },
  resumeName: { type: String, default: '' },
  status: { type: String, enum: ['new', 'shortlisted', 'rejected', 'hired'], default: 'new' },
  read: { type: Boolean, default: false },
}, { timestamps: true }));
