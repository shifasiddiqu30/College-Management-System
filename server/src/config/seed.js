import bcrypt from 'bcryptjs';
import { db, initDB } from './db.js';
import { ROLES, USER_STATUS, CLASSROOM_STATUS } from './constants.js';

/**
 * Seed initial complete college dataset (Parts 1 - 4 Enhanced)
 */
export async function seedDatabase() {
  initDB();

  console.log('🌱 [Seeder] Initializing base college dataset (Part 4 Enhanced)...');

  // 1. Seed Departments
  const sampleDepartments = [
    { id: 'dept_ce', name: 'Computer Engineering', code: 'CE', hod_name: 'Dr. Arthur Pendelton' },
    { id: 'dept_it', name: 'Information Technology', code: 'IT', hod_name: 'Dr. Rebecca Sterling' },
    { id: 'dept_extc', name: 'Electronics & Telecommunication', code: 'EXTC', hod_name: 'Dr. Vikramaditya Rao' },
    { id: 'dept_me', name: 'Mechanical Engineering', code: 'ME', hod_name: 'Dr. Harold Finch' },
    { id: 'dept_civil', name: 'Civil Engineering', code: 'CIVIL', hod_name: 'Dr. Maya Lin' },
    { id: 'dept_aids', name: 'Artificial Intelligence & Data Science', code: 'AI&DS', hod_name: 'Dr. Alan Turing' }
  ];

  const deptStmt = db.prepare(`
    INSERT OR REPLACE INTO departments (id, name, code, hod_name) 
    VALUES (?, ?, ?, ?)
  `);
  for (const dept of sampleDepartments) {
    deptStmt.run(dept.id, dept.name, dept.code, dept.hod_name);
  }

  // 2. Seed Academic Subjects
  const sampleSubjects = [
    { id: 'sub_java', code: 'CE401', name: 'Java Programming', department: 'Computer Engineering', semester: 4, credits: 4 },
    { id: 'sub_dbms', code: 'CE402', name: 'Database Management Systems', department: 'Computer Engineering', semester: 4, credits: 4 },
    { id: 'sub_os', code: 'CE501', name: 'Operating Systems', department: 'Computer Engineering', semester: 5, credits: 3 },
    { id: 'sub_cn', code: 'CE502', name: 'Computer Networks', department: 'Computer Engineering', semester: 5, credits: 3 },
    { id: 'sub_dmgt', code: 'CE403', name: 'Discrete Mathematics & Graph Theory', department: 'Computer Engineering', semester: 4, credits: 4 },
    { id: 'sub_thermo', code: 'ME301', name: 'Thermodynamics', department: 'Mechanical Engineering', semester: 3, credits: 4 },
    { id: 'sub_dsp', code: 'EX401', name: 'Digital Signal Processing', department: 'Electronics & Telecommunication', semester: 4, credits: 4 }
  ];

  const subStmt = db.prepare(`
    INSERT OR REPLACE INTO subjects (id, code, name, department, semester, credits)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  for (const sub of sampleSubjects) {
    subStmt.run(sub.id, sub.code, sub.name, sub.department, sub.semester, sub.credits);
  }

  // 3. Seed Users (Admin, Faculty, Student)
  const saltRounds = 10;
  const adminHash = await bcrypt.hash('Admin@123', saltRounds);
  const facultyHash = await bcrypt.hash('Faculty@123', saltRounds);
  const studentHash = await bcrypt.hash('Student@123', saltRounds);

  const sampleUsers = [
    {
      id: 'usr_admin_001',
      name: 'Dr. Eleanor Vance',
      email: 'admin@college.edu',
      password_hash: adminHash,
      role: ROLES.ADMIN,
      department: 'Central Administration',
      year: null,
      division: null,
      roll_number: null,
      status: USER_STATUS.ACTIVE,
      assigned_subjects: null,
      assigned_classes: null
    },
    {
      id: 'usr_fac_sharma_001',
      name: "Sharma Ma'am",
      email: 'sharma@college.edu',
      password_hash: facultyHash,
      role: ROLES.FACULTY,
      department: 'Computer Engineering',
      year: null,
      division: null,
      roll_number: null,
      status: USER_STATUS.ACTIVE,
      assigned_subjects: JSON.stringify(['Java Programming', 'Database Management Systems']),
      assigned_classes: JSON.stringify(['SE-B', 'TE-A'])
    },
    {
      id: 'usr_fac_cs_002',
      name: 'Prof. Robert Downey',
      email: 'faculty.cs@college.edu',
      password_hash: facultyHash,
      role: ROLES.FACULTY,
      department: 'Computer Engineering',
      year: null,
      division: null,
      roll_number: null,
      status: USER_STATUS.ACTIVE,
      assigned_subjects: JSON.stringify(['Operating Systems', 'Computer Networks']),
      assigned_classes: JSON.stringify(['SE-B', 'TE-A', 'BE-A'])
    },
    {
      id: 'usr_fac_me_003',
      name: 'Prof. Sarah Connor',
      email: 'faculty.me@college.edu',
      password_hash: facultyHash,
      role: ROLES.FACULTY,
      department: 'Mechanical Engineering',
      year: null,
      division: null,
      roll_number: null,
      status: USER_STATUS.ACTIVE,
      assigned_subjects: JSON.stringify(['Thermodynamics']),
      assigned_classes: JSON.stringify(['SE-A', 'TE-B'])
    },
    {
      id: 'usr_stu_shifa_001',
      name: 'Shifa Siddiqui',
      email: 'student@college.edu',
      password_hash: studentHash,
      role: ROLES.STUDENT,
      department: 'Computer Engineering',
      year: 'SE',
      division: 'B',
      roll_number: '23',
      status: USER_STATUS.ACTIVE,
      assigned_subjects: null,
      assigned_classes: null
    },
    {
      id: 'usr_stu_alex_002',
      name: 'Alex Morgan',
      email: 'student.alex@college.edu',
      password_hash: studentHash,
      role: ROLES.STUDENT,
      department: 'Computer Engineering',
      year: 'TE',
      division: 'A',
      roll_number: '42',
      status: USER_STATUS.ACTIVE,
      assigned_subjects: null,
      assigned_classes: null
    },
    {
      id: 'usr_stu_priya_003',
      name: 'Priya Sharma',
      email: 'student.priya@college.edu',
      password_hash: studentHash,
      role: ROLES.STUDENT,
      department: 'Electronics & Telecommunication',
      year: 'SE',
      division: 'A',
      roll_number: '19',
      status: USER_STATUS.ACTIVE,
      assigned_subjects: null,
      assigned_classes: null
    },
    {
      id: 'usr_stu_sus_004',
      name: 'David Miller',
      email: 'suspended.student@college.edu',
      password_hash: studentHash,
      role: ROLES.STUDENT,
      department: 'Civil Engineering',
      year: 'BE',
      division: 'C',
      roll_number: '88',
      status: USER_STATUS.SUSPENDED,
      assigned_subjects: null,
      assigned_classes: null
    }
  ];

  const userStmt = db.prepare(`
    INSERT OR REPLACE INTO users (
      id, name, email, password_hash, role, department, 
      year, division, roll_number, status, 
      assigned_subjects, assigned_classes, updated_at
    ) VALUES (
      ?, ?, ?, ?, ?, ?, 
      ?, ?, ?, ?, 
      ?, ?, CURRENT_TIMESTAMP
    )
  `);

  for (const user of sampleUsers) {
    userStmt.run(
      user.id,
      user.name,
      user.email,
      user.password_hash,
      user.role,
      user.department,
      user.year,
      user.division,
      user.roll_number,
      user.status,
      user.assigned_subjects,
      user.assigned_classes
    );
  }

  // 4. Seed Classes / Sections
  const sampleClasses = [
    { id: 'cls_ce_se_b', department: 'Computer Engineering', year: 'SE', division: 'B', class_teacher_id: 'usr_fac_sharma_001' },
    { id: 'cls_ce_te_a', department: 'Computer Engineering', year: 'TE', division: 'A', class_teacher_id: 'usr_fac_cs_002' },
    { id: 'cls_ce_be_a', department: 'Computer Engineering', year: 'BE', division: 'A', class_teacher_id: 'usr_fac_cs_002' },
    { id: 'cls_me_se_a', department: 'Mechanical Engineering', year: 'SE', division: 'A', class_teacher_id: 'usr_fac_me_003' },
    { id: 'cls_extc_se_a', department: 'Electronics & Telecommunication', year: 'SE', division: 'A', class_teacher_id: null },
    { id: 'cls_it_se_a', department: 'Information Technology', year: 'SE', division: 'A', class_teacher_id: null }
  ];

  const classStmt = db.prepare(`
    INSERT OR REPLACE INTO classes (id, department, year, division, class_teacher_id)
    VALUES (?, ?, ?, ?, ?)
  `);
  for (const c of sampleClasses) {
    classStmt.run(c.id, c.department, c.year, c.division, c.class_teacher_id);
  }

  // 5. Seed Classrooms
  const sampleClassrooms = [
    { id: 'crm_301', room_number: 'Room 301', classroom_type: 'Classroom', building: 'Engineering Block A', floor: '3rd Floor', capacity: 70, status: CLASSROOM_STATUS.ACTIVE, has_projector: 1, is_available: 1 },
    { id: 'crm_302', room_number: 'Room 302', classroom_type: 'Classroom', building: 'Engineering Block A', floor: '3rd Floor', capacity: 65, status: CLASSROOM_STATUS.ACTIVE, has_projector: 1, is_available: 1 },
    { id: 'crm_303', room_number: 'Room 303', classroom_type: 'Classroom', building: 'Engineering Block A', floor: '3rd Floor', capacity: 60, status: CLASSROOM_STATUS.ACTIVE, has_projector: 0, is_available: 1 },
    { id: 'crm_lab201', room_number: 'Lab 201', classroom_type: 'Computer Lab', building: 'IT Complex', floor: '2nd Floor', capacity: 40, status: CLASSROOM_STATUS.ACTIVE, has_projector: 1, is_available: 1 },
    { id: 'crm_lab202', room_number: 'Lab 202', classroom_type: 'Electronics Lab', building: 'Tech Hub', floor: '2nd Floor', capacity: 35, status: CLASSROOM_STATUS.ACTIVE, has_projector: 1, is_available: 1 },
    { id: 'crm_sem101', room_number: 'Seminar Hall 101', classroom_type: 'Seminar Hall', building: 'Auditorium Wing', floor: '1st Floor', capacity: 150, status: CLASSROOM_STATUS.ACTIVE, has_projector: 1, is_available: 1 },
    { id: 'crm_lab305', room_number: 'Physics Lab 305', classroom_type: 'Laboratory', building: 'Science Block', floor: '3rd Floor', capacity: 45, status: CLASSROOM_STATUS.INACTIVE, has_projector: 0, is_available: 0 }
  ];

  const classroomStmt = db.prepare(`
    INSERT OR REPLACE INTO classrooms (
      id, room_number, classroom_type, building, floor, capacity, status, has_projector, is_available, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
  `);
  for (const c of sampleClassrooms) {
    classroomStmt.run(c.id, c.room_number, c.classroom_type, c.building, c.floor, c.capacity, c.status, c.has_projector, c.is_available);
  }

  // 6. Seed Complete Weekly Timetable
  const sampleTimetables = [
    // --- MONDAY (SE-B) ---
    { id: 'tt_se_b_mon_1', class_id: 'cls_ce_se_b', day_of_week: 'Monday', period_number: 1, start_time: '09:00', end_time: '10:00', subject_id: 'sub_os', faculty_id: 'usr_fac_cs_002', classroom_id: 'crm_301', semester: 4 },
    { id: 'tt_se_b_mon_2', class_id: 'cls_ce_se_b', day_of_week: 'Monday', period_number: 2, start_time: '10:00', end_time: '11:00', subject_id: 'sub_java', faculty_id: 'usr_fac_sharma_001', classroom_id: 'crm_301', semester: 4 },
    { id: 'tt_se_b_mon_3', class_id: 'cls_ce_se_b', day_of_week: 'Monday', period_number: 3, start_time: '11:15', end_time: '12:15', subject_id: 'sub_dbms', faculty_id: 'usr_fac_sharma_001', classroom_id: 'crm_lab201', semester: 4 },
    { id: 'tt_se_b_mon_4', class_id: 'cls_ce_se_b', day_of_week: 'Monday', period_number: 4, start_time: '13:00', end_time: '14:00', subject_id: 'sub_dmgt', faculty_id: 'usr_fac_cs_002', classroom_id: 'crm_301', semester: 4 },
    { id: 'tt_se_b_mon_5', class_id: 'cls_ce_se_b', day_of_week: 'Monday', period_number: 5, start_time: '14:00', end_time: '15:00', subject_id: 'sub_cn', faculty_id: 'usr_fac_cs_002', classroom_id: 'crm_302', semester: 4 },

    // --- TUESDAY (SE-B) ---
    { id: 'tt_se_b_tue_1', class_id: 'cls_ce_se_b', day_of_week: 'Tuesday', period_number: 1, start_time: '09:00', end_time: '10:00', subject_id: 'sub_dbms', faculty_id: 'usr_fac_sharma_001', classroom_id: 'crm_301', semester: 4 },
    { id: 'tt_se_b_tue_2', class_id: 'cls_ce_se_b', day_of_week: 'Tuesday', period_number: 2, start_time: '10:00', end_time: '11:00', subject_id: 'sub_java', faculty_id: 'usr_fac_sharma_001', classroom_id: 'crm_301', semester: 4 },
    { id: 'tt_se_b_tue_3', class_id: 'cls_ce_se_b', day_of_week: 'Tuesday', period_number: 3, start_time: '11:15', end_time: '12:15', subject_id: 'sub_java', faculty_id: 'usr_fac_sharma_001', classroom_id: 'crm_lab201', semester: 4 },
    { id: 'tt_se_b_tue_4', class_id: 'cls_ce_se_b', day_of_week: 'Tuesday', period_number: 4, start_time: '13:00', end_time: '14:00', subject_id: 'sub_os', faculty_id: 'usr_fac_cs_002', classroom_id: 'crm_301', semester: 4 },

    // --- WEDNESDAY (SE-B) ---
    { id: 'tt_se_b_wed_1', class_id: 'cls_ce_se_b', day_of_week: 'Wednesday', period_number: 1, start_time: '09:00', end_time: '10:00', subject_id: 'sub_cn', faculty_id: 'usr_fac_cs_002', classroom_id: 'crm_302', semester: 4 },
    { id: 'tt_se_b_wed_2', class_id: 'cls_ce_se_b', day_of_week: 'Wednesday', period_number: 2, start_time: '10:00', end_time: '11:00', subject_id: 'sub_java', faculty_id: 'usr_fac_sharma_001', classroom_id: 'crm_301', semester: 4 },
    { id: 'tt_se_b_wed_3', class_id: 'cls_ce_se_b', day_of_week: 'Wednesday', period_number: 3, start_time: '11:15', end_time: '12:15', subject_id: 'sub_dmgt', faculty_id: 'usr_fac_cs_002', classroom_id: 'crm_301', semester: 4 },
    { id: 'tt_se_b_wed_4', class_id: 'cls_ce_se_b', day_of_week: 'Wednesday', period_number: 4, start_time: '14:00', end_time: '15:00', subject_id: 'sub_dbms', faculty_id: 'usr_fac_sharma_001', classroom_id: 'crm_301', semester: 4 },

    // --- THURSDAY (SE-B) ---
    { id: 'tt_se_b_thu_1', class_id: 'cls_ce_se_b', day_of_week: 'Thursday', period_number: 1, start_time: '10:00', end_time: '11:00', subject_id: 'sub_java', faculty_id: 'usr_fac_sharma_001', classroom_id: 'crm_301', semester: 4 },
    { id: 'tt_se_b_thu_2', class_id: 'cls_ce_se_b', day_of_week: 'Thursday', period_number: 2, start_time: '11:15', end_time: '12:15', subject_id: 'sub_os', faculty_id: 'usr_fac_cs_002', classroom_id: 'crm_301', semester: 4 },
    { id: 'tt_se_b_thu_3', class_id: 'cls_ce_se_b', day_of_week: 'Thursday', period_number: 3, start_time: '13:00', end_time: '14:00', subject_id: 'sub_cn', faculty_id: 'usr_fac_cs_002', classroom_id: 'crm_lab201', semester: 4 },

    // --- FRIDAY (SE-B) ---
    { id: 'tt_se_b_fri_1', class_id: 'cls_ce_se_b', day_of_week: 'Friday', period_number: 1, start_time: '09:00', end_time: '10:00', subject_id: 'sub_dmgt', faculty_id: 'usr_fac_cs_002', classroom_id: 'crm_301', semester: 4 },
    { id: 'tt_se_b_fri_2', class_id: 'cls_ce_se_b', day_of_week: 'Friday', period_number: 2, start_time: '10:00', end_time: '11:00', subject_id: 'sub_java', faculty_id: 'usr_fac_sharma_001', classroom_id: 'crm_301', semester: 4 },
    { id: 'tt_se_b_fri_3', class_id: 'cls_ce_se_b', day_of_week: 'Friday', period_number: 3, start_time: '11:15', end_time: '12:15', subject_id: 'sub_dbms', faculty_id: 'usr_fac_sharma_001', classroom_id: 'crm_301', semester: 4 },

    // --- SATURDAY (SE-B) ---
    { id: 'tt_se_b_sat_1', class_id: 'cls_ce_se_b', day_of_week: 'Saturday', period_number: 1, start_time: '09:00', end_time: '10:00', subject_id: 'sub_java', faculty_id: 'usr_fac_sharma_001', classroom_id: 'crm_sem101', semester: 4 },
    { id: 'tt_se_b_sat_2', class_id: 'cls_ce_se_b', day_of_week: 'Saturday', period_number: 2, start_time: '10:00', end_time: '11:00', subject_id: 'sub_java', faculty_id: 'usr_fac_sharma_001', classroom_id: 'crm_301', semester: 4 },

    // --- TE-A (Student Alex Morgan) ---
    { id: 'tt_te_a_mon_1', class_id: 'cls_ce_te_a', day_of_week: 'Monday', period_number: 1, start_time: '11:15', end_time: '12:15', subject_id: 'sub_os', faculty_id: 'usr_fac_cs_002', classroom_id: 'crm_302', semester: 6 },
    { id: 'tt_te_a_tue_1', class_id: 'cls_ce_te_a', day_of_week: 'Tuesday', period_number: 2, start_time: '14:00', end_time: '15:00', subject_id: 'sub_cn', faculty_id: 'usr_fac_cs_002', classroom_id: 'crm_302', semester: 6 }
  ];

  const ttStmt = db.prepare(`
    INSERT OR REPLACE INTO timetables (
      id, class_id, day_of_week, period_number, start_time, end_time, subject_id, faculty_id, classroom_id, semester, academic_year, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
  `);
  for (const tt of sampleTimetables) {
    ttStmt.run(
      tt.id,
      tt.class_id,
      tt.day_of_week,
      tt.period_number || 1,
      tt.start_time,
      tt.end_time,
      tt.subject_id,
      tt.faculty_id,
      tt.classroom_id,
      tt.semester || 4,
      '2026-2027'
    );
  }

  // 7. Seed Personal Schedules (Strictly Private)
  const samplePersonalSchedules = [
    { id: 'ps_sharma_01', faculty_id: 'usr_fac_sharma_001', title: 'Submit Internal Marks for SE-B Java', task_date: '2026-09-10', task_time: '14:00', note: 'Verify assignments before publishing', category: 'Grading', priority: 'High', is_completed: 0 },
    { id: 'ps_sharma_02', faculty_id: 'usr_fac_sharma_001', title: 'Department Curriculum Review Meeting', task_date: '2026-09-12', task_time: '11:30', note: 'HOD cabin with Dr. Arthur Pendelton', category: 'Meeting', priority: 'Medium', is_completed: 0 },
    { id: 'ps_sharma_03', faculty_id: 'usr_fac_sharma_001', title: 'Prepare Java Lab Problem Statements', task_date: '2026-09-15', task_time: '16:00', note: 'Multithreading and Exception Handling sets', category: 'Preparation', priority: 'Low', is_completed: 1 },
    { id: 'ps_cs_01', faculty_id: 'usr_fac_cs_002', title: 'Review OS Concurrency Assignment', task_date: '2026-09-11', task_time: '10:00', note: 'Check mutex and semaphore lock solutions', category: 'Grading', priority: 'High', is_completed: 0 }
  ];

  const psStmt = db.prepare(`
    INSERT OR REPLACE INTO personal_schedules (
      id, faculty_id, title, task_date, task_time, note, category, priority, is_completed, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
  `);
  for (const ps of samplePersonalSchedules) {
    psStmt.run(ps.id, ps.faculty_id, ps.title, ps.task_date, ps.task_time, ps.note, ps.category, ps.priority, ps.is_completed);
  }

  // 8. Seed Clubs & Memberships
  const sampleClubs = [
    {
      id: 'club_coding_01',
      name: 'Coding & Algorithmic Club',
      category: 'Technical',
      description: 'Competitive programming, open-source hacking, and campus algorithmic workshops.',
      coordinator_id: 'usr_fac_sharma_001',
      max_seats: 30,
      available_seats: 6,
      registration_start_date: '2026-08-01',
      registration_end_date: '2026-10-30',
      status: 'Registration Open',
      banner_url: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&auto=format&fit=crop&q=60'
    },
    {
      id: 'club_robotics_02',
      name: 'Robotics & Automation Society',
      category: 'Hardware & AI',
      description: 'Designing autonomous rovers, drones, and industrial automation prototypes.',
      coordinator_id: 'usr_fac_me_003',
      max_seats: 20,
      available_seats: 0,
      registration_start_date: '2026-08-01',
      registration_end_date: '2026-09-15',
      status: 'Seats Full',
      banner_url: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800&auto=format&fit=crop&q=60'
    },
    {
      id: 'club_gdsc_03',
      name: 'Google Developer Student Club',
      category: 'Technical & Cloud',
      description: 'Google cloud study jams, Android dev sprints, and Web technologies.',
      coordinator_id: 'usr_fac_cs_002',
      max_seats: 50,
      available_seats: 25,
      registration_start_date: '2026-08-10',
      registration_end_date: '2026-11-01',
      status: 'Registration Open',
      banner_url: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800&auto=format&fit=crop&q=60'
    }
  ];

  const clubStmt = db.prepare(`
    INSERT OR REPLACE INTO clubs (
      id, name, category, description, coordinator_id, max_seats, available_seats,
      registration_start_date, registration_end_date, status, banner_url, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
  `);
  for (const cl of sampleClubs) {
    clubStmt.run(
      cl.id, cl.name, cl.category, cl.description, cl.coordinator_id, cl.max_seats, cl.available_seats,
      cl.registration_start_date, cl.registration_end_date, cl.status, cl.banner_url
    );
  }

  // Club Registrations
  const sampleClubRegs = [
    { id: 'cr_01', club_id: 'club_coding_01', student_id: 'usr_stu_shifa_001', student_name: 'Shifa Siddiqui', student_email: 'student@college.edu', roll_number: '23', department: 'Computer Engineering', year: 'SE', division: 'B' },
    { id: 'cr_02', club_id: 'club_coding_01', student_id: 'usr_stu_alex_002', student_name: 'Alex Morgan', student_email: 'student.alex@college.edu', roll_number: '42', department: 'Computer Engineering', year: 'TE', division: 'A' },
    { id: 'cr_03', club_id: 'club_gdsc_03', student_id: 'usr_stu_alex_002', student_name: 'Alex Morgan', student_email: 'student.alex@college.edu', roll_number: '42', department: 'Computer Engineering', year: 'TE', division: 'A' }
  ];

  const crStmt = db.prepare(`
    INSERT OR REPLACE INTO club_registrations (
      id, club_id, student_id, student_name, student_email, roll_number, department, year, division
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const cr of sampleClubRegs) {
    crStmt.run(cr.id, cr.club_id, cr.student_id, cr.student_name, cr.student_email, cr.roll_number, cr.department, cr.year, cr.division);
  }

  // 9. Seed Campus Events
  const sampleEvents = [
    {
      id: 'evt_hack_01',
      club_id: 'club_coding_01',
      title: 'HackNexa 2026 - 36hr National Hackathon',
      description: 'Annual flagship collegiate hackathon focusing on AI agents, Web3, and smart campus solutions.',
      event_date: '2026-10-15',
      event_time: '09:00 AM',
      venue: 'Auditorium Wing & Computer Labs',
      registration_start_date: '2026-09-01',
      registration_last_date: '2026-10-10',
      coordinator_id: 'usr_fac_sharma_001',
      status: 'Upcoming',
      banner_url: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&auto=format&fit=crop&q=60'
    },
    {
      id: 'evt_summit_02',
      club_id: 'club_gdsc_03',
      title: 'AI & Cloud Infrastructure Summit',
      description: 'Keynotes from Google Cloud Architects and hands-on LLM deployment workshops.',
      event_date: '2026-09-28',
      event_time: '10:30 AM',
      venue: 'Seminar Hall 101',
      registration_start_date: '2026-08-15',
      registration_last_date: '2026-09-20',
      coordinator_id: 'usr_fac_cs_002',
      status: 'Upcoming',
      banner_url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&auto=format&fit=crop&q=60'
    },
    {
      id: 'evt_induction_03',
      club_id: null,
      title: 'Spring Campus Orientation 2026',
      description: 'Introduction to clubs, societies, sports facilities, and academic policies.',
      event_date: '2026-08-01',
      event_time: '09:00 AM',
      venue: 'Central Amphitheatre',
      registration_start_date: '2026-07-10',
      registration_last_date: '2026-07-25',
      coordinator_id: 'usr_fac_sharma_001',
      status: 'Registration Closed',
      banner_url: null
    }
  ];

  const evtStmt = db.prepare(`
    INSERT OR REPLACE INTO club_events (
      id, club_id, title, description, event_date, event_time, venue,
      registration_start_date, registration_last_date, coordinator_id, status, banner_url, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
  `);
  for (const ev of sampleEvents) {
    evtStmt.run(
      ev.id, ev.club_id, ev.title, ev.description, ev.event_date, ev.event_time, ev.venue,
      ev.registration_start_date, ev.registration_last_date, ev.coordinator_id, ev.status, ev.banner_url
    );
  }

  // Event Registrations
  const sampleEventRegs = [
    { id: 'er_01', event_id: 'evt_hack_01', student_id: 'usr_stu_shifa_001', student_name: 'Shifa Siddiqui', student_email: 'student@college.edu', roll_number: '23', department: 'Computer Engineering', year: 'SE', division: 'B' },
    { id: 'er_02', event_id: 'evt_hack_01', student_id: 'usr_stu_alex_002', student_name: 'Alex Morgan', student_email: 'student.alex@college.edu', roll_number: '42', department: 'Computer Engineering', year: 'TE', division: 'A' },
    { id: 'er_03', event_id: 'evt_summit_02', student_id: 'usr_stu_alex_002', student_name: 'Alex Morgan', student_email: 'student.alex@college.edu', roll_number: '42', department: 'Computer Engineering', year: 'TE', division: 'A' }
  ];

  const erStmt = db.prepare(`
    INSERT OR REPLACE INTO event_registrations (
      id, event_id, student_id, student_name, student_email, roll_number, department, year, division
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const er of sampleEventRegs) {
    erStmt.run(er.id, er.event_id, er.student_id, er.student_name, er.student_email, er.roll_number, er.department, er.year, er.division);
  }

  // 10. Seed Doubt Discussion Pages
  const sampleDoubtPages = [
    {
      id: 'page_ce_se_b_java',
      faculty_id: 'usr_fac_sharma_001',
      department: 'Computer Engineering',
      year: 'SE',
      division: 'B',
      subject_id: 'sub_java',
      title: 'SE-B Java Programming Doubt Forum',
      description: 'Official academic discussion space for Core Java, OOP, Collections, Multithreading & JDBC.',
      semester: 4,
      authorized_emails: JSON.stringify(['student@college.edu', 'student.alex@college.edu']),
      is_active: 1
    },
    {
      id: 'page_ce_te_a_os',
      faculty_id: 'usr_fac_cs_002',
      department: 'Computer Engineering',
      year: 'TE',
      division: 'A',
      subject_id: 'sub_os',
      title: 'TE-A Operating Systems Discussion Forum',
      description: 'Official discussion for Process Management, Memory Paging, Deadlocks & Shell Scripting.',
      semester: 5,
      authorized_emails: JSON.stringify(['student.alex@college.edu']),
      is_active: 1
    }
  ];

  const dpStmt = db.prepare(`
    INSERT OR REPLACE INTO doubt_pages (
      id, faculty_id, department, year, division, subject_id, title, description, semester, authorized_emails, is_active, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
  `);
  for (const dp of sampleDoubtPages) {
    dpStmt.run(dp.id, dp.faculty_id, dp.department, dp.year, dp.division, dp.subject_id, dp.title, dp.description, dp.semester, dp.authorized_emails, dp.is_active);
  }

  // 11. Seed Doubts & Structured Replies
  const sampleDoubts = [
    {
      id: 'dbt_java_01',
      page_id: 'page_ce_se_b_java',
      student_id: 'usr_stu_shifa_001',
      faculty_id: 'usr_fac_sharma_001',
      subject_id: 'sub_java',
      department: 'Computer Engineering',
      year: 'SE',
      division: 'B',
      title: 'How do custom exceptions work with Java multithreaded runnables?',
      description: 'When an unhandled custom checked exception is thrown inside a Runnable run() method, it does not propagate to the main caller thread. How do we properly handle Thread.UncaughtExceptionHandler?',
      image_url: null,
      is_anonymous: 0,
      is_faculty_help_requested: 1,
      status: 'OPEN'
    },
    {
      id: 'dbt_java_02',
      page_id: 'page_ce_se_b_java',
      student_id: 'usr_stu_shifa_001',
      faculty_id: 'usr_fac_sharma_001',
      subject_id: 'sub_java',
      department: 'Computer Engineering',
      year: 'SE',
      division: 'B',
      title: 'Difference between JVM heap space and Metaspace in Java 17',
      description: 'Could someone clarify how PermGen was removed and how Metaspace dynamically allocates memory from native RAM?',
      image_url: null,
      is_anonymous: 0,
      is_faculty_help_requested: 0,
      status: 'ANSWERED'
    }
  ];

  const dbtStmt = db.prepare(`
    INSERT OR REPLACE INTO doubts (
      id, page_id, student_id, faculty_id, subject_id, department, year, division,
      title, description, image_url, is_anonymous, is_faculty_help_requested, status, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
  `);
  for (const d of sampleDoubts) {
    dbtStmt.run(
      d.id, d.page_id, d.student_id, d.faculty_id, d.subject_id, d.department, d.year, d.division,
      d.title, d.description, d.image_url, d.is_anonymous, d.is_faculty_help_requested, d.status
    );
  }

  // Seed Replies
  const sampleReplies = [
    {
      id: 'rpl_01',
      doubt_id: 'dbt_java_02',
      author_id: 'usr_fac_sharma_001',
      reply_text: 'In modern Java (Java 8+), PermGen was completely replaced by Metaspace. Metaspace memory is allocated directly from the underlying OS native memory rather than the contiguous JVM heap space, avoiding premature OutOfMemory errors unless native RAM is exhausted. You can control its upper limit with -XX:MaxMetaspaceSize.',
      image_url: null,
      is_faculty_endorsed: 1,
      is_verified: 1
    }
  ];

  const rplStmt = db.prepare(`
    INSERT OR REPLACE INTO doubt_replies (
      id, doubt_id, author_id, reply_text, image_url, is_faculty_endorsed, is_verified
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  for (const r of sampleReplies) {
    rplStmt.run(r.id, r.doubt_id, r.author_id, r.reply_text, r.image_url, r.is_faculty_endorsed, r.is_verified);
  }

  // 12. Seed Class Announcements
  const sampleAnnouncements = [
    {
      id: 'anc_01',
      faculty_id: 'usr_fac_sharma_001',
      department: 'Computer Engineering',
      year: 'SE',
      division: 'B',
      subject_id: 'sub_java',
      title: 'Classroom Venue Relocation for Tomorrow',
      message: "Tomorrow's 10:00 AM Java Programming lecture will be conducted in Room 305 instead of Room 301 due to projector calibration.",
      priority: 'Important'
    },
    {
      id: 'anc_02',
      faculty_id: 'usr_fac_sharma_001',
      department: 'Computer Engineering',
      year: 'SE',
      division: 'B',
      subject_id: 'sub_java',
      title: 'Java Assignment 2 Submissions Due Friday',
      message: 'Please push your GitHub repository link to the LMS portal before 5:00 PM Friday. Late submissions incur a 10% penalty.',
      priority: 'Normal'
    }
  ];

  const ancStmt = db.prepare(`
    INSERT OR REPLACE INTO announcements (
      id, faculty_id, department, year, division, subject_id, title, message, priority
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const a of sampleAnnouncements) {
    ancStmt.run(a.id, a.faculty_id, a.department, a.year, a.division, a.subject_id, a.title, a.message, a.priority);
  }

  // 13. Seed Pinned FAQs
  const sampleFaqs = [
    {
      id: 'faq_01',
      page_id: 'page_ce_se_b_java',
      faculty_id: 'usr_fac_sharma_001',
      subject_id: 'sub_java',
      question: 'How do we submit the Java assignment?',
      answer: 'Submit through the official college assignment portal with your GitHub repository link before Friday 5:00 PM.',
      is_pinned: 1,
      display_order: 1
    },
    {
      id: 'faq_02',
      page_id: 'page_ce_se_b_java',
      faculty_id: 'usr_fac_sharma_001',
      subject_id: 'sub_java',
      question: 'Which JDK version should we install for the lab exercises?',
      answer: 'We recommend OpenJDK 17 LTS or OpenJDK 21 LTS with IntelliJ IDEA Community Edition.',
      is_pinned: 1,
      display_order: 2
    }
  ];

  const faqStmt = db.prepare(`
    INSERT OR REPLACE INTO faqs (
      id, page_id, faculty_id, subject_id, question, answer, is_pinned, display_order
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const f of sampleFaqs) {
    faqStmt.run(f.id, f.page_id, f.faculty_id, f.subject_id, f.question, f.answer, f.is_pinned, f.display_order);
  }

  // 14. Seed Academic Performance (Strict 1:1 Student Privacy)
  const sampleAcademicPerf = [
    {
      id: 'ap_shifa_java',
      student_id: 'usr_stu_shifa_001',
      faculty_id: 'usr_fac_sharma_001',
      subject_id: 'sub_java',
      department: 'Computer Engineering',
      year: 'SE',
      division: 'B',
      internal_marks: 18,
      max_marks: 20,
      attendance_percentage: 92,
      performance_status: 'Excellent',
      feedback: 'Outstanding problem-solving skills in OOP, Collections, and Exception Handling.',
      is_published: 1
    },
    {
      id: 'ap_shifa_dbms',
      student_id: 'usr_stu_shifa_001',
      faculty_id: 'usr_fac_sharma_001',
      subject_id: 'sub_dbms',
      department: 'Computer Engineering',
      year: 'SE',
      division: 'B',
      internal_marks: 17,
      max_marks: 20,
      attendance_percentage: 88,
      performance_status: 'Good',
      feedback: 'Good SQL query optimization and normalization understanding.',
      is_published: 1
    },
    {
      id: 'ap_alex_os',
      student_id: 'usr_stu_alex_002',
      faculty_id: 'usr_fac_cs_002',
      subject_id: 'sub_os',
      department: 'Computer Engineering',
      year: 'TE',
      division: 'A',
      internal_marks: 16,
      max_marks: 20,
      attendance_percentage: 85,
      performance_status: 'Good',
      feedback: 'Good grasp of process concurrency and memory pagination.',
      is_published: 1
    }
  ];

  const apStmt = db.prepare(`
    INSERT OR REPLACE INTO academic_performance (
      id, student_id, faculty_id, subject_id, department, year, division,
      internal_marks, max_marks, attendance_percentage, performance_status, feedback, is_published, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
  `);
  for (const ap of sampleAcademicPerf) {
    apStmt.run(
      ap.id, ap.student_id, ap.faculty_id, ap.subject_id, ap.department, ap.year, ap.division,
      ap.internal_marks, ap.max_marks, ap.attendance_percentage, ap.performance_status, ap.feedback, ap.is_published
    );
  }

  // 15. Seed Faculty Notifications
  const sampleNotifications = [
    {
      id: 'notif_fac_01',
      user_id: 'usr_fac_sharma_001',
      target_role: 'FACULTY',
      type: 'HELP_REQUEST',
      title: 'New Faculty Help Request',
      message: 'Shifa Siddiqui requested your guidance on: "How do custom exceptions work with Java multithreaded runnables?"',
      is_read: 0,
      link: '/faculty/doubts'
    },
    {
      id: 'notif_fac_02',
      user_id: 'usr_fac_sharma_001',
      target_role: 'FACULTY',
      type: 'CLUB_REG',
      title: 'New Club Registration',
      message: 'Alex Morgan registered for the Coding & Algorithmic Club.',
      is_read: 0,
      link: '/faculty/clubs-events'
    },
    {
      id: 'notif_fac_03',
      user_id: 'usr_fac_sharma_001',
      target_role: 'FACULTY',
      type: 'TIMETABLE_CHANGE',
      title: 'Classroom Allocation Confirmed',
      message: 'Your Tuesday Java Lab slot has been verified for Lab 201 (11:15 AM).',
      is_read: 1,
      link: '/faculty/timetable'
    }
  ];

  // 16. Seed Campus Lost & Found Items
  const sampleLostFound = [
    {
      id: 'lf_lost_01',
      user_id: 'usr_stu_shifa_001',
      user_name: 'Shifa Siddiqui',
      user_email: 'student@college.edu',
      user_role: 'STUDENT',
      type: 'LOST',
      item_name: 'Black Leather Wallet',
      category: 'Wallet',
      description: 'Black leather Fossil wallet containing college student ID card, library pass, and metro card.',
      location: 'Central Library 2nd Floor Reading Room',
      date: '2026-09-02',
      photo_url: 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=800&auto=format&fit=crop&q=60',
      status: 'ACTIVE',
      returned_at: null
    },
    {
      id: 'lf_found_02',
      user_id: 'usr_fac_sharma_001',
      user_name: "Sharma Ma'am",
      user_email: 'sharma@college.edu',
      user_role: 'FACULTY',
      type: 'FOUND',
      item_name: 'Scientific Calculator Casio fx-991EX',
      category: 'Electronics',
      description: 'Found on the podium table in Room 301 after the 10:00 AM lecture. Safe in faculty desk.',
      location: 'Engineering Block A - Room 301',
      date: '2026-09-03',
      photo_url: 'https://images.unsplash.com/photo-1587145820266-a5951ee6f620?w=800&auto=format&fit=crop&q=60',
      status: 'ACTIVE',
      returned_at: null
    },
    {
      id: 'lf_found_03',
      user_id: 'usr_stu_alex_002',
      user_name: 'Alex Morgan',
      user_email: 'student.alex@college.edu',
      user_role: 'STUDENT',
      type: 'FOUND',
      item_name: 'Set of 3 Keys with Batman Keychain',
      category: 'Keys',
      description: 'Found near Computer Lab 201 water dispenser. Handed over to department security desk.',
      location: 'IT Complex - Lab 201 Corridor',
      date: '2026-09-01',
      photo_url: null,
      status: 'ACTIVE',
      returned_at: null
    },
    {
      id: 'lf_lost_04',
      user_id: 'usr_stu_alex_002',
      user_name: 'Alex Morgan',
      user_email: 'student.alex@college.edu',
      user_role: 'STUDENT',
      type: 'LOST',
      item_name: 'Wireless Boat Airdopes Case (Black)',
      category: 'Electronics',
      description: 'Lost matte black charging case with left earbud missing near the cafeteria bench.',
      location: 'Student Cafeteria Lawn',
      date: '2026-08-30',
      photo_url: null,
      status: 'ACTIVE',
      returned_at: null
    },
    {
      id: 'lf_returned_05',
      user_id: 'usr_stu_shifa_001',
      user_name: 'Shifa Siddiqui',
      user_email: 'student@college.edu',
      user_role: 'STUDENT',
      type: 'FOUND',
      item_name: 'Blue Navy Umbrella',
      category: 'Accessories',
      description: 'Found in Seminar Hall 101 after the guest lecture. Successfully claimed by owner.',
      location: 'Seminar Hall 101',
      date: '2026-08-25',
      photo_url: null,
      status: 'RETURNED',
      returned_at: '2026-08-26 16:30:00'
    }
  ];

  const lfStmt = db.prepare(`
    INSERT OR REPLACE INTO lost_found_items (
      id, user_id, user_name, user_email, user_role, type, item_name, category,
      description, location, date, photo_url, status, returned_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
  `);

  for (const lf of sampleLostFound) {
    lfStmt.run(
      lf.id, lf.user_id, lf.user_name, lf.user_email, lf.user_role,
      lf.type, lf.item_name, lf.category, lf.description, lf.location,
      lf.date, lf.photo_url, lf.status, lf.returned_at
    );
  }

  console.log('✅ [Seeder] College dataset, clubs, events, doubts, academic performance, lost & found & reminders initialized successfully!');
  console.log('------------------------------------------------------------');
  console.log('🔐 [Demo Credentials for Testing / Viva]:');
  console.log('   👑 Admin:   admin@college.edu           | Password: Admin@123');
  console.log("   👩‍🏫 Faculty: sharma@college.edu          | Password: Faculty@123  (Sharma Ma'am)");
  console.log('   👨‍🏫 Faculty: faculty.cs@college.edu      | Password: Faculty@123  (Prof. Robert Downey)');
  console.log('   👩‍🎓 Student: student@college.edu         | Password: Student@123  (Shifa Siddiqui — SE-B)');
  console.log('   👨‍🎓 Student: student.alex@college.edu     | Password: Student@123  (Alex Morgan — TE-A)');
  console.log('   ⚠️ Suspended: suspended.student@college.edu | Password: Student@123');
  console.log('------------------------------------------------------------');
}

// Allow direct execution via CLI `node seed.js`
if (process.argv[1] && process.argv[1].endsWith('seed.js')) {
  seedDatabase().catch((err) => {
    console.error('❌ Seeder error:', err);
    process.exit(1);
  });
}
