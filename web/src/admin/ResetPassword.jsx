import { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import client from '../api/client';
import { PASSWORD_MIN_LENGTH } from './AdminLogin';

export default function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [done, setDone] = useState(false);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  /**
   * Immediate feedback only. The server applies the same minimum length plus
   * a common-password denylist and a check that the password does not contain
   * the user's own id or name — so a password that passes here can still be
   * refused, and the server's message is shown when that happens.
   */
  function clientProblem() {
    if (password.length < PASSWORD_MIN_LENGTH) {
      return `Password must be at least ${PASSWORD_MIN_LENGTH} characters`;
    }
    if (password.length > 128) return 'Password must be at most 128 characters';
    if (password !== confirm) return 'Passwords do not match';
    return null;
  }

  async function submit(e) {
    e.preventDefault();
    if (busy) return; // no duplicate submissions
    setErr('');

    const problem = clientProblem();
    if (problem) { setErr(problem); return; }

    setBusy(true);
    try {
      await client.post('/auth/reset', { token, password });
      setPassword('');
      setConfirm('');
      setDone(true);
    } catch (ex) {
      const data = ex?.response?.data;
      setErr((data?.errors && Object.values(data.errors)[0]) || data?.message || 'Reset failed');
    } finally {
      setBusy(false);
    }
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
          <form onSubmit={submit} noValidate>
            {err && <div className="form-err" style={{ marginTop: 14 }}>{err}</div>}
            <label className="adm-field">
              <span>New password (min {PASSWORD_MIN_LENGTH})</span>
              <input
                type="password"
                autoComplete="new-password"
                minLength={PASSWORD_MIN_LENGTH}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>
            <label className="adm-field">
              <span>Confirm password</span>
              <input
                type="password"
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
              />
            </label>
            <p style={{ fontSize: 12, opacity: 0.7, marginTop: 8 }}>
              Use a long passphrase. Avoid common passwords and anything containing your user ID.
            </p>
            <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 10 }} disabled={busy || !token}>
              {busy ? 'Saving…' : 'Set new password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
