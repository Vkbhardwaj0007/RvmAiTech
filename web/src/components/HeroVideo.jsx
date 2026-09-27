import { useEffect, useRef, useState } from 'react';

// Built-in playlist (files live in web/public/hero/). Each entry is either a plain
// URL string or { mp4, webm }. Admin can override from Settings → "Hero background
// video" with comma-separated direct .mp4/.webm URLs.
export const DEFAULT_HERO_VIDEOS = [
  { mp4: '/hero/hero-1.mp4', webm: '/hero/hero-1.webm' },
  { mp4: '/hero/hero-2.mp4', webm: '/hero/hero-2.webm' },
  { mp4: '/hero/hero-3.mp4', webm: '/hero/hero-3.webm' },
];
export const HERO_POSTER = '/hero/hero-poster.jpg';

const isDirectVideo = (u) => /\.(mp4|webm|ogv)(\?.*)?$/i.test(u || '');

export function parseHeroVideos(raw) {
  if (Array.isArray(raw)) return raw.filter(isDirectVideo);
  if (typeof raw === 'string') return raw.split(',').map((s) => s.trim()).filter(isDirectVideo);
  return [];
}

const keyOf = (item) => (typeof item === 'string' ? item : item.mp4 || item.webm);

// Ordered candidate sources for one clip: mp4 first (widest support), webm fallback.
function sourcesOf(item) {
  if (typeof item === 'string') {
    return [{ src: item, type: /\.webm(\?|$)/i.test(item) ? 'video/webm' : 'video/mp4' }];
  }
  const out = [];
  if (item.mp4) out.push({ src: item.mp4, type: 'video/mp4' });
  if (item.webm) out.push({ src: item.webm, type: 'video/webm' });
  return out;
}

/**
 * Full-bleed looping background for the homepage hero.
 * Two <video> layers: the visible one plays, the hidden one pre-buffers the next
 * clip; on `ended` they swap with a CSS crossfade, so the loop never goes black.
 * Falls back to the poster image when autoplay is blocked, reduced-motion or
 * data-saver is on, or the browser can't play any of the clips.
 */
export default function HeroVideo({ sources = DEFAULT_HERO_VIDEOS, poster = HERO_POSTER }) {
  const list = sources.length ? sources : DEFAULT_HERO_VIDEOS;
  const n = list.length;
  const [cur, setCur] = useState(0);   // index into `list` that is currently visible
  const [top, setTop] = useState(0);   // which layer (0 | 1) is visible
  const [ready, setReady] = useState(false);
  const [enabled, setEnabled] = useState(true);
  const failures = useRef(0);
  const layerA = useRef(null);
  const layerB = useRef(null);
  const layers = [layerA, layerB];

  // Respect reduced-motion / data-saver: show the poster only.
  useEffect(() => {
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
    const saveData = navigator.connection?.saveData;
    if (reduce || saveData) setEnabled(false);
  }, []);

  const tryPlay = (v) => {
    if (!v) return;
    v.muted = true;
    const p = v.play();
    if (p && p.catch) {
      p.catch((e) => {
        // NotAllowedError = autoplay policy (e.g. iOS Low Power Mode) → poster.
        // AbortError = the element switched source / reloaded; onCanPlay retries.
        if (e && e.name === 'NotAllowedError') {
          console.warn('[hero] autoplay blocked, showing poster');
          setEnabled(false);
        }
      });
    }
  };

  // Whenever the visible layer changes, (re)start it.
  useEffect(() => {
    if (!enabled) return;
    const v = layers[top].current;
    if (!v) return;
    try { v.currentTime = 0; } catch { /* not loaded yet — fine */ }
    tryPlay(v);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [top, enabled]);

  const advance = () => {
    if (n < 2) {
      const v = layers[top].current;
      if (v) { v.currentTime = 0; v.play().catch(() => {}); }
      return;
    }
    setCur((c) => (c + 1) % n);
    setTop((t) => 1 - t);
  };

  // Fires when the LAST candidate source of the visible clip fails to load/decode:
  // skip that clip; if every clip fails, drop to the poster.
  const onClipFail = () => {
    failures.current += 1;
    if (failures.current >= n) setEnabled(false);
    else advance();
  };

  if (!enabled) {
    return (
      <div className="hero-video on" aria-hidden="true">
        <img src={poster} alt="" />
      </div>
    );
  }

  const itemFor = (layer) => (layer === top ? list[cur] : list[(cur + 1) % n]);

  return (
    <div className={`hero-video${ready ? ' on' : ''}`} aria-hidden="true">
      {[0, 1].map((layer) => {
        const item = itemFor(layer);
        const isTop = layer === top;
        const cands = sourcesOf(item);
        return (
          // key includes the clip so a layer whose clip changes is remounted and reloads
          <video
            key={`${layer}-${keyOf(item)}`}
            ref={layers[layer]}
            className={isTop ? 'show' : ''}
            poster={isTop ? poster : undefined}
            muted
            playsInline
            preload="auto"
            disablePictureInPicture
            onCanPlay={isTop ? (e) => { if (e.currentTarget.paused) tryPlay(e.currentTarget); } : undefined}
            onPlaying={isTop ? () => { failures.current = 0; setReady(true); } : undefined}
            onEnded={isTop ? advance : undefined}
          >
            {cands.map((c, i) => (
              <source
                key={c.src}
                src={c.src}
                type={c.type}
                onError={isTop && i === cands.length - 1 ? onClipFail : undefined}
              />
            ))}
          </video>
        );
      })}
    </div>
  );
}
