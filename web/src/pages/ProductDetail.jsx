import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import client from '../api/client';
import { PageHero } from './_hero.jsx';

export default function ProductDetail() {
  const { slug } = useParams();
  const [p, setP] = useState(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    client.get(`/products/${slug}`).then((r) => setP(r.data.item)).catch((e) => setErr(e?.response?.data?.message || 'Not found'));
  }, [slug]);

  if (err) return (
    <section><div className="wrap"><p className="muted">{err}</p><Link to="/products" className="card-link">← Back to products</Link></div></section>
  );
  if (!p) return <section><div className="wrap"><p className="muted">Loading…</p></div></section>;

  return (
    <>
      <PageHero kicker={p.category} title={p.name} sub={p.summary} />
      <section>
        <div className="wrap">
          <div className="pd-crumb"><Link to="/products">Products</Link> <span>/</span> <b>{p.name}</b></div>

          {p.image && <img className="pd-cover" src={p.image} alt="" />}
          {p.positioning && <div className="pd-tagline">“{p.positioning}”</div>}

          {p.purpose && (
            <div className="pd-block">
              <h3>Purpose</h3>
              <p className="muted">{p.purpose}</p>
            </div>
          )}

          {p.specs?.length > 0 && (
            <div className="pd-specs">
              {p.specs.map((s, i) => (
                <div className="pd-spec" key={i}><span>{s.label}</span><b>{s.value}</b></div>
              ))}
            </div>
          )}

          {p.features?.length > 0 && (
            <div className="pd-block">
              <h3>Features{p.buildsOn ? ` (includes all ${p.buildsOn} features, plus:)` : ''}</h3>
              <div className="pd-feat">
                {p.features.map((f, i) => (
                  <div className="pd-feat-item" key={i}><span className="pd-check">✓</span>{f}</div>
                ))}
              </div>
            </div>
          )}

          <div className="pd-cta">
            <Link to="/contact" className="btn btn-primary">Enquire about {p.name}</Link>
            <Link to={`/products?category=${encodeURIComponent(p.category)}`} className="btn" style={{ border: '2px solid var(--line)', color: 'var(--navy)' }}>All {p.category} products</Link>
          </div>
        </div>
      </section>
    </>
  );
}
