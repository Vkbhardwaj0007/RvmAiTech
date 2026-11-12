/**
 * Refresh token records — one row per issued refresh token.
 *
 * Only the SHA-256 of the token is stored, so this collection cannot be used
 * to impersonate anyone even if the database leaks.
 *
 * Tokens are rotated: every refresh marks the presented token used and issues
 * a new one in the same `family`. A token that is presented twice means it
 * leaked (an attacker and the real user are both using it), so the whole
 * family is revoked and that session has to sign in again. This is the
 * standard OAuth refresh-token-rotation defence.
 */
const mongoose = require('mongoose');

const refreshTokenSchema = new mongoose.Schema(
  {
    tokenHash: { type: String, required: true, unique: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },

    // All tokens descended from one sign-in share a family id.
    family: { type: String, required: true, index: true },

    expiresAt: { type: Date, required: true },

    // Set when this token is exchanged. A second presentation after this is
    // set is the reuse signal.
    usedAt: { type: Date, default: null },

    revokedAt: { type: Date, default: null },
    revokedReason: { type: String, default: '' },

    // Truncated request metadata, for the audit trail only. Never used for
    // authorisation: both are attacker-controlled.
    ip: { type: String, default: '' },
    userAgent: { type: String, default: '' },
  },
  { timestamps: true }
);

// Mongo removes expired rows on its own, so dead sessions do not accumulate.
// (The sweep runs about once a minute, so `expiresAt` is still checked in code
// rather than relied on for correctness.)
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

refreshTokenSchema.methods.isLive = function isLive(now = new Date()) {
  return !this.revokedAt && !this.usedAt && this.expiresAt > now;
};

module.exports = mongoose.models.RefreshToken || mongoose.model('RefreshToken', refreshTokenSchema);
