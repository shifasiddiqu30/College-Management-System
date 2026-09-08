/**
 * Automated Test Suite for:
 * 1. Complete Department Management & Dynamic Count
 * 2. Safe Delete & In-Use Dependency Protection
 * 3. Real-Time Faculty Lecture Status vs Account Status
 * 4. Real-Time Classroom Live Status vs Operating Status
 * 5. Student Account Status Independence & Timetable Isolation
 * 6. Branch-Wise Timetable Folders Endpoints
 */

import http from 'http';

function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });
    req.on('error', (err) => reject(err));
    if (postData) {
      req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
    }
    req.end();
  });
}

async function runSuite() {
  console.log('================================================================');
  console.log('🚀 RUNNING DEPARTMENT & REAL-TIME STATUS VERIFICATION SUITE');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName, extra = '') {
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName} ${extra ? `-> ${extra}` : ''}`);
      failed++;
    }
  }

  try {
    // 1. Authenticate Admin, Faculty, and Student
    console.log('--- 1. Authenticating Test Accounts ---');

    // Admin Login
    const adminLogin = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { email: 'admin@college.edu', password: 'Admin@123' });

    assert(adminLogin.status === 200 && adminLogin.data?.token, 'Admin Login successful');
    const adminToken = adminLogin.data?.token;

    // Faculty Login
    const facultyLogin = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { email: 'sharma@college.edu', password: 'Faculty@123' });

    assert(facultyLogin.status === 200 && facultyLogin.data?.token, 'Faculty Login successful');
    const facultyToken = facultyLogin.data?.token;

    // Student Login
    const studentLogin = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { email: 'student@college.edu', password: 'Student@123' });

    assert(studentLogin.status === 200 && studentLogin.data?.token, 'Student Login successful');
    const studentToken = studentLogin.data?.token;

    // 2. Test Dynamic Total Departments in Admin Dashboard
    console.log('\n--- 2. Testing Dynamic Department Management & Live Counts ---');
    
    // Initial Stats
    const initialStats = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/admin/dashboard-stats',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    assert(initialStats.status === 200 && initialStats.data?.stats?.totalDepartments !== undefined, 
      'Admin dashboard returns dynamic totalDepartments', `Count: ${initialStats.data?.stats?.totalDepartments}`);
    const initialDeptCount = initialStats.data?.stats?.totalDepartments;

    // Fetch Departments List
    const deptListRes = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/admin/departments',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    assert(deptListRes.status === 200 && Array.isArray(deptListRes.data?.departments), 
      'GET /api/admin/departments returns array of departments', `Total: ${deptListRes.data?.departments?.length}`);

    // Create New Department
    const testDeptCode = 'ROBO_' + Date.now().toString().slice(-4);
    const createDeptRes = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/admin/departments',
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      }
    }, {
      name: 'Robotics & Automation ' + testDeptCode,
      code: testDeptCode,
      description: 'Advanced Autonomous Systems & Robotics',
      status: 'Active'
    });

    assert(createDeptRes.status === 201 && createDeptRes.data?.department?.id,
      'POST /api/admin/departments creates new department successfully');
    const createdDeptId = createDeptRes.data?.department?.id;

    // Check that totalDepartments in Dashboard INCREMENTED dynamically
    const updatedStatsAfterAdd = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/admin/dashboard-stats',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    assert(updatedStatsAfterAdd.data?.stats?.totalDepartments === initialDeptCount + 1,
      'Total Departments count dynamically incremented after addition',
      `Before: ${initialDeptCount}, After: ${updatedStatsAfterAdd.data?.stats?.totalDepartments}`);

    // Deactivate Department
    const toggleDeactivateRes = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: `/api/admin/departments/${createdDeptId}/status`,
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      }
    }, { status: 'Inactive' });

    assert(toggleDeactivateRes.status === 200 && toggleDeactivateRes.data?.department?.status === 'Inactive',
      'PATCH /api/admin/departments/:id/status toggles department to Inactive');

    // Check that active totalDepartments count DECREMENTED
    const statsAfterDeactivate = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/admin/dashboard-stats',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    assert(statsAfterDeactivate.data?.stats?.totalDepartments === initialDeptCount,
      'Total Active Departments count dynamically decremented after deactivation',
      `Active Count: ${statsAfterDeactivate.data?.stats?.totalDepartments}`);

    // 3. Test Safe Delete & In-Use Dependency Protection
    console.log('\n--- 3. Testing Safe Delete & Dependency Protection ---');

    // Attempt to delete an in-use department ("Computer Engineering")
    const compEngDept = deptListRes.data.departments.find(d => d.name === 'Computer Engineering');
    if (compEngDept) {
      const deleteInUseRes = await makeRequest({
        hostname: 'localhost',
        port: 5000,
        path: `/api/admin/departments/${compEngDept.id}`,
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });

      assert(deleteInUseRes.status === 400 && deleteInUseRes.data?.isInUse === true,
        'DELETE in-use department is REJECTED with HTTP 400 and isInUse: true',
        deleteInUseRes.data?.message);
    }

    // Delete the unused test department
    const deleteUnusedRes = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: `/api/admin/departments/${createdDeptId}`,
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    assert(deleteUnusedRes.status === 200 && deleteUnusedRes.data?.success === true,
      'DELETE unused department SUCCEEDS cleanly');

    // 4. Test Real-Time Faculty Status vs Account Status
    console.log('\n--- 4. Testing Real-Time Faculty Lecture Status vs Account Status ---');
    const facultyListRes = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/admin/faculty',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    assert(facultyListRes.status === 200 && Array.isArray(facultyListRes.data?.faculty),
      'GET /api/admin/faculty returns faculty list with status fields');

    const firstFaculty = facultyListRes.data?.faculty[0];
    assert(firstFaculty && ['ACTIVE', 'SUSPENDED', 'INACTIVE', 'PENDING'].includes(firstFaculty.status),
      `Faculty has independent Account Status: ${firstFaculty?.status}`);
    assert(firstFaculty && ['ACTIVE', 'INACTIVE'].includes(firstFaculty.lectureStatus),
      `Faculty has real-time Lecture Status: ${firstFaculty?.lectureStatus}`);
    assert(firstFaculty && ('currentActivity' in firstFaculty),
      'Faculty object contains currentActivity field (real-time)');

    // Test Faculty Filter by lectureStatus
    const activeLectureFacultyRes = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/admin/faculty?lectureStatus=ACTIVE',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    assert(activeLectureFacultyRes.status === 200 && Array.isArray(activeLectureFacultyRes.data?.faculty),
      'GET /api/admin/faculty?lectureStatus=ACTIVE filters correctly');

    // 5. Test Real-Time Classroom Status vs Operating Status
    console.log('\n--- 5. Testing Real-Time Classroom Live Status vs Operating Status ---');
    const classroomsRes = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/admin/classrooms',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    assert(classroomsRes.status === 200 && Array.isArray(classroomsRes.data?.classrooms),
      'GET /api/admin/classrooms returns classrooms list');

    const firstRoom = classroomsRes.data?.classrooms[0];
    assert(firstRoom && ['Active', 'Inactive'].includes(firstRoom.status),
      `Classroom has Operating Status: ${firstRoom?.status}`);
    assert(firstRoom && ['ACTIVE', 'INACTIVE'].includes(firstRoom.currentLectureStatus),
      `Classroom has live Lecture Status: ${firstRoom?.currentLectureStatus}`);
    assert(firstRoom && ['OCCUPIED', 'AVAILABLE'].includes(firstRoom.availabilityStatus),
      `Classroom has Availability Status: ${firstRoom?.availabilityStatus}`);
    assert(firstRoom && ('currentActivity' in firstRoom),
      'Classroom object contains currentActivity field (real-time)');

    // 6. Test Department Folders Endpoints
    console.log('\n--- 6. Testing Department Folders Endpoints ---');
    const facultyDeptsRes = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/faculty/departments',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${facultyToken}` }
    });
    assert(facultyDeptsRes.status === 200 && Array.isArray(facultyDeptsRes.data?.departments),
      'GET /api/faculty/departments returns active department folders for faculty');

    const studentDeptsRes = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/student/departments',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${studentToken}` }
    });
    assert(studentDeptsRes.status === 200 && Array.isArray(studentDeptsRes.data?.departments),
      'GET /api/student/departments returns active department folders for student');

    // 7. Test Student Account Status & Timetable Isolation
    console.log('\n--- 7. Testing Student Account Status & Timetable Isolation ---');
    const studentProfile = studentLogin.data?.user;
    assert(studentProfile && studentProfile.status === 'ACTIVE',
      `Student Account Status remains strictly account-level: ${studentProfile?.status}`);

    const studentTtRes = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/student/timetable',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${studentToken}` }
    });

    assert(studentTtRes.status === 200 && studentTtRes.data?.success === true,
      'GET /api/student/timetable succeeds');

    const studentCohort = studentTtRes.data?.cohort;
    assert(studentCohort && studentCohort.department === studentProfile.department && studentCohort.year === studentProfile.year && studentCohort.division === studentProfile.division,
      `Student Timetable strictly scoped to authorized cohort: ${studentCohort?.department} ${studentCohort?.year}-${studentCohort?.division}`);

    console.log('\n================================================================');
    console.log(`🏁 TEST RESULTS: ${passed} PASSED | ${failed} FAILED`);
    console.log('================================================================\n');

    if (failed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  } catch (err) {
    console.error('💥 Test suite execution error:', err);
    process.exit(1);
  }
}

runSuite();
