import axios from 'axios';

// Where is the API?
//  1. VITE_API_URL (web/.env)            -> always wins, e.g. https://api.rvmaitech.com
//  2. local dev (vite on :5173 / :3000)  -> http://localhost:4000
//  3. production build served by the API itself (SERVE_CLIENT=true) -> same origin ("/api")
function apiBase() {
  const env = import.meta.env.VITE_API_URL;
  if (typeof env === 'string' && env.trim()) return env.trim().replace(/\/+$/, '');
  const { hostname, port } = window.location;
  const isLocalDev = ['localhost', '127.0.0.1', '0.0.0.0'].includes(hostname) && port !== '4000';
  return isLocalDev ? 'http://localhost:4000' : '';
}

export const API_BASE = apiBase();

export const TOKEN_KEY = 'rv_token';

/**
 * Access tokens now last 15 minutes instead of 12 hours, and the long-lived
 * credential is an HttpOnly cookie the browser holds and JavaScript cannot
 * read. That cookie is exchanged for a new access token by POST /auth/refresh.
 *
 * `withCredentials` is required for the cookie to be sent at all on a
 * cross-origin deployment (api.rvmaitech.com + rvmaitech.com).
 */
const client = axios.create({
  baseURL: API_BASE + '/api',
  withCredentials: true,
}); // no timeout: hero videos up to 60 MB go through /upload

/* --------------------------------------------------------------- CSRF token */

/**
 * The refresh and logout endpoints authenticate by cookie, so they are the
 * only ones that need a CSRF token. The server sets it in a readable cookie
 * at sign-in; we echo it back in a header, which a cross-origin page cannot
 * do because it cannot read the cookie.
 */
function readCookie(name) {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function csrfHeader() {
  const token = readCookie('rv_csrf');
  return token ? { 'X-CSRF-Token': token } : {};
}

/* ------------------------------------------------------------ request stage */

client.interceptors.request.use((cfg) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

/* ----------------------------------------------------------- silent refresh */

/**
 * One shared refresh attempt.
 *
 * Without this, a dashboard that fires six requests at once would send six
 * refresh calls — and because refresh tokens rotate and a reused one is
 * treated as theft, five of those would look like an attack and revoke the
 * whole session. Every caller waits on the same promise instead.
 */
let refreshInFlight = null;

function refreshAccessToken() {
  if (!refreshInFlight) {
    refreshInFlight = axios
      .post(`${API_BASE}/api/auth/refresh`, null, {
        withCredentials: true,
        headers: csrfHeader(),
      })
      .then((res) => {
        const token = res.data?.token;
        if (!token) throw new Error('no token in refresh response');
        localStorage.setItem(TOKEN_KEY, token);
        return token;
      })
      .finally(() => {
        refreshInFlight = null;
      });
  }
  return refreshInFlight;
}

function toLogin(reason) {
  localStorage.removeItem(TOKEN_KEY);
  if (location.pathname.startsWith('/admin') && location.pathname !== '/admin/login') {
    location.href = `/admin/login?${reason}=1`;
    return new Promise(() => {}); // the page is navigating away; swallow the error
  }
  return null;
}

client.interceptors.response.use(
  (r) => r,
  async (err) => {
    const status = err?.response?.status;
    const original = err?.config || {};
    const url = original.url || '';

    const isAuthEndpoint = /\/auth\/(login|forgot|reset|refresh)/.test(url);

    /**
     * A 401 on an ordinary request usually just means the 15-minute access
     * token has expired. Try the refresh cookie once, then replay the original
     * request; only give up and go to the login page if that fails too.
     */
    if (status === 401 && !isAuthEndpoint && !original._retried) {
      original._retried = true;
      try {
        const token = await refreshAccessToken();
        // Set the property rather than spreading: original.headers is an
        // AxiosHeaders instance, and spreading it into a plain object drops
        // its prototype along with the normalisation axios relies on.
        if (original.headers && typeof original.headers.set === 'function') {
          original.headers.set('Authorization', `Bearer ${token}`);
        } else {
          original.headers = { ...(original.headers || {}), Authorization: `Bearer ${token}` };
        }
        return client.request(original);
      } catch {
        const redirect = toLogin('expired');
        if (redirect) return redirect;
        return Promise.reject(err);
      }
    }

    // The refresh itself failed: the session is genuinely over.
    if (status === 401 && /\/auth\/refresh/.test(url)) {
      const redirect = toLogin('expired');
      if (redirect) return redirect;
    }

    // A CSRF rejection means the cookie and the page have drifted apart
    // (usually a stale tab). A reload re-reads the cookie.
    if (status === 403 && /\/auth\/(refresh|logout)/.test(url)) {
      const redirect = toLogin('session');
      if (redirect) return redirect;
    }

    return Promise.reject(err);
  }
);

/** Ends the session server-side as well as locally. */
export async function signOut() {
  try {
    await client.post('/auth/logout', null, { headers: csrfHeader() });
  } catch {
    /* sign out locally regardless */
  }
  localStorage.removeItem(TOKEN_KEY);
}

export { csrfHeader, refreshAccessToken };
export default client;
