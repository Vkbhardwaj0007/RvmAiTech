import { useEffect, useState } from 'react';
import client from '../api/client';

export function AdminHome() {
  return (
    <div>
      <div className="adm-head"><h2>Dashboard</h2></div>
      <p className="muted">Left menu se content manage karo — Services, Products (MDMS), Projects, Technologies, Workflow, Stats, Industries, Testimonials. Contact form ke messages "Messages" me.</p>
    </div>
  );
}

export function Messages() {
  const [msgs, setMsgs] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try { const r = await client.get('/contact'); setMsgs(r.data.messages || []); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  async function markRead(m) { await client.put(`/contact/${m._id}/read`); load(); }

  return (
    <div>
      <div className="adm-head"><h2>Messages</h2></div>
      {loading ? <p className="muted">Loading…</p> : msgs.length === 0 ? <p className="muted">No messages yet.</p> : (
        <table className="adm-table">
          <thead><tr><th>When</th><th>Name</th><th>Email/Phone</th><th>Subject</th><th>Message</th><th></th></tr></thead>
          <tbody>
            {msgs.map((m) => (
              <tr key={m._id} style={{ opacity: m.read ? 0.55 : 1 }}>
                <td>{new Date(m.createdAt).toLocaleString('en-IN')}</td>
                <td>{m.name}</td>
                <td>{m.email || '—'}<br />{m.phone || ''}</td>
                <td>{m.subject || '—'}</td>
                <td>{(m.message || '').slice(0, 80)}</td>
                <td>{!m.read && <button className="adm-ic" onClick={() => markRead(m)}>Mark read</button>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
