const router = require('express').Router();
const { getAll, getOne, set } = require('../controllers/siteController');
const { protect } = require('../middleware/auth');
const a = require('../utils/asyncHandler');
router.get('/', a(getAll));
router.get('/:key', a(getOne));
router.put('/', protect, a(set));
module.exports = router;
