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
  BookOpen,
  Info
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import DepartmentFolderTabs from '../common/DepartmentFolderTabs';

export default function FacultyAttendanceView() {
  const { user, authFetch, showToast } = useAuth();

  // Selected Filters (defaults to Computer Engineering Second Year Division C)
  const [selectedDept, setSelectedDept] = useState(user?.department || 'Computer Engineering');
  const [selectedYear, setSelectedYear] = useState('SE');
  const [selectedDivision, setSelectedDivision] = useState('C');
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

  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Filtered Subjects: For Computer Engineering SE Division C, strictly keep only DSGT, AOA, MAX, COA
  const filteredSubjects = React.useMemo(() => {
    let list = subjects.filter(s => !selectedDept || s.department === selectedDept);
    if (selectedDept === 'Computer Engineering' && selectedYear === 'SE' && selectedDivision === 'C') {
      const allowedCodes = ['DSGT', 'AOA', 'MAX', 'COA'];
      list = list.filter(s => allowedCodes.includes(s.code));
    }
    return list;
  }, [subjects, selectedDept, selectedYear, selectedDivision]);

  // Load Subjects for selected Department
  const fetchSubjects = useCallback(async () => {
    try {
      const res = await authFetch('/api/faculty/subjects');
      const data = await res.json();
      if (res.ok && data.success) {
        const rawSubjects = data.subjects || [];
        setSubjects(rawSubjects);
      }
    } catch (err) {
      console.error('Error fetching faculty subjects:', err);
    }
  }, [authFetch]);

  useEffect(() => {
    fetchSubjects();
  }, [fetchSubjects]);

  // Sync selectedSubjectId with filteredSubjects
  useEffect(() => {
    if (filteredSubjects.length > 0) {
      if (!filteredSubjects.some(s => s.id === selectedSubjectId || s.code === selectedSubjectId)) {
        setSelectedSubjectId(filteredSubjects[0].id);
      }
    } else {
      setSelectedSubjectId('');
    }
  }, [filteredSubjects, selectedSubjectId]);

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

      const res = await authFetch(`/api/faculty/attendance/sheet?${queryParams.toString()}`);
      const data = await res.json();

      if (res.ok && data.success) {
        setStudents(data.students || []);

        const dates = data.dates || [];
        if (selectedDate && !dates.includes(selectedDate)) {
          dates.push(selectedDate);
          dates.sort();
        }
        setRecordedDates(dates);

        const map = {};
        (data.records || []).forEach(r => {
          map[`${r.studentId}_${r.date}`] = r.status;
        });

        // Default to PRESENT if no status
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

      const res = await authFetch(`/api/faculty/attendance/defaulters?${queryParams.toString()}`);
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

  // Set specific status for student on date
  const handleSetStudentStatus = (studentId, date, status) => {
    const key = `${studentId}_${date}`;
    setAttendanceMap(prev => ({
      ...prev,
      [key]: status
    }));
    setHasUnsavedChanges(true);
  };

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

  // Bulk: Mark All Present
  const handleMarkAllPresent = (date = selectedDate) => {
    const nextMap = { ...attendanceMap };
    students.forEach(st => {
      nextMap[`${st.id}_${date}`] = 'PRESENT';
    });
    setAttendanceMap(nextMap);
    setHasUnsavedChanges(true);
    showToast(`Marked all students PRESENT for ${date}`, 'success');
  };

  // Bulk: Mark All Absent
  const handleMarkAllAbsent = (date = selectedDate) => {
    const nextMap = { ...attendanceMap };
    students.forEach(st => {
      nextMap[`${st.id}_${date}`] = 'ABSENT';
    });
    setAttendanceMap(nextMap);
    setHasUnsavedChanges(true);
    showToast(`Marked all students ABSENT for ${date}`, 'warning');
  };

  // Bulk: Mark All Late
  const handleMarkAllLate = (date = selectedDate) => {
    const nextMap = { ...attendanceMap };
    students.forEach(st => {
      nextMap[`${st.id}_${date}`] = 'LATE';
    });
    setAttendanceMap(nextMap);
    setHasUnsavedChanges(true);
    showToast(`Marked all students LATE for ${date}`, 'info');
  };

  // Add new date column to Attendance Register
  const handleAddDateSession = () => {
    if (!selectedDate) return;
    if (recordedDates.includes(selectedDate)) {
      showToast(`Date ${selectedDate} is already in the attendance sheet`, 'info');
      return;
    }
    const newDates = [...recordedDates, selectedDate].sort();
    setRecordedDates(newDates);

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
      for (const d of recordedDates) {
        const dateRecords = students.map(st => ({
          studentId: st.id,
          status: attendanceMap[`${st.id}_${d}`] || 'PRESENT'
        }));

        await authFetch('/api/faculty/attendance/save-daily', {
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
    } catch (err) {
      showToast('Error saving daily attendance: ' + err.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // COUNT PERCENTAGE (Automated calculation for class)
  const handleCountPercentage = async () => {
    if (!selectedDept || !selectedYear || !selectedDivision || !selectedSubjectId) return;
    setActionLoading(true);
    try {
      if (hasUnsavedChanges) {
        await handleSaveDailyAttendance();
      }

      const res = await authFetch('/api/faculty/attendance/count-percentage', {
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

  // SEND TO STUDENT (Publish to target cohort only)
  const handleSendToStudent = async () => {
    if (!selectedDept || !selectedYear || !selectedDivision || !selectedSubjectId) return;
    setActionLoading(true);
    try {
      const res = await authFetch('/api/faculty/attendance/publish', {
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Branch / Department Folder Tabs */}
      <DepartmentFolderTabs
        endpoint="/api/faculty/departments"
        selectedDepartment={selectedDept}
        onSelectDepartment={(dept) => {
          setSelectedDept(dept);
        }}
        showAllOption={false}
      />

      {/* Control Bar */}
      <div className="card" style={{
        padding: '1.25rem',
        background: 'rgba(15, 23, 42, 0.75)',
        border: '1px solid var(--border-subtle)',
        borderRadius: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            {/* Year Selector */}
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem', fontWeight: 600 }}>
                YEAR
              </label>
              <select
                className="form-control"
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                style={{ padding: '0.45rem 0.75rem', background: 'var(--bg-input)', color: 'var(--text-primary)', border: '1px solid var(--border-subtle)', borderRadius: '8px', fontSize: '0.85rem' }}
              >
                <option value="SE">Second Year (SE)</option>
                <option value="TE">Third Year (TE)</option>
                <option value="BE">Final Year (BE)</option>
                <option value="1st Year">First Year (FE)</option>
              </select>
            </div>

            {/* Division Selector */}
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem', fontWeight: 600 }}>
                DIVISION
              </label>
              <select
                className="form-control"
                value={selectedDivision}
                onChange={(e) => setSelectedDivision(e.target.value)}
                style={{ padding: '0.45rem 0.75rem', background: 'var(--bg-input)', color: 'var(--text-primary)', border: '1px solid var(--border-subtle)', borderRadius: '8px', fontSize: '0.85rem' }}
              >
                <option value="A">Division A</option>
                <option value="B">Division B</option>
                <option value="C">Division C</option>
              </select>
            </div>

            {/* Subject Selector */}
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem', fontWeight: 600 }}>
                SUBJECT
              </label>
              <select
                className="form-control"
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(e.target.value)}
                style={{ padding: '0.45rem 0.75rem', background: 'var(--bg-input)', color: 'var(--text-primary)', border: '1px solid var(--border-subtle)', borderRadius: '8px', fontSize: '0.85rem', minWidth: '220px' }}
              >
                {filteredSubjects.map(sub => (
                  <option key={sub.id} value={sub.id}>
                    {sub.code} — {sub.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Picker */}
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem', fontWeight: 600 }}>
                LECTURE DATE
              </label>
              <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                <input
                  type="date"
                  className="form-control"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  style={{ padding: '0.45rem 0.6rem', background: 'var(--bg-input)', color: 'var(--text-primary)', border: '1px solid var(--border-subtle)', borderRadius: '8px', fontSize: '0.85rem' }}
                />
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={handleAddDateSession}
                  title="Add Date Column"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.45rem 0.75rem', borderRadius: '8px' }}
                >
                  <Plus size={14} /> Add Date
                </button>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
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
              {hasUnsavedChanges ? 'Save Changes *' : 'Save Attendance'}
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

        {/* Target Info Banner */}
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
            <span>Target Class:</span>
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
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button
          className={`btn ${activeTab === 'sheet' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('sheet')}
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.55rem 1.25rem', borderRadius: '10px' }}
        >
          <ClipboardCheck size={16} />
          Attendance Register
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

      {/* TAB 1: ATTENDANCE REGISTER */}
      {activeTab === 'sheet' && (
        <div className="card" style={{ padding: '1.25rem', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '16px' }}>
          {/* Quick Toolbar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Quick Fill ({selectedDate}):</span>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => handleMarkAllPresent(selectedDate)}
                style={{ fontSize: '0.78rem', padding: '0.3rem 0.65rem', background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.3)' }}
              >
                Mark All Present
              </button>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => handleMarkAllAbsent(selectedDate)}
                style={{ fontSize: '0.78rem', padding: '0.3rem 0.65rem', background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.3)' }}
              >
                Mark All Absent
              </button>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => handleMarkAllLate(selectedDate)}
                style={{ fontSize: '0.78rem', padding: '0.3rem 0.65rem', background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.3)' }}
              >
                Mark All Late
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.78rem', color: '#94a3b8' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#10b981', display: 'inline-block' }}></span>
                <span>Present</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#ef4444', display: 'inline-block' }}></span>
                <span>Absent</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#f59e0b', display: 'inline-block' }}></span>
                <span>Late</span>
              </div>
            </div>
          </div>

          {/* Attendance Register Table */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>Loading attendance register...</div>
          ) : students.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
              No students enrolled in {selectedDept} {selectedYear}-{selectedDivision}.
            </div>
          ) : (
            <div className="table-container" style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
              <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', minWidth: '850px' }}>
                <thead>
                  <tr style={{ background: 'rgba(255, 255, 255, 0.04)' }}>
                    <th style={{ width: '220px', padding: '0.75rem', textAlign: 'left', borderRight: '1px solid var(--border-subtle)' }}>Student Name</th>
                    <th style={{ width: '80px', padding: '0.75rem', textAlign: 'center', borderRight: '1px solid var(--border-subtle)' }}>Roll No</th>
                    <th style={{ width: '130px', padding: '0.75rem', textAlign: 'center', borderRight: '1px solid var(--border-subtle)' }}>Enrollment No</th>
                    <th style={{ width: '250px', padding: '0.75rem', textAlign: 'center', borderRight: '1px solid var(--border-subtle)', background: 'rgba(99, 102, 241, 0.1)' }}>
                      Attendance Status ({selectedDate})
                    </th>
                    {recordedDates.filter(d => d !== selectedDate).map(d => (
                      <th
                        key={d}
                        style={{
                          padding: '0.75rem 0.5rem',
                          textAlign: 'center',
                          borderRight: '1px solid var(--border-subtle)',
                          minWidth: '75px',
                          color: '#cbd5e1'
                        }}
                      >
                        <div style={{ fontSize: '0.75rem', fontWeight: 700 }}>
                          {d.split('-').slice(1).join('/')}
                        </div>
                        <div style={{ fontSize: '0.62rem', color: '#94a3b8' }}>
                          {new Date(d).toLocaleDateString('en-US', { weekday: 'short' })}
                        </div>
                      </th>
                    ))}
                    <th style={{ width: '90px', padding: '0.75rem', textAlign: 'center' }}>Present %</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map(st => {
                    let presentCount = 0;
                    recordedDates.forEach(d => {
                      if (attendanceMap[`${st.id}_${d}`] === 'PRESENT') presentCount++;
                    });
                    const pct = recordedDates.length > 0 ? ((presentCount / recordedDates.length) * 100).toFixed(0) : 0;
                    const isDefaulter = pct < 30 && recordedDates.length > 0;
                    const currentStatus = attendanceMap[`${st.id}_${selectedDate}`] || 'PRESENT';

                    return (
                      <tr key={st.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
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
                        <td style={{ textAlign: 'center', padding: '0.6rem', fontWeight: 700, color: '#38bdf8', borderRight: '1px solid var(--border-subtle)' }}>
                          {st.rollNumber || '—'}
                        </td>
                        <td style={{ textAlign: 'center', padding: '0.6rem', fontWeight: 600, color: '#cbd5e1', borderRight: '1px solid var(--border-subtle)', fontSize: '0.85rem' }}>
                          {st.enrollmentNumber || '—'}
                        </td>

                        {/* Interactive Attendance Options: Present / Absent / Late */}
                        <td style={{ padding: '0.5rem', textAlign: 'center', borderRight: '1px solid var(--border-subtle)', background: 'rgba(99, 102, 241, 0.04)' }}>
                          <div style={{ display: 'inline-flex', gap: '0.35rem', background: 'rgba(0, 0, 0, 0.35)', padding: '0.25rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
                            <button
                              type="button"
                              onClick={() => handleSetStudentStatus(st.id, selectedDate, 'PRESENT')}
                              style={{
                                padding: '0.3rem 0.65rem',
                                borderRadius: '6px',
                                fontSize: '0.78rem',
                                fontWeight: 700,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.25rem',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease',
                                background: currentStatus === 'PRESENT' ? '#10b981' : 'transparent',
                                color: currentStatus === 'PRESENT' ? '#fff' : '#94a3b8',
                                border: currentStatus === 'PRESENT' ? '1px solid #10b981' : '1px solid transparent'
                              }}
                            >
                              <CheckCircle2 size={13} /> Present
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSetStudentStatus(st.id, selectedDate, 'ABSENT')}
                              style={{
                                padding: '0.3rem 0.65rem',
                                borderRadius: '6px',
                                fontSize: '0.78rem',
                                fontWeight: 700,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.25rem',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease',
                                background: currentStatus === 'ABSENT' ? '#ef4444' : 'transparent',
                                color: currentStatus === 'ABSENT' ? '#fff' : '#94a3b8',
                                border: currentStatus === 'ABSENT' ? '1px solid #ef4444' : '1px solid transparent'
                              }}
                            >
                              <XCircle size={13} /> Absent
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSetStudentStatus(st.id, selectedDate, 'LATE')}
                              style={{
                                padding: '0.3rem 0.65rem',
                                borderRadius: '6px',
                                fontSize: '0.78rem',
                                fontWeight: 700,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.25rem',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease',
                                background: currentStatus === 'LATE' ? '#f59e0b' : 'transparent',
                                color: currentStatus === 'LATE' ? '#000' : '#94a3b8',
                                border: currentStatus === 'LATE' ? '1px solid #f59e0b' : '1px solid transparent'
                              }}
                            >
                              <Clock size={13} /> Late
                            </button>
                          </div>
                        </td>

                        {/* Historical Dates Grid Cells */}
                        {recordedDates.filter(d => d !== selectedDate).map(d => {
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
                                userSelect: 'none'
                              }}
                              title="Click to toggle: Present -> Absent -> Late"
                            >
                              <div style={{
                                width: '28px',
                                height: '28px',
                                margin: '0 auto',
                                borderRadius: '6px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyCenter: 'center',
                                justifyContent: 'center',
                                fontWeight: 800,
                                fontSize: '0.8rem',
                                transition: 'all 0.15s ease',
                                background: isP ? 'rgba(16, 185, 129, 0.2)' : (isA ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.2)'),
                                color: isP ? '#34d399' : (isA ? '#f87171' : '#fbbf24'),
                                border: isP ? '1px solid rgba(16, 185, 129, 0.5)' : (isA ? '1px solid rgba(239, 68, 68, 0.5)' : '1px solid rgba(245, 158, 11, 0.5)')
                              }}>
                                {isP ? 'P' : (isA ? 'A' : 'L')}
                              </div>
                            </td>
                          );
                        })}
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

      {/* TAB 2: PERCENTAGE & SUMMARY MATRIX */}
      {activeTab === 'percentage' && (
        <div className="card" style={{ padding: '1.25rem', background: 'rgba(15, 23, 42, 0.75)', border: '1px solid var(--border-subtle)', borderRadius: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', margin: 0 }}>
                Attendance Percentage & Compliance Matrix
              </h3>
              <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '0.2rem 0 0 0' }}>
                Formula: Attendance % = (Total Present / Total Conducted Classes) × 100
              </p>
            </div>

            <div style={{ display: 'flex', gap: '0.6rem' }}>
              <button
                className="btn btn-primary btn-sm"
                onClick={handleCountPercentage}
                disabled={actionLoading}
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1rem', borderRadius: '8px' }}
              >
                <RefreshCw size={14} className={actionLoading ? 'animate-spin' : ''} />
                Recalculate All
              </button>
              <button
                className="btn btn-success btn-sm"
                onClick={handleSendToStudent}
                disabled={actionLoading}
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1rem', borderRadius: '8px' }}
              >
                <Send size={14} />
                Publish to Students
              </button>
            </div>
          </div>

          <div className="table-container" style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
            <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'rgba(255, 255, 255, 0.04)' }}>
                  <th style={{ width: '220px', padding: '0.75rem', textAlign: 'left' }}>Student Name</th>
                  <th style={{ width: '80px', padding: '0.75rem', textAlign: 'center' }}>Roll No</th>
                  <th style={{ width: '130px', padding: '0.75rem', textAlign: 'center' }}>Enrollment No</th>
                  <th style={{ width: '150px', padding: '0.75rem', textAlign: 'center' }}>Conducted Classes</th>
                  <th style={{ width: '150px', padding: '0.75rem', textAlign: 'center' }}>Present Classes</th>
                  <th style={{ width: '150px', padding: '0.75rem', textAlign: 'center' }}>Absent Classes</th>
                  <th style={{ width: '150px', padding: '0.75rem', textAlign: 'center' }}>Attendance %</th>
                  <th style={{ width: '160px', padding: '0.75rem', textAlign: 'center' }}>Defaulter Status</th>
                </tr>
              </thead>
              <tbody>
                {students.map(st => {
                  let present = 0;
                  let absent = 0;
                  let late = 0;
                  recordedDates.forEach(d => {
                    const s = attendanceMap[`${st.id}_${d}`];
                    if (s === 'PRESENT') present++;
                    else if (s === 'LATE') { present++; late++; }
                    else if (s === 'ABSENT') absent++;
                  });

                  const total = recordedDates.length;
                  const pct = total > 0 ? ((present / total) * 100).toFixed(1) : '0.0';
                  const isDefaulter = Number(pct) < 30.0 && total > 0;

                  return (
                    <tr key={st.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '0.75rem', fontWeight: 600, color: '#fff' }}>
                        {st.name}
                      </td>
                      <td style={{ textAlign: 'center', padding: '0.75rem', fontWeight: 700, color: '#38bdf8' }}>
                        {st.rollNumber || '—'}
                      </td>
                      <td style={{ textAlign: 'center', padding: '0.75rem', fontWeight: 600, color: '#cbd5e1' }}>
                        {st.enrollmentNumber || '—'}
                      </td>
                      <td style={{ textAlign: 'center', padding: '0.75rem', color: '#94a3b8' }}>
                        {total}
                      </td>
                      <td style={{ textAlign: 'center', padding: '0.75rem', color: '#34d399', fontWeight: 700 }}>
                        {present}
                      </td>
                      <td style={{ textAlign: 'center', padding: '0.75rem', color: '#f87171', fontWeight: 700 }}>
                        {absent}
                      </td>
                      <td style={{ textAlign: 'center', padding: '0.75rem' }}>
                        <div style={{ display: 'inline-block', padding: '0.2rem 0.6rem', borderRadius: '6px', fontWeight: 800, fontSize: '0.9rem', background: isDefaulter ? 'rgba(239, 68, 68, 0.2)' : (Number(pct) >= 75 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)'), color: isDefaulter ? '#ef4444' : (Number(pct) >= 75 ? '#34d399' : '#fbbf24') }}>
                          {pct}%
                        </div>
                      </td>
                      <td style={{ textAlign: 'center', padding: '0.75rem' }}>
                        {isDefaulter ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.25rem 0.6rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 800, background: 'rgba(239, 68, 68, 0.25)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.5)' }}>
                            <AlertTriangle size={13} />
                            DEFAULTER (&lt;30%)
                          </span>
                        ) : (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.25rem 0.6rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 700, background: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}>
                            <CheckCircle2 size={13} />
                            Good Standing
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: DEFAULTER LIST (< 30%) */}
      {activeTab === 'defaulters' && (
        <div className="card" style={{ padding: '1.25rem', background: 'rgba(15, 23, 42, 0.75)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444' }}>
                <AlertTriangle size={22} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#fff', margin: 0 }}>
                  Defaulter Students List (&lt; 30% Attendance)
                </h3>
                <p style={{ fontSize: '0.8rem', color: '#fca5a5', margin: '0.2rem 0 0 0' }}>
                  Target: {selectedDept} • {selectedYear}-{selectedDivision} • Subject: {selectedSubject?.name || 'Selected'}
                </p>
              </div>
            </div>

            <div style={{
              padding: '0.45rem 1rem',
              borderRadius: '8px',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              color: '#f87171',
              fontWeight: 700,
              fontSize: '0.85rem'
            }}>
              Official Warning: “Please complete your attendance.”
            </div>
          </div>

          {defaultersList.length === 0 ? (
            <div style={{ padding: '3rem 1rem', textAlign: 'center', color: '#34d399', background: 'rgba(16, 185, 129, 0.05)', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
              <CheckCircle2 size={36} style={{ margin: '0 auto 0.75rem auto' }} />
              <div style={{ fontSize: '1.05rem', fontWeight: 700 }}>No Defaulters in this Division!</div>
              <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '0.25rem' }}>All students maintain at least 30% attendance.</div>
            </div>
          ) : (
            <div className="table-container" style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
              <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'rgba(239, 68, 68, 0.1)' }}>
                    <th style={{ padding: '0.75rem', textAlign: 'left', color: '#fca5a5' }}>Student Name</th>
                    <th style={{ width: '80px', padding: '0.75rem', textAlign: 'center', color: '#fca5a5' }}>Roll No</th>
                    <th style={{ width: '120px', padding: '0.75rem', textAlign: 'center', color: '#fca5a5' }}>Enrollment No</th>
                    <th style={{ width: '160px', padding: '0.75rem', textAlign: 'left', color: '#fca5a5' }}>Subject</th>
                    <th style={{ width: '100px', padding: '0.75rem', textAlign: 'center', color: '#fca5a5' }}>Conducted</th>
                    <th style={{ width: '100px', padding: '0.75rem', textAlign: 'center', color: '#fca5a5' }}>Attended</th>
                    <th style={{ width: '120px', padding: '0.75rem', textAlign: 'center', color: '#fca5a5' }}>Attendance</th>
                    <th style={{ width: '130px', padding: '0.75rem', textAlign: 'center', color: '#fca5a5' }}>Status</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left', color: '#fca5a5' }}>Compliance Warning</th>
                  </tr>
                </thead>
                <tbody>
                  {defaultersList.map(d => (
                    <tr key={d.id || d.studentId} style={{ borderBottom: '1px solid rgba(239, 68, 68, 0.15)' }}>
                      <td style={{ padding: '0.75rem', fontWeight: 700, color: '#fff' }}>
                        {d.studentName}
                      </td>
                      <td style={{ textAlign: 'center', padding: '0.75rem', fontWeight: 700, color: '#38bdf8' }}>
                        {d.rollNumber || '—'}
                      </td>
                      <td style={{ textAlign: 'center', padding: '0.75rem', fontWeight: 600, color: '#cbd5e1' }}>
                        {d.enrollmentNumber || '—'}
                      </td>
                      <td style={{ padding: '0.75rem', color: '#818cf8', fontWeight: 600 }}>
                        {d.subjectName || selectedSubject?.name || 'Subject'}
                      </td>
                      <td style={{ textAlign: 'center', padding: '0.75rem', color: '#94a3b8' }}>
                        {d.totalConducted || 0}
                      </td>
                      <td style={{ textAlign: 'center', padding: '0.75rem', color: '#f87171', fontWeight: 700 }}>
                        {d.totalPresent || 0}
                      </td>
                      <td style={{ textAlign: 'center', padding: '0.75rem' }}>
                        <span style={{ padding: '0.2rem 0.6rem', borderRadius: '6px', background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', fontWeight: 800, fontSize: '0.9rem' }}>
                          {d.attendancePercentage}%
                        </span>
                      </td>
                      <td style={{ textAlign: 'center', padding: '0.75rem' }}>
                        <span style={{ padding: '0.2rem 0.6rem', borderRadius: '999px', background: '#ef4444', color: '#fff', fontWeight: 800, fontSize: '0.75rem' }}>
                          DEFAULTER
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem', color: '#f87171', fontWeight: 600, fontSize: '0.85rem' }}>
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
