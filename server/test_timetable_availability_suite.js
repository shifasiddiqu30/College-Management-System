/**
 * Test Suite: Admin Timetable & Faculty Availability Separation & Live Cascade Verification
 * 
 * Verifies:
 * 1. Admin Authentication
 * 2. Dedicated Student Timetable API (/api/admin/timetable)
 * 3. Dedicated Faculty Timetable API (/api/admin/faculty-timetable)
 * 4. Dedicated Faculty Availability API (/api/admin/faculty-availability)
 * 5. Single Source of Truth Cascade:
 *    - Insert new timetable entry into `timetables`
 *    - Verify Student Timetable reflects it
 *    - Verify Faculty Timetable reflects it
 *    - Verify Classroom Availability reflects Occupied
 *    - Verify Faculty Availability reflects Occupied
 *    - Clean up test entry and verify Available status restoration
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

async function runTimetableSuite() {
  console.log('================================================================');
  console.log('🚀 RUNNING ADMIN TIMETABLE & FACULTY AVAILABILITY TEST SUITE');
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
    // 1. Admin Login
    console.log('--- 1. Admin Authentication ---');
    const adminLogin = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { email: 'admin@college.edu', password: 'Admin@123' });

    assert(adminLogin.status === 200 && adminLogin.data?.token, 'Admin Login succeeds');
    const adminToken = adminLogin.data?.token;
    const authHeaders = {
      'Authorization': `Bearer ${adminToken}`,
      'Content-Type': 'application/json'
    };

    // Get Admin Options
    const optionsRes = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/admin/options',
      method: 'GET',
      headers: authHeaders
    });
    assert(optionsRes.status === 200 && (optionsRes.data?.success || optionsRes.data?.departments), 'Fetch Admin Options returns 200 OK', JSON.stringify(optionsRes.data));
    const classes = optionsRes.data?.classes || [];
    const subjects = optionsRes.data?.subjects || [];
    const classrooms = optionsRes.data?.classrooms || [];
    const facultyList = optionsRes.data?.facultyList || [];
    assert(classes.length > 0, 'Classes options populated');
    assert(subjects.length > 0, 'Subjects options populated');
    assert(classrooms.length > 0, 'Classrooms options populated');
    assert(facultyList.length > 0, 'Faculty options populated');

    // 2. Student Timetable API
    console.log('\n--- 2. Student Timetable API ---');
    const studentTtRes = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/admin/timetable?department=Computer%20Engineering',
      method: 'GET',
      headers: authHeaders
    });

    assert(studentTtRes.status === 200 && studentTtRes.data?.success, 'Fetch Student Timetable for Computer Engineering returns 200 OK');
    assert(Array.isArray(studentTtRes.data?.timetables), 'Student Timetable returns an array of entries');
    console.log(`   Found ${studentTtRes.data?.timetables?.length || 0} timetable entries in Computer Engineering.`);

    // 3. Faculty Timetable API
    console.log('\n--- 3. Faculty Timetable API ---');
    const facultyTtInit = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/admin/faculty-timetable?department=Computer%20Engineering',
      method: 'GET',
      headers: authHeaders
    });

    assert(facultyTtInit.status === 200 && facultyTtInit.data?.success, 'Fetch Faculty Timetable metadata returns 200 OK');
    const facultyListInDept = facultyTtInit.data?.facultyMembers || facultyTtInit.data?.faculties || [];
    assert(Array.isArray(facultyListInDept), 'Faculty list returned for Computer Engineering');
    assert(facultyListInDept.length > 0, `At least 1 faculty member found (${facultyListInDept.length} found)`);

    const testFaculty = facultyListInDept[0];
    console.log(`   Testing Faculty: ${testFaculty.name} (ID: ${testFaculty.id})`);

    const specificFacultyTt = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: `/api/admin/faculty-timetable?department=Computer%20Engineering&faculty_id=${testFaculty.id}`,
      method: 'GET',
      headers: authHeaders
    });

    assert(specificFacultyTt.status === 200 && specificFacultyTt.data.success, 'Fetch specific faculty weekly timetable returns 200 OK');
    assert(specificFacultyTt.data.selectedFaculty.id === testFaculty.id, 'Selected faculty matches queried faculty ID');
    assert(Array.isArray(specificFacultyTt.data.timetables), 'Faculty weekly timetable array returned');

    // 4. Faculty Availability API
    console.log('\n--- 4. Faculty Availability API ---');
    const facultyAvail = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/admin/faculty-availability?department=Computer%20Engineering&day=Monday&startTime=10:00&endTime=11:00',
      method: 'GET',
      headers: authHeaders
    });

    assert(facultyAvail.status === 200 && facultyAvail.data.success, 'Fetch Faculty Availability returns 200 OK');
    assert(facultyAvail.data.summary !== undefined, 'Summary object present');
    assert(typeof facultyAvail.data.summary.totalFaculty === 'number', 'Summary contains totalFaculty');
    assert(typeof facultyAvail.data.summary.occupiedFaculty === 'number', 'Summary contains occupiedFaculty');
    assert(typeof facultyAvail.data.summary.availableFaculty === 'number', 'Summary contains availableFaculty');
    assert(
      facultyAvail.data.summary.totalFaculty === (facultyAvail.data.summary.occupiedFaculty + facultyAvail.data.summary.availableFaculty),
      `Summary math check: total (${facultyAvail.data.summary.totalFaculty}) == occupied (${facultyAvail.data.summary.occupiedFaculty}) + available (${facultyAvail.data.summary.availableFaculty})`
    );
    assert(Array.isArray(facultyAvail.data.faculty), 'Faculty details list returned');

    // 5. Cascade Verification (Single Source of Truth)
    console.log('\n--- 5. Single Source of Truth Cascade Verification ---');
    const testDay = 'Saturday';
    const startTime = '16:00';
    const endTime = '17:00';
    const targetClass = classes[0];
    const targetSubject = subjects[0];
    const targetRoom = classrooms[0];

    // Initial availability on Saturday 16:00 - 17:00
    const initAvailCheck = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: `/api/admin/faculty-availability?department=${encodeURIComponent(testFaculty.department)}&day=${testDay}&startTime=${startTime}&endTime=${endTime}`,
      method: 'GET',
      headers: authHeaders
    });
    const initialOccupied = initAvailCheck.data.summary.occupiedFaculty;
    const initialAvailable = initAvailCheck.data.summary.availableFaculty;
    console.log(`   Initial State on ${testDay} ${startTime}-${endTime}: Occupied=${initialOccupied}, Available=${initialAvailable}`);

    // Create a new timetable entry
    const createTtRes = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/admin/timetable',
      method: 'POST',
      headers: authHeaders
    }, {
      dayOfWeek: testDay,
      startTime: startTime,
      endTime: endTime,
      classId: targetClass.id,
      subjectId: targetSubject.id,
      facultyId: testFaculty.id,
      classroomId: targetRoom.id
    });

    assert(createTtRes.status === 201 && createTtRes.data.success, 'New timetable slot created successfully in database');
    const createdSlotId = createTtRes.data.timetable.id;

    // Check Student Timetable reflects it
    const updatedStudentTt = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: `/api/admin/timetable?classId=${targetClass.id}`,
      method: 'GET',
      headers: authHeaders
    });
    const foundInStudentTt = updatedStudentTt.data.timetables.some(s => s.id === createdSlotId);
    assert(foundInStudentTt, 'Student Timetable reflects newly scheduled lecture slot');

    // Check Faculty Timetable reflects it
    const updatedFacultyTt = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: `/api/admin/faculty-timetable?department=${encodeURIComponent(testFaculty.department)}&faculty_id=${testFaculty.id}`,
      method: 'GET',
      headers: authHeaders
    });
    const foundInFacultyTt = updatedFacultyTt.data.timetables.some(s => s.id === createdSlotId);
    assert(foundInFacultyTt, 'Faculty Timetable reflects newly scheduled lecture slot');

    // Check Faculty Availability reflects Occupied
    const updatedFacultyAvail = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: `/api/admin/faculty-availability?department=${encodeURIComponent(testFaculty.department)}&day=${testDay}&startTime=${startTime}&endTime=${endTime}`,
      method: 'GET',
      headers: authHeaders
    });
    const facultyEntry = updatedFacultyAvail.data.faculty.find(f => f.id === testFaculty.id);
    assert(facultyEntry && facultyEntry.status === 'OCCUPIED', 'Faculty Availability reflects OCCUPIED live status for scheduled faculty');
    assert(facultyEntry && facultyEntry.currentActivity !== null, 'Faculty Availability includes current lecture activity');
    assert(updatedFacultyAvail.data.summary.occupiedFaculty === initialOccupied + 1, 'Faculty Availability occupied count dynamically incremented by 1');
    assert(updatedFacultyAvail.data.summary.availableFaculty === initialAvailable - 1, 'Faculty Availability available count dynamically decremented by 1');

    // Check Classroom Availability reflects Occupied for targetRoom
    const updatedClassroomAvail = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: `/api/admin/classroom-availability?day=${testDay}&startTime=${startTime}&endTime=${endTime}`,
      method: 'GET',
      headers: authHeaders
    });
    const roomEntry = (updatedClassroomAvail.data.rooms || updatedClassroomAvail.data.classrooms).find(c => c.id === targetRoom.id);
    assert(roomEntry && roomEntry.status === 'OCCUPIED', 'Classroom Availability reflects OCCUPIED for scheduled room');

    // Clean up test entry
    console.log('\n--- 6. Clean up & Availability Restoration ---');
    const deleteTtRes = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: `/api/admin/timetable/${createdSlotId}`,
      method: 'DELETE',
      headers: authHeaders
    });
    assert(deleteTtRes.status === 200 && deleteTtRes.data.success, 'Test timetable slot deleted successfully');

    // Check Faculty Availability restored
    const restoredFacultyAvail = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: `/api/admin/faculty-availability?department=${encodeURIComponent(testFaculty.department)}&day=${testDay}&startTime=${startTime}&endTime=${endTime}`,
      method: 'GET',
      headers: authHeaders
    });
    const restoredFacultyEntry = restoredFacultyAvail.data.faculty.find(f => f.id === testFaculty.id);
    assert(restoredFacultyEntry && restoredFacultyEntry.status === 'AVAILABLE', 'Faculty Availability dynamically restored to AVAILABLE');
    assert(restoredFacultyAvail.data.summary.occupiedFaculty === initialOccupied, 'Occupied count restored');
    assert(restoredFacultyAvail.data.summary.availableFaculty === initialAvailable, 'Available count restored');

    // Check Classroom Availability restored
    const restoredClassroomAvail = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: `/api/admin/classroom-availability?day=${testDay}&startTime=${startTime}&endTime=${endTime}`,
      method: 'GET',
      headers: authHeaders
    });
    const restoredRoomEntry = (restoredClassroomAvail.data.rooms || restoredClassroomAvail.data.classrooms).find(c => c.id === targetRoom.id);
    assert(restoredRoomEntry && restoredRoomEntry.status === 'AVAILABLE', 'Classroom Availability dynamically restored to AVAILABLE');

  } catch (error) {
    console.error('💥 Test execution error:', error);
    failed++;
  }

  console.log('\n================================================================');
  console.log(`📊 TEST RESULTS: ${passed} PASSED | ${failed} FAILED`);
  console.log('================================================================');
  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTimetableSuite();
