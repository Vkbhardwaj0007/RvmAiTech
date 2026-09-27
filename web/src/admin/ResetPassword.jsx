import { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import client from '../api/client';

export default function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [done, setDone] = useState(false);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault(); setErr('');
    if (password.length < 6) { setErr('Password min 6 characters'); return; }
    if (password !== confirm) { setErr('Passwords do not match'); return; }
    setBusy(true);
    try { await client.post('/auth/reset', { token, password }); setDone(true); }
    catch (ex) { setErr(ex?.response?.data?.message || 'Reset failed'); }
    finally { setBusy(false); }
  }

  return (
    <div className="adm-login">
      <div className="adm-login-card">
        <div className="adm-badge">R</div>
        <h1>Reset password</h1>
        {!token && <div className="form-err" style={{ marginTop: 14 }}>Missing reset token. Use the link from your email.</div>}
        {done ? (
          <>
            <div className="ok-banner" style={{ marginTop: 14 }}>Password changed. You can sign in now.</div>
            <Link to="/admin/login" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 14 }}>Go to sign in</Link>
          </>
        ) : (
          <form onSubmit={submit}>
            {err && <div className="form-err" style={{ marginTop: 14 }}>{err}</div>}
            <label className="adm-field"><span>New password</span><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} /></label>
            <label className="adm-field"><span>Confirm password</span><input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} /></label>
            <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 10 }} disabled={busy || !token}>{busy ? 'Saving…' : 'Set new password'}</button>
          </form>
        )}
      </div>
    </div>
  );
}
