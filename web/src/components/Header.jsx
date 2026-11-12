import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import client from '../api/client';
import Logo from './Logo';
import { useLang } from '../api/Lang';

// fallback menu if API not reachable
const FALLBACK = [
  { label: 'Home', path: '/' },
  { label: 'About Us', path: '/about', children: [
    { label: 'About Us', path: '/about' },
    { label: 'Our Leadership', path: '/leadership' },
    { label: 'In News', path: '/news' },
    { label: 'Careers', path: '/careers' },
  ]},
  { label: 'Services', path: '/services' },
  { label: 'Technologies', path: '/technologies' },
  { label: 'Products', path: '/products', children: [
    { label: 'All Products', path: '/products' },
    { label: 'MDMS', path: '/products?category=MDMS' },
    { label: 'Datalogger', path: '/products?category=Datalogger' },
    { label: 'Smart Parking', path: '/products?category=Smart%20Parking' },
    { label: 'Smart Home Automation', path: '/products?category=Smart%20Home%20Automation' },
  ]},
  { label: 'Projects', path: '/projects' },
  { label: 'Hardware & Software Development', path: '/software-development', children: [
    { label: 'Overview & Capabilities', path: '/software-development' },
    { label: 'What We Develop (8 Categories)', path: '/software-development#categories' },
    { label: 'Technical Capabilities Stack', path: '/software-development#stack' },
    { label: 'Our Development Process', path: '/software-development#process' },
    { label: 'Industries & Applications', path: '/software-development#industries' },
    { label: 'Featured Real Projects', path: '/software-development#projects' },
    { label: 'Technical FAQ', path: '/software-development#faq' },
    { label: 'Project Inquiry & Quote', path: '/software-development#inquiry' },
  ]},
  { label: 'More', path: '#', children: [
    { label: 'Blogs', path: '/blog' },
    { label: 'Contact', path: '/contact' },
  ]},
];

export default function Header() {
  const { navLabel, t, lang, setLang } = useLang();
  const [menu, setMenu] = useState(FALLBACK);
  const [open, setOpen] = useState(false);       // mobile drawer
  const { pathname } = useLocation();

  useEffect(() => {
    client.get('/menu').then((r) => setMenu(r.data.menu || FALLBACK)).catch(() => {});
  }, []);
  useEffect(() => { setOpen(false); }, [pathname]);

  return (
    <header className="site-header">
      <div className="wrap header-inner">
        <Logo />
        <nav className={`main-nav ${open ? 'open' : ''}`}>
          {menu.map((it) => (
            <div key={it.label} className={`nav-item ${it.children ? 'has-drop' : ''}`}>
              <Link to={it.path} className="nav-link">
                {navLabel(it.label)}{it.children && <span className="caret">▾</span>}
              </Link>
              {it.children && (
                <div className="dropdown">
                  {it.children.map((c) => <Link key={c.label} to={c.path} className="drop-link">{navLabel(c.label)}</Link>)}
                </div>
              )}
            </div>
          ))}
          <button className="lang-toggle" onClick={() => setLang(lang === 'en' ? 'hi' : 'en')} title="Language">
            {lang === 'en' ? 'हिंदी' : 'ENG'}
          </button>
          <Link to="/contact" className="nav-cta">{t('get_quote')}</Link>
        </nav>
        <button className="nav-toggle" onClick={() => setOpen((o) => !o)} aria-label="Menu">☰</button>
      </div>
    </header>
  );
}
