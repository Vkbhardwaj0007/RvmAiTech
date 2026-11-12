const router = require('express').Router();
const { submit, list, update, remove } = require('../controllers/applicationController');
const { protect, requireAdmin } = require('../middleware/auth');
const { resumeUpload } = require('../middleware/upload');
const { validate } = require('../lib/validate');
const { idParamSchema } = require('../lib/schemas');
const { publicFormLimiter } = require('../middleware/publicLimit');
const a = require('../utils/asyncHandler');

/**
 * Public: multipart form with a "resume" file field.
 *
 * The rate limit runs BEFORE multer, so a flood of 5 MB uploads is rejected
 * without ever being written to disk.
 */
router.post(
  '/',
  publicFormLimiter(),
  (req, res, next) =>
    resumeUpload.single('resume')(req, res, (err) => {
      if (err) {
        return res.status(400).json({
          message:
            err.code === 'LIMIT_FILE_SIZE'
              ? 'Resume must be under 5 MB'
              : 'Resume must be a PDF, DOC or DOCX file',
        });
      }
      next();
    }),
  a(submit)
);

// Admin
router.get('/', protect, requireAdmin, a(list));
router.put('/:id', protect, requireAdmin, validate({ params: idParamSchema }), a(update));
router.delete('/:id', protect, requireAdmin, validate({ params: idParamSchema }), a(remove));

module.exports = router;
