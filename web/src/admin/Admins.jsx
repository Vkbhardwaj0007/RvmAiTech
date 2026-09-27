import { useEffect, useState } from 'react';
import client from '../api/client';

export default function Admins() {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ name: '', userId: '', password: '', email: '' });
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  async function load() { const r = await client.get('/users'); setUsers(r.data.users || []); }
  useEffect(() => { load(); }, []);

  async function add(e) {
    e.preventDefault(); setErr(''); setMsg('');
    try {
      await client.post('/users', form);
      setMsg(`Admin "${form.userId}" added`); setForm({ name: '', userId: '', password: '', email: '' }); load();
    } catch (ex) { setErr(ex?.response?.data?.message || 'Failed'); }
  }
  async function changePw(u) {
    const pw = prompt(`New password for ${u.userId} (min 6 chars):`);
    if (!pw) return;
    try { await client.put(`/users/${u._id}/password`, { password: pw }); setMsg(`Password changed for ${u.userId}`); }
    catch (ex) { alert(ex?.response?.data?.message || 'Failed'); }
  }
  async function setEmail(u) {
    const em = prompt(`Recovery email for ${u.userId}:`, u.email || '');
    if (em === null) return;
    try { await client.put(`/users/${u._id}/email`, { email: em }); setMsg(`Email set for ${u.userId}`); load(); }
    catch (ex) { alert(ex?.response?.data?.message || 'Failed'); }
  }
  async function del(u) {
    if (!confirm(`Delete admin "${u.userId}"?`)) return;
    try { await client.delete(`/users/${u._id}`); load(); }
    catch (ex) { alert(ex?.response?.data?.message || 'Failed'); }
  }

  return (
    <div>
      <div className="adm-head"><h2>Admins</h2></div>
      {msg && <div className="ok-banner">{msg}</div>}

      <table className="adm-table" style={{ marginBottom: 24 }}>
        <thead><tr><th>User ID</th><th>Name</th><th>Email</th><th style={{ textAlign: 'right' }}>Actions</th></tr></thead>
        <tbody>
          {users.map((u) => (
            <tr key={u._id}>
              <td><b>{u.userId}</b></td><td>{u.name}</td><td>{u.email || <span style={{color:'var(--muted)'}}>—</span>}</td>
              <td style={{ textAlign: 'right' }}>
                <button className="adm-ic" onClick={() => setEmail(u)}>Set email</button>
                <button className="adm-ic" onClick={() => changePw(u)}>Change password</button>
                <button className="adm-ic danger" onClick={() => del(u)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="content-box" style={{ maxWidth: 460 }}>
        <h3 style={{ color: 'var(--navy)', marginBottom: 12 }}>Add new admin</h3>
        {err && <div className="form-err">{err}</div>}
        <form onSubmit={add}>
          <label className="adm-field"><span>Name</span><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Vivek" /></label>
          <label className="adm-field"><span>User ID (email or username)</span><input value={form.userId} onChange={(e) => setForm({ ...form, userId: e.target.value })} placeholder="vivek@rvm.com" /></label>
          <label className="adm-field"><span>Recovery email (for password reset)</span><input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="vivek@rvm.com" /></label>
          <label className="adm-field"><span>Password (min 6)</span><input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></label>
          <button className="btn btn-primary" style={{ marginTop: 10 }}>Add admin</button>
        </form>
      </div>
    </div>
  );
}
