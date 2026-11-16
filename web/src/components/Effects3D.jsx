import { useEffect, useLayoutEffect } from 'react';

/**
 * Site-wide 3D layer. Mount it ONCE inside the public <Layout />.
 *
 *  1. Tilt   — any element matching TILT_SEL tilts towards the pointer with a
 *              light "glare", and its icon/title lift out of the card (translateZ).
 *  2. Hero   — mouse parallax: the video, the 3D shapes and each text layer of
 *              .hero move at different depths.
 *  3. Reveal — content (and the footer) rotates in from a slight 3D angle the
 *              first time it scrolls into view.
 *
 * Everything is event-delegated / observed at document level, so cards that
 * render later (API data) or live on pages not touched by this patch still get
 * the effect. Disabled for touch devices (no hover) and prefers-reduced-motion.
 * Styles live in styles.css under "===== 3D =====".
 */

const TILT_SEL = [
  '.card', '.cap', '.why-card', '.sol-card', '.metric-card', '.quote-card',
  '.quote', '.lead-card', '.step', '.job', '.client', '.ind', '.stat', '.cinfo',
  '.pd-spec', '.pd-feat-item', '.job-side-card', '.cat-intro', '.general-apply', '.cta-band',
  '.flow-step', '.stat-b', '.wf-box', '.post-card',
  '.logo', '.nav-cta',                                  // header logo + CTA buttons
  '.hero h1', '.hero .lead', '.page-hero h1', '.page-hero p',
  '.intro-text', '.sec-head', '.people-head', '.split-body > div', '.foot-top > div', '.foot-bottom', // 3D tilting headings & footer text (no card box)
  '.intro-media', '.split-item', '.split-media', '.people-photo', '.founder-card',
  '.audit-banner-3d', '.audit-step-3d',
  '.hero-pill', '.tech-pill', '.cloud-tech-pill', '.cta-contact-pill-3d',
  '.prod-tab-3d', '.prod-showcase-3d', '.prod-highlight-3d', '.prod-check-3d',
  '.faq-item-3d', '.faq-cta-3d',
].join(',');

// Per-element tilt settings: max angle (deg), lift (px), glare on/off.
// Anything not listed here is a card: angle by width, 6px lift, glare on.
const TILT_CFG = [
  { sel: '.logo', max: 12, lift: 0, glare: false },
  { sel: '.nav-cta', max: 10, lift: -2, glare: false },
  { sel: '.hero h1, .hero .lead, .page-hero h1, .page-hero p', max: 8, lift: -4, glare: false },
  { sel: '.intro-text, .sec-head, .people-head, .split-body > div', max: 9, lift: -6, glare: false },
  { sel: '.foot-top > div, .foot-bottom', max: 9, lift: -5, glare: false },
  { sel: '.prod-tab-3d', max: 9, lift: -4, glare: true },
  { sel: '.hero-pill, .tech-pill, .cloud-tech-pill, .cta-contact-pill-3d', max: 11, lift: -4, glare: false },
  { sel: '.audit-step-3d, .prod-highlight-3d, .prod-check-3d', max: 8, lift: -5, glare: true },
  { sel: '.faq-item-3d', max: 4.5, lift: -4, glare: true },
  { sel: '.audit-banner-3d, .cta-band, .prod-showcase-3d, .faq-cta-3d', max: 3.5, lift: -4, glare: true },
  { sel: '.stat-b', max: 10, lift: -6, glare: true },
  { sel: '.flow-step', max: 8, lift: -4, glare: false },
  { sel: '.intro-media', max: 7, lift: -5, glare: true },
  { sel: '.split-item', max: 10, lift: -4, glare: false },
  { sel: '.split-media', max: 6, lift: -5, glare: true },
  { sel: '.people-photo', max: 8, lift: -6, glare: true },
];
const cfgFor = (el, r) => {
  const c = TILT_CFG.find((x) => el.matches(x.sel));
  if (c) return c;
  return { max: el.dataset.tilt ? +el.dataset.tilt : r.width > 720 ? 4 : r.width > 420 ? 7 : 10, lift: -8, glare: true };
};

