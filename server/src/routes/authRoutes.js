const router = require('express').Router();
const { login, refresh, logout, me, forgot, reset } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { requireCsrfToken } = require('../middleware/csrf');
const { validate } = require('../lib/validate');
const { loginSchema, forgotSchema, resetSchema } = require('../lib/schemas');
const rl = require('../middleware/rateLimit');
const a = require('../utils/asyncHandler');

/**
 * Order matters on every one of these:
 *
 *   1. IP rate limit   — cheapest rejection, before any parsing or DB work
 *   2. schema validate — guarantees types, so no operator object reaches Mongo
 *   3. controller      — account-scoped limiting happens inside, where the
 *                        user id is known to be a clean string
 *
 * `/refresh` and `/logout` authenticate by cookie, so they are the only
 * routes that need CSRF protection; the rest use a bearer token, which a
 * cross-site page cannot set.
 */

// A blanket per-IP ceiling on the whole auth surface, on top of the
// per-endpoint limits below.
router.use(rl.limitAuthIp());

router.post('/login', rl.limitLoginIp(), validate({ body: loginSchema }), a(login));

router.post('/forgot', rl.limitForgotIp(), validate({ body: forgotSchema }), a(forgot));

router.post('/reset', rl.limitResetIp(), validate({ body: resetSchema }), a(reset));

router.post('/refresh', requireCsrfToken, a(refresh));

router.post('/logout', requireCsrfToken, a(logout));

router.get('/me', protect, a(me));

module.exports = router;
