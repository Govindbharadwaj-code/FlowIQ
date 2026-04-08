import React, { useState, useEffect } from 'react';
import { Bell, CheckCheck } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import api from '../services/api';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = () => {
    api.get('/notifications').then((res) => {
      setNotifications(res.data.notifications);
      setUnreadCount(res.data.unreadCount);
    }).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => { fetchNotifications(); }, []);

  const handleMarkRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, is_read: true } : n));
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.put('/notifications/mark-all-read');
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="loading-container"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">Notifications</h2>
          {unreadCount > 0 && <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>{unreadCount} unread</p>}
        </div>
        {unreadCount > 0 && (
          <button className="btn btn-secondary" onClick={handleMarkAllRead}>
            <CheckCheck size={16} /> Mark all read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="empty-state">
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔔</div>
          <p className="empty-state-text">No notifications yet</p>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {notifications.map((notif, idx) => (
            <div
              key={notif.id}
              style={{
                display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '16px 20px',
                borderBottom: idx < notifications.length - 1 ? '1px solid var(--color-border)' : 'none',
                background: notif.is_read ? 'transparent' : 'rgba(59,130,246,0.04)',
                transition: 'background 0.15s',
              }}
            >
              <div style={{ padding: '8px', background: `${notif.is_read ? 'var(--color-bg)' : 'rgba(59,130,246,0.1)'}`, borderRadius: '8px', flexShrink: 0 }}>
                <Bell size={16} color={notif.is_read ? 'var(--color-text-secondary)' : 'var(--color-primary)'} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                  <p style={{ fontSize: '14px', fontWeight: notif.is_read ? '400' : '600' }}>{notif.title}</p>
                  <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>
                    {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
                  </span>
                </div>
                <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>{notif.message}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                  <span className={`badge badge-${notif.type}`}>{notif.type}</span>
                  {!notif.is_read && (
                    <button onClick={() => handleMarkRead(notif.id)} style={{ fontSize: '12px', color: 'var(--color-primary)', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer' }}>
                      Mark as read
                    </button>
                  )}
                </div>
              </div>
              {!notif.is_read && (
                <div style={{ width: '8px', height: '8px', background: 'var(--color-primary)', borderRadius: '50%', flexShrink: 0, marginTop: '4px' }} />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
