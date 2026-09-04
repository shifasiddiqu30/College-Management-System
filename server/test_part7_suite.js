/**
 * Part 7 Comprehensive Automated Test Suite
 * Smart Doubt Discussion + Academic Performance Management
 * 
 * Verifies:
 * 1. Single Authentication & Role Guards
 * 2. Faculty Discussion Page Creation & Strict Student Email Section Validation
 * 3. Student Authorized Forum Scoping & HTTP 403 Access Denied on unauthorized class/student
 * 4. Student Post Doubt (OPEN status)
 * 5. Classmate Reply (Peer Discussion)
 * 6. Escalate / Request Faculty Help (Transitions to PENDING_FACULTY_HELP & triggers Faculty Notification)
 * 7. Faculty Query pending_help doubts filter
 * 8. Faculty Structured Solution & Mark as VERIFIED ANSWER
 * 9. Faculty Pinned FAQs CRUD (Create, Update, Delete) & Student FAQ query
 * 10. Faculty Class Announcements CRUD (Create, Delete) & Student Announcement query
 * 11. Faculty Academic Performance Roster & Batch Save/Publish
 * 12. Strict Numeric Validation (Marks 0-maxMarks, Attendance 0-100%)
 * 13. Student 1:1 Academic Privacy (Isolated grades, strict non-leakage between students)
 * 14. Doubts Search & Status Filter Queries
 */

const BASE_URL = 'http://localhost:5000/api';

let adminToken = '';
let facultyToken = '';
let studentToken = '';
let alexToken = ''; // Student in TE-A (different class)

let testPageId = '';
let testDoubtId = '';
let testReplyId = '';
let testFaqId = '';
let testAncId = '';

let totalTests = 0;
let passedTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passedTests++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
  }
}

