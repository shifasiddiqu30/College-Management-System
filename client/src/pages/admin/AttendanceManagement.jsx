import React, { useState, useEffect, useCallback } from 'react';
import {
  ClipboardCheck,
  Calendar,
  Users2,
  AlertTriangle,
  Send,
  Calculator,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Filter,
  RefreshCw,
  Plus,
  Save,
  ShieldAlert,
  GraduationCap,
  Sparkles,
  Layers,
  BookOpen
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import DepartmentFolderTabs from '../../components/common/DepartmentFolderTabs';

export default function AttendanceManagement() {
  const { authFetch, showToast } = useAuth();

  // Selected Filters
  const [selectedDept, setSelectedDept] = useState('Computer Engineering');
  const [selectedYear, setSelectedYear] = useState('SE');
  const [selectedDivision, setSelectedDivision] = useState('B');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Tab State
  const [activeTab, setActiveTab] = useState('sheet'); // 'sheet' | 'percentage' | 'defaulters'

  // Data States
  const [subjects, setSubjects] = useState([]);
  const [students, setStudents] = useState([]);
  const [recordedDates, setRecordedDates] = useState([]);
  const [attendanceMap, setAttendanceMap] = useState({}); // { `${studentId}_${date}`: 'PRESENT'|'ABSENT'|'LATE' }
  const [summaryData, setSummaryData] = useState(null);
  const [defaultersList, setDefaultersList] = useState([]);
  const [statsData, setStatsData] = useState(null);

  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Load Subjects for selected Department
  const fetchSubjects = useCallback(async () => {
    try {
      const res = await authFetch('/api/admin/options');
      const data = await res.json();
      if (res.ok && data.success) {
        const deptSubjects = (data.subjects || []).filter(s => s.department === selectedDept);
        setSubjects(deptSubjects);
        if (deptSubjects.length > 0) {
          setSelectedSubjectId(deptSubjects[0].id);
        } else {
          setSelectedSubjectId('');
        }
      }
    } catch (err) {
      console.error('Error fetching subjects:', err);
    }
  }, [authFetch, selectedDept]);

  useEffect(() => {
    fetchSubjects();
  }, [fetchSubjects]);

  // Load Overview Stats
  const fetchStats = useCallback(async () => {
    try {
      const res = await authFetch('/api/admin/attendance/stats');
      const data = await res.json();
      if (res.ok && data.success) {
        setStatsData(data.stats);
      }
    } catch (err) {
      console.error('Error loading attendance stats:', err);
    }
  }, [authFetch]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Load Attendance Sheet
  const fetchAttendanceSheet = useCallback(async () => {
    if (!selectedDept || !selectedYear || !selectedDivision || !selectedSubjectId) return;
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        department: selectedDept,
        year: selectedYear,
        division: selectedDivision,
        subjectId: selectedSubjectId
      });
      if (startDate && endDate) {
        queryParams.append('startDate', startDate);
        queryParams.append('endDate', endDate);
      }

      const res = await authFetch(`/api/admin/attendance/sheet?${queryParams.toString()}`);
      const data = await res.json();

      if (res.ok && data.success) {
        setStudents(data.students || []);
        
        // Ensure today's date or active selectedDate is in dates list
        const dates = data.dates || [];
        if (selectedDate && !dates.includes(selectedDate)) {
          dates.push(selectedDate);
          dates.sort();
        }
        setRecordedDates(dates);

        // Build Map of status
        const map = {};
        (data.records || []).forEach(r => {
          map[`${r.studentId}_${r.date}`] = r.status;
        });

        // For dates where no record exists, default to 'PRESENT'
        (data.students || []).forEach(st => {
          dates.forEach(d => {
            const key = `${st.id}_${d}`;
            if (!map[key]) {
              map[key] = 'PRESENT';
            }
          });
        });

        setAttendanceMap(map);
        setSummaryData(data.summary || null);
        setHasUnsavedChanges(false);
      } else {
        showToast(data.message || 'Error loading attendance sheet', 'error');
      }
    } catch (err) {
      showToast('Error loading attendance sheet: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [authFetch, selectedDept, selectedYear, selectedDivision, selectedSubjectId, selectedDate, startDate, endDate, showToast]);

  // Load Defaulters List
  const fetchDefaulters = useCallback(async () => {
    try {
      const queryParams = new URLSearchParams({
        department: selectedDept,
        year: selectedYear,
        division: selectedDivision
      });
      if (selectedSubjectId) queryParams.append('subjectId', selectedSubjectId);

      const res = await authFetch(`/api/admin/attendance/defaulters?${queryParams.toString()}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setDefaultersList(data.defaulters || []);
      }
    } catch (err) {
      console.error('Error fetching defaulters:', err);
    }
  }, [authFetch, selectedDept, selectedYear, selectedDivision, selectedSubjectId]);

  useEffect(() => {
    fetchAttendanceSheet();
    fetchDefaulters();
  }, [fetchAttendanceSheet, fetchDefaulters]);

  // Cell Click / Status Toggle: PRESENT -> ABSENT -> LATE -> PRESENT
  const handleToggleCellStatus = (studentId, date) => {
    const key = `${studentId}_${date}`;
    const current = attendanceMap[key] || 'PRESENT';
    const nextStatus = current === 'PRESENT' ? 'ABSENT' : (current === 'ABSENT' ? 'LATE' : 'PRESENT');

    setAttendanceMap(prev => ({
      ...prev,
      [key]: nextStatus
    }));
    setHasUnsavedChanges(true);
  };

  // Bulk: Mark All Present on active date
  const handleMarkAllPresent = (date = selectedDate) => {
    const nextMap = { ...attendanceMap };
    students.forEach(st => {
      nextMap[`${st.id}_${date}`] = 'PRESENT';
    });
    setAttendanceMap(nextMap);
    setHasUnsavedChanges(true);
    showToast(`Marked all students PRESENT for ${date}`, 'success');
  };

  // Bulk: Mark All Absent on active date
  const handleMarkAllAbsent = (date = selectedDate) => {
    const nextMap = { ...attendanceMap };
    students.forEach(st => {
      nextMap[`${st.id}_${date}`] = 'ABSENT';
    });
    setAttendanceMap(nextMap);
    setHasUnsavedChanges(true);
    showToast(`Marked all students ABSENT for ${date}`, 'warning');
  };

  // Add new date column to Excel Sheet
  const handleAddDateSession = () => {
    if (!selectedDate) return;
    if (recordedDates.includes(selectedDate)) {
      showToast(`Date ${selectedDate} is already in the attendance sheet`, 'info');
      return;
    }
    const newDates = [...recordedDates, selectedDate].sort();
    setRecordedDates(newDates);

    // Default all students to PRESENT on new date
    const nextMap = { ...attendanceMap };
    students.forEach(st => {
      nextMap[`${st.id}_${selectedDate}`] = 'PRESENT';
    });
    setAttendanceMap(nextMap);
    setHasUnsavedChanges(true);
    showToast(`Added lecture session column for ${selectedDate}`, 'success');
  };

  // Save Daily Attendance
  const handleSaveDailyAttendance = async () => {
    if (!selectedDept || !selectedYear || !selectedDivision || !selectedSubjectId) return;
    setActionLoading(true);
    try {
      const recordsToSave = [];
      recordedDates.forEach(d => {
        students.forEach(st => {
          const status = attendanceMap[`${st.id}_${d}`] || 'PRESENT';
          recordsToSave.push({ studentId: st.id, status });
        });
      });

      // Save for selectedDate (or all active dates)
      for (const d of recordedDates) {
        const dateRecords = students.map(st => ({
          studentId: st.id,
          status: attendanceMap[`${st.id}_${d}`] || 'PRESENT'
        }));

        await authFetch('/api/admin/attendance/save-daily', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            department: selectedDept,
            year: selectedYear,
            division: selectedDivision,
            subjectId: selectedSubjectId,
            date: d,
            records: dateRecords
          })
        });
      }

      showToast('Daily attendance saved successfully!', 'success');
      setHasUnsavedChanges(false);
      fetchAttendanceSheet();
      fetchStats();
    } catch (err) {
      showToast('Error saving daily attendance: ' + err.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // COUNT PERCENTAGE (Calculates all students automatically)
  const handleCountPercentage = async () => {
    if (!selectedDept || !selectedYear || !selectedDivision || !selectedSubjectId) return;
    setActionLoading(true);
    try {
      // If unsaved changes exist, auto-save first
      if (hasUnsavedChanges) {
        await handleSaveDailyAttendance();
      }

      const res = await authFetch('/api/admin/attendance/count-percentage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          department: selectedDept,
          year: selectedYear,
          division: selectedDivision,
          subjectId: selectedSubjectId,
          startDate: startDate || null,
          endDate: endDate || null
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast(data.message || 'Attendance percentage computed for all students!', 'success');
        fetchAttendanceSheet();
        fetchDefaulters();
        fetchStats();
        setActiveTab('percentage');
      } else {
        showToast(data.message || 'Failed to calculate percentage', 'error');
      }
    } catch (err) {
      showToast('Error counting percentage: ' + err.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // SEND TO STUDENT (Publish Attendance to Targeted Cohort)
  const handleSendToStudent = async () => {
    if (!selectedDept || !selectedYear || !selectedDivision || !selectedSubjectId) return;
    setActionLoading(true);
    try {
      const res = await authFetch('/api/admin/attendance/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          department: selectedDept,
          year: selectedYear,
          division: selectedDivision,
          subjectId: selectedSubjectId,
          startDate: startDate || null,
          endDate: endDate || null
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast(data.message || 'Attendance published to students successfully!', 'success');
        fetchAttendanceSheet();
        fetchStats();
      } else {
        showToast(data.message || 'Failed to publish attendance', 'error');
      }
    } catch (err) {
      showToast('Error publishing attendance: ' + err.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const selectedSubject = subjects.find(s => s.id === selectedSubjectId || s.code === selectedSubjectId);

  return (
    <div className="admin-page-container" style={{ padding: '1.5rem', maxWidth: '1600px', margin: '0 auto' }}>
      {/* Header Banner */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem',
        marginBottom: '1.5rem',
        padding: '1.5rem',
        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.12) 0%, rgba(168, 85, 247, 0.08) 100%)',
        border: '1px solid rgba(99, 102, 241, 0.25)',
        borderRadius: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            boxShadow: '0 4px 12px rgba(99, 102, 241, 0.35)'
          }}>
            <ClipboardCheck size={26} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              Attendance Command Center
              <span style={{ fontSize: '0.72rem', background: '#4f46e5', color: '#fff', padding: '0.2rem 0.6rem', borderRadius: '999px', fontWeight: 700 }}>
                Enterprise Hub
              </span>
            </h1>
            <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: '0.25rem 0 0 0' }}>
              Excel-style daily register, automated percentage engine, 30% defaulter detection & division-targeted student publishing.
            </p>
          </div>
        </div>

        {/* Global Summary Chips */}
        {statsData && (
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <div style={{ background: 'rgba(15, 23, 42, 0.8)', padding: '0.5rem 1rem', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>TOTAL SESSIONS</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#38bdf8' }}>{statsData.totalConductedSessions}</div>
            </div>
            <div style={{ background: 'rgba(15, 23, 42, 0.8)', padding: '0.5rem 1rem', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>COLLEGE AVG</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#34d399' }}>{statsData.averageCollegeAttendance}</div>
            </div>
            <div style={{ background: 'rgba(15, 23, 42, 0.8)', padding: '0.5rem 1rem', borderRadius: '10px', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
              <div style={{ fontSize: '0.7rem', color: '#f87171' }}>TOTAL DEFAULTERS (&lt;30%)</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#ef4444' }}>{statsData.totalDefaultersCount}</div>
            </div>
          </div>
        )}
      </div>

      {/* Branch / Department Folder Tabs */}
      <DepartmentFolderTabs
        endpoint="/api/admin/departments"
        selectedDepartment={selectedDept}
        onSelectDepartment={(dept) => {
          setSelectedDept(dept);
        }}
        showAllOption={false}
      />

      {/* Selection Toolbar: Year, Division, Subject & Active Date */}
      <div className="card" style={{
        padding: '1.25rem',
        marginBottom: '1.5rem',
        background: 'rgba(15, 23, 42, 0.75)',
        border: '1px solid var(--border-subtle)',
        borderRadius: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            {/* Year Selector */}
            <div>
              <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '0.25rem', fontWeight: 600 }}>
                ACADEMIC YEAR
              </label>
              <select
                className="form-control"
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                style={{ padding: '0.45rem 0.75rem', background: '#1e293b', color: '#fff', border: '1px solid #334155', borderRadius: '8px', fontSize: '0.85rem' }}
              >
                <option value="SE">Second Year (SE)</option>
                <option value="TE">Third Year (TE)</option>
                <option value="BE">Final Year (BE)</option>
                <option value="1st Year">First Year (FE)</option>
              </select>
            </div>

            {/* Division Selector */}
            <div>
              <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '0.25rem', fontWeight: 600 }}>
                DIVISION / CLASS
              </label>
              <select
                className="form-control"
                value={selectedDivision}
                onChange={(e) => setSelectedDivision(e.target.value)}
                style={{ padding: '0.45rem 0.75rem', background: '#1e293b', color: '#fff', border: '1px solid #334155', borderRadius: '8px', fontSize: '0.85rem' }}
              >
                <option value="A">Division A</option>
                <option value="B">Division B</option>
                <option value="C">Division C</option>
              </select>
            </div>

            {/* Subject Selector */}
            <div>
              <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '0.25rem', fontWeight: 600 }}>
                SUBJECT / COURSE
              </label>
              <select
                className="form-control"
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(e.target.value)}
                style={{ padding: '0.45rem 0.75rem', background: '#1e293b', color: '#fff', border: '1px solid #334155', borderRadius: '8px', fontSize: '0.85rem', minWidth: '220px' }}
              >
                {subjects.map(sub => (
                  <option key={sub.id} value={sub.id}>
                    {sub.code} — {sub.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Selector for New Session */}
            <div>
              <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '0.25rem', fontWeight: 600 }}>
                LECTURE DATE
              </label>
              <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                <input
                  type="date"
                  className="form-control"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  style={{ padding: '0.45rem 0.6rem', background: '#1e293b', color: '#fff', border: '1px solid #334155', borderRadius: '8px', fontSize: '0.85rem' }}
                />
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={handleAddDateSession}
                  title="Add Date Column to Excel Register"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.45rem 0.75rem', borderRadius: '8px' }}
                >
                  <Plus size={14} /> Add Date
                </button>
              </div>
            </div>
          </div>

          {/* Primary Action Buttons: Save, Count Percentage, Send to Student */}
          <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              className="btn btn-secondary btn-sm"
              onClick={handleSaveDailyAttendance}
              disabled={actionLoading || loading}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.55rem 1rem',
                borderRadius: '8px',
                background: hasUnsavedChanges ? 'rgba(234, 179, 8, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                color: hasUnsavedChanges ? '#fbbf24' : '#fff',
                border: hasUnsavedChanges ? '1px solid rgba(234, 179, 8, 0.5)' : '1px solid var(--border-subtle)'
              }}
            >
              <Save size={16} />
              {hasUnsavedChanges ? 'Save Changes *' : 'Save Daily Attendance'}
            </button>

            <button
              className="btn btn-primary btn-sm"
              onClick={handleCountPercentage}
              disabled={actionLoading || loading}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.55rem 1.1rem',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                color: '#fff',
                fontWeight: 700,
                boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)'
              }}
            >
              <Calculator size={16} />
              COUNT PERCENTAGE
            </button>

            <button
              className="btn btn-success btn-sm"
              onClick={handleSendToStudent}
              disabled={actionLoading || loading}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.55rem 1.1rem',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: '#fff',
                fontWeight: 700,
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
              }}
            >
              <Send size={16} />
              SEND TO STUDENT
            </button>
          </div>
        </div>

        {/* Active Target Banner */}
        <div style={{
          marginTop: '1rem',
          paddingTop: '0.75rem',
          borderTop: '1px solid rgba(255, 255, 255, 0.06)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '0.82rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#94a3b8' }}>
            <span>Target Cohort:</span>
            <strong style={{ color: '#fff' }}>
              {selectedDept} • {selectedYear}-{selectedDivision}
            </strong>
            <span>|</span>
            <span>Subject:</span>
            <strong style={{ color: '#818cf8' }}>
              {selectedSubject ? `${selectedSubject.name} (${selectedSubject.code})` : 'Select Subject'}
            </strong>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{
              padding: '0.2rem 0.6rem',
              borderRadius: '6px',
              fontSize: '0.75rem',
              fontWeight: 700,
              background: summaryData?.isPublished ? 'rgba(16, 185, 129, 0.2)' : 'rgba(234, 179, 8, 0.15)',
              color: summaryData?.isPublished ? '#34d399' : '#fbbf24',
              border: summaryData?.isPublished ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(234, 179, 8, 0.3)'
            }}>
              {summaryData?.isPublished ? `✓ Published to Students (${summaryData.publishedAt ? new Date(summaryData.publishedAt).toLocaleDateString() : 'Active'})` : '● Draft / Not Published'}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
        <button
          className={`btn ${activeTab === 'sheet' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('sheet')}
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.55rem 1.25rem', borderRadius: '10px' }}
        >
          <ClipboardCheck size={16} />
          Excel-Style Attendance Register
        </button>

        <button
          className={`btn ${activeTab === 'percentage' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('percentage')}
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.55rem 1.25rem', borderRadius: '10px' }}
        >
          <Calculator size={16} />
          Percentage & Summary Matrix
        </button>

        <button
          className={`btn ${activeTab === 'defaulters' ? 'btn-danger' : 'btn-secondary'}`}
          onClick={() => setActiveTab('defaulters')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.55rem 1.25rem',
            borderRadius: '10px',
            background: activeTab === 'defaulters' ? '#ef4444' : 'rgba(239, 68, 68, 0.12)',
            color: activeTab === 'defaulters' ? '#fff' : '#f87171',
            border: '1px solid rgba(239, 68, 68, 0.35)'
          }}
        >
          <AlertTriangle size={16} />
          Defaulter List (&lt; 30%)
          {defaultersList.length > 0 && (
            <span style={{
              background: '#fff',
              color: '#ef4444',
              padding: '0.1rem 0.45rem',
              borderRadius: '999px',
              fontSize: '0.7rem',
              fontWeight: 800
            }}>
              {defaultersList.length}
            </span>
          )}
        </button>
      </div>

      {/* TAB 1: EXCEL-STYLE ATTENDANCE REGISTER */}
      {activeTab === 'sheet' && (
        <div className="card" style={{ padding: '1.25rem', background: 'rgba(15, 23, 42, 0.75)', border: '1px solid var(--border-subtle)', borderRadius: '16px' }}>
          {/* Quick Toolbar for Excel Sheet */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Quick Fill:</span>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => handleMarkAllPresent(selectedDate)}
                style={{ fontSize: '0.78rem', padding: '0.3rem 0.65rem' }}
              >
                Mark All Present ({selectedDate})
              </button>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => handleMarkAllAbsent(selectedDate)}
                style={{ fontSize: '0.78rem', padding: '0.3rem 0.65rem' }}
              >
                Mark All Absent ({selectedDate})
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.78rem', color: '#94a3b8' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#10b981', display: 'inline-block' }}></span>
                <span>P = Present (Click to toggle)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#ef4444', display: 'inline-block' }}></span>
                <span>A = Absent</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#f59e0b', display: 'inline-block' }}></span>
                <span>L = Late</span>
              </div>
            </div>
          </div>

          {/* Excel Grid Table */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>Loading attendance sheet...</div>
          ) : students.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
              No active students found in {selectedDept} {selectedYear}-{selectedDivision}.
            </div>
          ) : (
            <div className="table-container" style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
              <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', minWidth: '850px' }}>
                <thead>
                  <tr style={{ background: 'rgba(255, 255, 255, 0.04)' }}>
                    <th style={{ width: '70px', padding: '0.75rem', textAlign: 'center', borderRight: '1px solid var(--border-subtle)' }}>Roll No</th>
                    <th style={{ width: '220px', padding: '0.75rem', textAlign: 'left', borderRight: '1px solid var(--border-subtle)' }}>Student Name</th>
                    {recordedDates.map(d => (
                      <th
                        key={d}
                        style={{
                          padding: '0.75rem 0.5rem',
                          textAlign: 'center',
                          borderRight: '1px solid var(--border-subtle)',
                          minWidth: '85px',
                          background: d === selectedDate ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                          color: d === selectedDate ? '#818cf8' : '#fff'
                        }}
                      >
                        <div style={{ fontSize: '0.78rem', fontWeight: 700 }}>
                          {d.split('-').slice(1).join('/')}
                        </div>
                        <div style={{ fontSize: '0.65rem', color: '#94a3b8' }}>
                          {new Date(d).toLocaleDateString('en-US', { weekday: 'short' })}
                        </div>
                      </th>
                    ))}
                    <th style={{ width: '90px', padding: '0.75rem', textAlign: 'center' }}>Present %</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map(st => {
                    // Count present on recorded dates
                    let presentCount = 0;
                    recordedDates.forEach(d => {
                      if (attendanceMap[`${st.id}_${d}`] === 'PRESENT') presentCount++;
                    });
                    const pct = recordedDates.length > 0 ? ((presentCount / recordedDates.length) * 100).toFixed(0) : 0;
                    const isDefaulter = pct < 30 && recordedDates.length > 0;

                    return (
                      <tr key={st.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        {/* Roll Number */}
                        <td style={{ textAlign: 'center', padding: '0.6rem', fontWeight: 700, color: '#38bdf8', borderRight: '1px solid var(--border-subtle)' }}>
                          {st.rollNumber || '—'}
                        </td>

                        {/* Student Name */}
                        <td style={{ padding: '0.6rem', fontWeight: 600, color: '#fff', borderRight: '1px solid var(--border-subtle)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span>{st.name}</span>
                            {isDefaulter && (
                              <span style={{ fontSize: '0.65rem', padding: '0.1rem 0.35rem', background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', borderRadius: '4px', fontWeight: 800 }}>
                                DEFAULTER
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Date Status Cells */}
                        {recordedDates.map(d => {
                          const status = attendanceMap[`${st.id}_${d}`] || 'PRESENT';
                          const isP = status === 'PRESENT';
                          const isA = status === 'ABSENT';
                          const isL = status === 'LATE';

                          return (
                            <td
                              key={d}
                              onClick={() => handleToggleCellStatus(st.id, d)}
                              style={{
                                padding: '0.45rem',
                                textAlign: 'center',
                                borderRight: '1px solid var(--border-subtle)',
                                cursor: 'pointer',
                                background: d === selectedDate ? 'rgba(99, 102, 241, 0.04)' : 'transparent',
                                userSelect: 'none'
                              }}
                              title="Click to toggle: Present -> Absent -> Late"
                            >
                              <div style={{
                                width: '32px',
                                height: '32px',
                                margin: '0 auto',
                                borderRadius: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 800,
                                fontSize: '0.85rem',
                                transition: 'all 0.15s ease',
                                background: isP ? 'rgba(16, 185, 129, 0.2)' : (isA ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.2)'),
                                color: isP ? '#34d399' : (isA ? '#f87171' : '#fbbf24'),
                                border: isP ? '1px solid rgba(16, 185, 129, 0.4)' : (isA ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(245, 158, 11, 0.4)')
                              }}>
                                {isP ? 'P' : (isA ? 'A' : 'L')}
                              </div>
                            </td>
                          );
                        })}

                        {/* Live Percentage */}
                        <td style={{ textAlign: 'center', padding: '0.6rem', fontWeight: 800, color: isDefaulter ? '#ef4444' : (pct >= 75 ? '#34d399' : '#fbbf24') }}>
                          {pct}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: PERCENTAGE SUMMARY MATRIX */}
      {activeTab === 'percentage' && (
        <div className="card" style={{ padding: '1.25rem', background: 'rgba(15, 23, 42, 0.75)', border: '1px solid var(--border-subtle)', borderRadius: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', margin: 0 }}>
                Attendance Percentage & Compliance Matrix
              </h3>
              <p style={{ color: '#94a3b8', fontSize: '0.82rem', margin: '0.2rem 0 0 0' }}>
                Computed using formula: (Total Present ÷ Total Conducted Classes) × 100
              </p>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                className="btn btn-primary btn-sm"
                onClick={handleCountPercentage}
                disabled={actionLoading}
                style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
              >
                <Calculator size={15} /> Recalculate Percentages
              </button>
              <button
                className="btn btn-success btn-sm"
                onClick={handleSendToStudent}
                disabled={actionLoading}
                style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
              >
                <Send size={15} /> SEND TO STUDENT
              </button>
            </div>
          </div>

          {/* Computed Summary Table */}
          {summaryData?.students && summaryData.students.length > 0 ? (
            <div className="table-container" style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
              <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'rgba(255, 255, 255, 0.04)' }}>
                    <th style={{ padding: '0.75rem', width: '80px', textAlign: 'center' }}>Roll No</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left' }}>Student Name</th>
                    <th style={{ padding: '0.75rem', textAlign: 'center' }}>Conducted</th>
                    <th style={{ padding: '0.75rem', textAlign: 'center' }}>Present</th>
                    <th style={{ padding: '0.75rem', textAlign: 'center' }}>Absent</th>
                    <th style={{ padding: '0.75rem', textAlign: 'center' }}>Attendance %</th>
                    <th style={{ padding: '0.75rem', textAlign: 'center' }}>Status</th>
                    <th style={{ padding: '0.75rem', textAlign: 'center' }}>Published</th>
                  </tr>
                </thead>
                <tbody>
                  {summaryData.students.map(st => {
                    const isDefaulter = st.isDefaulter === 1 || st.attendancePercentage < 30;
                    return (
                      <tr
                        key={st.studentId}
                        style={{
                          borderBottom: '1px solid var(--border-subtle)',
                          background: isDefaulter ? 'rgba(239, 68, 68, 0.04)' : 'transparent'
                        }}
                      >
                        <td style={{ textAlign: 'center', padding: '0.65rem', fontWeight: 700, color: '#38bdf8' }}>
                          {st.rollNumber || '—'}
                        </td>
                        <td style={{ padding: '0.65rem', fontWeight: 600, color: '#fff' }}>
                          {st.studentName}
                        </td>
                        <td style={{ textAlign: 'center', padding: '0.65rem', color: '#94a3b8' }}>
                          {st.totalConducted}
                        </td>
                        <td style={{ textAlign: 'center', padding: '0.65rem', color: '#34d399', fontWeight: 700 }}>
                          {st.totalPresent}
                        </td>
                        <td style={{ textAlign: 'center', padding: '0.65rem', color: '#f87171', fontWeight: 700 }}>
                          {st.totalAbsent}
                        </td>
                        <td style={{ textAlign: 'center', padding: '0.65rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                            <strong style={{
                              fontSize: '0.95rem',
                              color: isDefaulter ? '#ef4444' : (st.attendancePercentage >= 75 ? '#34d399' : '#fbbf24')
                            }}>
                              {st.attendancePercentage}%
                            </strong>
                          </div>
                        </td>
                        <td style={{ textAlign: 'center', padding: '0.65rem' }}>
                          <span style={{
                            padding: '0.2rem 0.6rem',
                            borderRadius: '6px',
                            fontSize: '0.72rem',
                            fontWeight: 800,
                            background: isDefaulter ? 'rgba(239, 68, 68, 0.2)' : (st.attendancePercentage >= 75 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(234, 179, 8, 0.2)'),
                            color: isDefaulter ? '#ef4444' : (st.attendancePercentage >= 75 ? '#34d399' : '#fbbf24'),
                            border: isDefaulter ? '1px solid rgba(239, 68, 68, 0.4)' : (st.attendancePercentage >= 75 ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(234, 179, 8, 0.4)')
                          }}>
                            {isDefaulter ? 'DEFAULTER' : (st.attendancePercentage >= 75 ? 'Good Standing' : 'Average')}
                          </span>
                        </td>
                        <td style={{ textAlign: 'center', padding: '0.65rem' }}>
                          <span style={{
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            color: st.isPublished ? '#34d399' : '#94a3b8'
                          }}>
                            {st.isPublished ? '✓ Yes' : 'No'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
              No percentage calculations yet. Click <strong>COUNT PERCENTAGE</strong> to compute attendance for all students.
            </div>
          )}
        </div>
      )}

      {/* TAB 3: DEFAULTER LIST (< 30%) */}
      {activeTab === 'defaulters' && (
        <div className="card" style={{ padding: '1.5rem', background: 'rgba(15, 23, 42, 0.75)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '16px' }}>
          {/* Warning Banner */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            padding: '1rem 1.25rem',
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '12px',
            marginBottom: '1.5rem'
          }}>
            <ShieldAlert size={28} color="#ef4444" />
            <div>
              <h4 style={{ margin: 0, color: '#ef4444', fontSize: '1rem', fontWeight: 800 }}>
                Official Defaulter Notice — Mandatory &lt; 30% Threshold
              </h4>
              <p style={{ margin: '0.2rem 0 0 0', color: '#fca5a5', fontSize: '0.85rem' }}>
                Display message: <strong>“Please complete your attendance.”</strong> Students listed below are severely below the required academic attendance minimum.
              </p>
            </div>
          </div>

          {defaultersList.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#34d399' }}>
              <CheckCircle2 size={40} style={{ margin: '0 auto 0.5rem auto' }} />
              <h4 style={{ color: '#fff', margin: 0 }}>No Defaulters Found</h4>
              <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
                All students in {selectedDept} {selectedYear}-{selectedDivision} maintain attendance &gt;= 30%.
              </p>
            </div>
          ) : (
            <div className="table-container" style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid rgba(239, 68, 68, 0.25)' }}>
              <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'rgba(239, 68, 68, 0.08)' }}>
                    <th style={{ padding: '0.75rem', width: '80px', textAlign: 'center' }}>Roll No</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left' }}>Student Name</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left' }}>Subject</th>
                    <th style={{ padding: '0.75rem', textAlign: 'center' }}>Conducted</th>
                    <th style={{ padding: '0.75rem', textAlign: 'center' }}>Present</th>
                    <th style={{ padding: '0.75rem', textAlign: 'center' }}>Attendance %</th>
                    <th style={{ padding: '0.75rem', textAlign: 'center' }}>Status</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left' }}>Action Message</th>
                  </tr>
                </thead>
                <tbody>
                  {defaultersList.map(def => (
                    <tr key={def.id} style={{ borderBottom: '1px solid rgba(239, 68, 68, 0.15)', background: 'rgba(239, 68, 68, 0.02)' }}>
                      <td style={{ textAlign: 'center', padding: '0.65rem', fontWeight: 800, color: '#ef4444' }}>
                        {def.rollNumber || '—'}
                      </td>
                      <td style={{ padding: '0.65rem', fontWeight: 700, color: '#fff' }}>
                        {def.studentName}
                      </td>
                      <td style={{ padding: '0.65rem', color: '#818cf8', fontWeight: 600 }}>
                        {def.subjectName} ({def.subjectCode})
                      </td>
                      <td style={{ textAlign: 'center', padding: '0.65rem', color: '#94a3b8' }}>
                        {def.totalConducted}
                      </td>
                      <td style={{ textAlign: 'center', padding: '0.65rem', color: '#ef4444', fontWeight: 800 }}>
                        {def.totalPresent}
                      </td>
                      <td style={{ textAlign: 'center', padding: '0.65rem' }}>
                        <strong style={{ fontSize: '1rem', color: '#ef4444' }}>
                          {def.attendancePercentage}%
                        </strong>
                      </td>
                      <td style={{ textAlign: 'center', padding: '0.65rem' }}>
                        <span style={{
                          padding: '0.2rem 0.6rem',
                          borderRadius: '6px',
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          background: 'rgba(239, 68, 68, 0.25)',
                          color: '#ef4444',
                          border: '1px solid rgba(239, 68, 68, 0.5)'
                        }}>
                          DEFAULTER
                        </span>
                      </td>
                      <td style={{ padding: '0.65rem', color: '#fca5a5', fontSize: '0.82rem', fontWeight: 600 }}>
                        “Please complete your attendance.”
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
