import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import client from '../api/client';
import { PageHero } from './_hero.jsx';

function ytEmbed(url) {
  const m = String(url).match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{11})/);
  return m ? `https://www.youtube.com/embed/${m[1]}` : null;
}

export default function ProjectDetail() {
  const { slug } = useParams();
  const [p, setP] = useState(null);
  const [err, setErr] = useState('');
  useEffect(() => { client.get(`/projects/${slug}`).then((r) => setP(r.data.item)).catch((e) => setErr(e?.response?.data?.message || 'Not found')); }, [slug]);
  if (err) return <section><div className="wrap"><p className="muted">{err}</p><Link to="/projects" className="card-link">← Back</Link></div></section>;
  if (!p) return <section><div className="wrap"><p className="muted">Loading…</p></div></section>;
  const embed = p.videoUrl ? ytEmbed(p.videoUrl) : null;
  return (
    <>
      <PageHero kicker={p.client || 'Our work'} title={p.title} sub={p.summary} />
      <section><div className="wrap post-wrap">
        <div className="pd-crumb"><Link to="/projects">Projects</Link> <span>/</span> <b>{p.title}</b></div>

        {/* VIDEO: uploaded mp4, or YouTube embed, or external link */}
        {p.video ? (
          <video className="proj-video" src={p.video} controls poster={p.image || undefined} />
        ) : embed ? (
          <div className="proj-embed"><iframe src={embed} title={p.title} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen /></div>
        ) : p.videoUrl ? (
          <a href={p.videoUrl} target="_blank" rel="noreferrer" className="btn btn-primary" style={{ marginBottom: 20 }}>▶ Watch video</a>
        ) : p.image ? (
          <img className="post-cover" src={p.image} alt="" />
        ) : null}

        <div className="post-meta">{p.year && <span>{p.year}</span>}{p.client && <span>{p.client}</span>}</div>
        {p.description && <div className="post-body">{String(p.description).split(/\n\n+/).map((para, i) => <p key={i}>{para}</p>)}</div>}
        <Link to="/contact" className="btn btn-primary" style={{ marginTop: 16 }}>Discuss a similar project</Link>
      </div></section>
    </>
  );
}
