import React, { useState, useEffect, useCallback } from 'react';
import {
  ClipboardCheck,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  BookOpen,
  GraduationCap,
  ShieldCheck,
  Sparkles,
  Info,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function StudentAttendanceView() {
  const { user, authFetch, showToast } = useAuth();
  const [attendanceData, setAttendanceData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStudentAttendance = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authFetch('/api/student/attendance');
      const data = await res.json();
      if (res.ok && data.success) {
        setAttendanceData(data);
      } else {
        showToast(data.message || 'Error loading attendance', 'error');
      }
    } catch (err) {
      showToast('Error fetching attendance: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [authFetch, showToast]);

  useEffect(() => {
    fetchStudentAttendance();
  }, [fetchStudentAttendance]);

  const summaries = attendanceData?.records || attendanceData?.attendance || [];
  const publishedSummaries = summaries.filter(s => s.isPublished);
  const hasDefaulter = attendanceData?.summary?.hasDefaulterAlert || publishedSummaries.some(s => s.isDefaulter || Number(s.attendancePercentage) < 30.0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Header Banner */}
      <div style={{
        padding: '1.5rem',
        borderRadius: '16px',
        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(6, 182, 212, 0.08) 100%)',
        border: '1px solid rgba(16, 185, 129, 0.25)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.35)'
          }}>
            <ClipboardCheck size={26} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', margin: 0 }}>
              Academic Attendance Dashboard
            </h2>
            <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: '0.2rem 0 0 0' }}>
              Real-time published attendance records strictly for your Class: <strong>{user?.department} • {user?.year}-{user?.division}</strong>
            </p>
          </div>
        </div>

        <button
          className="btn btn-secondary btn-sm"
          onClick={fetchStudentAttendance}
          disabled={loading}
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1rem', borderRadius: '8px' }}
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Critical Defaulter Banner if below 30% */}
      {hasDefaulter && (
        <div style={{
          padding: '1.25rem 1.5rem',
          borderRadius: '14px',
          background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(185, 28, 28, 0.15) 100%)',
          border: '1px solid rgba(239, 68, 68, 0.45)',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem'
        }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444', flexShrink: 0 }}>
            <AlertTriangle size={24} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>ACADEMIC DEFAULTER WARNING</span>
              <span style={{ fontSize: '0.72rem', background: '#ef4444', color: '#fff', padding: '0.15rem 0.5rem', borderRadius: '999px', fontWeight: 800 }}>
                &lt; 30% ATTENDANCE
              </span>
            </div>
            <div style={{ fontSize: '0.9rem', color: '#fca5a5', marginTop: '0.25rem', fontWeight: 600 }}>
              “Please complete your attendance.”
            </div>
          </div>
        </div>
      )}

      {/* Overview Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        <div className="card" style={{ padding: '1.25rem', background: 'rgba(15, 23, 42, 0.75)', border: '1px solid var(--border-subtle)', borderRadius: '14px' }}>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            ENROLLED SUBJECTS
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff', marginTop: '0.35rem' }}>
            {summaries.length}
          </div>
          <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.2rem' }}>
            {publishedSummaries.length} Published
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem', background: 'rgba(15, 23, 42, 0.75)', border: '1px solid var(--border-subtle)', borderRadius: '14px' }}>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            OVERALL AVERAGE
          </div>
          <div style={{
            fontSize: '1.8rem',
            fontWeight: 800,
            marginTop: '0.35rem',
            color: publishedSummaries.length === 0 ? '#94a3b8' : (hasDefaulter ? '#ef4444' : '#34d399')
          }}>
            {publishedSummaries.length > 0 ? (
              `${(publishedSummaries.reduce((acc, s) => acc + Number(s.attendancePercentage || 0), 0) / publishedSummaries.length).toFixed(1)}%`
            ) : (
              '—'
            )}
          </div>
          <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.2rem' }}>
            Across published subjects
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem', background: 'rgba(15, 23, 42, 0.75)', border: '1px solid var(--border-subtle)', borderRadius: '14px' }}>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            DEFAULTER SUBJECTS
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: hasDefaulter ? '#ef4444' : '#34d399', marginTop: '0.35rem' }}>
            {publishedSummaries.filter(s => s.isDefaulter || Number(s.attendancePercentage) < 30.0).length}
          </div>
          <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.2rem' }}>
            Threshold: &lt; 30%
          </div>
        </div>
      </div>

      {/* Subject-Wise Attendance Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff', margin: '0.5rem 0 0 0' }}>
          Subject-Wise Attendance Breakdown
        </h3>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
            Loading student attendance records...
          </div>
        ) : summaries.length === 0 ? (
          <div style={{
            padding: '3rem',
            textAlign: 'center',
            background: 'rgba(15, 23, 42, 0.75)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '16px',
            color: '#94a3b8'
          }}>
            <ClipboardCheck size={40} style={{ margin: '0 auto 0.75rem auto', opacity: 0.4 }} />
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>Attendance: Not Published</div>
            <p style={{ fontSize: '0.85rem', color: '#64748b', maxWidth: '400px', margin: '0.5rem auto 0 auto' }}>
              Your department faculty has not published attendance for this division yet. Check back once faculty verifies and publishes.
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.25rem' }}>
            {summaries.map(s => {
              const isPub = s.isPublished;
              const isDef = isPub && (s.isDefaulter || Number(s.attendancePercentage) < 30.0);
              const pct = Number(s.attendancePercentage || 0);

              return (
                <div
                  key={s.id || s.subjectId}
                  className="card"
                  style={{
                    padding: '1.5rem',
                    background: isDef ? 'rgba(239, 68, 68, 0.08)' : 'rgba(15, 23, 42, 0.75)',
                    border: isDef ? '1px solid rgba(239, 68, 68, 0.4)' : (isPub ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid var(--border-subtle)'),
                    borderRadius: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '1.25rem'
                  }}
                >
                  {/* Top: Subject Info & Badge */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem' }}>
                      <div>
                        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#06b6d4', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          {s.subjectCode || 'COURSE'}
                        </div>
                        <h4 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#fff', margin: '0.2rem 0 0 0' }}>
                          {s.subjectName}
                        </h4>
                        <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.25rem' }}>
                          Faculty: {s.facultyName || 'Department Faculty'}
                        </div>
                      </div>

                      {/* Status Pill */}
                      {isPub ? (
                        isDef ? (
                          <span style={{
                            padding: '0.25rem 0.6rem',
                            borderRadius: '999px',
                            background: '#ef4444',
                            color: '#fff',
                            fontSize: '0.72rem',
                            fontWeight: 800
                          }}>
                            DEFAULTER
                          </span>
                        ) : (
                          <span style={{
                            padding: '0.25rem 0.6rem',
                            borderRadius: '999px',
                            background: 'rgba(16, 185, 129, 0.2)',
                            color: '#34d399',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            border: '1px solid rgba(16, 185, 129, 0.4)'
                          }}>
                            Published
                          </span>
                        )
                      ) : (
                        <span style={{
                          padding: '0.25rem 0.6rem',
                          borderRadius: '999px',
                          background: 'rgba(234, 179, 8, 0.15)',
                          color: '#fbbf24',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          border: '1px solid rgba(234, 179, 8, 0.3)'
                        }}>
                          Attendance: Not Published
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Body: Numbers or Unpublished Placeholder */}
                  {isPub ? (
                    <div>
                      {/* Progress Bar */}
                      <div style={{ marginBottom: '0.75rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                          <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Attendance Score</span>
                          <span style={{ fontSize: '1.2rem', fontWeight: 800, color: isDef ? '#ef4444' : (pct >= 75 ? '#34d399' : '#fbbf24') }}>
                            {pct.toFixed(1)}%
                          </span>
                        </div>
                        <div style={{ height: '8px', width: '100%', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '999px', overflow: 'hidden' }}>
                          <div style={{
                            height: '100%',
                            width: `${Math.min(100, Math.max(0, pct))}%`,
                            background: isDef ? 'linear-gradient(90deg, #ef4444, #dc2626)' : (pct >= 75 ? 'linear-gradient(90deg, #10b981, #059669)' : 'linear-gradient(90deg, #f59e0b, #d97706)'),
                            borderRadius: '999px',
                            transition: 'width 0.4s ease'
                          }} />
                        </div>
                      </div>

                      {/* Stat Metrics */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', background: 'rgba(0, 0, 0, 0.25)', padding: '0.75rem', borderRadius: '10px' }}>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Conducted</div>
                          <div style={{ fontSize: '1rem', fontWeight: 700, color: '#fff' }}>{s.totalConducted || 0}</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Attended</div>
                          <div style={{ fontSize: '1rem', fontWeight: 700, color: '#34d399' }}>{s.totalPresent || 0}</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Absent</div>
                          <div style={{ fontSize: '1rem', fontWeight: 700, color: '#f87171' }}>{s.totalAbsent || 0}</div>
                        </div>
                      </div>

                      {/* Defaulter Message if < 30% */}
                      {isDef && (
                        <div style={{
                          marginTop: '0.75rem',
                          padding: '0.5rem 0.75rem',
                          borderRadius: '8px',
                          background: 'rgba(239, 68, 68, 0.2)',
                          border: '1px solid rgba(239, 68, 68, 0.4)',
                          color: '#fca5a5',
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          textAlign: 'center'
                        }}>
                          “Please complete your attendance.”
                        </div>
                      )}
                    </div>
                  ) : (
                    <div style={{ padding: '1.25rem', textAlign: 'center', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '10px', border: '1px dashed rgba(255, 255, 255, 0.1)' }}>
                      <Clock size={24} style={{ margin: '0 auto 0.5rem auto', color: '#fbbf24', opacity: 0.6 }} />
                      <div style={{ fontSize: '0.85rem', color: '#fbbf24', fontWeight: 600 }}>Attendance: Not Published</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.2rem' }}>Awaiting faculty percentage calculation and verification.</div>
                    </div>
                  )}

                  {/* Footer date */}
                  <div style={{ fontSize: '0.72rem', color: '#64748b', borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Target: {user?.year}-{user?.division}</span>
                    <span>{isPub && s.publishedAt ? `Updated: ${new Date(s.publishedAt).toLocaleDateString()}` : 'In Progress'}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
