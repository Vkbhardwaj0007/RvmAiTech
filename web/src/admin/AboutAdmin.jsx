import { useEffect, useState } from 'react';
import client from '../api/client';

export default function AboutAdmin() {
  const [a, setA] = useState({ heading: '', body: '', mission: '', vision: '' });
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    client.get('/site/about').then((r) => { if (r.data.value) setA({ heading: '', body: '', mission: '', vision: '', ...r.data.value }); })
      .finally(() => setLoading(false));
  }, []);

  function setF(k, v) { setA((x) => ({ ...x, [k]: v })); }

  async function save() {
    setMsg('');
    try { await client.put('/site', { key: 'about', value: a }); setMsg('Saved — About page updated.'); }
    catch (e) { alert(e?.response?.data?.message || 'Save failed'); }
  }

  if (loading) return <p className="muted">Loading…</p>;
  return (
    <div>
      <div className="adm-head"><h2>About page</h2><button className="btn btn-primary" onClick={save}>Save</button></div>
      {msg && <div className="ok-banner">{msg}</div>}
      <div style={{ maxWidth: 640 }}>
        <label className="adm-field"><span>Heading</span><input value={a.heading} onChange={(e) => setF('heading', e.target.value)} /></label>
        <label className="adm-field"><span>Body (paragraphs, blank line between)</span><textarea rows="6" value={a.body} onChange={(e) => setF('body', e.target.value)} /></label>
        <label className="adm-field"><span>Mission</span><textarea rows="2" value={a.mission} onChange={(e) => setF('mission', e.target.value)} /></label>
        <label className="adm-field"><span>Vision</span><textarea rows="2" value={a.vision} onChange={(e) => setF('vision', e.target.value)} /></label>
      </div>
    </div>
  );
}
