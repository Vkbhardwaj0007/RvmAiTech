import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import client from '../api/client';
import { PageHero } from './_hero.jsx';
const CAT_INTRO = {
  Datalogger: {
    title: 'Datalogger — the edge of MDMS',
    text: 'Datalogger is the hardware/agent that sits at the machine and pulls data straight from the PLC, sensors and energy meters — no change to the machine program. MDMS turns that data into dashboards, reports and alerts. Pick the logger by how many machines and which protocols you need; every model feeds MDMS.',
    plcs: ['Siemens', 'Mitsubishi', 'Delta', 'Omron', 'ABB', 'Inovance', 'Allen-Bradley', 'Modbus RTU/TCP', 'Energy meters', '4–20 mA / TC'],
  },
  'Home Automation': {
    title: 'Home Automation — from one smart switch to the whole building',
    text: 'Start with a retrofit switch kit that fits behind your existing switchboard, grow to a whole-home controller with scenes and energy monitoring, add security and access, or automate a complete villa or office. Everything works locally when the internet is down and is installed by our own team.',
    plcs: ['Lighting', 'Fans & AC', 'Curtains', 'Geyser & sockets', 'Water tank & pump', 'Energy monitoring', 'CCTV & doorbell', 'Smart locks', 'Alexa / Google'],
  },
  MDMS: {
    title: 'MDMS — Machine Data Monitoring System',
    text: 'One software family, six versions — from basic machine monitoring to intelligent process automation. Each version includes everything in the one before it, so you can start small and upgrade without changing hardware.',
  },
};

export default function Products() {
  const [params, setParams] = useSearchParams();
  const category = params.get('category') || 'all';
  const [items, setItems] = useState([]);
  const [cats, setCats] = useState([]);
  useEffect(() => {
    client.get('/products', { params: { all: 0 } }).then((r) => {
      const all = r.data.items || [];
      setCats(['all', ...new Set(all.map((p) => p.category).filter(Boolean))]);
    }).catch(() => {});
  }, []);
  useEffect(() => {
    const q = category !== 'all' ? { category } : {};
    client.get('/products', { params: q }).then((r) => setItems(r.data.items || [])).catch(() => {});
  }, [category]);
  return (
    <>
      <PageHero kicker="What we build" title={category === 'all' ? 'Products' : category} sub="Ready and custom hardware/software for automation." />
      <section><div className="wrap">
        {CAT_INTRO[category] && (
          <div className="cat-intro">
            <h2>{CAT_INTRO[category].title}</h2>
            <p>{CAT_INTRO[category].text}</p>
            {CAT_INTRO[category].plcs && (
              <div className="plc-strip"><span className="plc-label">Supported:</span>{CAT_INTRO[category].plcs.map((x) => <span className="plc" key={x}>{x}</span>)}</div>
            )}
          </div>
        )}
        <div className="chips">
          {cats.map((c) => (
            <button key={c} className={`chip ${category === c ? 'on' : ''}`} onClick={() => setParams(c === 'all' ? {} : { category: c })}>{c}</button>
          ))}
        </div>
        <div className="grid-3" style={{ marginTop: 22 }}>
          {items.map((p) => (
            <article className="card" key={p._id}>
              {p.image && <img className="card-img" src={p.image} alt="" />}
              <div className="prod-cat">{p.category}</div>
              <h3>{p.name}</h3><p>{p.summary}</p>
              {p.specs?.length > 0 && <ul className="tick">{p.specs.slice(0, 3).map((s, k) => <li key={k}><b>{s.label}:</b> {s.value}</li>)}</ul>}
              <Link to={`/products/${p.slug}`} className="card-link">View details →</Link>
            </article>
          ))}
          {items.length === 0 && <p className="muted">No products in this category yet.</p>}
        </div>
      </div></section>
    </>
  );
}
