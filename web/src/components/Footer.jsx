import { Link } from 'react-router-dom';
import Logo from './Logo';
import { useSite } from '../api/SiteContext';

const ICONS = {
  linkedin: 'M4.98 3.5A2.5 2.5 0 1 0 5 8.5a2.5 2.5 0 0 0-.02-5ZM3 9h4v12H3V9Zm6 0h3.8v1.7h.05c.53-1 1.83-2.05 3.77-2.05C20.4 8.65 22 10.6 22 14.1V21h-4v-6.2c0-1.48-.03-3.38-2.06-3.38-2.06 0-2.38 1.6-2.38 3.27V21H9V9Z',
  instagram: 'M12 2.2c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41a3.7 3.7 0 0 1-1.38-.9 3.7 3.7 0 0 1-.9-1.38c-.16-.42-.36-1.06-.41-2.23C2.21 15.58 2.2 15.2 2.2 12s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41C8.42 2.21 8.8 2.2 12 2.2Zm0 4.9A4.9 4.9 0 1 0 16.9 12 4.9 4.9 0 0 0 12 7.1Zm0 8.08A3.18 3.18 0 1 1 15.18 12 3.18 3.18 0 0 1 12 15.18Zm5.09-8.29a1.15 1.15 0 1 0 1.15 1.15 1.15 1.15 0 0 0-1.15-1.15Z',
  facebook: 'M13.5 21v-8h2.7l.4-3.1h-3.1V7.9c0-.9.25-1.5 1.55-1.5H17V3.6c-.3-.04-1.3-.13-2.46-.13-2.43 0-4.1 1.48-4.1 4.2v2.34H7.7V13h2.74v8h3.06Z',
  youtube: 'M23 12s0-3.2-.4-4.7a2.5 2.5 0 0 0-1.76-1.77C19.28 5.1 12 5.1 12 5.1s-7.28 0-8.84.43A2.5 2.5 0 0 0 1.4 7.3C1 8.8 1 12 1 12s0 3.2.4 4.7a2.5 2.5 0 0 0 1.76 1.77c1.56.43 8.84.43 8.84.43s7.28 0 8.84-.43A2.5 2.5 0 0 0 22.6 16.7C23 15.2 23 12 23 12Zm-13 3.5v-7l6 3.5-6 3.5Z',
  twitter: 'M22 5.9c-.7.3-1.5.5-2.3.6a4 4 0 0 0 1.8-2.2c-.8.5-1.7.8-2.6 1a4 4 0 0 0-6.9 3.6A11.4 11.4 0 0 1 3.8 4.7a4 4 0 0 0 1.2 5.4c-.6 0-1.2-.2-1.8-.5a4 4 0 0 0 3.2 4c-.5.2-1.1.2-1.7.1a4 4 0 0 0 3.7 2.8A8 8 0 0 1 2 18.6a11.3 11.3 0 0 0 6.1 1.8c7.4 0 11.4-6.1 11.4-11.4v-.5c.8-.6 1.5-1.3 2-2.1Z',
  whatsapp: 'M12 2a10 10 0 0 0-8.5 15.3L2 22l4.8-1.5A10 10 0 1 0 12 2Zm5.3 14.2c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .2-3.2-.7-2.7-1.1-4.4-3.8-4.5-4-.1-.2-1-1.4-1-2.6 0-1.2.6-1.8.9-2 .2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 1.9c.1.2.1.4 0 .5l-.4.5c-.2.2-.3.4-.1.7.2.3.9 1.4 1.9 2.3 1.3 1.1 2.3 1.4 2.6 1.6.2.1.4.1.5-.1l.7-.8c.2-.2.3-.2.6-.1l1.8.9c.3.1.5.2.5.4.1.2.1.8-.1 1.2Z',
};

export default function Footer() {
  const { content } = useSite();
  const social = content?.social || {};
  const contact = content?.contact || {};
  const links = Object.entries(social).filter(([, v]) => v);
  return (
    <footer className="site-footer">
      <div className="wrap foot-top">
        <div>
          <Logo />
          <p>Robotics, Vision &amp; Machine Intelligence. We build intelligent automation for process, home and industry.</p>
          {links.length > 0 && (
            <div className="foot-social">
              {links.map(([k, url]) => ICONS[k] && (
                <a key={k} href={url} target="_blank" rel="noreferrer" title={k}><svg viewBox="0 0 24 24" width="18" fill="currentColor"><path d={ICONS[k]} /></svg></a>
              ))}
            </div>
          )}
        </div>
        <div className="foot-col">
          <h4>Company</h4>
          <Link to="/about">About Us</Link><Link to="/services">Services</Link><Link to="/technologies">Technologies</Link><Link to="/projects">Projects</Link>
        </div>
        <div className="foot-col">
          <h4>Products</h4>
          <Link to="/products">All Products</Link><Link to="/products?category=MDMS">MDMS</Link><Link to="/products?category=Datalogger">Datalogger</Link><Link to="/products?category=Home%20Automation">Home Automation</Link><Link to="/contact">Request a quote</Link>
        </div>
        <div className="foot-col">
          <h4>Get in touch</h4>
          {contact.email && <a href={`mailto:${contact.email}`}>{contact.email}</a>}
          {contact.phone && <a href={`tel:${contact.phone}`}>{contact.phone}</a>}
          {contact.address && <span style={{ display: 'block', color: '#9fb2ce', fontSize: 14, padding: '5px 0' }}>{contact.address}</span>}
        </div>
      </div>
      <div className="wrap foot-bottom">
        <span>© {new Date().getFullYear()} RvmAiTech. All rights reserved.</span>
        <span className="tag">Your Partner in Intelligent Automation</span>
      </div>
    </footer>
  );
}
