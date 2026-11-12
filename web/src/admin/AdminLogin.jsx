import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from 'framer-motion';
import { User, Lock, Eye, EyeOff, ArrowRight, ShieldCheck } from 'lucide-react';
import client, { API_BASE, TOKEN_KEY, refreshAccessToken, signOut } from '../api/client';

const REMEMBER_KEY = 'rv_admin_uid';

// Mirrors the server policy (PASSWORD_MIN_LENGTH). Client-side checks are a
// convenience only — the server enforces this independently, and a request
// that skips the form is rejected there.
export const PASSWORD_MIN_LENGTH = 12;

/* ---------- auth helpers (imported by AdminLayout) ---------- */

// Read the JWT expiry without a library; a non-JWT token is left to the server to judge.
function tokenAlive(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    return !payload.exp || Date.now() < payload.exp * 1000;
  } catch { return true; }
}

/** True when a usable access token is in hand right now. */
export function isAuthed() {
  const t = localStorage.getItem(TOKEN_KEY);
  if (!t) return false;
  if (!tokenAlive(t)) { localStorage.removeItem(TOKEN_KEY); return false; }
  return true;
}

/**
 * Access tokens now last 15 minutes rather than 12 hours, so an admin coming
 * back to an open tab will often have an expired one — while still holding a
 * perfectly good refresh cookie that lasts a week.
 *
 * This asks the server to exchange that cookie for a fresh access token, so
 * the short token lifetime does not turn into "signed out every 15 minutes".
 * Resolves true if a session was recovered.
 */
export async function restoreSession() {
  if (isAuthed()) return true;
  try {
    await refreshAccessToken();
    return true;
  } catch {
    return false;
  }
}

/** Ends the session on the server too, not just in this browser. */
export async function logout() {
  await signOut();
  location.href = '/admin/login';
}

// Turn an axios error into something the admin can act on.
function explain(ex, mode) {
  if (!ex?.response) {
    const where = API_BASE || window.location.origin;
    return `Could not reach the server at ${where}/api. Is the backend running (npm run dev in /server)? If the API lives elsewhere, set VITE_API_URL in web/.env and rebuild.`;
  }
  const { status, data } = ex.response;
  const m = data?.message;
  // The server returns field-level messages for validation failures; show the
  // first one, since this form has no per-field error slots.
  const fieldError = data?.errors && Object.values(data.errors)[0];
  if (status === 400) return fieldError || m || 'Please check what you entered.';
  if (status === 401) return m || 'Wrong user ID or password.';
  if (status === 403) return 'Your session could not be verified. Please reload the page.';
  if (status === 404) return `The ${mode === 'login' ? 'login' : 'reset'} endpoint was not found (/api/auth/${mode === 'login' ? 'login' : 'forgot'}). Check that authRoutes is mounted in server.js.`;
  if (status === 429) return 'Too many attempts — wait a minute and try again.';
  if (status >= 500) return m || 'Server error — check the server logs (is MongoDB connected?).';
  return m || `Request failed (${status}).`;
}

/* ---------- visual bits ---------- */

const NOISE = "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

// One travelling light beam along a card edge (prop = the CSS side it slides along).
const beam = (prop, delay) => ({
  initial: { filter: 'blur(2px)' },
  animate: { [prop]: ['-50%', '100%'], opacity: [0.3, 0.75, 0.3], filter: ['blur(1px)', 'blur(2.5px)', 'blur(1px)'] },
  transition: {
    [prop]: { duration: 2.5, ease: 'easeInOut', repeat: Infinity, repeatDelay: 1, delay },
    opacity: { duration: 1.2, repeat: Infinity, repeatType: 'mirror', delay },
    filter: { duration: 1.5, repeat: Infinity, repeatType: 'mirror', delay },
  },
});
const dot = (duration, delay) => ({
  animate: { opacity: [0.2, 0.5, 0.2] },
  transition: { duration, repeat: Infinity, repeatType: 'mirror', delay },
});

