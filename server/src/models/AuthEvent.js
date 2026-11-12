/**
 * Authentication audit trail.
 *
 * What is recorded: what happened, to which account, from where, and when.
 * What is never recorded: passwords, password hashes, reset tokens, refresh
 * tokens, access tokens, or any Authorization header. See lib/audit.js — the
 * writer strips these rather than trusting callers to omit them.
 */
const mongoose = require('mongoose');

const EVENT_TYPES = [
  'login.success',
  'login.failure',
  'login.ratelimited',
  'logout',
  'refresh.success',
  'refresh.reuse', // a rotated token was presented again: treat as compromise
  'refresh.failure',
  'password.reset.requested',
  'password.reset.completed',
  'password.reset.failure',
  'password.changed',
  'user.created',
  'user.deleted',
  'authz.denied',
  'input.rejected',
];

const authEventSchema = new mongoose.Schema(
  {
    type: { type: String, required: true, enum: EVENT_TYPES, index: true },

    // The handle as typed, so failed logins against non-existent accounts are
    // still attributable. Lower-cased, length-capped.
    userIdAttempted: { type: String, default: '', index: true },

    // Set only when the account actually exists.
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },

    ip: { type: String, default: '' },
    userAgent: { type: String, default: '' },

    // Short, non-sensitive context: { reason: 'bad_password' }, { family: '...' }.
    meta: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

// Keep 180 days by default. Long enough to investigate an incident, short
// enough not to become a liability of its own.
const RETENTION_DAYS = Number(process.env.AUDIT_RETENTION_DAYS || 180);
authEventSchema.index({ createdAt: 1 }, { expireAfterSeconds: RETENTION_DAYS * 86400 });

module.exports = mongoose.models.AuthEvent || mongoose.model('AuthEvent', authEventSchema);
module.exports.EVENT_TYPES = EVENT_TYPES;
