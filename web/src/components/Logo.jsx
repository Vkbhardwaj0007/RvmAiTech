import { useSite } from '../api/SiteContext';

/**
 * Brand mark.
 *
 * Order of preference:
 *   1. a logo uploaded in Admin → Settings (content.logo) — always wins
 *   2. the bundled RvmAiTech mark in web/public/brand/
 *
 * Two bundled files, not one. The supplied artwork is blue and red, which
 * measures 3.5:1 and 3.2:1 against the navy header — under the 4.5:1 needed to
 * read comfortably. So the header and footer, which sit on navy, use a
 * reversed version (near-white wordmark, lifted coral accent: 14:1 and 5.4:1),
 * and the original is kept for light backgrounds.
 *
 * `dark` means "this logo is sitting on a LIGHT background" — the same meaning
 * the previous version of this component gave the prop.
 */
const MARK_ON_LIGHT = '/brand/rvmaitech-logo.png';
const MARK_ON_DARK = '/brand/rvmaitech-logo-light.png';

// Intrinsic size of both files. Declared so the browser reserves the right box
// before the image loads and the header does not jump.
const MARK_W = 563;
const MARK_H = 150;

export default function Logo({ dark = false }) {
  const { content } = useSite();
  const uploaded = content?.logo;

  if (uploaded) {
    return (
      <a href="/" className="logo" aria-label="RvmAiTech — home">
        <img src={uploaded} alt="RvmAiTech" className="logo-img" />
      </a>
    );
  }

  return (
    <a href="/" className="logo" aria-label="RvmAiTech — home">
      <img
        src={dark ? MARK_ON_LIGHT : MARK_ON_DARK}
        alt="RvmAiTech — Robotics, Vision, Intelligence"
        className="logo-img"
        width={MARK_W}
        height={MARK_H}
        // The mark is above the fold in the header, so it should not be
        // deferred behind anything else.
        fetchPriority="high"
        decoding="async"
      />
    </a>
  );
}