const REVEAL_SEL = [
  '.sec-head', '.grid-3 > *', '.flow-step', '.stat-b', '.ind', '.client', '.cta-band', '.job',
  '.why-card', '.sol-card', '.metric-card', '.quote-card',
  '.lead-card', '.steps > *', '.pd-spec', '.pd-feat-item', '.pd-block', '.cat-intro', '.general-apply',
  '.about-grid > *', '.contact-grid > *', '.quote', '.stat', '.wf-box', '.post-wrap > *', '.member > *',
  '.foot-top > *', '.foot-bottom', '.intro-text', '.intro-media', '.split-body > div', '.split-media', '.people-head', '.people-card', '.founder-card',
  '.audit-banner-3d', '.audit-step-3d', '.prod-showcase-3d', '.faq-item-3d', '.faq-cta-3d',
].join(',');

const reduceMotion = () => !!window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
const finePointer = () => !!(window.matchMedia?.('(any-pointer: fine)')?.matches || window.matchMedia?.('(hover: hover)')?.matches);

/* ---------- 1. pointer tilt on cards ---------- */
function useTilt() {
  useEffect(() => {
    if (reduceMotion() || !finePointer()) return undefined;

    let el = null;       // the card under the pointer
    let rect = null;     // its cached bounding box
    let cfg = null;      // its tilt settings
    let raf = 0;

    const target = { x: 0, y: 0 }; // where the pointer says the tilt should be
    const cur = { x: 0, y: 0 };    // where it actually is, easing towards target

    // How much of the remaining distance to close per frame. Lower is softer;
    // 0.16 settles in ~8 frames, which reads as responsive but not twitchy.
    const EASE = 0.16;
    const SETTLED = 0.0006; // below this, stop the loop rather than spin forever

    /**
     * The bounding box is measured ONLY when the pointer enters a new card, or
     * when layout could have changed. The previous version called
     * getBoundingClientRect() inside the rAF callback, forcing a synchronous
     * layout on every single pointer move — the classic layout-thrash, and the
     * most expensive thing this file did.
     */
    const measure = () => {
      if (!el) return;
      rect = el.getBoundingClientRect();
      if (rect.width && rect.height) cfg = cfgFor(el, rect);
    };

    const frame = () => {
      raf = 0;
      if (!el || !cfg) return;

      cur.x += (target.x - cur.x) * EASE;
      cur.y += (target.y - cur.y) * EASE;

      const { max, lift } = cfg;
      el.style.setProperty('--gx', `${((cur.x + 0.5) * 100).toFixed(1)}%`);
      el.style.setProperty('--gy', `${((cur.y + 0.5) * 100).toFixed(1)}%`);
      el.style.setProperty(
        'transform',
        `perspective(1050px) rotateX(${(-cur.y * max).toFixed(2)}deg) ` +
        `rotateY(${(cur.x * max).toFixed(2)}deg) translate3d(0,${lift}px,0)`,
        'important'
      );

      // Keep going only while there is still visible movement left.
      const dx = target.x - cur.x;
      const dy = target.y - cur.y;
      if (dx * dx + dy * dy > SETTLED) raf = requestAnimationFrame(frame);
    };

    const kick = () => { if (!raf) raf = requestAnimationFrame(frame); };

    const release = () => {
      if (!el) return;
      // Dropping the inline transform hands the card back to the .t3d CSS
      // transition, which eases it home over .55s.
      el.classList.remove('tilting', 'no-glare');
      el.style.removeProperty('transform');
      el.style.removeProperty('--gx');
      el.style.removeProperty('--gy');
      el = null;
      rect = null;
      cfg = null;
      cur.x = 0; cur.y = 0;
      target.x = 0; target.y = 0;
    };

    const onMove = (e) => {
      const t = e.target instanceof Element ? e.target.closest(TILT_SEL) : null;

      if (t !== el) {
        release();
        el = t;
        if (el) {
          el.classList.add('t3d', 'tilting');
          measure();
          if (cfg) el.classList.toggle('no-glare', !cfg.glare);
          // Start from flat so the card eases out of rest rather than
          // appearing mid-tilt.
          cur.x = 0; cur.y = 0;
        }
      }

      if (!el || !rect || !rect.width || !rect.height) return;

      target.x = (e.clientX - rect.left) / rect.width - 0.5;   // -0.5 … 0.5
      target.y = (e.clientY - rect.top) / rect.height - 0.5;
      kick();
    };

    const onOut = (e) => { if (el && !e.relatedTarget) release(); }; // pointer left the window

    // The cached rect is only valid while the page holds still.
    const onScroll = () => { if (el) measure(); };

    document.addEventListener('mousemove', onMove, { passive: true });
    document.addEventListener('mouseout', onOut, { passive: true });
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    window.addEventListener('blur', release);

    return () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseout', onOut);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      window.removeEventListener('blur', release);
      cancelAnimationFrame(raf);
      release();
    };
  }, []);
}

