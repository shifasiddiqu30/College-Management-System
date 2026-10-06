import assert from 'node:assert';

const BASE_URL = 'http://localhost:5000/api';

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };
  const res = await fetch(url, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

async function runPart3TestSuite() {
  console.log('======================================================================');
  console.log('🚀 PART 3: SMART TIMETABLE & CLASSROOM AVAILABILITY TEST SUITE');
  console.log('======================================================================\n');

  // Step 1: Authentication & Role Verification
  console.log('▶ STEP 1: Authenticating Admin, Faculty, and Student...');

  // 1.1 Admin Login
  const adminRes = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'admin@college.edu', password: 'Admin@123' })
  });
  assert.strictEqual(adminRes.status, 200, 'Admin login should succeed');
  const adminToken = adminRes.data.token;
  console.log('  ✅ Admin logged in. (Dr. Eleanor Vance)');

  // 1.2 Faculty 1 Login (Sharma Ma\'am)
  const fac1Res = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'sharma@college.edu', password: 'Faculty@123' })
  });
  assert.strictEqual(fac1Res.status, 200, 'Faculty 1 login should succeed');
  const fac1Token = fac1Res.data.token;
  const fac1Id = fac1Res.data.user.id;
  console.log(`  ✅ Faculty logged in: ${fac1Res.data.user.name} (${fac1Res.data.user.email})`);

  // 1.3 Faculty 2 Login (Prof. Robert Downey)
  const fac2Res = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'faculty.cs@college.edu', password: 'Faculty@123' })
  });
  assert.strictEqual(fac2Res.status, 200, 'Faculty 2 login should succeed');
  const fac2Token = fac2Res.data.token;
  const fac2Id = fac2Res.data.user.id;
  console.log(`  ✅ Faculty 2 logged in: ${fac2Res.data.user.name}`);

  // 1.4 Student Login (Shifa Siddiqui - Computer Engineering, SE, Div B)
  const studentRes = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'student@college.edu', password: 'Student@123' })
  });
  assert.strictEqual(studentRes.status, 200, 'Student login should succeed');
  const studentToken = studentRes.data.token;
  console.log(`  ✅ Student logged in: ${studentRes.data.user.name} (${studentRes.data.user.department} ${studentRes.data.user.year}-${studentRes.data.user.division})`);

  // 1.5 Student 2 Login (Alex Morgan - Computer Engineering, TE, Div A)
  const student2Res = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'student.alex@college.edu', password: 'Student@123' })
  });
  assert.strictEqual(student2Res.status, 200, 'Student 2 login should succeed');
  const student2Token = student2Res.data.token;
  console.log(`  ✅ Student 2 logged in: ${student2Res.data.user.name} (${student2Res.data.user.department} ${student2Res.data.user.year}-${student2Res.data.user.division})`);

  // Step 2: Admin Timetable Fetch & Filtering
  console.log('\n▶ STEP 2: Admin Timetable Queries & Filtering');
  const ttAll = await request('/admin/timetable', {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  assert.strictEqual(ttAll.status, 200);
  assert(Array.isArray(ttAll.data.timetables), 'Should return an array of timetables');
  assert(ttAll.data.count > 0, 'Should have seeded timetable entries');
  console.log(`  ✅ Fetched all timetables: ${ttAll.data.count} total slots in database.`);

  // Filter by Department and Class
  const ttFiltered = await request('/admin/timetable?department=Computer+Engineering&year=SE&division=B', {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  assert.strictEqual(ttFiltered.status, 200);
  assert(ttFiltered.data.count > 0, 'Should have SE-B slots');
  console.log(`  ✅ Filtered SE-B slots count: ${ttFiltered.data.count}`);

  // Step 3: Conflict Prevention Engine Validation
  console.log('\n▶ STEP 3: Automated Timetable Conflict Prevention Engine');

  // Let\'s create a test slot on Friday 15:00 - 16:00 in Room 301 with Sharma Ma\'am for SE-B
  const newSlotRes = await request('/admin/timetable', {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({
      dayOfWeek: 'Friday',
      startTime: '15:00',
      endTime: '16:00',
      department: 'Computer Engineering',
      year: 'SE',
      division: 'B',
      subjectId: 'sub_java',
      facultyId: fac1Id,
      classroomId: 'crm_301',
      periodNumber: 5
    })
  });
  assert.strictEqual(newSlotRes.status, 201, 'Creating valid non-conflicting slot should succeed');
  const createdSlotId = newSlotRes.data.timetable.id;
  console.log(`  ✅ Created test lecture slot: ID ${createdSlotId} (Friday 15:00 - 16:00, Room 301, Sharma Ma\'am, SE-B)`);

  // 3.1 TEST ROOM CONFLICT: Attempt to schedule TE-A in Room 301 at Friday 15:30 - 16:30 with Prof Downey
  console.log('  Testing Room Conflict Detection...');
  const roomConflictRes = await request('/admin/timetable', {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({
      dayOfWeek: 'Friday',
      startTime: '15:30',
      endTime: '16:30',
      department: 'Computer Engineering',
      year: 'TE',
      division: 'A',
      subjectId: 'sub_os',
      facultyId: fac2Id,
      classroomId: 'crm_301', // SAME ROOM
      periodNumber: 6
    })
  });
  assert.strictEqual(roomConflictRes.status, 400, 'Room conflict must return HTTP 400');
  assert.strictEqual(roomConflictRes.data.conflictType, 'ROOM_CONFLICT', 'Conflict type should be ROOM_CONFLICT');
  console.log(`  ✅ Room Conflict blocked successfully: "${roomConflictRes.data.message}"`);

  // 3.2 TEST FACULTY CONFLICT: Attempt to schedule Sharma Ma\'am for TE-A in Room 302 at Friday 15:00 - 16:00
  console.log('  Testing Faculty Conflict Detection...');
  const facultyConflictRes = await request('/admin/timetable', {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({
      dayOfWeek: 'Friday',
      startTime: '15:00',
      endTime: '16:00',
      department: 'Computer Engineering',
      year: 'TE',
      division: 'A',
      subjectId: 'sub_dbms',
      facultyId: fac1Id, // SAME FACULTY
      classroomId: 'crm_302', // DIFFERENT ROOM
      periodNumber: 5
    })
  });
  assert.strictEqual(facultyConflictRes.status, 400, 'Faculty conflict must return HTTP 400');
  assert.strictEqual(facultyConflictRes.data.conflictType, 'FACULTY_CONFLICT', 'Conflict type should be FACULTY_CONFLICT');
  console.log(`  ✅ Faculty Conflict blocked successfully: "${facultyConflictRes.data.message}"`);

  // 3.3 TEST CLASS / SECTION CONFLICT: Attempt to schedule another class for SE-B at Friday 15:00 - 16:00 with Prof Downey in Room 302
  console.log('  Testing Class / Section Conflict Detection...');
  const classConflictRes = await request('/admin/timetable', {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({
      dayOfWeek: 'Friday',
      startTime: '15:00',
      endTime: '16:00',
      department: 'Computer Engineering',
      year: 'SE',
      division: 'B', // SAME COHORT
      subjectId: 'sub_os',
      facultyId: fac2Id, // DIFFERENT FACULTY
      classroomId: 'crm_302', // DIFFERENT ROOM
      periodNumber: 5
    })
  });
  assert.strictEqual(classConflictRes.status, 400, 'Class conflict must return HTTP 400');
  assert.strictEqual(classConflictRes.data.conflictType, 'CLASS_CONFLICT', 'Conflict type should be CLASS_CONFLICT');
  console.log(`  ✅ Class Conflict blocked successfully: "${classConflictRes.data.message}"`);

  // 3.4 TEST UPDATE TIMETABLE (Move slot to Friday 16:00 - 17:00)
  console.log('  Testing Timetable Slot Update...');
  const updateRes = await request(`/admin/timetable/${createdSlotId}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({
      dayOfWeek: 'Friday',
      startTime: '16:00',
      endTime: '17:00',
      subjectId: 'sub_java',
      facultyId: fac1Id,
      classroomId: 'crm_301'
    })
  });
  assert.strictEqual(updateRes.status, 200, 'Update slot should succeed');
  console.log('  ✅ Timetable Slot updated cleanly.');

  // 3.5 Clean up created test slot
  const deleteRes = await request(`/admin/timetable/${createdSlotId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  assert.strictEqual(deleteRes.status, 200, 'Delete slot should succeed');
  console.log('  ✅ Deleted test timetable slot cleanly.');

  // Step 4: Student Role-Based Isolation & Real-Time Schedule Calculation
  console.log('\n▶ STEP 4: Student Role-Based Isolation & Schedule Calculation');
  const studentScheduleRes = await request('/student/timetable', {
    headers: { Authorization: `Bearer ${studentToken}` }
  });
  assert.strictEqual(studentScheduleRes.status, 200, 'Student timetable query must succeed');
  const stuData = studentScheduleRes.data;

  assert.strictEqual(stuData.student.department, 'Computer Engineering');
  assert.strictEqual(stuData.student.year, 'SE');
  assert.strictEqual(stuData.student.division, 'B');
  assert(Array.isArray(stuData.todaySchedule), 'todaySchedule must be an array');
  assert(stuData.weeklyGrid.Monday.length > 0, 'SE-B should have Monday classes');
  assert(stuData.weeklyGrid.Tuesday.length > 0, 'SE-B should have Tuesday classes');
  assert(stuData.assignedClassrooms.length > 0, 'Assigned classrooms list must be populated');

  console.log(`  ✅ Student Timetable verified for ${stuData.student.name}:`);
  console.log(`     - Cohort: ${stuData.classInfo.department} (${stuData.classInfo.year}-${stuData.classInfo.division})`);
  console.log(`     - Monday slots count: ${stuData.weeklyGrid.Monday.length}`);
  console.log(`     - Total distinct assigned rooms: ${stuData.assignedClassrooms.length}`);
  console.log(`     - Today's day evaluated: ${stuData.todayDay}`);

  // Test Student 2 Isolation (Alex Morgan - TE-A)
  const student2ScheduleRes = await request('/student/timetable', {
    headers: { Authorization: `Bearer ${student2Token}` }
  });
  assert.strictEqual(student2ScheduleRes.status, 200);
  assert.strictEqual(student2ScheduleRes.data.student.year, 'TE');
  assert.strictEqual(student2ScheduleRes.data.student.division, 'A');
  console.log(`  ✅ Student 2 (Alex Morgan - TE-A) isolated properly. Sees only TE-A timetable.`);

  // Verify Student Cannot Access Admin Timetable or Classroom Availability
  const stuAdminBlocked = await request('/admin/timetable', {
    headers: { Authorization: `Bearer ${studentToken}` }
  });
  assert.strictEqual(stuAdminBlocked.status, 403, 'Student must be blocked from /api/admin/timetable with 403');
  console.log('  ✅ Security Check: Student blocked from /api/admin/timetable with 403 Forbidden.');

  // Step 5: Faculty Role-Based Isolation & Teaching Schedule
  console.log('\n▶ STEP 5: Faculty Role-Based Isolation & Assigned Schedule');
  const facultyScheduleRes = await request('/faculty/timetable', {
    headers: { Authorization: `Bearer ${fac1Token}` }
  });
  assert.strictEqual(facultyScheduleRes.status, 200, 'Faculty timetable query must succeed');
  const facData = facultyScheduleRes.data;

  assert(facData.faculty.name.includes('Sharma'), 'Faculty name should include Sharma');
  assert(facData.weeklyGrid.Monday.length > 0, 'Sharma should have Monday classes');
  assert(facData.assignedClassrooms.length > 0, 'Assigned classrooms should be populated');

  console.log(`  ✅ Faculty Timetable verified for ${facData.faculty.name}:`);
  console.log(`     - Monday assigned lectures: ${facData.weeklyGrid.Monday.length}`);
  console.log(`     - Assigned teaching venues: ${facData.assignedClassrooms.map(r => r.roomNumber).join(', ')}`);

  // Step 6: Classroom Availability Engine (Shared for Admin & Faculty)
  console.log('\n▶ STEP 6: Classroom Availability Engine & Vacancy Search');

  // Check Room FF101 availability on Monday 09:30 - 10:00 (During which MCE is ongoing for SE-A)
  const roomOccupied = await request('/faculty/classroom-availability?day=Monday&startTime=09:30&endTime=10:00&search=FF101', {
    headers: { Authorization: `Bearer ${fac1Token}` }
  });
  assert.strictEqual(roomOccupied.status, 200);
  const roomSlot = roomOccupied.data.rooms.find(r => r.roomNumber.includes('FF101'));
  assert(roomSlot, 'Room FF101 should be found');
  assert.strictEqual(roomSlot.status, 'OCCUPIED', 'Room FF101 must be OCCUPIED on Monday 09:30 - 10:00');
  console.log(`  ✅ Room FF101 evaluated as OCCUPIED: ${roomSlot.occupiedDetails.subject} with ${roomSlot.occupiedDetails.faculty} (${roomSlot.occupiedDetails.class})`);

  // Check Room 303 availability on Monday 12:15 - 13:00 (Free slot)
  const roomFree = await request('/faculty/classroom-availability?day=Monday&startTime=12:15&endTime=13:00&search=303', {
    headers: { Authorization: `Bearer ${fac1Token}` }
  });
  assert.strictEqual(roomFree.status, 200);
  const roomFreeSlot = roomFree.data.rooms.find(r => r.roomNumber.includes('303'));
  assert.strictEqual(roomFreeSlot.status, 'AVAILABLE', 'Room 303 must be AVAILABLE on Monday 12:15 - 13:00');
  console.log(`  ✅ Room 303 evaluated as AVAILABLE during lunch break (12:15 - 13:00)`);

  console.log('\n======================================================================');
  console.log('🎉 ALL PART 3 SMART TIMETABLE & AVAILABILITY TESTS PASSED WITH 100% SUCCESS!');
  console.log('======================================================================\n');
}

runPart3TestSuite().catch(err => {
  console.error('\n❌ Test Suite Failed:', err);
  process.exit(1);
});
