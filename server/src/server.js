require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const contentRouter = require('./routes/contentRoutes');
const Service = require('./models/Service');
const Product = require('./models/Product');
const Project = require('./models/Project');
const Technology = require('./models/Technology');
const Workflow = require('./models/Workflow');
const Industry = require('./models/Industry');
const Testimonial = require('./models/Testimonial');
const Stat = require('./models/Stat');
const Post = require('./models/Post');
const TeamMember = require('./models/TeamMember');
const Opening = require('./models/Opening');
const Client = require('./models/Client');

const app = express();
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json());

// serve uploaded images
const path = require('path');
const { UP } = require('./middleware/upload');
app.use('/uploads', express.static(UP));

app.get('/api/health', (req, res) => res.json({ ok: true, ts: Date.now() }));

// sitemap.xml + robots.txt (at root)
app.use('/', require('./routes/sitemapRoutes'));

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/upload', require('./routes/uploadRoutes'));
app.use('/api/services', contentRouter(Service, 'title'));
app.use('/api/products', contentRouter(Product, 'name'));
app.use('/api/projects', contentRouter(Project, 'title'));
app.use('/api/technologies', contentRouter(Technology, 'title'));
app.use('/api/workflow', contentRouter(Workflow, 'title'));
app.use('/api/industries', contentRouter(Industry, 'title'));
app.use('/api/testimonials', contentRouter(Testimonial, 'author'));
app.use('/api/stats', contentRouter(Stat, 'label'));
app.use('/api/posts', contentRouter(Post, 'title'));
app.use('/api/team', contentRouter(TeamMember, 'name'));
app.use('/api/openings', contentRouter(Opening, 'title'));
app.use('/api/clients', contentRouter(Client, 'name'));
app.use('/api/contact', require('./routes/contactRoutes'));
app.use('/api/applications', require('./routes/applicationRoutes'));   // careers form
app.use('/api/site', require('./routes/siteRoutes'));

// public nav menu (matches the header)
app.get('/api/menu', (req, res) => res.json({
  menu: [
    { label: 'Home', path: '/' },
    { label: 'About Us', path: '/about', children: [
      { label: 'About Us', path: '/about' },
      { label: 'Our Leadership', path: '/leadership' },
      { label: 'In News', path: '/news' },
      { label: 'Careers', path: '/careers' },
    ]},
    { label: 'Services', path: '/services' },
    { label: 'Technologies', path: '/technologies' },
    { label: 'Products', path: '/products', children: [
      { label: 'All Products', path: '/products' },
      { label: 'MDMS', path: '/products?category=MDMS' },
      { label: 'Datalogger', path: '/products?category=Datalogger' },
      { label: 'Home Automation', path: '/products?category=Home%20Automation' },
    ]},
    { label: 'MDMS', path: '/products?category=MDMS' },
    { label: 'Datalogger', path: '/products?category=Datalogger' },
    { label: 'Projects', path: '/projects' },
    { label: 'More', path: '#', children: [
      { label: 'Blogs', path: '/blog' },
      { label: 'Contact', path: '/contact' },
    ]},
  ],
}));

// serve built frontend (production single-service deploy) when SERVE_CLIENT=true
if (process.env.SERVE_CLIENT === 'true') {
  const dist = path.join(__dirname, '..', '..', 'web', 'dist');
  const fs = require('fs');
  if (fs.existsSync(dist)) {
    app.use(express.static(dist));
    app.get(/^(?!\/api|\/uploads|\/sitemap|\/robots).*/, (req, res) => res.sendFile(path.join(dist, 'index.html')));
    console.log('Serving frontend from web/dist');
  }
}

app.use((req, res) => res.status(404).json({ message: 'Route not found' }));
app.use((err, req, res, next) => {
  console.error(err);
  if (err && err.code === 11000) return res.status(409).json({ message: 'Duplicate', key: err.keyValue });
  if (err && err.name === 'ValidationError') return res.status(400).json({ message: err.message });
  res.status(500).json({ message: 'Server error' });
});

const PORT = process.env.PORT || 4000;
connectDB().then(() => app.listen(PORT, () => console.log(`Rvmaitech API on http://localhost:${PORT}`)));
