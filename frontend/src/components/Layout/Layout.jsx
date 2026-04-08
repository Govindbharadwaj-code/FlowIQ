import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { useAuth } from '../../context/AuthContext';
import { connectSocket, disconnectSocket } from '../../services/socket';
import api from '../../services/api';

export default function Layout({ children }) {
  const { token } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (token) {
      const sock = connectSocket(token);
      sock.on('notification', () => setUnreadCount((c) => c + 1));

      api.get('/notifications?unread_only=true&limit=1').then((res) => {
        setUnreadCount(res.data.unreadCount || 0);
      }).catch(() => {});

      return () => {
        sock.off('notification');
        disconnectSocket();
      };
    }
  }, [token]);

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <div style={{ marginLeft: 'var(--sidebar-width)', flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <Navbar unreadCount={unreadCount} />
        <main style={{ flex: 1, padding: '24px', overflow: 'auto' }}>
          {children}
        </main>
      </div>
    </div>
  );
}
