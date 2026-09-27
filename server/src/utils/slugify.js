module.exports = (s) => String(s || '').toLowerCase().trim()
  .replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').slice(0, 80);
