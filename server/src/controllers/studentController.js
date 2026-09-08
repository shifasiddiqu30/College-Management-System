import crypto from 'crypto';
import { queryAll, queryOne, execute } from '../config/db.js';
import { ROLES } from '../config/constants.js';

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
// 1. TIMETABLE & DASHBOARD
// ============================================================================

/**
 * Get Active Department Folders for Weekly Timetable
 * GET /api/student/departments
 */
export async function getStudentDepartmentFolders(req, res, next) {
  try {
    const departments = queryAll("SELECT id, name, code, hod_name as hodName FROM departments WHERE status = 'Active' ORDER BY name ASC");
    res.status(200).json({
      success: true,
      departments,
      studentDepartment: req.user.department
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get Student Timetable, Current Class, Next Class & Weekly Grid
 * GET /api/student/timetable
 * STRICT PRIVACY: Scoped exclusively to req.user.department + req.user.year + req.user.division
 */
export async function getStudentTimetable(req, res, next) {
  try {
    const student = req.user;

    if (!student.department || !student.year || !student.division) {
      return res.status(400).json({
        success: false,
        message: 'Student account is missing department, year, or division assignment.'
      });
    }

    const studentClass = queryOne(
      'SELECT id, department, year, division, class_teacher_id FROM classes WHERE department = ? AND year = ? AND division = ?',
      [student.department, student.year, student.division]
    );

    if (!studentClass) {
      return res.status(200).json({
        success: true,
        message: `No class section found for ${student.department} (${student.year}-${student.division}).`,
        classInfo: { department: student.department, year: student.year, division: student.division },
        todayDay: getCurrentDayOfWeek(),
        currentTime: getCurrentTimeString(),
        todaySchedule: [],
        weeklyGrid: { Monday: [], Tuesday: [], Wednesday: [], Thursday: [], Friday: [], Saturday: [] },
        currentClass: null,
        nextClass: null,
        assignedClassrooms: []
      });
    }

    const sql = `
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
        u.email as facultyEmail,
        t.classroom_id as classroomId,
        cl.room_number as roomNumber,
        cl.classroom_type as classroomType,
        cl.building,
        cl.floor,
        cl.has_projector as hasProjector
      FROM timetables t
      LEFT JOIN subjects s ON t.subject_id = s.id
      LEFT JOIN users u ON t.faculty_id = u.id
      LEFT JOIN classrooms cl ON t.classroom_id = cl.id
      WHERE t.class_id = ?
      ORDER BY 
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

    const allSlots = queryAll(sql, [studentClass.id]);

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

    // Current Class (ONGOING)
    let currentClass = null;
    for (const slot of todaySlots) {
      const startMins = timeToMinutes(slot.startTime);
      const endMins = timeToMinutes(slot.endTime);

      if (currentMins >= startMins && currentMins < endMins) {
        currentClass = {
          ...slot,
          subject: slot.subjectName,
          faculty: slot.facultyName || 'Faculty Professor',
          classroom: slot.roomNumber,
          time: `${slot.startTime} – ${slot.endTime}`,
          status: 'ONGOING',
          isOngoing: true,
          minutesRemaining: endMins - currentMins
        };
        break;
      }
    }

    // Next Class
    let nextClass = null;
    const upcomingToday = todaySlots
      .filter(s => timeToMinutes(s.startTime) > currentMins)
      .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));

    if (upcomingToday.length > 0) {
      const nextSlot = upcomingToday[0];
      const startMins = timeToMinutes(nextSlot.startTime);
      nextClass = {
        ...nextSlot,
        subject: nextSlot.subjectName,
        faculty: nextSlot.facultyName || 'Faculty Professor',
        classroom: nextSlot.roomNumber,
        time: `${nextSlot.startTime} – ${nextSlot.endTime}`,
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
        nextClass = {
          ...tomorrowSlots[0],
          subject: tomorrowSlots[0].subjectName,
          faculty: tomorrowSlots[0].facultyName || 'Faculty Professor',
          classroom: tomorrowSlots[0].roomNumber,
          time: `${tomorrowSlots[0].startTime} – ${tomorrowSlots[0].endTime}`,
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
          hasProjector: !!slot.hasProjector
        });
      }
    });

    const assignedClassrooms = Array.from(assignedRoomsMap.values());

    res.status(200).json({
      success: true,
      student: {
        id: student.id,
        name: student.name,
        email: student.email,
        department: student.department,
        year: student.year,
        division: student.division,
        rollNumber: student.rollNumber
      },
      classInfo: {
        id: studentClass.id,
        department: studentClass.department,
        year: studentClass.year,
        division: studentClass.division
      },
      cohort: {
        department: studentClass.department,
        year: studentClass.year,
        division: studentClass.division
      },
      currentTime: currentTimeStr,
      todayDay,
      todaySchedule: todaySlots,
      weeklyGrid,
      currentClass,
      nextClass,
      assignedClassrooms
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get Student Dashboard Stats & Overview
 * GET /api/student/dashboard-stats
 */
export async function getStudentDashboardStats(req, res, next) {
  try {
    const student = req.user;

    const studentClass = queryOne(
      'SELECT id, department, year, division FROM classes WHERE department = ? AND year = ? AND division = ?',
      [student.department, student.year, student.division]
    );

    let weeklyLecturesCount = 0;
    let enrolledSubjectsCount = 0;
    let todayLecturesCount = 0;

    if (studentClass) {
      const countRes = queryOne('SELECT COUNT(*) as count FROM timetables WHERE class_id = ?', [studentClass.id]);
      weeklyLecturesCount = countRes?.count || 0;

      const subRes = queryOne('SELECT COUNT(DISTINCT subject_id) as count FROM timetables WHERE class_id = ?', [studentClass.id]);
      enrolledSubjectsCount = subRes?.count || 0;

      const todayDay = getCurrentDayOfWeek();
      const todayRes = queryOne('SELECT COUNT(*) as count FROM timetables WHERE class_id = ? AND day_of_week = ?', [studentClass.id, todayDay]);
      todayLecturesCount = todayRes?.count || 0;
    }

    // Unread Notifications Count
    const unreadNotifRes = queryOne(`
      SELECT COUNT(*) as count 
      FROM notifications 
      WHERE (user_id = ? OR target_role IN ('STUDENT', 'ALL')) AND is_read = 0
    `, [student.id]);
    const unreadNotificationsCount = unreadNotifRes?.count || 0;

    // Upcoming Events Count
    const eventsRes = queryOne(`
      SELECT COUNT(*) as count 
      FROM club_events 
      WHERE status != 'Cancelled'
    `);
    const upcomingEventsCount = eventsRes?.count || 0;

    res.status(200).json({
      success: true,
      profile: {
        id: student.id,
        name: student.name,
        email: student.email,
        department: student.department,
        year: student.year,
        division: student.division,
        rollNumber: student.rollNumber,
        status: student.status,
        semester: student.year === 'SE' ? 4 : (student.year === 'TE' ? 6 : (student.year === 'BE' ? 8 : 2)),
        academicYear: '2026-2027'
      },
      stats: {
        todayLecturesCount,
        weeklyLecturesCount,
        enrolledSubjectsCount: enrolledSubjectsCount || 5,
        upcomingEventsCount,
        unreadNotificationsCount,
        overallAttendance: '92.4%',
        activeCohort: `${student.department} (${student.year}-${student.division})`
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get Student Profile Details
 * GET /api/student/profile
 */
export async function getStudentProfile(req, res, next) {
  try {
    const student = queryOne(
      'SELECT id, name, email, department, year, division, roll_number, status, created_at FROM users WHERE id = ?',
      [req.user.id]
    );

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student profile not found' });
    }

    const semester = student.year === 'SE' ? 4 : (student.year === 'TE' ? 6 : (student.year === 'BE' ? 8 : 2));

    res.status(200).json({
      success: true,
      profile: {
        id: student.id,
        name: student.name,
        email: student.email,
        department: student.department,
        year: student.year,
        division: student.division,
        rollNumber: student.roll_number,
        semester,
        academicYear: '2026-2027',
        status: student.status,
        joinedDate: student.created_at
      }
    });
  } catch (error) {
    next(error);
  }
}

// ============================================================================
// 2. ACADEMIC PERFORMANCE (Strict 1:1 Student Privacy)
// ============================================================================

/**
 * Get Student's Own Academic Performance
 * GET /api/student/academic-performance
 * STRICT PRIVACY: Returns records exclusively for req.user.id
 */
export async function getStudentAcademicPerformance(req, res, next) {
  try {
    const studentId = req.user.id;

    const records = queryAll(`
      SELECT 
        ap.id, ap.student_id as studentId,
        ap.subject_id as subjectId, s.name as subjectName, s.code as subjectCode, s.credits,
        ap.faculty_id as facultyId, u.name as facultyName,
        ap.internal_marks as internalMarks, ap.max_marks as maxMarks,
        ap.attendance_percentage as attendancePercentage,
        ap.performance_status as performanceStatus,
        ap.feedback, ap.updated_at as updatedAt
      FROM academic_performance ap
      LEFT JOIN subjects s ON ap.subject_id = s.id
      LEFT JOIN users u ON ap.faculty_id = u.id
      WHERE ap.student_id = ? AND ap.is_published = 1
      ORDER BY s.name ASC
    `, [studentId]);

    let totalMarks = 0;
    let totalMaxMarks = 0;
    let totalAttendance = 0;

    records.forEach(r => {
      totalMarks += r.internalMarks || 0;
      totalMaxMarks += r.maxMarks || 20;
      totalAttendance += r.attendancePercentage || 0;
    });

    const averagePercentage = totalMaxMarks > 0 ? ((totalMarks / totalMaxMarks) * 100).toFixed(1) : 0;
    const averageAttendance = records.length > 0 ? (totalAttendance / records.length).toFixed(1) : 0;

    res.status(200).json({
      success: true,
      student: {
        id: req.user.id,
        name: req.user.name,
        rollNumber: req.user.rollNumber,
        department: req.user.department,
        year: req.user.year,
        division: req.user.division
      },
      summary: {
        totalSubjectsGraded: records.length,
        averagePercentage: `${averagePercentage}%`,
        averageAttendance: `${averageAttendance}%`
      },
      records
    });
  } catch (error) {
    next(error);
  }
}

// ============================================================================
// 3. SMART DOUBT DISCUSSION (Student Side)
// ============================================================================

/**
 * Get Discussion Pages Accessible to Student (Strict Authorization)
 * GET /api/student/doubt-pages
 */
export async function getStudentDoubtPages(req, res, next) {
  try {
    const student = req.user;

    const allPages = queryAll(`
      SELECT 
        dp.id, dp.faculty_id as facultyId, u.name as facultyName,
        dp.department, dp.year, dp.division,
        dp.subject_id as subjectId, s.name as subjectName, s.code as subjectCode,
        dp.title, dp.description, dp.semester, dp.authorized_emails as authorizedEmails,
        (SELECT COUNT(*) FROM doubts WHERE page_id = dp.id) as totalDoubts
      FROM doubt_pages dp
      LEFT JOIN users u ON dp.faculty_id = u.id
      LEFT JOIN subjects s ON dp.subject_id = s.id
      WHERE dp.is_active = 1
      ORDER BY dp.created_at DESC
    `);

    const authorizedPages = allPages.filter(page => {
      const isClassMatch = page.department === student.department && page.year === student.year && page.division === student.division;
      const emailsList = safeJsonParse(page.authorizedEmails, []);
      const isEmailAuthorized = emailsList.includes(student.email);
      return isClassMatch || isEmailAuthorized;
    });

    res.status(200).json({
      success: true,
      pages: authorizedPages
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get Doubts for Authorized Discussion Page with Search & Filters
 * GET /api/student/doubts
 */
export async function getStudentDoubts(req, res, next) {
  try {
    const student = req.user;
    const { pageId, search, filter } = req.query;

    if (pageId) {
      const page = queryOne('SELECT * FROM doubt_pages WHERE id = ?', [pageId]);
      if (!page) {
        return res.status(404).json({ success: false, message: 'Discussion page not found' });
      }

      const isClassMatch = page.department === student.department && page.year === student.year && page.division === student.division;
      const emailsList = safeJsonParse(page.authorized_emails, []);
      const isEmailAuthorized = emailsList.includes(student.email);

      if (!isClassMatch && !isEmailAuthorized) {
        return res.status(403).json({ success: false, message: 'Access Denied: You are not authorized for this discussion page' });
      }
    }

    let sql = `
      SELECT 
        d.id, d.page_id as pageId, dp.title as pageTitle,
        d.student_id as studentId, u.name as studentName, u.email as studentEmail,
        d.faculty_id as facultyId, fac.name as facultyName,
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
      LEFT JOIN users fac ON d.faculty_id = fac.id
      LEFT JOIN subjects s ON d.subject_id = s.id
      WHERE 1=1
    `;
    const params = [];

    if (pageId) {
      sql += ' AND d.page_id = ?';
      params.push(pageId);
    } else {
      // Show doubts from student's department/year/division or authorized pages
      sql += ` AND (
        (d.department = ? AND d.year = ? AND d.division = ?)
        OR d.page_id IN (
          SELECT id FROM doubt_pages 
          WHERE authorized_emails LIKE ?
        )
      )`;
      params.push(student.department, student.year, student.division, `%"${student.email}"%`);
    }

    if (search && search.trim()) {
      sql += ' AND (d.title LIKE ? OR d.description LIKE ?)';
      params.push(`%${search.trim()}%`, `%${search.trim()}%`);
    }

    if (filter === 'open') {
      sql += " AND d.status = 'OPEN' AND d.is_faculty_help_requested = 0";
    } else if (filter === 'faculty_help' || filter === 'pending_help') {
      sql += " AND (d.is_faculty_help_requested = 1 OR d.status = 'PENDING_FACULTY_HELP')";
    } else if (filter === 'answered') {
      sql += " AND d.status = 'ANSWERED'";
    } else if (filter === 'verified') {
      sql += " AND (SELECT COUNT(*) FROM doubt_replies WHERE doubt_id = d.id AND is_verified = 1) > 0";
    }

    sql += ' ORDER BY d.is_faculty_help_requested DESC, d.created_at DESC';

    const doubts = queryAll(sql, params);

    // Format display names for anonymous posts if needed
    const formatted = doubts.map(d => ({
      ...d,
      studentName: d.isAnonymous && d.studentId !== student.id ? 'Anonymous Student' : d.studentName,
      studentEmail: d.isAnonymous && d.studentId !== student.id ? 'anonymous@college.edu' : d.studentEmail
    }));

    res.status(200).json({ success: true, doubts: formatted });
  } catch (error) {
    next(error);
  }
}

/**
 * Get Doubt Details by ID with Ordered Replies
 * GET /api/student/doubts/:id
 */
export async function getStudentDoubtById(req, res, next) {
  try {
    const { id } = req.params;
    const student = req.user;

    const doubt = queryOne(`
      SELECT 
        d.id, d.page_id as pageId, dp.title as pageTitle,
        d.student_id as studentId, u.name as studentName, u.email as studentEmail,
        d.faculty_id as facultyId, fac.name as facultyName,
        d.subject_id as subjectId, s.name as subjectName, s.code as subjectCode,
        d.department, d.year, d.division,
        d.title, d.description, d.image_url as imageUrl,
        d.is_anonymous as isAnonymous,
        d.is_faculty_help_requested as isFacultyHelpRequested,
        d.status, d.created_at as createdAt
      FROM doubts d
      LEFT JOIN doubt_pages dp ON d.page_id = dp.id
      LEFT JOIN users u ON d.student_id = u.id
      LEFT JOIN users fac ON d.faculty_id = fac.id
      LEFT JOIN subjects s ON d.subject_id = s.id
      WHERE d.id = ?
    `, [id]);

    if (!doubt) {
      return res.status(404).json({ success: false, message: 'Doubt not found' });
    }

    // Verify student authorization for this doubt's page or class
    if (doubt.pageId) {
      const page = queryOne('SELECT * FROM doubt_pages WHERE id = ?', [doubt.pageId]);
      if (page) {
        const isClassMatch = page.department === student.department && page.year === student.year && page.division === student.division;
        const emailsList = safeJsonParse(page.authorized_emails, []);
        const isEmailAuthorized = emailsList.includes(student.email);
        if (!isClassMatch && !isEmailAuthorized) {
          return res.status(403).json({ success: false, message: 'Access Denied: You are not authorized to view this discussion' });
        }
      }
    } else {
      const isClassMatch = doubt.department === student.department && doubt.year === student.year && doubt.division === student.division;
      if (!isClassMatch && doubt.studentId !== student.id) {
        return res.status(403).json({ success: false, message: 'Access Denied: You are not authorized to view this discussion' });
      }
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

    const formattedDoubt = {
      ...doubt,
      studentName: doubt.isAnonymous && doubt.studentId !== student.id ? 'Anonymous Student' : doubt.studentName,
      studentEmail: doubt.isAnonymous && doubt.studentId !== student.id ? 'anonymous@college.edu' : doubt.studentEmail
    };

    res.status(200).json({ success: true, doubt: formattedDoubt, replies });
  } catch (error) {
    next(error);
  }
}

/**
 * Post a Doubt
 * POST /api/student/doubts
 */
export async function createStudentDoubt(req, res, next) {
  try {
    const student = req.user;
    const { pageId, subjectId, title, description, imageUrl, isAnonymous } = req.body;

    if (!title || !description) {
      return res.status(400).json({ success: false, message: 'Title and description are required' });
    }

    let facultyId = null;
    let subject_id = subjectId || null;

    if (pageId) {
      const page = queryOne('SELECT * FROM doubt_pages WHERE id = ?', [pageId]);
      if (!page) {
        return res.status(404).json({ success: false, message: 'Discussion page not found' });
      }

      const isClassMatch = page.department === student.department && page.year === student.year && page.division === student.division;
      const emailsList = safeJsonParse(page.authorized_emails, []);
      const isEmailAuthorized = emailsList.includes(student.email);

      if (!isClassMatch && !isEmailAuthorized) {
        return res.status(403).json({ success: false, message: 'Access Denied: You are not authorized for this discussion page' });
      }
      facultyId = page.faculty_id;
      subject_id = page.subject_id;
    } else {
      // Find assigned faculty for student's class + subject
      if (subject_id) {
        const tt = queryOne('SELECT faculty_id FROM timetables WHERE subject_id = ? LIMIT 1', [subject_id]);
        if (tt) facultyId = tt.faculty_id;
      }
    }

    const id = `dbt_${crypto.randomBytes(6).toString('hex')}`;
    execute(`
      INSERT INTO doubts (
        id, page_id, student_id, faculty_id, subject_id, department, year, division,
        title, description, image_url, is_anonymous, is_faculty_help_requested, status, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 'OPEN', CURRENT_TIMESTAMP)
    `, [
      id, pageId || null, student.id, facultyId, subject_id, student.department, student.year, student.division,
      title.trim(), description.trim(), imageUrl || null, isAnonymous ? 1 : 0
    ]);

    res.status(201).json({ success: true, message: 'Doubt posted successfully', doubtId: id });
  } catch (error) {
    next(error);
  }
}

/**
 * Classmate Reply to Doubt
 * POST /api/student/doubts/:id/reply
 */
export async function replyStudentDoubt(req, res, next) {
  try {
    const { id } = req.params;
    const student = req.user;
    const { replyText, imageUrl } = req.body;

    if (!replyText || !replyText.trim()) {
      return res.status(400).json({ success: false, message: 'Reply text is required' });
    }

    const doubt = queryOne('SELECT * FROM doubts WHERE id = ?', [id]);
    if (!doubt) {
      return res.status(404).json({ success: false, message: 'Doubt not found' });
    }

    // Verify student is authorized for this discussion page
    if (doubt.page_id) {
      const page = queryOne('SELECT * FROM doubt_pages WHERE id = ?', [doubt.page_id]);
      if (page) {
        const isClassMatch = page.department === student.department && page.year === student.year && page.division === student.division;
        const emailsList = safeJsonParse(page.authorized_emails, []);
        const isEmailAuthorized = emailsList.includes(student.email);
        if (!isClassMatch && !isEmailAuthorized) {
          return res.status(403).json({ success: false, message: 'Access Denied: You cannot reply to an unauthorized discussion' });
        }
      }
    } else {
      const isClassMatch = doubt.department === student.department && doubt.year === student.year && doubt.division === student.division;
      if (!isClassMatch) {
        return res.status(403).json({ success: false, message: 'Access Denied: You cannot reply to an unauthorized discussion' });
      }
    }

    const replyId = `rpl_${crypto.randomBytes(6).toString('hex')}`;
    execute(`
      INSERT INTO doubt_replies (
        id, doubt_id, author_id, reply_text, image_url, is_faculty_endorsed, is_verified, created_at
      ) VALUES (?, ?, ?, ?, ?, 0, 0, CURRENT_TIMESTAMP)
    `, [replyId, id, student.id, replyText.trim(), imageUrl || null]);

    // Send notification to Doubt Author if someone else replied
    if (doubt.student_id !== student.id) {
      const notifId = `notif_${crypto.randomBytes(6).toString('hex')}`;
      execute(`
        INSERT INTO notifications (id, user_id, target_role, type, title, message, link)
        VALUES (?, ?, 'STUDENT', 'DOUBT', 'New Reply on Your Doubt', ?, '/student/doubts')
      `, [notifId, doubt.student_id, `${student.name} replied to your doubt: "${doubt.title.substring(0, 40)}..."`]);
    }

    res.status(201).json({
      success: true,
      message: 'Reply posted successfully',
      replyId
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Request Faculty Help on a Doubt
 * POST /api/student/doubts/:id/request-help
 */
export async function requestFacultyHelp(req, res, next) {
  try {
    const { id } = req.params;
    const student = req.user;

    const doubt = queryOne('SELECT * FROM doubts WHERE id = ?', [id]);
    if (!doubt) {
      return res.status(404).json({ success: false, message: 'Doubt not found' });
    }

    // Verify authorization
    if (doubt.page_id) {
      const page = queryOne('SELECT * FROM doubt_pages WHERE id = ?', [doubt.page_id]);
      if (page) {
        const isClassMatch = page.department === student.department && page.year === student.year && page.division === student.division;
        const emailsList = safeJsonParse(page.authorized_emails, []);
        const isEmailAuthorized = emailsList.includes(student.email);
        if (!isClassMatch && !isEmailAuthorized) {
          return res.status(403).json({ success: false, message: 'Access Denied: You cannot request help on this discussion' });
        }
      }
    }

    execute("UPDATE doubts SET is_faculty_help_requested = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?", [id]);

    let targetFacultyId = doubt.faculty_id;
    if (!targetFacultyId && doubt.subject_id) {
      const tt = queryOne('SELECT faculty_id FROM timetables WHERE subject_id = ? LIMIT 1', [doubt.subject_id]);
      if (tt) targetFacultyId = tt.faculty_id;
    }

    if (targetFacultyId) {
      const notifId = `notif_${crypto.randomBytes(6).toString('hex')}`;
      execute(`
        INSERT INTO notifications (id, user_id, target_role, type, title, message, link)
        VALUES (?, ?, 'FACULTY', 'HELP_REQUEST', 'Student Requested Faculty Help', ?, '/faculty/doubts')
      `, [notifId, targetFacultyId, `${student.name} (${student.year}-${student.division}) requested faculty guidance on: "${doubt.title.substring(0, 45)}..."`]);
    }

    res.status(200).json({
      success: true,
      message: 'Faculty help requested. The assigned professor has been notified.'
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get Announcements for Student's Class & Authorized Discussion Pages
 * GET /api/student/announcements
 */
export async function getStudentAnnouncements(req, res, next) {
  try {
    const student = req.user;

    const announcements = queryAll(`
      SELECT 
        a.id, a.faculty_id as facultyId, u.name as facultyName,
        a.department, a.year, a.division,
        a.subject_id as subjectId, s.name as subjectName, s.code as subjectCode,
        a.title, a.message, a.priority, a.created_at as createdAt
      FROM announcements a
      LEFT JOIN users u ON a.faculty_id = u.id
      LEFT JOIN subjects s ON a.subject_id = s.id
      WHERE (a.department = ? AND a.year = ? AND a.division = ?)
      ORDER BY a.created_at DESC
    `, [student.department, student.year, student.division]);

    res.status(200).json({
      success: true,
      announcements
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get Pinned FAQs for Student's Discussion Page
 * GET /api/student/faqs
 */
export async function getStudentFaqs(req, res, next) {
  try {
    const student = req.user;
    const { pageId, subjectId } = req.query;

    let sql = `
      SELECT 
        f.id, f.page_id as pageId, f.faculty_id as facultyId, u.name as facultyName,
        f.subject_id as subjectId, s.name as subjectName,
        f.question, f.answer, f.is_pinned as isPinned, f.display_order as displayOrder,
        f.created_at as createdAt
      FROM faqs f
      LEFT JOIN users u ON f.faculty_id = u.id
      LEFT JOIN subjects s ON f.subject_id = s.id
      WHERE 1=1
    `;
    const params = [];

    if (pageId) {
      const page = queryOne('SELECT * FROM doubt_pages WHERE id = ?', [pageId]);
      if (page) {
        const isClassMatch = page.department === student.department && page.year === student.year && page.division === student.division;
        const emailsList = safeJsonParse(page.authorized_emails, []);
        const isEmailAuthorized = emailsList.includes(student.email);
        if (!isClassMatch && !isEmailAuthorized) {
          return res.status(403).json({ success: false, message: 'Access Denied: You are not authorized for this FAQ' });
        }
      }
      sql += ' AND f.page_id = ?';
      params.push(pageId);
    } else if (subjectId) {
      sql += ' AND f.subject_id = ?';
      params.push(subjectId);
    }

    sql += ' ORDER BY f.is_pinned DESC, f.display_order ASC, f.created_at DESC';

    const faqs = queryAll(sql, params);

    res.status(200).json({
      success: true,
      faqs
    });
  } catch (error) {
    next(error);
  }
}


// ============================================================================
// 4. CLUBS & EVENTS (Part 6)
// ============================================================================

/**
 * Get Clubs and Events for Student
 * GET /api/student/clubs-events
 */
export async function getStudentClubsEvents(req, res, next) {
  try {
    const studentId = req.user.id;
    const todayStr = new Date().toISOString().split('T')[0];

    const clubs = queryAll(`
      SELECT 
        c.id, c.name, c.category, c.description, c.max_seats as maxSeats, c.available_seats as availableSeats,
        c.registration_start_date as registrationStartDate, c.registration_end_date as registrationEndDate,
        c.status, c.banner_url as bannerUrl, u.name as coordinatorName,
        (SELECT COUNT(*) FROM club_registrations WHERE club_id = c.id AND student_id = ?) as isRegistered
      FROM clubs c
      LEFT JOIN users u ON c.coordinator_id = u.id
      ORDER BY c.created_at DESC
    `, [studentId]);

    const events = queryAll(`
      SELECT 
        e.id, e.club_id as clubId, cl.name as clubName,
        e.title, e.description, e.event_date as eventDate, e.event_time as eventTime,
        e.venue, e.registration_start_date as registrationStartDate, e.registration_last_date as registrationLastDate,
        e.status, e.banner_url as bannerUrl, u.name as coordinatorName,
        (SELECT COUNT(*) FROM event_registrations WHERE event_id = e.id AND student_id = ?) as isRegistered
      FROM club_events e
      LEFT JOIN clubs cl ON e.club_id = cl.id
      LEFT JOIN users u ON e.coordinator_id = u.id
      ORDER BY e.event_date ASC
    `, [studentId]);

    // Dynamic Club Status Computation
    const formattedClubs = clubs.map(club => {
      let currentStatus = club.status;
      if (club.status === 'Inactive') {
        currentStatus = 'Inactive';
      } else if (club.availableSeats <= 0) {
        currentStatus = 'Seats Full';
      } else if (club.registrationEndDate && todayStr > club.registrationEndDate) {
        currentStatus = 'Registration Closed';
      } else if (club.registrationStartDate && todayStr < club.registrationStartDate) {
        currentStatus = 'Registration Not Started';
      } else if (club.status !== 'Inactive') {
        currentStatus = 'Registration Open';
      }
      return {
        ...club,
        status: currentStatus,
        isRegistered: !!club.isRegistered
      };
    });

    // Dynamic Event Status Computation
    const formattedEvents = events.map(ev => {
      let currentStatus = ev.status;
      if (ev.status === 'Cancelled') {
        currentStatus = 'Event Cancelled';
      } else if (ev.registrationLastDate && todayStr > ev.registrationLastDate) {
        currentStatus = 'Registration Closed';
      } else if (ev.registrationStartDate && todayStr < ev.registrationStartDate) {
        currentStatus = 'Registration Not Started';
      } else if (ev.status !== 'Cancelled') {
        currentStatus = 'Registration Open';
      }
      return {
        ...ev,
        status: currentStatus,
        isRegistered: !!ev.isRegistered
      };
    });

    res.status(200).json({
      success: true,
      clubs: formattedClubs,
      events: formattedEvents
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Register for a Club (Enforces Limited Seats, Registration Dates, Uniqueness & Active State)
 * POST /api/student/clubs/:id/register
 */
export async function registerClub(req, res, next) {
  try {
    const { id } = req.params;
    const student = req.user;
    const todayStr = new Date().toISOString().split('T')[0];

    const club = queryOne('SELECT * FROM clubs WHERE id = ?', [id]);
    if (!club) {
      return res.status(404).json({ success: false, message: 'Club not found' });
    }

    if (club.status === 'Inactive') {
      return res.status(400).json({ success: false, message: 'This club is currently inactive and not accepting registrations.' });
    }

    const existing = queryOne('SELECT id FROM club_registrations WHERE club_id = ? AND student_id = ?', [id, student.id]);
    if (existing) {
      return res.status(400).json({ success: false, message: 'You have already joined this club' });
    }

    if (club.registration_start_date && todayStr < club.registration_start_date) {
      return res.status(400).json({ success: false, message: 'Registration has not started yet for this club.' });
    }

    if (club.registration_end_date && todayStr > club.registration_end_date) {
      return res.status(400).json({ success: false, message: 'Registration Closed: Deadline for this club has passed.' });
    }

    if (club.available_seats <= 0) {
      return res.status(400).json({ success: false, message: 'Seats Full: Cannot accept any new registrations.' });
    }

    const regId = `cr_${crypto.randomBytes(6).toString('hex')}`;
    execute(`
      INSERT INTO club_registrations (
        id, club_id, student_id, student_name, student_email, roll_number, department, year, division
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [regId, id, student.id, student.name, student.email, student.rollNumber || null, student.department, student.year, student.division]);

    const newAvailable = Math.max(0, club.available_seats - 1);
    const newStatus = newAvailable === 0 ? 'Seats Full' : club.status;
    execute('UPDATE clubs SET available_seats = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [newAvailable, newStatus, id]);

    // Send notification to Club Coordinator
    if (club.coordinator_id) {
      const notifId = `notif_${crypto.randomBytes(6).toString('hex')}`;
      execute(`
        INSERT INTO notifications (id, user_id, target_role, type, title, message, link)
        VALUES (?, ?, 'FACULTY', 'CLUB_REG', 'New Club Member', ?, '/faculty/clubs-events')
      `, [notifId, club.coordinator_id, `${student.name} joined ${club.name}. Remaining seats: ${newAvailable}`]);
    }

    // Send confirmation notification to Student
    const stuNotifId = `notif_${crypto.randomBytes(6).toString('hex')}`;
    execute(`
      INSERT INTO notifications (id, user_id, target_role, type, title, message, link)
      VALUES (?, ?, 'STUDENT', 'CLUB_REG', 'Club Registration Confirmed', ?, '/student/registrations')
    `, [stuNotifId, student.id, `You have successfully joined ${club.name}!`]);

    res.status(200).json({
      success: true,
      message: `Successfully joined ${club.name}!`,
      availableSeats: newAvailable
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Register for an Event (Enforces Registration Deadline, Active State & Uniqueness)
 * POST /api/student/events/:id/register
 */
export async function registerEvent(req, res, next) {
  try {
    const { id } = req.params;
    const student = req.user;
    const todayStr = new Date().toISOString().split('T')[0];

    const event = queryOne('SELECT * FROM club_events WHERE id = ?', [id]);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    if (event.status === 'Cancelled') {
      return res.status(400).json({ success: false, message: 'Cannot register: This event has been cancelled.' });
    }

    const existing = queryOne('SELECT id FROM event_registrations WHERE event_id = ? AND student_id = ?', [id, student.id]);
    if (existing) {
      return res.status(400).json({ success: false, message: 'You are already registered for this event' });
    }

    if (event.registration_start_date && todayStr < event.registration_start_date) {
      return res.status(400).json({ success: false, message: 'Registration has not started yet for this event.' });
    }

    if (event.registration_last_date && todayStr > event.registration_last_date) {
      return res.status(400).json({ success: false, message: 'Registration Closed: The registration deadline has passed.' });
    }

    const regId = `er_${crypto.randomBytes(6).toString('hex')}`;
    execute(`
      INSERT INTO event_registrations (
        id, event_id, student_id, student_name, student_email, roll_number, department, year, division
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [regId, id, student.id, student.name, student.email, student.rollNumber || null, student.department, student.year, student.division]);

    // Send confirmation notification to Student
    const notifId = `notif_${crypto.randomBytes(6).toString('hex')}`;
    execute(`
      INSERT INTO notifications (id, user_id, target_role, type, title, message, link)
      VALUES (?, ?, 'STUDENT', 'EVENT_REG', 'Event Registration Confirmed', ?, '/student/registrations')
    `, [notifId, student.id, `You have successfully registered for ${event.title} on ${event.event_date}.`]);

    res.status(200).json({
      success: true,
      message: `Successfully registered for ${event.title}`
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get Authenticated Student's My Registrations (Clubs & Events)
 * GET /api/student/registrations
 */
export async function getStudentRegistrations(req, res, next) {
  try {
    const studentId = req.user.id;

    const myClubs = queryAll(`
      SELECT 
        cr.id, cr.club_id as clubId, c.name as clubName, c.category, c.description,
        c.status as clubStatus, c.banner_url as bannerUrl,
        u.name as coordinatorName, u.email as coordinatorEmail,
        cr.registered_at as registeredAt, cr.status as registrationStatus
      FROM club_registrations cr
      JOIN clubs c ON cr.club_id = c.id
      LEFT JOIN users u ON c.coordinator_id = u.id
      WHERE cr.student_id = ?
      ORDER BY cr.registered_at DESC
    `, [studentId]);

    const myEvents = queryAll(`
      SELECT 
        er.id, er.event_id as eventId, e.title as eventName, e.description,
        e.event_date as eventDate, e.event_time as eventTime, e.venue,
        e.status as eventStatus, e.banner_url as bannerUrl,
        u.name as coordinatorName, u.email as coordinatorEmail,
        er.registered_at as registeredAt
      FROM event_registrations er
      JOIN club_events e ON er.event_id = e.id
      LEFT JOIN users u ON e.coordinator_id = u.id
      WHERE er.student_id = ?
      ORDER BY e.event_date ASC
    `, [studentId]);

    res.status(200).json({
      success: true,
      myClubs,
      myEvents
    });
  } catch (error) {
    next(error);
  }
}

// ============================================================================
// 5. CAMPUS LOST & FOUND HUB (Part 6)
// ============================================================================

/**
 * Browse Active Lost & Found Items
 * GET /api/student/lost-found
 */
export async function getLostFoundItems(req, res, next) {
  try {
    const { search, category, type, location, date } = req.query;

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

    if (location) {
      sql += ' AND location LIKE ?';
      params.push(`%${location}%`);
    }

    if (date) {
      sql += ' AND date = ?';
      params.push(date);
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
 * Get Lost & Found Item Details
 * GET /api/student/lost-found/:id
 */
export async function getLostFoundItemById(req, res, next) {
  try {
    const { id } = req.params;
    const item = queryOne(`
      SELECT 
        id, user_id as userId, user_name as userName, user_email as userEmail, user_role as userRole,
        type, item_name as itemName, category, description, location, date, photo_url as photoUrl,
        status, created_at as createdAt, returned_at as returnedAt
      FROM lost_found_items
      WHERE id = ?
    `, [id]);

    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }

    res.status(200).json({ success: true, item });
  } catch (error) {
    next(error);
  }
}

/**
 * Report Lost or Found Item
 * POST /api/student/lost-found
 */
export async function createLostFoundReport(req, res, next) {
  try {
    const { type, itemName, category, description, location, date, photoUrl } = req.body;
    const user = req.user;

    if (!type || !itemName || !category || !description || !location || !date) {
      return res.status(400).json({
        success: false,
        message: 'Type (LOST/FOUND), Item Name, Category, Description, Location, and Date are required'
      });
    }

    if (!['LOST', 'FOUND'].includes(type.toUpperCase())) {
      return res.status(400).json({ success: false, message: 'Type must be LOST or FOUND' });
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

    // Send confirmation notification
    const notifId = `notif_${crypto.randomBytes(6).toString('hex')}`;
    execute(`
      INSERT INTO notifications (id, user_id, target_role, type, title, message, link)
      VALUES (?, ?, ?, 'LOST_FOUND', 'Lost & Found Report Submitted', ?, '/student/lost-found')
    `, [notifId, user.id, user.role, `Your ${cleanType.toLowerCase()} item report for "${itemName}" has been posted.`]);

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
 * Get User's Own Lost & Found Reports
 * GET /api/student/lost-found/my-reports
 */
export async function getMyLostFoundReports(req, res, next) {
  try {
    const userId = req.user.id;
    const reports = queryAll(`
      SELECT 
        id, user_id as userId, user_name as userName, user_email as userEmail, user_role as userRole,
        type, item_name as itemName, category, description, location, date, photo_url as photoUrl,
        status, created_at as createdAt, returned_at as returnedAt
      FROM lost_found_items
      WHERE user_id = ?
      ORDER BY created_at DESC
    `, [userId]);

    res.status(200).json({ success: true, reports });
  } catch (error) {
    next(error);
  }
}

/**
 * Edit Own Lost & Found Report
 * PUT /api/student/lost-found/:id
 */
export async function updateLostFoundReport(req, res, next) {
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
 * Delete Own Lost & Found Report
 * DELETE /api/student/lost-found/:id
 */
export async function deleteLostFoundReport(req, res, next) {
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
 * Mark Own Item As Returned
 * PUT /api/student/lost-found/:id/return
 */
export async function markLostFoundReturned(req, res, next) {
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
      message: 'Item marked as returned! It is now archived in Returned History.'
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get Campus Returned History
 * GET /api/student/lost-found/returned-history
 */
export async function getReturnedHistory(req, res, next) {
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

// ============================================================================
// 6. NOTIFICATIONS (Student Center)
// ============================================================================

/**
 * Get Student Notifications
 * GET /api/student/notifications
 */
export async function getStudentNotifications(req, res, next) {
  try {
    const studentId = req.user.id;

    const notifications = queryAll(`
      SELECT 
        id, user_id as userId, target_role as targetRole, type,
        title, message, is_read as isRead, link, created_at as createdAt
      FROM notifications
      WHERE user_id = ? OR target_role IN ('STUDENT', 'ALL')
      ORDER BY created_at DESC
    `, [studentId]);

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
 * Mark Student Notification Read
 * PUT /api/student/notifications/:id/read
 */
export async function markStudentNotificationRead(req, res, next) {
  try {
    const { id } = req.params;
    execute('UPDATE notifications SET is_read = 1 WHERE id = ?', [id]);
    res.status(200).json({ success: true, message: 'Notification marked as read' });
  } catch (error) {
    next(error);
  }
}

/**
 * Mark All Student Notifications Read
 * PUT /api/student/notifications/mark-all-read
 */
export async function markAllStudentNotificationsRead(req, res, next) {
  try {
    execute("UPDATE notifications SET is_read = 1 WHERE user_id = ? OR target_role IN ('STUDENT', 'ALL')", [req.user.id]);
    res.status(200).json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    next(error);
  }
}

