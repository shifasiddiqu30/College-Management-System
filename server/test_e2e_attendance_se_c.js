const BASE_URL = 'http://localhost:5000';

async function runE2EAttendanceTest() {
  console.log('🧪 Starting Complete E2E Attendance Test for Computer Engineering SE-C (90 Students)...\n');

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

  if (sheetData.students?.length !== 90) {
    throw new Error(`Expected exactly 90 students in SE-C, got ${sheetData.students?.length}`);
  }
  
  // Verify first and last students
  const firstStudent = sheetData.students[0];
  const lastStudent = sheetData.students[89];
  console.log(`   - First: Roll ${firstStudent.rollNumber} | IEN ${firstStudent.enrollmentNumber} | ${firstStudent.name}`);
  console.log(`   - Last:  Roll ${lastStudent.rollNumber} | IEN ${lastStudent.enrollmentNumber} | ${lastStudent.name}`);

  if (firstStudent.rollNumber !== '141' || firstStudent.enrollmentNumber !== '12502026') {
    throw new Error(`First student mismatch: ${JSON.stringify(firstStudent)}`);
  }
  if (lastStudent.rollNumber !== '230' || lastStudent.enrollmentNumber !== '124A2061') {
    throw new Error(`Last student mismatch: ${JSON.stringify(lastStudent)}`);
  }
  console.log('✅ Correct 90 students with exact Roll No. and IEN in CE SE-C verified!');

  // 3. Save Daily Attendance for DSGT on test date
  const testDate = '2026-10-06';
  const sampleRecords = sheetData.students.map((st, idx) => ({
    studentId: st.id,
    status: idx % 10 === 0 ? 'ABSENT' : (idx % 15 === 0 ? 'LATE' : 'PRESENT')
  }));

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
      records: sampleRecords
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
  console.log(`   Calculated Student Count: ${countData.calculatedList?.length}`);
  if (!countData.success || countData.calculatedList?.length !== 90) throw new Error('Count percentage failed or student count != 90');

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

  // 6. Student Login (Roll 153: Shifa Siddiqui in SE-C) & View Student Attendance
  const stuLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'student.153@college.edu', password: 'Student@123' })
  });
  const stuLoginData = await stuLoginRes.json();
  const stuToken = stuLoginData.token;

  const stuAttRes = await fetch(`${BASE_URL}/api/student/attendance`, {
    headers: { 'Authorization': `Bearer ${stuToken}` }
  });
  const stuAttData = await stuAttRes.json();
  console.log(`\n🎓 Student Attendance View (${stuLoginData.user?.name} — SE-C):`);
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
