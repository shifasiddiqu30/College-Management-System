import { queryAll, queryOne } from '../config/db.js';

/**
 * Convert "HH:MM" to minutes from midnight
 * @param {string} timeStr
 * @returns {number}
 */
export function timeToMinutes(timeStr) {
  if (!timeStr || typeof timeStr !== 'string' || !timeStr.includes(':')) return 0;
  const [h, m] = timeStr.split(':').map(n => parseInt(n, 10));
  return (h * 60) + (m || 0);
}

/**
 * Get current day of week in standard English
 * @returns {string} e.g. 'Monday', 'Tuesday'
 */
export function getCurrentDayOfWeek() {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const todayIndex = new Date().getDay();
  return days[todayIndex];
}

/**
 * Get current time formatted as "HH:MM" (24-hour format)
 * @returns {string}
 */
export function getCurrentTimeString() {
  const now = new Date();
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * Calculate Real-Time Faculty Lecture Status from Official Timetable
 * @param {string} facultyId
 * @param {string} [customDay] - optional override for testing/simulation
 * @param {string} [customTime] - optional override "HH:MM" for testing/simulation
 * @returns {Object} { lectureStatus: 'ACTIVE'|'INACTIVE', currentActivity: Object|null, upcomingActivity: Object|null }
 */
export function getFacultyRealtimeStatus(facultyId, customDay = null, customTime = null) {
  const day = customDay || getCurrentDayOfWeek();
  const timeStr = customTime || getCurrentTimeString();
  const currentMins = timeToMinutes(timeStr);

  const sql = `
    SELECT 
      t.id, t.day_of_week as dayOfWeek, t.start_time as startTime, t.end_time as endTime, t.period_number as periodNumber,
      s.name as subjectName, s.code as subjectCode,
      cl.room_number as roomNumber, cl.building,
      c.department as classDept, c.year as classYear, c.division as classDivision
    FROM timetables t
    LEFT JOIN subjects s ON t.subject_id = s.id
    LEFT JOIN classrooms cl ON t.classroom_id = cl.id
    LEFT JOIN classes c ON t.class_id = c.id
    WHERE t.faculty_id = ? AND t.day_of_week = ?
    ORDER BY t.start_time ASC
  `;

  const todaySlots = queryAll(sql, [facultyId, day]);

  let currentActivity = null;
  let upcomingActivity = null;

  for (const slot of todaySlots) {
    const startMins = timeToMinutes(slot.startTime);
    const endMins = timeToMinutes(slot.endTime);

    if (currentMins >= startMins && currentMins < endMins) {
      currentActivity = {
        subject: slot.subjectName || slot.subjectCode || 'Scheduled Lecture',
        class: `${slot.classYear || 'SE'}-${slot.classDivision || 'A'}`,
        department: slot.classDept || '',
        room: slot.roomNumber || 'Assigned Room',
        startTime: slot.startTime,
        endTime: slot.endTime,
        periodNumber: slot.periodNumber,
        display: `${slot.subjectName || 'Lecture'} — ${slot.classYear || 'SE'}-${slot.classDivision || 'A'} — Room ${slot.roomNumber || 'TBD'} (${slot.startTime}–${slot.endTime})`
      };
      break;
    }
  }

  if (!currentActivity) {
    const upcoming = todaySlots
      .filter(s => timeToMinutes(s.startTime) > currentMins)
      .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));

    if (upcoming.length > 0) {
      const nextSlot = upcoming[0];
      upcomingActivity = {
        subject: nextSlot.subjectName || nextSlot.subjectCode || 'Scheduled Lecture',
        class: `${nextSlot.classYear || 'SE'}-${nextSlot.classDivision || 'A'}`,
        room: nextSlot.roomNumber || 'TBD',
        startTime: nextSlot.startTime,
        endTime: nextSlot.endTime,
        display: `${nextSlot.subjectName || 'Lecture'} at ${nextSlot.startTime}`
      };
    }
  }

  return {
    lectureStatus: currentActivity ? 'ACTIVE' : 'INACTIVE',
    currentActivity,
    upcomingActivity
  };
}

/**
 * Calculate Real-Time Classroom Activity & Availability from Official Timetable
 * @param {string} classroomId
 * @param {string} [customDay] - optional override
 * @param {string} [customTime] - optional override
 * @returns {Object} { currentLectureStatus: 'ACTIVE'|'INACTIVE', availabilityStatus: 'OCCUPIED'|'AVAILABLE', currentActivity: Object|null, upcomingActivity: Object|null }
 */
export function getClassroomRealtimeStatus(classroomId, customDay = null, customTime = null) {
  const day = customDay || getCurrentDayOfWeek();
  const timeStr = customTime || getCurrentTimeString();
  const currentMins = timeToMinutes(timeStr);

  const sql = `
    SELECT 
      t.id, t.day_of_week as dayOfWeek, t.start_time as startTime, t.end_time as endTime, t.period_number as periodNumber,
      s.name as subjectName, s.code as subjectCode,
      u.name as facultyName,
      c.department as classDept, c.year as classYear, c.division as classDivision
    FROM timetables t
    LEFT JOIN subjects s ON t.subject_id = s.id
    LEFT JOIN users u ON t.faculty_id = u.id
    LEFT JOIN classes c ON t.class_id = c.id
    WHERE t.classroom_id = ? AND t.day_of_week = ?
    ORDER BY t.start_time ASC
  `;

  const todaySlots = queryAll(sql, [classroomId, day]);

  let currentActivity = null;
  let upcomingActivity = null;

  for (const slot of todaySlots) {
    const startMins = timeToMinutes(slot.startTime);
    const endMins = timeToMinutes(slot.endTime);

    if (currentMins >= startMins && currentMins < endMins) {
      currentActivity = {
        subject: slot.subjectName || slot.subjectCode || 'Scheduled Lecture',
        faculty: slot.facultyName || 'Assigned Faculty',
        class: `${slot.classYear || 'SE'}-${slot.classDivision || 'A'}`,
        department: slot.classDept || '',
        startTime: slot.startTime,
        endTime: slot.endTime,
        periodNumber: slot.periodNumber,
        display: `${slot.subjectName || 'Lecture'} — ${slot.classYear || 'SE'}-${slot.classDivision || 'A'} — ${slot.facultyName || 'Faculty'} (${slot.startTime}–${slot.endTime})`
      };
      break;
    }
  }

  if (!currentActivity) {
    const upcoming = todaySlots
      .filter(s => timeToMinutes(s.startTime) > currentMins)
      .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));

    if (upcoming.length > 0) {
      const nextSlot = upcoming[0];
      upcomingActivity = {
        subject: nextSlot.subjectName || nextSlot.subjectCode || 'Scheduled Lecture',
        faculty: nextSlot.facultyName || 'Assigned Faculty',
        class: `${nextSlot.classYear || 'SE'}-${nextSlot.classDivision || 'A'}`,
        startTime: nextSlot.startTime,
        endTime: nextSlot.endTime,
        display: `${nextSlot.subjectName || 'Lecture'} at ${nextSlot.startTime}`
      };
    }
  }

  const isActive = !!currentActivity;
  return {
    currentLectureStatus: isActive ? 'ACTIVE' : 'INACTIVE',
    availabilityStatus: isActive ? 'OCCUPIED' : 'AVAILABLE',
    currentActivity,
    upcomingActivity
  };
}

export default {
  timeToMinutes,
  getCurrentDayOfWeek,
  getCurrentTimeString,
  getFacultyRealtimeStatus,
  getClassroomRealtimeStatus
};
