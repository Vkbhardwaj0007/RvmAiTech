const router = require('express').Router();
const { z } = require('zod');
const { getAll, getOne, set } = require('../controllers/siteController');
const { protect, requireAdmin } = require('../middleware/auth');
const { validate } = require('../lib/validate');
const a = require('../utils/asyncHandler');

// `key` is used as a database key, so it is constrained to a safe alphabet
// rather than accepted as free text.
const keyField = z
  .string()
  .trim()
  .min(1, 'key is required')
  .max(64)
  .regex(/^[a-zA-Z0-9._-]+$/, 'Invalid key');

router.get('/', a(getAll));
router.get('/:key', validate({ params: z.object({ key: keyField }) }), a(getOne));

router.put(
  '/',
  protect,
  requireAdmin,
  // `value` is intentionally unconstrained — it holds arbitrary page content —
  // but it is bounded by the global JSON body limit, and the global
  // sanitizer has already removed any `$`-prefixed keys.
  validate({ body: z.object({ key: keyField, value: z.unknown() }).strict() }),
  a(set)
);

module.exports = router;
