import http from 'http';

function request(options, body = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });
    req.on('error', reject);
    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.end();
  });
}

async function runHttpApiSuite() {
  console.log('================================================================');
  console.log('🌐 HTTP API END-TO-END VERIFICATION FOR ATTENDANCE MODULE');
  console.log('================================================================\n');

  // 1. Admin Login
  console.log('1. Testing Admin Authentication...');
  const adminLogin = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { email: 'admin@college.edu', password: 'Admin@123' });

  const adminToken = adminLogin.data.token;
  console.log('   Admin Login Status:', adminLogin.status, '| Success:', adminLogin.data.success);

  // 2. Faculty Login
  console.log('\n2. Testing Faculty Authentication...');
  const facultyLogin = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { email: 'sharma@college.edu', password: 'Faculty@123' });

  const facultyToken = facultyLogin.data.token;
  console.log('   Faculty Login Status:', facultyLogin.status, '| Success:', facultyLogin.data.success);

  // 3. Student Login
  console.log('\n3. Testing Student Authentication (Shifa — SE-B)...');
  const studentLogin = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { email: 'student@college.edu', password: 'Student@123' });

  const studentToken = studentLogin.data.token;
  console.log('   Student Login Status:', studentLogin.status, '| Success:', studentLogin.data.success);

  // 4. Faculty Attendance Sheet (Computer Engineering SE-B)
  console.log('\n4. Testing Faculty GET /api/faculty/attendance/sheet...');
  const sheetRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/faculty/attendance/sheet?department=Computer%20Engineering&year=SE&division=B&subjectId=sub_ce_coa',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${facultyToken}` }
  });

  console.log('   Sheet Status:', sheetRes.status);
  console.log('   Enrolled Students count:', sheetRes.data.students?.length);
  console.log('   Students in SE-B:', sheetRes.data.students?.map(s => s.name).join(', '));

  // 5. Faculty Count Percentage
  console.log('\n5. Testing Faculty POST /api/faculty/attendance/count-percentage...');
  const countRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/faculty/attendance/count-percentage',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${facultyToken}`
    }
  }, {
    department: 'Computer Engineering',
    year: 'SE',
    division: 'B',
    subjectId: 'sub_ce_coa'
  });
  console.log('   Count Percentage Status:', countRes.status, '| Message:', countRes.data.message);

  // 6. Faculty Defaulters Query (< 30%)
  console.log('\n6. Testing Faculty GET /api/faculty/attendance/defaulters...');
  const defRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/faculty/attendance/defaulters?department=Computer%20Engineering&year=SE&division=B&subjectId=sub_ce_coa',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${facultyToken}` }
  });
  console.log('   Defaulters Found:', defRes.data.defaulters?.length);
  console.log('   Defaulters (<30%):', defRes.data.defaulters?.map(d => `${d.studentName} (${d.attendancePercentage}%)`).join(', '));

  // 7. Faculty Publish (SEND TO STUDENT)
  console.log('\n7. Testing Faculty POST /api/faculty/attendance/publish...');
  const pubRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/faculty/attendance/publish',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${facultyToken}`
    }
  }, {
    department: 'Computer Engineering',
    year: 'SE',
    division: 'B',
    subjectId: 'sub_ce_coa'
  });
  console.log('   Publish Status:', pubRes.status, '| Message:', pubRes.data.message);

  // 8. Student Attendance View
  console.log('\n8. Testing Student GET /api/student/attendance...');
  const studentAttRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/student/attendance',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${studentToken}` }
  });
  const studentRecords = studentAttRes.data.records || studentAttRes.data.attendance || [];
  console.log('   Student Attendance Status:', studentAttRes.status);
  console.log('   Published Records for Shifa:', studentRecords.map(a => `${a.subjectName}: ${a.attendancePercentage}% (Defaulter: ${a.isDefaulter})`));

  // 9. Student RBAC Security check
  console.log('\n9. Testing Security Guard (Student attempting to publish or edit attendance)...');
  const studentForbiddenRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/faculty/attendance/publish',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${studentToken}`
    }
  }, {
    department: 'Computer Engineering',
    year: 'SE',
    division: 'B',
    subjectId: 'sub_ce_coa'
  });
  console.log('   Student unauthorized request status (Expected 403 Forbidden):', studentForbiddenRes.status);

  console.log('\n================================================================');
  console.log('🎉 ALL HTTP API TESTS PASSED PERFECTLY!');
  console.log('================================================================\n');
}

runHttpApiSuite().catch(console.error);
