import { useEffect, useState } from 'react';
import client from '../api/client';
import Seo from '../components/Seo';
import { PageHero } from './_hero.jsx';
import ClientCard from '../components/ClientCard';

/** /clients — every company in "Companies we work with"; each card opens /clients/<slug>. */
export default function Clients() {
  const [list, setList] = useState(null);

  useEffect(() => {
    client.get('/clients').then((r) => setList(r.data?.items || [])).catch(() => setList([]));
  }, []);

  return (
    <>
      <Seo title="Companies we work with" description="The companies RvmAiTech works with — open a company to watch the project video and read the details." />
      <PageHero kicker="Trusted by" title="Companies we work with" sub="Open a company to watch the project video and see what we built together." />

      <section>
        <div className="wrap">
          {list === null && <p className="muted">Loading…</p>}
          {list && list.length === 0 && <p className="muted">No companies added yet — add them in Admin → Clients.</p>}
          {list && list.length > 0 && (
            <div className="clients clients-big">
              {list.map((c) => <ClientCard client={c} big key={c._id} />)}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
