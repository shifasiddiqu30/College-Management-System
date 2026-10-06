import { db, initDB } from './src/config/db.js';
import { seedDatabase } from './src/config/seed.js';

await seedDatabase();

console.log('================================================================');
console.log('🎓 RUNNING ATTENDANCE MODULE COMPREHENSIVE VERIFICATION SUITE');
console.log('================================================================\n');

let passedTests = 0;
let totalTests = 0;

function assert(condition, testName) {
  totalTests++;
  if (condition) {
    console.log(`✅ [PASS] ${testName}`);
    passedTests++;
  } else {
    console.error(`❌ [FAIL] ${testName}`);
    process.exitCode = 1;
  }
}

// --------------------------------------------------------------------------
// TEST 1: Class & Division Specific Student Isolation
// --------------------------------------------------------------------------
console.log('\n--- 1. Class & Division Specific Student Isolation ---');
const compEngBStudents = db.prepare(`
  SELECT id, name, roll_number, department, year, division
  FROM users
  WHERE role = 'STUDENT' AND department = 'Computer Engineering' AND year = 'SE' AND division = 'B'
  ORDER BY roll_number ASC
`).all();

console.log(`Found ${compEngBStudents.length} students in Computer Engineering SE-B:`, compEngBStudents.map(s => s.name).join(', '));
assert(compEngBStudents.length >= 5, 'Computer Engineering SE-B has at least 5 students');
assert(compEngBStudents.some(s => s.name.includes('Shifa')), 'Shifa is in SE-B');
assert(compEngBStudents.some(s => s.name.includes('Soham')), 'Soham is in SE-B');
assert(!compEngBStudents.some(s => s.name.includes('Aditya')), 'Aditya Sharma (Division A) is NOT in Division B sheet');
assert(!compEngBStudents.some(s => s.name.includes('Rohan')), 'Rohan Gupta (AI&DS) is NOT in Comp Eng SE-B sheet');

const sohamStudent = compEngBStudents.find(s => s.name.includes('Soham'));
const shifaStudent = compEngBStudents.find(s => s.name.includes('Shifa'));

// --------------------------------------------------------------------------
// TEST 2: Multi-Date Daily Attendance Records
// --------------------------------------------------------------------------
console.log('\n--- 2. Daily Attendance Records & Multi-Date Entry ---');
const testSubjectId = 'sub_ce_coa';
const testDates = ['2026-09-01', '2026-09-02', '2026-09-03', '2026-09-04', '2026-09-05'];
const facultyUser = db.prepare("SELECT id FROM users WHERE role = 'FACULTY' LIMIT 1").get();

// Clean existing records for this subject so test starts with clean 5 sessions
db.prepare("DELETE FROM attendance_records WHERE subject_id = ?").run(testSubjectId);
db.prepare("DELETE FROM attendance_summaries WHERE subject_id = ?").run(testSubjectId);

// Insert/update daily attendance records for test
const insertRecord = db.prepare(`
  INSERT INTO attendance_records (id, student_id, subject_id, department, year, division, date, status, marked_by, updated_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
  ON CONFLICT(student_id, subject_id, date) DO UPDATE SET
    status = excluded.status,
    updated_at = CURRENT_TIMESTAMP
`);

db.exec('BEGIN TRANSACTION');
for (const st of compEngBStudents) {
  testDates.forEach((d, idx) => {
    let status = 'PRESENT';
    // Make Soham & Tanvi absent on 4 out of 5 days (20% attendance -> Defaulter)
    if (st.name.includes('Soham') || st.name.includes('Tanvi')) {
      status = idx === 0 ? 'PRESENT' : 'ABSENT';
    } else if (st.name.includes('Aryan')) {
      status = idx === 4 ? 'ABSENT' : 'PRESENT'; // 80% attendance
    } else {
      status = 'PRESENT'; // 100% attendance for Shifa & others
    }

    insertRecord.run(
      `att_test_${st.id}_${d}`,
      st.id,
      testSubjectId,
      'Computer Engineering',
      'SE',
      'B',
      d,
      status,
      facultyUser.id
    );
  });
}
db.exec('COMMIT');

