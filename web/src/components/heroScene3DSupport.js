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

  if (window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches) return false;
  if (navigator.connection?.saveData) return false;

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
