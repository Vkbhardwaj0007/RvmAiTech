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
            {msgs.map((m) => {
              const isAudit = (m.subject || '').includes('[COMPANY AUDIT]');
              const isDemo = (m.subject || '').includes('[DEMO REQUEST]');
              return (
                <tr key={m._id} style={{ opacity: m.read ? 0.6 : 1 }}>
                  <td style={{ whiteSpace: 'nowrap', fontSize: 13 }}>{new Date(m.createdAt).toLocaleString('en-IN')}</td>
                  <td>
                    <b>{m.name}</b>
                    {m.company && <div style={{ fontSize: 12, color: '#f47b20', fontWeight: 600 }}>{m.company}</div>}
                  </td>
                  <td style={{ fontSize: 13 }}>{m.email || '—'}<br />{m.phone || ''}</td>
                  <td>
                    {isAudit && <span style={{ display: 'inline-block', background: '#0ea5e9', color: '#fff', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 12, marginBottom: 4 }}>COMPANY AUDIT</span>}
                    {isDemo && <span style={{ display: 'inline-block', background: '#f47b20', color: '#fff', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 12, marginBottom: 4 }}>DEMO REQUEST</span>}
                    <div style={{ fontWeight: 600 }}>{(m.subject || '—').replace('[COMPANY AUDIT] ', '').replace('[DEMO REQUEST] ', '')}</div>
                  </td>
                  <td style={{ whiteSpace: 'pre-line', fontSize: 13, maxWidth: 420, lineHeight: 1.5 }}>{m.message || '—'}</td>
                  <td>{!m.read && <button className="adm-ic" onClick={() => markRead(m)}>Mark read</button>}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
