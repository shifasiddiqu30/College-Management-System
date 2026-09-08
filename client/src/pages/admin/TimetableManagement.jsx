import React, { useState, useEffect, useCallback } from 'react';
import {
  CalendarCheck,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  X,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Clock,
  Building2,
  Users2,
  BookOpen,
  Layers,
  LayoutGrid,
  List,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import ConfirmModal from '../../components/admin/ConfirmModal';
import DepartmentFolderTabs from '../../components/common/DepartmentFolderTabs';

export default function TimetableManagement() {
  const { authFetch, showToast } = useAuth();

  const [timetables, setTimetables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'

  const [options, setOptions] = useState({
    departments: ['Computer Engineering', 'Information Technology', 'Electronics & Telecommunication', 'Mechanical Engineering', 'Civil Engineering', 'Artificial Intelligence & Data Science'],
    academicYears: ['FE', 'SE', 'TE', 'BE'],
    divisions: ['A', 'B', 'C', 'D'],
    subjects: [],
    facultyList: [],
    classrooms: [],
    classes: []
  });

  // Filters
  const [filterDept, setFilterDept] = useState('Computer Engineering');
  const [filterYear, setFilterYear] = useState('SE');
  const [filterDiv, setFilterDiv] = useState('B');
  const [filterDay, setFilterDay] = useState('ALL');
  const [filterFaculty, setFilterFaculty] = useState('ALL');
  const [filterClassroom, setFilterClassroom] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [formError, setFormError] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    dayOfWeek: 'Monday',
    startTime: '10:00',
    endTime: '11:00',
    department: 'Computer Engineering',
    year: 'SE',
    division: 'B',
    subjectId: '',
    facultyId: '',
    classroomId: '',
    periodNumber: 1
  });

  // Delete Confirm State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

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
            subjects: data.subjects || [],
            facultyList: data.facultyList || [],
            classrooms: data.classrooms || [],
            classes: data.classes || []
          });
        }
      } catch (err) {
        console.error('Error fetching admin options:', err);
      }
    }
    loadOptions();
  }, [authFetch]);

  // Fetch Timetables
  const fetchTimetables = useCallback(async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (filterDept !== 'ALL') queryParams.append('department', filterDept);
      if (filterYear !== 'ALL') queryParams.append('year', filterYear);
      if (filterDiv !== 'ALL') queryParams.append('division', filterDiv);
      if (filterDay !== 'ALL') queryParams.append('day', filterDay);
      if (filterFaculty !== 'ALL') queryParams.append('facultyId', filterFaculty);
      if (filterClassroom !== 'ALL') queryParams.append('classroomId', filterClassroom);
      if (searchQuery.trim()) queryParams.append('q', searchQuery.trim());

      const res = await authFetch(`/api/admin/timetable?${queryParams.toString()}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setTimetables(data.timetables || []);
      }
    } catch (err) {
      showToast('Failed to load timetable: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [authFetch, filterDept, filterYear, filterDiv, filterDay, filterFaculty, filterClassroom, searchQuery, showToast]);

  useEffect(() => {
    fetchTimetables();
  }, [fetchTimetables]);

  // Open Modal for Add
  const handleOpenAdd = () => {
    setEditingEntry(null);
    setFormData({
      dayOfWeek: filterDay !== 'ALL' ? filterDay : 'Monday',
      startTime: '10:00',
      endTime: '11:00',
      department: filterDept !== 'ALL' ? filterDept : 'Computer Engineering',
      year: filterYear !== 'ALL' ? filterYear : 'SE',
      division: filterDiv !== 'ALL' ? filterDiv : 'B',
      subjectId: options.subjects[0]?.id || '',
      facultyId: options.facultyList[0]?.id || '',
      classroomId: options.classrooms[0]?.id || '',
      periodNumber: 1
    });
    setFormError('');
    setIsModalOpen(true);
  };

  // Open Modal for Edit
  const handleOpenEdit = (entry) => {
    setEditingEntry(entry);
    setFormData({
      dayOfWeek: entry.dayOfWeek,
      startTime: entry.startTime,
      endTime: entry.endTime,
      department: entry.department || 'Computer Engineering',
      year: entry.year || 'SE',
      division: entry.division || 'B',
      subjectId: entry.subjectId || '',
      facultyId: entry.facultyId || '',
      classroomId: entry.classroomId || '',
      periodNumber: entry.periodNumber || 1
    });
    setFormError('');
    setIsModalOpen(true);
  };

  // Save Timetable Entry
  const handleSaveEntry = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.subjectId) return setFormError('Please select a Subject.');
    if (!formData.facultyId) return setFormError('Please select an Assigned Faculty member.');
    if (!formData.classroomId) return setFormError('Please select a Classroom / Lab.');
    if (formData.startTime >= formData.endTime) return setFormError('Start time must be before End time.');

    setModalLoading(true);
    try {
      const url = editingEntry
        ? `/api/admin/timetable/${editingEntry.id}`
        : '/api/admin/timetable';
      const method = editingEntry ? 'PUT' : 'POST';

      const res = await authFetch(url, {
        method,
        body: JSON.stringify(formData)
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to save timetable slot.');
      }

      showToast(data.message || 'Timetable slot scheduled successfully!', 'success');
      setIsModalOpen(false);
      fetchTimetables();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setModalLoading(false);
    }
  };

  // Delete Click
  const handleDeleteClick = (entry) => {
    setEntryToDelete(entry);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!entryToDelete) return;
    setDeleteLoading(true);
    try {
      const res = await authFetch(`/api/admin/timetable/${entryToDelete.id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to delete timetable entry.');
      }
      showToast(data.message || 'Timetable entry deleted.', 'success');
      setDeleteModalOpen(false);
      setEntryToDelete(null);
      fetchTimetables();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setDeleteLoading(false);
    }
  };

  // Standard College Time Slots
  const baseTimeSlots = [
    { label: '09:00 AM – 10:00 AM', start: '09:00', end: '10:00', period: 'Period 1' },
    { label: '10:00 AM – 11:00 AM', start: '10:00', end: '11:00', period: 'Period 2' },
    { label: '11:15 AM – 12:15 PM', start: '11:15', end: '12:15', period: 'Period 3' },
    { label: '12:15 PM – 01:15 PM', start: '12:15', end: '13:15', period: 'Period 4' },
    { label: '02:00 PM – 03:00 PM', start: '14:00', end: '15:00', period: 'Period 5' },
    { label: '03:00 PM – 04:00 PM', start: '15:00', end: '16:00', period: 'Period 6' },
    { label: '04:15 PM – 05:15 PM', start: '16:15', end: '17:15', period: 'Period 7' }
  ];

  // Derive all active time slots from timetable entries if any custom slot exists
  const activeTimeSlots = [...baseTimeSlots];
  timetables.forEach((t) => {
    if (!activeTimeSlots.some((s) => s.start === t.startTime && s.end === t.endTime)) {
      activeTimeSlots.push({
        label: `${t.startTime} – ${t.endTime}`,
        start: t.startTime,
        end: t.endTime,
        period: `Period ${t.periodNumber || ''}`
      });
    }
  });
  activeTimeSlots.sort((a, b) => a.start.localeCompare(b.start));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Header & Controls */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 800, padding: '0.2rem 0.6rem', borderRadius: '999px', background: 'rgba(99, 102, 241, 0.2)', color: '#818cf8', letterSpacing: '0.06em' }}>
              OFFICIAL STUDENT SCHEDULE
            </span>
          </div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff' }}>
            TIMETABLE FOR STUDENTS — {filterDept === 'ALL' ? 'All Departments' : filterDept}
          </h2>
          <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
            {filterDept !== 'ALL' ? `${filterDept} • Year: ${filterYear} • Division: ${filterDiv}` : 'Official master weekly lecture schedules, automated clash prevention & room allocations'}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ display: 'flex', background: 'rgba(255, 255, 255, 0.04)', borderRadius: '8px', padding: '0.2rem', border: '1px solid var(--border-subtle)' }}>
            <button
              className="btn-icon"
              style={{ background: viewMode === 'grid' ? 'rgba(99, 102, 241, 0.2)' : 'transparent', color: viewMode === 'grid' ? '#818cf8' : '#94a3b8' }}
              onClick={() => setViewMode('grid')}
              title="Weekly Matrix Table View"
            >
              <LayoutGrid size={16} />
            </button>
            <button
              className="btn-icon"
              style={{ background: viewMode === 'list' ? 'rgba(99, 102, 241, 0.2)' : 'transparent', color: viewMode === 'list' ? '#818cf8' : '#94a3b8' }}
              onClick={() => setViewMode('list')}
              title="List Table View"
            >
              <List size={16} />
            </button>
          </div>

          <button className="btn btn-secondary" onClick={fetchTimetables} title="Refresh">
            <RefreshCw size={16} className={loading ? 'spin' : ''} />
            <span>Refresh</span>
          </button>

          <button className="btn btn-primary" onClick={handleOpenAdd}>
            <Plus size={18} />
            <span>Schedule Lecture Slot</span>
          </button>
        </div>
      </div>

      {/* Branch / Department Folder Tabs */}
      <DepartmentFolderTabs
        selectedDepartment={filterDept}
        onSelectDepartment={(dept) => setFilterDept(dept)}
        showAllOption={true}
      />

      {/* Filter Toolbar */}
      <div className="toolbar">
        <div className="toolbar-search">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search by subject, professor, room..."
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
            value={filterDay}
            onChange={(e) => setFilterDay(e.target.value)}
          >
            <option value="ALL">All Days</option>
            {daysOfWeek.map((day) => (
              <option key={day} value={day}>{day}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Timetable View */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: '#94a3b8' }}>
          Loading student timetable data...
        </div>
      ) : timetables.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: '#64748b', background: 'var(--bg-card)', borderRadius: '16px', border: '1px solid var(--border-subtle)' }}>
          No scheduled lecture slots match the selected filters. Click "Schedule Lecture Slot" to add one.
        </div>
      ) : viewMode === 'grid' ? (
        /* REAL COLLEGE WEEKLY TIMETABLE TABLE */
        <div className="table-container" style={{ overflowX: 'auto', borderRadius: '16px', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
          <table className="data-table" style={{ width: '100%', minWidth: '920px', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'rgba(255, 255, 255, 0.03)' }}>
                <th style={{ width: '150px', textAlign: 'left', padding: '1rem', borderRight: '1px solid var(--border-subtle)', color: '#94a3b8' }}>
                  Time Slot
                </th>
                {daysOfWeek.map((day) => {
                  if (filterDay !== 'ALL' && filterDay !== day) return null;
                  return (
                    <th key={day} style={{ textAlign: 'center', padding: '1rem', borderRight: '1px solid var(--border-subtle)', color: '#fff', fontSize: '0.92rem', fontWeight: 700 }}>
                      {day}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {activeTimeSlots.map((slot) => (
                <tr key={slot.start} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  {/* Left Column: Time Slot */}
                  <td style={{
                    padding: '1rem',
                    borderRight: '1px solid var(--border-subtle)',
                    background: 'rgba(255, 255, 255, 0.015)',
                    verticalAlign: 'middle'
                  }}>
                    <div style={{ fontWeight: 700, color: '#fff', fontSize: '0.85rem' }}>{slot.label}</div>
                    <div style={{ fontSize: '0.72rem', color: '#818cf8', fontWeight: 600, marginTop: '2px' }}>{slot.period}</div>
                  </td>

                  {/* Day Columns */}
                  {daysOfWeek.map((day) => {
                    if (filterDay !== 'ALL' && filterDay !== day) return null;

                    // Match slot items (support multiple parallel lab batches)
                    const slotItems = timetables.filter((t) => {
                      if (t.dayOfWeek !== day) return false;
                      // Time overlap check
                      return (
                        (t.startTime <= slot.start && t.endTime > slot.start) ||
                        (t.startTime < slot.end && t.endTime >= slot.end) ||
                        (t.startTime >= slot.start && t.endTime <= slot.end)
                      );
                    });

                    return (
                      <td
                        key={day}
                        style={{
                          padding: '0.65rem',
                          borderRight: '1px solid var(--border-subtle)',
                          verticalAlign: 'top',
                          minWidth: '150px'
                        }}
                      >
                        {slotItems.length > 0 ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                            {slotItems.map((slotItem) => {
                              const isLab = (
                                (slotItem.classroomType && slotItem.classroomType.toLowerCase().includes('lab')) ||
                                (slotItem.subjectName && slotItem.subjectName.toLowerCase().includes('lab')) ||
                                slotItem.isLab
                              );

                              return (
                                <div
                                  key={slotItem.id}
                                  style={{
                                    padding: '0.65rem',
                                    borderRadius: '10px',
                                    background: isLab ? 'rgba(168, 85, 247, 0.08)' : 'rgba(99, 102, 241, 0.08)',
                                    border: isLab ? '1px solid rgba(168, 85, 247, 0.3)' : '1px solid rgba(99, 102, 241, 0.3)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '0.3rem',
                                    transition: 'all 0.2s ease',
                                    position: 'relative'
                                  }}
                                >
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.25rem' }}>
                                    <span style={{ fontWeight: 700, color: '#fff', fontSize: '0.85rem', lineHeight: 1.25 }}>
                                      {slotItem.subjectName}
                                    </span>
                                    {isLab && (
                                      <span style={{
                                        fontSize: '0.62rem',
                                        fontWeight: 800,
                                        padding: '0.1rem 0.35rem',
                                        borderRadius: '4px',
                                        background: 'rgba(168, 85, 247, 0.25)',
                                        color: '#c084fc',
                                        border: '1px solid rgba(168, 85, 247, 0.4)',
                                        whiteSpace: 'nowrap'
                                      }}>
                                        LAB
                                      </span>
                                    )}
                                  </div>

                                  <div style={{ fontSize: '0.74rem', color: '#06b6d4', fontWeight: 600 }}>
                                    {slotItem.facultyName || 'Professor'}
                                  </div>

                                  <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    marginTop: 'auto',
                                    paddingTop: '0.3rem',
                                    borderTop: '1px solid rgba(255, 255, 255, 0.06)'
                                  }}>
                                    <span style={{ fontSize: '0.72rem', color: '#10b981', fontWeight: 700 }}>
                                      {slotItem.roomNumber}
                                    </span>
                                    <div style={{ display: 'inline-flex', gap: '0.25rem' }}>
                                      <button className="btn-icon" style={{ padding: '0.15rem', width: '20px', height: '20px' }} onClick={() => handleOpenEdit(slotItem)} title="Edit Slot">
                                        <Edit2 size={11} />
                                      </button>
                                      <button className="btn-icon btn-icon-danger" style={{ padding: '0.15rem', width: '20px', height: '20px' }} onClick={() => handleDeleteClick(slotItem)} title="Delete Slot">
                                        <Trash2 size={11} />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            minHeight: '88px',
                            color: '#475569',
                            fontSize: '0.8rem',
                            fontWeight: 500,
                            background: 'rgba(255, 255, 255, 0.01)',
                            borderRadius: '8px',
                            border: '1px dashed rgba(255, 255, 255, 0.04)'
                          }}>
                            Free
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        /* LIST / TABLE VIEW */
        <div className="table-container">
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Day & Time</th>
                  <th>Class / Section</th>
                  <th>Subject</th>
                  <th>Faculty Instructor</th>
                  <th>Classroom / Lab</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {timetables.map((slot) => (
                  <tr key={slot.id}>
                    <td>
                      <div style={{ fontWeight: 700, color: '#fff' }}>{slot.dayOfWeek}</div>
                      <div style={{ fontSize: '0.78rem', color: '#818cf8' }}>{slot.startTime} – {slot.endTime}</div>
                    </td>
                    <td>
                      <span style={{ fontWeight: 600, color: '#f8fafc' }}>
                        {slot.year}-{slot.division}
                      </span>
                      <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{slot.department}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: '#fff' }}>{slot.subjectName}</div>
                      <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{slot.subjectCode}</div>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.85rem', color: '#06b6d4', fontWeight: 500 }}>{slot.facultyName}</div>
                      <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{slot.facultyEmail}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: '#10b981' }}>{slot.roomNumber}</div>
                      <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{slot.building} • {slot.classroomType}</div>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                        <button className="btn-icon" onClick={() => handleOpenEdit(slot)} title="Edit Slot">
                          <Edit2 size={14} />
                        </button>
                        <button className="btn-icon btn-icon-danger" onClick={() => handleDeleteClick(slot)} title="Delete Slot">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Timetable Entry Modal with Conflict Detection */}
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
                  <CalendarCheck size={20} />
                </div>
                <h3>{editingEntry ? 'Edit Timetable Slot' : 'Schedule Timetable Slot'}</h3>
              </div>
              <button className="btn-icon" onClick={() => setIsModalOpen(false)} disabled={modalLoading}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveEntry}>
              <div className="modal-body">
                {formError && (
                  <div style={{
                    padding: '0.875rem 1rem',
                    borderRadius: '10px',
                    background: 'rgba(244, 63, 94, 0.15)',
                    border: '1px solid rgba(244, 63, 94, 0.35)',
                    color: '#f43f5e',
                    fontSize: '0.85rem',
                    marginBottom: '1.25rem',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.5rem'
                  }}>
                    <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                    <div>
                      <strong style={{ display: 'block', marginBottom: '0.15rem' }}>Schedule Conflict / Validation Error</strong>
                      <span>{formError}</span>
                    </div>
                  </div>
                )}

                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Day of Week *</label>
                    <select
                      className="form-select"
                      value={formData.dayOfWeek}
                      onChange={(e) => setFormData({ ...formData, dayOfWeek: e.target.value })}
                    >
                      {daysOfWeek.map((day) => (
                        <option key={day} value={day}>{day}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Start Time *</label>
                    <input
                      type="time"
                      className="form-input"
                      value={formData.startTime}
                      onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">End Time *</label>
                    <input
                      type="time"
                      className="form-input"
                      value={formData.endTime}
                      onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
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
                    <label className="form-label">Year & Division *</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                      <select
                        className="form-select"
                        value={formData.year}
                        onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                      >
                        {options.academicYears.map((y) => (
                          <option key={y} value={y}>{y}</option>
                        ))}
                      </select>
                      <select
                        className="form-select"
                        value={formData.division}
                        onChange={(e) => setFormData({ ...formData, division: e.target.value })}
                      >
                        {options.divisions.map((div) => (
                          <option key={div} value={div}>Div {div}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="form-group form-group-full">
                    <label className="form-label">Academic Subject *</label>
                    <select
                      className="form-select"
                      value={formData.subjectId}
                      onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })}
                      required
                    >
                      <option value="">-- Select Subject --</option>
                      {options.subjects.map((sub) => (
                        <option key={sub.id} value={sub.id}>
                          {sub.code} — {sub.name} ({sub.department})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group form-group-full">
                    <label className="form-label">Assigned Faculty Instructor *</label>
                    <select
                      className="form-select"
                      value={formData.facultyId}
                      onChange={(e) => setFormData({ ...formData, facultyId: e.target.value })}
                      required
                    >
                      <option value="">-- Select Professor --</option>
                      {options.facultyList.map((fac) => (
                        <option key={fac.id} value={fac.id}>
                          {fac.name} ({fac.email})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group form-group-full">
                    <label className="form-label">Classroom / Laboratory *</label>
                    <select
                      className="form-select"
                      value={formData.classroomId}
                      onChange={(e) => setFormData({ ...formData, classroomId: e.target.value })}
                      required
                    >
                      <option value="">-- Select Room / Lab --</option>
                      {options.classrooms.map((room) => (
                        <option key={room.id} value={room.id}>
                          {room.roomNumber} ({room.classroomType} • {room.capacity} seats • {room.building})
                        </option>
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
                  {modalLoading ? 'Validating Conflicts...' : editingEntry ? 'Update Schedule Slot' : 'Confirm & Schedule Slot'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModalOpen}
        title="Delete Timetable Entry"
        message={`Are you sure you want to delete this ${entryToDelete?.subjectName} lecture on ${entryToDelete?.dayOfWeek} (${entryToDelete?.startTime} - ${entryToDelete?.endTime})? Classroom availability will automatically update.`}
        confirmText="Delete Slot"
        cancelText="Cancel"
        onConfirm={handleConfirmDelete}
        onClose={() => setDeleteModalOpen(false)}
        loading={deleteLoading}
      />
    </div>
  );
}
