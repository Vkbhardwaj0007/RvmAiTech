const User = require('../models/User');

async function list(req, res) {
  const users = await User.find().select('name userId email role createdAt').sort({ createdAt: 1 }).lean();
  res.json({ users });
}
async function create(req, res) {
  const { name, userId, password, email } = req.body;
  if (!userId || !password) return res.status(400).json({ message: 'userId and password required' });
  if (String(password).length < 6) return res.status(400).json({ message: 'Password min 6 characters' });
  const uid = String(userId).toLowerCase().trim();
  if (await User.findOne({ userId: uid })) return res.status(409).json({ message: 'User ID already exists' });
  const u = new User({ name: name || uid, userId: uid, email: email || '', password, role: 'admin' });
  await u.save();
  res.status(201).json({ user: u.toSafe() });
}
async function setPassword(req, res) {
  const { password } = req.body;
  if (!password || String(password).length < 6) return res.status(400).json({ message: 'Password min 6 characters' });
  const u = await User.findById(req.params.id);
  if (!u) return res.status(404).json({ message: 'User not found' });
  u.password = password;
  await u.save();
  res.json({ ok: true });
}
async function remove(req, res) {
  if (String(req.params.id) === String(req.user._id)) return res.status(400).json({ message: "Can't delete yourself" });
  if (await User.countDocuments() <= 1) return res.status(400).json({ message: "Can't delete the last admin" });
  const u = await User.findByIdAndDelete(req.params.id);
  if (!u) return res.status(404).json({ message: 'User not found' });
  res.json({ ok: true });
}
async function setEmail(req, res) {
  const u = await User.findById(req.params.id);
  if (!u) return res.status(404).json({ message: 'User not found' });
  u.email = String(req.body.email || '').trim();
  await u.save();
  res.json({ ok: true });
}
module.exports = { list, create, setPassword, remove, setEmail };
