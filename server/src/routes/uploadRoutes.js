const router = require('express').Router();
const { protect, requireAdmin } = require('../middleware/auth');
const { upload } = require('../middleware/upload');
const { uploadLimiter } = require('../middleware/publicLimit');
const { publicUrlFor } = require('../lib/publicUrl');

/**
 * Admin-only media upload.
 *
 * The response URL is never built from a bare `req.get('host')`: that header is
 * attacker-controlled, so a crafted request makes the API hand back a URL on
 * someone else's domain, which an admin then saves into the CMS in good faith.
 *
 * It is also NOT built from the client's origin — an earlier attempt at the
 * fix did that, and broke every upload in development, because the frontend
 * (5173) does not serve `/uploads`; this API (4000) does. See lib/publicUrl.js.
 */
router.post(
  '/',
  protect,
  requireAdmin,
  uploadLimiter(),
  (req, res, next) =>
    upload.single('file')(req, res, (err) => {
      if (err) {
        return res.status(400).json({
          message:
            err.code === 'LIMIT_FILE_SIZE'
              ? 'That file is too large'
              : 'Only image or video files are allowed',
        });
      }
      next();
    }),
  (req, res) => {
    if (!req.file) return res.status(400).json({ message: 'No file received' });

    res.json({ url: publicUrlFor(req, `/uploads/${req.file.filename}`) });
  }
);

module.exports = router;
