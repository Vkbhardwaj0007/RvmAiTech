import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Mounted once in the site layout (App.jsx). On every navigation:
 *
 *   - another page opens            → land DIRECTLY on its top (no smooth scroll from where you were;
 *                                     styles.css has html{scroll-behavior:smooth}, so this switches it off for the jump)
 *   - the same page is clicked again → smooth scroll to the top, e.g. "Home" in the menu while on the
 *     (e.g. Home while on Home)        homepage brings you back to the hero
 *   - a link with a hash (/#workflow, /#hero, /#home) → scrolls to that section, waiting for it to render
 *
 * Works with every <Link to="/">, <NavLink to="/">, the logo and the breadcrumbs — nothing in the
 * header needs to change. The homepage hero has id="hero" (Home.jsx); #home / #top are aliases.
 */
const HASH_ALIASES = { home: 'hero', top: 'hero' };

export default function ScrollTop() {
  const { pathname, hash, key } = useLocation();
  const prev = useRef(null);

  useEffect(() => {
    const samePage = prev.current === pathname;
    prev.current = pathname;

    const html = document.documentElement;
    // run fn with smooth scrolling switched off, so the page jumps straight to the spot
    const instant = (fn) => {
      const saved = html.style.scrollBehavior;
      html.style.scrollBehavior = 'auto';
      fn();
      html.style.scrollBehavior = saved;
    };

    const id = hash ? decodeURIComponent(hash.slice(1)) : '';
    const target = HASH_ALIASES[id] || id;
    let timer = 0;

    if (target) {
      let tries = 0;
      const go = () => {
        const el = document.getElementById(target);
        if (el) {
          if (samePage) el.scrollIntoView({ block: 'start' });           // smooth (CSS)
          else instant(() => el.scrollIntoView({ block: 'start' }));    // direct
        } else if (tries++ < 40) {
          timer = setTimeout(go, 50);                                    // section may still be loading
        }
      };
      go();
    } else if (samePage) {
      window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
    } else {
      instant(() => window.scrollTo(0, 0));
    }
    return () => clearTimeout(timer);
  }, [pathname, hash, key]);

  return null;
}
