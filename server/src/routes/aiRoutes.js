const router = require('express').Router();
const { ask } = require('../controllers/aiController');
const { publicFormLimiter } = require('../middleware/publicLimit');
const a = require('../utils/asyncHandler');

// Rate limited public chat endpoint
router.post('/ask', a(ask));

module.exports = router;

