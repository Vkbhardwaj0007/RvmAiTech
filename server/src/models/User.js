const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  userId: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
  email: { type: String, default: '' },
  passwordHash: { type: String, required: true, select: false },
  role: { type: String, default: 'admin' },
  resetTokenHash: { type: String, default: '' },
  resetTokenExp: { type: Date },
}, { timestamps: true });
userSchema.virtual('password').set(function (p) { this._pw = p; });
userSchema.pre('validate', async function () {
  if (!this._pw) return;
  this.passwordHash = await bcrypt.hash(this._pw, await bcrypt.genSalt(10));
  this._pw = undefined;
});
userSchema.methods.matchPassword = function (p) { return bcrypt.compare(p, this.passwordHash); };
userSchema.methods.toSafe = function () { return { _id: this._id, name: this.name, userId: this.userId, email: this.email, role: this.role }; };
module.exports = mongoose.model('User', userSchema);
