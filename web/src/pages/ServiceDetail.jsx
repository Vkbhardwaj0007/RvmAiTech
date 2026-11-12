import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import client from '../api/client';
import Seo from '../components/Seo';
import { PageHero } from './_hero.jsx';
import { serviceCards } from '../components/serviceCards';
import { BUILTIN_STILLS } from '../components/heroMedia';
import Split, { splitBody } from '../components/SplitSection';

/**
 * /services/<slug> — e.g. Process Automation.
 *
 * Layout (like the reference the client shared):
 *   hero
 *   "Why <Service>?"  — big image left | heading (service name in orange), intro/description, highlights as icon points
 *   one split section per card (Admin → Services → Edit → Detail cards):
 *                        image on one side (alternating, ~40% wide, rounded), heading (last word in orange), text, "- " lines as icon points
 *   CTA
 */

const STILL_FOR = { process: 0, home: 1, industry: 2, robot: 0, vision: 1, ai: 2 };

export default function ServiceDetail() {
  const { slug } = useParams();
  const [s, setS] = useState(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    setS(null); setErr('');
    client.get(`/services/${slug}`).then((r) => setS(r.data.item)).catch((e) => setErr(e?.response?.data?.message || 'Not found'));
  }, [slug]);

  if (err) return <section><div className="wrap"><p className="muted">{err}</p><Link to="/services" className="card-link">← All services</Link></div></section>;
  if (!s) return <section><div className="wrap"><p className="muted">Loading…</p></div></section>;

  const whyParas = [s.intro, ...(s.description || '').split(/\n\s*\n|\n/)].map((x) => (x || '').trim()).filter(Boolean);
  const whyItems = Array.isArray(s.features) ? s.features.filter(Boolean) : [];
  const whyImage = s.image || BUILTIN_STILLS[STILL_FOR[s.icon] ?? 0];
  const showWhy = whyParas.length > 0 || whyItems.length > 0;

  const cards = serviceCards(s);

  return (
    <>
      <Seo title={s.title} description={s.summary || s.intro} />
      <PageHero media={s} kicker="Services" title={s.title} sub={s.summary} />

      <div className="wrap svc-crumb"><Link to="/services">Services</Link> <span>/</span> <b>{s.title}</b></div>

      {showWhy && (
        <Split
          image={whyImage}
          heading={`Why ${s.title}?`}
          accent={`${s.title}?`}
          paras={whyParas}
          items={whyItems}
        />
      )}

      {cards.map((c, i) => {
        const { paras, items } = splitBody(c.body);
        const n = showWhy ? i + 1 : i;            // position on the page, counting the "Why" block
        return <Split key={i} image={c.image} flip={n % 2 === 1} tone={n % 2 === 1} heading={c.heading} paras={paras} items={items} />;
      })}

      <section className="svc-cta-wrap">
        <div className="wrap">
          <div className="cta-band">
            <div className="cta-text">
              <h3>Ready to automate?</h3>
              <p>Tell us about your {s.title.toLowerCase()} needs — we will suggest the right setup and a clear estimate.</p>
            </div>
            <div className="cta-actions">
              <Link to="/contact" className="btn btn-primary">Discuss {s.title}</Link>
              <Link to="/services" className="btn btn-ghost">All services</Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
