import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import client from '../api/client';
import { PageHero } from './_hero.jsx';

export default function Careers() {
  const [jobs, setJobs] = useState([]);
  useEffect(() => { client.get('/openings').then((r) => setJobs(r.data.items || [])).catch(() => {}); }, []);

  return (
    <>
      <PageHero kicker="About Us" title="Careers" sub="Build the future of automation with us." />

      <section><div className="wrap">
        <div className="sec-head">
          <div className="sec-kicker">Open positions</div>
          <h2>Current openings</h2>
          <p>Open a role to see the full description, then apply from there.</p>
        </div>
        {jobs.length === 0 ? (
          <p className="muted">No open positions right now — you can still send a general application.</p>
        ) : (
          <div className="jobs">
            {jobs.map((j) => (
              <div className="job" key={j._id}>
                <div>
                  <h3><Link to={`/careers/${j.slug}`} className="job-title-link">{j.title}</Link></h3>
                  <div className="job-meta">
                    <span>{j.type}</span> · <span>{j.location}</span>
                    {j.experience && <> · <span>{j.experience}</span></>}
                    {j.department && <> · <span>{j.department}</span></>}
                  </div>
                  <p className="muted">{j.summary || (j.description || '').split('\n')[0]}</p>
                </div>
                <div className="job-actions">
                  <Link to={`/careers/${j.slug}`} className="btn btn-ghost dark">View details</Link>
                  <Link to={`/careers/apply?job=${encodeURIComponent(j.slug)}`} className="btn btn-primary">Apply</Link>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="general-apply">
          <div>
            <h3>Don't see the right role?</h3>
            <p className="muted">Send us your profile anyway — we hire for PLC/automation, computer vision, embedded and full-stack roles as projects come in.</p>
          </div>
          <Link to="/careers/apply" className="btn btn-ghost dark">Send a general application</Link>
        </div>
      </div></section>
    </>
  );
}
