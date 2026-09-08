import React, { useState, useEffect, useCallback } from 'react';
import {
  Users2,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  X,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  BookOpen,
  Layers,
  Mail,
  ShieldCheck,
  Tag
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import ConfirmModal from '../../components/admin/ConfirmModal';

export default function FacultyManagement() {
  const { authFetch, showToast } = useAuth();

  const [facultyList, setFacultyList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [options, setOptions] = useState({
    departments: ['Computer Engineering', 'Information Technology', 'Electronics & Telecommunication', 'Mechanical Engineering', 'Civil Engineering', 'Artificial Intelligence & Data Science'],
    subjects: []
  });

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDept, setFilterDept] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterLectureStatus, setFilterLectureStatus] = useState('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFaculty, setEditingFaculty] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    department: 'Computer Engineering',
    assignedSubjectsInput: '',
    assignedClassesInput: '',
    status: 'ACTIVE'
  });
  const [formError, setFormError] = useState('');

  // Delete Confirm Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [facultyToDelete, setFacultyToDelete] = useState(null);
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
            subjects: data.subjects || []
          });
        }
      } catch (err) {
        console.error('Error loading options:', err);
      }
    }
    loadOptions();
  }, [authFetch]);

  // Fetch Faculty List
  const fetchFaculty = useCallback(async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (searchQuery.trim()) queryParams.append('q', searchQuery.trim());
      if (filterDept !== 'ALL') queryParams.append('department', filterDept);
      if (filterStatus !== 'ALL') queryParams.append('status', filterStatus);
      if (filterLectureStatus !== 'ALL') queryParams.append('lectureStatus', filterLectureStatus);

      const res = await authFetch(`/api/admin/faculty?${queryParams.toString()}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setFacultyList(data.faculty || []);
      }
    } catch (err) {
      showToast('Failed to load faculty: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [authFetch, searchQuery, filterDept, filterStatus, filterLectureStatus, showToast]);

  useEffect(() => {
    fetchFaculty();
  }, [fetchFaculty]);

  // Open Modal for Add
  const handleOpenAdd = () => {
    setEditingFaculty(null);
    setFormData({
      name: '',
      email: '',
      password: '',
      department: options.departments[0] || 'Computer Engineering',
      assignedSubjectsInput: 'Java Programming',
      assignedClassesInput: 'SE-B',
      status: 'ACTIVE'
    });
    setFormError('');
    setIsModalOpen(true);
  };

  // Open Modal for Edit
  const handleOpenEdit = (f) => {
    setEditingFaculty(f);
    setFormData({
      name: f.name,
      email: f.email,
      password: '',
      department: f.department || options.departments[0],
      assignedSubjectsInput: Array.isArray(f.assignedSubjects) ? f.assignedSubjects.join(', ') : '',
      assignedClassesInput: Array.isArray(f.assignedClasses) ? f.assignedClasses.join(', ') : '',
      status: f.status || 'ACTIVE'
    });
    setFormError('');
    setIsModalOpen(true);
  };

  // Save Faculty (Add / Edit)
  const handleSaveFaculty = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.name.trim()) return setFormError('Faculty name is required.');
    if (!formData.email.trim()) return setFormError('College email is required.');
    if (!editingFaculty && (!formData.password || formData.password.length < 6)) {
      return setFormError('Temporary password must be at least 6 characters.');
    }

    const assignedSubjects = formData.assignedSubjectsInput
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    const assignedClasses = formData.assignedClassesInput
      .split(',')
      .map(c => c.trim())
      .filter(Boolean);

    setModalLoading(true);
    try {
      const url = editingFaculty
        ? `/api/admin/faculty/${editingFaculty.id}`
        : '/api/admin/faculty';
      const method = editingFaculty ? 'PUT' : 'POST';

      const res = await authFetch(url, {
        method,
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim(),
          password: formData.password,
          department: formData.department,
          assignedSubjects,
          assignedClasses,
          status: formData.status
        })
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Operation failed.');
      }

      showToast(data.message || 'Faculty saved successfully!', 'success');
      setIsModalOpen(false);
      fetchFaculty();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setModalLoading(false);
    }
  };

  // Confirm Delete
  const handleDeleteClick = (faculty) => {
    setFacultyToDelete(faculty);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!facultyToDelete) return;
    setDeleteLoading(true);
    try {
      const res = await authFetch(`/api/admin/faculty/${facultyToDelete.id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to delete faculty.');
      }
      showToast(data.message || 'Faculty deleted successfully.', 'success');
      setDeleteModalOpen(false);
      setFacultyToDelete(null);
      fetchFaculty();
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
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff' }}>Faculty Directory</h2>
          <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
            Total {facultyList.length} faculty members & teaching appointments
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-secondary" onClick={fetchFaculty} title="Refresh">
            <RefreshCw size={16} className={loading ? 'spin' : ''} />
            <span>Refresh</span>
          </button>
          <button className="btn btn-primary" onClick={handleOpenAdd}>
            <Plus size={18} />
            <span>Add Faculty</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="toolbar">
        <div className="toolbar-search">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search faculty by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="toolbar-filters">
          <select
            className="filter-select"
            value={filterDept}
            onChange={(e) => setFilterDept(e.target.value)}
          >
            <option value="ALL">All Departments</option>
            {options.departments.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>

          <select
            className="filter-select"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="ALL">All Account Status</option>
            <option value="ACTIVE">Active Account</option>
            <option value="SUSPENDED">Suspended</option>
            <option value="PENDING">Pending</option>
          </select>

          <select
            className="filter-select"
            value={filterLectureStatus}
            onChange={(e) => setFilterLectureStatus(e.target.value)}
          >
            <option value="ALL">All Lecture Statuses</option>
            <option value="ACTIVE">🟢 In Lecture (Active)</option>
            <option value="INACTIVE">⚪ Available (Inactive)</option>
          </select>
        </div>
      </div>

      {/* Faculty Data Table */}
      <div className="table-container">
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Faculty Member</th>
                <th>Department</th>
                <th>Assigned Curriculum</th>
                <th>Account Status</th>
                <th>Lecture Status</th>
                <th>Current Activity (Real-Time)</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                    Loading faculty records...
                  </td>
                </tr>
              ) : facultyList.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
                    No faculty match your criteria.
                  </td>
                </tr>
              ) : (
                facultyList.map((faculty) => {
                  const isInLecture = faculty.lectureStatus === 'ACTIVE';
                  return (
                    <tr key={faculty.id}>
                      <td>
                        <div className="user-cell">
                          <div className="cell-avatar" style={{ background: 'linear-gradient(135deg, #06b6d4, #3b82f6)' }}>
                            {faculty.name.charAt(0)}
                          </div>
                          <div className="cell-info">
                            <div className="cell-name">{faculty.name}</div>
                            <div className="cell-sub">{faculty.email}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.85rem', color: '#cbd5e1', fontWeight: 500 }}>
                          {faculty.department}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', maxWidth: '240px' }}>
                          <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                            {faculty.assignedSubjects && faculty.assignedSubjects.length > 0 ? (
                              faculty.assignedSubjects.map((sub, idx) => (
                                <span key={idx} className="tag-pill" style={{ background: 'rgba(99, 102, 241, 0.1)', color: '#818cf8', borderColor: 'rgba(99, 102, 241, 0.2)', fontSize: '0.72rem' }}>
                                  {sub}
                                </span>
                              ))
                            ) : (
                              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>No subjects</span>
                            )}
                          </div>
                          <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                            {faculty.assignedClasses && faculty.assignedClasses.map((cls, idx) => (
                              <span key={idx} style={{ fontSize: '0.7rem', color: '#94a3b8', background: 'rgba(255,255,255,0.05)', padding: '0.1rem 0.35rem', borderRadius: '4px' }}>
                                {cls}
                              </span>
                            ))}
                          </div>
                        </div>
                      </td>

                      {/* Account Status (Independent) */}
                      <td>
                        <span className={`badge badge-${faculty.status?.toLowerCase()}`}>
                          {faculty.status}
                        </span>
                      </td>

                      {/* Real-Time Lecture Status */}
                      <td>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          padding: '0.25rem 0.65rem',
                          borderRadius: '9999px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          background: isInLecture ? 'rgba(16, 185, 129, 0.15)' : 'rgba(100, 116, 139, 0.15)',
                          border: `1px solid ${isInLecture ? 'rgba(16, 185, 129, 0.4)' : 'rgba(100, 116, 139, 0.3)'}`,
                          color: isInLecture ? '#10b981' : '#94a3b8'
                        }}>
                          <span style={{
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            background: isInLecture ? '#10b981' : '#64748b',
                            boxShadow: isInLecture ? '0 0 8px #10b981' : 'none'
                          }} />
                          <span>{isInLecture ? 'ACTIVE' : 'INACTIVE'}</span>
                        </span>
                      </td>

                      {/* Current Activity */}
                      <td>
                        {faculty.currentActivity ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#10b981' }}>
                              {faculty.currentActivity.subject}
                            </div>
                            <div style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
                              {faculty.currentActivity.class} • Room {faculty.currentActivity.room} • {faculty.currentActivity.startTime}–{faculty.currentActivity.endTime}
                            </div>
                          </div>
                        ) : (
                          <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                            <span>No current lecture</span>
                            {faculty.upcomingActivity && (
                              <div style={{ fontSize: '0.72rem', color: '#06b6d4', marginTop: '0.1rem' }}>
                                Upcoming: {faculty.upcomingActivity.subject} ({faculty.upcomingActivity.startTime})
                              </div>
                            )}
                          </div>
                        )}
                      </td>

                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                          <button
                            className="btn-icon"
                            onClick={() => handleOpenEdit(faculty)}
                            title="Edit Faculty"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            className="btn-icon btn-icon-danger"
                            onClick={() => handleDeleteClick(faculty)}
                            title="Delete Faculty"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Faculty Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => !modalLoading && setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: 'rgba(6, 182, 212, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#06b6d4'
                }}>
                  <Users2 size={20} />
                </div>
                <h3>{editingFaculty ? 'Edit Faculty Details' : 'Register New Faculty'}</h3>
              </div>
              <button className="btn-icon" onClick={() => setIsModalOpen(false)} disabled={modalLoading}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveFaculty}>
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
                    <label className="form-label">Faculty Full Name *</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Sharma Ma'am or Prof. Robert Downey"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group form-group-full">
                    <label className="form-label">College Email Address *</label>
                    <input
                      type="email"
                      className="form-input"
                      placeholder="e.g. sharma@college.edu"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group form-group-full">
                    <label className="form-label">
                      {editingFaculty ? 'Change Password (leave empty to keep current)' : 'Temporary Password (min 6 chars) *'}
                    </label>
                    <input
                      type="password"
                      className="form-input"
                      placeholder={editingFaculty ? '••••••••' : 'Enter temporary password'}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      {...(!editingFaculty && { required: true })}
                    />
                  </div>

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

                  <div className="form-group form-group-full">
                    <label className="form-label">Assigned Subjects (comma-separated)</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Java Programming, Database Management Systems"
                      value={formData.assignedSubjectsInput}
                      onChange={(e) => setFormData({ ...formData, assignedSubjectsInput: e.target.value })}
                    />
                    <span style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.2rem' }}>
                      Separate multiple subjects with commas
                    </span>
                  </div>

                  <div className="form-group form-group-full">
                    <label className="form-label">Assigned Classes (comma-separated)</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. SE-B, TE-A, BE-A"
                      value={formData.assignedClassesInput}
                      onChange={(e) => setFormData({ ...formData, assignedClassesInput: e.target.value })}
                    />
                  </div>

                  <div className="form-group form-group-full">
                    <label className="form-label">Status</label>
                    <select
                      className="form-select"
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    >
                      <option value="ACTIVE">Active</option>
                      <option value="SUSPENDED">Suspended</option>
                      <option value="PENDING">Pending</option>
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
                  {modalLoading ? 'Saving...' : editingFaculty ? 'Update Faculty' : 'Register Faculty'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModalOpen}
        title="Delete Faculty"
        message={`Are you sure you want to remove faculty member '${facultyToDelete?.name}' (${facultyToDelete?.email})? This action cannot be undone.`}
        confirmText="Delete Faculty"
        cancelText="Cancel"
        onConfirm={handleConfirmDelete}
        onClose={() => setDeleteModalOpen(false)}
        loading={deleteLoading}
      />
    </div>
  );
}
