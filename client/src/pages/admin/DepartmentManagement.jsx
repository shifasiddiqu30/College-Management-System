import React, { useState, useEffect, useCallback } from 'react';
import {
  Landmark,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  Power,
  CheckCircle2,
  AlertTriangle,
  Users2,
  GraduationCap,
  Layers,
  BookOpen,
  X,
  RefreshCw,
  Building,
  ShieldAlert
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import ConfirmModal from '../../components/admin/ConfirmModal';

export default function DepartmentManagement() {
  const { authFetch, showToast } = useAuth();

  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'Active' | 'Inactive'

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [formError, setFormError] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    hodName: '',
    status: 'Active'
  });

  // Delete State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deptToDelete, setDeptToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // In-Use Warning Modal State
  const [inUseModalOpen, setInUseModalOpen] = useState(false);
  const [inUseDept, setInUseDept] = useState(null);

  // Fetch Departments List
  const fetchDepartments = useCallback(async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (searchQuery.trim()) queryParams.append('q', searchQuery.trim());
      if (statusFilter !== 'ALL') queryParams.append('status', statusFilter);

      const res = await authFetch(`/api/admin/departments?${queryParams.toString()}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setDepartments(data.departments || []);
      } else {
        showToast(data.message || 'Failed to load departments', 'error');
      }
    } catch (err) {
      showToast('Error loading departments: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [authFetch, searchQuery, statusFilter, showToast]);

  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  // Open Add Modal
  const handleOpenAdd = () => {
    setEditingDept(null);
    setFormData({
      name: '',
      code: '',
      hodName: '',
      status: 'Active'
    });
    setFormError('');
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (dept) => {
    setEditingDept(dept);
    setFormData({
      name: dept.name,
      code: dept.code,
      hodName: dept.hodName || '',
      status: dept.status || 'Active'
    });
    setFormError('');
    setIsModalOpen(true);
  };

  // Submit Add / Edit Form
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.name.trim()) {
      setFormError('Department Name is required (e.g. Computer Engineering).');
      return;
    }
    if (!formData.code.trim()) {
      setFormError('Department Code is required (e.g. CE).');
      return;
    }

    setModalLoading(true);
    try {
      const url = editingDept ? `/api/admin/departments/${editingDept.id}` : '/api/admin/departments';
      const method = editingDept ? 'PUT' : 'POST';

      const res = await authFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast(data.message, 'success');
        setIsModalOpen(false);
        fetchDepartments();
      } else {
        setFormError(data.message || 'Operation failed.');
      }
    } catch (err) {
      setFormError('Network error: ' + err.message);
    } finally {
      setModalLoading(false);
    }
  };

  // Toggle Department Status (Active/Inactive)
  const handleToggleStatus = async (dept) => {
    try {
      const res = await authFetch(`/api/admin/departments/${dept.id}/status`, {
        method: 'PATCH'
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(data.message, 'success');
        fetchDepartments();
      } else {
        showToast(data.message || 'Failed to update status', 'error');
      }
    } catch (err) {
      showToast('Error updating status: ' + err.message, 'error');
    }
  };

  // Open Delete Confirmation or In-Use Alert
  const handleDeleteClick = (dept) => {
    if (!dept.canDelete) {
      setInUseDept(dept);
      setInUseModalOpen(true);
    } else {
      setDeptToDelete(dept);
      setDeleteModalOpen(true);
    }
  };

  // Confirm Delete
  const handleConfirmDelete = async () => {
    if (!deptToDelete) return;
    setDeleteLoading(true);
    try {
      const res = await authFetch(`/api/admin/departments/${deptToDelete.id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(data.message, 'success');
        setDeleteModalOpen(false);
        setDeptToDelete(null);
        fetchDepartments();
      } else {
        showToast(data.message || 'Failed to delete department', 'error');
        if (data.isInUse) {
          setDeleteModalOpen(false);
          setInUseDept(deptToDelete);
          setInUseModalOpen(true);
        }
      }
    } catch (err) {
      showToast('Error deleting department: ' + err.message, 'error');
    } finally {
      setDeleteLoading(false);
    }
  };

  // Quick Deactivate from In-Use Modal
  const handleDeactivateFromInUse = async () => {
    if (!inUseDept) return;
    await handleToggleStatus(inUseDept);
    setInUseModalOpen(false);
    setInUseDept(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Header Banner */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
        background: 'rgba(15, 23, 42, 0.65)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '16px',
        padding: '1.5rem',
        backdropFilter: 'blur(12px)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #a855f7, #6366f1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 20px rgba(168, 85, 247, 0.3)'
          }}>
            <Landmark size={24} color="#fff" />
          </div>
          <div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.01em' }}>
              Department Management
            </h1>
            <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
              Configure academic branches, codes, HOD allocations, and active status
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button className="btn btn-secondary" onClick={fetchDepartments} disabled={loading} title="Refresh">
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
          <button className="btn btn-primary" onClick={handleOpenAdd}>
            <Plus size={18} />
            <span>Add Department</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
        background: 'rgba(15, 23, 42, 0.5)',
        border: '1px solid rgba(255, 255, 255, 0.06)',
        borderRadius: '14px',
        padding: '1rem 1.25rem'
      }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: '1', minWidth: '240px', maxWidth: '420px' }}>
          <Search size={16} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
          <input
            type="text"
            className="form-input"
            placeholder="Search by name, code (CE, ME), or HOD..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: '2.5rem', width: '100%' }}
          />
        </div>

        {/* Status Filter Pills */}
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600 }}>Status:</span>
          {['ALL', 'Active', 'Inactive'].map((st) => (
            <button
              key={st}
              type="button"
              className={`tag-pill ${statusFilter === st ? 'active' : ''}`}
              onClick={() => setStatusFilter(st)}
              style={{
                cursor: 'pointer',
                background: statusFilter === st ? 'rgba(168, 85, 247, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                border: `1px solid ${statusFilter === st ? 'rgba(168, 85, 247, 0.5)' : 'rgba(255, 255, 255, 0.08)'}`,
                color: statusFilter === st ? '#c084fc' : '#94a3b8'
              }}
            >
              {st === 'ALL' ? 'All Departments' : st}
            </button>
          ))}
        </div>
      </div>

      {/* Departments Table / Cards */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
          <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 0.75rem auto' }} />
          <p>Loading departments database...</p>
        </div>
      ) : departments.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '3.5rem 1.5rem',
          background: 'rgba(15, 23, 42, 0.4)',
          border: '1px dashed rgba(255, 255, 255, 0.1)',
          borderRadius: '16px',
          color: '#94a3b8'
        }}>
          <Landmark size={40} style={{ margin: '0 auto 1rem auto', color: '#64748b' }} />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', marginBottom: '0.25rem' }}>No Departments Found</h3>
          <p style={{ fontSize: '0.85rem', marginBottom: '1.25rem' }}>
            {searchQuery ? 'No departments match your search criteria.' : 'No academic departments configured in the system yet.'}
          </p>
          <button className="btn btn-primary" onClick={handleOpenAdd}>
            <Plus size={16} />
            <span>Add First Department</span>
          </button>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Department Name</th>
                <th>Code</th>
                <th>Head of Department (HOD)</th>
                <th>Connected Records</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {departments.map((dept) => {
                const isActive = dept.status === 'Active';
                return (
                  <tr key={dept.id}>
                    {/* Name */}
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '10px',
                          background: isActive ? 'rgba(168, 85, 247, 0.15)' : 'rgba(100, 116, 139, 0.15)',
                          border: `1px solid ${isActive ? 'rgba(168, 85, 247, 0.3)' : 'rgba(100, 116, 139, 0.2)'}`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: isActive ? '#c084fc' : '#64748b'
                        }}>
                          <Building size={18} />
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, color: '#fff' }}>{dept.name}</div>
                          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>ID: {dept.id}</div>
                        </div>
                      </div>
                    </td>

                    {/* Code */}
                    <td>
                      <span style={{
                        padding: '0.25rem 0.6rem',
                        borderRadius: '6px',
                        background: 'rgba(99, 102, 241, 0.15)',
                        border: '1px solid rgba(99, 102, 241, 0.3)',
                        color: '#818cf8',
                        fontWeight: 700,
                        fontSize: '0.8rem',
                        letterSpacing: '0.04em'
                      }}>
                        {dept.code}
                      </span>
                    </td>

                    {/* HOD */}
                    <td>
                      <span style={{ color: dept.hodName ? '#e2e8f0' : '#64748b', fontSize: '0.9rem' }}>
                        {dept.hodName || 'Not Assigned'}
                      </span>
                    </td>

                    {/* Connected Records */}
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <span className="tag-pill" title={`${dept.studentCount} enrolled students`}>
                          <GraduationCap size={12} color="#10b981" />
                          <span>{dept.studentCount} Students</span>
                        </span>
                        <span className="tag-pill" title={`${dept.facultyCount} assigned faculty`}>
                          <Users2 size={12} color="#06b6d4" />
                          <span>{dept.facultyCount} Faculty</span>
                        </span>
                        <span className="tag-pill" title={`${dept.classCount} class sections`}>
                          <Layers size={12} color="#a855f7" />
                          <span>{dept.classCount} Classes</span>
                        </span>
                        <span className="tag-pill" title={`${dept.subjectCount} curriculum subjects`}>
                          <BookOpen size={12} color="#f59e0b" />
                          <span>{dept.subjectCount} Subjects</span>
                        </span>
                      </div>
                    </td>

                    {/* Status */}
                    <td>
                      <span
                        className={`status-badge ${isActive ? 'status-active' : 'status-inactive'}`}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                      >
                        <span style={{
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          background: isActive ? '#10b981' : '#94a3b8'
                        }} />
                        <span>{dept.status || 'Active'}</span>
                      </span>
                    </td>

                    {/* Actions */}
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.4rem', alignItems: 'center' }}>
                        {/* Edit */}
                        <button
                          type="button"
                          className="btn-icon"
                          onClick={() => handleOpenEdit(dept)}
                          title="Edit Department"
                          style={{
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '8px',
                            padding: '0.45rem',
                            color: '#e2e8f0',
                            cursor: 'pointer'
                          }}
                        >
                          <Edit2 size={15} />
                        </button>

                        {/* Toggle Status (Deactivate / Activate) */}
                        <button
                          type="button"
                          className="btn-icon"
                          onClick={() => handleToggleStatus(dept)}
                          title={isActive ? 'Deactivate Department' : 'Activate Department'}
                          style={{
                            background: isActive ? 'rgba(245, 158, 11, 0.12)' : 'rgba(16, 185, 129, 0.12)',
                            border: `1px solid ${isActive ? 'rgba(245, 158, 11, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
                            borderRadius: '8px',
                            padding: '0.45rem',
                            color: isActive ? '#f59e0b' : '#10b981',
                            cursor: 'pointer'
                          }}
                        >
                          <Power size={15} />
                        </button>

                        {/* Delete */}
                        <button
                          type="button"
                          className="btn-icon"
                          onClick={() => handleDeleteClick(dept)}
                          title={dept.canDelete ? 'Delete Department' : 'Department in use (Cannot delete)'}
                          style={{
                            background: 'rgba(244, 63, 94, 0.12)',
                            border: '1px solid rgba(244, 63, 94, 0.3)',
                            borderRadius: '8px',
                            padding: '0.45rem',
                            color: '#f43f5e',
                            cursor: 'pointer'
                          }}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Add / Edit Department Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #a855f7, #6366f1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Landmark size={18} color="#fff" />
                </div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff' }}>
                  {editingDept ? 'Edit Department' : 'Add New Department'}
                </h3>
              </div>
              <button className="btn-icon" onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            {formError && (
              <div style={{
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                background: 'rgba(244, 63, 94, 0.15)',
                border: '1px solid rgba(244, 63, 94, 0.3)',
                color: '#f43f5e',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '1rem'
              }}>
                <AlertTriangle size={16} />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Department Name */}
              <div className="form-group">
                <label className="form-label" htmlFor="dept-name">Department Name *</label>
                <input
                  id="dept-name"
                  type="text"
                  className="form-input"
                  placeholder="e.g. Computer Engineering"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              {/* Department Code & Status Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="dept-code">Department Code *</label>
                  <input
                    id="dept-code"
                    type="text"
                    className="form-input"
                    placeholder="e.g. CE, ME, AI&DS"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="dept-status">Status</label>
                  <select
                    id="dept-status"
                    className="form-input"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              {/* HOD Name */}
              <div className="form-group">
                <label className="form-label" htmlFor="dept-hod">Head of Department (HOD)</label>
                <input
                  id="dept-hod"
                  type="text"
                  className="form-input"
                  placeholder="e.g. Dr. Arthur Pendelton"
                  value={formData.hodName}
                  onChange={(e) => setFormData({ ...formData, hodName: e.target.value })}
                />
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.75rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={modalLoading}>
                  {modalLoading ? 'Saving...' : editingDept ? 'Save Changes' : 'Create Department'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Safe Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Department"
        message={`Are you sure you want to permanently delete '${deptToDelete?.name}' (${deptToDelete?.code})? This department has no dependent records and can be safely deleted.`}
        confirmText={deleteLoading ? 'Deleting...' : 'Delete Department'}
        type="danger"
      />

      {/* Department In-Use Protection Modal */}
      {inUseModalOpen && (
        <div className="modal-overlay" onClick={() => setInUseModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <div className="modal-header" style={{ borderColor: 'rgba(245, 158, 11, 0.3)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  background: 'rgba(245, 158, 11, 0.15)',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#f59e0b'
                }}>
                  <ShieldAlert size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff' }}>
                    Department Cannot Be Deleted
                  </h3>
                  <span style={{ fontSize: '0.8rem', color: '#f59e0b', fontWeight: 600 }}>Active Database Dependency Detected</span>
                </div>
              </div>
              <button className="btn-icon" onClick={() => setInUseModalOpen(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
              <p style={{ fontSize: '0.9rem', color: '#cbd5e1', lineHeight: '1.6' }}>
                The department <strong style={{ color: '#fff' }}>{inUseDept?.name}</strong> is currently connected to active records in the database:
              </p>

              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '0.75rem',
                background: 'rgba(15, 23, 42, 0.6)',
                padding: '1rem',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.08)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#10b981', fontSize: '0.85rem' }}>
                  <GraduationCap size={16} />
                  <span><strong>{inUseDept?.studentCount || 0}</strong> Students</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#06b6d4', fontSize: '0.85rem' }}>
                  <Users2 size={16} />
                  <span><strong>{inUseDept?.facultyCount || 0}</strong> Faculty</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#a855f7', fontSize: '0.85rem' }}>
                  <Layers size={16} />
                  <span><strong>{inUseDept?.classCount || 0}</strong> Classes</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#f59e0b', fontSize: '0.85rem' }}>
                  <BookOpen size={16} />
                  <span><strong>{inUseDept?.subjectCount || 0}</strong> Subjects</span>
                </div>
              </div>

              <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                To preserve academic and student records integrity, permanent deletion is blocked. You can safely <strong>Deactivate</strong> this department instead.
              </p>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setInUseModalOpen(false)}>
                  Close
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleDeactivateFromInUse}
                  style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}
                >
                  <Power size={16} />
                  <span>{inUseDept?.status === 'Active' ? 'Deactivate Department' : 'Toggle Status'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
