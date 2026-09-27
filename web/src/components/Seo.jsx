import { useEffect } from 'react';
export default function Seo({ title, description }) {
  useEffect(() => {
    document.title = title ? `${title} · RvmAiTech` : 'RvmAiTech — Robotics, Vision & Machine Intelligence';
    if (description) {
      let m = document.querySelector('meta[name="description"]');
      if (!m) { m = document.createElement('meta'); m.name = 'description'; document.head.appendChild(m); }
      m.content = description;
    }
  }, [title, description]);
  return null;
}
