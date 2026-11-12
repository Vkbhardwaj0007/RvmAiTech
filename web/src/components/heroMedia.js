import { DEFAULT_HERO_VIDEOS, HERO_POSTER, parseHeroVideos } from './HeroVideo';

/**
 * Per-page hero backgrounds.
 *
 * Every inner page shows a hero band (pages/_hero.jsx). Which video or image it
 * shows is decided here, in this order:
 *   1. what the admin chose in Settings → "Page hero backgrounds" (site content key `pageHero`)
 *   2. otherwise PAGE_HERO_DEFAULTS below — a different built-in clip / still per page
 *
 * Built-in assets live in web/public/hero/: hero-1..3.mp4/.webm and hero-1..3-still.jpg
 * (one frame taken from each clip).
 */

// [key, admin label] — key = first URL segment of the page (/about, /careers/apply → careers …)
export const HERO_PAGES = [
  ['about', 'About Us'],
  ['leadership', 'Our Leadership'],
  ['news', 'In News'],
  ['careers', 'Careers (list, job, apply)'],
  ['services', 'Services'],
  ['technologies', 'Technologies'],
  ['products', 'Products'],
  ['projects', 'Projects'],
  ['software-development', 'Software Development'],
  ['workflow', 'Workflow steps'],
  ['blog', 'Blog'],
  ['contact', 'Contact'],
  ['clients', 'Companies we work with (list + company pages)'],
  ['default', 'Any other page'],
];

export const BUILTIN_STILLS = ['/hero/hero-1-still.jpg', '/hero/hero-2-still.jpg', '/hero/hero-3-still.jpg'];

// What a page shows when the admin has not chosen anything for it.
export const PAGE_HERO_DEFAULTS = {
  about: 'clip2',
  leadership: 'still3',
  news: 'clip3',
  careers: 'still1',
  services: 'clip1',
  technologies: 'clip3',
  products: 'clip2',
  projects: 'clip1',
  'software-development': 'clip2',
  workflow: 'clip2',
  blog: 'still2',
  contact: 'still1',
  clients: 'clip3',
  default: 'home',
};

// Options offered in the admin <select>
export const HERO_MODES = [
  ['default', 'Default for this page'],
  ['home', 'Same as homepage (video playlist)'],
  ['clip1', 'Built-in video 1'],
  ['clip2', 'Built-in video 2'],
  ['clip3', 'Built-in video 3'],
  ['still1', 'Built-in image 1'],
  ['still2', 'Built-in image 2'],
  ['still3', 'Built-in image 3'],
  ['video', 'Upload / link a video…'],
  ['image', 'Upload an image…'],
];

export function pageKeyFromPath(pathname) {
  const seg = (pathname || '/').split('/').filter(Boolean)[0] || '';
  return HERO_PAGES.some(([k]) => k === seg) ? seg : 'default';
}

export const firstSrc = (item) => (typeof item === 'string' ? item : item?.mp4 || item?.webm || '');

/**
 * -> { image }  or  { videos: [...], poster }
 * `content` is the site content object from SiteContext (content.hero, content.pageHero).
 */
export function resolveHeroMedia(key, content) {
  const cfg = content?.pageHero?.[key] || {};
  let mode = cfg.mode || 'default';
  if (mode === 'video' && !parseHeroVideos(cfg.video).length) mode = 'default';
  if (mode === 'image' && !cfg.image) mode = 'default';
  if (mode === 'default') mode = PAGE_HERO_DEFAULTS[key] || 'home';

  switch (mode) {
    case 'home': {
      if (content?.hero?.image) return { image: content.hero.image };
      const home = parseHeroVideos(content?.hero?.videos?.length ? content.hero.videos : content?.hero?.video);
      return { videos: home.length ? home : DEFAULT_HERO_VIDEOS, poster: HERO_POSTER };
    }
    case 'clip1': case 'clip2': case 'clip3': {
      const i = Number(mode.slice(4)) - 1;
      return { videos: [DEFAULT_HERO_VIDEOS[i]], poster: BUILTIN_STILLS[i] };
    }
    case 'still1': case 'still2': case 'still3':
      return { image: BUILTIN_STILLS[Number(mode.slice(5)) - 1] };
    case 'video':
      return { videos: parseHeroVideos(cfg.video), poster: HERO_POSTER };
    case 'image':
      return { image: cfg.image };
    default:
      return { videos: DEFAULT_HERO_VIDEOS, poster: HERO_POSTER };
  }
}

/**
 * Hero set on ONE item (Admin → Services/Products/… → Edit → "Page hero" fields).
 *   item = { heroImage, heroVideo, heroVideoUrl }
 * -> { videos, poster } | { embed, poster } | { image } | null (nothing set → use the section's hero)
 * A video wins over the image; the image is then used as the poster while the video loads.
 */
export function itemHeroMedia(item) {
  if (!item) return null;
  const image = (item.heroImage || '').trim();
  const file = (item.heroVideo || '').trim();
  const url = (item.heroVideoUrl || '').trim();
  const poster = image || HERO_POSTER;
  if (file) return { videos: [file], poster };
  if (url) {
    if (/\.(mp4|webm|ogv)(\?.*)?$/i.test(url)) return { videos: [url], poster };
    const yt = url.match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/i);
    if (yt) {
      const q = new URLSearchParams({ autoplay: '1', mute: '1', loop: '1', playlist: yt[1], controls: '0', rel: '0', modestbranding: '1', playsinline: '1', disablekb: '1' });
      return { embed: `https://www.youtube-nocookie.com/embed/${yt[1]}?${q}`, poster };
    }
    const vm = url.match(/vimeo\.com\/(?:video\/)?(\d+)/i);
    if (vm) return { embed: `https://player.vimeo.com/video/${vm[1]}?background=1&autoplay=1&loop=1&muted=1`, poster };
  }
  if (image) return { image };
  return null;
}
