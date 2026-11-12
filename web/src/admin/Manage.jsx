import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import client from '../api/client';
import { COLLECTIONS } from './collections';
import { cardsFromGroups } from '../components/serviceCards';
import PointsEditor from './PointsEditor';

export default function Manage() {
  const { type } = useParams();
  const cfg = COLLECTIONS[type];
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // {mode, id, form}
  const [err, setErr] = useState('');

  async function load() {
    setLoading(true);
    try { const r = await client.get(cfg.endpoint, { params: { all: 1 } }); setItems(r.data.items || []); }
    catch (e) { setErr(e?.response?.data?.message || 'Load failed'); }
    finally { setLoading(false); }
  }
  useEffect(() => { setErr(''); load(); /* eslint-disable-next-line */ }, [type]);

  function blank() {
    const f = {};
    cfg.fields.forEach((fl) => { f[fl.key] = fl.default !== undefined ? fl.default : fl.type === 'checkbox' ? true : fl.type === 'json' || fl.type === 'lines' || fl.type === 'cards' ? [] : fl.type === 'number' ? 0 : ''; });
    return f;
  }
  function openCreate() { setModal({ mode: 'create', form: blank() }); }
  function openEdit(it) {
    const f = {};
    cfg.fields.forEach((fl) => { f[fl.key] = it[fl.key] ?? (fl.default !== undefined ? fl.default : fl.type === 'json' || fl.type === 'lines' || fl.type === 'cards' ? [] : fl.type === 'checkbox' ? true : fl.type === 'number' ? 0 : ''); });
    // no cards saved yet -> start from the old groups so nothing has to be retyped
    cfg.fields.forEach((fl) => { if (fl.type === 'cards' && !(Array.isArray(f[fl.key]) && f[fl.key].length)) f[fl.key] = cardsFromGroups(it.groups); });
    setModal({ mode: 'edit', id: it._id, form: f });
  }
  function setF(k, v) { setModal((m) => ({ ...m, form: { ...m.form, [k]: v } })); }

  async function uploadAny(file) {
    const fd = new FormData();
    fd.append('file', file);
    const r = await client.post('/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
    return r.data.url;
  }
  async function uploadFile(key, file) {
    if (!file) return;
    try { setF(key, await uploadAny(file)); }
    catch (e) { alert(e?.response?.data?.message || 'Upload failed'); }
  }

  async function save() {
    const body = { ...modal.form };
    // parse json fields
    for (const fl of cfg.fields) {
      if (fl.type === 'json' && typeof body[fl.key] === 'string') {
        try { body[fl.key] = JSON.parse(body[fl.key] || '[]'); }
        catch { alert(`${fl.label}: invalid JSON`); return; }
      }
      if (fl.type === 'number') body[fl.key] = Number(body[fl.key]) || 0;
      if (fl.type === 'lines' && typeof body[fl.key] === 'string') body[fl.key] = body[fl.key].split('\n').map((x) => x.trim()).filter(Boolean);
      if (fl.type === 'cards') body[fl.key] = (Array.isArray(body[fl.key]) ? body[fl.key] : []).map((c) => ({ image: c.image || '', heading: (c.heading || '').trim(), body: (c.body || '').trim() })).filter((c) => c.heading || c.body || c.image);
    }
    try {
      if (modal.mode === 'create') await client.post(cfg.endpoint, body);
      else await client.put(`${cfg.endpoint}/${modal.id}`, body);
      setModal(null); load();
    } catch (e) { alert(e?.response?.data?.message || 'Save failed'); }
  }
  async function remove(it) {
    if (!confirm(`Delete "${it[cfg.titleField]}"?`)) return;
    try { await client.delete(`${cfg.endpoint}/${it._id}`); load(); }
    catch (e) { alert(e?.response?.data?.message || 'Delete failed'); }
  }

  if (!cfg) return <div>Unknown type</div>;

  return (
    <div>
      <div className="adm-head">
        <h2>{cfg.label}</h2>
        <button className="btn btn-primary" onClick={openCreate}>+ Add {cfg.label.replace(/s$/, '')}</button>
      </div>
      {err && <div className="form-err">{err}</div>}
      {loading ? <p className="muted">Loading…</p> : (
        <table className="adm-table">
          <thead><tr>{cfg.columns.map((c) => <th key={c}>{c}</th>)}<th style={{ textAlign: 'right' }}>Actions</th></tr></thead>
          <tbody>
            {items.map((it) => (
              <tr key={it._id}>
                {cfg.columns.map((c) => <td key={c}>{String(it[c] ?? '—').slice(0, 60)}</td>)}
                <td style={{ textAlign: 'right' }}>
                  <button className="adm-ic" onClick={() => openEdit(it)}>Edit</button>
                  <button className="adm-ic danger" onClick={() => remove(it)}>Delete</button>
                </td>
              </tr>
            ))}
            {items.length === 0 && <tr><td colSpan={cfg.columns.length + 1} className="muted">Nothing yet.</td></tr>}
          </tbody>
        </table>
      )}

      {modal && (
        <div className="adm-modal-bg" onClick={(e) => e.target === e.currentTarget && setModal(null)}>
          <div className="adm-modal">
            <div className="adm-modal-head"><h3>{modal.mode === 'create' ? 'Add' : 'Edit'} {cfg.label.replace(/s$/, '')}</h3><button onClick={() => setModal(null)}>✕</button></div>
            <div className="adm-modal-body">
              {cfg.fields.map((fl) => fl.type === 'cards' ? (
                <div className="adm-field" key={fl.key}>
                  <span>{fl.label}</span>
                  <CardsEditor value={Array.isArray(modal.form[fl.key]) ? modal.form[fl.key] : []} onChange={(v) => setF(fl.key, v)} upload={uploadAny} groups={modal.form.groups} />
                </div>
              ) : (
                <label className="adm-field" key={fl.key}>
                  <span>{fl.label}</span>
                  {fl.type === 'textarea' && <textarea rows="3" value={modal.form[fl.key]} onChange={(e) => setF(fl.key, e.target.value)} />}
                  {fl.type === 'lines' && <textarea rows="5" value={Array.isArray(modal.form[fl.key]) ? modal.form[fl.key].join('\n') : modal.form[fl.key]} onChange={(e) => setF(fl.key, e.target.value)} placeholder="One item per line" />}
                  {fl.type === 'json' && <textarea rows="5" className="mono" value={typeof modal.form[fl.key] === 'string' ? modal.form[fl.key] : JSON.stringify(modal.form[fl.key], null, 2)} onChange={(e) => setF(fl.key, e.target.value)} />}
                  {fl.type === 'number' && <input type="number" value={modal.form[fl.key]} onChange={(e) => setF(fl.key, e.target.value)} />}
                  {fl.type === 'checkbox' && <input type="checkbox" checked={!!modal.form[fl.key]} onChange={(e) => setF(fl.key, e.target.checked)} style={{ width: 'auto' }} />}
                  {fl.type === 'image' && (
                    <div className="adm-img">
                      {modal.form[fl.key] && <img src={modal.form[fl.key]} alt="" />}
                      <input type="file" accept="image/*" onChange={(e) => uploadFile(fl.key, e.target.files[0])} />
                      {modal.form[fl.key] && <button type="button" className="adm-ic danger" onClick={() => setF(fl.key, '')}>Remove</button>}
                    </div>
                  )}
                  {fl.type === 'video' && (
                    <div className="adm-img">
                      {modal.form[fl.key] && <video src={modal.form[fl.key]} style={{width:120,height:70,borderRadius:8}} muted />}
                      <input type="file" accept="video/*" onChange={(e) => uploadFile(fl.key, e.target.files[0])} />
                      {modal.form[fl.key] && <button type="button" className="adm-ic danger" onClick={() => setF(fl.key, '')}>Remove</button>}
                    </div>
                  )}
                  {(!fl.type || fl.type === 'text') && <input value={modal.form[fl.key]} onChange={(e) => setF(fl.key, e.target.value)} />}
                </label>
              ))}
            </div>
            <div className="adm-modal-foot">
              <button className="btn" style={{ border: '1px solid var(--line)' }} onClick={() => setModal(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={save}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


/* Repeater for [{image, heading, body}] cards (service detail pages). */
function CardsEditor({ value, onChange, upload, groups }) {
  const [busy, setBusy] = useState(-1);
  const set = (i, patch) => onChange(value.map((c, k) => (k === i ? { ...c, ...patch } : c)));
  const move = (i, d) => { const j = i + d; if (j < 0 || j >= value.length) return; const v = [...value]; [v[i], v[j]] = [v[j], v[i]]; onChange(v); };
  const remove = (i) => onChange(value.filter((_, k) => k !== i));
  const add = () => onChange([...value, { image: '', heading: '', body: '' }]);
  async function pick(i, file) {
    if (!file) return;
    setBusy(i);
    try { set(i, { image: await upload(file) }); }
    catch (e) { alert(e?.response?.data?.message || 'Upload failed'); }
    finally { setBusy(-1); }
  }
  const parsedGroups = typeof groups === 'string' ? (() => { try { return JSON.parse(groups); } catch { return []; } })() : groups;
  return (
    <div className="cards-ed">
      {value.map((c, i) => (
        <div className="cards-ed-row" key={i}>
          <div className="cards-ed-img">
            {c.image ? <img src={c.image} alt="" /> : <div className="cards-ed-ph">No image</div>}
            <input type="file" accept="image/*" disabled={busy === i} onChange={(e) => { pick(i, e.target.files[0]); e.target.value = ''; }} />
            {busy === i && <span className="muted" style={{ fontSize: 12 }}>Uploading…</span>}
            {c.image && <button type="button" className="adm-ic danger" onClick={() => set(i, { image: '' })}>Remove image</button>}
          </div>
          <div className="cards-ed-fields">
            <input placeholder="Heading" value={c.heading || ''} onChange={(e) => set(i, { heading: e.target.value })} />
            <PointsEditor body={c.body || ''} onChange={(body) => set(i, { body })} />
            <div className="cards-ed-actions">
              <button type="button" className="adm-ic" onClick={() => move(i, -1)} disabled={i === 0}>↑</button>
              <button type="button" className="adm-ic" onClick={() => move(i, 1)} disabled={i === value.length - 1}>↓</button>
              <button type="button" className="adm-ic danger" onClick={() => remove(i)}>Remove card</button>
            </div>
          </div>
        </div>
      ))}
      <div className="cards-ed-actions">
        <button type="button" className="adm-ic" onClick={add}>+ Add card</button>
        {value.length === 0 && Array.isArray(parsedGroups) && parsedGroups.length > 0 && (
          <button type="button" className="adm-ic" onClick={() => onChange(cardsFromGroups(parsedGroups))}>Create cards from the old groups</button>
        )}
      </div>
      <p className="muted" style={{ fontSize: 12, margin: '6px 0 0' }}>Har card = service page par ek full-width section: ek taraf badi image (baari-baari left/right), doosri taraf heading (aakhri word orange) + text; neeche "Points" mein har point ka text likhein aur icon button se icon chunein ("Auto" = text dekh kar apne-aap). Koi card na ho to purane groups se apne-aap ban jaate hain.</p>
    </div>
  );
}
