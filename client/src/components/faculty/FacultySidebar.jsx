import React from 'react';
import {
  LayoutDashboard,
  Calendar,
  Sparkles,
  Users,
  MessageSquare,
  Award,
  DoorOpen,
  CheckSquare,
  Bell,
  User,
  LogOut,
  X,
  Shield,
  Layers,
  GraduationCap
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function FacultySidebar({ activeTab, setActiveTab, isMobileOpen, closeMobileSidebar, unreadNotifsCount = 0, pendingDoubtsCount = 0 }) {
  const { user, logout } = useAuth();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'timetable', label: 'Smart Timetable', icon: Calendar },
    { id: 'clubs-events', label: 'Clubs & Events', icon: Users },
    { id: 'lost-found', label: 'Campus Lost & Found', icon: Award },
    { id: 'doubts', label: 'Smart Doubt Discussion', icon: MessageSquare, badge: pendingDoubtsCount > 0 ? `${pendingDoubtsCount} Help` : null, badgeColor: 'bg-amber-500' },
    { id: 'academic-performance', label: 'Academic Performance', icon: GraduationCap },
    { id: 'classroom-availability', label: 'Classroom Availability', icon: DoorOpen },
    { id: 'personal-schedule', label: 'Personal Schedule', icon: CheckSquare, badge: 'Private', badgeColor: 'bg-purple-600' },
    { id: 'notifications', label: 'Notifications', icon: Bell, badge: unreadNotifsCount > 0 ? unreadNotifsCount : null, badgeColor: 'bg-rose-500' },
    { id: 'profile', label: 'Profile', icon: User }
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          onClick={closeMobileSidebar}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(4px)',
            zIndex: 90
          }}
        />
      )}

      <aside
        style={{
          width: '280px',
          background: 'linear-gradient(180deg, #0d1322 0%, #080c16 100%)',
          borderRight: '1px solid var(--border-subtle)',
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
          position: 'sticky',
          top: 0,
          zIndex: 100,
          transition: 'all 0.3s ease',
          ...(isMobileOpen ? { position: 'fixed', left: 0, zIndex: 100 } : {})
        }}
      >
        {/* Brand Header */}
        <div
          style={{
            padding: '1.5rem 1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid var(--border-subtle)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 20px rgba(99, 102, 241, 0.4)'
              }}
            >
              <Sparkles size={20} color="#fff" />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#fff', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
                Nexa<span style={{ color: 'var(--primary-light)' }}>Faculty</span>
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Academic Suite
              </div>
            </div>
          </div>

          {isMobileOpen && (
            <button
              onClick={closeMobileSidebar}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* Faculty Mini Card */}
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border-subtle)', background: 'rgba(255, 255, 255, 0.02)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #4f46e5, #06b6d4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '0.9rem',
                color: '#fff'
              }}
            >
              {user?.name ? user.name.charAt(0).toUpperCase() : 'F'}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#fff', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                {user?.name || 'Faculty Professor'}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--accent-emerald)' }}></span>
                {user?.department || 'Engineering'}
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav style={{ flex: 1, padding: '1rem 0.75rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <div style={{ padding: '0 0.5rem 0.5rem 0.5rem', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)' }}>
            Main Menu
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  if (closeMobileSidebar) closeMobileSidebar();
                }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '10px',
                  border: 'none',
                  background: isActive ? 'linear-gradient(90deg, rgba(99, 102, 241, 0.2) 0%, rgba(168, 85, 247, 0.1) 100%)' : 'transparent',
                  color: isActive ? '#fff' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontWeight: isActive ? 600 : 500,
                  fontSize: '0.88rem',
                  transition: 'all 0.15s ease',
                  textAlign: 'left',
                  borderLeft: isActive ? '3px solid var(--primary-light)' : '3px solid transparent'
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.04)';
                    e.currentTarget.style.color = '#fff';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = 'var(--text-secondary)';
                  }
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <Icon size={18} color={isActive ? 'var(--primary-light)' : 'currentColor'} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    style={{
                      fontSize: '0.7rem',
                      padding: '0.15rem 0.5rem',
                      borderRadius: '999px',
                      fontWeight: 700,
                      color: '#fff',
                      backgroundColor: item.badgeColor === 'bg-amber-500' ? '#f59e0b' : (item.badgeColor === 'bg-purple-600' ? '#9333ea' : '#f43f5e')
                    }}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom Logout */}
        <div style={{ padding: '1rem', borderTop: '1px solid var(--border-subtle)' }}>
          <button
            onClick={logout}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.65rem 0.85rem',
              borderRadius: '10px',
              border: '1px solid rgba(244, 63, 94, 0.2)',
              background: 'rgba(244, 63, 94, 0.08)',
              color: '#fb7185',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.88rem',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(244, 63, 94, 0.18)';
              e.currentTarget.style.borderColor = 'rgba(244, 63, 94, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(244, 63, 94, 0.08)';
              e.currentTarget.style.borderColor = 'rgba(244, 63, 94, 0.2)';
            }}
          >
            <LogOut size={17} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
