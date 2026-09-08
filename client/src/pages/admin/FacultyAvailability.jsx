import React, { useState, useEffect, useCallback } from 'react';
import {
  Clock,
  Calendar,
  Users2,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  GraduationCap,
  Sparkles,
  RefreshCw,
  Search,
  Building2,
  Check
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import DepartmentFolderTabs from '../../components/common/DepartmentFolderTabs';

export default function FacultyAvailability() {
  const { authFetch, showToast } = useAuth();

  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [selectedSlot, setSelectedSlot] = useState('10:00');
  const [filterDept, setFilterDept] = useState('ALL');
  const [filterAvailability, setFilterAvailability] = useState('ALL'); // 'ALL', 'AVAILABLE', 'OCCUPIED'
  const [searchQuery, setSearchQuery] = useState('');

  const [availabilityData, setAvailabilityData] = useState(null);
  const [loading, setLoading] = useState(true);

  const [options, setOptions] = useState({
    departments: ['Computer Engineering', 'Information Technology', 'Electronics & Telecommunication', 'Mechanical Engineering', 'Civil Engineering', 'Artificial Intelligence & Data Science']
  });

  const timeSlots = [
    { label: '09:00 AM – 10:00 AM', value: '09:00' },
    { label: '10:00 AM – 11:00 AM', value: '10:00' },
    { label: '11:15 AM – 12:15 PM', value: '11:15' },
    { label: '12:15 PM – 01:15 PM', value: '12:15' },
    { label: '02:00 PM – 03:00 PM', value: '14:00' },
    { label: '03:00 PM – 04:00 PM', value: '15:00' },
    { label: '04:15 PM – 05:15 PM', value: '16:15' }
  ];

  // Fetch Department Options
  useEffect(() => {
    async function loadOptions() {
      try {
        const res = await authFetch('/api/admin/options');
        const data = await res.json();
        if (res.ok && data.success && data.departments) {
          setOptions((prev) => ({ ...prev, departments: data.departments }));
        }
      } catch (err) {
        console.error('Error fetching admin options:', err);
      }
    }
    loadOptions();
  }, [authFetch]);

  // Fetch Faculty Availability
  const fetchAvailability = useCallback(async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('date', selectedDate);
      queryParams.append('time', selectedSlot);
      if (filterDept !== 'ALL') queryParams.append('department', filterDept);
      if (searchQuery.trim()) queryParams.append('search', searchQuery.trim());
      if (filterAvailability !== 'ALL') queryParams.append('availability', filterAvailability);

      const res = await authFetch(`/api/admin/faculty-availability?${queryParams.toString()}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setAvailabilityData(data);
      }
    } catch (err) {
      showToast('Error checking faculty availability: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [authFetch, selectedDate, selectedSlot, filterDept, searchQuery, filterAvailability, showToast]);

  useEffect(() => {
    fetchAvailability();
  }, [fetchAvailability]);

  const facultyList = availabilityData?.faculty || [];
  const summary = availabilityData?.summary || { totalFaculty: 0, occupiedFaculty: 0, availableFaculty: 0 };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 800, padding: '0.2rem 0.6rem', borderRadius: '999px', background: 'rgba(6, 182, 212, 0.2)', color: '#06b6d4', letterSpacing: '0.06em' }}>
              LIVE PROFESSOR STATUS
            </span>
          </div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff' }}>Faculty Availability Matrix</h2>
          <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
            Real-time teaching allocation monitor & instant faculty vacancy intelligence
          </p>
        </div>
        <button className="btn btn-secondary" onClick={fetchAvailability} title="Refresh Live Data">
          <RefreshCw size={16} className={loading ? 'spin' : ''} />
          <span>Check Now</span>
        </button>
      </div>

      {/* Branch / Department Folder Tabs */}
      <DepartmentFolderTabs
        selectedDepartment={filterDept}
        onSelectDepartment={(dept) => setFilterDept(dept)}
        showAllOption={true}
      />

      {/* Date & Time Slot Selector Card */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
        borderRadius: '16px',
        padding: '1.5rem',
        boxShadow: 'var(--shadow-md)',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.25rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          {/* Date Picker */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Calendar size={18} color="#06b6d4" />
              <span>Select Date:</span>
            </label>
            <input
              type="date"
              className="form-input"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              style={{ width: '180px', padding: '0.5rem 0.75rem' }}
            />
            {availabilityData?.dayOfWeek && (
              <span style={{ fontSize: '0.85rem', color: '#06b6d4', fontWeight: 700, background: 'rgba(6, 182, 212, 0.15)', padding: '0.35rem 0.75rem', borderRadius: '8px' }}>
                {availabilityData.dayOfWeek}
              </span>
            )}
          </div>

          {/* Quick Filters */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <select
              className="filter-select"
              value={filterAvailability}
              onChange={(e) => setFilterAvailability(e.target.value)}
              style={{ padding: '0.5rem 1.875rem 0.5rem 0.75rem' }}
            >
              <option value="ALL">All Availability States</option>
              <option value="AVAILABLE">🟢 Available Only (Free)</option>
              <option value="OCCUPIED">🔴 Occupied Only (In Lecture)</option>
            </select>

            <select
              className="filter-select"
              value={filterDept}
              onChange={(e) => setFilterDept(e.target.value)}
              style={{ padding: '0.5rem 1.875rem 0.5rem 0.75rem' }}
            >
              <option value="ALL">All Departments</option>
              {options.departments.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Time Slot Buttons */}
        <div>
          <div style={{ fontSize: '0.78rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.06em', marginBottom: '0.65rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <Clock size={14} /> Time Slot Selection
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {timeSlots.map((slot) => {
              const isSelected = selectedSlot === slot.value;
              return (
                <button
                  key={slot.value}
                  type="button"
                  onClick={() => setSelectedSlot(slot.value)}
                  style={{
                    padding: '0.5rem 0.875rem',
                    borderRadius: '8px',
                    fontSize: '0.82rem',
                    fontWeight: isSelected ? 700 : 500,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    background: isSelected ? 'linear-gradient(135deg, #06b6d4, #3b82f6)' : 'rgba(255, 255, 255, 0.04)',
                    color: isSelected ? '#fff' : '#94a3b8',
                    border: isSelected ? '1px solid #06b6d4' : '1px solid var(--border-subtle)',
                    boxShadow: isSelected ? '0 0 15px rgba(6, 182, 212, 0.35)' : 'none'
                  }}
                >
                  {slot.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Dynamic Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
        {/* Total Faculty */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '16px',
          padding: '1.25rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem'
        }}>
          <div style={{ width: '46px', height: '46px', borderRadius: '12px', background: 'rgba(99, 102, 241, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#818cf8' }}>
            <Users2 size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600 }}>TOTAL FACULTY</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fff', lineHeight: 1.1 }}>{summary.totalFaculty}</div>
            <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '2px' }}>Registered professors</div>
          </div>
        </div>

        {/* Available Faculty */}
        <div style={{
          background: 'rgba(16, 185, 129, 0.06)',
          border: '1px solid rgba(16, 185, 129, 0.25)',
          borderRadius: '16px',
          padding: '1.25rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem'
        }}>
          <div style={{ width: '46px', height: '46px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#34d399' }}>
            <CheckCircle2 size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: '#34d399', fontWeight: 700 }}>AVAILABLE FACULTY</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fff', lineHeight: 1.1 }}>{summary.availableFaculty}</div>
            <div style={{ fontSize: '0.72rem', color: '#34d399', marginTop: '2px' }}>Free during this slot</div>
          </div>
        </div>

        {/* Occupied Faculty */}
        <div style={{
          background: 'rgba(239, 68, 68, 0.06)',
          border: '1px solid rgba(239, 68, 68, 0.25)',
          borderRadius: '16px',
          padding: '1.25rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem'
        }}>
          <div style={{ width: '46px', height: '46px', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f87171' }}>
            <AlertCircle size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: '#f87171', fontWeight: 700 }}>OCCUPIED FACULTY</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fff', lineHeight: 1.1 }}>{summary.occupiedFaculty}</div>
            <div style={{ fontSize: '0.72rem', color: '#f87171', marginTop: '2px' }}>Conducting lecture/lab</div>
          </div>
        </div>
      </div>

      {/* Search Toolbar */}
      <div className="toolbar" style={{ marginTop: '0.25rem' }}>
        <div className="toolbar-search" style={{ flex: 1 }}>
          <Search size={16} />
          <input
            type="text"
            placeholder="Search professor by name, email, or department..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Faculty Availability Table */}
      <div className="table-container">
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Faculty Instructor</th>
                <th>Department</th>
                <th>Slot Availability</th>
                <th>Current Lecture / Activity Details</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                    Computing live faculty availability...
                  </td>
                </tr>
              ) : facultyList.length === 0 ? (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
                    No faculty match your search or filter criteria.
                  </td>
                </tr>
              ) : (
                facultyList.map((faculty) => {
                  const isOccupied = faculty.status === 'OCCUPIED';
                  const act = faculty.currentActivity;

                  return (
                    <tr key={faculty.id}>
                      {/* Faculty Info */}
                      <td>
                        <div className="user-cell">
                          <div className="cell-avatar" style={{ background: isOccupied ? 'linear-gradient(135deg, #f43f5e, #e11d48)' : 'linear-gradient(135deg, #06b6d4, #3b82f6)' }}>
                            {faculty.name.charAt(0)}
                          </div>
                          <div className="cell-info">
                            <div className="cell-name">{faculty.name}</div>
                            <div className="cell-sub">{faculty.email}</div>
                          </div>
                        </div>
                      </td>

                      {/* Department */}
                      <td>
                        <span style={{ fontSize: '0.85rem', color: '#cbd5e1', fontWeight: 500 }}>
                          {faculty.department}
                        </span>
                      </td>

                      {/* Live Status Badge */}
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
                        {act ? (
                          <div style={{ fontSize: '0.82rem', lineHeight: 1.4 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                              <strong style={{ color: '#fff' }}>{act.subjectName}</strong>
                              {act.isLab && (
                                <span style={{
                                  fontSize: '0.65rem',
                                  fontWeight: 800,
                                  padding: '0.1rem 0.35rem',
                                  borderRadius: '4px',
                                  background: 'rgba(168, 85, 247, 0.25)',
                                  color: '#c084fc',
                                  border: '1px solid rgba(168, 85, 247, 0.4)'
                                }}>
                                  LAB
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#cbd5e1', marginTop: '2px' }}>
                              Class: <strong style={{ color: '#fbbf24' }}>{act.class}</strong> • Room: <strong style={{ color: '#10b981' }}>{act.roomNumber}</strong> ({act.classroomType})
                            </div>
                            <div style={{ fontSize: '0.72rem', color: '#818cf8', fontWeight: 600, marginTop: '2px' }}>
                              {act.startTime} – {act.endTime}
                            </div>
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.82rem', color: '#64748b' }}>
                            Free
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
