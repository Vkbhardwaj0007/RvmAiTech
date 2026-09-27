const router = require('express').Router();
const { submit, list, markRead } = require('../controllers/contactController');
const { protect } = require('../middleware/auth');
const a = require('../utils/asyncHandler');
router.post('/', a(submit));            // public
router.get('/', protect, a(list));      // admin
router.put('/:id/read', protect, a(markRead));
module.exports = router;
