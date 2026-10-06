import bcrypt from 'bcryptjs';
import { db, initDB } from './db.js';
import { ROLES, USER_STATUS, CLASSROOM_STATUS } from './constants.js';

/**
 * Seed accurate college dataset from official timetable documents
 */
export async function seedDatabase() {
  initDB();

  console.log('🌱 [Seeder] Initializing real college timetable dataset (NHITM Second Year)...');

  // 1. Seed Departments
  const sampleDepartments = [
    { id: 'dept_ce', name: 'Computer Engineering', code: 'CE', hod_name: 'Dr. Sanjay Sharma', status: 'Active' },
    { id: 'dept_aids', name: 'Artificial Intelligence & Data Science', code: 'AI&DS', hod_name: 'Dr. Megha V. Gupta', status: 'Active' },
    { id: 'dept_it', name: 'Information Technology', code: 'IT', hod_name: 'Dr. Rebecca Sterling', status: 'Active' },
    { id: 'dept_extc', name: 'Electronics & Telecommunication', code: 'EXTC', hod_name: 'Dr. Vikramaditya Rao', status: 'Active' },
    { id: 'dept_me', name: 'Mechanical Engineering', code: 'ME', hod_name: 'Dr. Harold Finch', status: 'Active' },
    { id: 'dept_civil', name: 'Civil Engineering', code: 'CIVIL', hod_name: 'Dr. Maya Lin', status: 'Active' }
  ];

  const deptStmt = db.prepare(`
    INSERT OR REPLACE INTO departments (id, name, code, hod_name, status) 
    VALUES (?, ?, ?, ?, ?)
  `);
  for (const dept of sampleDepartments) {
    deptStmt.run(dept.id, dept.name, dept.code, dept.hod_name, dept.status || 'Active');
  }

  // 2. Seed Academic Subjects (Semester III / 2026-27)
  db.exec(`
    PRAGMA foreign_keys = OFF;
    CREATE TABLE IF NOT EXISTS subjects_temp (
      id TEXT PRIMARY KEY,
      code TEXT NOT NULL,
      name TEXT NOT NULL,
      department TEXT NOT NULL,
      semester INTEGER,
      credits INTEGER DEFAULT 3
    );
    DROP TABLE IF EXISTS subjects;
    ALTER TABLE subjects_temp RENAME TO subjects;
    PRAGMA foreign_keys = ON;
  `);

  const sampleSubjects = [
    // Computer Engineering Subjects
    { id: 'sub_ce_mce', code: 'MCE', name: 'Mathematics for Computer Engineering', department: 'Computer Engineering', semester: 3, credits: 4 },
    { id: 'sub_ce_mce_tut', code: 'MCE(T)', name: 'Mathematics for Computer Engineering (Tutorial)', department: 'Computer Engineering', semester: 3, credits: 1 },
    { id: 'sub_ce_dsgt', code: 'DSGT', name: 'Discrete Structures and Graph Theory', department: 'Computer Engineering', semester: 3, credits: 4 },
    { id: 'sub_ce_aoa', code: 'AOA', name: 'Analysis of Algorithm', department: 'Computer Engineering', semester: 3, credits: 3 },
    { id: 'sub_ce_aoa_lab', code: 'AOAL', name: 'Analysis of Algorithm Lab', department: 'Computer Engineering', semester: 3, credits: 1 },
    { id: 'sub_ce_coa', code: 'COA', name: 'Computer Organization & Architecture', department: 'Computer Engineering', semester: 3, credits: 3 },
    { id: 'sub_ce_coa_lab', code: 'COAL', name: 'Computer Organization & Architecture Lab', department: 'Computer Engineering', semester: 3, credits: 1 },
    { id: 'sub_ce_fsjp', code: 'FSJP', name: 'Full Stack Java Programming', department: 'Computer Engineering', semester: 3, credits: 3 },
    { id: 'sub_ce_fsjp_lab', code: 'FSJPL', name: 'Full Stack Java Programming Lab', department: 'Computer Engineering', semester: 3, credits: 1 },
    { id: 'sub_ce_ed', code: 'ED', name: 'Entrepreneurship Development', department: 'Computer Engineering', semester: 3, credits: 2 },
    { id: 'sub_ce_ese', code: 'ESE', name: 'Environmental Science for Engineers', department: 'Computer Engineering', semester: 3, credits: 2 },
    { id: 'sub_ce_oe_fsh', code: 'OE-FSH', name: 'Open Elective: Food Safety & Hygiene', department: 'Computer Engineering', semester: 3, credits: 2 },

    // AI & Data Science Subjects
    { id: 'sub_aids_maths', code: 'MATHS', name: 'Mathematics for Computer Engineering', department: 'Artificial Intelligence & Data Science', semester: 3, credits: 4 },
    { id: 'sub_aids_maths_tut', code: 'MATHS(T)', name: 'Mathematics for Computer Engineering (Tutorial)', department: 'Artificial Intelligence & Data Science', semester: 3, credits: 1 },
    { id: 'sub_aids_dsgt', code: 'DSGT', name: 'Discrete Structures and Graph Theory', department: 'Artificial Intelligence & Data Science', semester: 3, credits: 4 },
    { id: 'sub_aids_aoa', code: 'AOA', name: 'Analysis of Algorithm', department: 'Artificial Intelligence & Data Science', semester: 3, credits: 3 },
    { id: 'sub_aids_aoa_lab', code: 'AOAL', name: 'Analysis of Algorithm Lab', department: 'Artificial Intelligence & Data Science', semester: 3, credits: 1 },
    { id: 'sub_aids_coa', code: 'COA', name: 'Computer Organization & Architecture', department: 'Artificial Intelligence & Data Science', semester: 3, credits: 3 },
    { id: 'sub_aids_coa_lab', code: 'COAL', name: 'Computer Organization and Architecture Lab', department: 'Artificial Intelligence & Data Science', semester: 3, credits: 1 },
    { id: 'sub_aids_fsjp', code: 'FSJP', name: 'Full Stack Java Programming', department: 'Artificial Intelligence & Data Science', semester: 3, credits: 3 },
    { id: 'sub_aids_fsjp_lab', code: 'FSJPL', name: 'Full Stack Java Programming Lab', department: 'Artificial Intelligence & Data Science', semester: 3, credits: 1 },
    { id: 'sub_aids_ed', code: 'ED', name: 'Entrepreneurship Development', department: 'Artificial Intelligence & Data Science', semester: 3, credits: 2 },
    { id: 'sub_aids_ese', code: 'ESE', name: 'Environmental Science for Engineers', department: 'Artificial Intelligence & Data Science', semester: 3, credits: 2 },
    { id: 'sub_aids_oe_fsh', code: 'OE-FSH', name: 'Open Elective: Food Safety & Hygiene', department: 'Artificial Intelligence & Data Science', semester: 3, credits: 2 },

    // Legacy Course compatibility records
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
    // Admin Account
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

    // --- COMPUTER ENGINEERING FACULTY ---
    {
      id: 'usr_fac_sharma_001',
      name: "Dr. Sanjay Sharma",
      email: 'sharma@college.edu',
      password_hash: facultyHash,
      role: ROLES.FACULTY,
      department: 'Computer Engineering',
      year: null,
      division: null,
      roll_number: null,
      status: USER_STATUS.ACTIVE,
      assigned_subjects: JSON.stringify(['Mathematics for Computer Engineering', 'Analysis of Algorithm']),
      assigned_classes: JSON.stringify(['SE-A', 'SE-B', 'SE-C'])
    },
    {
      id: 'usr_fac_act_001',
      name: 'Ms. Aarti C Tapadiya (ACT)',
      email: 'aarti.tapadiya@college.edu',
      password_hash: facultyHash,
      role: ROLES.FACULTY,
      department: 'Computer Engineering',
      year: null,
      division: null,
      roll_number: null,
      status: USER_STATUS.ACTIVE,
      assigned_subjects: JSON.stringify(['Discrete Structures and Graph Theory']),
      assigned_classes: JSON.stringify(['SE-A', 'SE-B'])
    },
    {
      id: 'usr_fac_yrc_001',
      name: 'Ms. Yogita R Chavan (YRC)',
      email: 'yogita.chavan@college.edu',
      password_hash: facultyHash,
      role: ROLES.FACULTY,
      department: 'Computer Engineering',
      year: null,
      division: null,
      roll_number: null,
      status: USER_STATUS.ACTIVE,
      assigned_subjects: JSON.stringify(['Analysis of Algorithm', 'Analysis of Algorithm Lab']),
      assigned_classes: JSON.stringify(['SE-A', 'SE-B'])
    },
    {
      id: 'usr_fac_asd_001',
      name: 'Ms. Awanti S Dhekane (ASD)',
      email: 'awanti.dhekane@college.edu',
      password_hash: facultyHash,
      role: ROLES.FACULTY,
      department: 'Computer Engineering',
      year: null,
      division: null,
      roll_number: null,
      status: USER_STATUS.ACTIVE,
      assigned_subjects: JSON.stringify(['Computer Organization & Architecture', 'Computer Organization & Architecture Lab']),
      assigned_classes: JSON.stringify(['SE-A', 'SE-C'])
    },
    {
      id: 'usr_fac_aap_001',
      name: 'Ms. Ankita A Pange (AAP)',
      email: 'ankita.pange@college.edu',
      password_hash: facultyHash,
      role: ROLES.FACULTY,
      department: 'Computer Engineering',
      year: null,
      division: null,
      roll_number: null,
      status: USER_STATUS.ACTIVE,
      assigned_subjects: JSON.stringify(['Full Stack Java Programming', 'Full Stack Java Programming Lab']),
      assigned_classes: JSON.stringify(['SE-A', 'SE-B'])
    },
    {
      id: 'usr_fac_csj_001',
      name: 'Ms. Chrisoline Sarah J (CSJ)',
      email: 'chrisoline.sarah@college.edu',
      password_hash: facultyHash,
      role: ROLES.FACULTY,
      department: 'Computer Engineering',
      year: null,
      division: null,
      roll_number: null,
      status: USER_STATUS.ACTIVE,
      assigned_subjects: JSON.stringify(['Mathematics for Computer Engineering']),
      assigned_classes: JSON.stringify(['SE-A'])
    },
    {
      id: 'usr_fac_mp_001',
      name: 'Mr. Malagouda Poojary (MP)',
      email: 'malagouda.poojary@college.edu',
      password_hash: facultyHash,
      role: ROLES.FACULTY,
      department: 'Computer Engineering',
      year: null,
      division: null,
      roll_number: null,
      status: USER_STATUS.ACTIVE,
      assigned_subjects: JSON.stringify(['Mathematics for Computer Engineering (Tutorial)']),
      assigned_classes: JSON.stringify(['SE-A', 'SE-B', 'SE-C'])
    },
    {
      id: 'usr_fac_sjk_001',
      name: 'Ms. Shaheen J Khan (SJK)',
      email: 'shaheen.khan@college.edu',
      password_hash: facultyHash,
      role: ROLES.FACULTY,
      department: 'Computer Engineering',
      year: null,
      division: null,
      roll_number: null,
      status: USER_STATUS.ACTIVE,
      assigned_subjects: JSON.stringify(['Mathematics for Computer Engineering']),
      assigned_classes: JSON.stringify(['SE-B'])
    },
    {
      id: 'usr_fac_kgs_001',
      name: 'Ms. Khushboo Singh (KGS)',
      email: 'khushboo.singh@college.edu',
      password_hash: facultyHash,
      role: ROLES.FACULTY,
      department: 'Computer Engineering',
      year: null,
      division: null,
      roll_number: null,
      status: USER_STATUS.ACTIVE,
      assigned_subjects: JSON.stringify(['Computer Organization & Architecture', 'Computer Organization & Architecture Lab']),
      assigned_classes: JSON.stringify(['SE-B'])
    },
    {
      id: 'usr_fac_rb_001',
      name: 'Ms. Rutuja Bandbe (RB)',
      email: 'rutuja.bandbe@college.edu',
      password_hash: facultyHash,
      role: ROLES.FACULTY,
      department: 'Computer Engineering',
      year: null,
      division: null,
      roll_number: null,
      status: USER_STATUS.ACTIVE,
      assigned_subjects: JSON.stringify(['Mathematics for Computer Engineering']),
      assigned_classes: JSON.stringify(['SE-C'])
    },
    {
      id: 'usr_fac_mvd_001',
      name: 'Ms. Monal Vijay Dahake (MVD)',
      email: 'monal.dahake@college.edu',
      password_hash: facultyHash,
      role: ROLES.FACULTY,
      department: 'Computer Engineering',
      year: null,
      division: null,
      roll_number: null,
      status: USER_STATUS.ACTIVE,
      assigned_subjects: JSON.stringify(['Discrete Structures and Graph Theory']),
      assigned_classes: JSON.stringify(['SE-C'])
    },
    {
      id: 'usr_fac_mp_patil_001',
      name: 'Ms. Meenal Patil (MP)',
      email: 'meenal.patil@college.edu',
      password_hash: facultyHash,
      role: ROLES.FACULTY,
      department: 'Computer Engineering',
      year: null,
      division: null,
      roll_number: null,
      status: USER_STATUS.ACTIVE,
      assigned_subjects: JSON.stringify(['Analysis of Algorithm', 'Analysis of Algorithm Lab']),
      assigned_classes: JSON.stringify(['SE-C'])
    },
    {
      id: 'usr_fac_csp_001',
      name: 'Ms. Charushila S Pawar (CSP)',
      email: 'charushila.pawar@college.edu',
      password_hash: facultyHash,
      role: ROLES.FACULTY,
      department: 'Computer Engineering',
      year: null,
      division: null,
      roll_number: null,
      status: USER_STATUS.ACTIVE,
      assigned_subjects: JSON.stringify(['Full Stack Java Programming', 'Full Stack Java Programming Lab']),
      assigned_classes: JSON.stringify(['SE-C'])
    },

    // --- AI & DATA SCIENCE FACULTY ---
    {
      id: 'usr_fac_megha_001',
      name: 'Dr. Megha V. Gupta',
      email: 'megha.gupta@college.edu',
      password_hash: facultyHash,
      role: ROLES.FACULTY,
      department: 'Artificial Intelligence & Data Science',
      year: null,
      division: null,
      roll_number: null,
      status: USER_STATUS.ACTIVE,
      assigned_subjects: JSON.stringify(['Artificial Intelligence']),
      assigned_classes: JSON.stringify(['SE-A', 'SE-B'])
    },
    {
      id: 'usr_fac_ymd_001',
      name: 'Ms. Yojana Dehankar (YMD)',
      email: 'yojana.dehankar@college.edu',
      password_hash: facultyHash,
      role: ROLES.FACULTY,
      department: 'Artificial Intelligence & Data Science',
      year: null,
      division: null,
      roll_number: null,
      status: USER_STATUS.ACTIVE,
      assigned_subjects: JSON.stringify(['Full Stack Java Programming', 'Full Stack Java Programming Lab']),
      assigned_classes: JSON.stringify(['SE-A'])
    },
    {
      id: 'usr_fac_gvk_001',
      name: 'Dr. Geetanjali Kale (GVK)',
      email: 'geetanjali.kale@college.edu',
      password_hash: facultyHash,
      role: ROLES.FACULTY,
      department: 'Artificial Intelligence & Data Science',
      year: null,
      division: null,
      roll_number: null,
      status: USER_STATUS.ACTIVE,
      assigned_subjects: JSON.stringify(['Computer Organization & Architecture', 'Computer Organization and Architecture Lab']),
      assigned_classes: JSON.stringify(['SE-A', 'SE-B'])
    },
    {
      id: 'usr_fac_ppu_001',
      name: 'Mr. Pratyush Urade (PPU)',
      email: 'pratyush.urade@college.edu',
      password_hash: facultyHash,
      role: ROLES.FACULTY,
      department: 'Artificial Intelligence & Data Science',
      year: null,
      division: null,
      roll_number: null,
      status: USER_STATUS.ACTIVE,
      assigned_subjects: JSON.stringify(['Analysis of Algorithm', 'Analysis of Algorithm Lab']),
      assigned_classes: JSON.stringify(['SE-A', 'SE-B'])
    },
    {
      id: 'usr_fac_shn_001',
      name: 'Ms. Sangita Nikumbh (SHN)',
      email: 'sangita.nikumbh@college.edu',
      password_hash: facultyHash,
      role: ROLES.FACULTY,
      department: 'Artificial Intelligence & Data Science',
      year: null,
      division: null,
      roll_number: null,
      status: USER_STATUS.ACTIVE,
      assigned_subjects: JSON.stringify(['Discrete Structures and Graph Theory']),
      assigned_classes: JSON.stringify(['SE-A', 'SE-B'])
    },
    {
      id: 'usr_fac_bd_001',
      name: 'Ms. Bhakti Deshmukh (BD)',
      email: 'bhakti.deshmukh@college.edu',
      password_hash: facultyHash,
      role: ROLES.FACULTY,
      department: 'Artificial Intelligence & Data Science',
      year: null,
      division: null,
      roll_number: null,
      status: USER_STATUS.ACTIVE,
      assigned_subjects: JSON.stringify(['Full Stack Java Programming', 'Full Stack Java Programming Lab']),
      assigned_classes: JSON.stringify(['SE-B'])
    },

    // Additional Faculty from Demo Set
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
      assigned_classes: JSON.stringify(['TE-A', 'BE-A'])
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

    // --- STUDENT ACCOUNTS ---
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
    },
    // Computer Engineering SE-B Cohort
    {
      id: 'usr_stu_soham_005',
      name: 'Soham Deshmukh',
      email: 'soham@college.edu',
      password_hash: studentHash,
      role: ROLES.STUDENT,
      department: 'Computer Engineering',
      year: 'SE',
      division: 'B',
      roll_number: '04',
      status: USER_STATUS.ACTIVE,
      assigned_subjects: null,
      assigned_classes: null
    },
    {
      id: 'usr_stu_aryan_006',
      name: 'Aryan Kadam',
      email: 'aryan@college.edu',
      password_hash: studentHash,
      role: ROLES.STUDENT,
      department: 'Computer Engineering',
      year: 'SE',
      division: 'B',
      roll_number: '15',
      status: USER_STATUS.ACTIVE,
      assigned_subjects: null,
      assigned_classes: null
    },
    {
      id: 'usr_stu_riya_007',
      name: 'Riya Shah',
      email: 'riya@college.edu',
      password_hash: studentHash,
      role: ROLES.STUDENT,
      department: 'Computer Engineering',
      year: 'SE',
      division: 'B',
      roll_number: '32',
      status: USER_STATUS.ACTIVE,
      assigned_subjects: null,
      assigned_classes: null
    },
    {
      id: 'usr_stu_tanvi_008',
      name: 'Tanvi Sawant',
      email: 'tanvi@college.edu',
      password_hash: studentHash,
      role: ROLES.STUDENT,
      department: 'Computer Engineering',
      year: 'SE',
      division: 'B',
      roll_number: '48',
      status: USER_STATUS.ACTIVE,
      assigned_subjects: null,
      assigned_classes: null
    },
    // Computer Engineering SE-A Cohort
    {
      id: 'usr_stu_aditya_009',
      name: 'Aditya Patil',
      email: 'aditya@college.edu',
      password_hash: studentHash,
      role: ROLES.STUDENT,
      department: 'Computer Engineering',
      year: 'SE',
      division: 'A',
      roll_number: '01',
      status: USER_STATUS.ACTIVE,
      assigned_subjects: null,
      assigned_classes: null
    },
    {
      id: 'usr_stu_neha_010',
      name: 'Neha Joshi',
      email: 'neha@college.edu',
      password_hash: studentHash,
      role: ROLES.STUDENT,
      department: 'Computer Engineering',
      year: 'SE',
      division: 'A',
      roll_number: '18',
      status: USER_STATUS.ACTIVE,
      assigned_subjects: null,
      assigned_classes: null
    },
    // AI&DS SE-B Cohort
    {
      id: 'usr_stu_rohan_011',
      name: 'Rohan Gupta',
      email: 'rohan@college.edu',
      password_hash: studentHash,
      role: ROLES.STUDENT,
      department: 'Artificial Intelligence & Data Science',
      year: 'SE',
      division: 'B',
      roll_number: '05',
      status: USER_STATUS.ACTIVE,
      assigned_subjects: null,
      assigned_classes: null
    },
    {
      id: 'usr_stu_sneha_012',
      name: 'Sneha Kulkarni',
      email: 'sneha@college.edu',
      password_hash: studentHash,
      role: ROLES.STUDENT,
      department: 'Artificial Intelligence & Data Science',
      year: 'SE',
      division: 'B',
      roll_number: '14',
      status: USER_STATUS.ACTIVE,
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
    { id: 'cls_ce_se_a', department: 'Computer Engineering', year: 'SE', division: 'A', class_teacher_id: 'usr_fac_act_001' },
    { id: 'cls_ce_se_b', department: 'Computer Engineering', year: 'SE', division: 'B', class_teacher_id: 'usr_fac_aap_001' },
    { id: 'cls_ce_se_c', department: 'Computer Engineering', year: 'SE', division: 'C', class_teacher_id: 'usr_fac_asd_001' },
    { id: 'cls_aids_se_a', department: 'Artificial Intelligence & Data Science', year: 'SE', division: 'A', class_teacher_id: 'usr_fac_ymd_001' },
    { id: 'cls_aids_se_b', department: 'Artificial Intelligence & Data Science', year: 'SE', division: 'B', class_teacher_id: 'usr_fac_gvk_001' },
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

  // 5. Seed Classrooms & Labs
  const sampleClassrooms = [
    // Lecture Theatres / Classrooms
    { id: 'crm_lg004', room_number: 'LG004', classroom_type: 'Classroom', building: 'Lower Ground Wing', floor: 'Ground Floor', capacity: 70, status: CLASSROOM_STATUS.ACTIVE, has_projector: 1, is_available: 1 },
    { id: 'crm_ff101', room_number: 'FF101', classroom_type: 'Classroom', building: 'Engineering Block', floor: '1st Floor', capacity: 70, status: CLASSROOM_STATUS.ACTIVE, has_projector: 1, is_available: 1 },
    { id: 'crm_ff102', room_number: 'FF102', classroom_type: 'Classroom', building: 'Engineering Block', floor: '1st Floor', capacity: 70, status: CLASSROOM_STATUS.ACTIVE, has_projector: 1, is_available: 1 },
    { id: 'crm_f102', room_number: 'F102', classroom_type: 'Classroom', building: 'Engineering Block', floor: '1st Floor', capacity: 70, status: CLASSROOM_STATUS.ACTIVE, has_projector: 1, is_available: 1 },
    { id: 'crm_ff109', room_number: 'FF109', classroom_type: 'Classroom', building: 'Engineering Block', floor: '1st Floor', capacity: 70, status: CLASSROOM_STATUS.ACTIVE, has_projector: 1, is_available: 1 },
    { id: 'crm_ff112', room_number: 'FF112', classroom_type: 'Classroom', building: 'Engineering Block', floor: '1st Floor', capacity: 70, status: CLASSROOM_STATUS.ACTIVE, has_projector: 1, is_available: 1 },
    { id: 'crm_ff113', room_number: 'FF113', classroom_type: 'Classroom', building: 'Engineering Block', floor: '1st Floor', capacity: 70, status: CLASSROOM_STATUS.ACTIVE, has_projector: 1, is_available: 1 },

    // First Floor Labs
    { id: 'crm_ff119', room_number: 'FF119', classroom_type: 'Computer Lab', building: 'Tech Wing', floor: '1st Floor', capacity: 35, status: CLASSROOM_STATUS.ACTIVE, has_projector: 1, is_available: 1 },
    { id: 'crm_ff120', room_number: 'FF120', classroom_type: 'Computer Lab', building: 'Tech Wing', floor: '1st Floor', capacity: 35, status: CLASSROOM_STATUS.ACTIVE, has_projector: 1, is_available: 1 },
    { id: 'crm_ff121', room_number: 'FF121', classroom_type: 'Computer Lab', building: 'Tech Wing', floor: '1st Floor', capacity: 35, status: CLASSROOM_STATUS.ACTIVE, has_projector: 1, is_available: 1 },
    { id: 'crm_ff123', room_number: 'FF123', classroom_type: 'Computer Lab', building: 'Tech Wing', floor: '1st Floor', capacity: 35, status: CLASSROOM_STATUS.ACTIVE, has_projector: 1, is_available: 1 },
    { id: 'crm_ff124', room_number: 'FF124', classroom_type: 'Computer Lab', building: 'Tech Wing', floor: '1st Floor', capacity: 35, status: CLASSROOM_STATUS.ACTIVE, has_projector: 1, is_available: 1 },
    { id: 'crm_ff125', room_number: 'FF125', classroom_type: 'Computer Lab', building: 'Tech Wing', floor: '1st Floor', capacity: 35, status: CLASSROOM_STATUS.ACTIVE, has_projector: 1, is_available: 1 },

    // Second Floor Labs
    { id: 'crm_sf201', room_number: 'SF201', classroom_type: 'Computer Lab', building: 'IT Complex', floor: '2nd Floor', capacity: 35, status: CLASSROOM_STATUS.ACTIVE, has_projector: 1, is_available: 1 },
    { id: 'crm_sf202', room_number: 'SF202', classroom_type: 'Computer Lab', building: 'IT Complex', floor: '2nd Floor', capacity: 35, status: CLASSROOM_STATUS.ACTIVE, has_projector: 1, is_available: 1 },
    { id: 'crm_sf203', room_number: 'SF203', classroom_type: 'Computer Lab', building: 'IT Complex', floor: '2nd Floor', capacity: 35, status: CLASSROOM_STATUS.ACTIVE, has_projector: 1, is_available: 1 },
    { id: 'crm_sf204', room_number: 'SF204', classroom_type: 'Computer Lab', building: 'IT Complex', floor: '2nd Floor', capacity: 35, status: CLASSROOM_STATUS.ACTIVE, has_projector: 1, is_available: 1 },
    { id: 'crm_sf207', room_number: 'SF207', classroom_type: 'Computer Lab', building: 'IT Complex', floor: '2nd Floor', capacity: 35, status: CLASSROOM_STATUS.ACTIVE, has_projector: 1, is_available: 1 },
    { id: 'crm_sf209', room_number: 'SF209', classroom_type: 'Computer Lab', building: 'IT Complex', floor: '2nd Floor', capacity: 35, status: CLASSROOM_STATUS.ACTIVE, has_projector: 1, is_available: 1 },
    { id: 'crm_sf210', room_number: 'SF210', classroom_type: 'Computer Lab', building: 'IT Complex', floor: '2nd Floor', capacity: 35, status: CLASSROOM_STATUS.ACTIVE, has_projector: 1, is_available: 1 },
    { id: 'crm_sf211', room_number: 'SF211', classroom_type: 'Computer Lab', building: 'IT Complex', floor: '2nd Floor', capacity: 35, status: CLASSROOM_STATUS.ACTIVE, has_projector: 1, is_available: 1 },
    { id: 'crm_sf219', room_number: 'SF219', classroom_type: 'Computer Lab', building: 'IT Complex', floor: '2nd Floor', capacity: 35, status: CLASSROOM_STATUS.ACTIVE, has_projector: 1, is_available: 1 },

    // Additional College Facilities
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

  // 6. Clear Old Timetables & Seed Real Timetable Schedules from Attached Images
  db.prepare('DELETE FROM timetables').run();

  const realTimetables = [
    // =========================================================================
    // 1. COMPUTER ENGINEERING — DIVISION A (SE, Sem III, 2026-27)
    // =========================================================================
    // --- MONDAY ---
    { id: 'tt_ce_a_mon_1', class_id: 'cls_ce_se_a', day_of_week: 'Monday', period_number: 1, start_time: '09:15', end_time: '11:15', subject_id: 'sub_ce_coa_lab', faculty_id: 'usr_fac_asd_001', classroom_id: 'crm_ff123', semester: 3 },
    { id: 'tt_ce_a_mon_2', class_id: 'cls_ce_se_a', day_of_week: 'Monday', period_number: 1, start_time: '09:15', end_time: '11:15', subject_id: 'sub_ce_aoa_lab', faculty_id: 'usr_fac_yrc_001', classroom_id: 'crm_ff125', semester: 3 },
    { id: 'tt_ce_a_mon_3', class_id: 'cls_ce_se_a', day_of_week: 'Monday', period_number: 1, start_time: '09:15', end_time: '11:15', subject_id: 'sub_ce_fsjp_lab', faculty_id: 'usr_fac_aap_001', classroom_id: 'crm_ff121', semester: 3 },
    { id: 'tt_ce_a_mon_4', class_id: 'cls_ce_se_a', day_of_week: 'Monday', period_number: 3, start_time: '11:30', end_time: '12:30', subject_id: 'sub_ce_coa', faculty_id: 'usr_fac_asd_001', classroom_id: 'crm_ff101', semester: 3 },
    { id: 'tt_ce_a_mon_5', class_id: 'cls_ce_se_a', day_of_week: 'Monday', period_number: 4, start_time: '12:30', end_time: '13:30', subject_id: 'sub_ce_mce', faculty_id: 'usr_fac_csj_001', classroom_id: 'crm_ff101', semester: 3 },

    // --- TUESDAY ---
    { id: 'tt_ce_a_tue_1', class_id: 'cls_ce_se_a', day_of_week: 'Tuesday', period_number: 1, start_time: '09:15', end_time: '11:15', subject_id: 'sub_ce_fsjp_lab', faculty_id: 'usr_fac_aap_001', classroom_id: 'crm_ff121', semester: 3 },
    { id: 'tt_ce_a_tue_2', class_id: 'cls_ce_se_a', day_of_week: 'Tuesday', period_number: 1, start_time: '09:15', end_time: '11:15', subject_id: 'sub_ce_coa_lab', faculty_id: 'usr_fac_asd_001', classroom_id: 'crm_ff123', semester: 3 },
    { id: 'tt_ce_a_tue_3', class_id: 'cls_ce_se_a', day_of_week: 'Tuesday', period_number: 1, start_time: '09:15', end_time: '11:15', subject_id: 'sub_ce_aoa_lab', faculty_id: 'usr_fac_yrc_001', classroom_id: 'crm_ff125', semester: 3 },
    { id: 'tt_ce_a_tue_4', class_id: 'cls_ce_se_a', day_of_week: 'Tuesday', period_number: 3, start_time: '11:30', end_time: '12:30', subject_id: 'sub_ce_mce', faculty_id: 'usr_fac_csj_001', classroom_id: 'crm_ff101', semester: 3 },
    { id: 'tt_ce_a_tue_5', class_id: 'cls_ce_se_a', day_of_week: 'Tuesday', period_number: 4, start_time: '12:30', end_time: '13:30', subject_id: 'sub_ce_aoa', faculty_id: 'usr_fac_yrc_001', classroom_id: 'crm_ff101', semester: 3 },
    { id: 'tt_ce_a_tue_6', class_id: 'cls_ce_se_a', day_of_week: 'Tuesday', period_number: 5, start_time: '14:00', end_time: '15:00', subject_id: 'sub_ce_coa', faculty_id: 'usr_fac_asd_001', classroom_id: 'crm_ff101', semester: 3 },

    // --- WEDNESDAY ---
    { id: 'tt_ce_a_wed_1', class_id: 'cls_ce_se_a', day_of_week: 'Wednesday', period_number: 1, start_time: '09:15', end_time: '11:15', subject_id: 'sub_ce_aoa_lab', faculty_id: 'usr_fac_yrc_001', classroom_id: 'crm_ff125', semester: 3 },
    { id: 'tt_ce_a_wed_2', class_id: 'cls_ce_se_a', day_of_week: 'Wednesday', period_number: 1, start_time: '09:15', end_time: '11:15', subject_id: 'sub_ce_fsjp_lab', faculty_id: 'usr_fac_aap_001', classroom_id: 'crm_ff121', semester: 3 },
    { id: 'tt_ce_a_wed_3', class_id: 'cls_ce_se_a', day_of_week: 'Wednesday', period_number: 1, start_time: '09:15', end_time: '11:15', subject_id: 'sub_ce_coa_lab', faculty_id: 'usr_fac_asd_001', classroom_id: 'crm_ff119', semester: 3 },
    { id: 'tt_ce_a_wed_4', class_id: 'cls_ce_se_a', day_of_week: 'Wednesday', period_number: 3, start_time: '11:30', end_time: '12:30', subject_id: 'sub_ce_dsgt', faculty_id: 'usr_fac_act_001', classroom_id: 'crm_ff101', semester: 3 },
    { id: 'tt_ce_a_wed_5', class_id: 'cls_ce_se_a', day_of_week: 'Wednesday', period_number: 4, start_time: '12:30', end_time: '13:30', subject_id: 'sub_ce_mce', faculty_id: 'usr_fac_csj_001', classroom_id: 'crm_ff101', semester: 3 },
    { id: 'tt_ce_a_wed_6', class_id: 'cls_ce_se_a', day_of_week: 'Wednesday', period_number: 5, start_time: '14:00', end_time: '15:00', subject_id: 'sub_ce_aoa', faculty_id: 'usr_fac_yrc_001', classroom_id: 'crm_ff101', semester: 3 },

    // --- THURSDAY ---
    { id: 'tt_ce_a_thu_1', class_id: 'cls_ce_se_a', day_of_week: 'Thursday', period_number: 1, start_time: '09:15', end_time: '10:15', subject_id: 'sub_ce_aoa', faculty_id: 'usr_fac_yrc_001', classroom_id: 'crm_ff101', semester: 3 },
    { id: 'tt_ce_a_thu_2', class_id: 'cls_ce_se_a', day_of_week: 'Thursday', period_number: 2, start_time: '10:15', end_time: '11:15', subject_id: 'sub_ce_mce_tut', faculty_id: 'usr_fac_mp_001', classroom_id: 'crm_ff101', semester: 3 },
    { id: 'tt_ce_a_thu_3', class_id: 'cls_ce_se_a', day_of_week: 'Thursday', period_number: 3, start_time: '11:30', end_time: '12:30', subject_id: 'sub_ce_fsjp', faculty_id: 'usr_fac_aap_001', classroom_id: 'crm_ff101', semester: 3 },
    { id: 'tt_ce_a_thu_4', class_id: 'cls_ce_se_a', day_of_week: 'Thursday', period_number: 4, start_time: '12:30', end_time: '13:30', subject_id: 'sub_ce_dsgt', faculty_id: 'usr_fac_act_001', classroom_id: 'crm_ff101', semester: 3 },

    // --- FRIDAY ---
    { id: 'tt_ce_a_fri_1', class_id: 'cls_ce_se_a', day_of_week: 'Friday', period_number: 1, start_time: '09:15', end_time: '10:15', subject_id: 'sub_ce_coa', faculty_id: 'usr_fac_asd_001', classroom_id: 'crm_ff101', semester: 3 },
    { id: 'tt_ce_a_fri_2', class_id: 'cls_ce_se_a', day_of_week: 'Friday', period_number: 2, start_time: '10:15', end_time: '11:15', subject_id: 'sub_ce_fsjp', faculty_id: 'usr_fac_aap_001', classroom_id: 'crm_ff101', semester: 3 },
    { id: 'tt_ce_a_fri_3', class_id: 'cls_ce_se_a', day_of_week: 'Friday', period_number: 3, start_time: '11:30', end_time: '12:30', subject_id: 'sub_ce_dsgt', faculty_id: 'usr_fac_act_001', classroom_id: 'crm_ff101', semester: 3 },

    // =========================================================================
    // 2. COMPUTER ENGINEERING — DIVISION B (SE, Sem III, 2026-27)
    // =========================================================================
    // --- MONDAY ---
    { id: 'tt_ce_b_mon_1', class_id: 'cls_ce_se_b', day_of_week: 'Monday', period_number: 1, start_time: '09:15', end_time: '10:15', subject_id: 'sub_ce_mce', faculty_id: 'usr_fac_sjk_001', classroom_id: 'crm_ff101', semester: 3 },
    { id: 'tt_ce_b_mon_2', class_id: 'cls_ce_se_b', day_of_week: 'Monday', period_number: 2, start_time: '10:15', end_time: '11:15', subject_id: 'sub_ce_coa', faculty_id: 'usr_fac_kgs_001', classroom_id: 'crm_ff101', semester: 3 },
    { id: 'tt_ce_b_mon_3', class_id: 'cls_ce_se_b', day_of_week: 'Monday', period_number: 3, start_time: '11:30', end_time: '12:30', subject_id: 'sub_ce_aoa', faculty_id: 'usr_fac_yrc_001', classroom_id: 'crm_ff102', semester: 3 },
    { id: 'tt_ce_b_mon_4', class_id: 'cls_ce_se_b', day_of_week: 'Monday', period_number: 4, start_time: '12:30', end_time: '13:30', subject_id: 'sub_ce_fsjp', faculty_id: 'usr_fac_aap_001', classroom_id: 'crm_ff102', semester: 3 },

    // --- TUESDAY ---
    { id: 'tt_ce_b_tue_1', class_id: 'cls_ce_se_b', day_of_week: 'Tuesday', period_number: 1, start_time: '09:15', end_time: '10:15', subject_id: 'sub_ce_coa', faculty_id: 'usr_fac_kgs_001', classroom_id: 'crm_ff101', semester: 3 },
    { id: 'tt_ce_b_tue_2', class_id: 'cls_ce_se_b', day_of_week: 'Tuesday', period_number: 2, start_time: '10:15', end_time: '11:15', subject_id: 'sub_ce_mce', faculty_id: 'usr_fac_sjk_001', classroom_id: 'crm_ff101', semester: 3 },
    { id: 'tt_ce_b_tue_3', class_id: 'cls_ce_se_b', day_of_week: 'Tuesday', period_number: 3, start_time: '11:30', end_time: '12:30', subject_id: 'sub_ce_dsgt', faculty_id: 'usr_fac_act_001', classroom_id: 'crm_ff102', semester: 3 },

    // --- WEDNESDAY ---
    { id: 'tt_ce_b_wed_1', class_id: 'cls_ce_se_b', day_of_week: 'Wednesday', period_number: 1, start_time: '09:15', end_time: '10:15', subject_id: 'sub_ce_mce', faculty_id: 'usr_fac_sjk_001', classroom_id: 'crm_ff101', semester: 3 },
    { id: 'tt_ce_b_wed_2', class_id: 'cls_ce_se_b', day_of_week: 'Wednesday', period_number: 2, start_time: '10:15', end_time: '11:15', subject_id: 'sub_ce_mce_tut', faculty_id: 'usr_fac_mp_001', classroom_id: 'crm_ff101', semester: 3 },
    { id: 'tt_ce_b_wed_3', class_id: 'cls_ce_se_b', day_of_week: 'Wednesday', period_number: 3, start_time: '11:30', end_time: '13:30', subject_id: 'sub_ce_coa_lab', faculty_id: 'usr_fac_kgs_001', classroom_id: 'crm_ff123', semester: 3 },
    { id: 'tt_ce_b_wed_4', class_id: 'cls_ce_se_b', day_of_week: 'Wednesday', period_number: 3, start_time: '11:30', end_time: '13:30', subject_id: 'sub_ce_aoa_lab', faculty_id: 'usr_fac_yrc_001', classroom_id: 'crm_ff125', semester: 3 },
    { id: 'tt_ce_b_wed_5', class_id: 'cls_ce_se_b', day_of_week: 'Wednesday', period_number: 3, start_time: '11:30', end_time: '13:30', subject_id: 'sub_ce_fsjp_lab', faculty_id: 'usr_fac_aap_001', classroom_id: 'crm_ff120', semester: 3 },

    // --- THURSDAY ---
    { id: 'tt_ce_b_thu_1', class_id: 'cls_ce_se_b', day_of_week: 'Thursday', period_number: 1, start_time: '09:15', end_time: '10:15', subject_id: 'sub_ce_fsjp', faculty_id: 'usr_fac_aap_001', classroom_id: 'crm_ff102', semester: 3 },
    { id: 'tt_ce_b_thu_2', class_id: 'cls_ce_se_b', day_of_week: 'Thursday', period_number: 2, start_time: '10:15', end_time: '11:15', subject_id: 'sub_ce_dsgt', faculty_id: 'usr_fac_act_001', classroom_id: 'crm_ff102', semester: 3 },
    { id: 'tt_ce_b_thu_3', class_id: 'cls_ce_se_b', day_of_week: 'Thursday', period_number: 3, start_time: '11:30', end_time: '12:30', subject_id: 'sub_ce_aoa', faculty_id: 'usr_fac_yrc_001', classroom_id: 'crm_ff102', semester: 3 },
    { id: 'tt_ce_b_thu_4', class_id: 'cls_ce_se_b', day_of_week: 'Thursday', period_number: 4, start_time: '12:30', end_time: '13:30', subject_id: 'sub_ce_coa', faculty_id: 'usr_fac_kgs_001', classroom_id: 'crm_ff102', semester: 3 },
    { id: 'tt_ce_b_thu_5', class_id: 'cls_ce_se_b', day_of_week: 'Thursday', period_number: 5, start_time: '14:00', end_time: '16:00', subject_id: 'sub_ce_fsjp_lab', faculty_id: 'usr_fac_aap_001', classroom_id: 'crm_ff120', semester: 3 },
    { id: 'tt_ce_b_thu_6', class_id: 'cls_ce_se_b', day_of_week: 'Thursday', period_number: 5, start_time: '14:00', end_time: '16:00', subject_id: 'sub_ce_coa_lab', faculty_id: 'usr_fac_kgs_001', classroom_id: 'crm_ff119', semester: 3 },
    { id: 'tt_ce_b_thu_7', class_id: 'cls_ce_se_b', day_of_week: 'Thursday', period_number: 5, start_time: '14:00', end_time: '16:00', subject_id: 'sub_ce_aoa_lab', faculty_id: 'usr_fac_yrc_001', classroom_id: 'crm_ff125', semester: 3 },

    // --- FRIDAY ---
    { id: 'tt_ce_b_fri_1', class_id: 'cls_ce_se_b', day_of_week: 'Friday', period_number: 1, start_time: '09:15', end_time: '10:15', subject_id: 'sub_ce_aoa', faculty_id: 'usr_fac_yrc_001', classroom_id: 'crm_ff102', semester: 3 },
    { id: 'tt_ce_b_fri_2', class_id: 'cls_ce_se_b', day_of_week: 'Friday', period_number: 2, start_time: '10:15', end_time: '11:15', subject_id: 'sub_ce_dsgt', faculty_id: 'usr_fac_act_001', classroom_id: 'crm_ff102', semester: 3 },
    { id: 'tt_ce_b_fri_3', class_id: 'cls_ce_se_b', day_of_week: 'Friday', period_number: 3, start_time: '11:30', end_time: '13:30', subject_id: 'sub_ce_aoa_lab', faculty_id: 'usr_fac_yrc_001', classroom_id: 'crm_ff125', semester: 3 },
    { id: 'tt_ce_b_fri_4', class_id: 'cls_ce_se_b', day_of_week: 'Friday', period_number: 3, start_time: '11:30', end_time: '13:30', subject_id: 'sub_ce_fsjp_lab', faculty_id: 'usr_fac_aap_001', classroom_id: 'crm_ff121', semester: 3 },
    { id: 'tt_ce_b_fri_5', class_id: 'cls_ce_se_b', day_of_week: 'Friday', period_number: 3, start_time: '11:30', end_time: '13:30', subject_id: 'sub_ce_coa_lab', faculty_id: 'usr_fac_kgs_001', classroom_id: 'crm_ff123', semester: 3 },

    // =========================================================================
    // 3. COMPUTER ENGINEERING — DIVISION C (SE, Sem III, 2026-27)
    // =========================================================================
    // --- MONDAY ---
    { id: 'tt_ce_c_mon_1', class_id: 'cls_ce_se_c', day_of_week: 'Monday', period_number: 1, start_time: '09:15', end_time: '10:15', subject_id: 'sub_ce_fsjp', faculty_id: 'usr_fac_csp_001', classroom_id: 'crm_ff102', semester: 3 },
    { id: 'tt_ce_c_mon_2', class_id: 'cls_ce_se_c', day_of_week: 'Monday', period_number: 2, start_time: '10:15', end_time: '11:15', subject_id: 'sub_ce_mce', faculty_id: 'usr_fac_rb_001', classroom_id: 'crm_ff102', semester: 3 },
    { id: 'tt_ce_c_mon_3', class_id: 'cls_ce_se_c', day_of_week: 'Monday', period_number: 3, start_time: '11:30', end_time: '12:30', subject_id: 'sub_ce_dsgt', faculty_id: 'usr_fac_mvd_001', classroom_id: 'crm_ff109', semester: 3 },
    { id: 'tt_ce_c_mon_4', class_id: 'cls_ce_se_c', day_of_week: 'Monday', period_number: 4, start_time: '12:30', end_time: '13:30', subject_id: 'sub_ce_aoa', faculty_id: 'usr_fac_mp_patil_001', classroom_id: 'crm_ff109', semester: 3 },

    // --- TUESDAY ---
    { id: 'tt_ce_c_tue_1', class_id: 'cls_ce_se_c', day_of_week: 'Tuesday', period_number: 1, start_time: '09:15', end_time: '10:15', subject_id: 'sub_ce_mce_tut', faculty_id: 'usr_fac_mp_001', classroom_id: 'crm_ff102', semester: 3 },
    { id: 'tt_ce_c_tue_2', class_id: 'cls_ce_se_c', day_of_week: 'Tuesday', period_number: 2, start_time: '10:15', end_time: '11:15', subject_id: 'sub_ce_dsgt', faculty_id: 'usr_fac_mvd_001', classroom_id: 'crm_ff102', semester: 3 },
    { id: 'tt_ce_c_tue_3', class_id: 'cls_ce_se_c', day_of_week: 'Tuesday', period_number: 3, start_time: '11:30', end_time: '12:30', subject_id: 'sub_ce_coa', faculty_id: 'usr_fac_asd_001', classroom_id: 'crm_ff109', semester: 3 },
    { id: 'tt_ce_c_tue_4', class_id: 'cls_ce_se_c', day_of_week: 'Tuesday', period_number: 4, start_time: '12:30', end_time: '13:30', subject_id: 'sub_ce_mce', faculty_id: 'usr_fac_rb_001', classroom_id: 'crm_ff109', semester: 3 },

    // --- WEDNESDAY ---
    { id: 'tt_ce_c_wed_1', class_id: 'cls_ce_se_c', day_of_week: 'Wednesday', period_number: 1, start_time: '09:15', end_time: '10:15', subject_id: 'sub_ce_mce', faculty_id: 'usr_fac_rb_001', classroom_id: 'crm_ff102', semester: 3 },
    { id: 'tt_ce_c_wed_2', class_id: 'cls_ce_se_c', day_of_week: 'Wednesday', period_number: 2, start_time: '10:15', end_time: '11:15', subject_id: 'sub_ce_fsjp', faculty_id: 'usr_fac_csp_001', classroom_id: 'crm_ff102', semester: 3 },
    { id: 'tt_ce_c_wed_3', class_id: 'cls_ce_se_c', day_of_week: 'Wednesday', period_number: 3, start_time: '11:30', end_time: '13:30', subject_id: 'sub_ce_aoa_lab', faculty_id: 'usr_fac_mp_patil_001', classroom_id: 'crm_sf209', semester: 3 },
    { id: 'tt_ce_c_wed_4', class_id: 'cls_ce_se_c', day_of_week: 'Wednesday', period_number: 3, start_time: '11:30', end_time: '13:30', subject_id: 'sub_ce_coa_lab', faculty_id: 'usr_fac_asd_001', classroom_id: 'crm_ff124', semester: 3 },
    { id: 'tt_ce_c_wed_5', class_id: 'cls_ce_se_c', day_of_week: 'Wednesday', period_number: 3, start_time: '11:30', end_time: '13:30', subject_id: 'sub_ce_fsjp_lab', faculty_id: 'usr_fac_csp_001', classroom_id: 'crm_sf211', semester: 3 },
    { id: 'tt_ce_c_wed_6', class_id: 'cls_ce_se_c', day_of_week: 'Wednesday', period_number: 5, start_time: '14:00', end_time: '15:00', subject_id: 'sub_ce_aoa', faculty_id: 'usr_fac_mp_patil_001', classroom_id: 'crm_ff109', semester: 3 },

    // --- THURSDAY ---
    { id: 'tt_ce_c_thu_1', class_id: 'cls_ce_se_c', day_of_week: 'Thursday', period_number: 1, start_time: '09:15', end_time: '11:15', subject_id: 'sub_ce_fsjp_lab', faculty_id: 'usr_fac_csp_001', classroom_id: 'crm_ff121', semester: 3 },
    { id: 'tt_ce_c_thu_2', class_id: 'cls_ce_se_c', day_of_week: 'Thursday', period_number: 1, start_time: '09:15', end_time: '11:15', subject_id: 'sub_ce_aoa_lab', faculty_id: 'usr_fac_mp_patil_001', classroom_id: 'crm_ff125', semester: 3 },
    { id: 'tt_ce_c_thu_3', class_id: 'cls_ce_se_c', day_of_week: 'Thursday', period_number: 1, start_time: '09:15', end_time: '11:15', subject_id: 'sub_ce_coa_lab', faculty_id: 'usr_fac_asd_001', classroom_id: 'crm_ff123', semester: 3 },
    { id: 'tt_ce_c_thu_4', class_id: 'cls_ce_se_c', day_of_week: 'Thursday', period_number: 3, start_time: '11:30', end_time: '12:30', subject_id: 'sub_ce_coa', faculty_id: 'usr_fac_asd_001', classroom_id: 'crm_ff109', semester: 3 },
    { id: 'tt_ce_c_thu_5', class_id: 'cls_ce_se_c', day_of_week: 'Thursday', period_number: 4, start_time: '12:30', end_time: '13:30', subject_id: 'sub_ce_aoa', faculty_id: 'usr_fac_mp_patil_001', classroom_id: 'crm_ff109', semester: 3 },

    // --- FRIDAY ---
    { id: 'tt_ce_c_fri_1', class_id: 'cls_ce_se_c', day_of_week: 'Friday', period_number: 1, start_time: '09:15', end_time: '10:15', subject_id: 'sub_ce_dsgt', faculty_id: 'usr_fac_mvd_001', classroom_id: 'crm_ff109', semester: 3 },
    { id: 'tt_ce_c_fri_2', class_id: 'cls_ce_se_c', day_of_week: 'Friday', period_number: 2, start_time: '10:15', end_time: '11:15', subject_id: 'sub_ce_coa', faculty_id: 'usr_fac_asd_001', classroom_id: 'crm_ff109', semester: 3 },
    { id: 'tt_ce_c_fri_3', class_id: 'cls_ce_se_c', day_of_week: 'Friday', period_number: 3, start_time: '11:30', end_time: '13:30', subject_id: 'sub_ce_coa_lab', faculty_id: 'usr_fac_asd_001', classroom_id: 'crm_sf210', semester: 3 },
    { id: 'tt_ce_c_fri_4', class_id: 'cls_ce_se_c', day_of_week: 'Friday', period_number: 3, start_time: '11:30', end_time: '13:30', subject_id: 'sub_ce_fsjp_lab', faculty_id: 'usr_fac_csp_001', classroom_id: 'crm_sf211', semester: 3 },
    { id: 'tt_ce_c_fri_5', class_id: 'cls_ce_se_c', day_of_week: 'Friday', period_number: 3, start_time: '11:30', end_time: '13:30', subject_id: 'sub_ce_aoa_lab', faculty_id: 'usr_fac_mp_patil_001', classroom_id: 'crm_sf209', semester: 3 },

    // =========================================================================
    // 4. ARTIFICIAL INTELLIGENCE & DATA SCIENCE — DIVISION A (SE, Sem III, 2026-27)
    // =========================================================================
    // --- MONDAY ---
    { id: 'tt_aids_a_mon_1', class_id: 'cls_aids_se_a', day_of_week: 'Monday', period_number: 1, start_time: '09:15', end_time: '10:15', subject_id: 'sub_aids_maths_tut', faculty_id: 'usr_fac_mp_001', classroom_id: 'crm_lg004', semester: 3 },
    { id: 'tt_aids_a_mon_2', class_id: 'cls_aids_se_a', day_of_week: 'Monday', period_number: 2, start_time: '10:15', end_time: '11:15', subject_id: 'sub_aids_maths', faculty_id: 'usr_fac_csj_001', classroom_id: 'crm_lg004', semester: 3 },
    { id: 'tt_aids_a_mon_3', class_id: 'cls_aids_se_a', day_of_week: 'Monday', period_number: 3, start_time: '11:30', end_time: '12:30', subject_id: 'sub_aids_aoa', faculty_id: 'usr_fac_ppu_001', classroom_id: 'crm_lg004', semester: 3 },
    { id: 'tt_aids_a_mon_4', class_id: 'cls_aids_se_a', day_of_week: 'Monday', period_number: 4, start_time: '12:30', end_time: '13:30', subject_id: 'sub_aids_fsjp', faculty_id: 'usr_fac_ymd_001', classroom_id: 'crm_lg004', semester: 3 },
    { id: 'tt_aids_a_mon_5', class_id: 'cls_aids_se_a', day_of_week: 'Monday', period_number: 5, start_time: '14:00', end_time: '15:00', subject_id: 'sub_aids_coa', faculty_id: 'usr_fac_gvk_001', classroom_id: 'crm_ff113', semester: 3 },

    // --- TUESDAY ---
    { id: 'tt_aids_a_tue_1', class_id: 'cls_aids_se_a', day_of_week: 'Tuesday', period_number: 1, start_time: '09:15', end_time: '10:15', subject_id: 'sub_aids_dsgt', faculty_id: 'usr_fac_shn_001', classroom_id: 'crm_lg004', semester: 3 },
    { id: 'tt_aids_a_tue_2', class_id: 'cls_aids_se_a', day_of_week: 'Tuesday', period_number: 2, start_time: '10:15', end_time: '11:15', subject_id: 'sub_aids_maths', faculty_id: 'usr_fac_csj_001', classroom_id: 'crm_lg004', semester: 3 },
    { id: 'tt_aids_a_tue_3', class_id: 'cls_aids_se_a', day_of_week: 'Tuesday', period_number: 3, start_time: '11:30', end_time: '12:30', subject_id: 'sub_aids_coa', faculty_id: 'usr_fac_gvk_001', classroom_id: 'crm_lg004', semester: 3 },
    { id: 'tt_aids_a_tue_4', class_id: 'cls_aids_se_a', day_of_week: 'Tuesday', period_number: 4, start_time: '12:30', end_time: '13:30', subject_id: 'sub_aids_aoa', faculty_id: 'usr_fac_ppu_001', classroom_id: 'crm_lg004', semester: 3 },

    // --- WEDNESDAY ---
    { id: 'tt_aids_a_wed_1', class_id: 'cls_aids_se_a', day_of_week: 'Wednesday', period_number: 1, start_time: '09:15', end_time: '11:15', subject_id: 'sub_aids_fsjp_lab', faculty_id: 'usr_fac_ymd_001', classroom_id: 'crm_sf203', semester: 3 },
    { id: 'tt_aids_a_wed_2', class_id: 'cls_aids_se_a', day_of_week: 'Wednesday', period_number: 1, start_time: '09:15', end_time: '11:15', subject_id: 'sub_aids_aoa_lab', faculty_id: 'usr_fac_ppu_001', classroom_id: 'crm_sf201', semester: 3 },
    { id: 'tt_aids_a_wed_3', class_id: 'cls_aids_se_a', day_of_week: 'Wednesday', period_number: 1, start_time: '09:15', end_time: '11:15', subject_id: 'sub_aids_coa_lab', faculty_id: 'usr_fac_gvk_001', classroom_id: 'crm_sf202', semester: 3 },
    { id: 'tt_aids_a_wed_4', class_id: 'cls_aids_se_a', day_of_week: 'Wednesday', period_number: 3, start_time: '11:30', end_time: '12:30', subject_id: 'sub_aids_coa', faculty_id: 'usr_fac_gvk_001', classroom_id: 'crm_ff112', semester: 3 },
    { id: 'tt_aids_a_wed_5', class_id: 'cls_aids_se_a', day_of_week: 'Wednesday', period_number: 4, start_time: '12:30', end_time: '13:30', subject_id: 'sub_aids_aoa', faculty_id: 'usr_fac_ppu_001', classroom_id: 'crm_ff112', semester: 3 },

    // --- THURSDAY ---
    { id: 'tt_aids_a_thu_1', class_id: 'cls_aids_se_a', day_of_week: 'Thursday', period_number: 1, start_time: '09:15', end_time: '11:15', subject_id: 'sub_aids_coa_lab', faculty_id: 'usr_fac_gvk_001', classroom_id: 'crm_sf202', semester: 3 },
    { id: 'tt_aids_a_thu_2', class_id: 'cls_aids_se_a', day_of_week: 'Thursday', period_number: 1, start_time: '09:15', end_time: '11:15', subject_id: 'sub_aids_fsjp_lab', faculty_id: 'usr_fac_ymd_001', classroom_id: 'crm_sf203', semester: 3 },
    { id: 'tt_aids_a_thu_3', class_id: 'cls_aids_se_a', day_of_week: 'Thursday', period_number: 1, start_time: '09:15', end_time: '11:15', subject_id: 'sub_aids_aoa_lab', faculty_id: 'usr_fac_ppu_001', classroom_id: 'crm_sf201', semester: 3 },
    { id: 'tt_aids_a_thu_4', class_id: 'cls_aids_se_a', day_of_week: 'Thursday', period_number: 3, start_time: '11:30', end_time: '12:30', subject_id: 'sub_aids_maths', faculty_id: 'usr_fac_csj_001', classroom_id: 'crm_ff112', semester: 3 },
    { id: 'tt_aids_a_thu_5', class_id: 'cls_aids_se_a', day_of_week: 'Thursday', period_number: 4, start_time: '12:30', end_time: '13:30', subject_id: 'sub_aids_dsgt', faculty_id: 'usr_fac_shn_001', classroom_id: 'crm_ff112', semester: 3 },

    // --- FRIDAY ---
    { id: 'tt_aids_a_fri_1', class_id: 'cls_aids_se_a', day_of_week: 'Friday', period_number: 1, start_time: '09:15', end_time: '11:15', subject_id: 'sub_aids_aoa_lab', faculty_id: 'usr_fac_ppu_001', classroom_id: 'crm_sf201', semester: 3 },
    { id: 'tt_aids_a_fri_2', class_id: 'cls_aids_se_a', day_of_week: 'Friday', period_number: 1, start_time: '09:15', end_time: '11:15', subject_id: 'sub_aids_coa_lab', faculty_id: 'usr_fac_gvk_001', classroom_id: 'crm_sf202', semester: 3 },
    { id: 'tt_aids_a_fri_3', class_id: 'cls_aids_se_a', day_of_week: 'Friday', period_number: 1, start_time: '09:15', end_time: '11:15', subject_id: 'sub_aids_fsjp_lab', faculty_id: 'usr_fac_ymd_001', classroom_id: 'crm_sf203', semester: 3 },
    { id: 'tt_aids_a_fri_4', class_id: 'cls_aids_se_a', day_of_week: 'Friday', period_number: 3, start_time: '11:30', end_time: '12:30', subject_id: 'sub_aids_fsjp', faculty_id: 'usr_fac_ymd_001', classroom_id: 'crm_ff113', semester: 3 },
    { id: 'tt_aids_a_fri_5', class_id: 'cls_aids_se_a', day_of_week: 'Friday', period_number: 4, start_time: '12:30', end_time: '13:30', subject_id: 'sub_aids_dsgt', faculty_id: 'usr_fac_shn_001', classroom_id: 'crm_ff113', semester: 3 },

    // =========================================================================
    // 5. ARTIFICIAL INTELLIGENCE & DATA SCIENCE — DIVISION B (SE, Sem III, 2026-27)
    // =========================================================================
    // --- MONDAY ---
    { id: 'tt_aids_b_mon_1', class_id: 'cls_aids_se_b', day_of_week: 'Monday', period_number: 1, start_time: '09:15', end_time: '11:15', subject_id: 'sub_aids_coa_lab', faculty_id: 'usr_fac_gvk_001', classroom_id: 'crm_sf202', semester: 3 },
    { id: 'tt_aids_b_mon_2', class_id: 'cls_aids_se_b', day_of_week: 'Monday', period_number: 1, start_time: '09:15', end_time: '11:15', subject_id: 'sub_aids_fsjp_lab', faculty_id: 'usr_fac_bd_001', classroom_id: 'crm_sf203', semester: 3 },
    { id: 'tt_aids_b_mon_3', class_id: 'cls_aids_se_b', day_of_week: 'Monday', period_number: 1, start_time: '09:15', end_time: '11:15', subject_id: 'sub_aids_aoa_lab', faculty_id: 'usr_fac_ppu_001', classroom_id: 'crm_sf201', semester: 3 },
    { id: 'tt_aids_b_mon_4', class_id: 'cls_aids_se_b', day_of_week: 'Monday', period_number: 3, start_time: '11:30', end_time: '12:30', subject_id: 'sub_aids_maths', faculty_id: 'usr_fac_sjk_001', classroom_id: 'crm_ff113', semester: 3 },
    { id: 'tt_aids_b_mon_5', class_id: 'cls_aids_se_b', day_of_week: 'Monday', period_number: 4, start_time: '12:30', end_time: '13:30', subject_id: 'sub_aids_coa', faculty_id: 'usr_fac_gvk_001', classroom_id: 'crm_ff113', semester: 3 },
    { id: 'tt_aids_b_mon_6', class_id: 'cls_aids_se_b', day_of_week: 'Monday', period_number: 5, start_time: '14:00', end_time: '15:00', subject_id: 'sub_aids_aoa', faculty_id: 'usr_fac_ppu_001', classroom_id: 'crm_ff113', semester: 3 },

    // --- TUESDAY ---
    { id: 'tt_aids_b_tue_1', class_id: 'cls_aids_se_b', day_of_week: 'Tuesday', period_number: 1, start_time: '09:15', end_time: '11:15', subject_id: 'sub_aids_aoa_lab', faculty_id: 'usr_fac_ppu_001', classroom_id: 'crm_sf201', semester: 3 },
    { id: 'tt_aids_b_tue_2', class_id: 'cls_aids_se_b', day_of_week: 'Tuesday', period_number: 1, start_time: '09:15', end_time: '11:15', subject_id: 'sub_aids_coa_lab', faculty_id: 'usr_fac_gvk_001', classroom_id: 'crm_sf202', semester: 3 },
    { id: 'tt_aids_b_tue_3', class_id: 'cls_aids_se_b', day_of_week: 'Tuesday', period_number: 1, start_time: '09:15', end_time: '11:15', subject_id: 'sub_aids_fsjp_lab', faculty_id: 'usr_fac_bd_001', classroom_id: 'crm_sf203', semester: 3 },
    { id: 'tt_aids_b_tue_4', class_id: 'cls_aids_se_b', day_of_week: 'Tuesday', period_number: 3, start_time: '11:30', end_time: '12:30', subject_id: 'sub_aids_dsgt', faculty_id: 'usr_fac_shn_001', classroom_id: 'crm_ff113', semester: 3 },
    { id: 'tt_aids_b_tue_5', class_id: 'cls_aids_se_b', day_of_week: 'Tuesday', period_number: 4, start_time: '12:30', end_time: '13:30', subject_id: 'sub_aids_coa', faculty_id: 'usr_fac_gvk_001', classroom_id: 'crm_ff113', semester: 3 },

    // --- WEDNESDAY ---
    { id: 'tt_aids_b_wed_1', class_id: 'cls_aids_se_b', day_of_week: 'Wednesday', period_number: 1, start_time: '09:15', end_time: '10:15', subject_id: 'sub_aids_dsgt', faculty_id: 'usr_fac_shn_001', classroom_id: 'crm_lg004', semester: 3 },
    { id: 'tt_aids_b_wed_2', class_id: 'cls_aids_se_b', day_of_week: 'Wednesday', period_number: 2, start_time: '10:15', end_time: '11:15', subject_id: 'sub_aids_maths', faculty_id: 'usr_fac_sjk_001', classroom_id: 'crm_lg004', semester: 3 },
    { id: 'tt_aids_b_wed_3', class_id: 'cls_aids_se_b', day_of_week: 'Wednesday', period_number: 3, start_time: '11:30', end_time: '12:30', subject_id: 'sub_aids_aoa', faculty_id: 'usr_fac_ppu_001', classroom_id: 'crm_lg004', semester: 3 },
    { id: 'tt_aids_b_wed_4', class_id: 'cls_aids_se_b', day_of_week: 'Wednesday', period_number: 4, start_time: '12:30', end_time: '13:30', subject_id: 'sub_aids_fsjp', faculty_id: 'usr_fac_bd_001', classroom_id: 'crm_lg004', semester: 3 },

    // --- THURSDAY ---
    { id: 'tt_aids_b_thu_1', class_id: 'cls_aids_se_b', day_of_week: 'Thursday', period_number: 1, start_time: '09:15', end_time: '10:15', subject_id: 'sub_aids_maths_tut', faculty_id: 'usr_fac_mp_001', classroom_id: 'crm_lg004', semester: 3 },
    { id: 'tt_aids_b_thu_2', class_id: 'cls_aids_se_b', day_of_week: 'Thursday', period_number: 2, start_time: '10:15', end_time: '11:15', subject_id: 'sub_aids_fsjp', faculty_id: 'usr_fac_bd_001', classroom_id: 'crm_lg004', semester: 3 },
    { id: 'tt_aids_b_thu_3', class_id: 'cls_aids_se_b', day_of_week: 'Thursday', period_number: 3, start_time: '11:30', end_time: '12:30', subject_id: 'sub_aids_coa', faculty_id: 'usr_fac_gvk_001', classroom_id: 'crm_lg004', semester: 3 },
    { id: 'tt_aids_b_thu_4', class_id: 'cls_aids_se_b', day_of_week: 'Thursday', period_number: 4, start_time: '12:30', end_time: '13:30', subject_id: 'sub_aids_aoa', faculty_id: 'usr_fac_ppu_001', classroom_id: 'crm_lg004', semester: 3 },

    // --- FRIDAY ---
    { id: 'tt_aids_b_fri_1', class_id: 'cls_aids_se_b', day_of_week: 'Friday', period_number: 1, start_time: '09:15', end_time: '10:15', subject_id: 'sub_aids_maths', faculty_id: 'usr_fac_sjk_001', classroom_id: 'crm_lg004', semester: 3 },
    { id: 'tt_aids_b_fri_2', class_id: 'cls_aids_se_b', day_of_week: 'Friday', period_number: 2, start_time: '10:15', end_time: '11:15', subject_id: 'sub_aids_dsgt', faculty_id: 'usr_fac_shn_001', classroom_id: 'crm_lg004', semester: 3 },
    { id: 'tt_aids_b_fri_3', class_id: 'cls_aids_se_b', day_of_week: 'Friday', period_number: 3, start_time: '11:30', end_time: '13:30', subject_id: 'sub_aids_fsjp_lab', faculty_id: 'usr_fac_bd_001', classroom_id: 'crm_sf207', semester: 3 },
    { id: 'tt_aids_b_fri_4', class_id: 'cls_aids_se_b', day_of_week: 'Friday', period_number: 3, start_time: '11:30', end_time: '13:30', subject_id: 'sub_aids_aoa_lab', faculty_id: 'usr_fac_ppu_001', classroom_id: 'crm_sf219', semester: 3 },
    { id: 'tt_aids_b_fri_5', class_id: 'cls_aids_se_b', day_of_week: 'Friday', period_number: 3, start_time: '11:30', end_time: '13:30', subject_id: 'sub_aids_coa_lab', faculty_id: 'usr_fac_gvk_001', classroom_id: 'crm_sf204', semester: 3 },

    // Additional Senior Year Sample Slots (TE-A)
    { id: 'tt_te_a_mon_1', class_id: 'cls_ce_te_a', day_of_week: 'Monday', period_number: 3, start_time: '11:15', end_time: '12:15', subject_id: 'sub_os', faculty_id: 'usr_fac_cs_002', classroom_id: 'crm_302', semester: 5 },
    { id: 'tt_te_a_tue_1', class_id: 'cls_ce_te_a', day_of_week: 'Tuesday', period_number: 5, start_time: '14:00', end_time: '15:00', subject_id: 'sub_cn', faculty_id: 'usr_fac_cs_002', classroom_id: 'crm_302', semester: 5 }
  ];

  const ttStmt = db.prepare(`
    INSERT OR REPLACE INTO timetables (
      id, class_id, day_of_week, period_number, start_time, end_time, subject_id, faculty_id, classroom_id, semester, academic_year, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
  `);
  for (const tt of realTimetables) {
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
      tt.semester || 3,
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
      message: "Tomorrow's 10:00 AM lecture will be conducted in FF102 instead of FF101 due to projector calibration.",
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
      message: 'Your Thursday Lab slot has been verified for FF120 (02:00 PM).',
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
      user_name: "Dr. Sanjay Sharma",
      user_email: 'sharma@college.edu',
      user_role: 'FACULTY',
      type: 'FOUND',
      item_name: 'Scientific Calculator Casio fx-991EX',
      category: 'Electronics',
      description: 'Found on the podium table in FF101 after the 10:00 AM lecture. Safe in faculty desk.',
      location: 'Engineering Block - FF101',
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
      description: 'Found near Computer Lab FF121 water dispenser. Handed over to department security desk.',
      location: 'Tech Wing - FF121 Corridor',
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

  // 10. Seed Attendance Records & Computed Summaries
  const sampleDates = [
    '2026-09-01', '2026-09-02', '2026-09-03', '2026-09-04', '2026-09-05',
    '2026-09-08', '2026-09-09', '2026-09-10', '2026-09-11', '2026-09-12'
  ];

  const seBStudents = [
    { id: 'usr_stu_shifa_001', name: 'Shifa Siddiqui', rollNumber: '23', presentIndices: [0, 1, 2, 3, 4, 5, 6, 7, 8] }, // 9/10 = 90%
    { id: 'usr_stu_soham_005', name: 'Soham Deshmukh', rollNumber: '04', presentIndices: [0, 5] }, // 2/10 = 20% (<30% Defaulter)
    { id: 'usr_stu_aryan_006', name: 'Aryan Kadam', rollNumber: '15', presentIndices: [0, 1, 2, 4, 5, 6, 8, 9] }, // 8/10 = 80%
    { id: 'usr_stu_riya_007', name: 'Riya Shah', rollNumber: '32', presentIndices: [0, 1, 2, 3, 5, 6, 7, 8, 9] }, // 9/10 = 90%
    { id: 'usr_stu_tanvi_008', name: 'Tanvi Sawant', rollNumber: '48', presentIndices: [1, 6] } // 2/10 = 20% (<30% Defaulter)
  ];

  const attRecStmt = db.prepare(`
    INSERT OR REPLACE INTO attendance_records (
      id, student_id, subject_id, department, year, division, date, status, marked_by, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
  `);

  const attSumStmt = db.prepare(`
    INSERT OR REPLACE INTO attendance_summaries (
      id, student_id, subject_id, department, year, division,
      start_date, end_date, total_conducted, total_present, total_absent, total_late,
      attendance_percentage, is_defaulter, is_published, published_at, published_by, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
  `);

  for (const st of seBStudents) {
    let presentCount = 0;
    let absentCount = 0;

    for (let i = 0; i < sampleDates.length; i++) {
      const d = sampleDates[i];
      const isPres = st.presentIndices.includes(i);
      const status = isPres ? 'PRESENT' : 'ABSENT';
      if (isPres) presentCount++; else absentCount++;

      attRecStmt.run(
        `att_rec_${st.id}_sub_ce_coa_${d}`,
        st.id,
        'sub_ce_coa',
        'Computer Engineering',
        'SE',
        'B',
        d,
        status,
        'usr_fac_kgs_001'
      );
    }

    const percentage = parseFloat(((presentCount / sampleDates.length) * 100).toFixed(1));
    const isDefaulter = percentage < 30.0 ? 1 : 0;

    attSumStmt.run(
      `att_sum_${st.id}_sub_ce_coa`,
      st.id,
      'sub_ce_coa',
      'Computer Engineering',
      'SE',
      'B',
      sampleDates[0],
      sampleDates[sampleDates.length - 1],
      sampleDates.length,
      presentCount,
      absentCount,
      0,
      percentage,
      isDefaulter,
      1, // Published for COA
      '2026-09-15 10:00:00',
      'usr_fac_kgs_001'
    );
  }


  console.log('✅ [Seeder] Real college dataset (105 timetable lectures/labs) initialized successfully!');
  console.log('------------------------------------------------------------');
  console.log('🔐 [Demo Credentials for Testing / Viva]:');
  console.log('   👑 Admin:   admin@college.edu           | Password: Admin@123');
  console.log("   👩‍🏫 Faculty: sharma@college.edu          | Password: Faculty@123  (Dr. Sanjay Sharma)");
  console.log('   👩‍🏫 Faculty: aarti.tapadiya@college.edu  | Password: Faculty@123  (Ms. Aarti C Tapadiya)');
  console.log('   👩‍🏫 Faculty: yogita.chavan@college.edu   | Password: Faculty@123  (Ms. Yogita R Chavan)');
  console.log('   👩‍🏫 Faculty: awanti.dhekane@college.edu  | Password: Faculty@123  (Ms. Awanti S Dhekane)');
  console.log('   👩‍🏫 Faculty: ankita.pange@college.edu   | Password: Faculty@123  (Ms. Ankita A Pange)');
  console.log('   👩‍🏫 Faculty: geetanjali.kale@college.edu | Password: Faculty@123  (Dr. Geetanjali Kale)');
  console.log('   👩‍🏫 Faculty: yojana.dehankar@college.edu | Password: Faculty@123  (Ms. Yojana Dehankar)');
  console.log('   👨‍🏫 Faculty: pratyush.urade@college.edu  | Password: Faculty@123  (Mr. Pratyush Urade)');
  console.log('   👩‍🎓 Student: student@college.edu         | Password: Student@123  (Shifa Siddiqui — Comp SE-B)');
  console.log('   👨‍🎓 Student: student.alex@college.edu     | Password: Student@123  (Alex Morgan — Comp TE-A)');
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
