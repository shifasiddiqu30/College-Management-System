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
  markAllAdminNotificationsRead
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

// 2. Student Management CRUD
router.get('/students', getStudents);
router.post('/students', createStudent);
router.put('/students/:id', updateStudent);
router.delete('/students/:id', deleteStudent);

// 3. Faculty Management CRUD
router.get('/faculty', getFaculty);
router.post('/faculty', createFaculty);
router.put('/faculty/:id', updateFaculty);
router.delete('/faculty/:id', deleteFaculty);

// 4. Classroom Management CRUD
router.get('/classrooms', getClassrooms);
router.post('/classrooms', createClassroom);
router.put('/classrooms/:id', updateClassroom);
router.delete('/classrooms/:id', deleteClassroom);

// 5. Class & Section Management CRUD (Department -> Year -> Division)
router.get('/classes', getClasses);
router.post('/classes', createClass);
router.put('/classes/:id', updateClass);
router.delete('/classes/:id', deleteClass);

// 6. Timetable Management CRUD (Part 3)
router.get('/timetable', getTimetables);
router.post('/timetable', createTimetable);
router.put('/timetable/:id', updateTimetable);
router.delete('/timetable/:id', deleteTimetable);

// 7. Classroom Availability Foundation
router.get('/classroom-availability', getClassroomAvailability);

// 8. Admin Notifications & Campus Broadcasts
router.get('/notifications', getAdminNotifications);
router.post('/notifications/broadcast', broadcastNotification);
router.put('/notifications/:id/read', markAdminNotificationRead);
router.put('/notifications/mark-all-read', markAllAdminNotificationsRead);

export default router;

