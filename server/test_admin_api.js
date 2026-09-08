import bcrypt from 'bcryptjs';
import { seedDatabase } from './src/config/seed.js';
import { db, queryOne } from './src/config/db.js';

async function runTests() {
  console.log('🧪 Starting Part 2 Backend Verification...');
  await seedDatabase();

  // Test admin user exists
  const admin = queryOne("SELECT * FROM users WHERE email = 'admin@college.edu'");
  if (!admin) throw new Error('Admin user not found!');
  console.log('✅ Admin user verified:', admin.email);

  // Test faculty user exists
  const faculty = queryOne("SELECT * FROM users WHERE email = 'sharma@college.edu'");
  if (!faculty) throw new Error("Sharma Ma'am faculty user not found!");
  console.log("✅ Faculty user verified:", faculty.name, faculty.email);

  // Test student user exists
  const student = queryOne("SELECT * FROM users WHERE email = 'student@college.edu'");
  if (!student) throw new Error('Shifa Siddiqui student user not found!');
  console.log('✅ Student user verified:', student.name, student.email, 'Roll:', student.roll_number);

  // Test classroom exists
  const roomFF101 = queryOne("SELECT * FROM classrooms WHERE room_number = 'FF101'");
  if (!roomFF101) throw new Error('FF101 not found!');
  console.log('✅ Classroom verified:', roomFF101.room_number, roomFF101.classroom_type);

  // Test timetable mapping exists
  const timetable = queryOne("SELECT * FROM timetables WHERE classroom_id = 'crm_ff101'");
  if (!timetable) throw new Error('Timetable slot for FF101 not found!');
  console.log('✅ Timetable slot verified for FF101:', timetable.day_of_week, timetable.start_time);

  console.log('🎉 All backend seed & DB integrity tests passed!');
}

runTests().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
