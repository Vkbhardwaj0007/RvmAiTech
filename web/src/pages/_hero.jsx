import { useLocation } from 'react-router-dom';
import { useSite } from '../api/SiteContext';
import HeroVideo from '../components/HeroVideo';
import { pageKeyFromPath, resolveHeroMedia, itemHeroMedia } from '../components/heroMedia';
import PageIntro from '../components/PageIntro';

/**
 * Hero band for inner pages (About, Services, Products, Careers, Contact…).
 * Background = the video or image chosen for this page in Settings → "Page hero
 * backgrounds"; otherwise a built-in clip / still that differs per page
 * (see components/heroMedia.js). Pass `page="about"` to force a page key.
 * On top-level pages (/about, /products, …) the editable intro block (heading,
 * text, image — Admin → Pages) is rendered right under the hero; pass
 * `intro={false}` to leave it out.
 *
 *   <PageHero kicker="What we build" title="Products" sub="Ready and custom hardware…" />
 *   <PageHero … media={item} />   // detail pages: the item's own heroImage / heroVideo / heroVideoUrl win
 */
export function PageHero({ kicker, title, sub, page, intro = true, media: item, children }) {
  const { content } = useSite();
  const { pathname } = useLocation();
  const key = page || pageKeyFromPath(pathname);
  const media = itemHeroMedia(item) || resolveHeroMedia(key, content);
  const mediaKey = media.embed || media.image || (media.videos || []).map((v) => (typeof v === 'string' ? v : v.mp4)).join('|');
  const topLevel = pathname.split('/').filter(Boolean).length <= 1;   // not on detail pages (/products/x)

  return (
    <>
    <section className="page-hero" data-hero={key}>
      {media.embed ? (
        <div className="hero-video on hero-embed" aria-hidden="true">
          {media.poster && <img src={media.poster} alt="" />}
          <iframe key={media.embed} src={media.embed} title="" tabIndex={-1} allow="autoplay; encrypted-media; picture-in-picture" frameBorder="0" />
        </div>
      ) : media.image
        ? <div className="hero-video on" aria-hidden="true"><img src={media.image} alt="" /></div>
        : <HeroVideo key={mediaKey || key} sources={media.videos} poster={media.poster} />}
      <div className="wrap">
        {kicker && <span className="eyebrow">{kicker}</span>}
        <h1>{title}</h1>
        {sub && <p>{sub}</p>}
        {children}
      </div>
    </section>
    {intro && topLevel && <PageIntro pageKey={key} slot="top" />}
    </>
  );
}

export default PageHero;
