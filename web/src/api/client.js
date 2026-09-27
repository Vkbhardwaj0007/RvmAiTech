import axios from 'axios';
const client = axios.create({ baseURL: (import.meta.env.VITE_API_URL || 'http://localhost:4000') + '/api' });
client.interceptors.request.use((c) => {
  const t = localStorage.getItem('rv_token');
  if (t) c.headers.Authorization = `Bearer ${t}`;
  return c;
});
// Expired / invalid admin token → drop it and send the user back to the login page
// instead of letting every save fail with an "Invalid token" alert.
client.interceptors.response.use(
  (r) => r,
  (err) => {
    const status = err?.response?.status;
    const url = err?.config?.url || '';
    const hadToken = !!err?.config?.headers?.Authorization;
    if (status === 401 && hadToken && !url.includes('/auth/login')) {
      localStorage.removeItem('rv_token');
      if (location.pathname.startsWith('/admin') && location.pathname !== '/admin/login') {
        location.href = '/admin/login?expired=1';
        return new Promise(() => {}); // page is navigating away; swallow the error
      }
    }
    return Promise.reject(err);
  }
);
export default client;
