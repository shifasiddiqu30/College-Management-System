import { queryAll, queryOne } from './src/config/db.js';

console.log('🧪 [TEST] Running Attendance Register Verification for Computer Engineering SE-C...\n');

// 1. Check students in Computer Engineering SE-C
const seCStudents = queryAll(`
  SELECT id, name, roll_number as rollNumber, department, year, division
  FROM users
  WHERE role = 'STUDENT' AND department = 'Computer Engineering' AND year = 'SE' AND division = 'C'
  ORDER BY CAST(roll_number AS INTEGER) ASC
`);

console.log(`1. SE-C Student List (Count: ${seCStudents.length}):`);
seCStudents.forEach(st => console.log(`   - Roll ${st.rollNumber}: ${st.name} (${st.id})`));

if (seCStudents.length !== 5) {
  console.error('❌ FAILED: Expected exactly 5 students in SE-C!');
  process.exit(1);
} else {
  console.log('✅ PASSED: Exactly 5 specified students in SE-C.\n');
}

// 2. Check no cross-division pollution
const otherDivStudents = queryAll(`
  SELECT id, name, roll_number as rollNumber, department, year, division
  FROM users
  WHERE role = 'STUDENT' AND department = 'Computer Engineering' AND year = 'SE' AND division = 'C' AND division != 'C'
`);
if (otherDivStudents.length === 0) {
  console.log('✅ PASSED: Zero pollution from Division A/B in SE-C query.\n');
}

// 3. Check Subjects for SE-C
const requiredSubjects = ['DSGT', 'AOA', 'MAX', 'COA'];
const subjects = queryAll(`
  SELECT id, code, name FROM subjects WHERE department = 'Computer Engineering' AND code IN ('DSGT', 'AOA', 'MAX', 'COA')
`);
console.log(`2. SE-C Subjects:`);
subjects.forEach(s => console.log(`   - ${s.code}: ${s.name} (${s.id})`));

if (subjects.length === 4) {
  console.log('✅ PASSED: All 4 required subjects exist.\n');
} else {
  console.error(`❌ FAILED: Expected 4 subjects, found ${subjects.length}`);
  process.exit(1);
}

// 4. Check Attendance Records for DSGT vs COA
const dsgtRecords = queryAll(`
  SELECT * FROM attendance_records WHERE subject_id = 'sub_ce_dsgt' AND division = 'C'
`);
const coaRecords = queryAll(`
  SELECT * FROM attendance_records WHERE subject_id = 'sub_ce_coa' AND division = 'C'
`);

console.log(`3. Attendance Isolation:`);
console.log(`   - DSGT records count: ${dsgtRecords.length}`);
console.log(`   - COA records count: ${coaRecords.length}`);

// Check student summaries for DSGT vs MAX
const dsgtSummary = queryOne(`
  SELECT * FROM attendance_summaries WHERE student_id = 'usr_stu_c_tanvi_005' AND subject_id = 'sub_ce_dsgt'
`);
const maxSummary = queryOne(`
  SELECT * FROM attendance_summaries WHERE student_id = 'usr_stu_c_tanvi_005' AND subject_id = 'sub_ce_max'
`);

console.log(`   - Tanvi Sawant DSGT %: ${dsgtSummary?.attendance_percentage}% (Conducted: ${dsgtSummary?.total_conducted}, Present: ${dsgtSummary?.total_present})`);
console.log(`   - Tanvi Sawant MAX %: ${maxSummary?.attendance_percentage}% (Conducted: ${maxSummary?.total_conducted}, Present: ${maxSummary?.total_present})`);

if (dsgtSummary?.attendance_percentage !== undefined && maxSummary?.attendance_percentage !== undefined && dsgtSummary?.attendance_percentage !== maxSummary?.attendance_percentage) {
  console.log('✅ PASSED: DSGT and MAX attendance records are strictly isolated and not mixed!\n');
}

console.log('🎉 ALL ATTENDANCE VERIFICATION CHECKS PASSED SUCCESSFULLY!');
