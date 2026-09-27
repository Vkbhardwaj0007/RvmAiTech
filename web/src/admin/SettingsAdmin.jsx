import { useEffect, useState } from 'react';
import client from '../api/client';

export default function SettingsAdmin() {
  const [social, setSocial] = useState({ linkedin: '', whatsapp: '', instagram: '', facebook: '', youtube: '', twitter: '' });
  const [contact, setContact] = useState({ email: '', phone: '', address: '', tagline: '' });
  const [logo, setLogo] = useState('');
  const [hero, setHero] = useState({ image: '', video: '', videos: [] });
  const [vidBusy, setVidBusy] = useState(false);
  const [ga, setGa] = useState('');
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    client.get('/site').then((r) => {
      const c = r.data.content || {};
      if (c.social) setSocial((s) => ({ ...s, ...c.social }));
      if (c.contact) setContact((s) => ({ ...s, ...c.contact }));
      if (c.logo) setLogo(c.logo);
      if (c.hero) setHero((s) => ({ ...s, ...c.hero, videos: Array.isArray(c.hero.videos) ? c.hero.videos : [] }));
      if (c.ga) setGa(c.ga);
    }).finally(() => setLoading(false));
  }, []);

  async function uploadTo(setter, key, file) {
    if (!file) return;
    const fd = new FormData(); fd.append('file', file);
    try { const r = await client.post('/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } }); setter((s) => key ? { ...s, [key]: r.data.url } : r.data.url); }
    catch (e) { alert(e?.response?.data?.message || 'Upload failed'); }
  }
  async function uploadLogo(file) { uploadTo(setLogo, null, file); }
  async function uploadHeroVideo(file) {
    if (!file) return;
    if (!/\.(mp4|webm)$/i.test(file.name)) return alert('Sirf .mp4 ya .webm video upload karo');
    if (file.size > 60 * 1024 * 1024) return alert('Video 60 MB se chhoti honi chahiye (ideal: 2–5 MB, 848–1280px wide)');
    setVidBusy(true);
    const fd = new FormData(); fd.append('file', file);
    try {
      const r = await client.post('/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setHero((h) => ({ ...h, videos: [...(h.videos || []), r.data.url] }));
    } catch (e) { alert(e?.response?.data?.message || 'Upload failed'); }
    finally { setVidBusy(false); }
  }
  function moveVideo(i, d) {
    setHero((h) => { const v = [...h.videos]; const j = i + d; if (j < 0 || j >= v.length) return h; [v[i], v[j]] = [v[j], v[i]]; return { ...h, videos: v }; });
  }
  function removeVideo(i) { setHero((h) => ({ ...h, videos: h.videos.filter((_, k) => k !== i) })); }

  async function save() {
    setMsg('');
    try {
      await client.put('/site', { key: 'social', value: social });
      await client.put('/site', { key: 'contact', value: contact });
      await client.put('/site', { key: 'logo', value: logo });
      await client.put('/site', { key: 'hero', value: hero });
      await client.put('/site', { key: 'ga', value: ga });
      setMsg('Saved — refresh the site to see changes.');
    } catch (e) { alert(e?.response?.data?.message || 'Save failed'); }
  }

  if (loading) return <p className="muted">Loading…</p>;
  return (
    <div>
      <div className="adm-head"><h2>Settings</h2><button className="btn btn-primary" onClick={save}>Save</button></div>
      {msg && <div className="ok-banner">{msg}</div>}
      <div style={{ maxWidth: 640 }}>
        <h3 className="rep-title" style={{ color: 'var(--navy)', marginTop: 10 }}>Logo</h3>
        <div className="adm-img" style={{ marginBottom: 20 }}>
          {logo && <img src={logo} alt="" style={{ width: 120, height: 60 }} />}
          <input type="file" accept="image/*" onChange={(e) => uploadLogo(e.target.files[0])} />
          {logo && <button type="button" className="adm-ic danger" onClick={() => setLogo('')}>Remove (use default)</button>}
        </div>

        <h3 className="rep-title" style={{ color: 'var(--navy)' }}>Contact</h3>
        <label className="adm-field"><span>Email</span><input value={contact.email} onChange={(e) => setContact({ ...contact, email: e.target.value })} /></label>
        <label className="adm-field"><span>Phone</span><input value={contact.phone} onChange={(e) => setContact({ ...contact, phone: e.target.value })} /></label>
        <label className="adm-field"><span>Address</span><input value={contact.address} onChange={(e) => setContact({ ...contact, address: e.target.value })} /></label>
        <label className="adm-field"><span>Partner tagline</span><input value={contact.tagline} onChange={(e) => setContact({ ...contact, tagline: e.target.value })} placeholder="Your partner in intelligent automation" /></label>

        <h3 className="rep-title" style={{ color: 'var(--navy)', marginTop: 18 }}>Homepage hero image</h3>
        <div className="adm-img" style={{ marginBottom: 8 }}>
          {hero.image && <img src={hero.image} alt="" style={{ width: 120, height: 70 }} />}
          <input type="file" accept="image/*" onChange={(e) => uploadTo(setHero, 'image', e.target.files[0])} />
          {hero.image && <button type="button" className="adm-ic danger" onClick={() => setHero({ ...hero, image: '' })}>Remove (use graphic)</button>}
        </div>
        <p className="muted" style={{ fontSize: 12.5, marginTop: 0 }}>Agar hero image set hai toh homepage pe image dikhegi, video nahi — video ke liye image Remove karo.</p>

        <h3 className="rep-title" style={{ color: 'var(--navy)', marginTop: 18 }}>Homepage hero background videos</h3>
        <p className="muted" style={{ fontSize: 12.5, marginTop: 0 }}>Ye clips ek ke baad ek loop mein chalti hain. Koi video na ho toh built-in 3 shop-floor clips chalti hain. .mp4 / .webm, 60 MB tak (best: 2–5 MB, 848–1280px wide, bina audio).</p>
        {(hero.videos || []).length > 0 && (
          <div className="vid-list">
            {hero.videos.map((u, i) => (
              <div className="vid-row" key={u + i}>
                <video src={u} muted playsInline preload="metadata" width="160" height="90" />
                <div className="vid-meta">
                  <b>Clip {i + 1}</b>
                  <span title={u}>{decodeURIComponent(u.split('/').pop())}</span>
                </div>
                <div className="vid-actions">
                  <button type="button" className="adm-ic" onClick={() => moveVideo(i, -1)} disabled={i === 0}>↑</button>
                  <button type="button" className="adm-ic" onClick={() => moveVideo(i, 1)} disabled={i === hero.videos.length - 1}>↓</button>
                  <button type="button" className="adm-ic danger" onClick={() => removeVideo(i)}>Remove</button>
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="adm-img" style={{ marginBottom: 8 }}>
          <input type="file" accept="video/mp4,video/webm,.mp4,.webm" disabled={vidBusy} onChange={(e) => { uploadHeroVideo(e.target.files[0]); e.target.value = ''; }} />
          {vidBusy && <span className="muted">Uploading…</span>}
          {(hero.videos || []).length > 0 && <button type="button" className="adm-ic danger" onClick={() => setHero({ ...hero, videos: [] })}>Reset to built-in clips</button>}
        </div>
        <label className="adm-field"><span>Ya external video URLs (optional — direct .mp4/.webm links, comma-separated; upar upload ho toh ye ignore hota hai)</span><input value={hero.video || ''} onChange={(e) => setHero({ ...hero, video: e.target.value })} /></label>

        <h3 className="rep-title" style={{ color: 'var(--navy)', marginTop: 18 }}>Google Analytics</h3>
        <label className="adm-field"><span>Measurement ID (G-XXXXXXX)</span><input value={ga} onChange={(e) => setGa(e.target.value)} placeholder="G-XXXXXXXXXX" /></label>

        <h3 className="rep-title" style={{ color: 'var(--navy)', marginTop: 18 }}>Social links</h3>
        {['linkedin', 'whatsapp', 'instagram', 'facebook', 'youtube', 'twitter'].map((k) => (
          <label className="adm-field" key={k}><span>{k}{k === 'whatsapp' ? ' (number or wa.me link)' : ' URL'}</span>
            <input value={social[k] || ''} onChange={(e) => setSocial({ ...social, [k]: e.target.value })} /></label>
        ))}
      </div>
    </div>
  );
}
