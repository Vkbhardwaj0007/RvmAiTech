const mongoose = require('mongoose');
const { hashPassword, verifyPassword } = require('../lib/passwords');

/**
 * Admin user.
 *
 * Authentication is by `userId`, a handle that may or may not be an email
 * address — that is the existing product behaviour and the admin UI labels the
 * field "User ID or email". The `email` field is a separate, optional contact
 * address used for password-reset delivery.
 *
 * The `password` virtual is kept from the previous version so that
 * `user.password = 'x'; await user.save()` still works everywhere it was used
 * (seed script, admin user management) — only the algorithm underneath has
 * changed, from bcrypt(10) to Argon2id.
 */
const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },

    userId: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
      maxlength: 100,
    },

    email: {
      type: String,
      default: '',
      lowercase: true,
      trim: true,
      maxlength: 254,
      validate: {
        // Empty is allowed (not every admin has one); anything present must
        // look like an address, because we send reset links to it.
        validator: (v) => !v || /^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(v),
        message: 'Enter a valid email address',
      },
    },

    // `select: false` keeps the hash out of every ordinary query result;
    // a caller has to ask for it explicitly with .select('+passwordHash').
    passwordHash: { type: String, required: true, select: false },

    role: { type: String, default: 'admin', enum: ['admin'] },

    /**
     * Bumped whenever credentials change. Access tokens carry the version they
     * were minted with, so incrementing this invalidates every outstanding
     * access token for the user immediately — which a plain `{ id }` JWT
     * cannot do.
     */
    tokenVersion: { type: Number, default: 0 },

    passwordChangedAt: { type: Date, default: null },

    /* --- password reset: hashed, expiring, single-use --- */
    resetTokenHash: { type: String, default: '', select: false },
    resetTokenExp: { type: Date, default: null, select: false },
    // Set the moment a token is spent, so a replayed link is refused even
    // inside its validity window.
    resetTokenUsedAt: { type: Date, default: null, select: false },
  },
  { timestamps: true }
);

/* ------------------------------------------------------------- password set */

userSchema.virtual('password').set(function setPassword(plain) {
  this._pw = plain;
});

// Async pre-validate hook: Mongoose awaits a returned promise, so the hash is
// in place before `required: true` on passwordHash is evaluated.
userSchema.pre('validate', async function hashIfNeeded() {
  if (this._pw === undefined || this._pw === null) return;
  this.passwordHash = await hashPassword(this._pw);
  this._pw = undefined;

  // Mark the change so existing sessions die with it. Skipped for a brand-new
  // document: there is nothing outstanding to invalidate, and starting at
  // version 0 keeps the first token's `ver` claim at 0.
  if (!this.isNew) {
    this.tokenVersion = (this.tokenVersion || 0) + 1;
    this.passwordChangedAt = new Date();
  }
});

/**
 * Fail loudly if a password was assigned but never hashed.
 *
 * The hook above is the only thing that turns `_pw` into `passwordHash`, and
 * it runs during validation — so `user.password = 'x'; user.save({
 * validateBeforeSave: false })` would skip it, discard the new password and
 * report success. Nothing does that today, but it is one line away, and a
 * silently-ignored password change is the worst possible failure mode.
 */
userSchema.pre('save', function assertPasswordWasHashed(next) {
  if (this._pw !== undefined && this._pw !== null) {
    return next(
      new Error(
        'User.save() reached with an unhashed password. Do not combine the ' +
          '`password` virtual with validateBeforeSave:false — use ' +
          'User.applyNewPassword() instead.'
      )
    );
  }
  return next();
});

/* ---------------------------------------------------------------- verifying */

/**
 * Checks a candidate password.
 *
 * Returns { ok, needsRehash }. `needsRehash` means the password was right but
 * is still stored as legacy bcrypt (or under weaker Argon2 parameters) — see
 * `upgradeHash` below.
 *
 * Requires the document to have been loaded with `+passwordHash`; without it
 * this correctly returns a failure rather than throwing.
 */
userSchema.methods.checkPassword = function checkPassword(plain) {
  return verifyPassword(plain, this.passwordHash);
};

/**
 * Sets a new password as a single atomic, targeted write.
 *
 * Deliberately NOT `doc.password = x; await doc.save()`. A full save runs
 * document-wide validation — Mongoose validates every path hydrated from the
 * database, not just the modified ones — so a record that predates the current
 * schema (an `email` written before the validator existed, say) makes the save
 * throw. In the password-reset flow that was actively harmful: the token had
 * already been spent by then, so the link was consumed and the password left
 * unchanged, with no way to retry except another reset request.
 *
 * Writing only the fields we mean to change avoids that entirely, and keeps
 * the claim-and-set indivisible: either the whole thing happens or none of it.
 *
 * `filter` lets the caller add preconditions (such as a reset-token claim)
 * that are evaluated inside the same write. Returns the updated document, or
 * null if the filter matched nothing.
 *
 * tokenVersion is incremented, so every outstanding access token dies with the
 * old password. Refresh tokens are the caller's responsibility — see
 * sessions.revokeAllForUser.
 */
userSchema.statics.applyNewPassword = async function applyNewPassword(filter, plain, extraSet = {}) {
  const passwordHash = await hashPassword(plain);

  return this.findOneAndUpdate(
    filter,
    {
      $set: {
        passwordHash,
        passwordChangedAt: new Date(),
        // Any reset link already in flight was issued against the old
        // password; it must not survive the change.
        resetTokenHash: '',
        resetTokenExp: null,
        ...extraSet,
      },
      $inc: { tokenVersion: 1 },
    },
    { new: true }
  );
};

/**
 * Re-stores the password under current parameters, without touching
 * tokenVersion — the credential has not changed, only its encoding, so
 * sessions must survive. Bypasses the `password` virtual for that reason.
 */
userSchema.methods.upgradeHash = async function upgradeHash(plain) {
  const fresh = await hashPassword(plain);
  await this.constructor.updateOne({ _id: this._id }, { $set: { passwordHash: fresh } });
  this.passwordHash = fresh;
};

/** Backwards-compatible alias: the old code called `matchPassword`. */
userSchema.methods.matchPassword = async function matchPassword(plain) {
  const { ok } = await verifyPassword(plain, this.passwordHash);
  return ok;
};

/* ------------------------------------------------------------------- output */

/** The only shape ever sent to a client. Never includes hashes or tokens. */
userSchema.methods.toSafe = function toSafe() {
  return {
    _id: this._id,
    name: this.name,
    userId: this.userId,
    email: this.email,
    role: this.role,
  };
};

module.exports = mongoose.models.User || mongoose.model('User', userSchema);
