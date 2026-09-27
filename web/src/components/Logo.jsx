import { useSite } from '../api/SiteContext';
export default function Logo({ dark = false }) {
  const { content } = useSite();
  const logo = content?.logo;
  if (logo) return <a href="/" className="logo"><img src={logo} alt="RvmAiTech" className="logo-img" /></a>;
  const base = dark ? { color: '#123a72' } : {};
  return (
    <a href="/" className="logo">
      <svg viewBox="0 0 48 48" width="40" height="40" fill="none" aria-hidden="true">
        <path d="M6 8h9l10 14-10 14H6l10-14L6 8Z" fill="#f47b20" />
        <path d="M18 8h11c6 0 10 4 10 9s-4 9-10 9h-4l7 10h-9l-9-13h6c2.4 0 4-1.4 4-3.4S30.4 16 28 16h-4v-8h-6Z" fill={dark ? '#123a72' : '#fff'} />
        <circle cx="24" cy="24" r="6" stroke="#f47b20" strokeWidth="2.4" />
        <circle cx="24" cy="24" r="2.2" fill="#f47b20" />
      </svg>
      <div>
        <div className="logo-word"><span className="b" style={base}>Rvm</span><span className="o">Ai</span><span className="b" style={base}>Tech</span></div>
        <div className="logo-tag">Robotics · Vision · Intelligence</div>
      </div>
    </a>
  );
}
