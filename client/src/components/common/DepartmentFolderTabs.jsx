import React, { useState, useEffect } from 'react';
import { Folder, FolderOpen, Building2, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

/**
 * Branch/Department-Wise Weekly Timetable Folders Component
 * Loads departments dynamically from database and allows 1-click folder selection
 */
export default function DepartmentFolderTabs({
  selectedDepartment,
  onSelectDepartment,
  endpoint = '/api/admin/departments',
  title = 'WEEKLY TIMETABLE — SELECT BRANCH / DEPARTMENT',
  subtitle = 'Choose a department folder to view structured weekly timetable schedules',
  showAllOption = false
}) {
  const { authFetch } = useAuth();
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadDepts() {
      try {
        const res = await authFetch(endpoint);
        const data = await res.json();
        if (isMounted && res.ok && data.success) {
          const list = data.departments || [];
          // Filter to active only if status is present
          const activeList = list.filter(d => (typeof d === 'string') || (d.status ? d.status === 'Active' : true));
          setDepartments(activeList);
        }
      } catch (err) {
        console.error('Failed to load department folders:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadDepts();
    return () => { isMounted = false; };
  }, [authFetch, endpoint]);

  if (loading && departments.length === 0) {
    return (
      <div style={{
        padding: '1.25rem',
        background: 'rgba(15, 23, 42, 0.4)',
        borderRadius: '16px',
        border: '1px solid rgba(255, 255, 255, 0.06)',
        color: '#94a3b8',
        fontSize: '0.85rem'
      }}>
        Loading department timetable folders...
      </div>
    );
  }

  const deptList = departments.map(d => typeof d === 'string' ? { name: d, code: d.substring(0, 3).toUpperCase() } : d);

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border-subtle)',
      borderRadius: '18px',
      padding: '1.25rem 1.5rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '1rem',
      boxShadow: 'var(--shadow-sm)',
      transition: 'background-color var(--transition-normal), border-color var(--transition-normal)'
    }}>
      {/* Section Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.78rem', fontWeight: 800, color: 'var(--primary-light)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            <Folder size={15} />
            <span>{title}</span>
          </div>
          {subtitle && <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>{subtitle}</p>}
        </div>
      </div>

      {/* Dynamic Folder Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
        gap: '0.85rem'
      }}>
        {showAllOption && (
          <button
            type="button"
            onClick={() => onSelectDepartment('ALL')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.85rem 1rem',
              borderRadius: '12px',
              background: selectedDepartment === 'ALL'
                ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.25), rgba(168, 85, 247, 0.25))'
                : 'var(--bg-header-btn)',
              border: `1px solid ${selectedDepartment === 'ALL' ? 'rgba(99, 102, 241, 0.6)' : 'var(--border-subtle)'}`,
              color: selectedDepartment === 'ALL' ? '#fff' : 'var(--text-heading)',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.2s ease',
              boxShadow: selectedDepartment === 'ALL' ? '0 0 20px rgba(99, 102, 241, 0.25)' : 'none'
            }}
          >
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: selectedDepartment === 'ALL' ? '#6366f1' : 'var(--stat-icon-bg)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: selectedDepartment === 'ALL' ? '#fff' : 'var(--primary)',
              flexShrink: 0
            }}>
              {selectedDepartment === 'ALL' ? <FolderOpen size={18} /> : <Folder size={18} />}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: selectedDepartment === 'ALL' ? '#fff' : 'var(--text-heading)' }}>All Departments</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Campus Schedule Overview</div>
            </div>
          </button>
        )}

        {deptList.map((dept) => {
          const isSelected = selectedDepartment === dept.name;
          return (
            <button
              key={dept.id || dept.name}
              type="button"
              onClick={() => onSelectDepartment(dept.name)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.85rem 1rem',
                borderRadius: '12px',
                background: isSelected
                  ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.25), rgba(168, 85, 247, 0.25))'
                  : 'var(--bg-header-btn)',
                border: `1px solid ${isSelected ? 'rgba(168, 85, 247, 0.6)' : 'var(--border-subtle)'}`,
                color: isSelected ? '#fff' : 'var(--text-heading)',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s ease',
                boxShadow: isSelected ? '0 0 22px rgba(168, 85, 247, 0.3)' : 'none'
              }}
            >
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: isSelected ? 'linear-gradient(135deg, #a855f7, #6366f1)' : 'var(--stat-icon-bg)',
                border: `1px solid ${isSelected ? 'rgba(168, 85, 247, 0.5)' : 'rgba(168, 85, 247, 0.2)'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: isSelected ? '#fff' : '#a855f7',
                flexShrink: 0
              }}>
                {isSelected ? <FolderOpen size={18} /> : <Folder size={18} />}
              </div>
              <div style={{ overflow: 'hidden' }}>
                <div style={{
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  color: isSelected ? '#fff' : 'var(--text-heading)',
                  whiteSpace: 'nowrap',
                  textOverflow: 'ellipsis',
                  overflow: 'hidden'
                }}>
                  {dept.name}
                </div>
                <div style={{ fontSize: '0.72rem', color: isSelected ? '#c084fc' : 'var(--text-muted)' }}>
                  {dept.code ? `[${dept.code}] ` : ''}Weekly Timetable
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
