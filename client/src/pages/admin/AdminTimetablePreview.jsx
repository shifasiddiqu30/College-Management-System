import React from 'react';
import { CalendarCheck, Sparkles, ArrowRight, Layers, Clock, Building2, Users2, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function AdminTimetablePreview() {
  const navigate = useNavigate();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '1000px' }}>
      {/* Banner */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(168, 85, 247, 0.1))',
        border: '1px solid rgba(99, 102, 241, 0.3)',
        borderRadius: '16px',
        padding: '2rem',
        boxShadow: 'var(--shadow-md)'
      }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.25rem 0.75rem', borderRadius: '9999px', background: 'rgba(99, 102, 241, 0.2)', color: '#818cf8', fontSize: '0.75rem', fontWeight: 700, marginBottom: '1rem' }}>
          <Sparkles size={14} /> Coming in Part 3 of 8
        </div>
        <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fff', marginBottom: '0.5rem' }}>
          Smart Master Timetable & Clash-Free Engine
        </h2>
        <p style={{ color: '#94a3b8', fontSize: '0.92rem', lineHeight: '1.6', maxWidth: '720px' }}>
          Part 2 has established the foundational relational schema linking <strong>Class Sections → Subjects → Faculty → Classrooms</strong>.
          Part 3 will introduce automated schedule generation, drag-and-drop period allocators, and faculty workload balancing.
        </p>

        <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <button className="btn btn-primary" onClick={() => navigate('/admin/classroom-availability')}>
            <Clock size={16} />
            <span>Test Classroom Availability Engine</span>
          </button>
          <button className="btn btn-secondary" onClick={() => navigate('/admin/classes')}>
            <Layers size={16} />
            <span>Manage Classes & Sections</span>
          </button>
        </div>
      </div>

      {/* Relational Foundation Overview Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '1.25rem' }}>
          <div style={{ color: '#818cf8', marginBottom: '0.5rem' }}><Layers size={22} /></div>
          <h4 style={{ color: '#fff', fontSize: '0.95rem', fontWeight: 700 }}>Class & Sections</h4>
          <p style={{ color: '#94a3b8', fontSize: '0.78rem', marginTop: '0.25rem' }}>Target cohort (e.g. SE-B) mapped to specific academic curriculum</p>
        </div>

        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '1.25rem' }}>
          <div style={{ color: '#06b6d4', marginBottom: '0.5rem' }}><BookOpen size={22} /></div>
          <h4 style={{ color: '#fff', fontSize: '0.95rem', fontWeight: 700 }}>Curriculum Subjects</h4>
          <p style={{ color: '#94a3b8', fontSize: '0.78rem', marginTop: '0.25rem' }}>Course codes, semester credits & required lecture hours</p>
        </div>

        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '1.25rem' }}>
          <div style={{ color: '#10b981', marginBottom: '0.5rem' }}><Users2 size={22} /></div>
          <h4 style={{ color: '#fff', fontSize: '0.95rem', fontWeight: 700 }}>Assigned Faculty</h4>
          <p style={{ color: '#94a3b8', fontSize: '0.78rem', marginTop: '0.25rem' }}>Faculty slot allocation with clash protection</p>
        </div>

        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '1.25rem' }}>
          <div style={{ color: '#f59e0b', marginBottom: '0.5rem' }}><Building2 size={22} /></div>
          <h4 style={{ color: '#fff', fontSize: '0.95rem', fontWeight: 700 }}>Classroom Allocation</h4>
          <p style={{ color: '#94a3b8', fontSize: '0.78rem', marginTop: '0.25rem' }}>Room capacity matching and lab equipment availability</p>
        </div>
      </div>
    </div>
  );
}
