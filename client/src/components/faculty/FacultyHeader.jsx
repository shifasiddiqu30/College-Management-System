import React, { useState } from 'react';
import {
  Menu,
  Bell,
  Search,
  CheckCircle,
  Clock,
  MessageSquare,
  Users,
  Award,
  Calendar,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import ThemeToggle from '../common/ThemeToggle';

export default function FacultyHeader({ title, subtitle, toggleMobileSidebar, unreadCount = 0, notifications = [], setActiveTab }) {
  const { user } = useAuth();
  const [isNotifDropdownOpen, setIsNotifDropdownOpen] = useState(false);

  return (
    <header
      style={{
        height: '76px',
        background: 'var(--bg-header)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 2rem',
        position: 'sticky',
        top: 0,
        zIndex: 50
      }}
    >
      {/* Left: Mobile Toggle & Dynamic Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button
          onClick={toggleMobileSidebar}
          style={{
            display: 'none',
            background: 'var(--bg-input)',
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-primary)',
            padding: '0.5rem',
            borderRadius: '8px',
            cursor: 'pointer'
          }}
          className="mobile-menu-btn"
        >
          <Menu size={20} />
        </button>

        <div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-heading)', lineHeight: 1.2 }}>
            {title}
          </h1>
          {subtitle && (
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Right Actions: Theme, Notifications & Profile */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {/* Theme Toggle Button */}
        <ThemeToggle />

        {/* Notification Bell */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setIsNotifDropdownOpen(!isNotifDropdownOpen)}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: isNotifDropdownOpen ? 'rgba(99, 102, 241, 0.2)' : 'var(--bg-header-btn)',
              border: `1px solid ${isNotifDropdownOpen ? 'var(--primary)' : 'var(--border-subtle)'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              position: 'relative',
              transition: 'all 0.2s ease'
            }}
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

          {/* Notifications Dropdown Preview */}
          {isNotifDropdownOpen && (
            <div
              style={{
                position: 'absolute',
                top: '50px',
                right: 0,
                width: '340px',
                backgroundColor: 'var(--bg-modal)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '14px',
                boxShadow: 'var(--shadow-lg)',
                zIndex: 200,
                overflow: 'hidden',
                animation: 'slideUp 0.2s ease-out'
              }}
            >
              <div
                style={{
                  padding: '0.85rem 1rem',
                  borderBottom: '1px solid var(--border-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: 'var(--table-th-bg)'
                }}
              >
                <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-heading)' }}>
                  Notifications ({unreadCount} unread)
                </div>
                <button
                  onClick={() => {
                    setIsNotifDropdownOpen(false);
                    if (setActiveTab) setActiveTab('notifications');
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--primary-light)',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  View All
                </button>
              </div>

              <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
                {notifications.length === 0 ? (
                  <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    No recent notifications
                  </div>
                ) : (
                  notifications.slice(0, 4).map((n) => (
                    <div
                      key={n.id}
                      onClick={() => {
                        setIsNotifDropdownOpen(false);
                        if (setActiveTab) setActiveTab('notifications');
                      }}
                      style={{
                        padding: '0.75rem 1rem',
                        borderBottom: '1px solid var(--border-subtle)',
                        cursor: 'pointer',
                        transition: 'background 0.15s ease',
                        background: n.isRead ? 'transparent' : 'rgba(99, 102, 241, 0.08)'
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--table-row-hover)')}
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background = n.isRead ? 'transparent' : 'rgba(99, 102, 241, 0.08)')
                      }
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem' }}>
                        <div
                          style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            backgroundColor: n.isRead ? 'transparent' : '#f43f5e',
                            marginTop: '6px',
                            flexShrink: 0
                          }}
                        />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, fontSize: '0.82rem', color: 'var(--text-heading)' }}>{n.title}</div>
                          <div
                            style={{
                              fontSize: '0.75rem',
                              color: 'var(--text-secondary)',
                              marginTop: '2px',
                              lineHeight: 1.3
                            }}
                          >
                            {n.message}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div
                style={{
                  padding: '0.6rem 1rem',
                  textAlign: 'center',
                  background: 'var(--bg-modal-footer)',
                  borderTop: '1px solid var(--border-subtle)'
                }}
              >
                <button
                  onClick={() => {
                    setIsNotifDropdownOpen(false);
                    if (setActiveTab) setActiveTab('notifications');
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-secondary)',
                    fontSize: '0.78rem',
                    cursor: 'pointer'
                  }}
                >
                  Open Notification Center →
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Profile Pill */}
        <div
          onClick={() => setActiveTab && setActiveTab('profile')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.4rem 0.85rem',
            borderRadius: '12px',
            background: 'var(--bg-header-btn)',
            border: '1px solid var(--border-subtle)',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--primary-glow)')}
          onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border-subtle)')}
        >
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #6366f1, #a855f7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '0.85rem',
              color: '#fff'
            }}
          >
            {user?.name ? user.name.charAt(0).toUpperCase() : 'F'}
          </div>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-heading)', lineHeight: 1.1 }}>
              {user?.name || 'Faculty Member'}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--primary-light)', fontWeight: 500 }}>
              Faculty Portal
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
