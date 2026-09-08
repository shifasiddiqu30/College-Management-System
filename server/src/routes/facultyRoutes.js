import { Router } from 'express';
import {
  // Dashboard & Profile
  getFacultyDashboardStats,
  getFacultyProfile,
  
  // Timetable & Availability
  getFacultyDepartmentFolders,
  getFacultyTimetable,
  getFacultyClassroomAvailability,

  // Personal Schedule (Strictly Private)
  getPersonalSchedule,
  createPersonalSchedule,
  updatePersonalSchedule,
  deletePersonalSchedule,

  // Clubs & Events
  getFacultyClubs,
  createClub,
  updateClub,
  getClubMembers,
  getFacultyEvents,
  createEvent,
  updateEvent,
  getEventAttendees,

  // Doubt Discussion
  getDoubtPages,
  createDoubtPage,
  updateDoubtPage,
  getFacultyDoubts,
  getDoubtById,
  replyDoubt,
  verifyAnswer,

  // Announcements & FAQs
  getAnnouncements,
  createAnnouncement,
  deleteAnnouncement,
  getFaqs,
  createFaq,
  updateFaq,
  deleteFaq,

  // Academic Performance
  getAcademicPerformanceForClass,
  saveAcademicPerformanceBatch,

  // Notifications
  getFacultyNotifications,
  markNotificationRead,
  markAllNotificationsRead,

  // Campus Lost & Found
  getFacultyLostFound,
  getFacultyMyReports,
  getFacultyReturnedHistory,
  createFacultyLostFound,
  updateFacultyLostFound,
  deleteFacultyLostFound,
  markFacultyLostFoundReturned
} from '../controllers/facultyController.js';
import { verifyToken } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';
import { ROLES } from '../config/constants.js';

const router = Router();

// Apply Authentication and FACULTY Authorization strictly to all routes
router.use(verifyToken);
router.use(authorizeRoles(ROLES.FACULTY));

// 1. Dashboard & Profile
router.get('/dashboard-stats', getFacultyDashboardStats);
router.get('/profile', getFacultyProfile);

// 2. Timetable & Classroom Availability
router.get('/departments', getFacultyDepartmentFolders);
router.get('/timetable', getFacultyTimetable);
router.get('/classroom-availability', getFacultyClassroomAvailability);

// 3. Personal Schedule (Strict Private)
router.get('/personal-schedule', getPersonalSchedule);
router.post('/personal-schedule', createPersonalSchedule);
router.put('/personal-schedule/:id', updatePersonalSchedule);
router.delete('/personal-schedule/:id', deletePersonalSchedule);

// 4. Clubs & Events
router.get('/clubs', getFacultyClubs);
router.post('/clubs', createClub);
router.put('/clubs/:id', updateClub);
router.get('/clubs/:id/members', getClubMembers);

router.get('/events', getFacultyEvents);
router.post('/events', createEvent);
router.put('/events/:id', updateEvent);
router.get('/events/:id/attendees', getEventAttendees);

// 5. Smart Doubt Discussion
router.get('/doubt-pages', getDoubtPages);
router.post('/doubt-pages', createDoubtPage);
router.put('/doubt-pages/:id', updateDoubtPage);

router.get('/doubts', getFacultyDoubts);
router.get('/doubts/:id', getDoubtById);
router.post('/doubts/:id/reply', replyDoubt);
router.put('/doubts/:id/verify-answer', verifyAnswer);

// 6. Announcements & FAQs
router.get('/announcements', getAnnouncements);
router.post('/announcements', createAnnouncement);
router.delete('/announcements/:id', deleteAnnouncement);

router.get('/faqs', getFaqs);
router.post('/faqs', createFaq);
router.put('/faqs/:id', updateFaq);
router.delete('/faqs/:id', deleteFaq);

// 7. Academic Performance
router.get('/academic-performance', getAcademicPerformanceForClass);
router.post('/academic-performance/save-batch', saveAcademicPerformanceBatch);

// 8. Notifications
router.get('/notifications', getFacultyNotifications);
router.put('/notifications/:id/read', markNotificationRead);
router.put('/notifications/mark-all-read', markAllNotificationsRead);

// 9. Campus Lost & Found (Part 6)
router.get('/lost-found', getFacultyLostFound);
router.get('/lost-found/my-reports', getFacultyMyReports);
router.get('/lost-found/returned-history', getFacultyReturnedHistory);
router.post('/lost-found', createFacultyLostFound);
router.put('/lost-found/:id', updateFacultyLostFound);
router.delete('/lost-found/:id', deleteFacultyLostFound);
router.put('/lost-found/:id/return', markFacultyLostFoundReturned);

export default router;

