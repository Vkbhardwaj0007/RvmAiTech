const slugify = require('../utils/slugify');

/**
 * Generic CRUD for the content collections.
 *
 * Two authorisation bugs were fixed here:
 *
 *  1. `?all=1` used to disable the `published` filter for ANYONE. Unpublished
 *     drafts were one query parameter away from being public. It now requires
 *     a signed-in admin (`optionalAuth` populates `req.user`).
 *
 *  2. `getOne` had no `published` check at all, so any draft could be fetched
 *     directly by slug. Anonymous callers now get 404 for a draft — the same
 *     answer as for a slug that does not exist, so the endpoint does not
 *     confirm that a draft with that name is in progress.
 *
 * Mass assignment is also closed off: request bodies no longer get to set
 * `_id`, timestamps or the version key.
 */

// Fields a client may never set, whatever the model.
const PROTECTED_FIELDS = ['_id', 'id', '__v', 'createdAt', 'updatedAt'];

function cleanBody(raw) {
  const body = { ...raw };
  for (const field of PROTECTED_FIELDS) delete body[field];
  return body;
}

function isAdmin(req) {
  return Boolean(req.user && req.user.role === 'admin');
}

function makeCrud(Model, titleField = 'title') {
  return {
    /**
     * Public list. Only published items, unless an authenticated admin asks
     * for everything with `?all=1`.
     */
    list: async (req, res) => {
      const filter = {};
      if (req.query.category && req.query.category !== 'all') {
        filter.category = String(req.query.category);
      }

      const wantsAll = Boolean(req.query.all) && isAdmin(req);
      if (!wantsAll) filter.published = true;

      const docs = await Model.find(filter).sort({ order: 1, createdAt: -1 }).lean();
      res.json({ count: docs.length, items: docs });
    },

    getOne: async (req, res) => {
      const doc = await Model.findOne({ slug: String(req.params.slug) }).lean();

      // Same 404 for "no such slug" and "exists but unpublished".
      if (!doc || (doc.published === false && !isAdmin(req))) {
        return res.status(404).json({ message: 'Not found' });
      }
      res.json({ item: doc });
    },

    create: async (req, res) => {
      const body = cleanBody(req.body);
      body.slug = body.slug ? slugify(body.slug) : slugify(body[titleField]);
      if (!body.slug) return res.status(400).json({ message: `${titleField} is required` });

      if (await Model.exists({ slug: body.slug })) {
        body.slug = `${body.slug}-${Date.now().toString().slice(-4)}`;
      }

      const doc = await Model.create(body);
      res.status(201).json({ item: doc });
    },

    update: async (req, res) => {
      const body = cleanBody(req.body);
      if (body.slug) body.slug = slugify(body.slug);

      // `runValidators` matters: without it a PUT bypasses every schema rule
      // that `create` enforces.
      const doc = await Model.findByIdAndUpdate(req.params.id, body, {
        new: true,
        runValidators: true,
      });
      if (!doc) return res.status(404).json({ message: 'Not found' });
      res.json({ item: doc });
    },

    remove: async (req, res) => {
      const doc = await Model.findByIdAndDelete(req.params.id);
      if (!doc) return res.status(404).json({ message: 'Not found' });
      res.json({ message: 'Deleted' });
    },
  };
}

module.exports = makeCrud;
