const router = require('express').Router();
const { protect } = require('../middleware/auth');
const { upload } = require('../middleware/upload');
router.post('/', protect, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file' });
  const url = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
  res.json({ url });
});
module.exports = router;
