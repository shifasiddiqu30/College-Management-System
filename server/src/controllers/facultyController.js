import crypto from 'crypto';
import { queryAll, queryOne, execute } from '../config/db.js';
import { ROLES, CLASSROOM_STATUS } from '../config/constants.js';

// Helper: Convert "HH:MM" to minutes from midnight
function timeToMinutes(timeStr) {
  if (!timeStr || !timeStr.includes(':')) return 0;
  const [h, m] = timeStr.split(':').map(n => parseInt(n, 10));
  return (h * 60) + (m || 0);
}

// Helper: Get Current Day of Week
function getCurrentDayOfWeek() {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const todayIndex = new Date().getDay();
  return days[todayIndex];
}

// Helper: Get Current Time as "HH:MM"
function getCurrentTimeString() {
  const now = new Date();
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

// Helper: Safe JSON parser
function safeJsonParse(val, fallback = []) {
  if (!val) return fallback;
  if (typeof val !== 'string') return val;
  try {
    return JSON.parse(val);
  } catch (e) {
    return fallback;
  }
}

// ============================================================================
// 1. DASHBOARD & PROFILE
// ============================================================================

/**
 * Get Faculty Dashboard Stats & Highlights
 * GET /api/faculty/dashboard-stats
 */
export async function getFacultyDashboardStats(req, res, next) {
  try {
    const faculty = req.user;
    const assignedSubjects = safeJsonParse(faculty.assigned_subjects || faculty.assignedSubjects, []);
    const assignedClasses = safeJsonParse(faculty.assigned_classes || faculty.assignedClasses, []);

    // 1. Weekly & Today's Lectures
    const todayDay = getCurrentDayOfWeek();
    const currentTimeStr = getCurrentTimeString();
    const currentMins = timeToMinutes(currentTimeStr);

    const weeklyLectures = queryAll(`
      SELECT 
        t.id, t.day_of_week as dayOfWeek, t.start_time as startTime, t.end_time as endTime,
        s.name as subjectName, s.code as subjectCode,
        cl.room_number as roomNumber, cl.building,
        c.year as classYear, c.division as classDivision
      FROM timetables t
      LEFT JOIN subjects s ON t.subject_id = s.id
      LEFT JOIN classrooms cl ON t.classroom_id = cl.id
      LEFT JOIN classes c ON t.class_id = c.id
      WHERE t.faculty_id = ?
      ORDER BY t.start_time ASC
    `, [faculty.id]);

    const todayLectures = weeklyLectures.filter(l => l.dayOfWeek === todayDay);

    // Current & Next Lecture
    let currentLecture = null;
    let nextLecture = null;

    for (const slot of todayLectures) {
      const startMins = timeToMinutes(slot.startTime);
      const endMins = timeToMinutes(slot.endTime);
      if (currentMins >= startMins && currentMins < endMins) {
        currentLecture = {
          ...slot,
          status: 'ONGOING',
          subject: slot.subjectName,
          class: `${slot.classYear}-${slot.classDivision}`,
          room: slot.roomNumber,
          time: `${slot.startTime} – ${slot.endTime}`,
          minutesRemaining: endMins - currentMins
        };
        break;
      }
    }

    const upcomingToday = todayLectures
      .filter(s => timeToMinutes(s.startTime) > currentMins)
      .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));

    if (upcomingToday.length > 0) {
      const nextSlot = upcomingToday[0];
      nextLecture = {
        ...nextSlot,
        subject: nextSlot.subjectName,
        class: `${nextSlot.classYear}-${nextSlot.classDivision}`,
        room: nextSlot.roomNumber,
        starts: nextSlot.startTime,
        startsInMinutes: timeToMinutes(nextSlot.startTime) - currentMins,
        isToday: true
      };
    }

    // 2. Assigned Classrooms Count
    const distinctRoomsRes = queryOne('SELECT COUNT(DISTINCT classroom_id) as count FROM timetables WHERE faculty_id = ?', [faculty.id]);
    const assignedClassroomsCount = distinctRoomsRes?.count || 0;

    // 3. Pending Doubt Requests
    const pendingDoubtsRes = queryOne(`
      SELECT COUNT(*) as count 
      FROM doubts 
      WHERE (faculty_id = ? OR faculty_id IS NULL) 
        AND is_faculty_help_requested = 1 
        AND status = 'OPEN'
    `, [faculty.id]);
    const pendingDoubtRequests = pendingDoubtsRes?.count || 0;

    // 4. Recent Notifications (Top 5)
    const recentNotifications = queryAll(`
      SELECT id, type, title, message, is_read as isRead, created_at as createdAt, link
      FROM notifications
      WHERE user_id = ? OR target_role IN ('FACULTY', 'ALL')
      ORDER BY created_at DESC
      LIMIT 5
    `, [faculty.id]);

    res.status(200).json({
      success: true,
      profile: {
        id: faculty.id,
        name: faculty.name,
        email: faculty.email,
        department: faculty.department,
        assignedSubjects,
        assignedClasses
      },
      stats: {
        todayLecturesCount: todayLectures.length,
        weeklyLecturesCount: weeklyLectures.length,
        assignedClassroomsCount,
        pendingDoubtRequests,
        assignedClassesCount: assignedClasses.length,
        assignedSubjectsCount: assignedSubjects.length
      },
      todaySchedule: todayLectures,
      currentLecture,
      nextLecture,
      recentNotifications
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get Faculty Full Profile
 * GET /api/faculty/profile
 */
export async function getFacultyProfile(req, res, next) {
  try {
    const faculty = queryOne('SELECT id, name, email, department, role, status, assigned_subjects, assigned_classes, created_at FROM users WHERE id = ?', [req.user.id]);
    if (!faculty) {
      return res.status(404).json({ success: false, message: 'Faculty profile not found' });
    }

    const assignedSubjects = safeJsonParse(faculty.assigned_subjects, []);
    const assignedClasses = safeJsonParse(faculty.assigned_classes, []);

    res.status(200).json({
      success: true,
      profile: {
        id: faculty.id,
        name: faculty.name,
        email: faculty.email,
        department: faculty.department,
        role: faculty.role,
        status: faculty.status,
        assignedSubjects,
        assignedClasses,
        joinedAt: faculty.created_at
      }
    });
  } catch (error) {
    next(error);
  }
}

// ============================================================================
// 2. SMART TIMETABLE & CLASSROOM AVAILABILITY
// ============================================================================

/**
 * Get Faculty Assigned Timetable
 * GET /api/faculty/timetable
 */
export async function getFacultyTimetable(req, res, next) {
  try {
    const faculty = req.user;
    const { day, classId, subjectId } = req.query;

    let sql = `
      SELECT 
        t.id,
        t.class_id as classId,
        t.day_of_week as dayOfWeek,
        t.period_number as periodNumber,
        t.start_time as startTime,
        t.end_time as endTime,
        t.subject_id as subjectId,
        s.name as subjectName,
        s.code as subjectCode,
        s.credits,
        t.faculty_id as facultyId,
        u.name as facultyName,
        t.classroom_id as classroomId,
        cl.room_number as roomNumber,
        cl.classroom_type as classroomType,
        cl.building,
        cl.floor,
        cl.has_projector as hasProjector,
        c.department as classDepartment,
        c.year as classYear,
        c.division as classDivision
      FROM timetables t
      LEFT JOIN subjects s ON t.subject_id = s.id
      LEFT JOIN users u ON t.faculty_id = u.id
      LEFT JOIN classrooms cl ON t.classroom_id = cl.id
      LEFT JOIN classes c ON t.class_id = c.id
      WHERE t.faculty_id = ?
    `;
    const params = [faculty.id];

    if (day && day !== 'ALL') {
      sql += ` AND t.day_of_week = ?`;
      params.push(day);
    }
    if (classId && classId !== 'ALL') {
      sql += ` AND t.class_id = ?`;
      params.push(classId);
    }
    if (subjectId && subjectId !== 'ALL') {
      sql += ` AND t.subject_id = ?`;
      params.push(subjectId);
    }

    sql += ` ORDER BY 
      CASE t.day_of_week
        WHEN 'Monday' THEN 1
        WHEN 'Tuesday' THEN 2
        WHEN 'Wednesday' THEN 3
        WHEN 'Thursday' THEN 4
        WHEN 'Friday' THEN 5
        WHEN 'Saturday' THEN 6
        ELSE 7
      END,
      t.start_time ASC
    `;

    const allSlots = queryAll(sql, params);

    const weeklyGrid = {
      Monday: [],
      Tuesday: [],
      Wednesday: [],
      Thursday: [],
      Friday: [],
      Saturday: []
    };

    allSlots.forEach(slot => {
      if (weeklyGrid[slot.dayOfWeek]) {
        weeklyGrid[slot.dayOfWeek].push(slot);
      }
    });

    const todayDay = getCurrentDayOfWeek();
    const currentTimeStr = getCurrentTimeString();
    const currentMins = timeToMinutes(currentTimeStr);

    const todaySlots = weeklyGrid[todayDay] || [];

    let currentLecture = null;
    for (const slot of todaySlots) {
      const startMins = timeToMinutes(slot.startTime);
      const endMins = timeToMinutes(slot.endTime);

      if (currentMins >= startMins && currentMins < endMins) {
        currentLecture = {
          ...slot,
          status: 'ONGOING',
          subject: slot.subjectName,
          class: `${slot.classYear}-${slot.classDivision}`,
          room: slot.roomNumber,
          time: `${slot.startTime} – ${slot.endTime}`,
          minutesRemaining: endMins - currentMins
        };
        break;
      }
    }

    let nextLecture = null;
    const upcomingToday = todaySlots
      .filter(s => timeToMinutes(s.startTime) > currentMins)
      .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));

    if (upcomingToday.length > 0) {
      const nextSlot = upcomingToday[0];
      const startMins = timeToMinutes(nextSlot.startTime);
      nextLecture = {
        ...nextSlot,
        subject: nextSlot.subjectName,
        class: `${nextSlot.classYear}-${nextSlot.classDivision}`,
        room: nextSlot.roomNumber,
        starts: nextSlot.startTime,
        startsInMinutes: startMins - currentMins,
        isToday: true
      };
    } else {
      const daysList = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const currentDayIdx = daysList.indexOf(todayDay);
      const tomorrowDay = daysList[(currentDayIdx + 1) % daysList.length];
      const tomorrowSlots = weeklyGrid[tomorrowDay] || [];
      if (tomorrowSlots.length > 0) {
        nextLecture = {
          ...tomorrowSlots[0],
          subject: tomorrowSlots[0].subjectName,
          class: `${tomorrowSlots[0].classYear}-${tomorrowSlots[0].classDivision}`,
          room: tomorrowSlots[0].roomNumber,
          starts: tomorrowSlots[0].startTime,
          isTomorrow: true,
          dayOfWeek: tomorrowDay
        };
      }
    }

    const assignedRoomsMap = new Map();
    allSlots.forEach(slot => {
      if (slot.classroomId && !assignedRoomsMap.has(slot.classroomId)) {
        assignedRoomsMap.set(slot.classroomId, {
          id: slot.classroomId,
          roomNumber: slot.roomNumber,
          classroomType: slot.classroomType,
          building: slot.building,
          floor: slot.floor,
          hasProjector: !!slot.hasProjector,
          subject: slot.subjectName,
          class: `${slot.classYear}-${slot.classDivision}`,
          timeSlot: `${slot.startTime} – ${slot.endTime}`,
          dayOfWeek: slot.dayOfWeek
        });
      }
    });

    const assignedClassrooms = Array.from(assignedRoomsMap.values());

    res.status(200).json({
      success: true,
      faculty: {
        id: faculty.id,
        name: faculty.name,
        email: faculty.email,
        department: faculty.department
      },
      todayDay,
      currentTime: currentTimeStr,
      todaySchedule: todaySlots,
      weeklyGrid,
      currentLecture,
      nextLecture,
      assignedClassrooms
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Classroom Availability for Faculty (Read-only, calculated from timetable)
 * GET /api/faculty/classroom-availability
 */
export async function getFacultyClassroomAvailability(req, res, next) {
  try {
    const { date, time, startTime, endTime, day, search } = req.query;

    let dayOfWeek = day || 'Monday';
    if (date) {
      const parsedDate = new Date(date);
      if (!isNaN(parsedDate.getTime())) {
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        dayOfWeek = days[parsedDate.getDay()];
      }
    }

    const targetStart = startTime || time || '10:00';
    const targetEnd = endTime || (startTime ? (parseInt(startTime.split(':')[0], 10) + 1).toString().padStart(2, '0') + ':00' : '11:00');

    let roomSql = `
      SELECT id, room_number as roomNumber, classroom_type as classroomType, building, floor, capacity, status, has_projector as hasProjector
      FROM classrooms
      WHERE 1=1
    `;
    const roomParams = [];

    if (search && search.trim()) {
      roomSql += ` AND (LOWER(room_number) LIKE ? OR LOWER(building) LIKE ?)`;
      const term = `%${search.trim().toLowerCase()}%`;
      roomParams.push(term, term);
    }

    roomSql += ` ORDER BY room_number ASC`;
    const allRooms = queryAll(roomSql, roomParams);

    const activeSessions = queryAll(`
      SELECT 
        t.id as timetableId,
        t.classroom_id as classroomId,
        t.start_time as startTime,
        t.end_time as endTime,
        t.day_of_week as dayOfWeek,
        s.name as subjectName,
        s.code as subjectCode,
        u.name as facultyName,
        c.department as classDepartment,
        c.year as classYear,
        c.division as classDivision
      FROM timetables t
      LEFT JOIN subjects s ON t.subject_id = s.id
      LEFT JOIN users u ON t.faculty_id = u.id
      LEFT JOIN classes c ON t.class_id = c.id
      WHERE t.day_of_week = ?
    `, [dayOfWeek]);

    const results = allRooms.map(room => {
      const session = activeSessions.find(s => {
        if (s.classroomId !== room.id) return false;
        return s.startTime < targetEnd && s.endTime > targetStart;
      });

      const isOccupied = room.status === CLASSROOM_STATUS.ACTIVE && !!session;
      const isInactive = room.status === CLASSROOM_STATUS.INACTIVE;

      return {
        id: room.id,
        roomNumber: room.roomNumber,
        classroomType: room.classroomType,
        building: room.building,
        floor: room.floor,
        capacity: room.capacity,
        hasProjector: !!room.hasProjector,
        status: isInactive ? 'INACTIVE' : (isOccupied ? 'OCCUPIED' : 'AVAILABLE'),
        isAvailable: !isOccupied && !isInactive,
        occupiedDetails: isOccupied ? {
          subject: session.subjectName || session.subjectCode || 'General Lecture',
          faculty: session.facultyName || "Assigned Faculty",
          class: `${session.classYear || 'SE'}-${session.classDivision || 'A'}`,
          timeSlot: `${session.startTime} – ${session.endTime}`,
          dayOfWeek
        } : null
      };
    });

    const summary = {
      total: results.length,
      available: results.filter(r => r.status === 'AVAILABLE').length,
      occupied: results.filter(r => r.status === 'OCCUPIED').length,
      inactive: results.filter(r => r.status === 'INACTIVE').length
    };

    res.status(200).json({
      success: true,
      dayOfWeek,
      selectedTime: `${targetStart} – ${targetEnd}`,
      startTime: targetStart,
      endTime: targetEnd,
      summary,
      rooms: results
    });
  } catch (error) {
    next(error);
  }
}

// ============================================================================
// 3. PERSONAL SCHEDULE / REMINDERS (Strictly Private)
// ============================================================================

/**
 * Get Private Personal Schedule for Logged-in Faculty
 * GET /api/faculty/personal-schedule
 */
export async function getPersonalSchedule(req, res, next) {
  try {
    const facultyId = req.user.id;
    const items = queryAll(`
      SELECT 
        id, faculty_id as facultyId, title, task_date as taskDate, task_time as taskTime,
        note, category, priority, is_completed as isCompleted, created_at as createdAt
      FROM personal_schedules
      WHERE faculty_id = ?
      ORDER BY task_date ASC, task_time ASC
    `, [facultyId]);

    res.status(200).json({
      success: true,
      items
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Create Private Task / Reminder
 * POST /api/faculty/personal-schedule
 */
export async function createPersonalSchedule(req, res, next) {
  try {
    const facultyId = req.user.id;
    const { title, taskDate, taskTime, note, category, priority } = req.body;

    if (!title || !taskDate) {
      return res.status(400).json({ success: false, message: 'Task title and date are required' });
    }

    const id = `ps_${crypto.randomBytes(6).toString('hex')}`;
    execute(`
      INSERT INTO personal_schedules (
        id, faculty_id, title, task_date, task_time, note, category, priority, is_completed, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, CURRENT_TIMESTAMP)
    `, [id, facultyId, title.trim(), taskDate, taskTime || null, note || null, category || 'Task', priority || 'Medium']);

    res.status(201).json({
      success: true,
      message: 'Personal schedule task added successfully',
      task: { id, facultyId, title, taskDate, taskTime, note, category, priority, isCompleted: 0 }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update Personal Task / Toggle Complete
 * PUT /api/faculty/personal-schedule/:id
 */
export async function updatePersonalSchedule(req, res, next) {
  try {
    const facultyId = req.user.id;
    const { id } = req.params;
    const { title, taskDate, taskTime, note, category, priority, isCompleted } = req.body;

    const existing = queryOne('SELECT * FROM personal_schedules WHERE id = ? AND faculty_id = ?', [id, facultyId]);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Task not found or access denied' });
    }

    execute(`
      UPDATE personal_schedules
      SET 
        title = COALESCE(?, title),
        task_date = COALESCE(?, task_date),
        task_time = COALESCE(?, task_time),
        note = COALESCE(?, note),
        category = COALESCE(?, category),
        priority = COALESCE(?, priority),
        is_completed = COALESCE(?, is_completed),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND faculty_id = ?
    `, [
      title ? title.trim() : null,
      taskDate || null,
      taskTime !== undefined ? taskTime : null,
      note !== undefined ? note : null,
      category || null,
      priority || null,
      isCompleted !== undefined ? (isCompleted ? 1 : 0) : null,
      id,
      facultyId
    ]);

    res.status(200).json({
      success: true,
      message: 'Personal schedule updated successfully'
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Delete Personal Task
 * DELETE /api/faculty/personal-schedule/:id
 */
export async function deletePersonalSchedule(req, res, next) {
  try {
    const facultyId = req.user.id;
    const { id } = req.params;

    const result = execute('DELETE FROM personal_schedules WHERE id = ? AND faculty_id = ?', [id, facultyId]);
    if (result.changes === 0) {
      return res.status(404).json({ success: false, message: 'Task not found or access denied' });
    }

    res.status(200).json({
      success: true,
      message: 'Task removed from personal schedule'
    });
  } catch (error) {
    next(error);
  }
}

// ============================================================================
// 4. CLUBS & CAMPUS EVENTS
// ============================================================================

/**
 * Get Clubs
 * GET /api/faculty/clubs
 */
export async function getFacultyClubs(req, res, next) {
  try {
    const clubs = queryAll(`
      SELECT 
        c.id, c.name, c.category, c.description, c.coordinator_id as coordinatorId,
        u.name as coordinatorName, u.email as coordinatorEmail,
        c.max_seats as maxSeats, c.available_seats as availableSeats,
        c.registration_start_date as registrationStartDate,
        c.registration_end_date as registrationEndDate,
        c.status, c.banner_url as bannerUrl, c.created_at as createdAt,
        (SELECT COUNT(*) FROM club_registrations WHERE club_id = c.id) as registeredCount
      FROM clubs c
      LEFT JOIN users u ON c.coordinator_id = u.id
      ORDER BY c.created_at DESC
    `);

    // Dynamic status check
    const formatted = clubs.map(club => {
      let currentStatus = club.status;
      const todayStr = new Date().toISOString().split('T')[0];

      if (club.availableSeats <= 0) {
        currentStatus = 'Seats Full';
      } else if (club.registrationEndDate && todayStr > club.registrationEndDate) {
        currentStatus = 'Registration Closed';
      } else if (club.registrationStartDate && todayStr < club.registrationStartDate) {
        currentStatus = 'Upcoming';
      }
      return { ...club, status: currentStatus };
    });

    res.status(200).json({ success: true, clubs: formatted });
  } catch (error) {
    next(error);
  }
}

/**
 * Create Club
 * POST /api/faculty/clubs
 */
export async function createClub(req, res, next) {
  try {
    const { name, category, description, coordinatorId, maxSeats, registrationStartDate, registrationEndDate, status, bannerUrl } = req.body;

    if (!name || !category) {
      return res.status(400).json({ success: false, message: 'Club name and category are required' });
    }

    const seats = parseInt(maxSeats, 10) || 30;
    const id = `club_${crypto.randomBytes(6).toString('hex')}`;
    const coordId = coordinatorId || req.user.id;

    execute(`
      INSERT INTO clubs (
        id, name, category, description, coordinator_id, max_seats, available_seats,
        registration_start_date, registration_end_date, status, banner_url, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `, [
      id, name.trim(), category.trim(), description || '', coordId, seats, seats,
      registrationStartDate || null, registrationEndDate || null, status || 'Registration Open', bannerUrl || null
    ]);

    res.status(201).json({ success: true, message: 'Club created successfully', clubId: id });
  } catch (error) {
    next(error);
  }
}

/**
 * Update Club
 * PUT /api/faculty/clubs/:id
 */
export async function updateClub(req, res, next) {
  try {
    const { id } = req.params;
    const { name, category, description, coordinatorId, maxSeats, availableSeats, registrationStartDate, registrationEndDate, status, bannerUrl } = req.body;

    const existing = queryOne('SELECT * FROM clubs WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Club not found' });
    }

    execute(`
      UPDATE clubs
      SET 
        name = COALESCE(?, name),
        category = COALESCE(?, category),
        description = COALESCE(?, description),
        coordinator_id = COALESCE(?, coordinator_id),
        max_seats = COALESCE(?, max_seats),
        available_seats = COALESCE(?, available_seats),
        registration_start_date = COALESCE(?, registration_start_date),
        registration_end_date = COALESCE(?, registration_end_date),
        status = COALESCE(?, status),
        banner_url = COALESCE(?, banner_url),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [
      name ? name.trim() : null,
      category ? category.trim() : null,
      description !== undefined ? description : null,
      coordinatorId || null,
      maxSeats !== undefined ? parseInt(maxSeats, 10) : null,
      availableSeats !== undefined ? parseInt(availableSeats, 10) : null,
      registrationStartDate || null,
      registrationEndDate || null,
      status || null,
      bannerUrl || null,
      id
    ]);

    res.status(200).json({ success: true, message: 'Club updated successfully' });
  } catch (error) {
    next(error);
  }
}

/**
 * Get Club Members / Registered Students
 * GET /api/faculty/clubs/:id/members
 */
export async function getClubMembers(req, res, next) {
  try {
    const { id } = req.params;
    const club = queryOne('SELECT id, name FROM clubs WHERE id = ?', [id]);
    if (!club) {
      return res.status(404).json({ success: false, message: 'Club not found' });
    }

    const members = queryAll(`
      SELECT 
        cr.id, cr.student_id as studentId, cr.student_name as studentName,
        cr.student_email as studentEmail, cr.roll_number as rollNumber,
        cr.department, cr.year, cr.division, cr.status, cr.registered_at as registeredAt
      FROM club_registrations cr
      WHERE cr.club_id = ?
      ORDER BY cr.registered_at DESC
    `, [id]);

    res.status(200).json({ success: true, clubName: club.name, members });
  } catch (error) {
    next(error);
  }
}

/**
 * Get Faculty Events
 * GET /api/faculty/events
 */
export async function getFacultyEvents(req, res, next) {
  try {
    const events = queryAll(`
      SELECT 
        e.id, e.club_id as clubId, c.name as clubName,
        e.title, e.description, e.event_date as eventDate, e.event_time as eventTime,
        e.venue, e.registration_start_date as registrationStartDate,
        e.registration_last_date as registrationLastDate,
        e.coordinator_id as coordinatorId, u.name as coordinatorName,
        e.status, e.banner_url as bannerUrl, e.created_at as createdAt,
        (SELECT COUNT(*) FROM event_registrations WHERE event_id = e.id) as registeredCount
      FROM club_events e
      LEFT JOIN clubs c ON e.club_id = c.id
      LEFT JOIN users u ON e.coordinator_id = u.id
      ORDER BY e.event_date ASC
    `);

    // Automatic registration deadline status calculation
    const todayStr = new Date().toISOString().split('T')[0];
    const formatted = events.map(ev => {
      let currentStatus = ev.status;
      if (ev.status !== 'Cancelled' && ev.registrationLastDate && todayStr > ev.registrationLastDate) {
        currentStatus = 'Registration Closed';
      }
      return { ...ev, status: currentStatus };
    });

    res.status(200).json({ success: true, events: formatted });
  } catch (error) {
    next(error);
  }
}

/**
 * Create Campus Event
 * POST /api/faculty/events
 */
export async function createEvent(req, res, next) {
  try {
    const { clubId, title, description, eventDate, eventTime, venue, registrationStartDate, registrationLastDate, coordinatorId, status, bannerUrl } = req.body;

    if (!title || !eventDate || !venue) {
      return res.status(400).json({ success: false, message: 'Event title, date, and venue are required' });
    }

    const id = `evt_${crypto.randomBytes(6).toString('hex')}`;
    const coordId = coordinatorId || req.user.id;

    execute(`
      INSERT INTO club_events (
        id, club_id, title, description, event_date, event_time, venue,
        registration_start_date, registration_last_date, coordinator_id, status, banner_url, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `, [
      id, clubId || null, title.trim(), description || '', eventDate, eventTime || null, venue.trim(),
      registrationStartDate || null, registrationLastDate || null, coordId, status || 'Upcoming', bannerUrl || null
    ]);

    res.status(201).json({ success: true, message: 'Event created successfully', eventId: id });
  } catch (error) {
    next(error);
  }
}

/**
 * Update Event
 * PUT /api/faculty/events/:id
 */
export async function updateEvent(req, res, next) {
  try {
    const { id } = req.params;
    const { clubId, title, description, eventDate, eventTime, venue, registrationStartDate, registrationLastDate, coordinatorId, status, bannerUrl } = req.body;

    const existing = queryOne('SELECT * FROM club_events WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    execute(`
      UPDATE club_events
      SET 
        club_id = COALESCE(?, club_id),
        title = COALESCE(?, title),
        description = COALESCE(?, description),
        event_date = COALESCE(?, event_date),
        event_time = COALESCE(?, event_time),
        venue = COALESCE(?, venue),
        registration_start_date = COALESCE(?, registration_start_date),
        registration_last_date = COALESCE(?, registration_last_date),
        coordinator_id = COALESCE(?, coordinator_id),
        status = COALESCE(?, status),
        banner_url = COALESCE(?, banner_url),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [
      clubId || null,
      title ? title.trim() : null,
      description !== undefined ? description : null,
      eventDate || null,
      eventTime || null,
      venue ? venue.trim() : null,
      registrationStartDate || null,
      registrationLastDate || null,
      coordinatorId || null,
      status || null,
      bannerUrl || null,
      id
    ]);

    if (status === 'Cancelled' && existing.status !== 'Cancelled') {
      const attendees = queryAll('SELECT student_id FROM event_registrations WHERE event_id = ?', [id]);
      for (const att of attendees) {
        const notifId = `notif_${crypto.randomBytes(6).toString('hex')}`;
        execute(`
          INSERT INTO notifications (id, user_id, target_role, type, title, message, link)
          VALUES (?, ?, 'STUDENT', 'EVENT_CANCELLED', 'Event Cancelled', ?, '/student/registrations')
        `, [notifId, att.student_id, `The event "${existing.title}" scheduled for ${existing.event_date} has been cancelled.`]);
      }
    }

    res.status(200).json({ success: true, message: 'Event updated successfully' });
  } catch (error) {
    next(error);
  }
}


/**
 * Get Registered Event Attendees
 * GET /api/faculty/events/:id/attendees
 */
export async function getEventAttendees(req, res, next) {
  try {
    const { id } = req.params;
    const event = queryOne('SELECT id, title FROM club_events WHERE id = ?', [id]);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    const attendees = queryAll(`
      SELECT 
        er.id, er.student_id as studentId, er.student_name as studentName,
        er.student_email as studentEmail, er.roll_number as rollNumber,
        er.department, er.year, er.division, er.registered_at as registeredAt
      FROM event_registrations er
      WHERE er.event_id = ?
      ORDER BY er.registered_at DESC
    `, [id]);

    res.status(200).json({ success: true, eventTitle: event.title, attendees });
  } catch (error) {
    next(error);
  }
}

// ============================================================================
// 5. SMART DOUBT DISCUSSION — FACULTY SIDE
// ============================================================================

/**
 * Get Discussion Pages
 * GET /api/faculty/doubt-pages
 */
export async function getDoubtPages(req, res, next) {
  try {
    const pages = queryAll(`
      SELECT 
        dp.id, dp.faculty_id as facultyId, dp.department, dp.year, dp.division,
        dp.subject_id as subjectId, s.name as subjectName, s.code as subjectCode,
        dp.title, dp.description, dp.semester, dp.authorized_emails as authorizedEmails,
        dp.is_active as isActive, dp.created_at as createdAt,
        (SELECT COUNT(*) FROM doubts WHERE page_id = dp.id) as totalDoubts,
        (SELECT COUNT(*) FROM doubts WHERE page_id = dp.id AND is_faculty_help_requested = 1 AND status != 'ANSWERED') as pendingHelpCount
      FROM doubt_pages dp
      LEFT JOIN subjects s ON dp.subject_id = s.id
      ORDER BY dp.created_at DESC
    `);

    const formatted = pages.map(p => ({
      ...p,
      authorizedEmails: safeJsonParse(p.authorizedEmails, [])
    }));

    res.status(200).json({ success: true, pages: formatted });
  } catch (error) {
    next(error);
  }
}

/**
 * Create Class + Subject Discussion Page
 * POST /api/faculty/doubt-pages
 */
export async function createDoubtPage(req, res, next) {
  try {
    const { department, year, division, subjectId, title, description, semester, authorizedEmails } = req.body;

    if (!department || !year || !division || !subjectId || !title) {
      return res.status(400).json({ success: false, message: 'Department, Year, Division, Subject, and Title are required' });
    }

    // Verify authorized student emails belong strictly to the correct department/year/division
    let validatedEmails = [];
    if (Array.isArray(authorizedEmails) && authorizedEmails.length > 0) {
      for (const email of authorizedEmails) {
        const trimmedEmail = email.trim();
        if (!trimmedEmail) continue;
        const student = queryOne('SELECT id, department, year, division FROM users WHERE email = ? AND role = ?', [trimmedEmail, ROLES.STUDENT]);
        if (!student) {
          return res.status(400).json({
            success: false,
            message: `Cannot authorize '${trimmedEmail}': Student account not found.`
          });
        }
        if (student.department !== department || student.year !== year || student.division !== division) {
          return res.status(400).json({
            success: false,
            message: `Cannot authorize '${trimmedEmail}': Student belongs to ${student.department} (${student.year}-${student.division}), not ${department} (${year}-${division}).`
          });
        }
        validatedEmails.push(trimmedEmail);
      }
    }

    const id = `page_${crypto.randomBytes(6).toString('hex')}`;
    const authEmailsJson = JSON.stringify(validatedEmails);

    execute(`
      INSERT INTO doubt_pages (
        id, faculty_id, department, year, division, subject_id, title, description, semester, authorized_emails, is_active, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP)
    `, [id, req.user.id, department, year, division, subjectId, title.trim(), description || '', semester || 4, authEmailsJson]);

    res.status(201).json({ success: true, message: 'Doubt discussion page created successfully', pageId: id });
  } catch (error) {
    next(error);
  }
}

/**
 * Update Discussion Page (e.g. Authorized student emails)
 * PUT /api/faculty/doubt-pages/:id
 */
export async function updateDoubtPage(req, res, next) {
  try {
    const { id } = req.params;
    const { title, description, authorizedEmails, isActive } = req.body;

    const existing = queryOne('SELECT * FROM doubt_pages WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Discussion page not found' });
    }

    let authEmailsJson = undefined;
    if (authorizedEmails !== undefined) {
      let validatedEmails = [];
      if (Array.isArray(authorizedEmails) && authorizedEmails.length > 0) {
        for (const email of authorizedEmails) {
          const trimmedEmail = email.trim();
          if (!trimmedEmail) continue;
          const student = queryOne('SELECT id, department, year, division FROM users WHERE email = ? AND role = ?', [trimmedEmail, ROLES.STUDENT]);
          if (!student) {
            return res.status(400).json({
              success: false,
              message: `Cannot authorize '${trimmedEmail}': Student account not found.`
            });
          }
          if (student.department !== existing.department || student.year !== existing.year || student.division !== existing.division) {
            return res.status(400).json({
              success: false,
              message: `Cannot authorize '${trimmedEmail}': Student belongs to ${student.department} (${student.year}-${student.division}), not ${existing.department} (${existing.year}-${existing.division}).`
            });
          }
          validatedEmails.push(trimmedEmail);
        }
      }
      authEmailsJson = JSON.stringify(validatedEmails);
    }

    execute(`
      UPDATE doubt_pages
      SET 
        title = COALESCE(?, title),
        description = COALESCE(?, description),
        authorized_emails = COALESCE(?, authorized_emails),
        is_active = COALESCE(?, is_active),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [
      title ? title.trim() : null,
      description !== undefined ? description : null,
      authEmailsJson,
      isActive !== undefined ? (isActive ? 1 : 0) : null,
      id
    ]);

    res.status(200).json({ success: true, message: 'Discussion page updated successfully' });
  } catch (error) {
    next(error);
  }
}


/**
 * Get Faculty Doubts (with filters: all, new, pending_help, answered, verified)
 * GET /api/faculty/doubts
 */
export async function getFacultyDoubts(req, res, next) {
  try {
    const { filter, pageId, subjectId } = req.query;

    let sql = `
      SELECT 
        d.id, d.page_id as pageId, dp.title as pageTitle,
        d.student_id as studentId, u.name as studentName, u.email as studentEmail,
        d.faculty_id as facultyId,
        d.subject_id as subjectId, s.name as subjectName, s.code as subjectCode,
        d.department, d.year, d.division,
        d.title, d.description, d.image_url as imageUrl,
        d.is_anonymous as isAnonymous,
        d.is_faculty_help_requested as isFacultyHelpRequested,
        d.status, d.created_at as createdAt,
        (SELECT COUNT(*) FROM doubt_replies WHERE doubt_id = d.id) as repliesCount,
        (SELECT COUNT(*) FROM doubt_replies WHERE doubt_id = d.id AND is_verified = 1) as verifiedRepliesCount
      FROM doubts d
      LEFT JOIN doubt_pages dp ON d.page_id = dp.id
      LEFT JOIN users u ON d.student_id = u.id
      LEFT JOIN subjects s ON d.subject_id = s.id
      WHERE 1=1
    `;
    const params = [];

    if (pageId && pageId !== 'ALL') {
      sql += ` AND d.page_id = ?`;
      params.push(pageId);
    }
    if (subjectId && subjectId !== 'ALL') {
      sql += ` AND d.subject_id = ?`;
      params.push(subjectId);
    }

    if (filter === 'pending_help') {
      sql += ` AND d.is_faculty_help_requested = 1 AND (d.status = 'OPEN' OR d.status = 'PENDING_FACULTY_HELP' OR d.status != 'ANSWERED')`;
    } else if (filter === 'new') {
      sql += ` AND d.status = 'OPEN' AND (SELECT COUNT(*) FROM doubt_replies WHERE doubt_id = d.id) = 0`;
    } else if (filter === 'answered') {
      sql += ` AND d.status = 'ANSWERED'`;
    } else if (filter === 'verified') {
      sql += ` AND (SELECT COUNT(*) FROM doubt_replies WHERE doubt_id = d.id AND is_verified = 1) > 0`;
    }

    sql += ` ORDER BY d.is_faculty_help_requested DESC, d.created_at DESC`;

    const doubts = queryAll(sql, params);

    res.status(200).json({ success: true, doubts });
  } catch (error) {
    next(error);
  }
}

/**
 * Get Doubt By ID with Replies
 * GET /api/faculty/doubts/:id
 */
export async function getDoubtById(req, res, next) {
  try {
    const { id } = req.params;

    const doubt = queryOne(`
      SELECT 
        d.id, d.page_id as pageId, dp.title as pageTitle,
        d.student_id as studentId, u.name as studentName, u.email as studentEmail,
        d.faculty_id as facultyId,
        d.subject_id as subjectId, s.name as subjectName, s.code as subjectCode,
        d.department, d.year, d.division,
        d.title, d.description, d.image_url as imageUrl,
        d.is_anonymous as isAnonymous,
        d.is_faculty_help_requested as isFacultyHelpRequested,
        d.status, d.created_at as createdAt
      FROM doubts d
      LEFT JOIN doubt_pages dp ON d.page_id = dp.id
      LEFT JOIN users u ON d.student_id = u.id
      LEFT JOIN subjects s ON d.subject_id = s.id
      WHERE d.id = ?
    `, [id]);

    if (!doubt) {
      return res.status(404).json({ success: false, message: 'Doubt not found' });
    }

    const replies = queryAll(`
      SELECT 
        dr.id, dr.doubt_id as doubtId, dr.author_id as authorId,
        u.name as authorName, u.role as authorRole, u.email as authorEmail,
        dr.reply_text as replyText, dr.image_url as imageUrl,
        dr.is_faculty_endorsed as isFacultyEndorsed,
        dr.is_verified as isVerified,
        dr.created_at as createdAt
      FROM doubt_replies dr
      LEFT JOIN users u ON dr.author_id = u.id
      WHERE dr.doubt_id = ?
      ORDER BY dr.is_verified DESC, dr.created_at ASC
    `, [id]);

    res.status(200).json({ success: true, doubt, replies });
  } catch (error) {
    next(error);
  }
}

/**
 * Reply to Doubt (Faculty Structured Post & Reply)
 * POST /api/faculty/doubts/:id/reply
 */
export async function replyDoubt(req, res, next) {
  try {
    const { id } = req.params;
    const { replyText, imageUrl, markVerified } = req.body;

    if (!replyText || !replyText.trim()) {
      return res.status(400).json({ success: false, message: 'Reply text is required' });
    }

    const doubt = queryOne('SELECT * FROM doubts WHERE id = ?', [id]);
    if (!doubt) {
      return res.status(404).json({ success: false, message: 'Doubt not found' });
    }

    const replyId = `rpl_${crypto.randomBytes(6).toString('hex')}`;
    const isVerifiedVal = markVerified ? 1 : 0;

    execute(`
      INSERT INTO doubt_replies (
        id, doubt_id, author_id, reply_text, image_url, is_faculty_endorsed, is_verified, created_at
      ) VALUES (?, ?, ?, ?, ?, 1, ?, CURRENT_TIMESTAMP)
    `, [replyId, id, req.user.id, replyText.trim(), imageUrl || null, isVerifiedVal]);

    if (markVerified) {
      execute("UPDATE doubts SET status = 'ANSWERED', is_faculty_help_requested = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?", [id]);
    }

    // Notify Student
    const notifId = `notif_${crypto.randomBytes(6).toString('hex')}`;
    execute(`
      INSERT INTO notifications (id, user_id, target_role, type, title, message, link)
      VALUES (?, ?, 'STUDENT', 'DOUBT', 'Faculty Replied to Your Doubt', ?, ?)
    `, [
      notifId,
      doubt.student_id,
      `${req.user.name} answered: "${doubt.title.substring(0, 40)}..."`,
      `/student/doubts`
    ]);

    res.status(201).json({
      success: true,
      message: markVerified ? 'Answer posted and marked as VERIFIED' : 'Reply posted successfully',
      replyId
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Mark Reply as Verified Answer
 * PUT /api/faculty/doubts/:id/verify-answer
 */
export async function verifyAnswer(req, res, next) {
  try {
    const { id } = req.params;
    const { replyId } = req.body;

    if (!replyId) {
      return res.status(400).json({ success: false, message: 'replyId is required' });
    }

    execute('UPDATE doubt_replies SET is_verified = 1, is_faculty_endorsed = 1 WHERE id = ? AND doubt_id = ?', [replyId, id]);
    execute("UPDATE doubts SET status = 'ANSWERED', is_faculty_help_requested = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?", [id]);

    const doubt = queryOne('SELECT * FROM doubts WHERE id = ?', [id]);
    const reply = queryOne('SELECT * FROM doubt_replies WHERE id = ?', [replyId]);

    if (doubt) {
      const notifId1 = `notif_${crypto.randomBytes(6).toString('hex')}`;
      execute(`
        INSERT INTO notifications (id, user_id, target_role, type, title, message, link)
        VALUES (?, ?, 'STUDENT', 'VERIFIED_ANSWER', 'Verified Answer on Your Doubt', ?, '/student/doubts')
      `, [notifId1, doubt.student_id, `Faculty marked a verified answer on: "${doubt.title.substring(0, 40)}..."`]);
    }

    if (reply && reply.author_id && doubt && reply.author_id !== doubt.student_id) {
      const notifId2 = `notif_${crypto.randomBytes(6).toString('hex')}`;
      execute(`
        INSERT INTO notifications (id, user_id, target_role, type, title, message, link)
        VALUES (?, ?, 'STUDENT', 'VERIFIED_ANSWER', 'Your Answer was Verified!', ?, '/student/doubts')
      `, [notifId2, reply.author_id, `Your answer on "${doubt?.title?.substring(0, 40)}..." was verified by faculty!`]);
    }

    res.status(200).json({ success: true, message: 'Answer marked as VERIFIED ANSWER' });
  } catch (error) {
    next(error);
  }
}

// ============================================================================
// 6. ANNOUNCEMENTS & FAQS
// ============================================================================

/**
 * Get Announcements
 * GET /api/faculty/announcements
 */
export async function getAnnouncements(req, res, next) {
  try {
    const announcements = queryAll(`
      SELECT 
        a.id, a.faculty_id as facultyId, u.name as facultyName,
        a.department, a.year, a.division,
        a.subject_id as subjectId, s.name as subjectName,
        a.title, a.message, a.priority, a.created_at as createdAt
      FROM announcements a
      LEFT JOIN users u ON a.faculty_id = u.id
      LEFT JOIN subjects s ON a.subject_id = s.id
      WHERE a.faculty_id = ?
      ORDER BY a.created_at DESC
    `, [req.user.id]);

    res.status(200).json({ success: true, announcements });
  } catch (error) {
    next(error);
  }
}

/**
 * Create Announcement
 * POST /api/faculty/announcements
 */
export async function createAnnouncement(req, res, next) {
  try {
    const { department, year, division, subjectId, title, message, priority } = req.body;

    if (!department || !year || !division || !title || !message) {
      return res.status(400).json({ success: false, message: 'Class (Dept/Year/Div), title, and message are required' });
    }

    const id = `anc_${crypto.randomBytes(6).toString('hex')}`;
    execute(`
      INSERT INTO announcements (
        id, faculty_id, department, year, division, subject_id, title, message, priority, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `, [id, req.user.id, department, year, division, subjectId || null, title.trim(), message.trim(), priority || 'Normal']);

    // Send notifications to all students in the class
    const classStudents = queryAll(
      "SELECT id FROM users WHERE role = 'STUDENT' AND department = ? AND year = ? AND division = ?",
      [department, year, division]
    );
    for (const st of classStudents) {
      const notifId = `notif_${crypto.randomBytes(6).toString('hex')}`;
      execute(`
        INSERT INTO notifications (id, user_id, target_role, type, title, message, link)
        VALUES (?, ?, 'STUDENT', 'ANNOUNCEMENT', 'Class Announcement', ?, '/student/doubts')
      `, [notifId, st.id, `${req.user.name} posted an announcement: "${title.trim().substring(0, 45)}"`]);
    }

    res.status(201).json({ success: true, message: 'Announcement published successfully', announcementId: id });
  } catch (error) {
    next(error);
  }
}


/**
 * Delete Announcement
 * DELETE /api/faculty/announcements/:id
 */
export async function deleteAnnouncement(req, res, next) {
  try {
    const { id } = req.params;
    const result = execute('DELETE FROM announcements WHERE id = ? AND faculty_id = ?', [id, req.user.id]);
    if (result.changes === 0) {
      return res.status(404).json({ success: false, message: 'Announcement not found' });
    }
    res.status(200).json({ success: true, message: 'Announcement deleted' });
  } catch (error) {
    next(error);
  }
}

/**
 * Get FAQs
 * GET /api/faculty/faqs
 */
export async function getFaqs(req, res, next) {
  try {
    const { pageId, subjectId } = req.query;
    let sql = `
      SELECT f.id, f.page_id as pageId, f.faculty_id as facultyId, f.subject_id as subjectId, s.name as subjectName,
             f.question, f.answer, f.is_pinned as isPinned, f.display_order as displayOrder, f.created_at as createdAt
      FROM faqs f
      LEFT JOIN subjects s ON f.subject_id = s.id
      WHERE 1=1
    `;
    const params = [];
    if (pageId) {
      sql += ' AND f.page_id = ?';
      params.push(pageId);
    }
    if (subjectId) {
      sql += ' AND f.subject_id = ?';
      params.push(subjectId);
    }
    sql += ' ORDER BY f.display_order ASC, f.created_at DESC';

    const faqs = queryAll(sql, params);
    res.status(200).json({ success: true, faqs });
  } catch (error) {
    next(error);
  }
}

/**
 * Create FAQ
 * POST /api/faculty/faqs
 */
export async function createFaq(req, res, next) {
  try {
    const { pageId, subjectId, question, answer, isPinned, displayOrder } = req.body;

    if (!question || !answer) {
      return res.status(400).json({ success: false, message: 'Question and answer are required' });
    }

    const id = `faq_${crypto.randomBytes(6).toString('hex')}`;
    execute(`
      INSERT INTO faqs (id, page_id, faculty_id, subject_id, question, answer, is_pinned, display_order, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `, [id, pageId || null, req.user.id, subjectId || null, question.trim(), answer.trim(), isPinned ? 1 : 0, displayOrder || 0]);

    res.status(201).json({ success: true, message: 'FAQ pinned successfully', faqId: id });
  } catch (error) {
    next(error);
  }
}

/**
 * Update FAQ
 * PUT /api/faculty/faqs/:id
 */
export async function updateFaq(req, res, next) {
  try {
    const { id } = req.params;
    const { question, answer, isPinned, displayOrder } = req.body;

    const existing = queryOne('SELECT * FROM faqs WHERE id = ? AND faculty_id = ?', [id, req.user.id]);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'FAQ not found or access denied' });
    }

    execute(`
      UPDATE faqs
      SET 
        question = COALESCE(?, question),
        answer = COALESCE(?, answer),
        is_pinned = COALESCE(?, is_pinned),
        display_order = COALESCE(?, display_order)
      WHERE id = ? AND faculty_id = ?
    `, [
      question ? question.trim() : null,
      answer ? answer.trim() : null,
      isPinned !== undefined ? (isPinned ? 1 : 0) : null,
      displayOrder !== undefined ? displayOrder : null,
      id,
      req.user.id
    ]);

    res.status(200).json({ success: true, message: 'FAQ updated successfully' });
  } catch (error) {
    next(error);
  }
}

/**
 * Delete FAQ
 * DELETE /api/faculty/faqs/:id
 */
export async function deleteFaq(req, res, next) {
  try {
    const { id } = req.params;
    const result = execute('DELETE FROM faqs WHERE id = ? AND faculty_id = ?', [id, req.user.id]);
    if (result.changes === 0) {
      return res.status(404).json({ success: false, message: 'FAQ not found' });
    }
    res.status(200).json({ success: true, message: 'FAQ deleted' });
  } catch (error) {
    next(error);
  }
}

// ============================================================================
// 7. ACADEMIC PERFORMANCE (Faculty Side Grading)
// ============================================================================

/**
 * Get Student List & Performance for Class & Subject
 * GET /api/faculty/academic-performance
 */
export async function getAcademicPerformanceForClass(req, res, next) {
  try {
    const { department, year, division, subjectId } = req.query;

    if (!department || !year || !division || !subjectId) {
      return res.status(400).json({ success: false, message: 'Department, Year, Division, and Subject ID are required' });
    }

    const subject = queryOne('SELECT id, name, code FROM subjects WHERE id = ?', [subjectId]);
    if (!subject) {
      return res.status(404).json({ success: false, message: 'Subject not found' });
    }

    // Get all enrolled students in this section
    const students = queryAll(`
      SELECT id, name, email, roll_number as rollNumber, department, year, division
      FROM users
      WHERE role = 'STUDENT' AND department = ? AND year = ? AND division = ? AND status = 'ACTIVE'
      ORDER BY CAST(roll_number AS INTEGER) ASC, name ASC
    `, [department, year, division]);

    // Get existing performance records for this subject
    const existingRecords = queryAll(`
      SELECT 
        id, student_id as studentId, internal_marks as internalMarks, max_marks as maxMarks,
        attendance_percentage as attendancePercentage, performance_status as performanceStatus,
        feedback, is_published as isPublished, updated_at as updatedAt
      FROM academic_performance
      WHERE subject_id = ? AND department = ? AND year = ? AND division = ?
    `, [subjectId, department, year, division]);

    const performanceMap = new Map();
    existingRecords.forEach(r => performanceMap.set(r.studentId, r));

    const studentList = students.map(st => {
      const perf = performanceMap.get(st.id);
      return {
        studentId: st.id,
        name: st.name,
        email: st.email,
        rollNumber: st.rollNumber,
        internalMarks: perf ? perf.internalMarks : 0,
        maxMarks: perf ? perf.maxMarks : 20,
        attendancePercentage: perf ? perf.attendancePercentage : 85,
        performanceStatus: perf ? perf.performanceStatus : 'Good',
        feedback: perf ? perf.feedback : '',
        isPublished: perf ? !!perf.isPublished : false,
        lastUpdated: perf ? perf.updatedAt : null
      };
    });

    res.status(200).json({
      success: true,
      department,
      year,
      division,
      subject,
      students: studentList
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Save & Publish Academic Performance Batch
 * POST /api/faculty/academic-performance/save-batch
 */
export async function saveAcademicPerformanceBatch(req, res, next) {
  try {
    const facultyId = req.user.id;
    const { department, year, division, subjectId, records } = req.body;

    if (!department || !year || !division || !subjectId || !Array.isArray(records)) {
      return res.status(400).json({ success: false, message: 'Invalid payload. Department, Year, Division, Subject ID, and Records array are required' });
    }

    const validStatuses = ['Excellent', 'Good', 'Average', 'Needs Improvement'];

    // Strict validation pass
    for (const rec of records) {
      if (!rec.studentId) continue;

      const marks = parseFloat(rec.internalMarks);
      const maxMarks = parseFloat(rec.maxMarks) || 20;
      const att = parseFloat(rec.attendancePercentage);

      if (isNaN(marks) || marks < 0 || marks > maxMarks) {
        return res.status(400).json({
          success: false,
          message: `Invalid internal marks for student. Marks must be between 0 and ${maxMarks}.`
        });
      }

      if (isNaN(att) || att < 0 || att > 100) {
        return res.status(400).json({
          success: false,
          message: 'Invalid attendance percentage. Attendance must be between 0% and 100%.'
        });
      }
    }

    for (const rec of records) {
      if (!rec.studentId) continue;

      const marks = parseFloat(rec.internalMarks) || 0;
      const maxMarks = parseFloat(rec.maxMarks) || 20;
      const att = parseFloat(rec.attendancePercentage) || 0;
      const status = validStatuses.includes(rec.performanceStatus) ? rec.performanceStatus : 'Good';
      const feedback = rec.feedback || '';

      const existing = queryOne('SELECT id FROM academic_performance WHERE student_id = ? AND subject_id = ?', [rec.studentId, subjectId]);

      if (existing) {
        execute(`
          UPDATE academic_performance
          SET 
            faculty_id = ?,
            internal_marks = ?,
            max_marks = ?,
            attendance_percentage = ?,
            performance_status = ?,
            feedback = ?,
            is_published = 1,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `, [facultyId, marks, maxMarks, att, status, feedback, existing.id]);
      } else {
        const newId = `ap_${crypto.randomBytes(6).toString('hex')}`;
        execute(`
          INSERT INTO academic_performance (
            id, student_id, faculty_id, subject_id, department, year, division,
            internal_marks, max_marks, attendance_percentage, performance_status, feedback, is_published, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP)
        `, [newId, rec.studentId, facultyId, subjectId, department, year, division, marks, maxMarks, att, status, feedback]);
      }

      // Send private notification to student
      const notifId = `notif_${crypto.randomBytes(6).toString('hex')}`;
      execute(`
        INSERT INTO notifications (id, user_id, target_role, type, title, message, link)
        VALUES (?, ?, 'STUDENT', 'ACADEMIC_UPDATE', 'Academic Performance Published', 'Your faculty has updated your internal marks and attendance.', '/student/academic-performance')
      `, [notifId, rec.studentId]);
    }

    res.status(200).json({
      success: true,
      message: `Successfully saved and published academic performance for ${records.length} students`
    });
  } catch (error) {
    next(error);
  }
}


// ============================================================================
// 8. NOTIFICATIONS
// ============================================================================

/**
 * Get Faculty Notifications
 * GET /api/faculty/notifications
 */
export async function getFacultyNotifications(req, res, next) {
  try {
    const notifications = queryAll(`
      SELECT 
        id, user_id as userId, target_role as targetRole, type,
        title, message, is_read as isRead, link, created_at as createdAt
      FROM notifications
      WHERE user_id = ? OR target_role IN ('FACULTY', 'ALL')
      ORDER BY created_at DESC
    `, [req.user.id]);

    const unreadCount = notifications.filter(n => !n.isRead).length;

    res.status(200).json({
      success: true,
      unreadCount,
      notifications
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Mark Notification As Read
 * PUT /api/faculty/notifications/:id/read
 */
export async function markNotificationRead(req, res, next) {
  try {
    const { id } = req.params;
    execute('UPDATE notifications SET is_read = 1 WHERE id = ?', [id]);
    res.status(200).json({ success: true, message: 'Notification marked as read' });
  } catch (error) {
    next(error);
  }
}

/**
 * Mark All Notifications As Read
 * PUT /api/faculty/notifications/mark-all-read
 */
export async function markAllNotificationsRead(req, res, next) {
  try {
    execute("UPDATE notifications SET is_read = 1 WHERE user_id = ? OR target_role IN ('FACULTY', 'ALL')", [req.user.id]);
    res.status(200).json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    next(error);
  }
}

// ============================================================================
// 10. CAMPUS LOST & FOUND (Faculty Access - Part 6)
// ============================================================================

/**
 * Get Active Lost & Found Items for Faculty
 * GET /api/faculty/lost-found
 */
export async function getFacultyLostFound(req, res, next) {
  try {
    const { search, category, type } = req.query;
    let sql = `
      SELECT 
        id, user_id as userId, user_name as userName, user_email as userEmail, user_role as userRole,
        type, item_name as itemName, category, description, location, date, photo_url as photoUrl,
        status, created_at as createdAt, returned_at as returnedAt
      FROM lost_found_items
      WHERE status = 'ACTIVE'
    `;
    const params = [];

    if (type && type !== 'ALL') {
      sql += ' AND type = ?';
      params.push(type.toUpperCase());
    }

    if (category && category !== 'ALL') {
      sql += ' AND category = ?';
      params.push(category);
    }

    if (search) {
      sql += ' AND (item_name LIKE ? OR description LIKE ? OR location LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    sql += ' ORDER BY created_at DESC';
    const items = queryAll(sql, params);
    res.status(200).json({ success: true, items });
  } catch (error) {
    next(error);
  }
}

/**
 * Report Lost or Found Item by Faculty
 * POST /api/faculty/lost-found
 */
export async function createFacultyLostFound(req, res, next) {
  try {
    const { type, itemName, category, description, location, date, photoUrl } = req.body;
    const user = req.user;

    if (!type || !itemName || !category || !description || !location || !date) {
      return res.status(400).json({
        success: false,
        message: 'Type (LOST/FOUND), Item Name, Category, Description, Location, and Date are required'
      });
    }

    const id = `lf_${crypto.randomBytes(6).toString('hex')}`;
    const cleanType = type.toUpperCase();

    execute(`
      INSERT INTO lost_found_items (
        id, user_id, user_name, user_email, user_role, type, item_name,
        category, description, location, date, photo_url, status, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE', CURRENT_TIMESTAMP)
    `, [
      id, user.id, user.name, user.email, user.role, cleanType,
      itemName.trim(), category.trim(), description.trim(), location.trim(),
      date, photoUrl || null
    ]);

    res.status(201).json({
      success: true,
      message: `${cleanType === 'LOST' ? 'Lost' : 'Found'} item reported successfully`,
      itemId: id
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get Faculty Own Reports
 * GET /api/faculty/lost-found/my-reports
 */
export async function getFacultyMyReports(req, res, next) {
  try {
    const reports = queryAll(`
      SELECT 
        id, user_id as userId, user_name as userName, user_email as userEmail, user_role as userRole,
        type, item_name as itemName, category, description, location, date, photo_url as photoUrl,
        status, created_at as createdAt, returned_at as returnedAt
      FROM lost_found_items
      WHERE user_id = ?
      ORDER BY created_at DESC
    `, [req.user.id]);

    res.status(200).json({ success: true, reports });
  } catch (error) {
    next(error);
  }
}

/**
 * Update Faculty Own Report
 * PUT /api/faculty/lost-found/:id
 */
export async function updateFacultyLostFound(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { itemName, category, description, location, date, photoUrl } = req.body;

    const existing = queryOne('SELECT * FROM lost_found_items WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    if (existing.user_id !== userId) {
      return res.status(403).json({ success: false, message: 'Forbidden: You can only edit your own reports' });
    }

    execute(`
      UPDATE lost_found_items
      SET 
        item_name = COALESCE(?, item_name),
        category = COALESCE(?, category),
        description = COALESCE(?, description),
        location = COALESCE(?, location),
        date = COALESCE(?, date),
        photo_url = COALESCE(?, photo_url),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [
      itemName ? itemName.trim() : null,
      category ? category.trim() : null,
      description !== undefined ? description.trim() : null,
      location ? location.trim() : null,
      date || null,
      photoUrl !== undefined ? photoUrl : null,
      id
    ]);

    res.status(200).json({ success: true, message: 'Report updated successfully' });
  } catch (error) {
    next(error);
  }
}

/**
 * Delete Faculty Own Report
 * DELETE /api/faculty/lost-found/:id
 */
export async function deleteFacultyLostFound(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const existing = queryOne('SELECT * FROM lost_found_items WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    if (existing.user_id !== userId) {
      return res.status(403).json({ success: false, message: 'Forbidden: You can only delete your own reports' });
    }

    execute('DELETE FROM lost_found_items WHERE id = ?', [id]);
    res.status(200).json({ success: true, message: 'Report deleted successfully' });
  } catch (error) {
    next(error);
  }
}

/**
 * Mark Item as Returned
 * PUT /api/faculty/lost-found/:id/return
 */
export async function markFacultyLostFoundReturned(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const existing = queryOne('SELECT * FROM lost_found_items WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    if (existing.user_id !== userId) {
      return res.status(403).json({ success: false, message: 'Forbidden: You can only mark your own reports as returned' });
    }

    execute(`
      UPDATE lost_found_items
      SET status = 'RETURNED', returned_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [id]);

    res.status(200).json({
      success: true,
      message: 'Item marked as returned! Archived in Returned History.'
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get Returned History for Faculty
 * GET /api/faculty/lost-found/returned-history
 */
export async function getFacultyReturnedHistory(req, res, next) {
  try {
    const items = queryAll(`
      SELECT 
        id, user_id as userId, user_name as userName, user_email as userEmail, user_role as userRole,
        type, item_name as itemName, category, description, location, date, photo_url as photoUrl,
        status, created_at as createdAt, returned_at as returnedAt
      FROM lost_found_items
      WHERE status = 'RETURNED'
      ORDER BY returned_at DESC
    `);

    res.status(200).json({ success: true, items });
  } catch (error) {
    next(error);
  }
}

