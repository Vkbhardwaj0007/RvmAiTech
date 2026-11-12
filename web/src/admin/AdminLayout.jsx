import { useEffect, useState } from 'react';
import { NavLink, Outlet, Navigate } from 'react-router-dom';
import client from '../api/client';
import { COLLECTIONS } from './collections';
import { isAuthed, logout, restoreSession } from './AdminLogin';

export default function AdminLayout() {
  /**
   * 'checking' | 'in' | 'out'
   *
   * Access tokens last 15 minutes now, so an admin returning to an open tab
   * very often has an expired one and a still-valid refresh cookie. Rendering
   * a redirect straight away (as this component used to) would sign them out
   * every quarter of an hour. So: if there is no live token, ask the server to
   * exchange the cookie first, and only redirect if that fails.
   */
  const [state, setState] = useState(() => (isAuthed() ? 'in' : 'checking'));

  useEffect(() => {
    let cancelled = false;

    if (state === 'in') {
      // Validate the token we hold. A 401 here is handled by the client
      // interceptor, which refreshes once and only then redirects.
      client.get('/auth/me').catch(() => {});
      return () => { cancelled = true; };
    }

    if (state === 'checking') {
      restoreSession().then((ok) => {
        if (!cancelled) setState(ok ? 'in' : 'out');
      });
    }

    return () => { cancelled = true; };
  }, [state]);

  if (state === 'checking') {
    return (
      <div className="adm" style={{ display: 'grid', placeItems: 'center', minHeight: '60vh' }}>
        <p style={{ opacity: 0.7 }}>Checking your session…</p>
      </div>
    );
  }

  if (state === 'out') return <Navigate to="/admin/login" replace />;

  return (
    <div className="adm">
      <aside className="adm-side">
        <div className="adm-logo"><span className="adm-badge sm">R</span> RvmAiTech</div>
        <nav>
          <div className="adm-nav-label">CONTENT</div>
          {Object.entries(COLLECTIONS).map(([key, c]) => (
            <NavLink key={key} to={`/admin/${key}`} className={({ isActive }) => `adm-link ${isActive ? 'active' : ''}`}>{c.label}</NavLink>
          ))}
          <div className="adm-nav-label">PAGES</div>
          <NavLink to="/admin/pages" className={({ isActive }) => `adm-link ${isActive ? 'active' : ''}`}>Pages (hero + intro)</NavLink>
          <NavLink to="/admin/about" className={({ isActive }) => `adm-link ${isActive ? 'active' : ''}`}>About page</NavLink>
          <NavLink to="/admin/settings" className={({ isActive }) => `adm-link ${isActive ? 'active' : ''}`}>Settings</NavLink>
          <div className="adm-nav-label">INBOX</div>
          <NavLink to="/admin/messages" className={({ isActive }) => `adm-link ${isActive ? 'active' : ''}`}>Messages</NavLink>
          <NavLink to="/admin/applications" className={({ isActive }) => `adm-link ${isActive ? 'active' : ''}`}>Job applications</NavLink>
          <div className="adm-nav-label">ACCOUNT</div>
          <NavLink to="/admin/admins" className={({ isActive }) => `adm-link ${isActive ? 'active' : ''}`}>Admins</NavLink>
        </nav>
        <button className="adm-logout" onClick={logout}>Sign out</button>
      </aside>
      <main className="adm-main"><Outlet /></main>
    </div>
  );
}
