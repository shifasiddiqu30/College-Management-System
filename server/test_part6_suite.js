import http from 'http';

const BASE_URL = 'http://localhost:5000';

function makeRequest(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const parsed = data ? JSON.parse(data) : {};
          resolve({ status: res.statusCode, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });

    req.on('error', (err) => reject(err));

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
  console.log(`✅ PASS: ${message}`);
}

async function runPart6Suite() {
  console.log('====================================================');
  console.log('🧪 COLLEGE MANAGEMENT SYSTEM - PART 6 TEST SUITE');
  console.log('   (Club & Event Management + Campus Lost & Found)');
  console.log('====================================================\n');

  try {
    // 1. Authenticate Users
    console.log('🔑 1. Authenticating Roles...');
    const adminLogin = await makeRequest('POST', '/api/auth/login', {
      email: 'admin@college.edu',
      password: 'Admin@123'
    });
    assert(adminLogin.status === 200 && adminLogin.body.user.role === 'ADMIN', 'Admin authentication succeeded');
    const adminToken = adminLogin.body.token;

    const facLogin = await makeRequest('POST', '/api/auth/login', {
      email: 'sharma@college.edu',
      password: 'Faculty@123'
    });
    assert(facLogin.status === 200 && facLogin.body.user.role === 'FACULTY', 'Faculty Sharma authenticated');
    const facToken = facLogin.body.token;

    const stuLogin = await makeRequest('POST', '/api/auth/login', {
      email: 'student@college.edu',
      password: 'Student@123'
    });
    assert(stuLogin.status === 200 && stuLogin.body.user.role === 'STUDENT', 'Student Shifa authenticated');
    const stuToken = stuLogin.body.token;

    const stuAlexLogin = await makeRequest('POST', '/api/auth/login', {
      email: 'student.alex@college.edu',
      password: 'Student@123'
    });
    assert(stuAlexLogin.status === 200 && stuAlexLogin.body.user.role === 'STUDENT', 'Student Alex authenticated');
    const stuAlexToken = stuAlexLogin.body.token;

    // 2. Test Faculty Club Management
    console.log('\n👥 2. Testing Faculty Club Management...');
    const newClubRes = await makeRequest('POST', '/api/faculty/clubs', {
      name: 'Robotics & Automation Society',
      category: 'Technical',
      description: 'Design and build autonomous robots, drones, and IoT microcontrollers.',
      maxSeats: 2,
      registrationStartDate: '2026-08-01',
      registrationEndDate: '2026-11-30',
      status: 'Registration Open'
    }, facToken);
    assert(newClubRes.status === 201 && newClubRes.body.clubId, 'Faculty created a club with 2 seats');
    const testClubId = newClubRes.body.clubId;

    // Student cannot create club (RBAC)
    const stuClubCreate = await makeRequest('POST', '/api/faculty/clubs', {
      name: 'Unauthorized Student Club',
      category: 'Technical'
    }, stuToken);
    assert(stuClubCreate.status === 403, 'Student blocked from creating clubs (HTTP 403)');

    // Faculty updates club
    const updateClubRes = await makeRequest('PUT', `/api/faculty/clubs/${testClubId}`, {
      description: 'Updated: Design and build autonomous robots, drones, and edge AI.'
    }, facToken);
    assert(updateClubRes.status === 200, 'Faculty updated club description');

    // 3. Test Student Club Registration & Seat Limit Enforcement
    console.log('\n🎫 3. Testing Student Club Registration & Seat Limits...');
    const shifaJoinRes = await makeRequest('POST', `/api/student/clubs/${testClubId}/register`, {}, stuToken);
    assert(shifaJoinRes.status === 200 && shifaJoinRes.body.availableSeats === 1, 'Student Shifa joined club (1 seat remaining)');

    // Duplicate registration blocked
    const shifaDupJoin = await makeRequest('POST', `/api/student/clubs/${testClubId}/register`, {}, stuToken);
    assert(shifaDupJoin.status === 400, 'Duplicate club registration strictly rejected');

    // Alex joins last seat
    const alexJoinRes = await makeRequest('POST', `/api/student/clubs/${testClubId}/register`, {}, stuAlexToken);
    assert(alexJoinRes.status === 200 && alexJoinRes.body.availableSeats === 0, 'Student Alex joined club (0 seats remaining)');

    // Attempting to join full club
    const thirdJoinRes = await makeRequest('POST', `/api/student/clubs/${testClubId}/register`, {}, stuToken);
    assert(thirdJoinRes.status === 400, 'Further registration rejected when seats are full');

    // 4. Test View Joined Members (Faculty Authorized vs Student Blocked)
    console.log('\n📋 4. Testing Club Member List Authorization...');
    const membersRes = await makeRequest('GET', `/api/faculty/clubs/${testClubId}/members`, null, facToken);
    assert(membersRes.status === 200 && membersRes.body.members.length === 2, 'Authorized Faculty viewed joined students (2 members)');
    assert(membersRes.body.members[0].studentEmail && membersRes.body.members[0].department, 'Member details contain email and department');

    const stuViewMembers = await makeRequest('GET', `/api/faculty/clubs/${testClubId}/members`, null, stuToken);
    assert(stuViewMembers.status === 403, 'Student blocked from accessing club member roster (HTTP 403)');

    // 5. Test Event Management & Student Registration (No Seat Limit)
    console.log('\n🎪 5. Testing Event Management & Registration...');
    const newEventRes = await makeRequest('POST', '/api/faculty/events', {
      clubId: testClubId,
      title: 'Autonomous Robotics Workshop 2026',
      description: 'Hands-on ROS2 and Arduino robotics simulation session.',
      eventDate: '2026-10-20',
      eventTime: '02:00 PM',
      venue: 'Engineering Block A - Lab 201',
      registrationStartDate: '2026-08-01',
      registrationLastDate: '2026-10-18',
      status: 'Upcoming'
    }, facToken);
    assert(newEventRes.status === 201 && newEventRes.body.eventId, 'Faculty created a campus event');
    const testEventId = newEventRes.body.eventId;

    // Student 1 registers for event
    const shifaEventReg = await makeRequest('POST', `/api/student/events/${testEventId}/register`, {}, stuToken);
    assert(shifaEventReg.status === 200, 'Student Shifa registered for event');

    // Duplicate event registration rejected
    const shifaDupEvent = await makeRequest('POST', `/api/student/events/${testEventId}/register`, {}, stuToken);
    assert(shifaDupEvent.status === 400, 'Duplicate event registration strictly rejected');

    // Student 2 registers for event (events have no seat limit)
    const alexEventReg = await makeRequest('POST', `/api/student/events/${testEventId}/register`, {}, stuAlexToken);
    assert(alexEventReg.status === 200, 'Student Alex registered for event (no seat limits)');

    // Faculty views event attendees
    const attendeesRes = await makeRequest('GET', `/api/faculty/events/${testEventId}/attendees`, null, facToken);
    assert(attendeesRes.status === 200 && attendeesRes.body.attendees.length === 2, 'Faculty viewed registered event attendees (2 attendees)');

    // 6. Test My Registrations Scoping
    console.log('\n📜 6. Testing My Registrations (Clubs & Events)...');
    const myRegsShifa = await makeRequest('GET', '/api/student/registrations', null, stuToken);
    assert(myRegsShifa.status === 200, 'Shifa fetched her personal registrations');
    assert(myRegsShifa.body.myClubs.some(c => c.clubId === testClubId), 'Shifa sees Robotics Club in My Clubs');
    assert(myRegsShifa.body.myEvents.some(e => e.eventId === testEventId), 'Shifa sees Robotics Workshop in My Events');

    // 7. Test Campus Lost & Found Hub
    console.log('\n🔍 7. Testing Campus Lost & Found Hub...');
    // Shifa reports a lost item
    const reportLostRes = await makeRequest('POST', '/api/student/lost-found', {
      type: 'LOST',
      itemName: 'Scientific Calculator Casio fx-82MS',
      category: 'Electronics',
      description: 'Left on desk in Room 302 after Maths tutorial.',
      location: 'Room 302',
      date: '2026-09-04',
      photoUrl: null
    }, stuToken);
    assert(reportLostRes.status === 201 && reportLostRes.body.itemId, 'Student reported a LOST item');
    const lostItemId = reportLostRes.body.itemId;

    // Faculty reports a found item
    const reportFoundRes = await makeRequest('POST', '/api/faculty/lost-found', {
      type: 'FOUND',
      itemName: 'Titan Blue Dial Wristwatch',
      category: 'Accessories',
      description: 'Found on bench near Faculty Lounge.',
      location: 'Faculty Lounge Corridor',
      date: '2026-09-04',
      photoUrl: null
    }, facToken);
    assert(reportFoundRes.status === 201 && reportFoundRes.body.itemId, 'Faculty reported a FOUND item');
    const foundItemId = reportFoundRes.body.itemId;

    // Browse active items
    const browseRes = await makeRequest('GET', '/api/student/lost-found', null, stuToken);
    assert(browseRes.status === 200 && browseRes.body.items.length >= 2, 'Active Lost & Found items retrieved');

    // Search and filter tests
    const searchRes = await makeRequest('GET', '/api/student/lost-found?search=Calculator', null, stuToken);
    assert(searchRes.status === 200 && searchRes.body.items.some(i => i.itemName.includes('Calculator')), 'Search query filter works');

    const typeFilterRes = await makeRequest('GET', '/api/student/lost-found?type=FOUND', null, stuToken);
    assert(typeFilterRes.status === 200 && typeFilterRes.body.items.every(i => i.type === 'FOUND'), 'Type filter (FOUND) works');

    const catFilterRes = await makeRequest('GET', '/api/student/lost-found?category=Electronics', null, stuToken);
    assert(catFilterRes.status === 200 && catFilterRes.body.items.every(i => i.category === 'Electronics'), 'Category filter (Electronics) works');

    // My Reports
    const myReportsRes = await makeRequest('GET', '/api/student/lost-found/my-reports', null, stuToken);
    assert(myReportsRes.status === 200 && myReportsRes.body.reports.some(r => r.id === lostItemId), 'Student sees own reported item under My Reports');

    // Safe Edit Own Report
    const editReportRes = await makeRequest('PUT', `/api/student/lost-found/${lostItemId}`, {
      description: 'Updated: Left on back-row desk in Room 302 with blue sticker on back.'
    }, stuToken);
    assert(editReportRes.status === 200, 'Student successfully updated own report');

    // Unauthorized edit blocked (Alex cannot edit Shifa's report)
    const unauthEditRes = await makeRequest('PUT', `/api/student/lost-found/${lostItemId}`, {
      description: 'Malicious modification'
    }, stuAlexToken);
    assert(unauthEditRes.status === 403, 'Unauthorized user blocked from editing another user report (HTTP 403)');

    // Unauthorized delete blocked
    const unauthDelRes = await makeRequest('DELETE', `/api/student/lost-found/${lostItemId}`, null, stuAlexToken);
    assert(unauthDelRes.status === 403, 'Unauthorized user blocked from deleting another user report (HTTP 403)');

    // 8. Test Mark As Returned & Returned History
    console.log('\n🎁 8. Testing Mark as Returned & Returned History...');
    const markReturnRes = await makeRequest('PUT', `/api/student/lost-found/${lostItemId}/return`, {}, stuToken);
    assert(markReturnRes.status === 200, 'Item successfully marked as RETURNED');

    // Verify it disappeared from active browse
    const browseAfterReturn = await makeRequest('GET', '/api/student/lost-found', null, stuToken);
    assert(!browseAfterReturn.body.items.some(i => i.id === lostItemId), 'Returned item disappeared from active browse listings');

    // Verify it appears in Returned History
    const returnedHistoryRes = await makeRequest('GET', '/api/student/lost-found/returned-history', null, stuToken);
    assert(returnedHistoryRes.status === 200 && returnedHistoryRes.body.items.some(i => i.id === lostItemId), 'Returned item appears in Returned History');

    console.log('\n====================================================');
    console.log('🎉 ALL PART 6 TESTS PASSED SUCCESSFULLY! (100%)');
    console.log('====================================================\n');
  } catch (err) {
    console.error('\n❌ Part 6 Test Suite Failed:', err);
    process.exit(1);
  }
}

runPart6Suite();