export default function AdminLogin() {
  const nav = useNavigate();
  const [params] = useSearchParams();
  const expired = params.get('expired') === '1';
  const sessionProblem = params.get('session') === '1';

  const [mode, setMode] = useState('login'); // login | forgot
  const [userId, setUserId] = useState(() => localStorage.getItem(REMEMBER_KEY) || 'admin');
  const [remember, setRemember] = useState(() => !!localStorage.getItem(REMEMBER_KEY));
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [focused, setFocused] = useState(null);
  const [err, setErr] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const pwRef = useRef(null);

  // Already signed in, or holding a refresh cookie we can exchange? Straight
  // to the dashboard rather than asking for a password again.
  useEffect(() => {
    let cancelled = false;
    if (isAuthed()) { nav('/admin', { replace: true }); return undefined; }
    if (expired || sessionProblem) return undefined; // we just came from a failed session
    restoreSession().then((ok) => { if (ok && !cancelled) nav('/admin', { replace: true }); });
    return () => { cancelled = true; };
  }, [nav, expired, sessionProblem]);
  // Remembered user ID -> jump to the password box.
  useEffect(() => { if (localStorage.getItem(REMEMBER_KEY)) pwRef.current?.focus(); }, []);

  // 3D tilt that follows the pointer (spring-smoothed).
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rotateX = useSpring(useTransform(my, [-260, 260], [9, -9]), { stiffness: 170, damping: 20 });
  const rotateY = useSpring(useTransform(mx, [-260, 260], [-9, 9]), { stiffness: 170, damping: 20 });
  const onMove = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    mx.set(e.clientX - r.left - r.width / 2);
    my.set(e.clientY - r.top - r.height / 2);
  };
  const onLeave = () => { mx.set(0); my.set(0); };

  /**
   * Client-side validation here is purely to save the user a round trip and
   * give an immediate message. The same rules are enforced server-side, and
   * skipping this form entirely changes nothing — see the server's schema
   * validation.
   */
  function clientProblem(typed) {
    if (!typed) return 'Enter your user ID.';
    if (typed.length < 3) return 'That user ID is too short.';
    if (!/^[a-zA-Z0-9._@+-]+$/.test(typed)) return 'A user ID can only contain letters, digits and . _ @ + -';
    if (mode === 'login' && !password) return 'Enter your password.';
    return null;
  }

  async function submit(e) {
    e.preventDefault();
    // Guards against a double submit: a second click while the first request
    // is open would otherwise spend another attempt against the rate limit.
    if (busy) return;

    setErr(''); setMsg('');

    // The server lower-cases user ids itself, so normalise here too and avoid
    // the old "retry with lowercase" fallback — that second request counted as
    // another failed attempt against the brute-force limiter.
    const typed = userId.trim().toLowerCase();

    const problem = clientProblem(typed);
    if (problem) { setErr(problem); return; }

    setBusy(true);
    try {
      if (mode === 'login') {
        const r = await client.post('/auth/login', { userId: typed, password });
        const token = r.data?.token;
        if (!token) { setErr('Signed in, but no token came back — check the /api/auth/login response.'); return; }

        localStorage.setItem(TOKEN_KEY, token);
        if (remember) localStorage.setItem(REMEMBER_KEY, typed); else localStorage.removeItem(REMEMBER_KEY);

        // Never leave the typed password in component state after use.
        setPassword('');
        nav('/admin', { replace: true });
      } else {
        const r = await client.post('/auth/forgot', { userId: typed });
        setMsg(r.data?.message || 'If that account exists and has an email address on file, a reset link has been sent.');
      }
    } catch (ex) {
      setErr(explain(ex, mode));
    } finally {
      setBusy(false);
    }
  }

  function switchMode() {
    setMode((m) => (m === 'login' ? 'forgot' : 'login'));
    setErr(''); setMsg('');
  }

  return (
    <div className="adm-login l3d">
      {/* background: gradient, grain, glows */}
      <div className="l3d-bg" />
      <div className="l3d-noise" style={{ backgroundImage: NOISE }} />
      <div className="l3d-glow top" />
      <motion.div
        className="l3d-glow top soft"
        animate={{ opacity: [0.15, 0.32, 0.15], scale: [0.98, 1.03, 0.98] }}
        transition={{ duration: 8, repeat: Infinity, repeatType: 'mirror' }}
      />
      <motion.div
        className="l3d-glow bottom"
        animate={{ opacity: [0.35, 0.55, 0.35], scale: [1, 1.08, 1] }}
        transition={{ duration: 6, repeat: Infinity, repeatType: 'mirror', delay: 1 }}
      />
      <div className="l3d-spot a" />
      <div className="l3d-spot b" />

      <motion.div
        className="l3d-persp"
        initial={{ opacity: 0, y: 26, rotateX: 10 }}
        animate={{ opacity: 1, y: 0, rotateX: 0 }}
        transition={{ duration: 0.8, ease: [0.2, 0.8, 0.2, 1] }}
      >
        <motion.div className="l3d-tilt" style={{ rotateX, rotateY }} onMouseMove={onMove} onMouseLeave={onLeave}>
          <div className="l3d-frame">
            {/* soft halo behind the card */}
            <motion.div
              className="l3d-halo"
              animate={{
                boxShadow: ['0 0 10px 2px rgba(255,255,255,.03)', '0 0 18px 6px rgba(255,255,255,.06)', '0 0 10px 2px rgba(255,255,255,.03)'],
                opacity: [0.25, 0.45, 0.25],
              }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', repeatType: 'mirror' }}
            />

            {/* travelling light beams + corner sparks */}
            <div className="l3d-beams" aria-hidden="true">
              <motion.div className="l3d-beam h" style={{ top: 0, left: 0 }} {...beam('left', 0)} />
              <motion.div className="l3d-beam v" style={{ top: 0, right: 0 }} {...beam('top', 0.6)} />
              <motion.div className="l3d-beam h" style={{ bottom: 0, right: 0 }} {...beam('right', 1.2)} />
              <motion.div className="l3d-beam v" style={{ bottom: 0, left: 0 }} {...beam('bottom', 1.8)} />
              <motion.div className="l3d-dot" style={{ top: 0, left: 0 }} {...dot(2, 0)} />
              <motion.div className="l3d-dot lg" style={{ top: 0, right: 0 }} {...dot(2.4, 0.5)} />
              <motion.div className="l3d-dot lg" style={{ bottom: 0, right: 0 }} {...dot(2.2, 1)} />
              <motion.div className="l3d-dot" style={{ bottom: 0, left: 0 }} {...dot(2.3, 1.5)} />
            </div>

            <div className="l3d-border" />

            {/* the glass card */}
            <form className="l3d-card" onSubmit={submit} noValidate>
              <div className="l3d-pattern" />

              <div className="l3d-head">
                <motion.div
                  className="l3d-logo"
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', duration: 0.8 }}
                >
                  R
                  <span className="l3d-logo-sheen" />
                </motion.div>
                <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                  {mode === 'login' ? 'RvmAiTech Admin' : 'Reset password'}
                </motion.h1>
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
                  {mode === 'login' ? 'Sign in to manage the website' : 'We will email you a reset link'}
                </motion.p>
              </div>

              <AnimatePresence initial={false}>
                {(expired || sessionProblem) && mode === 'login' && !err && !msg && (
                  <motion.div key="expired" className="l3d-note warn" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                    {sessionProblem
                      ? 'Your session could not be verified — please sign in again.'
                      : 'Your session expired — please sign in again.'}
                  </motion.div>
                )}
                {err && (
                  <motion.div key="err" className="l3d-note err" role="alert" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                    {err}
                  </motion.div>
                )}
                {msg && (
                  <motion.div key="msg" className="l3d-note ok" role="status" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                    {msg}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* user id */}
              <motion.div className={`l3d-field ${focused === 'user' ? 'on' : ''}`} whileHover={{ scale: 1.01 }} transition={{ type: 'spring', stiffness: 400, damping: 25 }}>
                <label htmlFor="adm-user" className="sr-only">User ID</label>
                <User className="ico" aria-hidden="true" />
                <input
                  id="adm-user"
                  className="l3d-input"
                  type="text"
                  name="username"
                  autoComplete="username"
                  autoCapitalize="none"
                  spellCheck={false}
                  placeholder="User ID or email"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  onFocus={() => setFocused('user')}
                  onBlur={() => setFocused(null)}
                />
              </motion.div>

              {/* password (login mode only) */}
              <AnimatePresence initial={false}>
                {mode === 'login' && (
                  <motion.div
                    key="pw"
                    className={`l3d-field ${focused === 'pw' ? 'on' : ''}`}
                    initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                    animate={{ opacity: 1, height: 'auto', marginBottom: 12 }}
                    exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                    transition={{ duration: 0.25 }}
                  >
                    <label htmlFor="adm-pw" className="sr-only">Password</label>
                    <Lock className="ico" aria-hidden="true" />
                    <input
                      id="adm-pw"
                      ref={pwRef}
                      className="l3d-input"
                      type={showPw ? 'text' : 'password'}
                      name="password"
                      autoComplete="current-password"
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onFocus={() => setFocused('pw')}
                      onBlur={() => setFocused(null)}
                    />
                    <button type="button" className="l3d-eye" onClick={() => setShowPw((s) => !s)} aria-label={showPw ? 'Hide password' : 'Show password'}>
                      {showPw ? <Eye size={16} /> : <EyeOff size={16} />}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="l3d-row">
                {mode === 'login' ? (
                  <label className="l3d-check">
                    <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
                    <span>Remember my ID</span>
                  </label>
                ) : <span />}
                <button type="button" className="l3d-link" onClick={switchMode}>
                  {mode === 'login' ? 'Forgot password?' : '← Back to sign in'}
                </button>
              </div>

              <motion.button
                type="submit"
                className="l3d-btn"
                disabled={busy}
                whileHover={{ scale: busy ? 1 : 1.02 }}
                whileTap={{ scale: busy ? 1 : 0.98 }}
              >
                <motion.span
                  className="shine"
                  animate={{ x: ['-100%', '100%'] }}
                  transition={{ duration: 1.5, ease: 'easeInOut', repeat: Infinity, repeatDelay: 1 }}
                  style={{ opacity: busy ? 1 : 0 }}
                />
                <AnimatePresence mode="wait" initial={false}>
                  {busy ? (
                    <motion.span key="busy" className="l3d-btn-in" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      <span className="l3d-spin" />
                    </motion.span>
                  ) : (
                    <motion.span key="label" className="l3d-btn-in" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      {mode === 'login' ? 'Sign in' : 'Send reset link'}
                      <ArrowRight size={14} className="l3d-arrow" />
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>

              <motion.div className="l3d-foot" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
                <span className="l3d-secure"><ShieldCheck size={13} /> Admins only</span>
                <Link to="/">← Back to website</Link>
              </motion.div>
            </form>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
