import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  GraduationCap,
  Users2,
  Building2,
  CalendarCheck,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Layers,
  Lock,
  Compass,
  MessageSquareQuote,
  TrendingUp,
  Cpu
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function LandingPage() {
  const navigate = useNavigate();
  const { user, login } = useAuth();

  const handleQuickLogin = async (email, password) => {
    try {
      const data = await login(email, password);
      if (data.user.role === 'ADMIN') navigate('/admin/dashboard');
      else if (data.user.role === 'FACULTY') navigate('/faculty/dashboard');
      else if (data.user.role === 'STUDENT') navigate('/student/dashboard');
    } catch (err) {
      // toast shown by auth context
    }
  };

  const modules = [
    { number: '01', title: 'Single Unified Authentication', desc: 'Secure JWT role-based access control with automatic role detection for Admin, Faculty & Students.', status: 'Completed (Part 1)' },
    { number: '02', title: 'Admin Command & Management', desc: 'Complete CRUD engine for Students, Faculty, Classrooms, Sections & Live Availability.', status: 'Active (Part 2)' },
    { number: '03', title: 'Smart Timetable Engine', desc: 'Clash-free automated schedule generator and faculty workload optimizer.', status: 'Upcoming (Part 3)' },
    { number: '04', title: 'Campus Clubs & Events', desc: 'Student activity hubs, event registration and executive circular boards.', status: 'Upcoming (Part 4)' },
    { number: '05', title: 'Lost & Found Campus Hub', desc: 'Digital depository with image matching and claim resolution workflows.', status: 'Upcoming (Part 5)' },
    { number: '06', title: 'Smart Doubt Discussion', desc: 'Interactive academic forum with faculty endorsements and peer threads.', status: 'Upcoming (Part 6)' },
    { number: '07', title: 'Academic Performance & Attendance', desc: 'Internal marks, attendance tracking, and smart grade analytics.', status: 'Upcoming (Part 7)' },
    { number: '08', title: 'System Analytics & Optimization', desc: 'College-wide KPIs, infrastructure utilization & exportable audits.', status: 'Upcoming (Part 8)' }
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'radial-gradient(ellipse at top, #131d33 0%, #090d16 70%)', color: '#fff' }}>
      {/* Top Navbar */}
      <header style={{
        padding: '1.25rem 2.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        backdropFilter: 'blur(12px)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        background: 'rgba(9, 13, 22, 0.85)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #6366f1, #a855f7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 20px rgba(99, 102, 241, 0.4)'
          }}>
            <Sparkles size={22} color="#fff" />
          </div>
          <div>
            <h1 style={{ fontSize: '1.3rem', fontWeight: 800, letterSpacing: '-0.02em', margin: 0 }}>AcademiaX</h1>
            <span style={{ fontSize: '0.7rem', color: '#818cf8', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              College Operating System
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {user ? (
            <button
              className="btn btn-primary"
              onClick={() => {
                if (user.role === 'ADMIN') navigate('/admin/dashboard');
                else if (user.role === 'FACULTY') navigate('/faculty/dashboard');
                else navigate('/student/dashboard');
              }}
            >
              <ShieldCheck size={18} />
              <span>Go to {user.role} Dashboard</span>
            </button>
          ) : (
            <button className="btn btn-primary" onClick={() => navigate('/login')}>
              <span>Sign In to Portal</span>
              <ArrowRight size={16} />
            </button>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section style={{ padding: '5rem 2rem 3rem', maxWidth: '1200px', margin: '0 auto', textAlign: 'center' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.4rem 1rem',
          borderRadius: '9999px',
          background: 'rgba(99, 102, 241, 0.12)',
          border: '1px solid rgba(99, 102, 241, 0.3)',
          color: '#818cf8',
          fontSize: '0.85rem',
          fontWeight: 600,
          marginBottom: '1.5rem'
        }}>
          <Sparkles size={16} />
          <span>Part 2: Admin Dashboard & Unified Management Live</span>
        </div>

        <h1 style={{
          fontSize: 'clamp(2.5rem, 5vw, 4.2rem)',
          fontWeight: 800,
          lineHeight: 1.15,
          letterSpacing: '-0.03em',
          maxWidth: '900px',
          margin: '0 auto 1.5rem',
          background: 'linear-gradient(180deg, #ffffff 0%, #cbd5e1 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          Intelligent Campus Management <br />
          <span style={{
            background: 'linear-gradient(135deg, #818cf8 0%, #06b6d4 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            Built For Higher Education
          </span>
        </h1>

        <p style={{
          fontSize: 'clamp(1rem, 2vw, 1.25rem)',
          color: '#94a3b8',
          maxWidth: '720px',
          margin: '0 auto 2.5rem',
          lineHeight: 1.6
        }}>
          A unified, high-performance platform managing student enrollments, faculty workloads, classroom availability matrices, and real-time operations with strict RBAC security.
        </p>

        {/* Demo Credentials Quick-Login Box */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.75)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '20px',
          padding: '2rem',
          maxWidth: '960px',
          margin: '0 auto 4rem',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(16px)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <Lock size={18} color="#818cf8" />
            <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f8fafc' }}>
              One-Click Viva & Evaluation Logins
            </span>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '1.25rem',
            textAlign: 'left'
          }}>
            {/* Admin Box */}
            <div style={{
              background: 'rgba(99, 102, 241, 0.08)',
              border: '1px solid rgba(99, 102, 241, 0.25)',
              borderRadius: '14px',
              padding: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#818cf8', background: 'rgba(99, 102, 241, 0.2)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                    Admin Role
                  </span>
                  <ShieldCheck size={18} color="#818cf8" />
                </div>
                <div style={{ fontWeight: 700, fontSize: '1rem', color: '#fff' }}>Dr. Eleanor Vance</div>
                <div style={{ fontSize: '0.8rem', color: '#94a3b8', fontFamily: 'monospace' }}>admin@college.edu</div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>Password: Admin@123</div>
              </div>
              <button
                className="btn btn-primary"
                style={{ marginTop: '1rem', width: '100%', fontSize: '0.85rem' }}
                onClick={() => handleQuickLogin('admin@college.edu', 'Admin@123')}
              >
                Login as Administrator
              </button>
            </div>

            {/* Faculty Box */}
            <div style={{
              background: 'rgba(6, 182, 212, 0.08)',
              border: '1px solid rgba(6, 182, 212, 0.25)',
              borderRadius: '14px',
              padding: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#06b6d4', background: 'rgba(6, 182, 212, 0.2)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                    Faculty Role
                  </span>
                  <Users2 size={18} color="#06b6d4" />
                </div>
                <div style={{ fontWeight: 700, fontSize: '1rem', color: '#fff' }}>Sharma Ma'am</div>
                <div style={{ fontSize: '0.8rem', color: '#94a3b8', fontFamily: 'monospace' }}>sharma@college.edu</div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>Password: Faculty@123</div>
              </div>
              <button
                className="btn btn-secondary"
                style={{ marginTop: '1rem', width: '100%', fontSize: '0.85rem', borderColor: 'rgba(6, 182, 212, 0.4)' }}
                onClick={() => handleQuickLogin('sharma@college.edu', 'Faculty@123')}
              >
                Login as Faculty
              </button>
            </div>

            {/* Student Box */}
            <div style={{
              background: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              borderRadius: '14px',
              padding: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#10b981', background: 'rgba(16, 185, 129, 0.2)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                    Student Role
                  </span>
                  <GraduationCap size={18} color="#10b981" />
                </div>
                <div style={{ fontWeight: 700, fontSize: '1rem', color: '#fff' }}>Shifa Siddiqui</div>
                <div style={{ fontSize: '0.8rem', color: '#94a3b8', fontFamily: 'monospace' }}>student@college.edu</div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>Password: Student@123 (Roll: 23)</div>
              </div>
              <button
                className="btn btn-secondary"
                style={{ marginTop: '1rem', width: '100%', fontSize: '0.85rem', borderColor: 'rgba(16, 185, 129, 0.4)' }}
                onClick={() => handleQuickLogin('student@college.edu', 'Student@123')}
              >
                Login as Student
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Modules Roadmap Grid */}
      <section style={{ padding: '3rem 2rem 5rem', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, color: '#fff', marginBottom: '0.5rem' }}>
            Comprehensive 8-Part Architecture
          </h2>
          <p style={{ color: '#94a3b8' }}>
            Built modularly according to academic specification standards
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '1.25rem'
        }}>
          {modules.map((m) => (
            <div
              key={m.number}
              style={{
                background: 'rgba(17, 24, 39, 0.7)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '16px',
                padding: '1.5rem',
                position: 'relative',
                transition: 'all 0.25s ease'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'rgba(255, 255, 255, 0.2)', fontFamily: 'monospace' }}>
                  {m.number}
                </span>
                <span style={{
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  padding: '0.2rem 0.6rem',
                  borderRadius: '9999px',
                  background: m.status.includes('Active') ? 'rgba(99, 102, 241, 0.2)' : m.status.includes('Completed') ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                  color: m.status.includes('Active') ? '#818cf8' : m.status.includes('Completed') ? '#10b981' : '#94a3b8'
                }}>
                  {m.status}
                </span>
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', marginBottom: '0.5rem' }}>{m.title}</h3>
              <p style={{ fontSize: '0.85rem', color: '#94a3b8', lineHeight: 1.5 }}>{m.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        padding: '2.5rem 2rem',
        textAlign: 'center',
        color: '#64748b',
        fontSize: '0.85rem'
      }}>
        <p>© 2026 AcademiaX — College Management System. All rights reserved.</p>
        <p style={{ marginTop: '0.35rem', fontSize: '0.78rem' }}>
          Role-Based Access Control Architecture • SQLite WAL Engine • React & Express API
        </p>
      </footer>
    </div>
  );
}
