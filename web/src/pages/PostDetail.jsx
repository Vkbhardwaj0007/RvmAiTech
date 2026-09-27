import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import client from '../api/client';
import { PageHero } from './_hero.jsx';
export default function PostDetail() {
  const { slug } = useParams();
  const [p, setP] = useState(null);
  const [err, setErr] = useState('');
  useEffect(() => { client.get(`/posts/${slug}`).then((r) => setP(r.data.item)).catch((e) => setErr(e?.response?.data?.message || 'Not found')); }, [slug]);
  if (err) return <section><div className="wrap"><p className="muted">{err}</p><Link to="/blog" className="card-link">← Back</Link></div></section>;
  if (!p) return <section><div className="wrap"><p className="muted">Loading…</p></div></section>;
  const back = p.category === 'News' ? '/news' : '/blog';
  return (
    <>
      <PageHero kicker={p.category} title={p.title} sub={p.excerpt} />
      <section><div className="wrap post-wrap">
        <div className="pd-crumb"><Link to={back}>{p.category === 'News' ? 'In News' : 'Blog'}</Link> <span>/</span> <b>{p.title}</b></div>
        <div className="post-meta">{p.author && <span>By {p.author}</span>} <span>{new Date(p.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span></div>
        {p.coverImage && <img className="post-cover" src={p.coverImage} alt="" />}
        <div className="post-body">
          {String(p.content || '').split(/\n\n+/).map((para, i) => <p key={i}>{para}</p>)}
        </div>
        <Link to={back} className="btn btn-primary" style={{ marginTop: 20 }}>← All {p.category === 'News' ? 'news' : 'posts'}</Link>
      </div></section>
    </>
  );
}