/* ---------- 2. hero mouse parallax ---------- */
function useHeroParallax() {
  useEffect(() => {
    if (reduceMotion() || !finePointer()) return undefined;
    let hero = null;
    let raf = 0;
    let last = null;

    const apply = () => {
      raf = 0;
      if (!hero || !last) return;
      const r = hero.getBoundingClientRect();
      const mx = ((last.clientX - r.left) / r.width - 0.5) * 2;   // -1 … 1
      const my = ((last.clientY - r.top) / r.height - 0.5) * 2;
      hero.style.setProperty('--mx', mx.toFixed(3));
      hero.style.setProperty('--my', my.toFixed(3));
    };
    const reset = () => {
      if (!hero) return;
      hero.style.setProperty('--mx', '0');
      hero.style.setProperty('--my', '0');
      hero = null;
    };
    const onMove = (e) => {
      const h = e.target instanceof Element ? e.target.closest('.hero, .page-hero') : null;
      if (h !== hero) { reset(); hero = h; }
      if (!hero) return;
      last = e;
      if (!raf) raf = requestAnimationFrame(apply);
    };
    document.addEventListener('mousemove', onMove, { passive: true });
    return () => { document.removeEventListener('mousemove', onMove); cancelAnimationFrame(raf); reset(); };
  }, []);
}

/* ---------- 3. 3D scroll-build reveal (scrolling down AND scrolling back up) ---------- */
function useReveal() {
  useLayoutEffect(() => {
    if (reduceMotion() || !('IntersectionObserver' in window) || !('MutationObserver' in window)) return undefined;
    const main = document.body;
    const timers = new WeakMap();

    const io = new IntersectionObserver((entries) => {
      for (const en of entries) {
        const el = en.target;
        const prevTimer = timers.get(el);
        if (prevTimer) {
          clearTimeout(prevTimer);
          timers.delete(el);
        }

        if (en.isIntersecting) {
          // Element entered viewport -> build/assemble in 3D
          el.classList.add('r3d', 'r3d-in');
          const delayMs = parseFloat(el.style.getPropertyValue('--rd') || '0') || 0;
          const t = setTimeout(() => {
            // Once built in place, remove r3d classes so cursor 3D tilt works cleanly
            el.classList.remove('r3d', 'r3d-in', 'r3d-from-top');
            timers.delete(el);
          }, 760 + delayMs);
          timers.set(el, t);
        } else {
          // Element left viewport -> re-arm 3D build state for next scroll (up or down)
          el.classList.remove('r3d-in');
          el.classList.add('r3d');
          if (en.boundingClientRect.top < 0) {
            el.classList.add('r3d-from-top');
          } else {
            el.classList.remove('r3d-from-top');
          }
        }
      }
    }, { rootMargin: '0px 0px -5% 0px', threshold: 0.06 });

    const seen = new WeakSet();
    const prep = (el) => {
      if (seen.has(el)) return;
      seen.add(el);
      const i = el.parentElement ? Array.prototype.indexOf.call(el.parentElement.children, el) : 0;
      el.style.setProperty('--rd', `${Math.min(i, 8) * 75}ms`);
      const r = el.getBoundingClientRect();
      if (r.top > window.innerHeight || r.bottom < 0) {
        el.classList.add('r3d');
        if (r.bottom < 0) el.classList.add('r3d-from-top');
      }
      io.observe(el);
    };
    const scan = (root) => {
      if (!(root instanceof Element)) return;
      if (root.matches(REVEAL_SEL)) prep(root);
      root.querySelectorAll(REVEAL_SEL).forEach(prep);
    };

    scan(main);
    const mo = new MutationObserver((muts) => {
      for (const m of muts) for (const n of m.addedNodes) scan(n);
    });
    mo.observe(main, { childList: true, subtree: true });
    return () => { io.disconnect(); mo.disconnect(); };
  }, []);
}

export default function Effects3D() {
  useTilt();
  useHeroParallax();
  useReveal();
  return null;
}
