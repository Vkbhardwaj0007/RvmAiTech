import { Fragment, useEffect, useState } from 'react';
import client from '../api/client';

const STATUS = ['new', 'shortlisted', 'rejected', 'hired'];
const COLOR = { new: '#1e5bbf', shortlisted: '#b45309', rejected: '#b91c1c', hired: '#15803d' };

export default function Applications() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(null);   // expanded row id
  const [filter, setFilter] = useState('all');

  async function load() {
    setLoading(true);
    try { const r = await client.get('/applications'); setItems(r.data.items || []); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  async function setStatus(a, status) {
    await client.put(`/applications/${a._id}`, { status, read: true });
    setItems((xs) => xs.map((x) => (x._id === a._id ? { ...x, status, read: true } : x)));
  }
  async function remove(a) {
    if (!confirm(`Delete application from ${a.name}?`)) return;
    await client.delete(`/applications/${a._id}`);
    setItems((xs) => xs.filter((x) => x._id !== a._id));
  }
  async function toggle(a) {
    setOpen(open === a._id ? null : a._id);
    if (!a.read) { client.put(`/applications/${a._id}`, { read: true }).catch(() => {}); setItems((xs) => xs.map((x) => (x._id === a._id ? { ...x, read: true } : x))); }
  }

  const shown = filter === 'all' ? items : items.filter((a) => a.status === filter);
  const D = ({ k, v }) => v ? <div className="app-d"><span>{k}</span>{v}</div> : null;

  return (
    <div>
      <div className="adm-head">
        <h2>Job applications <span className="muted" style={{ fontSize: 14, fontWeight: 400 }}>({items.length})</span></h2>
        <div>
          {['all', ...STATUS].map((s) => (
            <button key={s} className="adm-ic" style={filter === s ? { background: 'var(--navy)', color: '#fff', borderColor: 'var(--navy)' } : {}} onClick={() => setFilter(s)}>{s}</button>
          ))}
          <button className="adm-ic" onClick={load}>Refresh</button>
        </div>
      </div>
      {loading ? <p className="muted">Loading…</p> : shown.length === 0 ? <p className="muted">No applications yet.</p> : (
        <table className="adm-table">
          <thead><tr><th>When</th><th>Name</th><th>Position</th><th>Contact</th><th>Experience</th><th>Expected / Current</th><th>Notice</th><th>Resume</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {shown.map((a) => (
              <Fragment key={a._id}>
                <tr style={{ fontWeight: a.read ? 400 : 600, cursor: 'pointer' }} onClick={() => toggle(a)}>
                  <td>{new Date(a.createdAt).toLocaleString('en-IN')}</td>
                  <td>{a.name}<br /><span className="muted" style={{ fontSize: 12 }}>{a.qualification}</span></td>
                  <td>{a.position}</td>
                  <td>{a.email}<br />{a.phone}</td>
                  <td>{a.experienceYears ? `${a.experienceYears} yrs` : '—'}<br /><span className="muted" style={{ fontSize: 12 }}>{a.currentCompany || ''}</span></td>
                  <td>{a.expectedSalary || '—'}<br /><span className="muted" style={{ fontSize: 12 }}>{a.currentSalary || ''}</span></td>
                  <td>{a.noticePeriod || '—'}</td>
                  <td onClick={(e) => e.stopPropagation()}>{a.resumeUrl ? <a href={a.resumeUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--blue)', fontWeight: 600 }}>Open</a> : '—'}</td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <select value={a.status} onChange={(e) => setStatus(a, e.target.value)} style={{ color: COLOR[a.status], fontWeight: 600, border: '1px solid var(--line)', borderRadius: 7, padding: '4px 6px' }}>
                      {STATUS.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td onClick={(e) => e.stopPropagation()}><button className="adm-ic danger" onClick={() => remove(a)}>Delete</button></td>
                </tr>
                {open === a._id && (
                  <tr><td colSpan={10} style={{ background: '#f7f9fd' }}>
                    <div className="app-details">
                      <D k="Designation" v={a.currentDesignation} />
                      <D k="Current company" v={a.currentCompany} />
                      <D k="Location" v={a.location} />
                      <D k="LinkedIn / portfolio" v={a.linkedin && <a href={a.linkedin} target="_blank" rel="noreferrer">{a.linkedin}</a>} />
                      <D k="Resume file" v={a.resumeName} />
                      <D k="Note" v={a.coverNote} />
                    </div>
                  </td></tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
