import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  GraduationCap,
  Users2,
  Building2,
  CalendarCheck,
  Calendar,
  ClipboardCheck,
  Clock,
  Layers,
  Bell,
  UserCheck,
  LogOut,
  Sparkles,
  Landmark
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function AdminSidebar({ isMobileOpen, closeMobileSidebar }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const coreNavItems = [
    { label: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'Departments', path: '/admin/departments', icon: Landmark },
    { label: 'Students', path: '/admin/students', icon: GraduationCap },
    { label: 'Faculty', path: '/admin/faculty', icon: Users2 },
    { label: 'Classrooms', path: '/admin/classrooms', icon: Building2 },
    { label: 'Class & Sections', path: '/admin/classes', icon: Layers }
  ];

  const scheduleNavItems = [
    { label: 'Student Timetable', path: '/admin/timetable', icon: CalendarCheck },
    { label: 'Faculty Timetable', path: '/admin/faculty-timetable', icon: Calendar },
    { label: 'Attendance Register', path: '/admin/attendance', icon: ClipboardCheck, badge: 'Active' },
    { label: 'Classroom Availability', path: '/admin/classroom-availability', icon: Clock, badge: 'Live' },
    { label: 'Faculty Availability', path: '/admin/faculty-availability', icon: Users2, badge: 'Live' },
    { label: 'Notifications', path: '/admin/notifications', icon: Bell },
    { label: 'Profile', path: '/admin/profile', icon: UserCheck }
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isMobileOpen && (
        <div
          className="mobile-backdrop"
          onClick={closeMobileSidebar}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(4px)',
            zIndex: 45
          }}
        />
      )}

      <aside
        className={`admin-sidebar ${isMobileOpen ? 'mobile-open' : ''}`}
        style={isMobileOpen ? { position: 'fixed', left: 0, top: 0, zIndex: 50, transform: 'none' } : {}}
      >
        {/* Brand Header */}
        <div className="sidebar-header">
          <div className="brand-logo-badge">
            <Sparkles size={22} />
          </div>
          <div className="brand-info">
            <h2>AcademiaX</h2>
            <span>Admin Center</span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="sidebar-nav">
          <div className="nav-category">Core Management</div>
          {coreNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                onClick={closeMobileSidebar}
              >
                <Icon />
                <span>{item.label}</span>
                {item.badge && <span className="nav-badge">{item.badge}</span>}
              </NavLink>
            );
          })}

          <div className="nav-category" style={{ marginTop: '0.75rem' }}>Operations & Schedules</div>
          {scheduleNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                onClick={closeMobileSidebar}
              >
                <Icon />
                <span>{item.label}</span>
                {item.badge && (
                  <span
                    className="nav-badge"
                    style={item.badge === 'Live' ? { background: 'rgba(16, 185, 129, 0.2)', color: '#10b981' } : {}}
                  >
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Footer: Current User & Logout */}
        <div className="sidebar-footer">
          <div className="sidebar-user-card">
            <div className="user-avatar-pill">
              {user?.name?.charAt(0) || 'A'}
            </div>
            <div className="user-details">
              <div className="user-name">{user?.name || 'Administrator'}</div>
              <div className="user-role">{user?.email || 'admin@college.edu'}</div>
            </div>
          </div>

          <button className="btn-logout" onClick={handleLogout}>
            <LogOut size={18} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
