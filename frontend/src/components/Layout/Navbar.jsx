import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Bell, LogOut, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const pageTitles = {
  '/dashboard': 'Dashboard',
  '/tasks': 'Tasks',
  '/analytics': 'Analytics',
  '/notifications': 'Notifications',
  '/admin': 'Admin',
};

export default function Navbar({ unreadCount = 0 }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const title = Object.entries(pageTitles).find(([path]) => location.pathname.startsWith(path))?.[1] || 'FlowIQ';

  return (
    <header style={{
      height: 'var(--navbar-height)',
      background: 'var(--color-surface)',
      borderBottom: '1px solid var(--color-border)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 24px',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      boxShadow: 'var(--shadow-sm)',
    }}>
      <h1 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--color-text-primary)' }}>{title}</h1>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button
          onClick={() => navigate('/notifications')}
          style={{ position: 'relative', padding: '8px', borderRadius: '8px', color: 'var(--color-text-secondary)', transition: 'all 0.15s' }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-bg)'; e.currentTarget.style.color = 'var(--color-text-primary)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--color-text-secondary)'; }}
        >
          <Bell size={20} />
          {unreadCount > 0 && (
            <span style={{ position: 'absolute', top: '4px', right: '4px', width: '18px', height: '18px', background: 'var(--color-error)', color: 'white', borderRadius: '50%', fontSize: '10px', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px', borderRadius: '8px', background: 'var(--color-bg)' }}>
          <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '12px', fontWeight: '600' }}>
            {user?.full_name?.[0]?.toUpperCase() || <User size={14} />}
          </div>
          <span style={{ fontSize: '14px', fontWeight: '500', color: 'var(--color-text-primary)' }}>{user?.full_name}</span>
        </div>
      </div>
    </header>
  );
}
