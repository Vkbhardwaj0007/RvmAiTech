import { useEffect } from 'react';
import { useSite } from '../api/SiteContext';
export default function GA() {
  const { content } = useSite();
  const id = content?.ga;
  useEffect(() => {
    if (!id || window.__ga_loaded) return;
    window.__ga_loaded = true;
    const s = document.createElement('script');
    s.async = true; s.src = `https://www.googletagmanager.com/gtag/js?id=${id}`;
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    function gtag() { window.dataLayer.push(arguments); }
    window.gtag = gtag; gtag('js', new Date()); gtag('config', id);
  }, [id]);
  return null;
}
