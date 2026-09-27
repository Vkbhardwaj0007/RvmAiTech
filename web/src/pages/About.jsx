import { useEffect, useState } from 'react';
import client from '../api/client';
import { PageHero } from './_hero.jsx';
export default function About() {
  const [a, setA] = useState(null);
  useEffect(() => { client.get('/site/about').then((r) => setA(r.data.value)).catch(() => {}); }, []);
  const heading = a?.heading || 'We build machines that see, decide and act';
  const body = a?.body || '';
  return (
    <>
      <PageHero kicker="Who we are" title="About RvmAiTech" sub="Your partner in intelligent automation." />
      <section><div className="wrap about-grid">
        <div>
          <h2 style={{ color: 'var(--navy)' }}>{heading}</h2>
          {body ? body.split(/\n\n+/).map((p, i) => <p className="muted" key={i}>{p}</p>) : (
            <p className="muted">RvmAiTech is an automation company focused on robotics, computer vision and machine intelligence.</p>
          )}
        </div>
        <div className="about-stats">
          {a?.mission && <div className="stat"><b>Mission</b><span>{a.mission}</span></div>}
          {a?.vision && <div className="stat"><b>Vision</b><span>{a.vision}</span></div>}
          <div className="stat"><b>Robotics</b><span>Automate with precision</span></div>
          <div className="stat"><b>Machine Vision</b><span>Inspect &amp; verify faster</span></div>
        </div>
      </div></section>
    </>
  );
}
