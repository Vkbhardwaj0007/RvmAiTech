const makeCrud = require('../controllers/contentFactory');
const { protect } = require('../middleware/auth');
const a = require('../utils/asyncHandler');

// builds a router for one content model
module.exports = function contentRouter(Model, titleField) {
  const router = require('express').Router();
  const c = makeCrud(Model, titleField);
  // public reads
  router.get('/', a(c.list));
  router.get('/:slug', a(c.getOne));
  // admin writes
  router.post('/', protect, a(c.create));
  router.put('/:id', protect, a(c.update));
  router.delete('/:id', protect, a(c.remove));
  return router;
};
