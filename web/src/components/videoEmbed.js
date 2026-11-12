/**
 * Work out how to play a video from what the admin saved.
 *
 *   resolveVideo({ video, videoUrl })
 *     -> { kind: 'file',    src }        uploaded mp4/webm or a direct .mp4 link  → <video>
 *     -> { kind: 'youtube', src, id }    watch / youtu.be / shorts / embed links   → <iframe>
 *     -> { kind: 'vimeo',   src }        vimeo.com/123 links                       → <iframe>
 *     -> { kind: 'link',    src }        anything else (Drive, site…)              → open in new tab
 *     -> null                            nothing set
 *
 * The uploaded file wins over the link, same as projects.
 */
export function resolveVideo({ video, videoUrl } = {}, { autoplay = false } = {}) {
  const file = (video || '').trim();
  if (file) return { kind: 'file', src: file };

  const url = (videoUrl || '').trim();
  if (!url) return null;

  const yt = youtubeId(url);
  if (yt) {
    const q = new URLSearchParams({ rel: '0', modestbranding: '1', playsinline: '1' });
    if (autoplay) { q.set('autoplay', '1'); q.set('mute', '1'); }
    return { kind: 'youtube', id: yt, src: `https://www.youtube-nocookie.com/embed/${yt}?${q}` };
  }

  const vm = url.match(/vimeo\.com\/(?:video\/)?(\d+)/i);
  if (vm) {
    const q = autoplay ? '?autoplay=1&muted=1' : '';
    return { kind: 'vimeo', src: `https://player.vimeo.com/video/${vm[1]}${q}` };
  }

  if (/\.(mp4|webm|ogv|mov|m4v)(\?.*)?$/i.test(url)) return { kind: 'file', src: url };
  return { kind: 'link', src: url };
}

export function youtubeId(url = '') {
  const m = url.match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/i);
  return m ? m[1] : '';
}

export const hasVideo = (c = {}) => !!resolveVideo(c);
