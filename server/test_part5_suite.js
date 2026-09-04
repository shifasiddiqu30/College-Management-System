import http from 'http';

const BASE_URL = 'http://localhost:5000';

function makeRequest(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        let parsed = null;
        try {
          parsed = JSON.parse(data);
        } catch (e) {
          parsed = data;
        }
        resolve({ status: res.statusCode, body: parsed });
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runPart5Tests() {
  console.log('🧪 Starting Automated Test Suite for PART 5 — Student Dashboard & Features\n');
  let passCount = 0;
  let failCount = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passCount++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failCount++;
    }
  }

  try {
    // 1. Authenticate Student (Shifa Siddiqui - SE-B)
    console.log('🔐 1. Authenticating Student Shifa Siddiqui (SE-B)...');
    const stuLogin = await makeRequest('POST', '/api/auth/login', {
      email: 'student@college.edu',
      password: 'Student@123'
    });
    assert(stuLogin.status === 200 && stuLogin.body.token, 'Student login returns 200 and valid JWT token');
    assert(stuLogin.body.user.role === 'STUDENT', 'User role auto-detected as STUDENT');
    assert(stuLogin.body.user.name === 'Shifa Siddiqui', 'Authenticated as Shifa Siddiqui');
    const stuToken = stuLogin.body.token;

    // Student Alex (TE-A)
    const alexLogin = await makeRequest('POST', '/api/auth/login', {
      email: 'student.alex@college.edu',
      password: 'Student@123'
    });
    assert(alexLogin.status === 200 && alexLogin.body.token, 'Student Alex (TE-A) login successful');
    const alexToken = alexLogin.body.token;

    // 2. Test Student Dashboard Stats & Profile
    console.log('\n📊 2. Testing Student Dashboard Stats & Profile...');
    const statsRes = await makeRequest('GET', '/api/student/dashboard-stats', null, stuToken);
    assert(statsRes.status === 200 && statsRes.body.success, 'Dashboard stats API loaded successfully');
    assert(statsRes.body.profile.department === 'Computer Engineering', 'Department is Computer Engineering');
    assert(statsRes.body.profile.year === 'SE', 'Academic Year is SE');
    assert(statsRes.body.profile.division === 'B', 'Division is B');
    assert(statsRes.body.profile.rollNumber === '23', 'Roll Number is 23');
    assert(statsRes.body.stats.weeklyLecturesCount > 0, `Weekly lectures count is ${statsRes.body.stats.weeklyLecturesCount}`);

    const profileRes = await makeRequest('GET', '/api/student/profile', null, stuToken);
    assert(profileRes.status === 200 && profileRes.body.profile.email === 'student@college.edu', 'Profile endpoint returned correct student email');
    assert(profileRes.body.profile.academicYear === '2026-2027', 'Academic Year returned as 2026-2027');

    // 3. Test Student Smart Timetable & Auto-Scoping
    console.log('\n📅 3. Testing Student Timetable & Class Isolation...');
    const ttRes = await makeRequest('GET', '/api/student/timetable', null, stuToken);
    assert(ttRes.status === 200 && ttRes.body.success, 'Student timetable returned successfully');
    assert(ttRes.body.classInfo.department === 'Computer Engineering', 'Class department matches SE-B');
    assert(ttRes.body.classInfo.year === 'SE', 'Class year matches SE');
    assert(ttRes.body.classInfo.division === 'B', 'Class division matches B');
    assert(ttRes.body.weeklyGrid.Monday.length > 0, 'Weekly grid populated for Monday');
    assert(ttRes.body.assignedClassrooms.length > 0, `Assigned classrooms identified (${ttRes.body.assignedClassrooms.length} venues)`);

    // Student Alex (TE-A) Timetable Isolation
    const alexTtRes = await makeRequest('GET', '/api/student/timetable', null, alexToken);
    assert(alexTtRes.body.classInfo.year === 'TE' && alexTtRes.body.classInfo.division === 'A', 'Alex automatically scoped to TE-A timetable');
    const alexMondaySubjects = alexTtRes.body.weeklyGrid.Monday.map(s => s.subjectName);
    assert(!alexMondaySubjects.includes('Java Programming'), 'Alex does NOT see Shifa\'s SE-B Java lectures');

    // 4. Test Current & Next Class Calculation
    console.log('\n⏰ 4. Testing Current & Next Class Detection...');
    assert('todaySchedule' in ttRes.body, 'Today\'s schedule exists in response');
    assert('currentClass' in ttRes.body, 'Current class field evaluated dynamically');
    assert('nextClass' in ttRes.body, 'Next class field evaluated dynamically');

    // 5. Test Classroom Availability Restriction (Backend 403)
    console.log('\n🚫 5. Testing Security: Student Blocked from Classroom Availability...');
    const studentFacAvail = await makeRequest('GET', '/api/faculty/classroom-availability', null, stuToken);
    assert(studentFacAvail.status === 403, 'SECURITY: Student blocked from /api/faculty/classroom-availability (403 Forbidden)');

    const studentAdminAvail = await makeRequest('GET', '/api/admin/classroom-availability', null, stuToken);
    assert(studentAdminAvail.status === 403, 'SECURITY: Student blocked from /api/admin/classroom-availability (403 Forbidden)');

    // 6. Test Admin & Faculty RBAC Guard (Student blocked from admin/faculty routes)
    console.log('\n🛡️ 6. Testing RBAC: Student Blocked from Admin and Faculty Portals...');
    const adminStatsTest = await makeRequest('GET', '/api/admin/dashboard-stats', null, stuToken);
    assert(adminStatsTest.status === 403, 'RBAC: Student blocked from Admin routes (403 Forbidden)');

    const facultyStatsTest = await makeRequest('GET', '/api/faculty/dashboard-stats', null, stuToken);
    assert(facultyStatsTest.status === 403, 'RBAC: Student blocked from Faculty routes (403 Forbidden)');

    // 7. Test Student Academic Performance 1:1 Privacy Isolation
    console.log('\n🎓 7. Testing Academic Performance 1:1 Isolation...');
    const shifaPerf = await makeRequest('GET', '/api/student/academic-performance', null, stuToken);
    assert(shifaPerf.status === 200 && Array.isArray(shifaPerf.body.records), 'Shifa fetched her academic records');
    const shifaHasAlexData = shifaPerf.body.records.some(r => r.studentId === 'usr_stu_alex_002');
    assert(!shifaHasAlexData, 'PRIVACY: Shifa cannot see Alex\'s grades');

    const alexPerf = await makeRequest('GET', '/api/student/academic-performance', null, alexToken);
    assert(alexPerf.status === 200, 'Alex fetched his academic records');
    const alexHasShifaData = alexPerf.body.records.some(r => r.studentId === 'usr_stu_shifa_001');
    assert(!alexHasShifaData, 'PRIVACY: Alex cannot see Shifa\'s grades');

    // 8. Test Student Notifications
    console.log('\n🔔 8. Testing Student Notifications...');
    const notifs = await makeRequest('GET', '/api/student/notifications', null, stuToken);
    assert(notifs.status === 200 && Array.isArray(notifs.body.notifications), 'Student notifications fetched');

    const markAllRead = await makeRequest('PUT', '/api/student/notifications/mark-all-read', {}, stuToken);
    assert(markAllRead.status === 200, 'Marked all student notifications as read');

    // 9. Test Clubs & Events Foundation
    console.log('\n👥 9. Testing Clubs & Events Student Foundation...');
    const clubsEvents = await makeRequest('GET', '/api/student/clubs-events', null, stuToken);
    assert(clubsEvents.status === 200 && clubsEvents.body.clubs.length > 0, 'Fetched clubs for student view');
    assert(clubsEvents.body.events.length > 0, 'Fetched campus events for student view');

    console.log('\n======================================================');
    console.log(`🎉 PART 5 TEST SUMMARY: ${passCount} PASSED, ${failCount} FAILED`);
    console.log('======================================================');

    if (failCount > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('💥 Part 5 Test Execution Error:', err);
    process.exit(1);
  }
}

runPart5Tests();
