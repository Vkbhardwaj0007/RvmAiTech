/**
 * Decides whether the WebGL hero scene is worth loading AT ALL.
 *
 * This lives in its own tiny module, free of any three.js import, so it can be
 * consulted before the lazy chunk is requested. Checking inside the scene
 * component would be too late: React's `lazy()` fetches as soon as the
 * component renders, so a phone would download ~132 KB of three.js only to
 * decide not to use it.
 *
 * Kept deliberately conservative — this is decoration. When in doubt, skip it.
 */
export function canRun3D() {
  if (typeof window === 'undefined') return false;

  // Someone who asked the OS for less motion gets less motion.
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches) return false;

  // Desktop flourish only. On touch devices there is no pointer to react to,
  // and a continuously rendering canvas is the most expensive thing on the
  // page for the device least able to afford it.
  if (!window.matchMedia?.('(hover: hover) and (pointer: fine)')?.matches) return false;

  // Explicit user signal that bytes are precious.
  if (navigator.connection?.saveData) return false;

  // A slow connection: the chunk would arrive long after it was wanted.
  const type = navigator.connection?.effectiveType;
  if (type && /(^|-)2g$/.test(type)) return false;

  // Few cores usually means a machine that will struggle with a continuous
  // render loop alongside a playing background video.
  const cores = navigator.hardwareConcurrency;
  if (typeof cores === 'number' && cores > 0 && cores <= 4) return false;

  // Finally, is WebGL actually there? Created and discarded immediately.
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    if (!gl) return false;
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return true;
  } catch {
    return false;
  }
}