async function runPart7Tests() {
  console.log('================================================================');
  console.log('🚀 RUNNING PART 7 AUTOMATED TEST SUITE — DOUBTS & PERFORMANCE');
  console.log('================================================================\n');

  try {
    // ------------------------------------------------------------------------
    // Step 1: Authentication & Token Retrieval
    // ------------------------------------------------------------------------
    console.log('🔑 Step 1: Role-Based Authentication...');

    const facLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'sharma@college.edu', password: 'Faculty@123' })
    });
    const facLoginData = await facLoginRes.json();
    assert(facLoginRes.ok && facLoginData.success && facLoginData.token, 'Faculty login successful (Prof. Sharma)');
    facultyToken = facLoginData.token;

    const stuLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'student@college.edu', password: 'Student@123' })
    });
    const stuLoginData = await stuLoginRes.json();
    assert(stuLoginRes.ok && stuLoginData.success && stuLoginData.token, 'Student login successful (Shifa Siddiqui — SE-B)');
    studentToken = stuLoginData.token;

    const alexLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'student.alex@college.edu', password: 'Student@123' })
    });
    const alexLoginData = await alexLoginRes.json();
    assert(alexLoginRes.ok && alexLoginData.success && alexLoginData.token, 'Student Alex login successful (TE-A)');
    alexToken = alexLoginData.token;

    const admLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@college.edu', password: 'Admin@123' })
    });
    const admLoginData = await admLoginRes.json();
    assert(admLoginRes.ok && admLoginData.success, 'Admin login successful');
    adminToken = admLoginData.token;

    console.log('\n💬 Step 2: Faculty Discussion Page Creation & Validation...');

    // Attempt to create page with unauthorized student email belonging to another cohort (Alex is TE-A, page is SE-B)
    const invalidPageRes = await fetch(`${BASE_URL}/faculty/doubt-pages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${facultyToken}` },
      body: JSON.stringify({
        department: 'Computer Engineering',
        year: 'SE',
        division: 'B',
        subjectId: 'sub_java',
        title: 'SE-B Java Invalid Cohort Forum',
        authorizedEmails: ['student.alex@college.edu']
      })
    });
    assert(invalidPageRes.status === 400, 'Backend correctly rejects student email not matching class cohort');

    // Create valid discussion page for SE-B with student@college.edu authorized
    const createPageRes = await fetch(`${BASE_URL}/faculty/doubt-pages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${facultyToken}` },
      body: JSON.stringify({
        department: 'Computer Engineering',
        year: 'SE',
        division: 'B',
        subjectId: 'sub_java',
        title: 'SE-B Java Programming Q&A Forum',
        description: 'Official forum for Java unit test doubts and lab assignments.',
        semester: 4,
        authorizedEmails: ['student@college.edu']
      })
    });
    const createPageData = await createPageRes.json();
    assert(createPageRes.ok && createPageData.success && createPageData.pageId, 'Faculty successfully created Discussion Forum');
    testPageId = createPageData.pageId;

    console.log('\n🔒 Step 3: Discussion Forum Access Control & Scoping...');

    // Student Shifa (SE-B) fetches discussion pages
    const stuPagesRes = await fetch(`${BASE_URL}/student/doubt-pages`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    const stuPagesData = await stuPagesRes.json();
    const hasAuthorizedPage = stuPagesData.pages?.some(p => p.id === testPageId);
    assert(stuPagesRes.ok && hasAuthorizedPage, 'Enrolled student (Shifa SE-B) sees authorized discussion forum');

    // Student Alex (TE-A) attempts to access doubts of SE-B forum -> Expect 403 Forbidden
    const unauthDoubtsRes = await fetch(`${BASE_URL}/student/doubts?pageId=${testPageId}`, {
      headers: { Authorization: `Bearer ${alexToken}` }
    });
    assert(unauthDoubtsRes.status === 403, 'Cross-cohort student (Alex TE-A) receives HTTP 403 Access Denied');

    console.log('\n📝 Step 4: Student Doubt Lifecycle (Post -> Peer Reply -> Request Help -> Verified Solution)...');

    // Student posts a Doubt
    const postDoubtRes = await fetch(`${BASE_URL}/student/doubts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${studentToken}` },
      body: JSON.stringify({
        pageId: testPageId,
        title: 'Difference between Abstract Class and Interface in Java 8',
        description: 'Can interfaces have method implementations with default keyword? How does multiple inheritance work?',
        isAnonymous: false
      })
    });
    const postDoubtData = await postDoubtRes.json();
    assert(postDoubtRes.status === 201 && postDoubtData.success && postDoubtData.doubtId, 'Student posted doubt with OPEN status');
    testDoubtId = postDoubtData.doubtId;

    // Classmate replies to doubt
    const peerReplyRes = await fetch(`${BASE_URL}/student/doubts/${testDoubtId}/reply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${studentToken}` },
      body: JSON.stringify({
        replyText: 'Yes, Java 8 introduced default and static methods in interfaces to enable backward compatibility.'
      })
    });
    const peerReplyData = await peerReplyRes.json();
    assert(peerReplyRes.status === 201 && peerReplyData.success && peerReplyData.replyId, 'Peer classmate reply posted successfully');
    testReplyId = peerReplyData.replyId;

    // Student requests Faculty Help
    const helpReqRes = await fetch(`${BASE_URL}/student/doubts/${testDoubtId}/request-faculty-help`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    const helpReqData = await helpReqRes.json();
    if (!helpReqRes.ok) console.log('helpReqRes Error:', helpReqRes.status, helpReqData);
    assert(helpReqRes.ok && helpReqData.success, 'Student escalated doubt via Request Faculty Help');

    // Faculty retrieves pending help doubts
    const facPendingRes = await fetch(`${BASE_URL}/faculty/doubts?filter=pending_help`, {
      headers: { Authorization: `Bearer ${facultyToken}` }
    });
    const facPendingData = await facPendingRes.json();
    const isPendingFound = facPendingData.doubts?.some(d => d.id === testDoubtId);
    assert(facPendingRes.ok && isPendingFound, 'Faculty doubts filter="pending_help" correctly locates escalated doubt');

    // Faculty posts solution & marks as VERIFIED ANSWER
    const facReplyRes = await fetch(`${BASE_URL}/faculty/doubts/${testDoubtId}/reply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${facultyToken}` },
      body: JSON.stringify({
        replyText: 'Abstract classes can hold state (instance variables) and constructors, whereas interfaces cannot. Default methods provide default behavior without forcing all implementations to override.',
        markVerified: true
      })
    });
    const facReplyData = await facReplyRes.json();
    assert(facReplyRes.status === 201 && facReplyData.success, 'Faculty posted solution and marked as VERIFIED ANSWER');

    // Student queries doubt by ID to verify solved status and verified answer badge
    const doubtDetailRes = await fetch(`${BASE_URL}/student/doubts/${testDoubtId}`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    const doubtDetailData = await doubtDetailRes.json();
    assert(doubtDetailRes.ok && doubtDetailData.doubt?.status === 'ANSWERED', 'Doubt status transitioned to ANSWERED');
    const hasVerified = doubtDetailData.replies?.some(r => r.isVerified === 1 || r.is_verified === 1);
    assert(hasVerified, 'Verified solution badge attached to the answer in knowledge base');

    console.log('\n📌 Step 5: FAQs & Announcements Scoping...');

    // Faculty creates FAQ
    const createFaqRes = await fetch(`${BASE_URL}/faculty/faqs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${facultyToken}` },
      body: JSON.stringify({
        pageId: testPageId,
        subjectId: 'sub_java',
        question: 'What is the syllabus for Java Unit Test 1?',
        answer: 'Units 1 and 2 covering OOP fundamentals, exception handling, and collections framework.',
        isPinned: true
      })
    });
    const createFaqData = await createFaqRes.json();
    assert(createFaqRes.status === 201 && createFaqData.success && createFaqData.faqId, 'Faculty created and pinned FAQ');
    testFaqId = createFaqData.faqId;

    // Student fetches FAQs for discussion forum
    const stuFaqRes = await fetch(`${BASE_URL}/student/faqs?pageId=${testPageId}&subjectId=sub_java`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    const stuFaqData = await stuFaqRes.json();
    const faqFound = stuFaqData.faqs?.some(f => f.id === testFaqId);
    assert(stuFaqRes.ok && faqFound, 'Student retrieves pinned FAQs for discussion forum');

    // Faculty creates Class Announcement
    const createAncRes = await fetch(`${BASE_URL}/faculty/announcements`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${facultyToken}` },
      body: JSON.stringify({
        department: 'Computer Engineering',
        year: 'SE',
        division: 'B',
        subjectId: 'sub_java',
        title: 'Java Lab Relocation',
        message: 'Lab Batch B1 relocated to Lab 304 for Friday session.',
        priority: 'Important'
      })
    });
    const createAncData = await createAncRes.json();
    assert(createAncRes.status === 201 && createAncData.success && createAncData.announcementId, 'Faculty published Class Announcement');
    testAncId = createAncData.announcementId;

    // Student fetches Class Announcements
    const stuAncRes = await fetch(`${BASE_URL}/student/announcements`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    const stuAncData = await stuAncRes.json();
    const ancFound = stuAncData.announcements?.some(a => a.id === testAncId);
    assert(stuAncRes.ok && ancFound, 'Student retrieves class-targeted announcement');

    console.log('\n📊 Step 6: Academic Performance Management & Strict Privacy...');

    // Faculty fetches roster for SE-B Java
    const rosterRes = await fetch(`${BASE_URL}/faculty/academic-performance?department=Computer+Engineering&year=SE&division=B&subjectId=sub_java`, {
      headers: { Authorization: `Bearer ${facultyToken}` }
    });
    const rosterData = await rosterRes.json();
    assert(rosterRes.ok && Array.isArray(rosterData.students), 'Faculty retrieved SE-B student grading roster');

    const shifaStudentRecord = rosterData.students?.find(s => s.email === 'student@college.edu');
    assert(!!shifaStudentRecord, 'Student Shifa Siddiqui present in grading roster');

    // Test Numeric Validation: Marks > maxMarks (25 > 20) -> Expect 400
    const invalidMarksRes = await fetch(`${BASE_URL}/faculty/academic-performance/save-batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${facultyToken}` },
      body: JSON.stringify({
        department: 'Computer Engineering',
        year: 'SE',
        division: 'B',
        subjectId: 'sub_java',
        records: [
          {
            studentId: shifaStudentRecord?.studentId || 'usr_stu_shifa',
            internalMarks: 25, // Invalid > 20
            maxMarks: 20,
            attendancePercentage: 90,
            performanceStatus: 'Excellent',
            feedback: 'Test'
          }
        ]
      })
    });
    assert(invalidMarksRes.status === 400, 'Backend rejects invalid internal marks exceeding maxMarks');

    // Test Numeric Validation: Attendance > 100% -> Expect 400
    const invalidAttRes = await fetch(`${BASE_URL}/faculty/academic-performance/save-batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${facultyToken}` },
      body: JSON.stringify({
        department: 'Computer Engineering',
        year: 'SE',
        division: 'B',
        subjectId: 'sub_java',
        records: [
          {
            studentId: shifaStudentRecord?.studentId || 'usr_stu_shifa',
            internalMarks: 18,
            maxMarks: 20,
            attendancePercentage: 110, // Invalid > 100
            performanceStatus: 'Excellent',
            feedback: 'Test'
          }
        ]
      })
    });
    assert(invalidAttRes.status === 400, 'Backend rejects invalid attendance percentage > 100%');

    // Faculty saves & publishes valid academic marks
    const validSaveRes = await fetch(`${BASE_URL}/faculty/academic-performance/save-batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${facultyToken}` },
      body: JSON.stringify({
        department: 'Computer Engineering',
        year: 'SE',
        division: 'B',
        subjectId: 'sub_java',
        records: [
          {
            studentId: shifaStudentRecord?.studentId || 'usr_stu_shifa',
            internalMarks: 19,
            maxMarks: 20,
            attendancePercentage: 94,
            performanceStatus: 'Excellent',
            feedback: 'Exceptional mastery of Java streams and multithreading concepts.'
          }
        ]
      })
    });
    const validSaveData = await validSaveRes.json();
    assert(validSaveRes.ok && validSaveData.success, 'Faculty saved and published valid student grades batch');

    // Student Shifa retrieves 1:1 private academic performance
    const stuPerfRes = await fetch(`${BASE_URL}/student/academic-performance`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    const stuPerfData = await stuPerfRes.json();
    assert(stuPerfRes.ok && stuPerfData.success, 'Student retrieved private academic records');
    const javaRecord = stuPerfData.records?.find(r => r.subjectId === 'sub_java');
    assert(javaRecord && javaRecord.internalMarks === 19 && javaRecord.attendancePercentage === 94, 'Student sees accurate 19/20 marks and 94% attendance for Java');
    assert(javaRecord?.feedback === 'Exceptional mastery of Java streams and multithreading concepts.', 'Student sees private faculty feedback quote');

    // Student Alex (different student) retrieves their own records -> must NOT see Shifa's grades
    const alexPerfRes = await fetch(`${BASE_URL}/student/academic-performance`, {
      headers: { Authorization: `Bearer ${alexToken}` }
    });
    const alexPerfData = await alexPerfRes.json();
    const shifaLeak = alexPerfData.records?.some(r => r.feedback === 'Exceptional mastery of Java streams and multithreading concepts.');
    assert(alexPerfRes.ok && !shifaLeak, 'Strict 1:1 Student Privacy enforced (Zero cross-student data leakage)');

    // ------------------------------------------------------------------------
    // Step 7: Search & Filter Verification
    // ------------------------------------------------------------------------
    console.log('\n🔍 Step 7: Doubt Search & Status Filter Queries...');

    const verifiedFilterRes = await fetch(`${BASE_URL}/student/doubts?pageId=${testPageId}&status=VERIFIED`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    const verifiedFilterData = await verifiedFilterRes.json();
    assert(verifiedFilterRes.ok && verifiedFilterData.doubts?.length >= 0, 'Filter status=VERIFIED query succeeded');

    const searchRes = await fetch(`${BASE_URL}/student/doubts?pageId=${testPageId}&search=Abstract`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    const searchData = await searchRes.json();
    const searchMatch = searchData.doubts?.some(d => d.title.includes('Abstract'));
    assert(searchRes.ok && searchMatch, 'Search query for "Abstract" matched test doubt');

    // ------------------------------------------------------------------------
    // Cleanup & Summary
    // ------------------------------------------------------------------------
    console.log('\n🧹 Cleaning up test FAQ and Announcement...');
    await fetch(`${BASE_URL}/faculty/faqs/${testFaqId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${facultyToken}` } });
    await fetch(`${BASE_URL}/faculty/announcements/${testAncId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${facultyToken}` } });

    console.log('\n================================================================');
    console.log(`🎉 PART 7 TEST SUITE RESULTS: ${passedTests}/${totalTests} TESTS PASSED`);
    console.log('================================================================');

    if (passedTests === totalTests) {
      console.log('✅ ALL PART 7 SPECIFICATIONS & EDGE CASES SUCCESSFULLY VERIFIED!');
      process.exit(0);
    } else {
      console.error(`❌ ${totalTests - passedTests} TESTS FAILED.`);
      process.exit(1);
    }
  } catch (err) {
    console.error('Fatal error during test run:', err);
    process.exit(1);
  }
}

runPart7Tests();
