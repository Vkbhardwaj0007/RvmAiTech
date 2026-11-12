import {
  Gauge, Activity, Cpu, ShieldCheck, BarChart3, Layers, Zap, Eye, Wrench, Timer, Database, Bell,
  ScanSearch, Ruler, Search, Puzzle, ScanBarcode, Target, CircleCheck, History, Settings, Lightbulb,
  Monitor, Camera, Thermometer, Wifi, Smartphone, Lock, CalendarClock, Factory, Truck, Package, Usb,
  BrainCircuit, FileText, Bot,
} from 'lucide-react';

/**
 * Full-width section: image on one side, heading (last word in orange) + text +
 * "- " lines as icon points on the other. Used by the service pages and the company pages
 * (styles: .svc-split / .split-*).
 *
 *   <SplitSection image="…" heading="Vision inspection line" paras={[…]} items={[…]} flip tone />
 */
export const POINT_ICONS = [Gauge, Activity, Cpu, ShieldCheck, BarChart3, Layers, Zap, Eye, Wrench, Timer, Database, Bell];

// Icons the admin can choose for a point (Admin → card → Points → icon button).
// In the saved text a chosen icon is written as a tag:  "- [ruler] Precision dimension measurement"
export const ICON_SET = {
  'scan-search': [ScanSearch, 'Defect / scan'], ruler: [Ruler, 'Measurement'], search: [Search, 'Inspection'],
  puzzle: [Puzzle, 'Component'], barcode: [ScanBarcode, 'Barcode / OCR'], target: [Target, 'Target / identify'],
  check: [CircleCheck, 'OK / check'], chart: [BarChart3, 'Dashboard / chart'], history: [History, 'History'],
  settings: [Settings, 'Settings'], bulb: [Lightbulb, 'Lighting'], monitor: [Monitor, 'Screen / PC'],
  camera: [Camera, 'Camera'], brain: [BrainCircuit, 'AI'], bot: [Bot, 'Robot'], gauge: [Gauge, 'Gauge / speed'],
  activity: [Activity, 'Activity / signal'], cpu: [Cpu, 'Chip / controller'], shield: [ShieldCheck, 'Security'],
  layers: [Layers, 'Layers'], zap: [Zap, 'Energy'], eye: [Eye, 'Vision'], wrench: [Wrench, 'Maintenance'],
  timer: [Timer, 'Timer'], database: [Database, 'Data'], bell: [Bell, 'Alerts'], thermometer: [Thermometer, 'Temperature'],
  wifi: [Wifi, 'Wireless / IoT'], phone: [Smartphone, 'Mobile app'], lock: [Lock, 'Access / lock'],
  calendar: [CalendarClock, 'Scheduling'], factory: [Factory, 'Factory'], truck: [Truck, 'Logistics'],
  package: [Package, 'Product / package'], usb: [Usb, 'USB / I/O'], file: [FileText, 'Document'],
};

// "[ruler] Precision dimension" -> { icon: 'ruler', text: 'Precision dimension' }
export function parsePoint(raw = '') {
  const m = String(raw).match(/^\s*\[([a-z0-9-]+)\]\s*/i);
  if (m && ICON_SET[m[1].toLowerCase()]) return { icon: m[1].toLowerCase(), text: String(raw).slice(m[0].length).trim() };
  return { icon: '', text: String(raw).trim() };
}

// a point can be a string ("[ruler] Text") or an object ({ title, description, icon })
//   -> { icon, text, desc }
export function toPoint(item) {
  if (item && typeof item === 'object') {
    const p = parsePoint(item.title || item.heading || item.name || item.label || item.text || '');
    const ic = String(item.icon || '').toLowerCase();
    return { icon: ICON_SET[ic] ? ic : p.icon, text: p.text, desc: String(item.description || item.desc || item.body || '').trim() };
  }
  return { ...parsePoint(item == null ? '' : String(item)), desc: '' };
}

// keyword -> icon. First match wins, so the more specific words come first.
const ICON_RULES = [
  [/defect|anomal/i, ScanSearch],
  [/dimension|measure|length|width|gaug/i, Ruler],
  [/\bocr\b|barcode|\bqr\b|scann?/i, ScanBarcode],
  [/component|presence|absence|missing|assembl/i, Puzzle],
  [/identif|classif|sorting/i, Target],
  [/\bok\s*\/\s*ng\b|pass\s*\/\s*fail|reject|decision/i, CircleCheck],
  [/dashboard|report|analytic|chart/i, BarChart3],
  [/history|traceab|\blogs?\b|logging|record/i, History],
  [/setting|config|recipe|calibrat/i, Settings],
  [/lighting|\blights?\b|lamp|\bled\b|illumin/i, Lightbulb],
  [/standalone|\bpc\b|screen|display|\bhmi\b/i, Monitor],
  [/surface|quality|inspect/i, Search],
  [/camera|vision|image/i, Camera],
  [/\bai\b|machine learning|deep learning|neural/i, BrainCircuit],
  [/robot|\bbots?\b/i, Bot],
  [/climate|temperature|thermo|hvac/i, Thermometer],
  [/energy|power|electric/i, Zap],
  [/security|alert|alarm/i, ShieldCheck],
  [/access|\block|door/i, Lock],
  [/voice|\bapps?\b|app-based|mobile|phone/i, Smartphone],
  [/schedul|scene|timer/i, CalendarClock],
  [/wi-?fi|wireless|\biot\b|network|remote/i, Wifi],
  [/\busb\b|\bi\/?o\b|\bplc\b/i, Usb],
  [/data|database|storage|cloud/i, Database],
  [/notif/i, Bell],
  [/speed|fast|throughput/i, Gauge],
  [/factory|plant|industr|production/i, Factory],
  [/conveyor|transport|logistic/i, Truck],
  [/packag|product/i, Package],
  [/document|\bdocs?\b|\bfiles?\b/i, FileText],
];

