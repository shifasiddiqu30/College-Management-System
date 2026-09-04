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

async function runPart4Tests() {
  console.log('🧪 Starting Automated Test Suite for PART 4 — Faculty Dashboard & Features\n');
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
    // 1. Authenticate Faculty (Sharma Ma'am)
    console.log('🔐 1. Authenticating Faculty, Admin, and Student Accounts...');
    const facLogin = await makeRequest('POST', '/api/auth/login', {
      email: 'sharma@college.edu',
      password: 'Faculty@123'
    });
    assert(facLogin.status === 200 && facLogin.body.token, "Faculty Sharma Ma'am login returns 200 and JWT token");
    const facToken = facLogin.body.token;

    // Faculty Prof. Robert Downey
    const fac2Login = await makeRequest('POST', '/api/auth/login', {
      email: 'faculty.cs@college.edu',
      password: 'Faculty@123'
    });
    assert(fac2Login.status === 200 && fac2Login.body.token, 'Faculty Prof. Robert Downey login successful');
    const fac2Token = fac2Login.body.token;

    // Student Shifa
    const stuLogin = await makeRequest('POST', '/api/auth/login', {
      email: 'student@college.edu',
      password: 'Student@123'
    });
    assert(stuLogin.status === 200 && stuLogin.body.token, 'Student Shifa login successful');
    const stuToken = stuLogin.body.token;

    // Student Alex
    const stuAlexLogin = await makeRequest('POST', '/api/auth/login', {
      email: 'student.alex@college.edu',
      password: 'Student@123'
    });
    const stuAlexToken = stuAlexLogin.body.token;

    // Admin
    const adminLogin = await makeRequest('POST', '/api/auth/login', {
      email: 'admin@college.edu',
      password: 'Admin@123'
    });
    const adminToken = adminLogin.body.token;

    // 2. Test Faculty Dashboard Stats
    console.log("\n📊 2. Testing Faculty Dashboard Stats & Profile...");
    const statsRes = await makeRequest('GET', '/api/faculty/dashboard-stats', null, facToken);
    assert(statsRes.status === 200 && statsRes.body.success, 'Faculty dashboard stats loaded successfully');
    assert(statsRes.body.stats.weeklyLecturesCount > 0, `Weekly lectures count is ${statsRes.body.stats.weeklyLecturesCount}`);
    assert(statsRes.body.profile.department === 'Computer Engineering', 'Faculty department correctly identified');

    const profileRes = await makeRequest('GET', '/api/faculty/profile', null, facToken);
    assert(profileRes.status === 200 && profileRes.body.profile.name === "Sharma Ma'am", "Profile returns Sharma Ma'am");

    // 3. Test Timetable & Current Lecture calculation
    console.log("\n📅 3. Testing Timetable & Assigned Lectures...");
    const ttRes = await makeRequest('GET', '/api/faculty/timetable', null, facToken);
    assert(ttRes.status === 200 && ttRes.body.weeklyGrid.Monday.length > 0, 'Timetable weekly grid returns Monday slots');
    assert(ttRes.body.assignedClassrooms.length > 0, `Assigned classrooms identified (${ttRes.body.assignedClassrooms.length} rooms)`);

    // 4. Test Classroom Availability
    console.log("\n🏫 4. Testing Classroom Availability Matrix...");
    const availRes = await makeRequest('GET', '/api/faculty/classroom-availability?day=Monday&startTime=10:00&endTime=11:00', null, facToken);
    assert(availRes.status === 200 && availRes.body.rooms.length > 0, 'Classroom availability returned rooms');
    const room301 = availRes.body.rooms.find(r => r.roomNumber === 'Room 301');
    assert(room301 && room301.status === 'OCCUPIED', 'Room 301 occupied on Monday 10-11 AM according to timetable');

    // 5. Test Personal Schedule / Reminders (Strict Privacy)
    console.log("\n🔒 5. Testing Private Personal Schedule...");
    const psList = await makeRequest('GET', '/api/faculty/personal-schedule', null, facToken);
    assert(psList.status === 200 && Array.isArray(psList.body.items), 'Fetched personal schedule for Sharma Ma\'am');
    
    // Create new private reminder
    const newPs = await makeRequest('POST', '/api/faculty/personal-schedule', {
      title: 'Submit Lab Quiz Results',
      taskDate: '2026-09-20',
      taskTime: '15:00',
      note: 'Include extra credits for recursion problem',
      category: 'Grading',
      priority: 'High'
    }, facToken);
    assert(newPs.status === 201 && newPs.body.task.id, 'Created private personal task for Sharma Ma\'am');
    const createdTaskId = newPs.body.task.id;

    // PRIVACY CHECK: Prof Downey cannot see Sharma Ma'am's task
    const downeyPs = await makeRequest('GET', '/api/faculty/personal-schedule', null, fac2Token);
    const hasSharmaTask = downeyPs.body.items.some(t => t.id === createdTaskId);
    assert(!hasSharmaTask, 'PRIVACY ENFORCED: Prof. Downey CANNOT see Sharma Ma\'am\'s personal task');

    // PRIVACY CHECK: Admin cannot see faculty personal schedule via faculty route
    const adminPs = await makeRequest('GET', '/api/faculty/personal-schedule', null, adminToken);
    assert(adminPs.status === 403, 'PRIVACY ENFORCED: Admin route access to faculty personal schedule blocked (403)');

    // 6. Test Clubs Management & Seat Limits
    console.log("\n👥 6. Testing Clubs Management & Seat Limits...");
    const clubsRes = await makeRequest('GET', '/api/faculty/clubs', null, facToken);
    assert(clubsRes.status === 200 && clubsRes.body.clubs.length > 0, 'Clubs list loaded successfully');

    // Create a new club with 1 seat
    const newClubRes = await makeRequest('POST', '/api/faculty/clubs', {
      name: 'Web3 & AI Guild',
      category: 'Technical',
      description: 'Decentralized systems and smart contracts',
      maxSeats: 1,
      registrationStartDate: '2026-08-01',
      registrationEndDate: '2026-12-31'
    }, facToken);
    assert(newClubRes.status === 201 && newClubRes.body.clubId, 'Faculty created new club');
    const testClubId = newClubRes.body.clubId;

    // Student Alex registers (Takes 1st and only seat)
    const alexRegRes = await makeRequest('POST', `/api/student/clubs/${testClubId}/register`, {}, stuAlexToken);
    assert(alexRegRes.status === 200, 'Student Alex registered for club (available seats becomes 0)');

    // Student Shifa tries to register for full club -> should fail with 400
    const shifaRegRes = await makeRequest('POST', `/api/student/clubs/${testClubId}/register`, {}, stuToken);
    assert(shifaRegRes.status === 400 && shifaRegRes.body.message.includes('Seats Full'), 'SEATS FULL ENFORCED: 2nd registration rejected with 400 Seats Full');

    // 7. Test Events Management & Deadlines
    console.log("\n🎉 7. Testing Events Management & Deadlines...");
    const eventsRes = await makeRequest('GET', '/api/faculty/events', null, facToken);
    assert(eventsRes.status === 200 && eventsRes.body.events.length > 0, 'Events list loaded successfully');

    // Test expired event registration
    const expiredReg = await makeRequest('POST', '/api/student/events/evt_induction_03/register', {}, stuToken);
    assert(expiredReg.status === 400 && expiredReg.body.message.includes('Closed'), 'DEADLINE ENFORCED: Past registration deadline rejected with 400 Registration Closed');

    // 8. Test Smart Doubt Discussion & Help Requests
    console.log("\n💬 8. Testing Smart Doubt Discussion & Faculty Help Request...");
    const doubtPagesRes = await makeRequest('GET', '/api/faculty/doubt-pages', null, facToken);
    assert(doubtPagesRes.status === 200 && doubtPagesRes.body.pages.length > 0, 'Doubt pages loaded for faculty');

    // Create a new doubt from student
    const createDoubtRes = await makeRequest('POST', '/api/student/doubts', {
      pageId: 'page_ce_se_b_java',
      title: 'How does ConcurrentHashMap lock striping work?',
      description: 'Is lock striping still used in Java 8+ or was it replaced with CAS and synchronized nodes?'
    }, stuToken);
    assert(createDoubtRes.status === 201 && createDoubtRes.body.doubtId, 'Student posted doubt to SE-B Java forum');
    const newDbtId = createDoubtRes.body.doubtId;

    // Student requests faculty help
    const reqHelpRes = await makeRequest('POST', `/api/student/doubts/${newDbtId}/request-help`, {}, stuToken);
    assert(reqHelpRes.status === 200, 'Student clicked "Request Faculty Help"');

    // Faculty queries pending help requests
    const pendingDoubts = await makeRequest('GET', '/api/faculty/doubts?filter=pending_help', null, facToken);
    const hasDoubtInPending = pendingDoubts.body.doubts.some(d => d.id === newDbtId);
    assert(hasDoubtInPending, 'Faculty sees new doubt under "Pending Faculty Help Requests"');

    // Faculty replies and marks as verified
    const replyRes = await makeRequest('POST', `/api/faculty/doubts/${newDbtId}/reply`, {
      replyText: 'In Java 8+, ConcurrentHashMap replaced Segment lock striping with CAS for initial node insertion and synchronized on individual bin heads with TreeNodes for collision resolution.',
      markVerified: true
    }, facToken);
    assert(replyRes.status === 201 && replyRes.body.replyId, 'Faculty answered doubt and marked as VERIFIED');

    // Verify doubt status became ANSWERED
    const answeredDoubt = await makeRequest('GET', `/api/faculty/doubts/${newDbtId}`, null, facToken);
    assert(answeredDoubt.body.doubt.status === 'ANSWERED', 'Doubt status is now ANSWERED');
    assert(answeredDoubt.body.replies.some(r => r.isVerified === 1), 'Reply has isVerified = 1');

    // 9. Test Academic Performance & Student 1:1 Privacy Isolation
    console.log("\n🎓 9. Testing Academic Performance & Student 1:1 Privacy Isolation...");
    const perfForClass = await makeRequest('GET', '/api/faculty/academic-performance?department=Computer+Engineering&year=SE&division=B&subjectId=sub_java', null, facToken);
    assert(perfForClass.status === 200 && perfForClass.body.students.length > 0, 'Loaded SE-B students roster for Java grading');

    // Faculty saves/publishes grades
    const savePerf = await makeRequest('POST', '/api/faculty/academic-performance/save-batch', {
      department: 'Computer Engineering',
      year: 'SE',
      division: 'B',
      subjectId: 'sub_java',
      records: [
        {
          studentId: 'usr_stu_shifa_001',
          internalMarks: 19,
          maxMarks: 20,
          attendancePercentage: 95,
          performanceStatus: 'Excellent',
          feedback: 'Exceptional mastery of Java streams and multithreading.'
        }
      ]
    }, facToken);
    assert(savePerf.status === 200, 'Faculty saved and published academic grades');

    // STRICT 1:1 PRIVACY: Student Shifa accesses her performance
    const shifaPerf = await makeRequest('GET', '/api/student/academic-performance', null, stuToken);
    assert(shifaPerf.status === 200, 'Student Shifa fetched her academic records');
    const shifaJavaRec = shifaPerf.body.records.find(r => r.subjectId === 'sub_java');
    assert(shifaJavaRec && shifaJavaRec.internalMarks === 19, 'Shifa sees her updated internal mark of 19/20');

    // PRIVACY CHECK: Student Alex cannot see Shifa\'s grades
    const alexPerf = await makeRequest('GET', '/api/student/academic-performance', null, stuAlexToken);
    const hasShifaDataInAlex = alexPerf.body.records.some(r => r.studentId === 'usr_stu_shifa_001');
    assert(!hasShifaDataInAlex, 'PRIVACY ENFORCED: Student Alex cannot access Student Shifa\'s academic grades');

    // 10. Test Faculty Notifications
    console.log("\n🔔 10. Testing Faculty Notifications...");
    const notifs = await makeRequest('GET', '/api/faculty/notifications', null, facToken);
    assert(notifs.status === 200 && notifs.body.notifications.length > 0, 'Faculty notifications loaded');

    // Mark all read
    const markReadRes = await makeRequest('PUT', '/api/faculty/notifications/mark-all-read', {}, facToken);
    assert(markReadRes.status === 200, 'Marked all faculty notifications as read');

    // 11. Security Check: Faculty cannot access Admin APIs
    console.log("\n🛡️ 11. Testing Security RBAC Guard (Faculty blocked from Admin)...");
    const adminBlockTest = await makeRequest('GET', '/api/admin/dashboard-stats', null, facToken);
    assert(adminBlockTest.status === 403, 'RBAC ENFORCED: Faculty blocked from /api/admin/dashboard-stats (403 Forbidden)');

    console.log('\n======================================================');
    console.log(`🎉 TEST SUMMARY: ${passCount} PASSED, ${failCount} FAILED`);
    console.log('======================================================');

    if (failCount > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('💥 Test Execution Error:', err);
    process.exit(1);
  }
}

runPart4Tests();
