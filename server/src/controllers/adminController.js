import bcrypt from 'bcryptjs';
import { db, queryAll, queryOne, execute } from '../config/db.js';
import { getFacultyRealtimeStatus, getClassroomRealtimeStatus, timeToMinutes } from '../utils/timetableHelper.js';
import { ROLES, USER_STATUS, CLASSROOM_STATUS, CLASSROOM_TYPES, ACADEMIC_YEARS, DIVISIONS, DEPARTMENTS } from '../config/constants.js';

// Helper: Generate unique IDs
function generateId(prefix = 'id') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
}

// Helper: Validate email format
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email?.trim() || '');
}

/**
 * Admin Dashboard Stats
 * GET /api/admin/dashboard-stats
 */
export async function getAdminDashboardStats(req, res, next) {
  try {
    const totalStudents = queryOne('SELECT COUNT(*) as count FROM users WHERE role = ?', [ROLES.STUDENT])?.count || 0;
    const totalFaculty = queryOne('SELECT COUNT(*) as count FROM users WHERE role = ?', [ROLES.FACULTY])?.count || 0;
    const totalClassrooms = queryOne('SELECT COUNT(*) as count FROM classrooms')?.count || 0;
    const totalActiveRooms = queryOne('SELECT COUNT(*) as count FROM classrooms WHERE status = ?', [CLASSROOM_STATUS.ACTIVE])?.count || 0;
    // Dynamic active departments count from database
    const totalDepartments = queryOne("SELECT COUNT(*) as count FROM departments WHERE status = 'Active'")?.count || 0;
    const totalAllDepartments = queryOne('SELECT COUNT(*) as count FROM departments')?.count || 0;
    const totalClasses = queryOne('SELECT COUNT(*) as count FROM classes')?.count || 0;
    const totalTimetableSlots = queryOne('SELECT COUNT(*) as count FROM timetables')?.count || 0;

    // Recently added students (limit 5)
    const recentStudents = queryAll(`
      SELECT id, name, email, department, year, division, roll_number as rollNumber, status, created_at as createdAt
      FROM users 
      WHERE role = ?
      ORDER BY datetime(created_at) DESC, id DESC
      LIMIT 5
    `, [ROLES.STUDENT]);

    // Recently added faculty (limit 5)
    const rawFaculty = queryAll(`
      SELECT id, name, email, department, assigned_subjects, assigned_classes, status, created_at as createdAt
      FROM users 
      WHERE role = ?
      ORDER BY datetime(created_at) DESC, id DESC
      LIMIT 5
    `, [ROLES.FACULTY]);

    const recentFaculty = rawFaculty.map(f => {
      let assignedSubjects = [];
      let assignedClasses = [];
      try {
        if (f.assigned_subjects) assignedSubjects = JSON.parse(f.assigned_subjects);
        if (f.assigned_classes) assignedClasses = JSON.parse(f.assigned_classes);
      } catch (e) {
        // fallback
      }
      return {
        id: f.id,
        name: f.name,
        email: f.email,
        department: f.department,
        assignedSubjects,
        assignedClasses,
        status: f.status,
        createdAt: f.createdAt
      };
    });

    // Classroom Occupancy Summary
    const capacitySum = queryOne('SELECT SUM(capacity) as totalCapacity, AVG(capacity) as avgCapacity FROM classrooms WHERE status = ?', [CLASSROOM_STATUS.ACTIVE]);
    const classroomsByType = queryAll(`
      SELECT classroom_type as type, COUNT(*) as count 
      FROM classrooms 
      GROUP BY classroom_type
    `);

    res.status(200).json({
      success: true,
      stats: {
        totalStudents,
        totalFaculty,
        totalClassrooms,
        totalActiveRooms,
        totalDepartments,
        totalClasses,
        totalTimetableSlots,
        totalCapacity: capacitySum?.totalCapacity || 0,
        avgCapacity: Math.round(capacitySum?.avgCapacity || 0),
        systemStatus: 'Operational',
        academicTerm: 'Fall 2026 / Spring 2027',
        databaseEngine: 'SQLite WAL Mode'
      },
      classroomsByType,
      recentStudents,
      recentFaculty
    });
  } catch (error) {
    next(error);
  }
}

// ============================================================================
// STUDENT MANAGEMENT
// ============================================================================

export async function getStudents(req, res, next) {
  try {
    const { q, department, year, division, status } = req.query;

    let sql = `
      SELECT id, name, email, role, department, year, division, roll_number as rollNumber, status, created_at as createdAt, updated_at as updatedAt
      FROM users
      WHERE role = '${ROLES.STUDENT}'
    `;
    const params = [];

    if (q && q.trim()) {
      sql += ` AND (LOWER(name) LIKE ? OR LOWER(email) LIKE ? OR LOWER(roll_number) LIKE ?)`;
      const term = `%${q.trim().toLowerCase()}%`;
      params.push(term, term, term);
    }

    if (department && department.trim() && department !== 'ALL') {
      sql += ` AND department = ?`;
      params.push(department.trim());
    }

    if (year && year.trim() && year !== 'ALL') {
      sql += ` AND year = ?`;
      params.push(year.trim());
    }

    if (division && division.trim() && division !== 'ALL') {
      sql += ` AND division = ?`;
      params.push(division.trim());
    }

    if (status && status.trim() && status !== 'ALL') {
      sql += ` AND status = ?`;
      params.push(status.trim().toUpperCase());
    }

    sql += ` ORDER BY datetime(created_at) DESC, name ASC`;

    const students = queryAll(sql, params);

    res.status(200).json({
      success: true,
      count: students.length,
      students
    });
  } catch (error) {
    next(error);
  }
}

export async function createStudent(req, res, next) {
  try {
    const { name, email, password, department, year, division, rollNumber, status = USER_STATUS.ACTIVE } = req.body;

    if (!name || !name.trim()) return res.status(400).json({ success: false, message: 'Student name is required.' });
    if (!email || !email.trim()) return res.status(400).json({ success: false, message: 'College email is required.' });
    if (!isValidEmail(email)) return res.status(400).json({ success: false, message: 'Please provide a valid college email format.' });
    if (!password || password.length < 6) return res.status(400).json({ success: false, message: 'Temporary password is required (minimum 6 characters).' });
    if (!department || !department.trim()) return res.status(400).json({ success: false, message: 'Department is required.' });
    if (!year || !year.trim()) return res.status(400).json({ success: false, message: 'Academic year is required (e.g. SE, TE, BE).' });
    if (!division || !division.trim()) return res.status(400).json({ success: false, message: 'Division is required (e.g. A, B, C).' });
    if (!rollNumber || !rollNumber.toString().trim()) return res.status(400).json({ success: false, message: 'Roll number is required.' });

    const cleanEmail = email.trim().toLowerCase();
    const cleanRoll = rollNumber.toString().trim();

    const existingEmail = queryOne('SELECT id FROM users WHERE LOWER(email) = ?', [cleanEmail]);
    if (existingEmail) {
      return res.status(400).json({ success: false, message: `An account with email '${cleanEmail}' already exists.` });
    }

    const existingRoll = queryOne('SELECT id FROM users WHERE role = ? AND department = ? AND year = ? AND division = ? AND roll_number = ?', [
      ROLES.STUDENT,
      department.trim(),
      year.trim(),
      division.trim(),
      cleanRoll
    ]);
    if (existingRoll) {
      return res.status(400).json({
        success: false,
        message: `Roll number '${cleanRoll}' already exists in ${department} (${year}-${division}).`
      });
    }

    const password_hash = await bcrypt.hash(password.trim(), 10);
    const id = generateId('usr_stu');

    execute(`
      INSERT INTO users (
        id, name, email, password_hash, role, department, year, division, roll_number, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `, [
      id,
      name.trim(),
      cleanEmail,
      password_hash,
      ROLES.STUDENT,
      department.trim(),
      year.trim(),
      division.trim().toUpperCase(),
      cleanRoll,
      status ? status.trim().toUpperCase() : USER_STATUS.ACTIVE
    ]);

    const created = queryOne(`
      SELECT id, name, email, role, department, year, division, roll_number as rollNumber, status, created_at as createdAt
      FROM users WHERE id = ?
    `, [id]);

    // Admin System Notification
    const notifId = generateId('notif_adm_stu');
    execute(`
      INSERT INTO notifications (id, user_id, target_role, type, title, message, is_read, link, created_at)
      VALUES (?, NULL, 'ADMIN', 'NEW_STUDENT', 'New Student Enrollment', ?, 0, '/admin/students', CURRENT_TIMESTAMP)
    `, [notifId, `${name.trim()} enrolled in ${department.trim()} (${year.trim()}-${division.trim().toUpperCase()}).`]);

    res.status(201).json({
      success: true,
      message: `Student '${name.trim()}' successfully enrolled!`,
      student: created
    });
  } catch (error) {
    next(error);
  }
}

