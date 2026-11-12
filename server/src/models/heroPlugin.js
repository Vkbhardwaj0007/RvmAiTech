const mongoose = require('mongoose');

/**
 * Every content item that has its own page (anything with a `slug`: services, products,
 * projects, technologies, workflow, team, careers, posts, clients…) gets its own page hero:
 *   heroImage    uploaded image      -> hero background (and poster while a video loads)
 *   heroVideo    uploaded mp4/webm   -> hero background video (wins over the image)
 *   heroVideoUrl link: direct .mp4, YouTube or Vimeo
 * Empty = the page uses the hero chosen in Admin → Pages for that section.
 * Must be required BEFORE any model is compiled (see the top of server.js).
 */
mongoose.plugin((schema) => {
  if (!schema.path('slug')) return;              // only page-level models, not sub-documents
  schema.add({
    heroImage: { type: String, default: '' },
    heroVideo: { type: String, default: '' },
    heroVideoUrl: { type: String, default: '' },
  });
});
