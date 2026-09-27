const slugify = require('../utils/slugify');
// titleField: which field to slugify from (title or name)
function makeCrud(Model, titleField = 'title') {
  return {
    // public list — only published; ?category= & ?all= (admin) supported
    list: async (req, res) => {
      const filter = {};
      if (req.query.category && req.query.category !== 'all') filter.category = req.query.category;
      if (!req.query.all) filter.published = true;
      const docs = await Model.find(filter).sort({ order: 1, createdAt: -1 }).lean();
      res.json({ count: docs.length, items: docs });
    },
    getOne: async (req, res) => {
      const doc = await Model.findOne({ slug: req.params.slug }).lean();
      if (!doc) return res.status(404).json({ message: 'Not found' });
      res.json({ item: doc });
    },
    create: async (req, res) => {
      const body = { ...req.body };
      body.slug = body.slug ? slugify(body.slug) : slugify(body[titleField]);
      if (!body.slug) return res.status(400).json({ message: `${titleField} required` });
      const exists = await Model.findOne({ slug: body.slug });
      if (exists) body.slug = `${body.slug}-${Date.now().toString().slice(-4)}`;
      const doc = await Model.create(body);
      res.status(201).json({ item: doc });
    },
    update: async (req, res) => {
      const body = { ...req.body };
      if (body.slug) body.slug = slugify(body.slug);
      const doc = await Model.findByIdAndUpdate(req.params.id, body, { new: true });
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
