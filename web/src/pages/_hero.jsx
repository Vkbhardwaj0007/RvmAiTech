export function PageHero({ kicker, title, sub }) {
  return (
    <section className="page-hero">
      <div className="wrap">
        {kicker && <div className="sec-kicker" style={{ color: '#ff9d52' }}>{kicker}</div>}
        <h1>{title}</h1>
        {sub && <p>{sub}</p>}
      </div>
    </section>
  );
}
