import React, { useState, useEffect } from 'react';
import { Search, Bell, Menu, ShieldCheck, CheckCircle2, RefreshCw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import ThemeToggle from '../common/ThemeToggle';

export default function AdminHeader({ title = 'Dashboard Overview', subtitle = 'College Operations & Administration', toggleMobileSidebar }) {
  const { user, authFetch } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingNotifs, setLoadingNotifs] = useState(false);
  const navigate = useNavigate();

  const fetchNotifications = async () => {
    try {
      setLoadingNotifs(true);
      const res = await authFetch('/api/admin/notifications');
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setNotifications(data.notifications || []);
          setUnreadCount(data.unreadCount || 0);
        }
      }
    } catch (err) {
      console.error('Failed to load admin notifications:', err);
    } finally {
      setLoadingNotifs(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await authFetch('/api/admin/notifications/mark-all-read', { method: 'PUT' });
      setNotifications(prev => prev.map(n => ({ ...n, isRead: 1 })));
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkSingleRead = async (id) => {
    try {
      await authFetch(`/api/admin/notifications/${id}/read`, { method: 'PUT' });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: 1 } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error(err);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/admin/students?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  return (
    <header className="admin-header">
      <div className="header-left">
        <button
          className="btn-icon"
          onClick={toggleMobileSidebar}
          style={{ display: 'none' }}
          id="mobile-menu-btn"
          aria-label="Toggle navigation"
        >
          <Menu size={20} />
        </button>
        <div className="header-title">
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </div>
      </div>

      <div className="header-right">
        {/* Global Search */}
        <form onSubmit={handleSearchSubmit} className="header-search">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search students, faculty, rooms..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </form>

        {/* Theme Toggle Button */}
        <ThemeToggle />

        {/* Notifications Popover */}
        <div style={{ position: 'relative' }}>
          <button
            className="header-btn"
            onClick={() => {
              setShowNotifications(!showNotifications);
              if (!showNotifications) fetchNotifications();
            }}
            title="System Notifications"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '-4px',
                  backgroundColor: '#f43f5e',
                  color: '#fff',
                  fontSize: '0.65rem',
                  fontWeight: 800,
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 0 10px rgba(244, 63, 94, 0.6)'
                }}
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div
              style={{
                position: 'absolute',
                top: '50px',
                right: 0,
                width: '350px',
                background: 'var(--bg-modal)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                boxShadow: 'var(--shadow-lg)',
                padding: '1rem',
                zIndex: 60,
                animation: 'slideUp 0.2s ease-out'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-subtle)' }}>
                <span style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-heading)' }}>
                  Admin Notifications {unreadCount > 0 && `(${unreadCount})`}
                </span>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  {unreadCount > 0 && (
                    <span
                      style={{ fontSize: '0.72rem', color: 'var(--primary-light)', cursor: 'pointer' }}
                      onClick={handleMarkAllRead}
                    >
                      Mark all read
                    </span>
                  )}
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', cursor: 'pointer' }} onClick={() => setShowNotifications(false)}>✕</span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', maxHeight: '300px', overflowY: 'auto' }}>
                {notifications.length === 0 ? (
                  <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                    No notifications yet.
                  </div>
                ) : (
                  notifications.slice(0, 5).map(n => (
                    <div
                      key={n.id}
                      onClick={() => {
                        if (!n.isRead) handleMarkSingleRead(n.id);
                        if (n.link) navigate(n.link);
                        setShowNotifications(false);
                      }}
                      style={{
                        padding: '0.6rem 0.75rem',
                        borderRadius: 'var(--radius-sm)',
                        background: !n.isRead ? 'rgba(99, 102, 241, 0.12)' : 'var(--table-row-hover)',
                        border: '1px solid var(--border-subtle)',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-heading)' }}>{n.title}</span>
                        <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                          {n.createdAt ? new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                      </div>
                      <p style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', marginTop: '0.25rem', lineHeight: 1.35 }}>
                        {n.message}
                      </p>
                    </div>
                  ))
                )}
              </div>

              <div style={{ marginTop: '0.75rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border-subtle)', textAlign: 'center' }}>
                <button
                  className="btn-text"
                  style={{ fontSize: '0.78rem', color: 'var(--primary-light)', padding: '0.2rem', background: 'none', border: 'none', cursor: 'pointer' }}
                  onClick={() => {
                    setShowNotifications(false);
                    navigate('/admin/notifications');
                  }}
                >
                  View Notification Center →
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Admin Profile Pill */}
        <div
          onClick={() => navigate('/admin/profile')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
            padding: '0.4rem 0.75rem',
            borderRadius: 'var(--radius-full)',
            background: 'var(--bg-header-btn)',
            border: '1px solid var(--border-subtle)',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--primary), var(--accent-cyan))',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.75rem',
              fontWeight: 700
            }}
          >
            <ShieldCheck size={16} />
          </div>
          <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-heading)' }}>{user?.name || 'Administrator'}</span>
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          #mobile-menu-btn { display: inline-flex !important; }
          .header-search { display: none; }
        }
      `}</style>
    </header>
  );
}

