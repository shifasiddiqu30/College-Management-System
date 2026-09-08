/**
 * Test Suite: Real Timetable Data Verification
 * Verifies that the demo timetable records have been replaced by the accurate
 * timetables extracted from the 5 attached images:
 * - Computer Engineering — Div A
 * - Computer Engineering — Div B
 * - Computer Engineering — Div C
 * - AI & Data Science — Div A
 * - AI & Data Science — Div B
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

async function runRealTimetableVerification() {
  console.log('======================================================================');
  console.log('🎓 VERIFYING REAL TIMETABLE DATA ACROSS ALL 5 DIVISIONS');
  console.log('======================================================================\n');

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
    // 1. Authenticate Admin
    console.log('--- 1. Authenticating Admin ---');
    const adminLogin = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { email: 'admin@college.edu', password: 'Admin@123' });

    assert(adminLogin.status === 200 && adminLogin.data?.token, 'Admin Login successful');
    const adminToken = adminLogin.data?.token;
    const authHeaders = {
      'Authorization': `Bearer ${adminToken}`,
      'Content-Type': 'application/json'
    };

    // 2. Verify Computer Engineering — Division A
    console.log('\n--- 2. Computer Engineering — Division A Timetable ---');
    const ceARes = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/admin/timetable?department=Computer%20Engineering&year=SE&division=A',
      method: 'GET',
      headers: authHeaders
    });
    assert(ceARes.status === 200 && ceARes.data.success, 'Fetch Comp Engg Div A timetable returns 200 OK');
    const ceASlots = ceARes.data.timetables;
    assert(ceASlots.length >= 20, `Comp Engg Div A has complete lecture/lab count (found ${ceASlots.length} slots)`);
    // Verify Monday 09:15-11:15 lab batches
    const ceAMonLabs = ceASlots.filter(s => s.dayOfWeek === 'Monday' && s.startTime === '09:15');
    assert(ceAMonLabs.length === 3, 'Comp Engg Div A Monday 09:15 has 3 parallel lab batches (SA1, SA2, SA3)');
    assert(ceAMonLabs.some(s => s.roomNumber === 'FF123' && s.facultyName?.includes('Awanti')), 'Batch SA1: COA Lab with Ms. Awanti S Dhekane in FF123');
    assert(ceAMonLabs.some(s => s.roomNumber === 'FF125' && s.facultyName?.includes('Yogita')), 'Batch SA2: AOA Lab with Ms. Yogita R Chavan in FF125');
    assert(ceAMonLabs.some(s => s.roomNumber === 'FF121' && s.facultyName?.includes('Ankita')), 'Batch SA3: FSJP Lab with Ms. Ankita A Pange in FF121');

    // 3. Verify Computer Engineering — Division B
    console.log('\n--- 3. Computer Engineering — Division B Timetable ---');
    const ceBRes = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/admin/timetable?department=Computer%20Engineering&year=SE&division=B',
      method: 'GET',
      headers: authHeaders
    });
    assert(ceBRes.status === 200 && ceBRes.data.success, 'Fetch Comp Engg Div B timetable returns 200 OK');
    const ceBSlots = ceBRes.data.timetables;
    assert(ceBSlots.length >= 20, `Comp Engg Div B has complete lecture/lab count (found ${ceBSlots.length} slots)`);
    // Verify Monday 09:15 MCE with SJK in FF101
    const ceBMon1 = ceBSlots.find(s => s.dayOfWeek === 'Monday' && s.startTime === '09:15');
    assert(ceBMon1 && ceBMon1.subjectName?.includes('Mathematics') && ceBMon1.facultyName?.includes('Shaheen'), 'Monday Period 1: MCE with Ms. Shaheen J Khan');
    assert(ceBMon1 && ceBMon1.roomNumber === 'FF101', 'Monday Period 1 room is FF101');

    // 4. Verify Computer Engineering — Division C
    console.log('\n--- 4. Computer Engineering — Division C Timetable ---');
    const ceCRes = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/admin/timetable?department=Computer%20Engineering&year=SE&division=C',
      method: 'GET',
      headers: authHeaders
    });
    assert(ceCRes.status === 200 && ceCRes.data.success, 'Fetch Comp Engg Div C timetable returns 200 OK');
    const ceCSlots = ceCRes.data.timetables;
    assert(ceCSlots.length >= 20, `Comp Engg Div C has complete lecture/lab count (found ${ceCSlots.length} slots)`);
    // Verify Monday 09:15 FSJP with CSP in FF102
    const ceCMon1 = ceCSlots.find(s => s.dayOfWeek === 'Monday' && s.startTime === '09:15');
    console.log('   ceCMon1 found:', JSON.stringify(ceCMon1));
    assert(ceCMon1 && ceCMon1.subjectName?.includes('Full Stack Java') && ceCMon1.facultyName?.includes('Charushila'), 'Monday Period 1: FSJP with Ms. Charushila S Pawar', JSON.stringify(ceCMon1));
    assert(ceCMon1 && ceCMon1.roomNumber === 'FF102', 'Monday Period 1 room is FF102');

    // 5. Verify AI & Data Science — Division A
    console.log('\n--- 5. AI & Data Science — Division A Timetable ---');
    const aidsARes = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/admin/timetable?department=Artificial%20Intelligence%20%26%20Data%20Science&year=SE&division=A',
      method: 'GET',
      headers: authHeaders
    });
    assert(aidsARes.status === 200 && aidsARes.data.success, 'Fetch AI&DS Div A timetable returns 200 OK');
    const aidsASlots = aidsARes.data.timetables;
    assert(aidsASlots.length >= 20, `AI&DS Div A has complete lecture/lab count (found ${aidsASlots.length} slots)`);
    // Verify Monday 09:15 Maths(T) in LG004
    const aidsAMon1 = aidsASlots.find(s => s.dayOfWeek === 'Monday' && s.startTime === '09:15');
    assert(aidsAMon1 && aidsAMon1.roomNumber === 'LG004', 'Monday Period 1 room is LG004');
    assert(aidsAMon1 && aidsAMon1.facultyName?.includes('Malagouda'), 'Monday Period 1: MATHS(T) with Mr. Malagouda Poojary');

    // 6. Verify AI & Data Science — Division B
    console.log('\n--- 6. AI & Data Science — Division B Timetable ---');
    const aidsBRes = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/admin/timetable?department=Artificial%20Intelligence%20%26%20Data%20Science&year=SE&division=B',
      method: 'GET',
      headers: authHeaders
    });
    assert(aidsBRes.status === 200 && aidsBRes.data.success, 'Fetch AI&DS Div B timetable returns 200 OK');
    const aidsBSlots = aidsBRes.data.timetables;
    assert(aidsBSlots.length >= 20, `AI&DS Div B has complete lecture/lab count (found ${aidsBSlots.length} slots)`);
    // Verify Monday 09:15-11:15 Labs (COAL with GVK in SF202, FSJP with BD in SF203, AOAL with PPU in SF201)
    const aidsBMonLabs = aidsBSlots.filter(s => s.dayOfWeek === 'Monday' && s.startTime === '09:15');
    assert(aidsBMonLabs.length === 3, 'AI&DS Div B Monday 09:15 has 3 parallel lab batches (S1, S2, S3)');
    assert(aidsBMonLabs.some(s => s.roomNumber === 'SF202' && s.facultyName?.includes('Geetanjali')), 'Batch S1: COAL with Dr. Geetanjali Kale in SF202');
    assert(aidsBMonLabs.some(s => s.roomNumber === 'SF203' && s.facultyName?.includes('Bhakti')), 'Batch S2: FSJP Lab with Ms. Bhakti Deshmukh in SF203');
    assert(aidsBMonLabs.some(s => s.roomNumber === 'SF201' && s.facultyName?.includes('Pratyush')), 'Batch S3: AOAL with Mr. Pratyush Urade in SF201');

    // 7. Verify Faculty Timetable (e.g. Dr. Geetanjali Kale)
    console.log('\n--- 7. Faculty Timetable API ---');
    const gvkTimetableRes = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/admin/faculty-timetable?department=Artificial%20Intelligence%20%26%20Data%20Science&faculty_id=usr_fac_gvk_001',
      method: 'GET',
      headers: authHeaders
    });
    assert(gvkTimetableRes.status === 200 && gvkTimetableRes.data.success, 'Fetch Dr. Geetanjali Kale weekly timetable returns 200 OK');
    assert(gvkTimetableRes.data.timetables?.length > 0, `Dr. Geetanjali Kale has ${gvkTimetableRes.data.timetables?.length} teaching slots across SE-A & SE-B`);

    // 8. Verify Student Login & Timetable Access (Shifa Siddiqui - Comp SE-B)
    console.log('\n--- 8. Student Timetable Access (Comp SE-B) ---');
    const studentLogin = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { email: 'student@college.edu', password: 'Student@123' });

    assert(studentLogin.status === 200 && studentLogin.data?.token, 'Student Login successful');
    const studentToken = studentLogin.data?.token;
    const studentTtRes = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/student/timetable',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${studentToken}` }
    });
    assert(studentTtRes.status === 200 && studentTtRes.data.success, 'Student retrieves own cohort timetable (Computer Engineering SE-B)');
    assert(studentTtRes.data.weeklyGrid?.Monday?.length > 0, 'Student sees Monday schedule populated with real timetable lectures');

  } catch (error) {
    console.error('💥 Test execution error:', error);
    failed++;
  }

  console.log('\n======================================================================');
  console.log(`📊 REAL TIMETABLE VERIFICATION: ${passed} PASSED | ${failed} FAILED`);
  console.log('======================================================================');
  if (failed > 0) process.exit(1);
  else process.exit(0);
}

runRealTimetableVerification();
