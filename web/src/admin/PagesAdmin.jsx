import { useEffect, useState } from 'react';
import client from '../api/client';
import { HERO_MODES, resolveHeroMedia, firstSrc } from '../components/heroMedia';
import { INTRO_PAGES, PAGE_INTRO_DEFAULTS, EMPTY_INTRO, resolvePageIntro, renderBody, SplitTitle } from '../components/PageIntro';

/**
 * Admin → Pages. For every page of the site:
 *   - Hero background  (built-in video / image, or an upload)   -> site key `pageHero`
 *   - Intro block      (heading, text, image, image side)       -> site key `pageIntro`
 * The homepage hero itself is still managed in Settings.
 */
export default function PagesAdmin() {
  const [page, setPage] = useState('home');
  const [hero, setHero] = useState({});          // homepage hero, only used for the "same as homepage" preview
  const [pageHero, setPageHero] = useState({});
  const [pageIntro, setPageIntro] = useState({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    client.get('/site').then((r) => {
      const c = r.data.content || {};
      if (c.hero) setHero(c.hero);
      if (c.pageHero && typeof c.pageHero === 'object') setPageHero(c.pageHero);
      if (c.pageIntro && typeof c.pageIntro === 'object') setPageIntro(c.pageIntro);
    }).finally(() => setLoading(false));
  }, []);

  const label = (INTRO_PAGES.find(([k]) => k === page) || [])[1] || page;
  const heroCfg = pageHero[page] || {};
  const heroMode = heroCfg.mode || 'default';
  const heroPrev = resolveHeroMedia(page, { hero, pageHero: { [page]: heroCfg } });
  // form shows the saved intro, else the default text for that page
  const intro = resolvePageIntro(page, { pageIntro }) && pageIntro[page] ? { ...pageIntro[page], body: resolvePageIntro(page, { pageIntro }).body } : (pageIntro[page] || PAGE_INTRO_DEFAULTS[page] || EMPTY_INTRO);
  const isDefault = !pageIntro[page];

  function setPH(patch) { setPageHero((p) => ({ ...p, [page]: { ...(p[page] || {}), ...patch } })); }
  function setPI(patch) { setPageIntro((p) => ({ ...p, [page]: { ...intro, ...patch } })); }

  async function upload(file, onDone, video) {
    if (!file) return;
    if (video) {
      if (!/\.(mp4|webm)$/i.test(file.name)) return alert('Sirf .mp4 ya .webm video upload karo');
      if (file.size > 60 * 1024 * 1024) return alert('Video 60 MB se chhoti honi chahiye (ideal: 2–5 MB)');
    }
    setBusy(true);
    const fd = new FormData(); fd.append('file', file);
    try {
      const r = await client.post('/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      onDone(r.data.url);
    } catch (e) { alert(e?.response?.data?.message || 'Upload failed'); }
    finally { setBusy(false); }
  }

  async function save() {
    setMsg('');
    try {
      await client.put('/site', { key: 'pageHero', value: pageHero });
      await client.put('/site', { key: 'pageIntro', value: pageIntro });
      setMsg('Saved — refresh the site to see changes.');
    } catch (e) {
      alert((e?.response?.data?.message || 'Save failed') + '\n\nAgar server keys whitelist karta hai to server/src/routes/siteRoutes.js mein "pageHero" aur "pageIntro" add karo.');
    }
  }

  if (loading) return <p className="muted">Loading…</p>;

  const preview = resolvePageIntro(page, { pageIntro: { [page]: intro } });

  return (
    <div>
      <div className="adm-head">
        <h2>Pages</h2>
        <button className="btn btn-primary" onClick={save} disabled={busy}>Save</button>
      </div>
      {msg && <div className="ok-banner">{msg}</div>}
      <p className="muted" style={{ fontSize: 13, marginTop: 0 }}>Har page ka hero background aur uske neeche ka intro (heading, text, image) yahan se set hota hai. Page chuno:</p>

      <div className="chips" style={{ marginBottom: 22 }}>
        {INTRO_PAGES.map(([k, l]) => (
          <button key={k} type="button" className={`chip ${page === k ? 'on' : ''}`} onClick={() => setPage(k)}>
            {l}{pageIntro[k] || pageHero[k] ? ' •' : ''}
          </button>
        ))}
      </div>

      <div className="pg-grid">
        {/* ---------- hero background ---------- */}
        <div className="pg-card">
          <h3>Hero background — {label}</h3>
          {page === 'home' ? (
            <p className="muted" style={{ fontSize: 13 }}>Homepage ka hero (video playlist / image) <b>Settings</b> page se set hota hai.</p>
          ) : (
            <>
              <div className="ph-row" style={{ padding: 0, border: 0, background: 'none' }}>
                {heroPrev.image
                  ? <img src={heroPrev.image} alt="" />
                  : <video key={firstSrc(heroPrev.videos[0])} src={firstSrc(heroPrev.videos[0])} poster={heroPrev.poster} muted playsInline preload="metadata" />}
                <div className="ph-meta">
                  <select value={heroMode} onChange={(e) => setPH({ mode: e.target.value })}>
                    {HERO_MODES.map(([v, l]) => <option value={v} key={v}>{l}</option>)}
                  </select>
                  {heroMode === 'video' && (
                    <div className="ph-up">
                      <input type="file" accept="video/mp4,video/webm,.mp4,.webm" disabled={busy} onChange={(e) => { upload(e.target.files[0], (url) => setPH({ video: url, mode: 'video' }), true); e.target.value = ''; }} />
                      <input type="text" placeholder="ya direct .mp4 / .webm URL" value={heroCfg.video || ''} onChange={(e) => setPH({ video: e.target.value })} />
                    </div>
                  )}
                  {heroMode === 'image' && (
                    <div className="ph-up">
                      <input type="file" accept="image/*" disabled={busy} onChange={(e) => { upload(e.target.files[0], (url) => setPH({ image: url, mode: 'image' })); e.target.value = ''; }} />
                      {heroCfg.image && <button type="button" className="adm-ic danger" onClick={() => setPH({ image: '' })}>Remove</button>}
                    </div>
                  )}
                </div>
              </div>
              <p className="muted" style={{ fontSize: 12.5, marginBottom: 0 }}>"Default" = built-in clip/image jo har page ke liye alag hai. Video ke liye .mp4/.webm, 60 MB tak.</p>
            </>
          )}
        </div>

        {/* ---------- intro block ---------- */}
        <div className="pg-card">
          <h3>Intro block — {label} {isDefault && <span className="pg-tag">default text</span>}</h3>
          <label className="adm-field"><span>Heading &nbsp;<small className="muted">("|" se do line: pehla hissa light, doosra bold — e.g. The People | Behind Our Success)</small></span>
            <input value={intro.heading || ''} onChange={(e) => setPI({ heading: e.target.value })} placeholder="e.g. Who we are" /></label>
          <label className="adm-field"><span>Text (blank line = new paragraph; lines starting with "- " become bullets)</span>
            <textarea rows={9} value={intro.body || ''} onChange={(e) => setPI({ body: e.target.value })} /></label>
          <div className="adm-field"><span>Image</span>
            <div className="adm-img">
              {intro.image && <img src={intro.image} alt="" style={{ width: 120, height: 80 }} />}
              <input type="file" accept="image/*" disabled={busy} onChange={(e) => { upload(e.target.files[0], (url) => setPI({ image: url })); e.target.value = ''; }} />
              {intro.image && <button type="button" className="adm-ic danger" onClick={() => setPI({ image: '' })}>Remove image</button>}
            </div>
          </div>
          <label className="adm-field"><span>Image side</span>
            <select value={intro.side === 'left' ? 'left' : 'right'} onChange={(e) => setPI({ side: e.target.value })}>
              <option value="right">Right of the text</option>
              <option value="left">Left of the text</option>
            </select></label>
          <label className="adm-field"><span>Position on the page</span>
            <select value={intro.position === 'bottom' ? 'bottom' : 'top'} onChange={(e) => setPI({ position: e.target.value })}>
              <option value="top">Right below the hero</option>
              <option value="bottom">At the bottom of the page</option>
            </select></label>
          <div className="pg-actions">
            {!isDefault && <button type="button" className="adm-ic" onClick={() => setPageIntro((p) => { const n = { ...p }; delete n[page]; return n; })}>Reset to default text</button>}
            <button type="button" className="adm-ic danger" onClick={() => setPI({ ...EMPTY_INTRO })}>Hide this block on the site</button>
          </div>
          {busy && <span className="muted">Uploading…</span>}
        </div>
      </div>

      {/* ---------- live preview ---------- */}
      <h3 className="pg-prev-title">Preview</h3>
      {preview ? (
        <div className="pg-preview">
          <div className={`intro-grid${preview.image ? '' : ' no-media'}${preview.side === 'left' ? ' media-left' : ''}`}>
            <div className="intro-text">
              {preview.heading && <h2><SplitTitle text={preview.heading} /></h2>}
              {preview.body && renderBody(preview.body)}
            </div>
            {preview.image && <div className="intro-media"><img src={preview.image} alt="" /></div>}
          </div>
        </div>
      ) : <p className="muted">Is page par intro block chhupa rahega (sab khali hai).</p>}
    </div>
  );
}
