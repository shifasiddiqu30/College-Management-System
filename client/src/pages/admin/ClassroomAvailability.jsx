import React, { useState, useEffect, useCallback } from 'react';
import {
  Clock,
  Calendar,
  Building2,
  CheckCircle2,
  AlertCircle,
  Users,
  BookOpen,
  GraduationCap,
  Sparkles,
  RefreshCw,
  SlidersHorizontal
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function ClassroomAvailability() {
  const { authFetch, showToast } = useAuth();

  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [selectedSlot, setSelectedSlot] = useState('10:00');
  const [filterType, setFilterType] = useState('ALL');
  const [filterAvailability, setFilterAvailability] = useState('ALL'); // 'ALL', 'AVAILABLE', 'OCCUPIED'

  const [availabilityData, setAvailabilityData] = useState(null);
  const [loading, setLoading] = useState(true);

  const timeSlots = [
    { label: '09:00 AM – 10:00 AM', value: '09:00' },
    { label: '10:00 AM – 11:00 AM', value: '10:00' },
    { label: '11:15 AM – 12:15 PM', value: '11:15' },
    { label: '12:15 PM – 01:15 PM', value: '12:15' },
    { label: '02:00 PM – 03:00 PM', value: '14:00' },
    { label: '03:00 PM – 04:00 PM', value: '15:00' },
    { label: '04:15 PM – 05:15 PM', value: '16:15' }
  ];

  const fetchAvailability = useCallback(async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('date', selectedDate);
      queryParams.append('time', selectedSlot);

      const res = await authFetch(`/api/admin/classroom-availability?${queryParams.toString()}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setAvailabilityData(data);
      }
    } catch (err) {
      showToast('Error checking room availability: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [authFetch, selectedDate, selectedSlot, showToast]);

  useEffect(() => {
    fetchAvailability();
  }, [fetchAvailability]);

  // Filtered rooms
  const rooms = (availabilityData?.rooms || []).filter(room => {
    if (filterType !== 'ALL' && room.classroomType !== filterType) return false;
    if (filterAvailability === 'AVAILABLE' && room.status !== 'AVAILABLE') return false;
    if (filterAvailability === 'OCCUPIED' && room.status !== 'OCCUPIED') return false;
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff' }}>Classroom Availability Matrix</h2>
          <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
            Interactive real-time schedule conflict engine & infrastructure occupancy foundation
          </p>
        </div>
        <button className="btn btn-secondary" onClick={fetchAvailability} title="Refresh Live Data">
          <RefreshCw size={16} className={loading ? 'spin' : ''} />
          <span>Check Now</span>
        </button>
      </div>

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
              <Calendar size={18} color="#818cf8" />
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
              <span style={{ fontSize: '0.85rem', color: '#818cf8', fontWeight: 700, background: 'rgba(99, 102, 241, 0.15)', padding: '0.35rem 0.75rem', borderRadius: '8px' }}>
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
              <option value="ALL">All Occupancy States</option>
              <option value="AVAILABLE">Available Only</option>
              <option value="OCCUPIED">Occupied Only</option>
            </select>

            <select
              className="filter-select"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              style={{ padding: '0.5rem 1.875rem 0.5rem 0.75rem' }}
            >
              <option value="ALL">All Room Types</option>
              <option value="Classroom">Classroom</option>
              <option value="Computer Lab">Computer Lab</option>
              <option value="Electronics Lab">Electronics Lab</option>
              <option value="Seminar Hall">Seminar Hall</option>
              <option value="Laboratory">Laboratory</option>
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
                    background: isSelected ? 'linear-gradient(135deg, #6366f1, #4f46e5)' : 'rgba(255, 255, 255, 0.04)',
                    color: isSelected ? '#fff' : '#94a3b8',
                    border: isSelected ? '1px solid #818cf8' : '1px solid var(--border-subtle)',
                    boxShadow: isSelected ? '0 0 15px rgba(99, 102, 241, 0.35)' : 'none'
                  }}
                >
                  {slot.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Realtime Availability Metrics Bar */}
      {availabilityData?.summary && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '1rem'
        }}>
          <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: '12px', padding: '1rem 1.25rem' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#10b981', textTransform: 'uppercase' }}>Available Rooms</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#10b981', marginTop: '0.2rem' }}>
              {availabilityData.summary.available}
            </div>
            <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '0.2rem' }}>Ready for allocation</div>
          </div>

          <div style={{ background: 'rgba(244, 63, 94, 0.1)', border: '1px solid rgba(244, 63, 94, 0.25)', borderRadius: '12px', padding: '1rem 1.25rem' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#f43f5e', textTransform: 'uppercase' }}>Occupied Rooms</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#f43f5e', marginTop: '0.2rem' }}>
              {availabilityData.summary.occupied}
            </div>
            <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '0.2rem' }}>Active scheduled lecture</div>
          </div>

          <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '1rem 1.25rem' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase' }}>Total Checked</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fff', marginTop: '0.2rem' }}>
              {availabilityData.summary.total}
            </div>
            <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.2rem' }}>Across all campus wings</div>
          </div>
        </div>
      )}

      {/* Grid of Rooms with Live Availability Cards */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: '#94a3b8' }}>
          Evaluating timetable slot conflicts...
        </div>
      ) : rooms.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: '#64748b', background: 'var(--bg-card)', borderRadius: '16px', border: '1px solid var(--border-subtle)' }}>
          No rooms match the selected filters.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
          {rooms.map((room) => {
            const isOccupied = room.status === 'OCCUPIED';
            const isAvailable = room.status === 'AVAILABLE';

            return (
              <div
                key={room.id}
                style={{
                  background: 'var(--bg-card)',
                  border: isOccupied
                    ? '1px solid rgba(244, 63, 94, 0.35)'
                    : isAvailable
                    ? '1px solid rgba(16, 185, 129, 0.35)'
                    : '1px solid var(--border-subtle)',
                  borderRadius: '16px',
                  padding: '1.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  transition: 'all 0.25s ease',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                {/* Status Indicator Bar on top */}
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '4px',
                    background: isOccupied ? '#f43f5e' : isAvailable ? '#10b981' : '#64748b'
                  }}
                />

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                    <div>
                      <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff' }}>
                        {room.roomNumber}
                      </h3>
                      <span className="tag-pill" style={{ margin: '0.2rem 0 0 0', fontSize: '0.72rem' }}>
                        {room.classroomType}
                      </span>
                    </div>

                    <span className={`badge badge-${room.status.toLowerCase()}`}>
                      {room.status}
                    </span>
                  </div>

                  {/* Room Meta Info */}
                  <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                    <div>{room.building} • {room.floor}</div>
                    <div>Capacity: <strong style={{ color: '#fff' }}>{room.capacity} seats</strong></div>
                  </div>

                  {/* If Occupied: Show Details */}
                  {isOccupied && room.occupiedDetails ? (
                    <div style={{
                      background: 'rgba(244, 63, 94, 0.08)',
                      border: '1px solid rgba(244, 63, 94, 0.2)',
                      borderRadius: '10px',
                      padding: '0.875rem 1rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.4rem'
                    }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#f43f5e', letterSpacing: '0.06em' }}>
                        Active Scheduled Lecture
                      </div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <BookOpen size={14} color="#f43f5e" />
                        <span>{room.occupiedDetails.subject}</span>
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <Users size={14} color="#94a3b8" />
                        <span>Faculty: <strong>{room.occupiedDetails.faculty}</strong></span>
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <GraduationCap size={14} color="#94a3b8" />
                        <span>Class: <strong>{room.occupiedDetails.class}</strong></span>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.2rem' }}>
                        <Clock size={12} />
                        <span>Time: {room.occupiedDetails.timeSlot}</span>
                      </div>
                    </div>
                  ) : isAvailable ? (
                    <div style={{
                      background: 'rgba(16, 185, 129, 0.08)',
                      border: '1px solid rgba(16, 185, 129, 0.2)',
                      borderRadius: '10px',
                      padding: '0.875rem 1rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      color: '#10b981'
                    }}>
                      <CheckCircle2 size={18} />
                      <div style={{ fontSize: '0.82rem', fontWeight: 600 }}>
                        Vacant & available for booking or substitute lectures.
                      </div>
                    </div>
                  ) : (
                    <div style={{
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '10px',
                      padding: '0.875rem 1rem',
                      fontSize: '0.82rem',
                      color: '#64748b'
                    }}>
                      Facility is marked as inactive or under maintenance.
                    </div>
                  )}
                </div>

                <div style={{ marginTop: '1.25rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem', color: '#64748b' }}>
                  <span>{room.hasProjector ? '🎥 Projector Enabled' : 'Standard Board'}</span>
                  <span>Part 2 Availability Engine</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
