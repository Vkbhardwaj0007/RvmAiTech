/**
 * Request schemas.
 *
 * These are the server's own idea of what valid input looks like. The browser
 * does its own checks for a nicer experience, but nothing here trusts them.
 *
 * Every field is typed as a string, which is what stops operator injection:
 * `{ "userId": { "$ne": null } }` fails the schema before it can reach
 * Mongoose. `.strict()` rejects unknown keys, which is what stops mass
 * assignment (`{ role: "superadmin" }`, `{ tokenVersion: 0 }`).
 *
 * NOTE ON `userId`: this application authenticates with a `userId` — a handle
 * that MAY be an email address but is not required to be one. That is the
 * existing product behaviour and the existing admin UI ("User ID or email"),
 * so it is preserved. Email-format validation is applied to the `email` field,
 * where an email is genuinely what is meant.
 */
const { z } = require('zod');
const { config } = require('../config/env');

/* ------------------------------------------------------------- field pieces */

// A login handle: letters, digits and the punctuation that appears in email
// addresses and typical usernames. Deliberately narrow — it is used as a
// database key and a rate-limit key.
const userId = z
  .string({ error: 'User ID is required' })
  .trim()
  .min(3, 'User ID must be at least 3 characters')
  .max(100, 'User ID must be at most 100 characters')
  .regex(/^[a-zA-Z0-9._@+-]+$/, 'User ID may only contain letters, digits and . _ @ + -')
  .transform((v) => v.toLowerCase());

// Passwords are checked for length here only. The real policy (denylist,
// context echo) lives in lib/passwords.js, because it needs to know the user's
// name and id. Bounded here so an unbounded body cannot reach the hasher.
const passwordAtLogin = z
  .string({ error: 'Password is required' })
  .min(1, 'Password is required')
  .max(config.password.maxLength, `Password must be at most ${config.password.maxLength} characters`);

const newPassword = z
  .string({ error: 'Password is required' })
  .min(config.password.minLength, `Password must be at least ${config.password.minLength} characters`)
  .max(config.password.maxLength, `Password must be at most ${config.password.maxLength} characters`);

const email = z
  .string()
  .trim()
  .max(254, 'Email must be at most 254 characters')
  .email('Enter a valid email address')
  .transform((v) => v.toLowerCase());

// Empty is accepted as "not provided": the existing admin form always posts
// every field, sending '' for the ones left blank.
const optionalEmail = z.union([email, z.literal('')]).optional();

const optionalName = z
  .union([z.string().trim().min(1).max(120), z.literal('')])
  .optional();

// base64url, as produced by lib/tokens.randomToken(32).
const opaqueToken = z
  .string({ error: 'Token is required' })
  .trim()
  .min(20, 'Invalid or expired link')
  .max(200, 'Invalid or expired link')
  .regex(/^[A-Za-z0-9_-]+$/, 'Invalid or expired link');

const objectId = z
  .string()
  .trim()
  .regex(/^[a-f0-9]{24}$/i, 'Not found');

const shortText = (label, max = 200) =>
  z.string({ error: `${label} is required` }).trim().min(1, `${label} is required`).max(max, `${label} must be at most ${max} characters`);

/* ----------------------------------------------------------------- auth */

const loginSchema = z
  .object({
    userId,
    password: passwordAtLogin,
  })
  .strict();

const forgotSchema = z
  .object({
    userId,
  })
  .strict();

const resetSchema = z
  .object({
    token: opaqueToken,
    password: newPassword,
  })
  .strict();

/* ----------------------------------------------------------------- users */

const createUserSchema = z
  .object({
    userId,
    password: newPassword,
    name: optionalName,
    email: optionalEmail,
    // `role` is intentionally absent: it is set server-side. Because the
    // schema is strict, sending it is a 400 rather than a silent escalation.
  })
  .strict();

const setPasswordSchema = z.object({ password: newPassword }).strict();

const setEmailSchema = z.object({ email: optionalEmail }).strict();

const idParamSchema = z.object({ id: objectId });

/* --------------------------------------------------------------- contact */

const contactSchema = z
  .object({
    name: shortText('Name', 120),
    email: optionalEmail,
    phone: z.string().trim().max(32).optional(),
    company: z.string().trim().max(160).optional(),
    subject: z.string().trim().max(200).optional(),
    budget: z.string().trim().max(100).optional(),
    timeline: z.string().trim().max(100).optional(),
    message: z.string().trim().max(5000).optional(),
    projectCategory: z.string().trim().max(200).optional(),
    requirements: z.string().trim().max(5000).optional(),
  })
  .passthrough();

module.exports = {
  loginSchema,
  forgotSchema,
  resetSchema,
  createUserSchema,
  setPasswordSchema,
  setEmailSchema,
  idParamSchema,
  contactSchema,
  fields: { userId, email, newPassword, opaqueToken, objectId },
};
