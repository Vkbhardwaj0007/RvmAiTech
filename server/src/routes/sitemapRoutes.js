const router = require('express').Router();
const Product = require('../models/Product');
const Service = require('../models/Service');
const Technology = require('../models/Technology');
const Project = require('../models/Project');
const Post = require('../models/Post');
const a = require('../utils/asyncHandler');

function base(req) {
  return process.env.SITE_URL || `${req.protocol}://${req.get('host')}`;
}

router.get('/sitemap.xml', a(async (req, res) => {
  const b = base(req).replace(/\/$/, '');
  const staticPaths = ['/', '/about', '/services', '/technologies', '/products', '/projects', '/leadership', '/news', '/careers', '/blog', '/contact'];
  const [products, services, techs, projects, posts] = await Promise.all([
    Product.find({ published: true }).select('slug updatedAt').lean(),
    Service.find({ published: true }).select('slug updatedAt').lean(),
    Technology.find({ published: true }).select('slug updatedAt').lean(),
    Project.find({ published: true }).select('slug updatedAt').lean(),
    Post.find({ published: true }).select('slug category updatedAt').lean(),
  ]);
  const urls = [
    ...staticPaths.map((p) => ({ loc: b + p })),
    ...products.map((x) => ({ loc: `${b}/products/${x.slug}`, m: x.updatedAt })),
    ...services.map((x) => ({ loc: `${b}/services/${x.slug}`, m: x.updatedAt })),
    ...techs.map((x) => ({ loc: `${b}/technologies/${x.slug}`, m: x.updatedAt })),
    ...projects.map((x) => ({ loc: `${b}/projects`, m: x.updatedAt })),
    ...posts.map((x) => ({ loc: `${b}/${x.category === 'News' ? 'news' : 'blog'}/${x.slug}`, m: x.updatedAt })),
  ];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `  <url><loc>${u.loc}</loc>${u.m ? `<lastmod>${new Date(u.m).toISOString().slice(0, 10)}</lastmod>` : ''}</url>`).join('\n')}\n</urlset>`;
  res.header('Content-Type', 'application/xml').send(xml);
}));

router.get('/robots.txt', (req, res) => {
  const b = base(req).replace(/\/$/, '');
  res.type('text/plain').send(`User-agent: *\nAllow: /\nDisallow: /admin\nSitemap: ${b}/sitemap.xml\n`);
});

module.exports = router;
