const jwt = require('jsonwebtoken');
const User = require('../models/User');
async function protect(req, res, next) {
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.split(' ')[1] : null;
  if (!token) return res.status(401).json({ message: 'Not authorized' });
  try {
    const d = jwt.verify(token, process.env.JWT_SECRET);
    const u = await User.findById(d.id);
    if (!u) return res.status(401).json({ message: 'User gone' });
    req.user = u; next();
  } catch { return res.status(401).json({ message: 'Invalid token' }); }
}
module.exports = { protect };