/** Icon for a point: picked from its text when possible, else cycles through POINT_ICONS. */
export function pickIcon(label = '', i = 0) {
  const { icon, text } = parsePoint(label);
  if (icon) return ICON_SET[icon][0];             // chosen in admin
  label = text;
  const hit = ICON_RULES.find(([re]) => re.test(label));
  return hit ? hit[1] : POINT_ICONS[i % POINT_ICONS.length];
}

/** Icon for the i-th point (pass label to get a matching icon). */
export function PointIcon({ i = 0, label = '', size = 28 }) {
  const Icon = pickIcon(label, i);
  return <Icon size={size} strokeWidth={1.8} />;
}

// "What we automate" -> What we <em>automate</em>   (or a given accent ending)
export function Accent({ text, accent }) {
  const t = (text || '').trim();
  if (accent && t.toLowerCase().endsWith(accent.toLowerCase())) {
    return <>{t.slice(0, t.length - accent.length)}<em>{t.slice(t.length - accent.length)}</em></>;
  }
  const i = t.lastIndexOf(' ');
  if (i < 0) return <em>{t}</em>;
  return <>{t.slice(0, i + 1)}<em>{t.slice(i + 1)}</em></>;
}

// leading emoji / symbols ("🤖 AI-powered…" -> "AI-powered…") — the icon tile replaces them
const LEAD_EMOJI = /^(?:[\p{Extended_Pictographic}\p{Emoji_Presentation}\uFE0F\u200D\u20E3]|\s)+/u;
const clean = (s) => { const p = parsePoint(s); const t = p.text.replace(LEAD_EMOJI, '').trim(); return p.icon ? `[${p.icon}] ${t}` : t; };

// body text -> { paras: [...], items: [...] }
//  - a paragraph made only of "- " lines becomes points
//  - a paragraph typed on ONE line like "- A - B - C" (or "• A • B") also becomes points
export function splitBody(body = '') {
  const paras = []; const items = [];
  String(body || '').split(/\n\s*\n/).forEach((para) => {
    const lines = para.split('\n').map((l) => l.trim()).filter(Boolean);
    if (!lines.length) return;
    const bullets = lines.filter((l) => /^[-•*]\s+/.test(l));
    if (bullets.length === lines.length) {
      bullets.forEach((l) => {
        const rest = l.replace(/^[-•*]\s+/, '');
        // the whole list typed on ONE line: "- A - B - C" -> 3 points
        // (only then — a normal bullet like "Speed - 60 parts/min" stays as it is)
        const parts = lines.length === 1 ? rest.split(/\s+[-•]\s+/).map(clean).filter(Boolean) : [];
        if (parts.length >= 3) parts.forEach((x) => items.push(x));
        else items.push(clean(rest));
      });
    } else {
      paras.push(lines.join(' '));
    }
  });
  return { paras, items };
}

export default function SplitSection({ image, flip, heading, accent, paras = [], items = [], tone, children }) {
  return (
    <section className={`svc-split${flip ? ' flip' : ''}${tone ? ' tone' : ''}`}>
      <div className="split-in">
        <div className="split-media">
          {image && <img src={image} alt="" loading="lazy" />}
        </div>
        <div className="split-body">
          <div>
            {heading && <h2><Accent text={heading} accent={accent} /></h2>}
            {paras.map((p, i) => <p key={i}>{p}</p>)}
            {items.length > 0 && (
              <div className="split-items">
                {items.map((item, i) => {
                  const pt = toPoint(item);
                  return (
                    <div className="split-item" key={i}>
                      <span className="si-ico"><PointIcon i={i} label={pt.icon ? `[${pt.icon}] ${pt.text}` : pt.text} /></span>
                      <b>{pt.text}</b>
                      {pt.desc && <small>{pt.desc}</small>}
                    </div>
                  );
                })}
              </div>
            )}
            {children}
          </div>
        </div>
      </div>
    </section>
  );
}
