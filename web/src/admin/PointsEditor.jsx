import { useState } from 'react';
import { ICON_SET, parsePoint, pickIcon, splitBody } from '../components/SplitSection';

/**
 * Card body editor for the admin: paragraph text + a list of icon points.
 * Everything is still saved as ONE text field (card.body), so nothing changes on the server:
 *
 *   Paragraph text…
 *
 *   - [ruler] Precision dimension measurement
 *   - [barcode] OCR, barcode & QR reading
 *   - Surface inspection            <- no tag = icon picked automatically from the words
 */

// card.body -> { text, points: [{icon, text}] }
export function bodyToParts(body = '') {
  const { paras, items } = splitBody(body);
  return { text: paras.join('\n\n'), points: items.map(parsePoint) };
}

// { text, points } -> card.body
export function partsToBody(text = '', points = []) {
  const lines = points
    .map((p) => ({ icon: p.icon, text: (p.text || '').replace(/\s*\n\s*/g, ' ').trim() }))
    .filter((p) => p.text)
    .map((p) => `- ${p.icon ? `[${p.icon}] ` : ''}${p.text}`);
  return [String(text || '').trim(), lines.join('\n')].filter(Boolean).join('\n\n');
}

function IconBtn({ icon, text, i, onPick }) {
  const [open, setOpen] = useState(false);
  const Icon = icon ? ICON_SET[icon][0] : pickIcon(text, i);
  return (
    <div className="pe-ico-wrap">
      <button type="button" className={`pe-ico${icon ? '' : ' auto'}`} title={icon ? ICON_SET[icon][1] : 'Auto (text se apne-aap)'} onClick={() => setOpen(!open)}>
        <Icon size={22} strokeWidth={1.8} />
      </button>
      {open && (
        <div className="pe-pop" onMouseLeave={() => setOpen(false)}>
          <button type="button" className={`pe-opt auto${!icon ? ' on' : ''}`} onClick={() => { onPick(''); setOpen(false); }}>Auto</button>
          {Object.entries(ICON_SET).map(([key, [Ic, label]]) => (
            <button type="button" key={key} title={label} className={`pe-opt${icon === key ? ' on' : ''}`} onClick={() => { onPick(key); setOpen(false); }}>
              <Ic size={20} strokeWidth={1.8} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function PointsEditor({ body, onChange }) {
  const { text, points } = bodyToParts(body);
  const commit = (t, p) => onChange(partsToBody(t, p));
  const setPoint = (k, patch) => commit(text, points.map((p, j) => (j === k ? { ...p, ...patch } : p)));
  const move = (k, d) => { const j = k + d; if (j < 0 || j >= points.length) return; const v = [...points]; [v[k], v[j]] = [v[j], v[k]]; commit(text, v); };

  // paragraph text is kept locally while typing, so a half-typed "- " line doesn't jump into the points list
  const [draft, setDraft] = useState(null);

  return (
    <div className="pe">
      <textarea
        rows={3}
        placeholder="Text (paragraphs)"
        value={draft ?? text}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => { if (draft !== null) { const parsed = bodyToParts(draft); commit(parsed.text, [...points, ...parsed.points]); setDraft(null); } }}
      />
      <div className="pe-head">Points (icon ke saath) — icon par click karke badlein</div>
      {points.map((p, k) => (
        <div className="pe-row" key={k}>
          <IconBtn icon={p.icon} text={p.text} i={k} onPick={(icon) => setPoint(k, { icon })} />
          <input value={p.text} placeholder="Point text, e.g. Precision dimension measurement" onChange={(e) => setPoint(k, { text: e.target.value })} />
          <button type="button" className="adm-ic" onClick={() => move(k, -1)} disabled={k === 0}>↑</button>
          <button type="button" className="adm-ic" onClick={() => move(k, 1)} disabled={k === points.length - 1}>↓</button>
          <button type="button" className="adm-ic danger" onClick={() => commit(text, points.filter((_, j) => j !== k))}>✕</button>
        </div>
      ))}
      <div className="cards-ed-actions">
        <button type="button" className="adm-ic" onClick={() => commit(text, [...points, { icon: '', text: 'New point' }])}>+ Add point</button>
      </div>
    </div>
  );
}
