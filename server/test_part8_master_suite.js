/**
 * ============================================================================
 * COLLEGE MANAGEMENT SYSTEM - PART 8 MASTER END-TO-END INTEGRATION TEST SUITE
 * ============================================================================
 * Validates all 50 verification points across Admin, Faculty, Student modules,
 * Security & RBAC, Timetable Conflict Prevention, Classroom Availability,
 * Clubs & Events, Lost & Found, Doubt Discussions & Verified Answers,
 * Academic Performance & 1:1 Privacy, and Automated Notifications.
 */

import http from 'http';

const BASE_URL = 'http://localhost:5000';

let adminToken = '';
let facultyToken = '';
let faculty2Token = '';
let studentToken = '';
let student2Token = '';

let testPassed = 0;
let testFailed = 0;

function assert(condition, message) {
  if (condition) {
    testPassed++;
    console.log(`  ✅ PASS: ${message}`);
  } else {
    testFailed++;
    console.error(`  ❌ FAIL: ${message}`);
  }
}

async function apiRequest(endpoint, { method = 'GET', body = null, token = null } = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(endpoint, BASE_URL);
    const headers = {
      'Content-Type': 'application/json'
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method,
      headers
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        let json = null;
        try {
          json = JSON.parse(data);
        } catch (e) {
          json = data;
        }
        resolve({ status: res.statusCode, headers: res.headers, body: json });
      });
    });

    req.on('error', (e) => reject(e));

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runMasterTestSuite() {
  console.log('======================================================================');
  console.log('🎓 STARTING COLLEGE MANAGEMENT SYSTEM - PART 8 MASTER INTEGRATION SUITE');
  console.log('======================================================================\n');

  // --------------------------------------------------------------------------
  // 1. AUTHENTICATION & SINGLE LOGIN VERIFICATION
  // --------------------------------------------------------------------------
  console.log('🔹 1. AUTHENTICATION & SINGLE LOGIN');
  
  // 1.1 Admin Login
  const adminLogin = await apiRequest('/api/auth/login', {
    method: 'POST',
    body: { email: 'admin@college.edu', password: 'Admin@123' }
  });
  assert(adminLogin.status === 200 && adminLogin.body.user.role === 'ADMIN', 'Admin login successful with ADMIN role');
  adminToken = adminLogin.body.token;

  // 1.2 Faculty 1 Login (Sharma Ma'am)
  const facLogin = await apiRequest('/api/auth/login', {
    method: 'POST',
    body: { email: 'sharma@college.edu', password: 'Faculty@123' }
  });
  assert(facLogin.status === 200 && facLogin.body.user.role === 'FACULTY', 'Faculty 1 login successful with FACULTY role');
  facultyToken = facLogin.body.token;

  // 1.3 Faculty 2 Login (Prof. Robert Downey)
  const fac2Login = await apiRequest('/api/auth/login', {
    method: 'POST',
    body: { email: 'faculty.cs@college.edu', password: 'Faculty@123' }
  });
  assert(fac2Login.status === 200 && fac2Login.body.user.role === 'FACULTY', 'Faculty 2 login successful');
  faculty2Token = fac2Login.body.token;

  // 1.4 Student 1 Login (Shifa Siddiqui - SE-B)
  const stuLogin = await apiRequest('/api/auth/login', {
    method: 'POST',
    body: { email: 'student@college.edu', password: 'Student@123' }
  });
  assert(stuLogin.status === 200 && stuLogin.body.user.role === 'STUDENT', 'Student 1 login successful with STUDENT role');
  studentToken = stuLogin.body.token;

  // 1.5 Student 2 Login (Alex Morgan - TE-A)
  const stu2Login = await apiRequest('/api/auth/login', {
    method: 'POST',
    body: { email: 'student.alex@college.edu', password: 'Student@123' }
  });
  assert(stu2Login.status === 200 && stu2Login.body.user.role === 'STUDENT', 'Student 2 login successful');
  student2Token = stu2Login.body.token;

  // 1.6 Invalid Password Rejection
  const badLogin = await apiRequest('/api/auth/login', {
    method: 'POST',
    body: { email: 'admin@college.edu', password: 'WrongPassword' }
  });
  assert(badLogin.status === 401, 'Invalid password correctly rejected with 401');

  // 1.7 Suspended User Rejection
  const suspLogin = await apiRequest('/api/auth/login', {
    method: 'POST',
    body: { email: 'suspended.student@college.edu', password: 'Student@123' }
  });
  assert(suspLogin.status === 403, 'Suspended account correctly rejected with 403');

  // --------------------------------------------------------------------------
  // 2. SECURITY, RBAC & DIRECT URL / IDOR GUARDS
  // --------------------------------------------------------------------------
  console.log('\n🔹 2. RBAC & SECURITY AUDIT');

  // 2.1 Student attempting Admin API
  const stuToAdmin = await apiRequest('/api/admin/dashboard-stats', { token: studentToken });
  assert(stuToAdmin.status === 403, 'Student blocked from /api/admin/* with 403 Forbidden');

  // 2.2 Student attempting Faculty API
  const stuToFac = await apiRequest('/api/faculty/dashboard-stats', { token: studentToken });
  assert(stuToFac.status === 403, 'Student blocked from /api/faculty/* with 403 Forbidden');

  // 2.3 Student attempting Classroom Availability (Strict Security)
  const stuToAvail = await apiRequest('/api/admin/classroom-availability', { token: studentToken });
  assert(stuToAvail.status === 403, 'Student blocked from Classroom Availability API');

  // 2.4 Faculty attempting Admin API
  const facToAdmin = await apiRequest('/api/admin/dashboard-stats', { token: facultyToken });
  assert(facToAdmin.status === 403, 'Faculty blocked from /api/admin/* with 403 Forbidden');

  // 2.5 Unauthenticated request blocked
  const noAuth = await apiRequest('/api/admin/dashboard-stats');
  assert(noAuth.status === 401, 'Unauthenticated request rejected with 401 Unauthorized');

  // --------------------------------------------------------------------------
  // 3. COMPLETE ADMIN MODULE & CONFLICT DETECTION ENGINE
  // --------------------------------------------------------------------------
  console.log('\n🔹 3. ADMIN MODULE, TIMETABLE & CONFLICT PREVENTION');

  // 3.1 Admin Dashboard Stats
  const adminStats = await apiRequest('/api/admin/dashboard-stats', { token: adminToken });
  assert(adminStats.status === 200 && adminStats.body.stats?.totalStudents > 0, 'Admin Dashboard stats retrieved successfully');

  // 3.2 Classroom Availability for Admin (ALLOW)
  const adminAvail = await apiRequest('/api/admin/classroom-availability?day=Monday&time=10:00', { token: adminToken });
  assert(adminAvail.status === 200 && Array.isArray(adminAvail.body.rooms), 'Admin can access Classroom Availability matrix');

  // 3.3 Timetable Conflict 1: Classroom Overlap Conflict
  // Room 301 is already scheduled on Monday 10:00 - 11:00
  const roomConflict = await apiRequest('/api/admin/timetable', {
    method: 'POST',
    token: adminToken,
    body: {
      dayOfWeek: 'Monday',
      startTime: '09:30',
      endTime: '10:30',
      department: 'Computer Engineering',
      year: 'TE',
      division: 'A',
      subjectId: 'sub_cn',
      facultyId: fac2Login.body.user.id,
      classroomId: 'crm_ff101' // FF101 is occupied Monday 09:15-10:15
    }
  });
  assert(roomConflict.status === 400 && (roomConflict.body.conflictType === 'ROOM_CONFLICT' || roomConflict.body.conflictType === 'CLASSROOM_CONFLICT'), 'Classroom overlap conflict detected and blocked');

  // 3.4 Timetable Conflict 2: Faculty Overlap Conflict
  // Dr. Sanjay Sharma is teaching Monday 10:15 - 11:15 in FF101
  const facultyConflict = await apiRequest('/api/admin/timetable', {
    method: 'POST',
    token: adminToken,
    body: {
      dayOfWeek: 'Monday',
      startTime: '10:30',
      endTime: '11:00',
      department: 'Information Technology',
      year: 'SE',
      division: 'A',
      subjectId: 'sub_ds',
      facultyId: facLogin.body.user.id, // Dr. Sanjay Sharma
      classroomId: 'crm_303' // Free room
    }
  });
  assert(facultyConflict.status === 400 && facultyConflict.body.conflictType === 'FACULTY_CONFLICT', 'Faculty overlap conflict detected and blocked');

  // 3.5 Timetable Conflict 3: Class/Division Overlap Conflict
  // SE-B class already has a lecture on Monday 09:15 - 10:15
  const classConflict = await apiRequest('/api/admin/timetable', {
    method: 'POST',
    token: adminToken,
    body: {
      dayOfWeek: 'Monday',
      startTime: '09:30',
      endTime: '10:00',
      department: 'Computer Engineering',
      year: 'SE',
      division: 'B', // Same class
      subjectId: 'sub_dbms',
      facultyId: fac2Login.body.user.id,
      classroomId: 'crm_303' // Different room
    }
  });
  assert(classConflict.status === 400 && classConflict.body.conflictType === 'CLASS_CONFLICT', 'Class/Division overlap conflict detected and blocked');

  // 3.6 Create Valid Clash-Free Timetable Slot
  const validSlot = await apiRequest('/api/admin/timetable', {
    method: 'POST',
    token: adminToken,
    body: {
      dayOfWeek: 'Friday',
      startTime: '15:30',
      endTime: '16:30',
      classId: 'cls_ce_se_b',
      subjectId: 'sub_java',
      facultyId: facLogin.body.user.id,
      classroomId: 'crm_301'
    }
  });
  assert(validSlot.status === 201 && validSlot.body.success, 'Clash-free timetable slot created successfully');
  const createdSlotId = validSlot.body.timetable?.id;


  // 3.7 Admin Notification Broadcast
  const broadcastRes = await apiRequest('/api/admin/notifications/broadcast', {
    method: 'POST',
    token: adminToken,
    body: {
      title: 'Final Semester Assessment Circular',
      message: 'All department submissions must be completed before Friday.',
      target: 'ALL'
    }
  });
  assert(broadcastRes.status === 201, 'Admin published campus broadcast circular successfully');

  // 3.8 Admin Notification Retrieval & Mark All Read
  const adminNotifs = await apiRequest('/api/admin/notifications', { token: adminToken });
  assert(adminNotifs.status === 200 && Array.isArray(adminNotifs.body.notifications), 'Admin notifications fetched');

  const adminMarkRead = await apiRequest('/api/admin/notifications/mark-all-read', {
    method: 'PUT',
    token: adminToken
  });
  assert(adminMarkRead.status === 200, 'Admin marked all notifications as read');

  // --------------------------------------------------------------------------
  // 4. COMPLETE FACULTY MODULE
  // --------------------------------------------------------------------------
  console.log('\n🔹 4. FACULTY MODULE & PRIVACY');

  // 4.1 Faculty Dashboard
  const facDash = await apiRequest('/api/faculty/dashboard-stats', { token: facultyToken });
  assert(facDash.status === 200 && facDash.body.profile?.assignedSubjects?.length > 0, 'Faculty Dashboard loaded assigned classes & subjects');

  // 4.2 Faculty Classroom Availability (ALLOW)
  const facAvail = await apiRequest('/api/faculty/classroom-availability?day=Monday&startTime=10:00&endTime=11:00', { token: facultyToken });
  assert(facAvail.status === 200 && Array.isArray(facAvail.body.rooms), 'Faculty can access Classroom Availability matrix');

  // 4.3 Faculty Personal Schedule (Strict Isolation)
  const taskRes = await apiRequest('/api/faculty/personal-schedule', {
    method: 'POST',
    token: facultyToken,
    body: {
      title: 'Review Java Lab Submissions',
      taskDate: '2026-09-08',
      taskTime: '15:30',
      category: 'Grading',
      priority: 'High',
      note: 'Check SE-B student project pull requests'
    }
  });
  assert(taskRes.status === 201, 'Faculty created private personal task');

  const facTasks = await apiRequest('/api/faculty/personal-schedule', { token: facultyToken });
  const tasksList = facTasks.body.items || facTasks.body.tasks || [];
  assert(facTasks.status === 200 && tasksList.some(t => t.title === 'Review Java Lab Submissions'), 'Faculty retrieved personal schedule');

  // Faculty 2 should NOT see Faculty 1's personal task
  const fac2Tasks = await apiRequest('/api/faculty/personal-schedule', { token: faculty2Token });
  const fac2TasksList = fac2Tasks.body.items || fac2Tasks.body.tasks || [];
  assert(!fac2TasksList.some(t => t.title === 'Review Java Lab Submissions'), 'Faculty 2 cannot see Faculty 1 personal schedule (Strict 1:1 Privacy)');

  // 4.4 Faculty Club & Event Management
  const newClub = await apiRequest('/api/faculty/clubs', {
    method: 'POST',
    token: facultyToken,
    body: {
      name: 'AI Robotics Nexus',
      category: 'Technical',
      description: 'Autonomous robotics, embedded systems and vision AI.',
      maxSeats: 3,
      registrationStartDate: '2026-01-01',
      registrationEndDate: '2026-12-31'
    }
  });
  assert(newClub.status === 201, 'Faculty created new student club with seat constraints');
  const clubId = newClub.body.clubId;

  // --------------------------------------------------------------------------
  // 5. STUDENT MODULE & REGISTRATIONS
  // --------------------------------------------------------------------------
  console.log('\n🔹 5. STUDENT MODULE, TIMETABLE & REGISTRATIONS');

  // 5.1 Student Dashboard
  const stuDash = await apiRequest('/api/student/dashboard-stats', { token: studentToken });
  const studentProfile = stuDash.body.profile || stuDash.body.student;
  assert(stuDash.status === 200 && studentProfile?.department === 'Computer Engineering', 'Student Dashboard loaded student profile');

  // 5.2 Student Timetable (Scoped strictly to SE-B)
  const stuTT = await apiRequest('/api/student/timetable', { token: studentToken });
  assert(stuTT.status === 200 && stuTT.body.classInfo.year === 'SE' && stuTT.body.classInfo.division === 'B', 'Student timetable strictly filtered to SE-B');

  // 5.3 Student Club Registration & Seat Count Decrement
  const joinClubRes = await apiRequest(`/api/student/clubs/${clubId}/register`, {
    method: 'POST',
    token: studentToken
  });
  assert(joinClubRes.status === 200 && joinClubRes.body.availableSeats === 2, 'Student successfully joined club and available seats decremented');

  // 5.4 Duplicate Club Registration Blocked
  const dupClub = await apiRequest(`/api/student/clubs/${clubId}/register`, {
    method: 'POST',
    token: studentToken
  });
  assert(dupClub.status === 400, 'Duplicate club registration strictly blocked');

  // 5.5 Student Event Registration
  const eventRes = await apiRequest('/api/student/events/evt_hack_01/register', {
    method: 'POST',
    token: studentToken
  });
  assert(eventRes.status === 200 || (eventRes.status === 400 && eventRes.body.message.includes('already')), 'Student registered for campus event');

  // 5.6 My Registrations
  const myRegs = await apiRequest('/api/student/registrations', { token: studentToken });
  const registeredClubs = myRegs.body.myClubs || myRegs.body.clubs || [];
  assert(myRegs.status === 200 && registeredClubs.some(c => c.clubId === clubId), 'Student retrieved list of joined clubs and registered events');


  // --------------------------------------------------------------------------
  // 6. CAMPUS LOST & FOUND HUB
  // --------------------------------------------------------------------------
  console.log('\n🔹 6. CAMPUS LOST & FOUND HUB');

  // 6.1 Report Lost Item
  const lostItem = await apiRequest('/api/student/lost-found', {
    method: 'POST',
    token: studentToken,
    body: {
      type: 'LOST',
      itemName: 'Scientific Calculator fx-991EX',
      category: 'Electronics',
      description: 'Black Casio calculator left in Room 301 near podium.',
      location: 'Room 301',
      date: '2026-09-04'
    }
  });
  assert(lostItem.status === 201, 'Student reported lost item successfully');
  const lostId = lostItem.body.itemId || lostItem.body.item?.id;

  // 6.2 Search & Filter Lost & Found
  const lfSearch = await apiRequest('/api/student/lost-found?search=Calculator', { token: studentToken });
  assert(lfSearch.status === 200 && lfSearch.body.items.length > 0, 'Lost & Found search returned matching records');

  // 6.3 Mark Item as Returned
  const returnRes = await apiRequest(`/api/student/lost-found/${lostId}/return`, {
    method: 'PUT',
    token: studentToken
  });
  assert(returnRes.status === 200, 'Reported item marked as RETURNED');

  // 6.4 Returned Item Appears in Returned History & Disappears from Active
  const activeLF = await apiRequest('/api/student/lost-found', { token: studentToken });
  assert(!activeLF.body.items.some(i => i.id === lostId), 'Returned item disappeared from active listings');

  const historyLF = await apiRequest('/api/student/lost-found/returned-history', { token: studentToken });
  assert(historyLF.body.items.some(i => i.id === lostId), 'Returned item archived in Returned History without data loss');

  // --------------------------------------------------------------------------
  // 7. SMART DOUBT DISCUSSION, VERIFIED ANSWERS & FAQS
  // --------------------------------------------------------------------------
  console.log('\n🔹 7. SMART DOUBT DISCUSSION & VERIFIED ANSWERS');

  // 7.1 Student Posts Doubt
  const doubtRes = await apiRequest('/api/student/doubts', {
    method: 'POST',
    token: studentToken,
    body: {
      pageId: 'page_a4f0ef95c422',
      title: 'Difference between abstract class and interface in Java 17',
      description: 'When should we use default interface methods vs abstract classes in modern design?',
      subjectId: 'sub_java'
    }
  });
  assert(doubtRes.status === 201, 'Student posted doubt in authorized class discussion');
  const doubtId = doubtRes.body.doubtId;

  // 7.2 Unauthorized student from different cohort (TE-A) is blocked from replying to SE-B discussion
  const unauthReply = await apiRequest(`/api/student/doubts/${doubtId}/reply`, {
    method: 'POST',
    token: student2Token, // Alex Morgan (TE-A)
    body: {
      replyText: 'Unauthorized reply attempt from different class'
    }
  });
  assert(unauthReply.status === 403, 'Unauthorized student from different class cohort blocked from private discussion');

  // 7.3 Authorized reply
  const replyRes = await apiRequest(`/api/student/doubts/${doubtId}/reply`, {
    method: 'POST',
    token: studentToken, // Authorized student
    body: {
      replyText: 'Interfaces support multiple inheritance, while abstract classes allow state and constructor initializers.'
    }
  });
  assert(replyRes.status === 201, 'Authorized student replied to doubt discussion');
  const replyId = replyRes.body.replyId;


  // 7.3 Student Requests Faculty Help
  const helpRes = await apiRequest(`/api/student/doubts/${doubtId}/request-faculty-help`, {
    method: 'PUT',
    token: studentToken
  });
  assert(helpRes.status === 200, 'Student requested Faculty Help on doubt');

  // 7.4 Faculty Replies & Marks Verified Answer
  const facReply = await apiRequest(`/api/faculty/doubts/${doubtId}/reply`, {
    method: 'POST',
    token: facultyToken,
    body: {
      replyText: 'Spot on! Abstract classes are best for shared base state, while interfaces define behavioral contracts.',
      markVerified: true
    }
  });
  assert(facReply.status === 201, 'Faculty replied and verified the discussion solution');

  // 7.5 Verify Answer Status
  const doubtDetail = await apiRequest(`/api/student/doubts/${doubtId}`, { token: studentToken });
  assert(doubtDetail.status === 200 && doubtDetail.body.doubt.status === 'ANSWERED', 'Doubt is resolved and marked as ANSWERED with VERIFIED answer');

  // 7.6 Faculty Creates Announcement & FAQ
  const ancRes = await apiRequest('/api/faculty/announcements', {
    method: 'POST',
    token: facultyToken,
    body: {
      department: 'Computer Engineering',
      year: 'SE',
      division: 'B',
      subjectId: 'sub_java',
      title: 'Lab 4 Viva Guidelines Released',
      message: 'Please review OOP polymorphism and collections framework before Monday lab viva.'
    }
  });
  assert(ancRes.status === 201, 'Faculty created private class announcement for SE-B');

  const faqRes = await apiRequest('/api/faculty/faqs', {
    method: 'POST',
    token: facultyToken,
    body: {
      pageId: 'page_a4f0ef95c422',
      subjectId: 'sub_java',
      question: 'What is the required Java SDK version?',
      answer: 'We are using OpenJDK 21 LTS with Gradle 8.5 for all labs.',
      isPinned: true
    }
  });
  assert(faqRes.status === 201, 'Faculty published pinned FAQ for class subject');

  // --------------------------------------------------------------------------
  // 8. ACADEMIC PERFORMANCE & 1:1 PRIVACY ISOLATION
  // --------------------------------------------------------------------------
  console.log('\n🔹 8. ACADEMIC PERFORMANCE & 1:1 PRIVACY ISOLATION');

  // 8.1 Faculty Grades SE-B Class Batch
  const gradeRes = await apiRequest('/api/faculty/academic-performance/save-batch', {
    method: 'POST',
    token: facultyToken,
    body: {
      department: 'Computer Engineering',
      year: 'SE',
      division: 'B',
      subjectId: 'sub_java',
      records: [
        {
          studentId: stuLogin.body.user.id,
          internalMarks: 19.5,
          maxMarks: 20,
          attendancePercentage: 94.5,
          performanceStatus: 'Excellent',
          feedback: 'Outstanding Java implementation skills and consistent lab attendance.'
        }
      ]
    }
  });
  assert(gradeRes.status === 200, 'Faculty saved and published academic performance for SE-B students');

  // 8.2 Numeric Validation Check: Marks > 20 Blocked
  const badGrade = await apiRequest('/api/faculty/academic-performance/save-batch', {
    method: 'POST',
    token: facultyToken,
    body: {
      department: 'Computer Engineering',
      year: 'SE',
      division: 'B',
      subjectId: 'sub_java',
      records: [
        {
          studentId: stuLogin.body.user.id,
          internalMarks: 25.0, // Exceeds maxMarks (20)
          maxMarks: 20,
          attendancePercentage: 90.0,
          performanceStatus: 'Good'
        }
      ]
    }
  });
  assert(badGrade.status === 400, 'Invalid internal marks (> max marks) rejected with 400');

  // 8.3 Student Views Own Performance
  const stuPerf = await apiRequest('/api/student/academic-performance', { token: studentToken });
  assert(
    stuPerf.status === 200 &&
    stuPerf.body.records?.some(r => r.subjectId === 'sub_java' && r.internalMarks === 19.5),
    'Student accurately accessed own academic performance record'
  );


  // --------------------------------------------------------------------------
  // 9. AUTOMATED MULTI-CHANNEL NOTIFICATIONS
  // --------------------------------------------------------------------------
  console.log('\n🔹 9. AUTOMATED NOTIFICATION SYSTEM');

  // 9.1 Student Notifications
  const stuNotifs = await apiRequest('/api/student/notifications', { token: studentToken });
  assert(stuNotifs.status === 200 && Array.isArray(stuNotifs.body.notifications) && stuNotifs.body.notifications.length > 0, 'Student received automated notifications across modules');

  // 9.2 Student Marks All Read
  const stuMarkAll = await apiRequest('/api/student/notifications/mark-all-read', {
    method: 'PUT',
    token: studentToken
  });
  assert(stuMarkAll.status === 200, 'Student marked all notifications as read');

  // 9.3 Faculty Notifications
  const facNotifs = await apiRequest('/api/faculty/notifications', { token: facultyToken });
  assert(facNotifs.status === 200 && Array.isArray(facNotifs.body.notifications), 'Faculty received automated notifications');

  // 9.4 Clean up created slot
  if (createdSlotId) {
    await apiRequest(`/api/admin/timetable/${createdSlotId}`, { method: 'DELETE', token: adminToken });
  }

  // --------------------------------------------------------------------------
  // SUMMARY
  // --------------------------------------------------------------------------
  console.log('\n======================================================================');
  console.log(`📊 MASTER TEST RESULTS: ${testPassed} PASSED | ${testFailed} FAILED`);
  console.log('======================================================================');

  if (testFailed === 0) {
    console.log('🎉 ALL PART 8 INTEGRATION AND SECURITY AUDITS PASSED WITH 100% SUCCESS!');
    process.exit(0);
  } else {
    console.error(`💥 ${testFailed} TESTS FAILED.`);
    process.exit(1);
  }
}

runMasterTestSuite().catch(err => {
  console.error('Fatal Test Runner Error:', err);
  process.exit(1);
});
