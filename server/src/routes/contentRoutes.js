const makeCrud = require('../controllers/contentFactory');
const { protect, requireAdmin, optionalAuth } = require('../middleware/auth');
const { validate } = require('../lib/validate');
const { idParamSchema } = require('../lib/schemas');
const a = require('../utils/asyncHandler');

// Builds a router for one content model.
module.exports = function contentRouter(Model, titleField) {
  const router = require('express').Router();
  const c = makeCrud(Model, titleField);

  /**
   * Reads are public, but run through `optionalAuth` so the controller can
   * tell an anonymous visitor from a signed-in admin. That distinction is what
   * keeps `?all=1` and direct-by-slug access from exposing unpublished drafts
   * (see contentFactory.js).
   */
  router.get('/', optionalAuth, a(c.list));
  router.get('/:slug', optionalAuth, a(c.getOne));

  // Writes: authenticated and admin-only.
  router.post('/', protect, requireAdmin, a(c.create));
  router.put('/:id', protect, requireAdmin, validate({ params: idParamSchema }), a(c.update));
  router.delete('/:id', protect, requireAdmin, validate({ params: idParamSchema }), a(c.remove));

  return router;
};
