import React from 'react';
import { ShieldCheck, Mail, Building, Key, Server, Lock, CheckCircle2, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function AdminProfile() {
  const { user } = useAuth();

  return (
    <div style={{ maxWidth: '800px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Profile Card */}
      <div className="table-container" style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
          <div style={{
            width: '72px',
            height: '72px',
            borderRadius: '20px',
            background: 'linear-gradient(135deg, #6366f1, #a855f7)',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '2rem',
            fontWeight: 800,
            boxShadow: '0 0 30px rgba(99, 102, 241, 0.4)'
          }}>
            {user?.name?.charAt(0) || 'A'}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff' }}>{user?.name || 'Dr. Eleanor Vance'}</h2>
              <span className="badge badge-active">Admin Verified</span>
            </div>
            <p style={{ fontSize: '0.85rem', color: '#818cf8', fontWeight: 600 }}>Central Administrative Office</p>
            <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.2rem' }}>College ID: {user?.id || 'usr_admin_001'}</p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
          <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '1rem' }}>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Mail size={14} /> Official Email
            </div>
            <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#fff', marginTop: '0.35rem', fontFamily: 'monospace' }}>
              {user?.email || 'admin@college.edu'}
            </div>
          </div>

          <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '1rem' }}>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Building size={14} /> Affiliated Department
            </div>
            <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#fff', marginTop: '0.35rem' }}>
              {user?.department || 'Central Administration'}
            </div>
          </div>

          <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '1rem' }}>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <ShieldCheck size={14} /> Security Role
            </div>
            <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#10b981', marginTop: '0.35rem' }}>
              SUPER_ADMIN (Full Privileges)
            </div>
          </div>

          <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '1rem' }}>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Server size={14} /> Authentication Type
            </div>
            <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#818cf8', marginTop: '0.35rem' }}>
              JWT Bearer (24-Hour Session)
            </div>
          </div>
        </div>
      </div>

      {/* Security Privileges Information */}
      <div className="table-container" style={{ padding: '1.5rem' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', marginBottom: '1rem' }}>
          Enforced System Permissions (Part 2)
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#cbd5e1', fontSize: '0.85rem' }}>
            <CheckCircle2 size={16} color="#10b981" />
            <span>Full CRUD control over Student records & academic enrollments</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#cbd5e1', fontSize: '0.85rem' }}>
            <CheckCircle2 size={16} color="#10b981" />
            <span>Faculty appointment, department affiliation & subject assignment</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#cbd5e1', fontSize: '0.85rem' }}>
            <CheckCircle2 size={16} color="#10b981" />
            <span>Classroom capacity allocation, lab configuration & live clash detection</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#cbd5e1', fontSize: '0.85rem' }}>
            <CheckCircle2 size={16} color="#10b981" />
            <span>Backend API route protection with <code>verifyToken</code> and <code>authorizeRoles('ADMIN')</code></span>
          </div>
        </div>
      </div>
    </div>
  );
}
