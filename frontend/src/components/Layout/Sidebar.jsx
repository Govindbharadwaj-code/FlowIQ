import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, CheckSquare, BarChart2, Bell, Shield, LogOut, Zap, Menu, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const navItems = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/tasks', icon: CheckSquare, label: 'Tasks' },
  { path: '/analytics', icon: BarChart2, label: 'Analytics' },
  { path: '/notifications', icon: Bell, label: 'Notifications' },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      <button
        onClick={() => setCollapsed(!collapsed)}
        style={{ position: 'fixed', top: '16px', left: collapsed ? '16px' : '208px', zIndex: 200, padding: '8px', borderRadius: '8px', background: '#1a1d23', color: 'white', transition: 'left 0.3s ease' }}
        className="mobile-toggle"
      >
        {collapsed ? <Menu size={20} /> : <X size={20} />}
      </button>
      <aside style={{
        width: collapsed ? '0' : 'var(--sidebar-width)',
        background: 'var(--color-sidebar)',
        height: '100vh',
        position: 'fixed',
        top: 0, left: 0,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        transition: 'width 0.3s ease',
        zIndex: 100,
        minWidth: collapsed ? '0' : 'var(--sidebar-width)',
      }}>
        <div style={{ padding: '24px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: '10px', whiteSpace: 'nowrap' }}>
          <div style={{ background: 'var(--color-primary)', borderRadius: '8px', padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Zap size={18} color="white" />
          </div>
          <span style={{ color: 'white', fontSize: '20px', fontWeight: '700', letterSpacing: '-0.02em' }}>FlowIQ</span>
        </div>

        <nav style={{ flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {navItems.map(({ path, icon: Icon, label }) => (
            <NavLink
              key={path}
              to={path}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 12px',
                borderRadius: '8px',
                color: isActive ? 'white' : 'var(--color-sidebar-text)',
                background: isActive ? 'rgba(59,130,246,0.15)' : 'transparent',
                borderLeft: isActive ? '3px solid var(--color-primary)' : '3px solid transparent',
                fontSize: '14px',
                fontWeight: isActive ? '600' : '400',
                transition: 'all 0.15s ease',
                whiteSpace: 'nowrap',
              })}
              onMouseEnter={(e) => { if (!e.currentTarget.classList.contains('active')) e.currentTarget.style.background = 'var(--color-sidebar-hover)'; }}
              onMouseLeave={(e) => { if (!e.currentTarget.style.borderLeft.includes('solid var(--color-primary)')) e.currentTarget.style.background = 'transparent'; }}
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
          {user?.role === 'admin' && (
            <NavLink to="/admin" style={({ isActive }) => ({ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', borderRadius: '8px', color: isActive ? 'white' : 'var(--color-sidebar-text)', background: isActive ? 'rgba(59,130,246,0.15)' : 'transparent', fontSize: '14px', whiteSpace: 'nowrap' })}>
              <Shield size={18} />
              Admin
            </NavLink>
          )}
        </nav>

        <div style={{ padding: '16px 12px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', marginBottom: '4px', whiteSpace: 'nowrap' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '14px', fontWeight: '600', flexShrink: 0 }}>
              {user?.full_name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div>
              <div style={{ color: 'white', fontSize: '13px', fontWeight: '500' }}>{user?.full_name}</div>
              <div style={{ color: 'var(--color-sidebar-text)', fontSize: '11px', textTransform: 'capitalize' }}>{user?.role}</div>
            </div>
          </div>
          <button onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', width: '100%', borderRadius: '8px', color: 'var(--color-sidebar-text)', fontSize: '14px', transition: 'all 0.15s', whiteSpace: 'nowrap' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239,68,68,0.15)'; e.currentTarget.style.color = '#f87171'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--color-sidebar-text)'; }}>
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}