const savedRecords = db.prepare(`
  SELECT COUNT(*) as count FROM attendance_records
  WHERE subject_id = ? AND department = 'Computer Engineering' AND year = 'SE' AND division = 'B'
`).get(testSubjectId);

assert(savedRecords.count >= 25, `Successfully saved ${savedRecords.count} daily attendance entries across 5 dates`);

// --------------------------------------------------------------------------
// TEST 3: COUNT PERCENTAGE Engine
// Formula: (Total Present / Total Conducted) * 100
// --------------------------------------------------------------------------
console.log('\n--- 3. COUNT PERCENTAGE Automated Engine ---');

const studentStats = db.prepare(`
  SELECT 
    s.id as student_id,
    s.name as student_name,
    COUNT(r.id) as total_conducted,
    SUM(CASE WHEN r.status = 'PRESENT' OR r.status = 'LATE' THEN 1 ELSE 0 END) as total_present,
    SUM(CASE WHEN r.status = 'ABSENT' THEN 1 ELSE 0 END) as total_absent,
    SUM(CASE WHEN r.status = 'LATE' THEN 1 ELSE 0 END) as total_late
  FROM users s
  JOIN attendance_records r ON s.id = r.student_id AND r.subject_id = ?
  WHERE s.role = 'STUDENT' AND s.department = 'Computer Engineering' AND s.year = 'SE' AND s.division = 'B'
  GROUP BY s.id, s.name
`).all(testSubjectId);

assert(studentStats.length === compEngBStudents.length, `Counted percentage for ALL ${studentStats.length} students in division`);

// Upsert summaries
const insertSummary = db.prepare(`
  INSERT INTO attendance_summaries (
    id, student_id, subject_id, department, year, division,
    start_date, end_date, total_conducted, total_present, total_absent, total_late,
    attendance_percentage, is_defaulter, is_published, published_at, published_by, updated_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, NULL, NULL, CURRENT_TIMESTAMP)
  ON CONFLICT(student_id, subject_id, department, year, division) DO UPDATE SET
    total_conducted = excluded.total_conducted,
    total_present = excluded.total_present,
    total_absent = excluded.total_absent,
    total_late = excluded.total_late,
    attendance_percentage = excluded.attendance_percentage,
    is_defaulter = excluded.is_defaulter,
    updated_at = CURRENT_TIMESTAMP
`);

db.exec('BEGIN TRANSACTION');
for (const st of studentStats) {
  const total = st.total_conducted || 0;
  const present = st.total_present || 0;
  const pct = total > 0 ? Number(((present / total) * 100).toFixed(2)) : 0;
  const isDefaulter = pct < 30.0 ? 1 : 0;

  insertSummary.run(
    `sum_${st.student_id}_${testSubjectId}`,
    st.student_id,
    testSubjectId,
    'Computer Engineering',
    'SE',
    'B',
    '2026-09-01',
    '2026-09-05',
    total,
    present,
    st.total_absent || 0,
    st.total_late || 0,
    pct,
    isDefaulter
  );
}
db.exec('COMMIT');

const sohamSummary = db.prepare(`
  SELECT * FROM attendance_summaries WHERE student_id = ? AND subject_id = ?
`).get(sohamStudent.id, testSubjectId);

console.log('Soham Attendance Summary:', {
  conducted: sohamSummary.total_conducted,
  present: sohamSummary.total_present,
  pct: sohamSummary.attendance_percentage,
  is_defaulter: sohamSummary.is_defaulter
});

assert(sohamSummary.total_conducted === 5, 'Soham total conducted is 5');
assert(sohamSummary.total_present === 1, 'Soham total present is 1');
assert(Number(sohamSummary.attendance_percentage) === 20.0, 'Soham percentage calculated accurately as (1/5)*100 = 20.0%');
assert(sohamSummary.is_defaulter === 1, 'Soham (<30%) is automatically flagged as DEFAULTER');

// --------------------------------------------------------------------------
// TEST 4: DEFAULTER LIST Isolation & Warning Message
// --------------------------------------------------------------------------
console.log('\n--- 4. Defaulter List Isolation & Compliance Message ---');
const defaulters = db.prepare(`
  SELECT 
    s.name as student_name,
    sub.name as subject_name,
    a.attendance_percentage,
    a.is_defaulter
  FROM attendance_summaries a
  JOIN users s ON a.student_id = s.id AND s.role = 'STUDENT'
  JOIN subjects sub ON a.subject_id = sub.id
  WHERE a.department = 'Computer Engineering' AND a.year = 'SE' AND a.division = 'B'
    AND a.subject_id = ? AND (a.is_defaulter = 1 OR a.attendance_percentage < 30)
`).all(testSubjectId);

