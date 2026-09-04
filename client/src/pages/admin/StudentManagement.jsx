import React, { useState, useEffect, useCallback } from 'react';
import {
  GraduationCap,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  X,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  MoreVertical,
  Mail,
  User,
  Shield,
  Layers,
  Key
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import ConfirmModal from '../../components/admin/ConfirmModal';

export default function StudentManagement() {
  const { authFetch, showToast } = useAuth();

  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [options, setOptions] = useState({
    departments: ['Computer Engineering', 'Information Technology', 'Electronics & Telecommunication', 'Mechanical Engineering', 'Civil Engineering', 'Artificial Intelligence & Data Science'],
    academicYears: ['FE', 'SE', 'TE', 'BE'],
    divisions: ['A', 'B', 'C', 'D']
  });

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDept, setFilterDept] = useState('ALL');
  const [filterYear, setFilterYear] = useState('ALL');
  const [filterDiv, setFilterDiv] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    department: 'Computer Engineering',
    year: 'SE',
    division: 'B',
    rollNumber: '',
    status: 'ACTIVE'
  });
  const [formError, setFormError] = useState('');

  // Delete Confirm Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState(null);
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
            divisions: data.divisions || options.divisions
          });
        }
      } catch (err) {
        console.error('Error fetching admin options:', err);
      }
    }
    loadOptions();
  }, [authFetch]);

  // Fetch Students
  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (searchQuery.trim()) queryParams.append('q', searchQuery.trim());
      if (filterDept !== 'ALL') queryParams.append('department', filterDept);
      if (filterYear !== 'ALL') queryParams.append('year', filterYear);
      if (filterDiv !== 'ALL') queryParams.append('division', filterDiv);
      if (filterStatus !== 'ALL') queryParams.append('status', filterStatus);

      const res = await authFetch(`/api/admin/students?${queryParams.toString()}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setStudents(data.students || []);
      }
    } catch (err) {
      showToast('Failed to load students: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [authFetch, searchQuery, filterDept, filterYear, filterDiv, filterStatus, showToast]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  // Open Modal for Add
  const handleOpenAdd = () => {
    setEditingStudent(null);
    setFormData({
      name: '',
      email: '',
      password: '',
      department: options.departments[0] || 'Computer Engineering',
      year: 'SE',
      division: 'B',
      rollNumber: '',
      status: 'ACTIVE'
    });
    setFormError('');
    setIsModalOpen(true);
  };

  // Open Modal for Edit
  const handleOpenEdit = (student) => {
    setEditingStudent(student);
    setFormData({
      name: student.name,
      email: student.email,
      password: '', // Leave blank unless changing
      department: student.department || options.departments[0],
      year: student.year || 'SE',
      division: student.division || 'A',
      rollNumber: student.rollNumber || '',
      status: student.status || 'ACTIVE'
    });
    setFormError('');
    setIsModalOpen(true);
  };

  // Save Student (Add / Edit)
  const handleSaveStudent = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.name.trim()) return setFormError('Student full name is required.');
    if (!formData.email.trim()) return setFormError('College email is required.');
    if (!formData.rollNumber.trim()) return setFormError('Roll number is required.');
    if (!editingStudent && (!formData.password || formData.password.length < 6)) {
      return setFormError('Temporary password must be at least 6 characters.');
    }

    setModalLoading(true);
    try {
      const url = editingStudent
        ? `/api/admin/students/${editingStudent.id}`
        : '/api/admin/students';
      const method = editingStudent ? 'PUT' : 'POST';

      const res = await authFetch(url, {
        method,
        body: JSON.stringify(formData)
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Operation failed.');
      }

      showToast(data.message || 'Student saved successfully!', 'success');
      setIsModalOpen(false);
      fetchStudents();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setModalLoading(false);
    }
  };

  // Confirm Delete
  const handleDeleteClick = (student) => {
    setStudentToDelete(student);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!studentToDelete) return;
    setDeleteLoading(true);
    try {
      const res = await authFetch(`/api/admin/students/${studentToDelete.id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to delete student.');
      }
      showToast(data.message || 'Student deleted successfully.', 'success');
      setDeleteModalOpen(false);
      setStudentToDelete(null);
      fetchStudents();
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
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff' }}>Student Directory</h2>
          <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
            Total {students.length} students currently enrolled
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-secondary" onClick={fetchStudents} title="Refresh">
            <RefreshCw size={16} className={loading ? 'spin' : ''} />
            <span>Refresh</span>
          </button>
          <button className="btn btn-primary" onClick={handleOpenAdd}>
            <Plus size={18} />
            <span>Add Student</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="toolbar">
        <div className="toolbar-search">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search by name, college email, roll number..."
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
            value={filterYear}
            onChange={(e) => setFilterYear(e.target.value)}
          >
            <option value="ALL">All Years</option>
            {options.academicYears.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>

          <select
            className="filter-select"
            value={filterDiv}
            onChange={(e) => setFilterDiv(e.target.value)}
          >
            <option value="ALL">All Divisions</option>
            {options.divisions.map((div) => (
              <option key={div} value={div}>Division {div}</option>
            ))}
          </select>

          <select
            className="filter-select"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="ALL">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="SUSPENDED">Suspended</option>
            <option value="PENDING">Pending</option>
          </select>
        </div>
      </div>

      {/* Student Data Table */}
      <div className="table-container">
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Student Profile</th>
                <th>Department</th>
                <th>Academic Year & Div</th>
                <th>Roll No</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                    Loading student records...
                  </td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
                    No students match your search or filter criteria.
                  </td>
                </tr>
              ) : (
                students.map((student) => (
                  <tr key={student.id}>
                    <td>
                      <div className="user-cell">
                        <div className="cell-avatar">
                          {student.name.charAt(0)}
                        </div>
                        <div className="cell-info">
                          <div className="cell-name">{student.name}</div>
                          <div className="cell-sub">{student.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>{student.department}</span>
                    </td>
                    <td>
                      <span style={{ fontWeight: 600, color: '#f8fafc' }}>
                        {student.year} – Division {student.division}
                      </span>
                    </td>
                    <td>
                      <span className="tag-pill" style={{ fontFamily: 'monospace', fontWeight: 600 }}>
                        #{student.rollNumber}
                      </span>
                    </td>
                    <td>
                      <span className={`badge badge-${student.status?.toLowerCase()}`}>
                        {student.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                        <button
                          className="btn-icon"
                          onClick={() => handleOpenEdit(student)}
                          title="Edit Student"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          className="btn-icon btn-icon-danger"
                          onClick={() => handleDeleteClick(student)}
                          title="Delete Student"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Student Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => !modalLoading && setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: 'rgba(99, 102, 241, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#818cf8'
                }}>
                  <GraduationCap size={20} />
                </div>
                <h3>{editingStudent ? 'Edit Student Profile' : 'Enroll New Student'}</h3>
              </div>
              <button className="btn-icon" onClick={() => setIsModalOpen(false)} disabled={modalLoading}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveStudent}>
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
                    <label className="form-label">Full Name *</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Shifa Siddiqui"
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
                      placeholder="e.g. student@college.edu"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group form-group-full">
                    <label className="form-label">
                      {editingStudent ? 'Change Password (leave empty to keep current)' : 'Temporary Password (min 6 chars) *'}
                    </label>
                    <input
                      type="password"
                      className="form-input"
                      placeholder={editingStudent ? '••••••••' : 'Enter temporary password'}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      {...(!editingStudent && { required: true })}
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

                  <div className="form-group">
                    <label className="form-label">Roll Number *</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. 23 or CS2024042"
                      value={formData.rollNumber}
                      onChange={(e) => setFormData({ ...formData, rollNumber: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Account Status</label>
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
                  {modalLoading ? 'Saving...' : editingStudent ? 'Update Student' : 'Enroll Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModalOpen}
        title="Delete Student"
        message={`Are you sure you want to delete student '${studentToDelete?.name}' (${studentToDelete?.email})? This action cannot be undone.`}
        confirmText="Delete Student"
        cancelText="Cancel"
        onConfirm={handleConfirmDelete}
        onClose={() => setDeleteModalOpen(false)}
        loading={deleteLoading}
      />
    </div>
  );
}
