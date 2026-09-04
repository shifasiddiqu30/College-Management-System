import { Router } from 'express';
import {
  getStudentDashboardStats,
  getStudentProfile,
  getStudentTimetable,
  getStudentAcademicPerformance,
  getStudentDoubtPages,
  getStudentDoubts,
  getStudentDoubtById,
  createStudentDoubt,
  replyStudentDoubt,
  requestFacultyHelp,
  getStudentAnnouncements,
  getStudentFaqs,
  getStudentClubsEvents,
  registerClub,
  registerEvent,
  getStudentRegistrations,
  getLostFoundItems,
  getLostFoundItemById,
  createLostFoundReport,
  getMyLostFoundReports,
  updateLostFoundReport,
  deleteLostFoundReport,
  markLostFoundReturned,
  getReturnedHistory,
  getStudentNotifications,
  markStudentNotificationRead,
  markAllStudentNotificationsRead
} from '../controllers/studentController.js';
import { verifyToken } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';
import { ROLES } from '../config/constants.js';

const router = Router();

// Apply Authentication and STUDENT Authorization strictly to all routes
router.use(verifyToken);
router.use(authorizeRoles(ROLES.STUDENT));

// 1. Dashboard & Profile
router.get('/dashboard-stats', getStudentDashboardStats);
router.get('/profile', getStudentProfile);

// 2. Timetable (Strictly scoped to student's class on backend)
router.get('/timetable', getStudentTimetable);

// 3. Academic Performance (Strict 1:1 privacy)
router.get('/academic-performance', getStudentAcademicPerformance);

// 4. Smart Doubt Discussion, Announcements & FAQs
router.get('/doubt-pages', getStudentDoubtPages);
router.get('/doubts', getStudentDoubts);
router.get('/doubts/:id', getStudentDoubtById);
router.post('/doubts', createStudentDoubt);
router.post('/doubts/:id/reply', replyStudentDoubt);
router.post('/doubts/:id/request-help', requestFacultyHelp);
router.put('/doubts/:id/request-help', requestFacultyHelp);
router.post('/doubts/:id/request-faculty-help', requestFacultyHelp);
router.put('/doubts/:id/request-faculty-help', requestFacultyHelp);
router.get('/announcements', getStudentAnnouncements);
router.get('/faqs', getStudentFaqs);

// 5. Clubs & Events (Part 6)
router.get('/clubs-events', getStudentClubsEvents);
router.post('/clubs/:id/register', registerClub);
router.post('/events/:id/register', registerEvent);
router.get('/registrations', getStudentRegistrations);

// 6. Campus Lost & Found (Part 6)
router.get('/lost-found', getLostFoundItems);
router.get('/lost-found/my-reports', getMyLostFoundReports);
router.get('/lost-found/returned-history', getReturnedHistory);
router.get('/lost-found/:id', getLostFoundItemById);
router.post('/lost-found', createLostFoundReport);
router.put('/lost-found/:id', updateLostFoundReport);
router.delete('/lost-found/:id', deleteLostFoundReport);
router.put('/lost-found/:id/return', markLostFoundReturned);

// 7. Notifications
router.get('/notifications', getStudentNotifications);
router.put('/notifications/:id/read', markStudentNotificationRead);
router.put('/notifications/mark-all-read', markAllStudentNotificationsRead);

export default router;


