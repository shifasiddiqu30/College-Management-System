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

async function runTestSuite() {
  console.log('======================================================================');
  console.log('🚀 Running Complete Part 2 Admin Dashboard & Management Test Suite');
  console.log('======================================================================\n');

  // 1. Unified Authentication Tests
  console.log('▶ TEST 1: Unified Authentication & Auto Role Detection');
  
  // Admin Login
  const adminLogin = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'admin@college.edu', password: 'Admin@123' })
  });
  assert.strictEqual(adminLogin.status, 200, 'Admin login should succeed');
  assert.strictEqual(adminLogin.data.user.role, 'ADMIN', 'Admin role should be ADMIN');
  const adminToken = adminLogin.data.token;
  console.log('  ✅ Admin login successful. Token received.');

  // Faculty Login
  const facultyLogin = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'sharma@college.edu', password: 'Faculty@123' })
  });
  assert.strictEqual(facultyLogin.status, 200, 'Faculty login should succeed');
  assert.strictEqual(facultyLogin.data.user.role, 'FACULTY', 'Role should be FACULTY');
  const facultyToken = facultyLogin.data.token;
  console.log('  ✅ Faculty login successful (Sharma Ma\'am).');

  // Student Login
  const studentLogin = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'student@college.edu', password: 'Student@123' })
  });
  assert.strictEqual(studentLogin.status, 200, 'Student login should succeed');
  assert.strictEqual(studentLogin.data.user.role, 'STUDENT', 'Role should be STUDENT');
  const studentToken = studentLogin.data.token;
  console.log('  ✅ Student login successful (Shifa Siddiqui).');

  // Suspended Student Login
  const susLogin = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'suspended.student@college.edu', password: 'Student@123' })
  });
  assert.strictEqual(susLogin.status, 403, 'Suspended account should receive 403 Forbidden');
  console.log('  ✅ Suspended account blocked with 403 as expected.');

  // 2. Strict Backend RBAC Security Protection
  console.log('\n▶ TEST 2: Strict RBAC Protection of Admin APIs');
  
  const studentAdminAccess = await request('/admin/dashboard-stats', {
    headers: { Authorization: `Bearer ${studentToken}` }
  });
  assert.strictEqual(studentAdminAccess.status, 403, 'Student must get 403 accessing admin routes');
  console.log('  ✅ Student access to /api/admin/dashboard-stats rejected with 403 Forbidden.');

  const facultyAdminAccess = await request('/admin/students', {
    headers: { Authorization: `Bearer ${facultyToken}` }
  });
  assert.strictEqual(facultyAdminAccess.status, 403, 'Faculty must get 403 accessing admin routes');
  console.log('  ✅ Faculty access to /api/admin/students rejected with 403 Forbidden.');

  // 3. Admin Dashboard Overview Stats
  console.log('\n▶ TEST 3: Admin Dashboard Metrics & Occupancy Summary');
  const adminStats = await request('/admin/dashboard-stats', {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  assert.strictEqual(adminStats.status, 200);
  assert(adminStats.data.stats.totalStudents >= 3, 'Should have at least 3 students');
  assert(adminStats.data.stats.totalFaculty >= 3, 'Should have at least 3 faculty');
  assert(adminStats.data.stats.totalClassrooms >= 6, 'Should have at least 6 classrooms');
  assert(adminStats.data.stats.totalDepartments >= 5, 'Should have at least 5 departments');
  assert(Array.isArray(adminStats.data.recentStudents), 'Recent students should be an array');
  assert(Array.isArray(adminStats.data.recentFaculty), 'Recent faculty should be an array');
  console.log('  ✅ Dashboard Stats: Total Students =', adminStats.data.stats.totalStudents,
              '| Total Faculty =', adminStats.data.stats.totalFaculty,
              '| Total Classrooms =', adminStats.data.stats.totalClassrooms,
              '| Total Departments =', adminStats.data.stats.totalDepartments);

  // 4. Student Management CRUD & Validation
  console.log('\n▶ TEST 4: Student Management CRUD & Uniqueness Checks');
  
  // Search student
  const searchShifa = await request('/admin/students?q=Shifa', {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  assert.strictEqual(searchShifa.status, 200);
  assert(searchShifa.data.students.length > 0, 'Search for Shifa should return record');
  console.log('  ✅ Student search by query "Shifa" found:', searchShifa.data.students[0].name);

  // Add new student
  const newStudent = await request('/admin/students', {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({
      name: 'Rohan Deshmukh',
      email: 'rohan.deshmukh@college.edu',
      password: 'Student@123',
      department: 'Computer Engineering',
      year: 'SE',
      division: 'B',
      rollNumber: '99',
      status: 'ACTIVE'
    })
  });
  assert.strictEqual(newStudent.status, 201, 'Student creation should return 201');
  const createdStudentId = newStudent.data.student.id;
  console.log('  ✅ Enrolled new student:', newStudent.data.student.name, '| ID:', createdStudentId);

  // Duplicate email check
  const dupEmail = await request('/admin/students', {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({
      name: 'Duplicate Rohan',
      email: 'rohan.deshmukh@college.edu',
      password: 'Student@123',
      department: 'Computer Engineering',
      year: 'SE',
      division: 'B',
      rollNumber: '100'
    })
  });
  assert.strictEqual(dupEmail.status, 400, 'Duplicate email should be rejected with 400');
  console.log('  ✅ Duplicate email validation correctly rejected with 400.');

  // Update student
  const updateStudent = await request(`/admin/students/${createdStudentId}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({
      name: 'Rohan V. Deshmukh',
      email: 'rohan.deshmukh@college.edu',
      department: 'Computer Engineering',
      year: 'TE',
      division: 'A',
      rollNumber: '99',
      status: 'ACTIVE'
    })
  });
  assert.strictEqual(updateStudent.status, 200);
  assert.strictEqual(updateStudent.data.student.year, 'TE');
  console.log('  ✅ Updated student details successfully (Promoted to TE-A).');

  // Delete student
  const deleteStudent = await request(`/admin/students/${createdStudentId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  assert.strictEqual(deleteStudent.status, 200);
  console.log('  ✅ Deleted student test record cleanly.');

  // 5. Faculty Management CRUD
  console.log('\n▶ TEST 5: Faculty Management CRUD');
  const newFaculty = await request('/admin/faculty', {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({
      name: 'Dr. Alan Kay',
      email: 'alan.kay@college.edu',
      password: 'Faculty@123',
      department: 'Computer Engineering',
      assignedSubjects: ['Object Oriented Design', 'Smalltalk Programming'],
      assignedClasses: ['TE-A', 'BE-B'],
      status: 'ACTIVE'
    })
  });
  assert.strictEqual(newFaculty.status, 201);
  const createdFacId = newFaculty.data.faculty.id;
  console.log('  ✅ Appointed new faculty:', newFaculty.data.faculty.name, '| Subjects:', newFaculty.data.faculty.assignedSubjects);

  // Clean up faculty
  const deleteFaculty = await request(`/admin/faculty/${createdFacId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  assert.strictEqual(deleteFaculty.status, 200);
  console.log('  ✅ Deleted faculty test record cleanly.');

  // 6. Classroom Management CRUD & Duplicate Room Check
  console.log('\n▶ TEST 6: Classroom Management & Room Number Uniqueness');
  
  // Add new room
  const newRoom = await request('/admin/classrooms', {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({
      roomNumber: 'Room 501',
      classroomType: 'Seminar Hall',
      building: 'Research Wing',
      floor: '5th Floor',
      capacity: 120,
      status: 'Active',
      hasProjector: 1
    })
  });
  assert.strictEqual(newRoom.status, 201);
  const createdRoomId = newRoom.data.classroom.id;
  console.log('  ✅ Created classroom: Room 501 (Capacity 120, Seminar Hall).');

  // Duplicate room check
  const dupRoom = await request('/admin/classrooms', {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({
      roomNumber: 'Room 501',
      classroomType: 'Classroom',
      building: 'Block B',
      capacity: 50
    })
  });
  assert.strictEqual(dupRoom.status, 400, 'Duplicate room number must be rejected');
  console.log('  ✅ Duplicate room number correctly rejected with 400.');

  // Delete test room
  const delRoom = await request(`/admin/classrooms/${createdRoomId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  assert.strictEqual(delRoom.status, 200);
  console.log('  ✅ Deleted classroom test record.');

  // 7. Classroom Availability Matrix Foundation
  console.log('\n▶ TEST 7: Classroom Availability Foundation (Schedule Matrix)');
  const availCheck = await request('/admin/classroom-availability?day=Monday&time=10:00', {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  assert.strictEqual(availCheck.status, 200);
  
  const room301 = availCheck.data.rooms.find(r => r.roomNumber === 'Room 301');
  assert(room301, 'Room 301 must exist in availability results');
  assert.strictEqual(room301.status, 'OCCUPIED', 'Room 301 should be OCCUPIED at Monday 10:00 AM');
  assert.strictEqual(room301.occupiedDetails.subject, 'Java Programming', 'Subject must be Java Programming');
  assert.strictEqual(room301.occupiedDetails.faculty, "Sharma Ma'am", "Faculty must be Sharma Ma'am");
  assert.strictEqual(room301.occupiedDetails.class, 'SE-B', 'Class must be SE-B');
  console.log('  ✅ Room 301 Verified:', room301.status, '| Subject:', room301.occupiedDetails.subject, '| Faculty:', room301.occupiedDetails.faculty, '| Class:', room301.occupiedDetails.class);

  const room302 = availCheck.data.rooms.find(r => r.roomNumber === 'Room 302');
  assert(room302, 'Room 302 must exist in availability results');
  assert.strictEqual(room302.status, 'AVAILABLE', 'Room 302 should be AVAILABLE at Monday 10:00 AM');
  console.log('  ✅ Room 302 Verified:', room302.status, '(Vacant & Available)');

  console.log('\n======================================================================');
  console.log('🎉 ALL PART 2 AUTOMATED INTEGRATION & SECURITY TESTS PASSED (100%)');
  console.log('======================================================================');
}

runTestSuite().catch(err => {
  console.error('\n❌ Test Suite Failed with error:', err);
  process.exit(1);
});