export async function updateStudent(req, res, next) {
  try {
    const { id } = req.params;
    const { name, email, password, department, year, division, rollNumber, status } = req.body;

    const student = queryOne('SELECT * FROM users WHERE id = ? AND role = ?', [id, ROLES.STUDENT]);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student record not found.' });
    }

    if (!name || !name.trim()) return res.status(400).json({ success: false, message: 'Student name is required.' });
    if (!email || !email.trim()) return res.status(400).json({ success: false, message: 'College email is required.' });
    if (!isValidEmail(email)) return res.status(400).json({ success: false, message: 'Invalid email format.' });

    const cleanEmail = email.trim().toLowerCase();
    const cleanRoll = (rollNumber || student.roll_number).toString().trim();

    const duplicateEmail = queryOne('SELECT id FROM users WHERE LOWER(email) = ? AND id != ?', [cleanEmail, id]);
    if (duplicateEmail) {
      return res.status(400).json({ success: false, message: `Email '${cleanEmail}' is already in use by another account.` });
    }

    const duplicateRoll = queryOne(
      'SELECT id FROM users WHERE role = ? AND department = ? AND year = ? AND division = ? AND roll_number = ? AND id != ?',
      [ROLES.STUDENT, department || student.department, year || student.year, division || student.division, cleanRoll, id]
    );
    if (duplicateRoll) {
      return res.status(400).json({
        success: false,
        message: `Roll number '${cleanRoll}' is already assigned in ${department || student.department} (${(year || student.year)}-${(division || student.division)}).`
      });
    }

    let passwordHash = student.password_hash;
    if (password && password.trim().length >= 6) {
      passwordHash = await bcrypt.hash(password.trim(), 10);
    }

    execute(`
      UPDATE users SET 
        name = ?,
        email = ?,
        password_hash = ?,
        department = ?,
        year = ?,
        division = ?,
        roll_number = ?,
        status = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [
      name.trim(),
      cleanEmail,
      passwordHash,
      department ? department.trim() : student.department,
      year ? year.trim() : student.year,
      division ? division.trim().toUpperCase() : student.division,
      cleanRoll,
      status ? status.trim().toUpperCase() : student.status,
      id
    ]);

    const updated = queryOne(`
      SELECT id, name, email, role, department, year, division, roll_number as rollNumber, status, created_at as createdAt, updated_at as updatedAt
      FROM users WHERE id = ?
    `, [id]);

    res.status(200).json({
      success: true,
      message: `Student '${name.trim()}' updated successfully.`,
      student: updated
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteStudent(req, res, next) {
  try {
    const { id } = req.params;
    const student = queryOne('SELECT id, name FROM users WHERE id = ? AND role = ?', [id, ROLES.STUDENT]);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student record not found.' });
    }

    execute('DELETE FROM users WHERE id = ?', [id]);

    res.status(200).json({
      success: true,
      message: `Student '${student.name}' has been deleted successfully.`
    });
  } catch (error) {
    next(error);
  }
}

// ============================================================================
// FACULTY MANAGEMENT
// ============================================================================

export async function getFaculty(req, res, next) {
  try {
    const { q, department, status, lectureStatus } = req.query;

    let sql = `
      SELECT id, name, email, role, department, assigned_subjects, assigned_classes, status, created_at as createdAt, updated_at as updatedAt
      FROM users
      WHERE role = '${ROLES.FACULTY}'
    `;
    const params = [];

    if (q && q.trim()) {
      sql += ` AND (LOWER(name) LIKE ? OR LOWER(email) LIKE ?)`;
      const term = `%${q.trim().toLowerCase()}%`;
      params.push(term, term);
    }

    if (department && department.trim() && department !== 'ALL') {
      sql += ` AND department = ?`;
      params.push(department.trim());
    }

    if (status && status.trim() && status !== 'ALL') {
      sql += ` AND status = ?`;
      params.push(status.trim().toUpperCase());
    }

    sql += ` ORDER BY datetime(created_at) DESC, name ASC`;

    const rawFaculty = queryAll(sql, params);

    let faculty = rawFaculty.map(f => {
      let assignedSubjects = [];
      let assignedClasses = [];
      try {
        if (f.assigned_subjects) assignedSubjects = JSON.parse(f.assigned_subjects);
        if (f.assigned_classes) assignedClasses = JSON.parse(f.assigned_classes);
      } catch (e) {
        // ignore
      }

      // Calculate real-time lecture status from official timetable
      const realtime = getFacultyRealtimeStatus(f.id);

      return {
        id: f.id,
        name: f.name,
        email: f.email,
        role: f.role,
        department: f.department,
        assignedSubjects: Array.isArray(assignedSubjects) ? assignedSubjects : [],
        assignedClasses: Array.isArray(assignedClasses) ? assignedClasses : [],
        status: f.status, // Account Status: ACTIVE / SUSPENDED / INACTIVE
        lectureStatus: realtime.lectureStatus, // Lecture Status: ACTIVE / INACTIVE
        currentActivity: realtime.currentActivity,
        upcomingActivity: realtime.upcomingActivity,
        createdAt: f.createdAt,
        updatedAt: f.updatedAt
      };
    });

    if (lectureStatus && lectureStatus.trim() && lectureStatus !== 'ALL') {
      faculty = faculty.filter(f => f.lectureStatus === lectureStatus.trim().toUpperCase());
    }

    res.status(200).json({
      success: true,
      count: faculty.length,
      faculty
    });
  } catch (error) {
    next(error);
  }
}

export async function createFaculty(req, res, next) {
  try {
    const { name, email, password, department, assignedSubjects = [], assignedClasses = [], status = USER_STATUS.ACTIVE } = req.body;

    if (!name || !name.trim()) return res.status(400).json({ success: false, message: 'Faculty name is required.' });
    if (!email || !email.trim()) return res.status(400).json({ success: false, message: 'College email is required.' });
    if (!isValidEmail(email)) return res.status(400).json({ success: false, message: 'Invalid email format.' });
    if (!password || password.length < 6) return res.status(400).json({ success: false, message: 'Temporary password is required (minimum 6 characters).' });
    if (!department || !department.trim()) return res.status(400).json({ success: false, message: 'Department is required.' });

    const cleanEmail = email.trim().toLowerCase();

    const existing = queryOne('SELECT id FROM users WHERE LOWER(email) = ?', [cleanEmail]);
    if (existing) {
      return res.status(400).json({ success: false, message: `Account with email '${cleanEmail}' already exists.` });
    }

    const password_hash = await bcrypt.hash(password.trim(), 10);
    const id = generateId('usr_fac');

    const subjectsArr = Array.isArray(assignedSubjects) ? assignedSubjects : (assignedSubjects ? [assignedSubjects] : []);
    const classesArr = Array.isArray(assignedClasses) ? assignedClasses : (assignedClasses ? [assignedClasses] : []);

    execute(`
      INSERT INTO users (
        id, name, email, password_hash, role, department, status, assigned_subjects, assigned_classes, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `, [
      id,
      name.trim(),
      cleanEmail,
      password_hash,
      ROLES.FACULTY,
      department.trim(),
      status ? status.trim().toUpperCase() : USER_STATUS.ACTIVE,
      JSON.stringify(subjectsArr),
      JSON.stringify(classesArr)
    ]);

    // Admin System Notification
    const notifId = generateId('notif_adm_fac');
    execute(`
      INSERT INTO notifications (id, user_id, target_role, type, title, message, is_read, link, created_at)
      VALUES (?, NULL, 'ADMIN', 'NEW_FACULTY', 'New Faculty Appointed', ?, 0, '/admin/faculty', CURRENT_TIMESTAMP)
    `, [notifId, `${name.trim()} appointed to ${department.trim()} department.`]);

    res.status(201).json({
      success: true,
      message: `Faculty member '${name.trim()}' successfully registered!`,
      faculty: {
        id,
        name: name.trim(),
        email: cleanEmail,
        role: ROLES.FACULTY,
        department: department.trim(),
        assignedSubjects: subjectsArr,
        assignedClasses: classesArr,
        status: status || USER_STATUS.ACTIVE
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function updateFaculty(req, res, next) {
  try {
    const { id } = req.params;
    const { name, email, password, department, assignedSubjects, assignedClasses, status } = req.body;

    const faculty = queryOne('SELECT * FROM users WHERE id = ? AND role = ?', [id, ROLES.FACULTY]);
    if (!faculty) {
      return res.status(404).json({ success: false, message: 'Faculty record not found.' });
    }

    if (!name || !name.trim()) return res.status(400).json({ success: false, message: 'Faculty name is required.' });
    if (!email || !email.trim()) return res.status(400).json({ success: false, message: 'College email is required.' });
    if (!isValidEmail(email)) return res.status(400).json({ success: false, message: 'Invalid email format.' });

    const cleanEmail = email.trim().toLowerCase();
    const duplicate = queryOne('SELECT id FROM users WHERE LOWER(email) = ? AND id != ?', [cleanEmail, id]);
    if (duplicate) {
      return res.status(400).json({ success: false, message: `Email '${cleanEmail}' is in use by another user.` });
    }

    let passwordHash = faculty.password_hash;
    if (password && password.trim().length >= 6) {
      passwordHash = await bcrypt.hash(password.trim(), 10);
    }

    const subjectsArr = assignedSubjects !== undefined ? (Array.isArray(assignedSubjects) ? assignedSubjects : [assignedSubjects]) : JSON.parse(faculty.assigned_subjects || '[]');
    const classesArr = assignedClasses !== undefined ? (Array.isArray(assignedClasses) ? assignedClasses : [assignedClasses]) : JSON.parse(faculty.assigned_classes || '[]');

    execute(`
      UPDATE users SET
        name = ?,
        email = ?,
        password_hash = ?,
        department = ?,
        status = ?,
        assigned_subjects = ?,
        assigned_classes = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [
      name.trim(),
      cleanEmail,
      passwordHash,
      department ? department.trim() : faculty.department,
      status ? status.trim().toUpperCase() : faculty.status,
      JSON.stringify(subjectsArr),
      JSON.stringify(classesArr),
      id
    ]);

    res.status(200).json({
      success: true,
      message: `Faculty '${name.trim()}' updated successfully.`,
      faculty: {
        id,
        name: name.trim(),
        email: cleanEmail,
        role: ROLES.FACULTY,
        department: department ? department.trim() : faculty.department,
        assignedSubjects: subjectsArr,
        assignedClasses: classesArr,
        status: status || faculty.status
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteFaculty(req, res, next) {
  try {
    const { id } = req.params;
    const faculty = queryOne('SELECT id, name FROM users WHERE id = ? AND role = ?', [id, ROLES.FACULTY]);
    if (!faculty) {
      return res.status(404).json({ success: false, message: 'Faculty record not found.' });
    }

    execute('DELETE FROM users WHERE id = ?', [id]);

    res.status(200).json({
      success: true,
      message: `Faculty member '${faculty.name}' deleted successfully.`
    });
  } catch (error) {
    next(error);
  }
}

// ============================================================================
// CLASSROOM MANAGEMENT
// ============================================================================

export async function getClassrooms(req, res, next) {
  try {
    const { q, type, status, lectureStatus, availability } = req.query;

    let sql = `
      SELECT id, room_number as roomNumber, classroom_type as classroomType, building, floor, capacity, status, has_projector as hasProjector, is_available as isAvailable, created_at as createdAt, updated_at as updatedAt
      FROM classrooms
      WHERE 1=1
    `;
    const params = [];

    if (q && q.trim()) {
      sql += ` AND (LOWER(room_number) LIKE ? OR LOWER(building) LIKE ? OR LOWER(floor) LIKE ?)`;
      const term = `%${q.trim().toLowerCase()}%`;
      params.push(term, term, term);
    }

    if (type && type.trim() && type !== 'ALL') {
      sql += ` AND classroom_type = ?`;
      params.push(type.trim());
    }

    if (status && status.trim() && status !== 'ALL') {
      sql += ` AND status = ?`;
      params.push(status.trim());
    }

    sql += ` ORDER BY room_number ASC`;

    const rawClassrooms = queryAll(sql, params);

    let classrooms = rawClassrooms.map(room => {
      // Real-time classroom activity from official timetable
      const realtime = getClassroomRealtimeStatus(room.id);

      return {
        ...room,
        // Administrative status remains unchanged (room.status)
        currentLectureStatus: realtime.currentLectureStatus, // 'ACTIVE' | 'INACTIVE'
        availabilityStatus: realtime.availabilityStatus,     // 'OCCUPIED' | 'AVAILABLE'
        currentActivity: realtime.currentActivity,
        upcomingActivity: realtime.upcomingActivity
      };
    });

    if (lectureStatus && lectureStatus.trim() && lectureStatus !== 'ALL') {
      classrooms = classrooms.filter(c => c.currentLectureStatus === lectureStatus.trim().toUpperCase());
    }

    if (availability && availability.trim() && availability !== 'ALL') {
      classrooms = classrooms.filter(c => c.availabilityStatus === availability.trim().toUpperCase());
    }

    res.status(200).json({
      success: true,
      count: classrooms.length,
      classrooms
    });
  } catch (error) {
    next(error);
  }
}

export async function createClassroom(req, res, next) {
  try {
    const { roomNumber, classroomType = 'Classroom', building, floor = '1st Floor', capacity, status = CLASSROOM_STATUS.ACTIVE, hasProjector = 1 } = req.body;

    if (!roomNumber || !roomNumber.trim()) return res.status(400).json({ success: false, message: 'Room number is required (e.g. Room 301).' });
    if (!building || !building.trim()) return res.status(400).json({ success: false, message: 'Building / Block is required.' });
    if (!capacity || isNaN(capacity) || Number(capacity) <= 0) return res.status(400).json({ success: false, message: 'A valid numeric seating capacity is required.' });

    const cleanRoomNumber = roomNumber.trim();

    const existing = queryOne('SELECT id FROM classrooms WHERE LOWER(room_number) = ?', [cleanRoomNumber.toLowerCase()]);
    if (existing) {
      return res.status(400).json({
        success: false,
        message: `Classroom '${cleanRoomNumber}' already exists in database. Duplicate room numbers are not allowed.`
      });
    }

    const id = generateId('crm');

    execute(`
      INSERT INTO classrooms (
        id, room_number, classroom_type, building, floor, capacity, status, has_projector, is_available, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `, [
      id,
      cleanRoomNumber,
      classroomType || 'Classroom',
      building.trim(),
      floor || '1st Floor',
      Number(capacity),
      status || CLASSROOM_STATUS.ACTIVE,
      hasProjector ? 1 : 0,
      status === CLASSROOM_STATUS.ACTIVE ? 1 : 0
    ]);

    const created = queryOne(`
      SELECT id, room_number as roomNumber, classroom_type as classroomType, building, floor, capacity, status, has_projector as hasProjector, is_available as isAvailable, created_at as createdAt
      FROM classrooms WHERE id = ?
    `, [id]);

    res.status(201).json({
      success: true,
      message: `Classroom '${cleanRoomNumber}' created successfully!`,
      classroom: created
    });
  } catch (error) {
    next(error);
  }
}

export async function updateClassroom(req, res, next) {
  try {
    const { id } = req.params;
    const { roomNumber, classroomType, building, floor, capacity, status, hasProjector } = req.body;

    const classroom = queryOne('SELECT * FROM classrooms WHERE id = ?', [id]);
    if (!classroom) {
      return res.status(404).json({ success: false, message: 'Classroom not found.' });
    }

    if (!roomNumber || !roomNumber.trim()) {
      return res.status(400).json({ success: false, message: 'Room number is required.' });
    }

    const cleanRoomNumber = roomNumber.trim();
    const duplicate = queryOne('SELECT id FROM classrooms WHERE LOWER(room_number) = ? AND id != ?', [cleanRoomNumber.toLowerCase(), id]);
    if (duplicate) {
      return res.status(400).json({ success: false, message: `Room number '${cleanRoomNumber}' already exists.` });
    }

    execute(`
      UPDATE classrooms SET
        room_number = ?,
        classroom_type = ?,
        building = ?,
        floor = ?,
        capacity = ?,
        status = ?,
        has_projector = ?,
        is_available = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [
      cleanRoomNumber,
      classroomType || classroom.classroom_type,
      building ? building.trim() : classroom.building,
      floor || classroom.floor,
      capacity ? Number(capacity) : classroom.capacity,
      status || classroom.status,
      hasProjector !== undefined ? (hasProjector ? 1 : 0) : classroom.has_projector,
      (status || classroom.status) === CLASSROOM_STATUS.ACTIVE ? 1 : 0,
      id
    ]);

    const updated = queryOne(`
      SELECT id, room_number as roomNumber, classroom_type as classroomType, building, floor, capacity, status, has_projector as hasProjector, is_available as isAvailable, updated_at as updatedAt
      FROM classrooms WHERE id = ?
    `, [id]);

    res.status(200).json({
      success: true,
      message: `Classroom '${cleanRoomNumber}' updated successfully.`,
      classroom: updated
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteClassroom(req, res, next) {
  try {
    const { id } = req.params;
    const room = queryOne('SELECT id, room_number FROM classrooms WHERE id = ?', [id]);
    if (!room) {
      return res.status(404).json({ success: false, message: 'Classroom not found.' });
    }

    execute('DELETE FROM classrooms WHERE id = ?', [id]);

    res.status(200).json({
      success: true,
      message: `Classroom '${room.room_number}' deleted successfully.`
    });
  } catch (error) {
    next(error);
  }
}

// ============================================================================
// CLASS / SECTION MANAGEMENT
// ============================================================================

export async function getClasses(req, res, next) {
  try {
    const classes = queryAll(`
      SELECT 
        c.id, 
        c.department, 
        c.year, 
        c.division, 
        c.class_teacher_id as classTeacherId,
        u.name as classTeacherName,
        u.email as classTeacherEmail,
        c.created_at as createdAt,
        (
          SELECT COUNT(*) FROM users s 
          WHERE s.role = '${ROLES.STUDENT}' 
            AND s.department = c.department 
            AND s.year = c.year 
            AND s.division = c.division
        ) as studentCount
      FROM classes c
      LEFT JOIN users u ON c.class_teacher_id = u.id
      ORDER BY c.department ASC, c.year ASC, c.division ASC
    `);

    res.status(200).json({
      success: true,
      count: classes.length,
      classes
    });
  } catch (error) {
    next(error);
  }
}

export async function createClass(req, res, next) {
  try {
    const { department, year, division, classTeacherId } = req.body;

    if (!department || !department.trim()) return res.status(400).json({ success: false, message: 'Department is required.' });
    if (!year || !year.trim()) return res.status(400).json({ success: false, message: 'Academic year is required (e.g. SE, TE).' });
    if (!division || !division.trim()) return res.status(400).json({ success: false, message: 'Division is required (e.g. A, B).' });

    const cleanDept = department.trim();
    const cleanYear = year.trim();
    const cleanDiv = division.trim().toUpperCase();

    const existing = queryOne('SELECT id FROM classes WHERE department = ? AND year = ? AND division = ?', [cleanDept, cleanYear, cleanDiv]);
    if (existing) {
      return res.status(400).json({
        success: false,
        message: `Class section ${cleanDept} -> ${cleanYear} -> Division ${cleanDiv} already exists.`
      });
    }

    const id = generateId('cls');

    execute(`
      INSERT INTO classes (id, department, year, division, class_teacher_id, created_at)
      VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `, [id, cleanDept, cleanYear, cleanDiv, classTeacherId || null]);

    res.status(201).json({
      success: true,
      message: `Class Section ${cleanDept} - ${cleanYear}-${cleanDiv} created!`,
      classItem: {
        id,
        department: cleanDept,
        year: cleanYear,
        division: cleanDiv,
        classTeacherId: classTeacherId || null,
        studentCount: 0
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function updateClass(req, res, next) {
  try {
    const { id } = req.params;
    const { department, year, division, classTeacherId } = req.body;

    const classItem = queryOne('SELECT * FROM classes WHERE id = ?', [id]);
    if (!classItem) {
      return res.status(404).json({ success: false, message: 'Class section not found.' });
    }

    const cleanDept = department ? department.trim() : classItem.department;
    const cleanYear = year ? year.trim() : classItem.year;
    const cleanDiv = division ? division.trim().toUpperCase() : classItem.division;

    const duplicate = queryOne('SELECT id FROM classes WHERE department = ? AND year = ? AND division = ? AND id != ?', [cleanDept, cleanYear, cleanDiv, id]);
    if (duplicate) {
      return res.status(400).json({ success: false, message: `Class section ${cleanDept} -> ${cleanYear}-${cleanDiv} already exists.` });
    }

    execute(`
      UPDATE classes SET
        department = ?,
        year = ?,
        division = ?,
        class_teacher_id = ?
      WHERE id = ?
    `, [cleanDept, cleanYear, cleanDiv, classTeacherId !== undefined ? classTeacherId : classItem.class_teacher_id, id]);

    res.status(200).json({
      success: true,
      message: `Class section updated successfully.`
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteClass(req, res, next) {
  try {
    const { id } = req.params;
    const classItem = queryOne('SELECT * FROM classes WHERE id = ?', [id]);
    if (!classItem) {
      return res.status(404).json({ success: false, message: 'Class section not found.' });
    }

    execute('DELETE FROM classes WHERE id = ?', [id]);

    res.status(200).json({
      success: true,
      message: `Class section ${classItem.department} - ${classItem.year}-${classItem.division} deleted.`
    });
  } catch (error) {
    next(error);
  }
}

// ============================================================================
// PART 3: SMART TIMETABLE MANAGEMENT & CONFLICT DETECTION ENGINE
// ============================================================================

/**
 * Conflict Validator: Checks Room, Faculty, and Class-Section Overlaps
 */
function validateTimetableConflicts({ dayOfWeek, startTime, endTime, classroomId, facultyId, classId, excludeId = null }) {
  // 1. Room Conflict Check
  if (classroomId) {
    const roomConflictQuery = `
      SELECT t.*, s.name as subjectName, c.department, c.year, c.division, cl.room_number as roomNumber
      FROM timetables t
      LEFT JOIN subjects s ON t.subject_id = s.id
      LEFT JOIN classes c ON t.class_id = c.id
      LEFT JOIN classrooms cl ON t.classroom_id = cl.id
      WHERE t.day_of_week = ? 
        AND t.classroom_id = ? 
        AND (t.start_time < ? AND t.end_time > ?)
        AND (? IS NULL OR t.id != ?)
      LIMIT 1
    `;
    const roomConflict = queryOne(roomConflictQuery, [dayOfWeek, classroomId, endTime, startTime, excludeId, excludeId]);
    if (roomConflict) {
      return {
        hasConflict: true,
        type: 'ROOM_CONFLICT',
        message: `Classroom conflict: ${roomConflict.roomNumber || 'Room'} is already occupied during this time (${roomConflict.subjectName || 'Lecture'} for ${roomConflict.year}-${roomConflict.division} from ${roomConflict.start_time} to ${roomConflict.end_time}).`
      };
    }
  }

  // 2. Faculty Conflict Check
  if (facultyId) {
    const facultyConflictQuery = `
      SELECT t.*, s.name as subjectName, c.department, c.year, c.division, u.name as facultyName, cl.room_number as roomNumber
      FROM timetables t
      LEFT JOIN subjects s ON t.subject_id = s.id
      LEFT JOIN classes c ON t.class_id = c.id
      LEFT JOIN users u ON t.faculty_id = u.id
      LEFT JOIN classrooms cl ON t.classroom_id = cl.id
      WHERE t.day_of_week = ? 
        AND t.faculty_id = ? 
        AND (t.start_time < ? AND t.end_time > ?)
        AND (? IS NULL OR t.id != ?)
      LIMIT 1
    `;
    const facultyConflict = queryOne(facultyConflictQuery, [dayOfWeek, facultyId, endTime, startTime, excludeId, excludeId]);
    if (facultyConflict) {
      return {
        hasConflict: true,
        type: 'FACULTY_CONFLICT',
        message: `Faculty conflict: ${facultyConflict.facultyName} is already assigned to ${facultyConflict.subjectName || 'a lecture'} (${facultyConflict.year}-${facultyConflict.division} in ${facultyConflict.roomNumber || 'Room'}) from ${facultyConflict.start_time} to ${facultyConflict.end_time}.`
      };
    }
  }

  // 3. Class / Section Conflict Check
  if (classId) {
    const classConflictQuery = `
      SELECT t.*, s.name as subjectName, c.department, c.year, c.division, u.name as facultyName, cl.room_number as roomNumber
      FROM timetables t
      LEFT JOIN subjects s ON t.subject_id = s.id
      LEFT JOIN classes c ON t.class_id = c.id
      LEFT JOIN users u ON t.faculty_id = u.id
      LEFT JOIN classrooms cl ON t.classroom_id = cl.id
      WHERE t.day_of_week = ? 
        AND t.class_id = ? 
        AND (t.start_time < ? AND t.end_time > ?)
        AND (? IS NULL OR t.id != ?)
      LIMIT 1
    `;
    const classConflict = queryOne(classConflictQuery, [dayOfWeek, classId, endTime, startTime, excludeId, excludeId]);
    if (classConflict) {
      return {
        hasConflict: true,
        type: 'CLASS_CONFLICT',
        message: `Class conflict: ${classConflict.department} (${classConflict.year}-${classConflict.division}) already has a scheduled lecture (${classConflict.subjectName || 'Lecture'} with ${classConflict.facultyName || 'Faculty'}) from ${classConflict.start_time} to ${classConflict.end_time}.`
      };
    }
  }

  return { hasConflict: false };
}

/**
 * Get all timetable entries with joins and filter support
 * GET /api/admin/timetable
 */
export async function getTimetables(req, res, next) {
  try {
    const { department, year, division, classId, facultyId, classroomId, day, q } = req.query;

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
        t.faculty_id as facultyId,
        u.name as facultyName,
        u.email as facultyEmail,
        t.classroom_id as classroomId,
        cl.room_number as roomNumber,
        cl.classroom_type as classroomType,
        cl.building,
        cl.floor,
        c.department,
        c.year,
        c.division,
        t.semester,
        t.academic_year as academicYear,
        t.created_at as createdAt,
        t.updated_at as updatedAt
      FROM timetables t
      LEFT JOIN classes c ON t.class_id = c.id
      LEFT JOIN subjects s ON t.subject_id = s.id
      LEFT JOIN users u ON t.faculty_id = u.id
      LEFT JOIN classrooms cl ON t.classroom_id = cl.id
      WHERE 1=1
    `;
    const params = [];

    if (classId && classId !== 'ALL') {
      sql += ` AND t.class_id = ?`;
      params.push(classId);
    }
    if (department && department !== 'ALL') {
      sql += ` AND c.department = ?`;
      params.push(department);
    }
    if (year && year !== 'ALL') {
      sql += ` AND c.year = ?`;
      params.push(year);
    }
    if (division && division !== 'ALL') {
      sql += ` AND c.division = ?`;
      params.push(division);
    }
    if (day && day !== 'ALL') {
      sql += ` AND t.day_of_week = ?`;
      params.push(day);
    }
    if (facultyId && facultyId !== 'ALL') {
      sql += ` AND t.faculty_id = ?`;
      params.push(facultyId);
    }
    if (classroomId && classroomId !== 'ALL') {
      sql += ` AND t.classroom_id = ?`;
      params.push(classroomId);
    }
    if (q && q.trim()) {
      sql += ` AND (LOWER(s.name) LIKE ? OR LOWER(u.name) LIKE ? OR LOWER(cl.room_number) LIKE ? OR LOWER(c.department) LIKE ?)`;
      const term = `%${q.trim().toLowerCase()}%`;
      params.push(term, term, term, term);
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

    const timetables = queryAll(sql, params);

    res.status(200).json({
      success: true,
      count: timetables.length,
      timetables
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Create a new timetable entry with conflict prevention
 * POST /api/admin/timetable
 */
export async function createTimetable(req, res, next) {
  try {
    const {
      dayOfWeek,
      startTime,
      endTime,
      classId,
      department,
      year,
      division,
      subjectId,
      facultyId,
      classroomId,
      periodNumber = 1,
      semester = 4,
      academicYear = '2026-2027'
    } = req.body;

    if (!dayOfWeek) return res.status(400).json({ success: false, message: 'Day of week is required.' });
    if (!startTime || !endTime) return res.status(400).json({ success: false, message: 'Start time and End time are required.' });
    if (startTime >= endTime) return res.status(400).json({ success: false, message: 'Start time must be before End time.' });

    // Determine classId if department, year, division are provided
    let targetClassId = classId;
    if (!targetClassId && department && year && division) {
      const foundClass = queryOne('SELECT id FROM classes WHERE department = ? AND year = ? AND division = ?', [department.trim(), year.trim(), division.trim().toUpperCase()]);
      if (foundClass) targetClassId = foundClass.id;
    }

    if (!targetClassId) {
      return res.status(400).json({ success: false, message: 'Valid Class Section mapping is required.' });
    }
    if (!subjectId) {
      return res.status(400).json({ success: false, message: 'Subject is required.' });
    }
    if (!facultyId) {
      return res.status(400).json({ success: false, message: 'Assigned Faculty is required.' });
    }
    if (!classroomId) {
      return res.status(400).json({ success: false, message: 'Classroom / Lab is required.' });
    }

    // Run triple conflict detection
    const conflict = validateTimetableConflicts({
      dayOfWeek,
      startTime,
      endTime,
      classroomId,
      facultyId,
      classId: targetClassId,
      excludeId: null
    });

    if (conflict.hasConflict) {
      return res.status(400).json({
        success: false,
        conflictType: conflict.type,
        message: conflict.message
      });
    }

    const id = generateId('tt');

    execute(`
      INSERT INTO timetables (
        id, class_id, day_of_week, period_number, start_time, end_time, subject_id, faculty_id, classroom_id, semester, academic_year, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `, [
      id,
      targetClassId,
      dayOfWeek,
      periodNumber || 1,
      startTime,
      endTime,
      subjectId,
      facultyId,
      classroomId,
      semester || 4,
      academicYear || '2026-2027'
    ]);

    const created = queryOne(`
      SELECT 
        t.id, t.class_id as classId, t.day_of_week as dayOfWeek, t.period_number as periodNumber,
        t.start_time as startTime, t.end_time as endTime, t.subject_id as subjectId,
        s.name as subjectName, t.faculty_id as facultyId, u.name as facultyName,
        t.classroom_id as classroomId, cl.room_number as roomNumber,
        c.department, c.year, c.division
      FROM timetables t
      LEFT JOIN classes c ON t.class_id = c.id
      LEFT JOIN subjects s ON t.subject_id = s.id
      LEFT JOIN users u ON t.faculty_id = u.id
      LEFT JOIN classrooms cl ON t.classroom_id = cl.id
      WHERE t.id = ?
    `, [id]);

    // Notify Assigned Faculty
    if (facultyId) {
      const fNotifId = generateId('notif_tt_fac');
      execute(`
        INSERT INTO notifications (id, user_id, target_role, type, title, message, is_read, link, created_at)
        VALUES (?, ?, 'FACULTY', 'TIMETABLE_CHANGE', 'New Lecture Assigned', ?, 0, '/faculty/timetable', CURRENT_TIMESTAMP)
      `, [fNotifId, facultyId, `New lecture scheduled: ${created?.subjectName || 'Subject'} on ${dayOfWeek} at ${startTime} - ${endTime} in Room ${created?.roomNumber || 'Assigned Room'}`]);
    }

    // Notify Students of this Class
    const classInfo = queryOne('SELECT department, year, division FROM classes WHERE id = ?', [targetClassId]);
    if (classInfo) {
      const classStudents = queryAll('SELECT id FROM users WHERE role = ? AND department = ? AND year = ? AND division = ?', [ROLES.STUDENT, classInfo.department, classInfo.year, classInfo.division]);
      for (const st of classStudents) {
        const sNotifId = generateId('notif_tt_stu');
        execute(`
          INSERT INTO notifications (id, user_id, target_role, type, title, message, is_read, link, created_at)
          VALUES (?, ?, 'STUDENT', 'TIMETABLE_CHANGE', 'Timetable Updated', ?, 0, '/student/timetable', CURRENT_TIMESTAMP)
        `, [sNotifId, st.id, `New lecture scheduled: ${created?.subjectName || 'Subject'} on ${dayOfWeek} at ${startTime} - ${endTime}`]);
      }
    }

    res.status(201).json({
      success: true,
      message: `Timetable slot scheduled successfully! (${created?.subjectName} on ${dayOfWeek} at ${startTime} - ${endTime})`,
      timetable: created
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update timetable entry with conflict prevention
 * PUT /api/admin/timetable/:id
 */
export async function updateTimetable(req, res, next) {
  try {
    const { id } = req.params;
    const {
      dayOfWeek,
      startTime,
      endTime,
      classId,
      department,
      year,
      division,
      subjectId,
      facultyId,
      classroomId,
      periodNumber,
      semester,
      academicYear
    } = req.body;

    const existing = queryOne('SELECT * FROM timetables WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Timetable entry not found.' });
    }

    const targetDay = dayOfWeek || existing.day_of_week;
    const targetStart = startTime || existing.start_time;
    const targetEnd = endTime || existing.end_time;
    const targetClassId = classId || existing.class_id;
    const targetSubjectId = subjectId || existing.subject_id;
    const targetFacultyId = facultyId || existing.faculty_id;
    const targetClassroomId = classroomId || existing.classroom_id;

    if (targetStart >= targetEnd) {
      return res.status(400).json({ success: false, message: 'Start time must be before End time.' });
    }

    // Run triple conflict check excluding current entry
    const conflict = validateTimetableConflicts({
      dayOfWeek: targetDay,
      startTime: targetStart,
      endTime: targetEnd,
      classroomId: targetClassroomId,
      facultyId: targetFacultyId,
      classId: targetClassId,
      excludeId: id
    });

    if (conflict.hasConflict) {
      return res.status(400).json({
        success: false,
        conflictType: conflict.type,
        message: conflict.message
      });
    }

    execute(`
      UPDATE timetables SET
        class_id = ?,
        day_of_week = ?,
        period_number = ?,
        start_time = ?,
        end_time = ?,
        subject_id = ?,
        faculty_id = ?,
        classroom_id = ?,
        semester = ?,
        academic_year = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [
      targetClassId,
      targetDay,
      periodNumber !== undefined ? periodNumber : existing.period_number,
      targetStart,
      targetEnd,
      targetSubjectId,
      targetFacultyId,
      targetClassroomId,
      semester || existing.semester,
      academicYear || existing.academic_year,
      id
    ]);

    // Notify Assigned Faculty
    if (targetFacultyId) {
      const fNotifId = generateId('notif_tt_fac');
      execute(`
        INSERT INTO notifications (id, user_id, target_role, type, title, message, is_read, link, created_at)
        VALUES (?, ?, 'FACULTY', 'TIMETABLE_CHANGE', 'Lecture Schedule Updated', ?, 0, '/faculty/timetable', CURRENT_TIMESTAMP)
      `, [fNotifId, targetFacultyId, `Your lecture schedule for ${targetDay} (${targetStart} - ${targetEnd}) has been updated.`]);
    }

    // Notify Students of this Class
    const classInfo = queryOne('SELECT department, year, division FROM classes WHERE id = ?', [targetClassId]);
    if (classInfo) {
      const classStudents = queryAll('SELECT id FROM users WHERE role = ? AND department = ? AND year = ? AND division = ?', [ROLES.STUDENT, classInfo.department, classInfo.year, classInfo.division]);
      for (const st of classStudents) {
        const sNotifId = generateId('notif_tt_stu');
        execute(`
          INSERT INTO notifications (id, user_id, target_role, type, title, message, is_read, link, created_at)
          VALUES (?, ?, 'STUDENT', 'TIMETABLE_CHANGE', 'Timetable Updated', ?, 0, '/student/timetable', CURRENT_TIMESTAMP)
        `, [sNotifId, st.id, `Your timetable schedule for ${targetDay} (${targetStart} - ${targetEnd}) has been updated.`]);
      }
    }

    res.status(200).json({
      success: true,
      message: 'Timetable entry updated successfully.'
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Delete timetable entry
 * DELETE /api/admin/timetable/:id
 */
export async function deleteTimetable(req, res, next) {
  try {
    const { id } = req.params;
    const entry = queryOne('SELECT id, day_of_week, start_time, end_time FROM timetables WHERE id = ?', [id]);
    if (!entry) {
      return res.status(404).json({ success: false, message: 'Timetable entry not found.' });
    }

    execute('DELETE FROM timetables WHERE id = ?', [id]);

    res.status(200).json({
      success: true,
      message: `Timetable slot (${entry.day_of_week} ${entry.start_time} - ${entry.end_time}) deleted successfully.`
    });
  } catch (error) {
    next(error);
  }
}

// ============================================================================
// CLASSROOM AVAILABILITY FOUNDATION (Shared Engine for Admin & Faculty)
// ============================================================================

export async function getClassroomAvailability(req, res, next) {
  try {
    const { date, time, startTime, endTime, day, search } = req.query;

    // Determine Day of Week
    let dayOfWeek = day || 'Monday';
    if (date) {
      const parsedDate = new Date(date);
      if (!isNaN(parsedDate.getTime())) {
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        dayOfWeek = days[parsedDate.getDay()];
      }
    }

    // Determine start & end time window
    const targetStart = startTime || time || '10:00';
    const targetEnd = endTime || (startTime ? (parseInt(startTime.split(':')[0], 10) + 1).toString().padStart(2, '0') + ':00' : '11:00');

    // Fetch all classrooms
    let roomSql = `
      SELECT 
        id, 
        room_number as roomNumber, 
        classroom_type as classroomType, 
        building, 
        floor, 
        capacity, 
        status, 
        has_projector as hasProjector
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

    // Fetch timetable sessions on this day
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

    // Match sessions with rooms based on time overlap
    const results = allRooms.map(room => {
      const session = activeSessions.find(s => {
        if (s.classroomId !== room.id) return false;
        // Interval overlap: s.startTime < targetEnd && s.endTime > targetStart
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
// METADATA & HELPER ENDPOINTS
// ============================================================================

export async function getAdminOptions(req, res, next) {
  try {
    const departments = queryAll('SELECT id, name, code, hod_name as hodName FROM departments ORDER BY name ASC');
    const subjects = queryAll('SELECT id, code, name, department, semester, credits FROM subjects ORDER BY name ASC');
    const facultyList = queryAll(`SELECT id, name, email, department FROM users WHERE role = '${ROLES.FACULTY}' ORDER BY name ASC`);
    const classrooms = queryAll('SELECT id, room_number as roomNumber, classroom_type as classroomType, building, capacity, status FROM classrooms WHERE status = ? ORDER BY room_number ASC', [CLASSROOM_STATUS.ACTIVE]);
    const classes = queryAll('SELECT id, department, year, division FROM classes ORDER BY department ASC, year ASC, division ASC');
    res.status(200).json({
      success: true,
      departments: departments.map(d => d.name),
      departmentList: departments,
      classroomTypes: CLASSROOM_TYPES,
      academicYears: ACADEMIC_YEARS,
      divisions: DIVISIONS,
      subjects,
      facultyList,
      classrooms,
      classes
    });
  } catch (error) {
    next(error);
  }
}

// ============================================================================
// ADMIN NOTIFICATIONS & BROADCASTS
// ============================================================================

/**
 * Get Admin Notifications
 * GET /api/admin/notifications
 */
export async function getAdminNotifications(req, res, next) {
  try {
    const notifications = queryAll(`
      SELECT id, user_id as userId, target_role as targetRole, type, title, message, is_read as isRead, link, created_at as createdAt
      FROM notifications
      WHERE user_id = ? OR target_role IN ('ADMIN', 'ALL')
      ORDER BY datetime(created_at) DESC, id DESC
      LIMIT 100
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
 * Broadcast Campus Circular / Admin Notification
 * POST /api/admin/notifications/broadcast
 */
export async function broadcastNotification(req, res, next) {
  try {
    const { title, message, target = 'ALL' } = req.body;
    if (!title || !title.trim() || !message || !message.trim()) {
      return res.status(400).json({ success: false, message: 'Notification title and message are required.' });
    }

    const validTargets = ['ALL', 'STUDENT', 'FACULTY', 'ADMIN'];
    const targetRole = validTargets.includes(target) ? target : 'ALL';
    const id = generateId('notif_bc');

    execute(`
      INSERT INTO notifications (id, user_id, target_role, type, title, message, is_read, link, created_at)
      VALUES (?, NULL, ?, 'CAMPUS_CIRCULAR', ?, ?, 0, '/notifications', CURRENT_TIMESTAMP)
    `, [id, targetRole, title.trim(), message.trim()]);

    res.status(201).json({
      success: true,
      message: `Campus circular broadcasted successfully to ${targetRole}!`,
      notificationId: id
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Mark Single Admin Notification as Read
 * PUT /api/admin/notifications/:id/read
 */
export async function markAdminNotificationRead(req, res, next) {
  try {
    const { id } = req.params;
    execute('UPDATE notifications SET is_read = 1 WHERE id = ?', [id]);
    res.status(200).json({ success: true, message: 'Notification marked as read.' });
  } catch (error) {
    next(error);
  }
}

/**
 * Mark All Admin Notifications as Read
 * PUT /api/admin/notifications/mark-all-read
 */
export async function markAllAdminNotificationsRead(req, res, next) {
  try {
    execute("UPDATE notifications SET is_read = 1 WHERE user_id = ? OR target_role IN ('ADMIN', 'ALL')", [req.user.id]);
    res.status(200).json({ success: true, message: 'All admin notifications marked as read.' });
  } catch (error) {
    next(error);
  }
}

// ============================================================================
// DEPARTMENT MANAGEMENT
// ============================================================================

/**
 * Get All Departments (with counts and filters)
 * GET /api/admin/departments
 */
export async function getDepartments(req, res, next) {
  try {
    const { q, status } = req.query;

    let sql = `
      SELECT id, name, code, hod_name as hodName, status, created_at as createdAt, updated_at as updatedAt
      FROM departments
      WHERE 1=1
    `;
    const params = [];

    if (q && q.trim()) {
      sql += ` AND (LOWER(name) LIKE ? OR LOWER(code) LIKE ? OR LOWER(hod_name) LIKE ?)`;
      const term = `%${q.trim().toLowerCase()}%`;
      params.push(term, term, term);
    }

    if (status && status.trim() && status !== 'ALL') {
      sql += ` AND status = ?`;
      params.push(status.trim());
    }

    sql += ` ORDER BY status ASC, name ASC`;

    const rawDepartments = queryAll(sql, params);

    const departments = rawDepartments.map(dept => {
      const studentCount = queryOne("SELECT COUNT(*) as count FROM users WHERE role = 'STUDENT' AND department = ?", [dept.name])?.count || 0;
      const facultyCount = queryOne("SELECT COUNT(*) as count FROM users WHERE role = 'FACULTY' AND department = ?", [dept.name])?.count || 0;
      const classCount = queryOne("SELECT COUNT(*) as count FROM classes WHERE department = ?", [dept.name])?.count || 0;
      const subjectCount = queryOne("SELECT COUNT(*) as count FROM subjects WHERE department = ?", [dept.name])?.count || 0;
      const canDelete = (studentCount === 0 && facultyCount === 0 && classCount === 0 && subjectCount === 0);

      return {
        ...dept,
        studentCount,
        facultyCount,
        classCount,
        subjectCount,
        canDelete
      };
    });

    res.status(200).json({
      success: true,
      count: departments.length,
      activeCount: departments.filter(d => d.status === 'Active').length,
      departments
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Create New Department
 * POST /api/admin/departments
 */
export async function createDepartment(req, res, next) {
  try {
    const { name, code, hodName, status = 'Active' } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Department name is required (e.g. Computer Engineering).' });
    }
    if (!code || !code.trim()) {
      return res.status(400).json({ success: false, message: 'Department code is required (e.g. CE).' });
    }

    const cleanName = name.trim();
    const cleanCode = code.trim().toUpperCase();
    const cleanHod = hodName ? hodName.trim() : '';

    // Check uniqueness of name
    const existingName = queryOne('SELECT id FROM departments WHERE LOWER(name) = ?', [cleanName.toLowerCase()]);
    if (existingName) {
      return res.status(400).json({ success: false, message: `Department '${cleanName}' already exists.` });
    }

    // Check uniqueness of code
    const existingCode = queryOne('SELECT id FROM departments WHERE UPPER(code) = ?', [cleanCode]);
    if (existingCode) {
      return res.status(400).json({ success: false, message: `Department code '${cleanCode}' already exists.` });
    }

    const id = generateId(`dept_${cleanCode.toLowerCase()}`);
    execute(`
      INSERT INTO departments (id, name, code, hod_name, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `, [id, cleanName, cleanCode, cleanHod, status === 'Inactive' ? 'Inactive' : 'Active']);

    const created = queryOne('SELECT id, name, code, hod_name as hodName, status, created_at as createdAt, updated_at as updatedAt FROM departments WHERE id = ?', [id]);

    res.status(201).json({
      success: true,
      message: `Department '${cleanName}' added successfully.`,
      department: created
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update Existing Department (Propagates name changes safely)
 * PUT /api/admin/departments/:id
 */
export async function updateDepartment(req, res, next) {
  try {
    const { id } = req.params;
    const { name, code, hodName, status } = req.body;

    const department = queryOne('SELECT * FROM departments WHERE id = ?', [id]);
    if (!department) {
      return res.status(404).json({ success: false, message: 'Department not found.' });
    }

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Department name is required.' });
    }
    if (!code || !code.trim()) {
      return res.status(400).json({ success: false, message: 'Department code is required.' });
    }

    const cleanName = name.trim();
    const cleanCode = code.trim().toUpperCase();
    const cleanHod = hodName !== undefined ? hodName.trim() : department.hod_name;
    const cleanStatus = status !== undefined ? status : department.status;

    // Check duplicate name on other departments
    const duplicateName = queryOne('SELECT id FROM departments WHERE LOWER(name) = ? AND id != ?', [cleanName.toLowerCase(), id]);
    if (duplicateName) {
      return res.status(400).json({ success: false, message: `Department '${cleanName}' is already taken.` });
    }

    // Check duplicate code on other departments
    const duplicateCode = queryOne('SELECT id FROM departments WHERE UPPER(code) = ? AND id != ?', [cleanCode, id]);
    if (duplicateCode) {
      return res.status(400).json({ success: false, message: `Department code '${cleanCode}' is already taken.` });
    }

    const oldName = department.name;

    // If department name changed, cascade name updates across related tables
    if (oldName !== cleanName) {
      execute('UPDATE users SET department = ? WHERE department = ?', [cleanName, oldName]);
      execute('UPDATE classes SET department = ? WHERE department = ?', [cleanName, oldName]);
      execute('UPDATE subjects SET department = ? WHERE department = ?', [cleanName, oldName]);
      try {
        execute('UPDATE academic_performance SET department = ? WHERE department = ?', [cleanName, oldName]);
      } catch (e) {
        // Table might not have records
      }
    }

    execute(`
      UPDATE departments SET
        name = ?,
        code = ?,
        hod_name = ?,
        status = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [cleanName, cleanCode, cleanHod, cleanStatus, id]);

    const updated = queryOne('SELECT id, name, code, hod_name as hodName, status, created_at as createdAt, updated_at as updatedAt FROM departments WHERE id = ?', [id]);

    res.status(200).json({
      success: true,
      message: `Department '${cleanName}' updated successfully.`,
      department: updated
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Delete Department (Safe delete check)
 * DELETE /api/admin/departments/:id
 */
export async function deleteDepartment(req, res, next) {
  try {
    const { id } = req.params;
    const department = queryOne('SELECT * FROM departments WHERE id = ?', [id]);
    if (!department) {
      return res.status(404).json({ success: false, message: 'Department not found.' });
    }

    const studentCount = queryOne("SELECT COUNT(*) as count FROM users WHERE role = 'STUDENT' AND department = ?", [department.name])?.count || 0;
    const facultyCount = queryOne("SELECT COUNT(*) as count FROM users WHERE role = 'FACULTY' AND department = ?", [department.name])?.count || 0;
    const classCount = queryOne("SELECT COUNT(*) as count FROM classes WHERE department = ?", [department.name])?.count || 0;
    const subjectCount = queryOne("SELECT COUNT(*) as count FROM subjects WHERE department = ?", [department.name])?.count || 0;

    const totalDependencies = studentCount + facultyCount + classCount + subjectCount;

    if (totalDependencies > 0) {
      return res.status(400).json({
        success: false,
        isInUse: true,
        message: `This department is currently in use (${studentCount} students, ${facultyCount} faculty, ${classCount} classes, ${subjectCount} subjects) and cannot be deleted. You can deactivate it instead.`,
        dependencies: {
          students: studentCount,
          faculty: facultyCount,
          classes: classCount,
          subjects: subjectCount
        }
      });
    }

    execute('DELETE FROM departments WHERE id = ?', [id]);

    res.status(200).json({
      success: true,
      message: `Department '${department.name}' deleted successfully.`
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Toggle Department Status (Active / Inactive)
 * PATCH /api/admin/departments/:id/status
 */
export async function toggleDepartmentStatus(req, res, next) {
  try {
    const { id } = req.params;
    const department = queryOne('SELECT * FROM departments WHERE id = ?', [id]);
    if (!department) {
      return res.status(404).json({ success: false, message: 'Department not found.' });
    }

    const newStatus = (req.body && req.body.status) ? req.body.status : (department.status === 'Active' ? 'Inactive' : 'Active');
    execute('UPDATE departments SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [newStatus, id]);

    const updated = queryOne('SELECT id, name, code, hod_name as hodName, status, created_at as createdAt, updated_at as updatedAt FROM departments WHERE id = ?', [id]);

    res.status(200).json({
      success: true,
      message: `Department '${department.name}' is now ${newStatus}.`,
      status: newStatus,
      department: updated
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Admin Faculty Timetable
 * GET /api/admin/faculty-timetable
 */
export async function getFacultyTimetableAdmin(req, res, next) {
  try {
    const { facultyId, department, q } = req.query;

    let facultySql = `
      SELECT id, name, email, department, status, assigned_subjects as assignedSubjects, assigned_classes as assignedClasses
      FROM users
      WHERE role = 'FACULTY'
    `;
    const facultyParams = [];

    if (department && department !== 'ALL') {
      facultySql += ` AND department = ?`;
      facultyParams.push(department);
    }

    if (q && q.trim()) {
      facultySql += ` AND (LOWER(name) LIKE ? OR LOWER(email) LIKE ?)`;
      facultyParams.push(`%${q.trim().toLowerCase()}%`, `%${q.trim().toLowerCase()}%`);
    }

    facultySql += ` ORDER BY name ASC`;
    const facultyMembers = queryAll(facultySql, facultyParams).map(f => ({
      ...f,
      assignedSubjects: typeof f.assignedSubjects === 'string' ? JSON.parse(f.assignedSubjects || '[]') : (f.assignedSubjects || []),
      assignedClasses: typeof f.assignedClasses === 'string' ? JSON.parse(f.assignedClasses || '[]') : (f.assignedClasses || [])
    }));

    const targetFacultyId = facultyId || (facultyMembers.length > 0 ? facultyMembers[0].id : null);
    let selectedFaculty = null;
    let timetables = [];

    if (targetFacultyId) {
      selectedFaculty = queryOne(`
        SELECT id, name, email, department, status
        FROM users WHERE id = ? AND role = 'FACULTY'
      `, [targetFacultyId]);

      const ttSql = `
        SELECT 
          t.id,
          t.class_id as classId,
          t.day_of_week as dayOfWeek,
          t.period_number as periodNumber,
          t.start_time as startTime,
          t.end_time as endTime,
          t.academic_year as academicYear,
          t.semester,
          s.id as subjectId,
          s.name as subjectName,
          s.code as subjectCode,
          s.credits,
          c.id as classId,
          c.department as classDepartment,
          c.year as classYear,
          c.division as classDivision,
          cl.id as classroomId,
          cl.room_number as roomNumber,
          cl.classroom_type as classroomType,
          cl.building,
          cl.floor,
          cl.has_projector as hasProjector
        FROM timetables t
        LEFT JOIN subjects s ON t.subject_id = s.id
        LEFT JOIN classes c ON t.class_id = c.id
        LEFT JOIN classrooms cl ON t.classroom_id = cl.id
        WHERE t.faculty_id = ?
        ORDER BY t.start_time ASC
      `;
      timetables = queryAll(ttSql, [targetFacultyId]).map(t => {
        const isLab = (t.classroomType && t.classroomType.toLowerCase().includes('lab')) ||
                      (t.subjectName && t.subjectName.toLowerCase().includes('lab'));
        return {
          ...t,
          isLab: !!isLab
        };
      });
    }

    res.status(200).json({
      success: true,
      facultyMembers,
      selectedFaculty,
      timetables
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Admin Faculty Availability Matrix
 * GET /api/admin/faculty-availability
 */
export async function getFacultyAvailability(req, res, next) {
  try {
    const { date, day, time, startTime, endTime, department, search, availability } = req.query;

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
    const startMins = timeToMinutes(targetStart);
    const endMins = timeToMinutes(targetEnd);

    let facultySql = `
      SELECT id, name, email, department, status
      FROM users
      WHERE role = 'FACULTY'
    `;
    const facultyParams = [];

    if (department && department !== 'ALL') {
      facultySql += ` AND department = ?`;
      facultyParams.push(department);
    }

    if (search && search.trim()) {
      facultySql += ` AND (LOWER(name) LIKE ? OR LOWER(email) LIKE ?)`;
      const term = `%${search.trim().toLowerCase()}%`;
      facultyParams.push(term, term);
    }

    facultySql += ` ORDER BY name ASC`;
    const allFaculty = queryAll(facultySql, facultyParams);

    const daySlots = queryAll(`
      SELECT 
        t.id as timetableId,
        t.faculty_id as facultyId,
        t.start_time as startTime,
        t.end_time as endTime,
        t.day_of_week as dayOfWeek,
        s.name as subjectName,
        s.code as subjectCode,
        cl.room_number as roomNumber,
        cl.classroom_type as classroomType,
        c.department as classDepartment,
        c.year as classYear,
        c.division as classDivision
      FROM timetables t
      LEFT JOIN subjects s ON t.subject_id = s.id
      LEFT JOIN classrooms cl ON t.classroom_id = cl.id
      LEFT JOIN classes c ON t.class_id = c.id
      WHERE t.day_of_week = ?
    `, [dayOfWeek]);

    let occupiedCount = 0;
    let availableCount = 0;

    const facultyList = allFaculty.map(faculty => {
      const activeSlot = daySlots.find(slot => {
        if (slot.facultyId !== faculty.id) return false;
        const sMins = timeToMinutes(slot.startTime);
        const eMins = timeToMinutes(slot.endTime);
        return sMins < endMins && eMins > startMins;
      });

      const isOccupied = !!activeSlot;
      if (isOccupied) {
        occupiedCount++;
      } else {
        availableCount++;
      }

      const isLab = activeSlot ? (
        (activeSlot.classroomType && activeSlot.classroomType.toLowerCase().includes('lab')) ||
        (activeSlot.subjectName && activeSlot.subjectName.toLowerCase().includes('lab'))
      ) : false;

      return {
        id: faculty.id,
        name: faculty.name,
        email: faculty.email,
        department: faculty.department,
        accountStatus: faculty.status,
        status: isOccupied ? 'OCCUPIED' : 'AVAILABLE',
        currentActivity: activeSlot ? {
          subjectName: activeSlot.subjectName || activeSlot.subjectCode,
          subjectCode: activeSlot.subjectCode,
          class: `${activeSlot.classYear || 'SE'}-${activeSlot.classDivision || 'A'}`,
          department: activeSlot.classDepartment || faculty.department,
          roomNumber: activeSlot.roomNumber || 'TBD',
          classroomType: activeSlot.classroomType || 'Classroom',
          isLab,
          startTime: activeSlot.startTime,
          endTime: activeSlot.endTime,
          display: `${activeSlot.subjectName} — ${activeSlot.classYear}-${activeSlot.classDivision} — ${activeSlot.roomNumber} (${activeSlot.startTime}–${activeSlot.endTime})`
        } : null
      };
    });

    let filteredFaculty = facultyList;
    if (availability && availability !== 'ALL') {
      filteredFaculty = facultyList.filter(f => f.status === availability.toUpperCase());
    }

    res.status(200).json({
      success: true,
      dayOfWeek,
      selectedDate: date || new Date().toISOString().split('T')[0],
      startTime: targetStart,
      endTime: targetEnd,
      summary: {
        totalFaculty: allFaculty.length,
        occupiedFaculty: occupiedCount,
        availableFaculty: availableCount
      },
      faculty: filteredFaculty
    });
  } catch (error) {
    next(error);
  }
}

// ============================================================================
// ADMIN ATTENDANCE MANAGEMENT MODULE
// ============================================================================

/**
 * Get Admin Attendance Sheet for selected Class & Subject
 * GET /api/admin/attendance/sheet
 */
export async function getAdminAttendanceSheet(req, res, next) {
  try {
    const { department, year, division, subjectId, date, startDate, endDate } = req.query;

    if (!department || !year || !division || !subjectId) {
      return res.status(400).json({
        success: false,
        message: 'Department, Year, Division and Subject are required to load attendance sheet'
      });
    }

    const subject = queryOne('SELECT id, name, code, department FROM subjects WHERE id = ? OR code = ?', [subjectId, subjectId]);
    if (!subject) {
      return res.status(404).json({ success: false, message: 'Subject not found' });
    }

    const students = queryAll(`
      SELECT 
        id, name, email, roll_number as rollNumber, department, year, division
      FROM users
      WHERE role = 'STUDENT' AND department = ? AND year = ? AND division = ? AND status = 'ACTIVE'
      ORDER BY CAST(roll_number AS INTEGER) ASC, name ASC
    `, [department, year, division]);

    let dateFilterQuery = 'WHERE department = ? AND year = ? AND division = ? AND subject_id = ?';
    const dateParams = [department, year, division, subject.id];

    if (startDate && endDate) {
      dateFilterQuery += ' AND date >= ? AND date <= ?';
      dateParams.push(startDate, endDate);
    } else if (date) {
      dateFilterQuery += ' AND date = ?';
      dateParams.push(date);
    }

    const recordedDates = queryAll(`
      SELECT DISTINCT date 
      FROM attendance_records 
      ${dateFilterQuery}
      ORDER BY date ASC
    `, dateParams).map(r => r.date);

    const rawRecords = queryAll(`
      SELECT 
        id, student_id as studentId, subject_id as subjectId, date, status, marked_by as markedBy, updated_at as updatedAt
      FROM attendance_records
      ${dateFilterQuery}
    `, dateParams);

    const rawSummaries = queryAll(`
      SELECT 
        s.id, s.student_id as studentId, s.subject_id as subjectId, s.department, s.year, s.division,
        s.start_date as startDate, s.end_date as endDate,
        s.total_conducted as totalConducted, s.total_present as totalPresent,
        s.total_absent as totalAbsent, s.total_late as totalLate,
        s.attendance_percentage as attendancePercentage, s.is_defaulter as isDefaulter,
        s.is_published as isPublished, s.published_at as publishedAt, s.published_by as publishedBy,
        u.name as studentName, u.roll_number as rollNumber
      FROM attendance_summaries s
      JOIN users u ON s.student_id = u.id
      WHERE s.department = ? AND s.year = ? AND s.division = ? AND s.subject_id = ?
      ORDER BY CAST(u.roll_number AS INTEGER) ASC, u.name ASC
    `, [department, year, division, subject.id]);

    const isCohortPublished = rawSummaries.length > 0 && rawSummaries.some(s => s.isPublished === 1 || s.isPublished === true);
    const publishedAt = rawSummaries.length > 0 ? rawSummaries[0].publishedAt : null;

    res.status(200).json({
      success: true,
      subject,
      cohort: { department, year, division },
      students,
      dates: recordedDates,
      records: rawRecords,
      summary: {
        isPublished: isCohortPublished,
        publishedAt,
        totalConducted: recordedDates.length,
        students: rawSummaries
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Save Daily Attendance by Admin
 * POST /api/admin/attendance/save-daily
 */
export async function saveAdminDailyAttendance(req, res, next) {
  try {
    const { department, year, division, subjectId, date, records } = req.body;

    if (!department || !year || !division || !subjectId || !date || !Array.isArray(records)) {
      return res.status(400).json({
        success: false,
        message: 'Department, Year, Division, Subject, Date and student records array are required'
      });
    }

    const subject = queryOne('SELECT id, name, code FROM subjects WHERE id = ? OR code = ?', [subjectId, subjectId]);
    if (!subject) {
      return res.status(404).json({ success: false, message: 'Subject not found' });
    }

    const insertOrReplaceStmt = `
      INSERT INTO attendance_records (id, student_id, subject_id, department, year, division, date, status, marked_by, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(student_id, subject_id, date) DO UPDATE SET
        status = excluded.status,
        department = excluded.department,
        year = excluded.year,
        division = excluded.division,
        marked_by = excluded.marked_by,
        updated_at = CURRENT_TIMESTAMP
    `;

    for (const item of records) {
      if (!item.studentId) continue;
      const status = (item.status || 'PRESENT').toUpperCase();
      const validStatus = ['PRESENT', 'ABSENT', 'LATE'].includes(status) ? status : 'PRESENT';
      const recordId = `att_rec_${item.studentId}_${subject.id}_${date}`;

      execute(insertOrReplaceStmt, [
        recordId,
        item.studentId,
        subject.id,
        department,
        year,
        division,
        date,
        validStatus,
        req.user.id
      ]);
    }

    res.status(200).json({
      success: true,
      message: `Daily attendance for ${subject.name} on ${date} saved successfully (${records.length} students recorded).`
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Admin Count & Compute Attendance Percentage across all students in Class
 * POST /api/admin/attendance/count-percentage
 */
export async function countAdminAttendancePercentage(req, res, next) {
  try {
    const { department, year, division, subjectId, startDate, endDate } = req.body;

    if (!department || !year || !division || !subjectId) {
      return res.status(400).json({
        success: false,
        message: 'Department, Year, Division and Subject are required to calculate percentage'
      });
    }

    const subject = queryOne('SELECT id, name, code FROM subjects WHERE id = ? OR code = ?', [subjectId, subjectId]);
    if (!subject) {
      return res.status(404).json({ success: false, message: 'Subject not found' });
    }

    const students = queryAll(`
      SELECT id, name, roll_number as rollNumber, email
      FROM users
      WHERE role = 'STUDENT' AND department = ? AND year = ? AND division = ? AND status = 'ACTIVE'
      ORDER BY CAST(roll_number AS INTEGER) ASC, name ASC
    `, [department, year, division]);

    if (students.length === 0) {
      return res.status(400).json({
        success: false,
        message: `No active students found in ${department} ${year}-${division}.`
      });
    }

    let dateFilterQuery = 'WHERE department = ? AND year = ? AND division = ? AND subject_id = ?';
    const dateParams = [department, year, division, subject.id];

    if (startDate && endDate) {
      dateFilterQuery += ' AND date >= ? AND date <= ?';
      dateParams.push(startDate, endDate);
    }

    const conductedDates = queryAll(`
      SELECT DISTINCT date 
      FROM attendance_records 
      ${dateFilterQuery}
      ORDER BY date ASC
    `, dateParams).map(r => r.date);

    const totalConducted = conductedDates.length;
    const calculatedList = [];
    const defaulters = [];

    for (const student of students) {
      let recordParams = [student.id, subject.id];
      let recQuery = 'WHERE student_id = ? AND subject_id = ?';
      if (startDate && endDate) {
        recQuery += ' AND date >= ? AND date <= ?';
        recordParams.push(startDate, endDate);
      }

      const counts = queryOne(`
        SELECT 
          SUM(CASE WHEN status = 'PRESENT' THEN 1 ELSE 0 END) as presentCount,
          SUM(CASE WHEN status = 'ABSENT' THEN 1 ELSE 0 END) as absentCount,
          SUM(CASE WHEN status = 'LATE' THEN 1 ELSE 0 END) as lateCount
        FROM attendance_records
        ${recQuery}
      `, recordParams);

      const totalPresent = counts?.presentCount || 0;
      const totalAbsent = counts?.absentCount || 0;
      const totalLate = counts?.lateCount || 0;

      let percentage = 0.0;
      if (totalConducted > 0) {
        percentage = parseFloat(((totalPresent / totalConducted) * 100).toFixed(1));
      }

      const isDefaulter = percentage < 30.0;

      const existingSummary = queryOne(`
        SELECT is_published FROM attendance_summaries
        WHERE student_id = ? AND subject_id = ? AND department = ? AND year = ? AND division = ?
      `, [student.id, subject.id, department, year, division]);

      const isPublished = existingSummary ? existingSummary.is_published : 0;
      const summaryId = `att_sum_${student.id}_${subject.id}`;

      execute(`
        INSERT INTO attendance_summaries (
          id, student_id, subject_id, department, year, division,
          start_date, end_date, total_conducted, total_present, total_absent, total_late,
          attendance_percentage, is_defaulter, is_published, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(student_id, subject_id, department, year, division) DO UPDATE SET
          start_date = excluded.start_date,
          end_date = excluded.end_date,
          total_conducted = excluded.total_conducted,
          total_present = excluded.total_present,
          total_absent = excluded.total_absent,
          total_late = excluded.total_late,
          attendance_percentage = excluded.attendance_percentage,
          is_defaulter = excluded.is_defaulter,
          updated_at = CURRENT_TIMESTAMP
      `, [
        summaryId,
        student.id,
        subject.id,
        department,
        year,
        division,
        startDate || (conductedDates[0] || null),
        endDate || (conductedDates[conductedDates.length - 1] || null),
        totalConducted,
        totalPresent,
        totalAbsent,
        totalLate,
        percentage,
        isDefaulter ? 1 : 0,
        isPublished
      ]);

      const item = {
        studentId: student.id,
        studentName: student.name,
        rollNumber: student.rollNumber,
        totalConducted,
        totalPresent,
        totalAbsent,
        totalLate,
        attendancePercentage: percentage,
        isDefaulter,
        status: isDefaulter ? 'DEFAULTER' : (percentage >= 75 ? 'Good' : 'Average')
      };

      calculatedList.push(item);
      if (isDefaulter) {
        defaulters.push({
          ...item,
          subjectName: subject.name,
          subjectCode: subject.code,
          message: 'Please complete your attendance.'
        });
      }
    }

    res.status(200).json({
      success: true,
      message: `Calculated attendance for ${calculatedList.length} students across ${totalConducted} conducted lectures.`,
      subject,
      cohort: { department, year, division },
      totalStudents: calculatedList.length,
      totalConducted,
      defaultersCount: defaulters.length,
      calculatedList,
      defaulters
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Admin Publish Attendance (SEND TO STUDENT)
 * POST /api/admin/attendance/publish
 */
export async function publishAdminAttendance(req, res, next) {
  try {
    const { department, year, division, subjectId, startDate, endDate } = req.body;

    if (!department || !year || !division || !subjectId) {
      return res.status(400).json({
        success: false,
        message: 'Department, Year, Division and Subject are required to publish attendance'
      });
    }

    const subject = queryOne('SELECT id, name, code FROM subjects WHERE id = ? OR code = ?', [subjectId, subjectId]);
    if (!subject) {
      return res.status(404).json({ success: false, message: 'Subject not found' });
    }

    execute(`
      UPDATE attendance_summaries
      SET is_published = 1, published_at = CURRENT_TIMESTAMP, published_by = ?
      WHERE department = ? AND year = ? AND division = ? AND subject_id = ?
    `, [req.user.id, department, year, division, subject.id]);

    const targetedStudents = queryAll(`
      SELECT id, name FROM users
      WHERE role = 'STUDENT' AND department = ? AND year = ? AND division = ? AND status = 'ACTIVE'
    `, [department, year, division]);

    const notifInsert = `
      INSERT INTO notifications (id, user_id, target_role, type, title, message, link, is_read, created_at)
      VALUES (?, ?, 'STUDENT', 'ATTENDANCE_PUBLISHED', ?, ?, '/student/attendance', 0, CURRENT_TIMESTAMP)
    `;

    for (const student of targetedStudents) {
      const notifId = `notif_att_${student.id}_${subject.id}_${Date.now()}`;
      execute(notifInsert, [
        notifId,
        student.id,
        `Attendance Published: ${subject.name} (${subject.code})`,
        `Official attendance for ${subject.name} has been published by Administration. Click to inspect your record.`
      ]);
    }

    res.status(200).json({
      success: true,
      message: `Attendance for ${subject.name} (${subject.code}) has been published to ${targetedStudents.length} students in ${department} ${year}-${division}.`,
      publishedCount: targetedStudents.length
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Admin Defaulters List
 * GET /api/admin/attendance/defaulters
 */
export async function getAdminDefaultersList(req, res, next) {
  try {
    const { department, year, division, subjectId } = req.query;

    let query = `
      SELECT 
        s.id, s.student_id as studentId, s.subject_id as subjectId, s.department, s.year, s.division,
        s.total_conducted as totalConducted, s.total_present as totalPresent,
        s.total_absent as totalAbsent, s.total_late as totalLate,
        s.attendance_percentage as attendancePercentage, s.is_defaulter as isDefaulter,
        s.is_published as isPublished, s.published_at as publishedAt,
        u.name as studentName, u.roll_number as rollNumber, u.email as studentEmail,
        sub.name as subjectName, sub.code as subjectCode
      FROM attendance_summaries s
      JOIN users u ON s.student_id = u.id
      JOIN subjects sub ON s.subject_id = sub.id
      WHERE (s.is_defaulter = 1 OR s.attendance_percentage < 30.0)
    `;
    const params = [];

    if (department && department !== 'ALL') {
      query += ' AND s.department = ?';
      params.push(department);
    }
    if (year && year !== 'ALL') {
      query += ' AND s.year = ?';
      params.push(year);
    }
    if (division && division !== 'ALL') {
      query += ' AND s.division = ?';
      params.push(division);
    }
    if (subjectId && subjectId !== 'ALL') {
      query += ' AND (s.subject_id = ? OR sub.code = ?)';
      params.push(subjectId, subjectId);
    }

    query += ' ORDER BY s.attendance_percentage ASC, CAST(u.roll_number AS INTEGER) ASC';

    const defaulters = queryAll(query, params).map(d => ({
      ...d,
      status: 'Defaulter',
      alertMessage: 'Please complete your attendance.'
    }));

    res.status(200).json({
      success: true,
      defaulters,
      count: defaulters.length
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Admin Attendance Overview Stats
 * GET /api/admin/attendance/stats
 */
export async function getAdminAttendanceStats(req, res, next) {
  try {
    const totalSessions = queryOne('SELECT COUNT(DISTINCT date) as c FROM attendance_records')?.c || 0;
    const avgAttendanceObj = queryOne('SELECT AVG(attendance_percentage) as a FROM attendance_summaries');
    const avgAttendance = avgAttendanceObj && avgAttendanceObj.a != null ? parseFloat(avgAttendanceObj.a.toFixed(1)) : 85.0;
    const totalDefaulters = queryOne('SELECT COUNT(*) as c FROM attendance_summaries WHERE is_defaulter = 1 OR attendance_percentage < 30.0')?.c || 0;
    const publishedBatches = queryOne('SELECT COUNT(DISTINCT subject_id || department || year || division) as c FROM attendance_summaries WHERE is_published = 1')?.c || 0;

    res.status(200).json({
      success: true,
      stats: {
        totalConductedSessions: totalSessions,
        averageCollegeAttendance: `${avgAttendance}%`,
        totalDefaultersCount: totalDefaulters,
        publishedBatchesCount: publishedBatches
      }
    });
  } catch (error) {
    next(error);
  }
}



