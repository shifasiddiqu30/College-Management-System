const BASE_URL = 'http://localhost:5000';

async function runE2EAttendanceTest() {
  console.log('🧪 Starting Complete E2E Attendance Test for Computer Engineering SE-C...\n');

  // 1. Admin Login
  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@college.edu', password: 'Admin@123' })
  });
  const loginData = await loginRes.json();
  const adminToken = loginData.token;
  console.log('✅ Admin login successful');

  // 2. Fetch Attendance Sheet for Computer Engineering SE-C (Subject: DSGT)
  const sheetRes = await fetch(`${BASE_URL}/api/admin/attendance/sheet?department=Computer%20Engineering&year=SE&division=C&subjectId=sub_ce_dsgt`, {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  const sheetData = await sheetRes.json();

  console.log(`\n📋 Attendance Register for CE SE-C (Subject: ${sheetData.subject?.code}):`);
  console.log(`   Student Count: ${sheetData.students?.length}`);
  sheetData.students?.forEach(st => console.log(`   - Roll ${st.rollNumber}: ${st.name}`));

  if (sheetData.students?.length !== 5) {
    throw new Error(`Expected exactly 5 students in SE-C, got ${sheetData.students?.length}`);
  }
  const rollNumbers = sheetData.students.map(s => s.rollNumber).sort();
  const expectedRolls = ['04', '15', '23', '32', '48'];
  if (JSON.stringify(rollNumbers) !== JSON.stringify(expectedRolls)) {
    throw new Error(`Unexpected roll numbers in SE-C: ${JSON.stringify(rollNumbers)}`);
  }
  console.log('✅ Correct 5 students in CE SE-C verified!');

  // 3. Save Daily Attendance for DSGT on a new date (2026-10-06)
  const testDate = '2026-10-06';
  const saveRes = await fetch(`${BASE_URL}/api/admin/attendance/save-daily`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    },
    body: JSON.stringify({
      department: 'Computer Engineering',
      year: 'SE',
      division: 'C',
      subjectId: 'sub_ce_dsgt',
      date: testDate,
      records: [
        { studentId: 'usr_stu_c_soham_001', status: 'PRESENT' },
        { studentId: 'usr_stu_c_aryan_002', status: 'PRESENT' },
        { studentId: 'usr_stu_c_shifa_003', status: 'PRESENT' },
        { studentId: 'usr_stu_c_riya_004', status: 'ABSENT' },
        { studentId: 'usr_stu_c_tanvi_005', status: 'LATE' }
      ]
    })
  });
  const saveData = await saveRes.json();
  console.log(`\n💾 Save Attendance Result:`, saveData.message);
  if (!saveData.success) throw new Error('Save daily attendance failed');

  // 4. Calculate Percentage for DSGT
  const countRes = await fetch(`${BASE_URL}/api/admin/attendance/count-percentage`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    },
    body: JSON.stringify({
      department: 'Computer Engineering',
      year: 'SE',
      division: 'C',
      subjectId: 'sub_ce_dsgt'
    })
  });
  const countData = await countRes.json();
  console.log(`\n📊 Calculate Attendance Result:`);
  console.log(`   Total Conducted: ${countData.totalConducted}`);
  countData.calculatedList?.forEach(st => {
    console.log(`   - Roll ${st.rollNumber} ${st.studentName}: Conducted=${st.totalConducted}, Present=${st.totalPresent}, Absent=${st.totalAbsent}, Late=${st.totalLate}, %=${st.attendancePercentage}%`);
  });
  if (!countData.success) throw new Error('Count percentage failed');

  // 5. Publish Attendance for DSGT
  const pubRes = await fetch(`${BASE_URL}/api/admin/attendance/publish`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    },
    body: JSON.stringify({
      department: 'Computer Engineering',
      year: 'SE',
      division: 'C',
      subjectId: 'sub_ce_dsgt'
    })
  });
  const pubData = await pubRes.json();
  console.log(`\n🚀 Send to Student (Publish) Result:`, pubData.message);
  if (!pubData.success) throw new Error('Publish attendance failed');

  // 6. Student Login (Shifa Siddiqui in SE-C) & View Student Attendance
  const stuLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'shifa.c@college.edu', password: 'Student@123' })
  });
  const stuLoginData = await stuLoginRes.json();
  const stuToken = stuLoginData.token;

  const stuAttRes = await fetch(`${BASE_URL}/api/student/attendance`, {
    headers: { 'Authorization': `Bearer ${stuToken}` }
  });
  const stuAttData = await stuAttRes.json();
  console.log(`\n🎓 Student Attendance View (Shifa Siddiqui — SE-C):`);
  console.log(`   Enrolled Subjects Count: ${stuAttData.records?.length}`);
  stuAttData.records?.forEach(r => {
    console.log(`   - ${r.subjectCode} (${r.subjectName}): %=${r.attendancePercentage}%, Published=${r.isPublished}, Status=${r.status}`);
  });

  const subjectCodes = stuAttData.records.map(r => r.subjectCode);
  const expectedSubjects = ['AOA', 'COA', 'DSGT', 'MAX'];
  if (JSON.stringify(subjectCodes.sort()) !== JSON.stringify(expectedSubjects.sort())) {
    throw new Error(`Expected exactly subjects [AOA, COA, DSGT, MAX], got ${JSON.stringify(subjectCodes)}`);
  }

  const dsgtRecord = stuAttData.records.find(r => r.subjectCode === 'DSGT');
  if (!dsgtRecord || !dsgtRecord.isPublished) {
    throw new Error('DSGT record not published or missing for student');
  }

  console.log('\n🎉 ALL E2E ATTENDANCE REGISTER CHECKS COMPLETED & VERIFIED 100%!');
}

runE2EAttendanceTest().catch(err => {
  console.error('❌ E2E TEST FAILED:', err);
  process.exit(1);
});
