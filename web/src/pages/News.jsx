import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import client from '../api/client';
import { PageHero } from './_hero.jsx';
export default function News() {
  const [posts, setPosts] = useState([]);
  useEffect(() => { client.get('/posts', { params: { category: 'News' } }).then((r) => setPosts(r.data.items || [])).catch(() => {}); }, []);
  return (
    <>
      <PageHero kicker="About Us" title="In News" sub="RvmAiTech press, updates and announcements." />
      <section><div className="wrap"><div className="grid-3">
        {posts.map((p) => (
          <Link className="card post-card" to={`/news/${p.slug}`} key={p._id}>
            {p.coverImage && <img className="card-img" src={p.coverImage} alt="" />}
            <div className="prod-cat">{new Date(p.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
            <h3>{p.title}</h3><p>{p.excerpt}</p>
            <span className="card-link">Read more →</span>
          </Link>
        ))}
        {posts.length === 0 && <p className="muted">No news yet.</p>}
      </div></div></section>
    </>
  );
}
