import React, { useState, useEffect, useCallback } from 'react';
import {
  Layers,
  Plus,
  Edit2,
  Trash2,
  X,
  Users,
  GraduationCap,
  Building2,
  RefreshCw,
  UserCheck
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import ConfirmModal from '../../components/admin/ConfirmModal';

export default function ClassSectionManagement() {
  const { authFetch, showToast } = useAuth();

  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [options, setOptions] = useState({
    departments: ['Computer Engineering', 'Information Technology', 'Electronics & Telecommunication', 'Mechanical Engineering', 'Civil Engineering', 'Artificial Intelligence & Data Science'],
    academicYears: ['FE', 'SE', 'TE', 'BE'],
    divisions: ['A', 'B', 'C', 'D'],
    facultyList: []
  });

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    department: 'Computer Engineering',
    year: 'SE',
    division: 'B',
    classTeacherId: ''
  });
  const [formError, setFormError] = useState('');

  // Delete Confirm Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [classToDelete, setClassToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Fetch Options
  useEffect(() => {
    async function loadOptions() {
      try {
        const res = await authFetch('/api/admin/options');
        const data = await res.json();
        if (res.ok && data.success) {
          setOptions({
            departments: data.departments || options.departments,
            academicYears: data.academicYears || options.academicYears,
            divisions: data.divisions || options.divisions,
            facultyList: data.facultyList || []
          });
        }
      } catch (err) {
        console.error('Error fetching options:', err);
      }
    }
    loadOptions();
  }, [authFetch]);

  // Fetch Classes
  const fetchClasses = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authFetch('/api/admin/classes');
      const data = await res.json();
      if (res.ok && data.success) {
        setClasses(data.classes || []);
      }
    } catch (err) {
      showToast('Failed to load class sections: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [authFetch, showToast]);

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  // Add / Edit Modal Open
  const handleOpenAdd = () => {
    setEditingClass(null);
    setFormData({
      department: options.departments[0] || 'Computer Engineering',
      year: 'SE',
      division: 'B',
      classTeacherId: ''
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (c) => {
    setEditingClass(c);
    setFormData({
      department: c.department,
      year: c.year,
      division: c.division,
      classTeacherId: c.classTeacherId || ''
    });
    setFormError('');
    setIsModalOpen(true);
  };

  // Save Class Section
  const handleSaveClass = async (e) => {
    e.preventDefault();
    setFormError('');

    setModalLoading(true);
    try {
      const url = editingClass
        ? `/api/admin/classes/${editingClass.id}`
        : '/api/admin/classes';
      const method = editingClass ? 'PUT' : 'POST';

      const res = await authFetch(url, {
        method,
        body: JSON.stringify(formData)
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Operation failed.');
      }

      showToast(data.message || 'Class Section saved successfully!', 'success');
      setIsModalOpen(false);
      fetchClasses();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setModalLoading(false);
    }
  };

  // Delete Click
  const handleDeleteClick = (c) => {
    setClassToDelete(c);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!classToDelete) return;
    setDeleteLoading(true);
    try {
      const res = await authFetch(`/api/admin/classes/${classToDelete.id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to delete section.');
      }
      showToast(data.message || 'Section deleted.', 'success');
      setDeleteModalOpen(false);
      setClassToDelete(null);
      fetchClasses();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header & Add Button */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff' }}>Class & Section Hierarchy</h2>
          <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
            Structured Department → Year → Division mapping powering Timetables, Doubts & Academics
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-secondary" onClick={fetchClasses} title="Refresh">
            <RefreshCw size={16} className={loading ? 'spin' : ''} />
            <span>Refresh</span>
          </button>
          <button className="btn btn-primary" onClick={handleOpenAdd}>
            <Plus size={18} />
            <span>Create Class Section</span>
          </button>
        </div>
      </div>

      {/* Grid of Class Section Cards */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: '#94a3b8' }}>
          Loading class sections...
        </div>
      ) : classes.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: '#64748b', background: 'var(--bg-card)', borderRadius: '16px', border: '1px solid var(--border-subtle)' }}>
          No class sections created yet. Click "Create Class Section" above.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
          {classes.map((c) => (
            <div
              key={c.id}
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '16px',
                padding: '1.5rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'all 0.25s ease',
                position: 'relative'
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <span style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    background: 'rgba(99, 102, 241, 0.15)',
                    color: '#818cf8',
                    padding: '0.2rem 0.6rem',
                    borderRadius: '6px'
                  }}>
                    {c.year} – Div {c.division}
                  </span>
                  <div style={{ display: 'flex', gap: '0.35rem' }}>
                    <button className="btn-icon" onClick={() => handleOpenEdit(c)} title="Edit Section">
                      <Edit2 size={14} />
                    </button>
                    <button className="btn-icon btn-icon-danger" onClick={() => handleDeleteClick(c)} title="Delete Section">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff', marginBottom: '0.35rem' }}>
                  {c.department}
                </h3>
                <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '1.25rem' }}>
                  Section Identifier: <span style={{ fontFamily: 'monospace', color: '#cbd5e1' }}>{c.year}-{c.division}</span>
                </div>

                <div style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '10px',
                  padding: '0.75rem 1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <GraduationCap size={14} /> Enrolled Students
                    </span>
                    <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#10b981' }}>
                      {c.studentCount} Students
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <UserCheck size={14} /> Class Advisor
                    </span>
                    <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#f8fafc' }}>
                      {c.classTeacherName || 'Not Assigned'}
                    </span>
                  </div>
                </div>
              </div>

              <div style={{ marginTop: '1.25rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem', color: '#64748b' }}>
                <span>Mapping Active</span>
                <span>Part 2 Architecture</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Class Section Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => !modalLoading && setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: 'rgba(168, 85, 247, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#a855f7'
                }}>
                  <Layers size={20} />
                </div>
                <h3>{editingClass ? 'Edit Class Section' : 'Create Class Section'}</h3>
              </div>
              <button className="btn-icon" onClick={() => setIsModalOpen(false)} disabled={modalLoading}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveClass}>
              <div className="modal-body">
                {formError && (
                  <div style={{
                    padding: '0.75rem 1rem',
                    borderRadius: '8px',
                    background: 'rgba(244, 63, 94, 0.15)',
                    border: '1px solid rgba(244, 63, 94, 0.3)',
                    color: '#f43f5e',
                    fontSize: '0.82rem',
                    marginBottom: '1rem'
                  }}>
                    {formError}
                  </div>
                )}

                <div className="form-grid">
                  <div className="form-group form-group-full">
                    <label className="form-label">Department *</label>
                    <select
                      className="form-select"
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    >
                      {options.departments.map((dept) => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Academic Year *</label>
                    <select
                      className="form-select"
                      value={formData.year}
                      onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                    >
                      {options.academicYears.map((y) => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Division *</label>
                    <select
                      className="form-select"
                      value={formData.division}
                      onChange={(e) => setFormData({ ...formData, division: e.target.value })}
                    >
                      {options.divisions.map((div) => (
                        <option key={div} value={div}>Division {div}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group form-group-full">
                    <label className="form-label">Assigned Class Teacher / Advisor</label>
                    <select
                      className="form-select"
                      value={formData.classTeacherId}
                      onChange={(e) => setFormData({ ...formData, classTeacherId: e.target.value })}
                    >
                      <option value="">-- No Advisor Assigned --</option>
                      {options.facultyList.map((fac) => (
                        <option key={fac.id} value={fac.id}>{fac.name} ({fac.department})</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsModalOpen(false)}
                  disabled={modalLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={modalLoading}
                >
                  {modalLoading ? 'Saving...' : editingClass ? 'Update Section' : 'Create Section'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModalOpen}
        title="Delete Class Section"
        message={`Are you sure you want to delete ${classToDelete?.department} (${classToDelete?.year}-${classToDelete?.division})?`}
        confirmText="Delete Section"
        cancelText="Cancel"
        onConfirm={handleConfirmDelete}
        onClose={() => setDeleteModalOpen(false)}
        loading={deleteLoading}
      />
    </div>
  );
}
