const router = require('express').Router();
const { list, create, setPassword, remove, setEmail } = require('../controllers/userController');
const { protect, requireAdmin } = require('../middleware/auth');
const { validate } = require('../lib/validate');
const {
  createUserSchema,
  setPasswordSchema,
  setEmailSchema,
  idParamSchema,
} = require('../lib/schemas');
const a = require('../utils/asyncHandler');

// Authenticated AND authorised. `requireAdmin` is not redundant: it is what
// keeps a future non-admin role from inheriting user management by default.
router.use(protect, requireAdmin);

router.get('/', a(list));
router.post('/', validate({ body: createUserSchema }), a(create));
router.put('/:id/password', validate({ params: idParamSchema, body: setPasswordSchema }), a(setPassword));
router.put('/:id/email', validate({ params: idParamSchema, body: setEmailSchema }), a(setEmail));
router.delete('/:id', validate({ params: idParamSchema }), a(remove));

module.exports = router;
