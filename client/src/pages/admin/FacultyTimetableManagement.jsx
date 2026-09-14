import React, { useState, useEffect, useCallback } from 'react';
import {
  CalendarCheck,
  Search,
  RefreshCw,
  Clock,
  Building2,
  Users2,
  BookOpen,
  Layers,
  GraduationCap,
  Sparkles,
  LayoutGrid,
  List
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import DepartmentFolderTabs from '../../components/common/DepartmentFolderTabs';

export default function FacultyTimetableManagement() {
  const { authFetch, showToast } = useAuth();

  const [loading, setLoading] = useState(true);
  const [facultyMembers, setFacultyMembers] = useState([]);
  const [selectedFacultyId, setSelectedFacultyId] = useState('');
  const [selectedFaculty, setSelectedFaculty] = useState(null);
  const [timetables, setTimetables] = useState([]);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' (table) or 'list'

  const [filterDept, setFilterDept] = useState('Computer Engineering');
  const [searchQuery, setSearchQuery] = useState('');
  const [options, setOptions] = useState({
    departments: ['Computer Engineering', 'Information Technology', 'Electronics & Telecommunication', 'Mechanical Engineering', 'Civil Engineering', 'Artificial Intelligence & Data Science']
  });

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const baseTimeSlots = [
    { label: '09:15 AM – 10:15 AM', start: '09:15', end: '10:15', period: 'Period 1' },
    { label: '10:15 AM – 11:15 AM', start: '10:15', end: '11:15', period: 'Period 2' },
    { label: '11:30 AM – 12:30 PM', start: '11:30', end: '12:30', period: 'Period 3' },
    { label: '12:30 PM – 01:30 PM', start: '12:30', end: '13:30', period: 'Period 4' },
    { label: '02:00 PM – 03:00 PM', start: '14:00', end: '15:00', period: 'Period 5' },
    { label: '03:00 PM – 04:00 PM', start: '15:00', end: '16:00', period: 'Period 6' },
    { label: '04:00 PM – 05:00 PM', start: '16:00', end: '17:00', period: 'Period 7' }
  ];

  // Helper to extract/display lab batch (S1, S2, S3)
  const getBatchLabel = (item) => {
    if (item.batch) return item.batch;
    if (item.id) {
      const match = item.id.match(/_([123])$/);
      if (match) return `S${match[1]}`;
    }
    return 'S1';
  };

  // Load Admin Department Options
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

  // Fetch Faculty Timetable & List
  const fetchFacultyData = useCallback(async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (filterDept !== 'ALL') queryParams.append('department', filterDept);
      if (selectedFacultyId) queryParams.append('facultyId', selectedFacultyId);
      if (searchQuery.trim()) queryParams.append('q', searchQuery.trim());

      const res = await authFetch(`/api/admin/faculty-timetable?${queryParams.toString()}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setFacultyMembers(data.facultyMembers || []);
        setSelectedFaculty(data.selectedFaculty || null);
        setTimetables(data.timetables || []);
        if (!selectedFacultyId && data.selectedFaculty) {
          setSelectedFacultyId(data.selectedFaculty.id);
        }
      }
    } catch (err) {
      showToast('Failed to load faculty timetable: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [authFetch, filterDept, selectedFacultyId, searchQuery, showToast]);

  useEffect(() => {
    fetchFacultyData();
  }, [fetchFacultyData]);

  // Dynamic time slots
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
            <span style={{ fontSize: '0.72rem', fontWeight: 800, padding: '0.2rem 0.6rem', borderRadius: '999px', background: 'rgba(6, 182, 212, 0.2)', color: '#06b6d4', letterSpacing: '0.06em' }}>
              OFFICIAL FACULTY SCHEDULE
            </span>
          </div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff' }}>
            TIMETABLE FOR FACULTY — {filterDept === 'ALL' ? 'All Departments' : filterDept}
          </h2>
          <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
            Individual faculty teaching appointments, room allocations & weekly lecture load
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

          <button className="btn btn-secondary" onClick={fetchFacultyData} title="Refresh">
            <RefreshCw size={16} className={loading ? 'spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Branch / Department Folder Tabs */}
      <DepartmentFolderTabs
        selectedDepartment={filterDept}
        onSelectDepartment={(dept) => {
          setFilterDept(dept);
          setSelectedFacultyId(''); // reset selected faculty to pick first in new department
        }}
        showAllOption={true}
      />

      {/* Filter Toolbar & Faculty Selector */}
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
            onChange={(e) => {
              setFilterDept(e.target.value);
              setSelectedFacultyId('');
            }}
          >
            <option value="ALL">All Departments</option>
            {options.departments.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>

          <select
            className="filter-select"
            value={selectedFacultyId}
            onChange={(e) => setSelectedFacultyId(e.target.value)}
            style={{ minWidth: '220px', fontWeight: 600, color: '#06b6d4' }}
          >
            {facultyMembers.length === 0 ? (
              <option value="">No Faculty in Department</option>
            ) : (
              facultyMembers.map((f) => (
                <option key={f.id} value={f.id}>
                  👨‍🏫 {f.name} ({f.department})
                </option>
              ))
            )}
          </select>
        </div>
      </div>

      {/* Active Faculty Summary Header Card */}
      {selectedFaculty && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.12) 0%, rgba(99, 102, 241, 0.1) 100%)',
          border: '1px solid rgba(6, 182, 212, 0.3)',
          borderRadius: '16px',
          padding: '1.25rem 1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontWeight: 800,
              fontSize: '1.2rem',
              boxShadow: '0 0 15px rgba(6, 182, 212, 0.35)'
            }}>
              {selectedFaculty.name.charAt(0)}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#fff' }}>{selectedFaculty.name}</h3>
                <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.3)', fontSize: '0.72rem', fontWeight: 700 }}>
                  {selectedFaculty.status || 'ACTIVE'}
                </span>
              </div>
              <div style={{ fontSize: '0.82rem', color: '#94a3b8', display: 'flex', gap: '0.75rem', marginTop: '0.2rem' }}>
                <span>{selectedFaculty.email}</span>
                <span>•</span>
                <span style={{ color: '#cbd5e1' }}>{selectedFaculty.department}</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff', lineHeight: 1 }}>
                {timetables.length}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Weekly Lectures
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Faculty Timetable Display */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: '#94a3b8' }}>
          Loading faculty timetable data...
        </div>
      ) : facultyMembers.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: '#64748b', background: 'var(--bg-card)', borderRadius: '16px', border: '1px solid var(--border-subtle)' }}>
          No faculty members found in the selected department.
        </div>
      ) : viewMode === 'grid' ? (
        /* REAL COLLEGE WEEKLY TIMETABLE TABLE FOR FACULTY */
        <div className="table-container" style={{ overflowX: 'auto', borderRadius: '16px', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
          <table className="data-table" style={{ width: '100%', minWidth: '920px', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'rgba(255, 255, 255, 0.03)' }}>
                <th style={{ width: '150px', textAlign: 'left', padding: '1rem', borderRight: '1px solid var(--border-subtle)', color: '#94a3b8' }}>
                  Time Slot
                </th>
                {daysOfWeek.map((day) => (
                  <th key={day} style={{ textAlign: 'center', padding: '1rem', borderRight: '1px solid var(--border-subtle)', color: '#fff', fontSize: '0.92rem', fontWeight: 700 }}>
                    {day}
                  </th>
                ))}
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
                    <div style={{ fontSize: '0.72rem', color: '#06b6d4', fontWeight: 600, marginTop: '2px' }}>{slot.period}</div>
                  </td>

                  {/* Day Columns */}
                  {daysOfWeek.map((day) => {
                    // Match slot item
                    const slotItem = timetables.find((t) => {
                      if (t.dayOfWeek !== day) return false;
                      return (
                        (t.startTime <= slot.start && t.endTime > slot.start) ||
                        (t.startTime < slot.end && t.endTime >= slot.end) ||
                        (t.startTime >= slot.start && t.endTime <= slot.end)
                      );
                    });

                    const isLab = slotItem && (
                      slotItem.isLab ||
                      (slotItem.classroomType && slotItem.classroomType.toLowerCase().includes('lab')) ||
                      (slotItem.subjectName && slotItem.subjectName.toLowerCase().includes('lab'))
                    );

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
                        {slotItem ? (
                          <div style={{
                            padding: '0.75rem',
                            borderRadius: '10px',
                            background: isLab ? 'rgba(168, 85, 247, 0.08)' : 'rgba(6, 182, 212, 0.08)',
                            border: isLab ? '1px solid rgba(168, 85, 247, 0.3)' : '1px solid rgba(6, 182, 212, 0.3)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.35rem',
                            minHeight: '88px',
                            transition: 'all 0.2s ease',
                            position: 'relative'
                          }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.25rem' }}>
                              <span style={{ fontWeight: 700, color: '#fff', fontSize: '0.88rem', lineHeight: 1.25 }}>
                                {slotItem.subjectName}
                              </span>
                              {isLab && (
                                <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center', flexShrink: 0 }}>
                                  <span style={{
                                    fontSize: '0.65rem',
                                    fontWeight: 800,
                                    padding: '0.1rem 0.4rem',
                                    borderRadius: '4px',
                                    background: 'rgba(168, 85, 247, 0.25)',
                                    color: '#c084fc',
                                    border: '1px solid rgba(168, 85, 247, 0.4)',
                                    whiteSpace: 'nowrap'
                                  }}>
                                    LAB
                                  </span>
                                  <span style={{
                                    fontSize: '0.65rem',
                                    fontWeight: 800,
                                    padding: '0.1rem 0.4rem',
                                    borderRadius: '4px',
                                    background: 'rgba(234, 179, 8, 0.2)',
                                    color: '#fbbf24',
                                    border: '1px solid rgba(234, 179, 8, 0.4)',
                                    whiteSpace: 'nowrap'
                                  }}>
                                    Batch: {getBatchLabel(slotItem)}
                                  </span>
                                </div>
                              )}
                            </div>

                            <div style={{ fontSize: '0.76rem', color: '#fbbf24', fontWeight: 700 }}>
                              Class: {slotItem.classYear}-{slotItem.classDivision}
                            </div>

                            <div style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              marginTop: 'auto',
                              paddingTop: '0.35rem',
                              borderTop: '1px solid rgba(255, 255, 255, 0.06)'
                            }}>
                              <span style={{ fontSize: '0.74rem', color: '#10b981', fontWeight: 700 }}>
                                📍 {slotItem.roomNumber}
                              </span>
                              <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                                {slotItem.startTime}–{slotItem.endTime}
                              </span>
                            </div>
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
        /* LIST VIEW */
        <div className="table-container">
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Day & Time</th>
                  <th>Subject & Code</th>
                  <th>Assigned Class</th>
                  <th>Classroom / Lab</th>
                  <th>Period</th>
                </tr>
              </thead>
              <tbody>
                {timetables.map((slot) => (
                  <tr key={slot.id}>
                    <td>
                      <div style={{ fontWeight: 700, color: '#fff' }}>{slot.dayOfWeek}</div>
                      <div style={{ fontSize: '0.78rem', color: '#06b6d4' }}>{slot.startTime} – {slot.endTime}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: '#fff' }}>{slot.subjectName}</div>
                      <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{slot.subjectCode}</div>
                    </td>
                    <td>
                      <span style={{ fontWeight: 700, color: '#fbbf24' }}>
                        {slot.classYear}-{slot.classDivision}
                      </span>
                      <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{slot.classDepartment || selectedFaculty?.department}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: '#10b981' }}>{slot.roomNumber}</div>
                      <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{slot.building} • {slot.classroomType}</div>
                    </td>
                    <td>
                      <span className="tag-pill" style={{ background: 'rgba(99, 102, 241, 0.1)', color: '#818cf8' }}>
                        Period {slot.periodNumber || 1}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