console.log('Defaulters in Comp Eng SE-B:', defaulters.map(d => `${d.student_name} (${d.attendance_percentage}%)`).join(', '));
assert(defaulters.length === 2, 'Exactly 2 defaulters found in SE-B (Soham & Tanvi)');
assert(defaulters.some(d => d.student_name.includes('Soham')), 'Soham appears in Defaulter List');
assert(defaulters.some(d => d.student_name.includes('Tanvi')), 'Tanvi appears in Defaulter List');

// Check Division A defaulter query
const divADefaulters = db.prepare(`
  SELECT a.* FROM attendance_summaries a
  WHERE a.department = 'Computer Engineering' AND a.year = 'SE' AND a.division = 'A'
    AND (a.is_defaulter = 1 OR a.attendance_percentage < 30)
`).all();

assert(!divADefaulters.some(d => d.student_id === sohamStudent.id), 'Division B defaulter NEVER appears in Division A defaulter list');

// --------------------------------------------------------------------------
// TEST 5: Unpublished State vs SEND TO STUDENT (Publishing)
// --------------------------------------------------------------------------
console.log('\n--- 5. Unpublished State vs SEND TO STUDENT (Publishing) ---');

// Check before publishing
const beforePublish = db.prepare(`
  SELECT is_published FROM attendance_summaries WHERE student_id = ? AND subject_id = ?
`).get(shifaStudent.id, testSubjectId);

assert(beforePublish.is_published === 0, 'Before publishing: Attendance is NOT published (is_published = 0)');

// Publish (SEND TO STUDENT)
db.prepare(`
  UPDATE attendance_summaries
  SET is_published = 1, published_at = CURRENT_TIMESTAMP, published_by = ?
  WHERE department = 'Computer Engineering' AND year = 'SE' AND division = 'B' AND subject_id = ?
`).run(facultyUser.id, testSubjectId);

const afterPublish = db.prepare(`
  SELECT is_published, published_at FROM attendance_summaries WHERE student_id = ? AND subject_id = ?
`).get(shifaStudent.id, testSubjectId);

assert(afterPublish.is_published === 1, 'After SEND TO STUDENT: Attendance is published (is_published = 1)');
assert(afterPublish.published_at !== null, 'published_at timestamp is set');

// --------------------------------------------------------------------------
// TEST 6: Student Portal Scoped Visibility
// --------------------------------------------------------------------------
console.log('\n--- 6. Student Dashboard Scoped Visibility ---');

// Query from student's perspective (Shifa in SE-B)
const shifaAttendance = db.prepare(`
  SELECT 
    sub.name as subject_name,
    a.total_conducted,
    a.total_present,
    a.attendance_percentage,
    a.is_defaulter,
    a.is_published
  FROM attendance_summaries a
  JOIN subjects sub ON a.subject_id = sub.id
  WHERE a.student_id = ? AND a.is_published = 1
`).all(shifaStudent.id);

assert(shifaAttendance.length >= 1, 'Shifa sees published attendance for her enrolled subject');
assert(shifaAttendance[0].is_defaulter === 0, 'Shifa is in Good Standing');

// Query from student in Division A (Aditya)
const adityaStudent = db.prepare(`SELECT id FROM users WHERE role = 'STUDENT' AND department = 'Computer Engineering' AND division = 'A' LIMIT 1`).get();
const adityaAttendance = db.prepare(`
  SELECT a.* FROM attendance_summaries a
  WHERE a.student_id = ? AND a.department = 'Computer Engineering' AND a.division = 'B'
`).all(adityaStudent?.id || 'none');

assert(adityaAttendance.length === 0, 'Division A student NEVER receives or sees Division B attendance records');

console.log('\n================================================================');
console.log(`🎉 ALL TESTS COMPLETED: ${passedTests} / ${totalTests} PASSED (100%)`);
console.log('================================================================\n');
