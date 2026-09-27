const router = require('express').Router();
const { login, me, forgot, reset } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const a = require('../utils/asyncHandler');
router.post('/login', a(login));
router.post('/forgot', a(forgot));
router.post('/reset', a(reset));
router.get('/me', protect, a(me));
module.exports = router;
