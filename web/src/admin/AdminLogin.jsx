import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import client from '../api/client';

export function isAuthed() { return !!localStorage.getItem('rv_token'); }
export function logout() { localStorage.removeItem('rv_token'); location.href = '/admin/login'; }

export default function AdminLogin() {
  const nav = useNavigate();
  const [params] = useSearchParams();
  const expired = params.get('expired') === '1';
  const [mode, setMode] = useState('login'); // login | forgot
  const [userId, setUserId] = useState('admin');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault(); setErr(''); setMsg(''); setBusy(true);
    try {
      if (mode === 'login') {
        const r = await client.post('/auth/login', { userId: userId.trim(), password });
        localStorage.setItem('rv_token', r.data.token);
        nav('/admin');
      } else {
        const r = await client.post('/auth/forgot', { userId: userId.trim() });
        setMsg(r.data.message || 'If the account has an email, a reset link has been sent.');
      }
    } catch (ex) { setErr(ex?.response?.data?.message || 'Failed'); }
    finally { setBusy(false); }
  }

  return (
    <div className="adm-login">
      <form className="adm-login-card" onSubmit={submit}>
        <div className="adm-badge">R</div>
        <h1>RvmAiTech Admin</h1>
        <p className="muted" style={{ marginTop: 4 }}>{mode === 'login' ? 'Sign in to manage content' : 'Reset your password'}</p>
        {expired && !err && <div className="form-err" style={{ marginTop: 14 }}>Your session expired — please sign in again.</div>}
        {err && <div className="form-err" style={{ marginTop: 14 }}>{err}</div>}
        {msg && <div className="ok-banner" style={{ marginTop: 14 }}>{msg}</div>}
        <label className="adm-field"><span>User ID</span><input value={userId} onChange={(e) => setUserId(e.target.value)} placeholder="admin or vivek@rvm.com" /></label>
        {mode === 'login' && <label className="adm-field"><span>Password</span><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} /></label>}
        <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 8 }} disabled={busy}>
          {busy ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Send reset link'}
        </button>
        <button type="button" className="link-btn" onClick={() => { setMode(mode === 'login' ? 'forgot' : 'login'); setErr(''); setMsg(''); }}>
          {mode === 'login' ? 'Forgot password?' : '← Back to sign in'}
        </button>
      </form>
    </div>
  );
}
