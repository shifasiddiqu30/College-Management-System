import { Router } from 'express';
import {
  getAdminDashboardStats,
  getStudents,
  createStudent,
  updateStudent,
  deleteStudent,
  getFaculty,
  createFaculty,
  updateFaculty,
  deleteFaculty,
  getClassrooms,
  createClassroom,
  updateClassroom,
  deleteClassroom,
  getClasses,
  createClass,
  updateClass,
  deleteClass,
  getTimetables,
  createTimetable,
  updateTimetable,
  deleteTimetable,
  getClassroomAvailability,
  getAdminOptions,
  getAdminNotifications,
  broadcastNotification,
  markAdminNotificationRead,
  markAllAdminNotificationsRead,
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  toggleDepartmentStatus,
  getFacultyTimetableAdmin,
  getFacultyAvailability,
  
  // Attendance Module
  getAdminAttendanceSheet,
  saveAdminDailyAttendance,
  countAdminAttendancePercentage,
  publishAdminAttendance,
  getAdminDefaultersList,
  getAdminAttendanceStats
} from '../controllers/adminController.js';
import { verifyToken } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';
import { ROLES } from '../config/constants.js';

const router = Router();

// Apply Authentication and Strict ADMIN Authorization to all routes
router.use(verifyToken);
router.use(authorizeRoles(ROLES.ADMIN));

// 1. Dashboard Overview Stats & Dropdown Options
router.get('/dashboard-stats', getAdminDashboardStats);
router.get('/options', getAdminOptions);

// 2. Department Management CRUD
router.get('/departments', getDepartments);
router.post('/departments', createDepartment);
router.put('/departments/:id', updateDepartment);
router.delete('/departments/:id', deleteDepartment);
router.patch('/departments/:id/status', toggleDepartmentStatus);

// 3. Student Management CRUD
router.get('/students', getStudents);
router.post('/students', createStudent);
router.put('/students/:id', updateStudent);
router.delete('/students/:id', deleteStudent);

// 4. Faculty Management CRUD
router.get('/faculty', getFaculty);
router.post('/faculty', createFaculty);
router.put('/faculty/:id', updateFaculty);
router.delete('/faculty/:id', deleteFaculty);

// 5. Classroom Management CRUD
router.get('/classrooms', getClassrooms);
router.post('/classrooms', createClassroom);
router.put('/classrooms/:id', updateClassroom);
router.delete('/classrooms/:id', deleteClassroom);

// 6. Class & Section Management CRUD (Department -> Year -> Division)
router.get('/classes', getClasses);
router.post('/classes', createClass);
router.put('/classes/:id', updateClass);
router.delete('/classes/:id', deleteClass);

// 7. Timetable Management CRUD (Part 3)
router.get('/timetable', getTimetables);
router.post('/timetable', createTimetable);
router.put('/timetable/:id', updateTimetable);
router.delete('/timetable/:id', deleteTimetable);

// 8. Classroom Availability & Faculty Availability Foundations
router.get('/classroom-availability', getClassroomAvailability);
router.get('/faculty-availability', getFacultyAvailability);
router.get('/faculty-timetable', getFacultyTimetableAdmin);

// 9. Admin Notifications & Campus Broadcasts
router.get('/notifications', getAdminNotifications);
router.post('/notifications/broadcast', broadcastNotification);
router.put('/notifications/:id/read', markAdminNotificationRead);
router.put('/notifications/mark-all-read', markAllAdminNotificationsRead);

// 10. Smart Attendance Module
router.get('/attendance/stats', getAdminAttendanceStats);
router.get('/attendance/sheet', getAdminAttendanceSheet);
router.post('/attendance/save-daily', saveAdminDailyAttendance);
router.post('/attendance/count-percentage', countAdminAttendancePercentage);
router.post('/attendance/publish', publishAdminAttendance);
router.get('/attendance/defaulters', getAdminDefaultersList);

export default router;


