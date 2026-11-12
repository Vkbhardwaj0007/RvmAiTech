/**
 * Admin user management.
 *
 * Every route here is behind `protect` + `requireAdmin` (see userRoutes.js).
 * Input shapes are guaranteed by the route schemas, so these functions are
 * about policy, not parsing.
 */
const User = require('../models/User');
const sessions = require('../lib/sessions');
const audit = require('../lib/audit');
const { passwordProblems } = require('../lib/passwords');

/** Never selects passwordHash or reset-token fields. */
async function list(req, res) {
  const users = await User.find()
    .select('name userId email role createdAt')
    .sort({ createdAt: 1 })
    .lean();
  res.json({ users });
}

async function create(req, res) {
  const { userId, password, name, email } = req.body;

  const problems = passwordProblems(password, { 'user ID': userId, name: name || '' });
  if (problems.length) {
    return res.status(400).json({ message: problems[0], errors: { password: problems[0] } });
  }

  // Checked explicitly for a clean 409; the unique index is still the real
  // guarantee against a concurrent duplicate (handled by the error mapper).
  if (await User.exists({ userId })) {
    return res.status(409).json({ message: 'That user ID is already taken' });
  }

  // `role` is set here, never taken from the body — the schema is strict, so a
  // request trying to send one is rejected outright rather than ignored.
  const user = new User({
    name: name || userId,
    userId,
    email: email || '',
    password,
    role: 'admin',
  });
  await user.save();

  audit.record('user.created', req, {
    user: req.user,
    meta: { createdUserId: user.userId, createdId: String(user._id) },
  });

  return res.status(201).json({ user: user.toSafe() });
}

/**
 * Sets another admin's password (or your own).
 *
 * Saving bumps `tokenVersion`, which kills that user's access tokens; we then
 * revoke their refresh tokens too, so the change actually signs them out
 * everywhere instead of leaving a 7-day session alive.
 */
async function setPassword(req, res) {
  const { password } = req.body;

  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: 'User not found' });

  const problems = passwordProblems(password, { 'user ID': user.userId, name: user.name });
  if (problems.length) {
    return res.status(400).json({ message: problems[0], errors: { password: problems[0] } });
  }

  /**
   * A targeted write rather than a full save: a record that predates the
   * current schema would otherwise fail document-wide validation and the
   * password change would be refused for reasons that have nothing to do with
   * the password. This also clears any pending reset token, so a link mailed
   * out before this change cannot be used afterwards to overwrite the new
   * password.
   */
  const updated = await User.applyNewPassword({ _id: user._id }, password);
  if (!updated) return res.status(404).json({ message: 'User not found' });

  await sessions.revokeAllForUser(user._id, 'password_changed');

  audit.record('password.changed', req, {
    user: req.user,
    meta: { targetUserId: user.userId, self: String(user._id) === String(req.user._id) },
  });

  // Changing your own password invalidates the token you are holding, so the
  // client is told to re-authenticate rather than silently 401-ing on the next
  // request.
  const selfChange = String(user._id) === String(req.user._id);
  if (selfChange) sessions.clearSessionCookies(res);

  return res.json({ ok: true, reauthRequired: selfChange });
}

async function remove(req, res) {
  if (String(req.params.id) === String(req.user._id)) {
    return res.status(400).json({ message: "You can't delete your own account" });
  }
  if ((await User.countDocuments()) <= 1) {
    return res.status(400).json({ message: "You can't delete the last admin" });
  }

  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) return res.status(404).json({ message: 'User not found' });

  // A deleted user's sessions must die with them.
  await sessions.revokeAllForUser(user._id, 'user_deleted');

  audit.record('user.deleted', req, {
    user: req.user,
    meta: { deletedUserId: user.userId, deletedId: String(user._id) },
  });

  return res.json({ ok: true });
}

async function setEmail(req, res) {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: 'User not found' });

  user.email = req.body.email || '';
  // Any pending reset link was sent to the old address — invalidate it.
  user.resetTokenHash = '';
  user.resetTokenExp = null;
  await user.save();

  return res.json({ ok: true, user: user.toSafe() });
}

module.exports = { list, create, setPassword, remove, setEmail };
