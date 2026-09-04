import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  GraduationCap,
  Users2,
  Building2,
  Layers,
  Clock,
  UserPlus,
  PlusCircle,
  CalendarCheck,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  TrendingUp,
  Server
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function AdminDashboard() {
  const { authFetch } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState(null);
  const [classroomsByType, setClassroomsByType] = useState([]);
  const [recentStudents, setRecentStudents] = useState([]);
  const [recentFaculty, setRecentFaculty] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const res = await authFetch('/api/admin/dashboard-stats');
        const data = await res.json();
        if (res.ok && data.success) {
          setStats(data.stats);
          setClassroomsByType(data.classroomsByType || []);
          setRecentStudents(data.recentStudents || []);
          setRecentFaculty(data.recentFaculty || []);
        }
      } catch (err) {
        console.error('Failed to load dashboard stats:', err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, [authFetch]);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh', color: '#94a3b8' }}>
        <p>Loading Admin Dashboard metrics...</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* 4 Summary Metric Cards */}
      <div className="stats-grid">
        {/* Total Students */}
        <div className="stat-card" style={{ '--stat-color': '#6366f1' }}>
          <div className="stat-info">
            <div className="stat-label">Total Students</div>
            <div className="stat-value">{stats?.totalStudents ?? 0}</div>
            <div className="stat-desc">
              <span style={{ color: '#10b981' }}>● Active Enrollment</span>
            </div>
          </div>
          <div className="stat-icon-wrapper" style={{ color: '#6366f1' }}>
            <GraduationCap />
          </div>
        </div>

        {/* Total Faculty */}
        <div className="stat-card" style={{ '--stat-color': '#06b6d4' }}>
          <div className="stat-info">
            <div className="stat-label">Total Faculty</div>
            <div className="stat-value">{stats?.totalFaculty ?? 0}</div>
            <div className="stat-desc">
              <span style={{ color: '#06b6d4' }}>● Teaching Staff</span>
            </div>
          </div>
          <div className="stat-icon-wrapper" style={{ color: '#06b6d4' }}>
            <Users2 />
          </div>
        </div>

        {/* Total Classrooms */}
        <div className="stat-card" style={{ '--stat-color': '#10b981' }}>
          <div className="stat-info">
            <div className="stat-label">Total Classrooms</div>
            <div className="stat-value">{stats?.totalClassrooms ?? 0}</div>
            <div className="stat-desc">
              <span style={{ color: '#10b981' }}>{stats?.totalActiveRooms ?? 0} Operational Rooms</span>
            </div>
          </div>
          <div className="stat-icon-wrapper" style={{ color: '#10b981' }}>
            <Building2 />
          </div>
        </div>

        {/* Total Departments */}
        <div className="stat-card" style={{ '--stat-color': '#a855f7' }}>
          <div className="stat-info">
            <div className="stat-label">Total Departments</div>
            <div className="stat-value">{stats?.totalDepartments ?? 0}</div>
            <div className="stat-desc">
              <span>{stats?.totalClasses ?? 0} Class Sections</span>
            </div>
          </div>
          <div className="stat-icon-wrapper" style={{ color: '#a855f7' }}>
            <Layers />
          </div>
        </div>
      </div>

      {/* Quick Action Shortcuts Banner */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.12), rgba(168, 85, 247, 0.08))',
        border: '1px solid rgba(99, 102, 241, 0.25)',
        borderRadius: '16px',
        padding: '1.25rem 1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff' }}>Quick Administrative Actions</h3>
          <p style={{ fontSize: '0.82rem', color: '#94a3b8' }}>Fast-track student enrollment, faculty onboarding and room scheduling</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button className="btn btn-primary" onClick={() => navigate('/admin/students')}>
            <UserPlus size={16} />
            <span>Manage Students</span>
          </button>
          <button className="btn btn-secondary" onClick={() => navigate('/admin/faculty')}>
            <Users2 size={16} />
            <span>Manage Faculty</span>
          </button>
          <button className="btn btn-secondary" onClick={() => navigate('/admin/classroom-availability')}>
            <Clock size={16} />
            <span>Check Availability</span>
          </button>
        </div>
      </div>

      {/* 2 Column Layout: Recent Students & Recent Faculty */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '1.5rem' }}>
        {/* Recently Added Students */}
        <div className="table-container">
          <div className="table-header-bar">
            <div className="table-title">
              <h3>Recently Added Students</h3>
              <p>Latest enrollments in the system</p>
            </div>
            <button
              className="btn btn-secondary"
              style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem' }}
              onClick={() => navigate('/admin/students')}
            >
              <span>View All</span>
              <ArrowRight size={14} />
            </button>
          </div>

          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Class / Roll</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentStudents.length === 0 ? (
                  <tr>
                    <td colSpan="3" style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                      No recent students found.
                    </td>
                  </tr>
                ) : (
                  recentStudents.map((s) => (
                    <tr key={s.id}>
                      <td>
                        <div className="user-cell">
                          <div className="cell-avatar">
                            {s.name.charAt(0)}
                          </div>
                          <div className="cell-info">
                            <div className="cell-name">{s.name}</div>
                            <div className="cell-sub">{s.email}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span style={{ fontWeight: 600, color: '#f8fafc' }}>
                          {s.year}-{s.division}
                        </span>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Roll #{s.rollNumber}</div>
                      </td>
                      <td>
                        <span className={`badge badge-${s.status?.toLowerCase()}`}>
                          {s.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recently Added Faculty */}
        <div className="table-container">
          <div className="table-header-bar">
            <div className="table-title">
              <h3>Recently Added Faculty</h3>
              <p>Professors & teaching appointments</p>
            </div>
            <button
              className="btn btn-secondary"
              style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem' }}
              onClick={() => navigate('/admin/faculty')}
            >
              <span>View All</span>
              <ArrowRight size={14} />
            </button>
          </div>

          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Faculty</th>
                  <th>Department & Subjects</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentFaculty.length === 0 ? (
                  <tr>
                    <td colSpan="3" style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                      No recent faculty found.
                    </td>
                  </tr>
                ) : (
                  recentFaculty.map((f) => (
                    <tr key={f.id}>
                      <td>
                        <div className="user-cell">
                          <div className="cell-avatar" style={{ background: 'linear-gradient(135deg, #06b6d4, #3b82f6)' }}>
                            {f.name.charAt(0)}
                          </div>
                          <div className="cell-info">
                            <div className="cell-name">{f.name}</div>
                            <div className="cell-sub">{f.email}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#f8fafc' }}>{f.department}</div>
                        <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap', marginTop: '0.2rem' }}>
                          {f.assignedSubjects.slice(0, 2).map((sub, idx) => (
                            <span key={idx} className="tag-pill" style={{ margin: 0, fontSize: '0.7rem' }}>
                              {sub}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td>
                        <span className={`badge badge-${f.status?.toLowerCase()}`}>
                          {f.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Classroom Occupancy Summary */}
      <div className="table-container">
        <div className="table-header-bar">
          <div className="table-title">
            <h3>Classroom & Infrastructure Summary</h3>
            <p>Seating capacity and facility distribution across campus</p>
          </div>
          <button
            className="btn btn-secondary"
            style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem' }}
            onClick={() => navigate('/admin/classrooms')}
          >
            <span>Classroom Inventory</span>
            <ArrowRight size={14} />
          </button>
        </div>

        <div style={{ padding: '1.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
          <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '1.25rem' }}>
            <div style={{ fontSize: '0.78rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>Total Campus Capacity</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff', marginTop: '0.25rem' }}>
              {stats?.totalCapacity || 0} <span style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 500 }}>Seats</span>
            </div>
            <div style={{ fontSize: '0.75rem', color: '#10b981', marginTop: '0.35rem' }}>Average {stats?.avgCapacity || 0} seats per room</div>
          </div>

          {classroomsByType.map((t, idx) => (
            <div key={idx} style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '1.25rem' }}>
              <div style={{ fontSize: '0.78rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>{t.type}</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff', marginTop: '0.25rem' }}>
                {t.count} <span style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 500 }}>Units</span>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#818cf8', marginTop: '0.35rem' }}>Allocated across campus blocks</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
