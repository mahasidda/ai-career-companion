// ============================================================
// components/Common/AppLayout.jsx
// ============================================================

import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

const NAV_ITEMS = [
  { path: '/dashboard',   icon: '🏠', label: 'Dashboard' },
  { path: '/resume',      icon: '📄', label: 'Resume Analyzer' },
  { path: '/chatbot',     icon: '🤖', label: 'AI Chatbot' },
  { path: '/interview',   icon: '🎤', label: 'Mock Interview' },
  { path: '/internships', icon: '💼', label: 'Internships' },
  { path: '/skill-gap',   icon: '📈', label: 'Skill Gap' },
  { path: '/profile',     icon: '👤', label: 'Profile' },
];

function initials(name) {
  return (name || 'U').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

export default function AppLayout() {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className="app-layout">
      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 99 }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        {/* Logo */}
        <div className="sidebar-logo">
          <div className="logo-icon">AI</div>
          <div>
            <div className="logo-text">Career Companion</div>
            <div className="logo-sub">AI-Powered Platform</div>
          </div>
        </div>

        {/* Navigation */}
        <div className="nav-section">
          <div className="nav-section-label">Main Menu</div>
          {NAV_ITEMS.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <span className="nav-icon">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
          {user?.role === 'admin' && (
            <NavLink
              to="/admin"
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <span className="nav-icon">👑</span>
              Admin Panel
            </NavLink>
          )}
        </div>

        {/* Bottom user info */}
        <div className="sidebar-bottom">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <div className="avatar avatar-sm" style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
              {initials(user?.full_name)}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user?.full_name}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{user?.role}</div>
            </div>
          </div>
          <button className="btn btn-ghost" style={{ width: '100%', justifyContent: 'center' }} onClick={handleLogout}>
            🚪 Logout
          </button>
        </div>
      </aside>

      {/* Main Area */}
      <div className="main-content">
        {/* Topbar */}
        <header className="topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button className="btn btn-ghost btn-icon" onClick={() => setSidebarOpen(o => !o)}
              style={{ display: 'none' }} id="mobile-menu-btn">
              ☰
            </button>
            <div>
              <div style={{ fontSize: 15, fontWeight: 600 }}>
                Good {getGreeting()}, {user?.full_name?.split(' ')[0]}! 👋
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button className="btn btn-ghost btn-icon" onClick={toggleTheme} title="Toggle dark mode">
              {isDark ? '☀️' : '🌙'}
            </button>
            <div className="avatar avatar-sm" style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', cursor: 'pointer' }}
              onClick={() => navigate('/profile')}>
              {initials(user?.full_name)}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="page-content">
          <Outlet />
        </main>
      </div>

      <style>{`
        @media (max-width: 768px) {
          #mobile-menu-btn { display: flex !important; }
        }
      `}</style>
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}
