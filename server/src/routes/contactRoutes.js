const router = require('express').Router();
const { submit, list, markRead } = require('../controllers/contactController');
const { protect, requireAdmin } = require('../middleware/auth');
const { validate } = require('../lib/validate');
const { contactSchema, idParamSchema } = require('../lib/schemas');
const { publicFormLimiter } = require('../middleware/publicLimit');
const a = require('../utils/asyncHandler');

// Public, so it needs its own limit: an unthrottled form that sends email is
// both a spam relay and a way to bill someone else's SMTP quota.
router.post('/', publicFormLimiter(), validate({ body: contactSchema }), a(submit));

router.get('/', protect, requireAdmin, a(list));
router.put('/:id/read', protect, requireAdmin, validate({ params: idParamSchema }), a(markRead));

module.exports = router;
