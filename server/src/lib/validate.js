/**
 * Schema validation middleware.
 *
 * On success the parsed (trimmed, lower-cased, type-checked) value REPLACES
 * the raw input, so controllers downstream can never accidentally read the
 * unvalidated version.
 *
 * On failure it answers 400 with field-level messages that describe only the
 * caller's own input — never a stack trace, a database error or an internal
 * path. Zod's raw error object is not serialised to the client.
 */

/** Zod issues -> { field: message }, first message per field wins. */
function fieldErrors(error) {
  const out = {};
  for (const issue of error?.issues || []) {
    const key = Array.isArray(issue.path) && issue.path.length ? issue.path.join('.') : '_';
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

/**
 * @param {object} shape  { body?, query?, params? } of zod schemas
 * @param {object} opts   { message } overrides the summary line
 */
function validate(shape, opts = {}) {
  const parts = Object.entries(shape);

  return function validateMiddleware(req, res, next) {
    const errors = {};

    for (const [part, schema] of parts) {
      // `req.body` is undefined when no JSON body was sent at all; treat that
      // as an empty object so "field required" is what the caller is told,
      // rather than a TypeError turning into a 500.
      const input = req[part] === undefined || req[part] === null ? {} : req[part];
      const result = schema.safeParse(input);

      if (result.success) {
        if (part === 'query' || part === 'params') {
          // Express 5 exposes these as getters; mutate rather than reassign.
          for (const key of Object.keys(req[part] || {})) delete req[part][key];
          Object.assign(req[part], result.data);
        } else {
          req[part] = result.data;
        }
      } else {
        Object.assign(errors, fieldErrors(result.error));
      }
    }

    if (Object.keys(errors).length) {
      return res.status(400).json({
        message: opts.message || 'Please check the highlighted fields',
        errors,
      });
    }

    return next();
  };
}

module.exports = { validate, fieldErrors };
