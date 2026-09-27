import { useEffect } from 'react';
import { NavLink, Outlet, Navigate } from 'react-router-dom';
import client from '../api/client';
import { COLLECTIONS } from './collections';
import { isAuthed, logout } from './AdminLogin';

export default function AdminLayout() {
  const authed = isAuthed();
  // Validate the stored token once on entry; a 401 here is handled by the client
  // interceptor (token cleared + redirect to login with an "expired" notice).
  useEffect(() => { if (authed) client.get('/auth/me').catch(() => {}); }, [authed]);
  if (!authed) return <Navigate to="/admin/login" replace />;
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
