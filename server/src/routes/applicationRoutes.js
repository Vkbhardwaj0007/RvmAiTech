const router = require('express').Router();
const { submit, list, update, remove } = require('../controllers/applicationController');
const { protect } = require('../middleware/auth');
const { resumeUpload } = require('../middleware/upload');
const a = require('../utils/asyncHandler');

// public: multipart form with "resume" file field
router.post('/', (req, res, next) => resumeUpload.single('resume')(req, res, (err) => {
  if (err) return res.status(400).json({ message: err.code === 'LIMIT_FILE_SIZE' ? 'Resume must be under 5 MB' : err.message });
  next();
}), a(submit));
// admin
router.get('/', protect, a(list));
router.put('/:id', protect, a(update));
router.delete('/:id', protect, a(remove));
module.exports = router;
