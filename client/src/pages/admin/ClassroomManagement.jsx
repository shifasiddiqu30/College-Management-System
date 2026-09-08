import React, { useState, useEffect, useCallback } from 'react';
import {
  Building2,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  X,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Projector,
  Users,
  MapPin,
  Layers
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import ConfirmModal from '../../components/admin/ConfirmModal';
import DepartmentFolderTabs from '../../components/common/DepartmentFolderTabs';
import { useNavigate } from 'react-router-dom';

export default function ClassroomManagement() {
  const { authFetch, showToast } = useAuth();
  const navigate = useNavigate();

  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [options, setOptions] = useState({
    classroomTypes: ['Classroom', 'Computer Lab', 'Electronics Lab', 'Seminar Hall', 'Laboratory', 'Auditorium', 'Drawing Hall']
  });

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterLectureStatus, setFilterLectureStatus] = useState('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    roomNumber: '',
    classroomType: 'Classroom',
    building: 'Engineering Block A',
    floor: '1st Floor',
    capacity: '60',
    status: 'Active',
    hasProjector: true
  });
  const [formError, setFormError] = useState('');

  // Delete Confirm Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [roomToDelete, setRoomToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Fetch Options
  useEffect(() => {
    async function loadOptions() {
      try {
        const res = await authFetch('/api/admin/options');
        const data = await res.json();
        if (res.ok && data.success && data.classroomTypes) {
          setOptions({ classroomTypes: data.classroomTypes });
        }
      } catch (err) {
        console.error('Error fetching room options:', err);
      }
    }
    loadOptions();
  }, [authFetch]);

  // Fetch Classrooms
  const fetchClassrooms = useCallback(async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (searchQuery.trim()) queryParams.append('q', searchQuery.trim());
      if (filterType !== 'ALL') queryParams.append('type', filterType);
      if (filterStatus !== 'ALL') queryParams.append('status', filterStatus);
      if (filterLectureStatus !== 'ALL') queryParams.append('lectureStatus', filterLectureStatus);

      const res = await authFetch(`/api/admin/classrooms?${queryParams.toString()}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setClassrooms(data.classrooms || []);
      }
    } catch (err) {
      showToast('Failed to load classrooms: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [authFetch, searchQuery, filterType, filterStatus, filterLectureStatus, showToast]);

  useEffect(() => {
    fetchClassrooms();
  }, [fetchClassrooms]);

  // Open Modal for Add
  const handleOpenAdd = () => {
    setEditingRoom(null);
    setFormData({
      roomNumber: '',
      classroomType: 'Classroom',
      building: 'Engineering Block A',
      floor: '3rd Floor',
      capacity: '60',
      status: 'Active',
      hasProjector: true
    });
    setFormError('');
    setIsModalOpen(true);
  };

  // Open Modal for Edit
  const handleOpenEdit = (room) => {
    setEditingRoom(room);
    setFormData({
      roomNumber: room.roomNumber,
      classroomType: room.classroomType || 'Classroom',
      building: room.building || 'Main Block',
      floor: room.floor || '1st Floor',
      capacity: String(room.capacity || 60),
      status: room.status || 'Active',
      hasProjector: !!room.hasProjector
    });
    setFormError('');
    setIsModalOpen(true);
  };

  // Save Classroom
  const handleSaveClassroom = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.roomNumber.trim()) return setFormError('Room number is required (e.g. Room 301).');
    if (!formData.building.trim()) return setFormError('Building or block is required.');
    if (!formData.capacity || isNaN(formData.capacity) || Number(formData.capacity) <= 0) {
      return setFormError('Please enter a valid positive seating capacity.');
    }

    setModalLoading(true);
    try {
      const url = editingRoom
        ? `/api/admin/classrooms/${editingRoom.id}`
        : '/api/admin/classrooms';
      const method = editingRoom ? 'PUT' : 'POST';

      const res = await authFetch(url, {
        method,
        body: JSON.stringify({
          roomNumber: formData.roomNumber.trim(),
          classroomType: formData.classroomType,
          building: formData.building.trim(),
          floor: formData.floor.trim(),
          capacity: Number(formData.capacity),
          status: formData.status,
          hasProjector: formData.hasProjector ? 1 : 0
        })
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Operation failed.');
      }

      showToast(data.message || 'Classroom saved successfully!', 'success');
      setIsModalOpen(false);
      fetchClassrooms();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setModalLoading(false);
    }
  };

  // Delete Click
  const handleDeleteClick = (room) => {
    setRoomToDelete(room);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!roomToDelete) return;
    setDeleteLoading(true);
    try {
      const res = await authFetch(`/api/admin/classrooms/${roomToDelete.id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to delete classroom.');
      }
      showToast(data.message || 'Classroom deleted.', 'success');
      setDeleteModalOpen(false);
      setRoomToDelete(null);
      fetchClassrooms();
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
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff' }}>Classroom & Facility Management</h2>
          <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
            Total {classrooms.length} registered campus rooms and laboratories
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-secondary" onClick={fetchClassrooms} title="Refresh">
            <RefreshCw size={16} className={loading ? 'spin' : ''} />
            <span>Refresh</span>
          </button>
          <button className="btn btn-primary" onClick={handleOpenAdd}>
            <Plus size={18} />
            <span>Add Classroom</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="toolbar">
        <div className="toolbar-search">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search by room number, building, floor..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="toolbar-filters">
          <select
            className="filter-select"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="ALL">All Facility Types</option>
            {options.classroomTypes.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>

          <select
            className="filter-select"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="ALL">All Room Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>

          <select
            className="filter-select"
            value={filterLectureStatus}
            onChange={(e) => setFilterLectureStatus(e.target.value)}
          >
            <option value="ALL">All Lecture Statuses</option>
            <option value="ACTIVE">🔴 Occupied (Active Lecture)</option>
            <option value="INACTIVE">🟢 Available (Free)</option>
          </select>
        </div>
      </div>

      {/* Classroom Data Table */}
      <div className="table-container">
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Room Identifier</th>
                <th>Type & Equipment</th>
                <th>Building & Floor</th>
                <th>Capacity</th>
                <th>Room Status</th>
                <th>Live Lecture Status</th>
                <th>Current Activity (Real-Time)</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                    Loading classroom records...
                  </td>
                </tr>
              ) : classrooms.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
                    No classrooms found matching criteria.
                  </td>
                </tr>
              ) : (
                classrooms.map((room) => {
                  const isOccupied = room.currentLectureStatus === 'ACTIVE' || room.availabilityStatus === 'OCCUPIED';
                  return (
                    <tr key={room.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                          <div style={{
                            width: '34px',
                            height: '34px',
                            borderRadius: '8px',
                            background: 'rgba(99, 102, 241, 0.15)',
                            border: '1px solid rgba(99, 102, 241, 0.25)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#818cf8',
                            fontWeight: 700,
                            fontSize: '0.82rem'
                          }}>
                            <Building2 size={18} />
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, color: '#fff', fontSize: '0.92rem' }}>{room.roomNumber}</div>
                            <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>ID: {room.id}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                          <span className="tag-pill" style={{ background: 'rgba(255, 255, 255, 0.05)', color: '#cbd5e1' }}>
                            {room.classroomType}
                          </span>
                          {room.hasProjector ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.72rem', color: '#10b981' }}>
                              <CheckCircle2 size={13} /> Projector
                            </span>
                          ) : (
                            <span style={{ fontSize: '0.72rem', color: '#64748b' }}>Standard</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontSize: '0.85rem', color: '#f8fafc', fontWeight: 500 }}>{room.building}</div>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{room.floor}</div>
                      </td>
                      <td>
                        <span style={{ fontWeight: 700, color: '#fff', fontSize: '0.95rem' }}>
                          {room.capacity}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: '#94a3b8', marginLeft: '0.25rem' }}>Seats</span>
                      </td>

                      {/* Room Operating Status */}
                      <td>
                        <span className={`badge badge-${room.status === 'Active' ? 'active' : 'inactive'}`}>
                          {room.status}
                        </span>
                      </td>

                      {/* Live Lecture Status */}
                      <td>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          padding: '0.25rem 0.65rem',
                          borderRadius: '9999px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          background: isOccupied ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                          border: `1px solid ${isOccupied ? 'rgba(239, 68, 68, 0.4)' : 'rgba(16, 185, 129, 0.4)'}`,
                          color: isOccupied ? '#f87171' : '#34d399'
                        }}>
                          <span style={{
                            width: '7px',
                            height: '7px',
                            borderRadius: '50%',
                            background: isOccupied ? '#ef4444' : '#10b981',
                            boxShadow: isOccupied ? '0 0 8px #ef4444' : '0 0 8px #10b981'
                          }} />
                          {isOccupied ? 'OCCUPIED' : 'AVAILABLE'}
                        </span>
                      </td>

                      {/* Current Activity */}
                      <td>
                        {room.currentActivity ? (
                          <div style={{ fontSize: '0.8rem', lineHeight: 1.4 }}>
                            <div style={{ fontWeight: 700, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                              <span>{room.currentActivity.subjectName}</span>
                              <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>({room.currentActivity.subjectCode})</span>
                            </div>
                            <div style={{ fontSize: '0.74rem', color: '#cbd5e1' }}>
                              {room.currentActivity.year} {room.currentActivity.department} - Div {room.currentActivity.division}
                            </div>
                            <div style={{ fontSize: '0.72rem', color: '#818cf8', fontWeight: 600 }}>
                              Faculty: {room.currentActivity.facultyName} • {room.currentActivity.startTime} - {room.currentActivity.endTime}
                            </div>
                          </div>
                        ) : (
                          <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                            No active lecture
                          </div>
                        )}
                      </td>

                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                          <button
                            className="btn-icon"
                            onClick={() => handleOpenEdit(room)}
                            title="Edit Classroom"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            className="btn-icon btn-icon-danger"
                            onClick={() => handleDeleteClick(room)}
                            title="Delete Classroom"
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

      {/* Add / Edit Classroom Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => !modalLoading && setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: 'rgba(16, 185, 129, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#10b981'
                }}>
                  <Building2 size={20} />
                </div>
                <h3>{editingRoom ? 'Edit Classroom' : 'Create New Classroom'}</h3>
              </div>
              <button className="btn-icon" onClick={() => setIsModalOpen(false)} disabled={modalLoading}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveClassroom}>
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
                    <label className="form-label">Room Number / Identifier *</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Room 301 or Lab 201"
                      value={formData.roomNumber}
                      onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Classroom Type *</label>
                    <select
                      className="form-select"
                      value={formData.classroomType}
                      onChange={(e) => setFormData({ ...formData, classroomType: e.target.value })}
                    >
                      {options.classroomTypes.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Seating Capacity *</label>
                    <input
                      type="number"
                      className="form-input"
                      placeholder="e.g. 70"
                      min="1"
                      max="1000"
                      value={formData.capacity}
                      onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Building / Block *</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Engineering Block A"
                      value={formData.building}
                      onChange={(e) => setFormData({ ...formData, building: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Floor</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Ground Floor, 1st Floor, 3rd Floor"
                      value={formData.floor}
                      onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Operating Status</label>
                    <select
                      className="form-select"
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>

                  <div className="form-group" style={{ justifyContent: 'center' }}>
                    <label className="form-label" style={{ marginBottom: '0.5rem' }}>Audio-Visual Equipment</label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem' }}>
                      <input
                        type="checkbox"
                        checked={formData.hasProjector}
                        onChange={(e) => setFormData({ ...formData, hasProjector: e.target.checked })}
                      />
                      <span>Equipped with HD Projector</span>
                    </label>
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
                  {modalLoading ? 'Saving...' : editingRoom ? 'Update Classroom' : 'Create Classroom'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModalOpen}
        title="Delete Classroom"
        message={`Are you sure you want to delete classroom '${roomToDelete?.roomNumber}' (${roomToDelete?.building})? Any timetable allocations to this room may be affected.`}
        confirmText="Delete Room"
        cancelText="Cancel"
        onConfirm={handleConfirmDelete}
        onClose={() => setDeleteModalOpen(false)}
        loading={deleteLoading}
      />
    </div>
  );
}
