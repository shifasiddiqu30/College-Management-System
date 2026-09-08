import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Calendar,
  Sparkles,
  Users,
  MessageSquare,
  Award,
  DoorOpen,
  CheckSquare,
  Bell,
  User,
  Clock,
  Building2,
  BookOpen,
  Layers,
  RefreshCw,
  Search,
  CheckCircle,
  XCircle,
  AlertCircle,
  Plus,
  Trash2,
  Edit3,
  ExternalLink,
  Shield,
  Filter,
  Check,
  X,
  MessageCircle,
  Send,
  HelpCircle,
  Pin,
  Lock,
  GraduationCap,
  ChevronRight,
  Flame,
  Hourglass,
  Tag,
  Package,
  History,
  Mail,
  MapPin
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import FacultySidebar from '../../components/faculty/FacultySidebar';
import FacultyHeader from '../../components/faculty/FacultyHeader';
import DepartmentFolderTabs from '../../components/common/DepartmentFolderTabs';

const LF_CATEGORIES = ['All Categories', 'Electronics', 'ID Cards & Documents', 'Books & Stationery', 'Accessories & Bags', 'Keys & Wallets', 'Clothing', 'Other'];

export default function FacultyDashboard() {
  const { user, logout, authFetch, showToast } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const pathSegment = location.pathname.replace('/faculty/', '').replace('/faculty', '') || 'dashboard';
  const [activeTab, setActiveTabState] = useState(pathSegment || 'dashboard');
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const setActiveTab = (tab) => {
    setActiveTabState(tab);
    navigate(`/faculty/${tab}`);
  };

  useEffect(() => {
    const currentSegment = location.pathname.replace('/faculty/', '').replace('/faculty', '') || 'dashboard';
    if (currentSegment && currentSegment !== activeTab) {
      setActiveTabState(currentSegment);
    }
  }, [location.pathname]);

  // Core Data States
  const [statsData, setStatsData] = useState(null);
  const [timetableData, setTimetableData] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadNotifsCount, setUnreadNotifsCount] = useState(0);

  // Tab-Specific States
  // Timetable Tab
  const [selectedDay, setSelectedDay] = useState(new Date().toLocaleDateString('en-US', { weekday: 'long' }) === 'Sunday' ? 'Monday' : new Date().toLocaleDateString('en-US', { weekday: 'long' }));
  const [facultyTtDept, setFacultyTtDept] = useState('ALL');
  const [ttLoading, setTtLoading] = useState(false);

  const fetchFacultyTimetable = useCallback(async (dept = facultyTtDept) => {
    setTtLoading(true);
    try {
      const url = dept && dept !== 'ALL'
        ? `/api/faculty/timetable?department=${encodeURIComponent(dept)}`
        : '/api/faculty/timetable';
      const res = await authFetch(url);
      const data = await res.json();
      if (res.ok && data.success) {
        setTimetableData(data);
      }
    } catch (err) {
      console.error('Error fetching faculty timetable:', err);
    } finally {
      setTtLoading(false);
    }
  }, [authFetch, facultyTtDept]);

  // Personal Schedule Tab
  const [personalTasks, setPersonalTasks] = useState([]);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskForm, setTaskForm] = useState({ title: '', taskDate: new Date().toISOString().split('T')[0], taskTime: '10:00', note: '', category: 'Task', priority: 'Medium' });

  // Clubs & Events Tab
  const [clubsTab, setClubsTab] = useState('clubs'); // 'clubs', 'events'
  const [clubsList, setClubsList] = useState([]);
  const [eventsList, setEventsList] = useState([]);
  const [isClubModalOpen, setIsClubModalOpen] = useState(false);
  const [clubForm, setClubForm] = useState({ name: '', category: 'Technical', description: '', maxSeats: 30, registrationStartDate: '', registrationEndDate: '', bannerUrl: '' });
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [eventForm, setEventForm] = useState({ title: '', clubId: '', description: '', eventDate: '', eventTime: '10:00 AM', venue: '', registrationStartDate: '', registrationLastDate: '', bannerUrl: '' });
  const [membersModalData, setMembersModalData] = useState(null); // { title, type: 'club'|'event', list: [] }

  // Doubts Discussion Tab
  const [doubtSubTab, setDoubtSubTab] = useState('doubts'); // 'doubts', 'announcements', 'faqs'
  const [doubtFilter, setDoubtFilter] = useState('all'); // 'all', 'new', 'pending_help', 'answered', 'verified'
  const [doubtPages, setDoubtPages] = useState([]);
  const [selectedPageId, setSelectedPageId] = useState('ALL');
  const [doubtsList, setDoubtsList] = useState([]);
  const [activeDoubtThread, setActiveDoubtThread] = useState(null); // Full doubt details with replies
  const [replyText, setReplyText] = useState('');
  const [replyImageUrl, setReplyImageUrl] = useState('');
  const [markReplyVerified, setMarkReplyVerified] = useState(false);
  const [isNewPageModalOpen, setIsNewPageModalOpen] = useState(false);
  const [pageForm, setPageForm] = useState({ department: user?.department || 'Computer Engineering', year: 'SE', division: 'B', subjectId: 'sub_java', title: '', description: '', semester: 4, authorizedEmails: '' });
  const [announcementsList, setAnnouncementsList] = useState([]);
  const [isAnnouncementModalOpen, setIsAnnouncementModalOpen] = useState(false);
  const [announcementForm, setAnnouncementForm] = useState({ department: user?.department || 'Computer Engineering', year: 'SE', division: 'B', subjectId: 'sub_java', title: '', message: '', priority: 'Normal' });
  const [faqsList, setFaqsList] = useState([]);
  const [isFaqModalOpen, setIsFaqModalOpen] = useState(false);
  const [faqForm, setFaqForm] = useState({ subjectId: 'sub_java', question: '', answer: '', isPinned: true });

  // Academic Performance Tab
  const [perfDept, setPerfDept] = useState(user?.department || 'Computer Engineering');
  const [perfYear, setPerfYear] = useState('SE');
  const [perfDiv, setPerfDiv] = useState('B');
  const [perfSubjectId, setPerfSubjectId] = useState('sub_java');
  const [perfStudents, setPerfStudents] = useState([]);
  const [perfLoading, setPerfLoading] = useState(false);

  // Classroom Availability Tab
  const [availDate, setAvailDate] = useState(new Date().toISOString().split('T')[0]);
  const [availStartTime, setAvailStartTime] = useState('10:00');
  const [availEndTime, setAvailEndTime] = useState('11:00');
  const [roomSearch, setRoomSearch] = useState('');
  const [availResults, setAvailResults] = useState(null);
  const [availLoading, setAvailLoading] = useState(false);

  // Lost & Found Tab
  const [lostFoundSubTab, setLostFoundSubTab] = useState('browse'); // 'browse', 'report-lost', 'report-found', 'my-reports', 'returned-history'
  const [lostFoundItems, setLostFoundItems] = useState([]);
  const [myReports, setMyReports] = useState([]);
  const [returnedHistory, setReturnedHistory] = useState([]);
  const [lfCategory, setLfCategory] = useState('All Categories');
  const [lfType, setLfType] = useState('ALL'); // 'ALL', 'LOST', 'FOUND'
  const [lfSearch, setLfSearch] = useState('');
  const [contactModalItem, setContactModalItem] = useState(null);
  const [editModalItem, setEditModalItem] = useState(null);
  const [deleteModalItem, setDeleteModalItem] = useState(null);
  const [reportForm, setReportForm] = useState({
    type: 'LOST',
    itemName: '',
    category: 'Electronics',
    description: '',
    location: '',
    date: new Date().toISOString().split('T')[0],
    photoUrl: ''
  });
  const [editForm, setEditForm] = useState({
    itemName: '',
    category: 'Electronics',
    description: '',
    location: '',
    date: '',
    photoUrl: ''
  });

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  // ==========================================================================
  // Data Fetching Handlers
  // ==========================================================================

  // 1. Initial Dashboard Stats & Timetable
  const fetchCoreData = useCallback(async () => {
    try {
      const [statsRes, ttRes, notifRes] = await Promise.all([
        authFetch('/api/faculty/dashboard-stats'),
        authFetch('/api/faculty/timetable'),
        authFetch('/api/faculty/notifications')
      ]);

      const statsJson = await statsRes.json();
      const ttJson = await ttRes.json();
      const notifJson = await notifRes.json();

      if (statsRes.ok && statsJson.success) setStatsData(statsJson);
      if (ttRes.ok && ttJson.success) setTimetableData(ttJson);
      if (notifRes.ok && notifJson.success) {
        setNotifications(notifJson.notifications || []);
        setUnreadNotifsCount(notifJson.unreadCount || 0);
      }
    } catch (err) {
      showToast('Error loading faculty stats: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [authFetch, showToast]);

  useEffect(() => {
    fetchCoreData();
  }, [fetchCoreData]);

  // 2. Personal Schedule
  const fetchPersonalSchedule = useCallback(async () => {
    try {
      const res = await authFetch('/api/faculty/personal-schedule');
      const data = await res.json();
      if (res.ok && data.success) setPersonalTasks(data.items || []);
    } catch (err) {
      showToast('Error loading personal schedule: ' + err.message, 'error');
    }
  }, [authFetch, showToast]);

  // 3. Clubs & Events
  const fetchClubsAndEvents = useCallback(async () => {
    try {
      const [cRes, eRes] = await Promise.all([
        authFetch('/api/faculty/clubs'),
        authFetch('/api/faculty/events')
      ]);
      const cData = await cRes.json();
      const eData = await eRes.json();
      if (cRes.ok && cData.success) setClubsList(cData.clubs || []);
      if (eRes.ok && eData.success) setEventsList(eData.events || []);
    } catch (err) {
      showToast('Error loading clubs & events: ' + err.message, 'error');
    }
  }, [authFetch, showToast]);

  // 4. Doubts, Announcements & FAQs
  const fetchDoubtData = useCallback(async () => {
    try {
      const queryParams = new URLSearchParams();
      if (doubtFilter !== 'all') queryParams.append('filter', doubtFilter);
      if (selectedPageId !== 'ALL') queryParams.append('pageId', selectedPageId);

      const [pagesRes, doubtsRes, ancRes, faqsRes] = await Promise.all([
        authFetch('/api/faculty/doubt-pages'),
        authFetch(`/api/faculty/doubts?${queryParams.toString()}`),
        authFetch('/api/faculty/announcements'),
        authFetch('/api/faculty/faqs')
      ]);

      const pagesData = await pagesRes.json();
      const doubtsData = await doubtsRes.json();
      const ancData = await ancRes.json();
      const faqsData = await faqsRes.json();

      if (pagesRes.ok && pagesData.success) setDoubtPages(pagesData.pages || []);
      if (doubtsRes.ok && doubtsData.success) setDoubtsList(doubtsData.doubts || []);
      if (ancRes.ok && ancData.success) setAnnouncementsList(ancData.announcements || []);
      if (faqsRes.ok && faqsData.success) setFaqsList(faqsData.faqs || []);
    } catch (err) {
      showToast('Error loading doubt discussions: ' + err.message, 'error');
    }
  }, [authFetch, doubtFilter, selectedPageId, showToast]);

  // 5. Academic Performance Roster
  const fetchAcademicPerformance = useCallback(async () => {
    setPerfLoading(true);
    try {
      const queryParams = new URLSearchParams({
        department: perfDept,
        year: perfYear,
        division: perfDiv,
        subjectId: perfSubjectId
      });
      const res = await authFetch(`/api/faculty/academic-performance?${queryParams.toString()}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setPerfStudents(data.students || []);
      } else {
        setPerfStudents([]);
      }
    } catch (err) {
      showToast('Error loading student roster: ' + err.message, 'error');
    } finally {
      setPerfLoading(false);
    }
  }, [authFetch, perfDept, perfYear, perfDiv, perfSubjectId, showToast]);

  // 6. Classroom Availability
  const checkClassroomAvailability = useCallback(async () => {
    setAvailLoading(true);
    try {
      const queryParams = new URLSearchParams({
        date: availDate,
        startTime: availStartTime,
        endTime: availEndTime
      });
      if (roomSearch.trim()) queryParams.append('search', roomSearch.trim());

      const res = await authFetch(`/api/faculty/classroom-availability?${queryParams.toString()}`);
      const data = await res.json();
      if (res.ok && data.success) setAvailResults(data);
    } catch (err) {
      showToast('Error checking room availability: ' + err.message, 'error');
    } finally {
      setAvailLoading(false);
    }
  }, [authFetch, availDate, availStartTime, availEndTime, roomSearch, showToast]);

  // 7. Lost & Found Data Fetchers
  const fetchLostFoundItems = useCallback(async () => {
    try {
      let url = '/api/faculty/lost-found?';
      const params = [];
      if (lfSearch) params.push(`search=${encodeURIComponent(lfSearch)}`);
      if (lfCategory && lfCategory !== 'All Categories') params.push(`category=${encodeURIComponent(lfCategory)}`);
      if (lfType && lfType !== 'ALL') params.push(`type=${encodeURIComponent(lfType)}`);
      url += params.join('&');

      const res = await authFetch(url);
      const data = await res.json();
      if (res.ok && data.success) {
        setLostFoundItems(data.items || []);
      }
    } catch (err) {
      showToast('Error loading lost & found items: ' + err.message, 'error');
    }
  }, [authFetch, lfSearch, lfCategory, lfType, showToast]);

  const fetchMyReports = useCallback(async () => {
    try {
      const res = await authFetch('/api/faculty/lost-found/my-reports');
      const data = await res.json();
      if (res.ok && data.success) {
        setMyReports(data.reports || []);
      }
    } catch (err) {
      showToast('Error loading your reports: ' + err.message, 'error');
    }
  }, [authFetch, showToast]);

  const fetchReturnedHistory = useCallback(async () => {
    try {
      const res = await authFetch('/api/faculty/lost-found/returned-history');
      const data = await res.json();
      if (res.ok && data.success) {
        setReturnedHistory(data.items || []);
      }
    } catch (err) {
      showToast('Error loading returned history: ' + err.message, 'error');
    }
  }, [authFetch, showToast]);

  // Tab Activation Effects
  useEffect(() => {
    if (activeTab === 'personal-schedule') fetchPersonalSchedule();
    if (activeTab === 'clubs-events') fetchClubsAndEvents();
    if (activeTab === 'doubts') fetchDoubtData();
    if (activeTab === 'academic-performance') fetchAcademicPerformance();
    if (activeTab === 'classroom-availability') checkClassroomAvailability();
    if (activeTab === 'lost-found') {
      fetchLostFoundItems();
      fetchMyReports();
      fetchReturnedHistory();
    }
  }, [activeTab, fetchPersonalSchedule, fetchClubsAndEvents, fetchDoubtData, fetchAcademicPerformance, checkClassroomAvailability, fetchLostFoundItems, fetchMyReports, fetchReturnedHistory]);

  // ==========================================================================
  // Action Handlers
  // ==========================================================================

  // Task Actions
  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      const res = await authFetch('/api/faculty/personal-schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskForm)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast('Private reminder added successfully', 'success');
        setIsTaskModalOpen(false);
        setTaskForm({ title: '', taskDate: new Date().toISOString().split('T')[0], taskTime: '10:00', note: '', category: 'Task', priority: 'Medium' });
        fetchPersonalSchedule();
      } else {
        showToast(data.message || 'Failed to add task', 'error');
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleToggleTaskComplete = async (taskId, currentStatus) => {
    try {
      const res = await authFetch(`/api/faculty/personal-schedule/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isCompleted: !currentStatus })
      });
      if (res.ok) {
        setPersonalTasks(prev => prev.map(t => t.id === taskId ? { ...t, isCompleted: !currentStatus ? 1 : 0 } : t));
        showToast(currentStatus ? 'Marked as pending' : 'Task completed!', 'success');
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      const res = await authFetch(`/api/faculty/personal-schedule/${taskId}`, { method: 'DELETE' });
      if (res.ok) {
        setPersonalTasks(prev => prev.filter(t => t.id !== taskId));
        showToast('Task removed', 'info');
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Club Actions
  const handleCreateClub = async (e) => {
    e.preventDefault();
    try {
      const res = await authFetch('/api/faculty/clubs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(clubForm)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast('Club registered successfully', 'success');
        setIsClubModalOpen(false);
        fetchClubsAndEvents();
      } else {
        showToast(data.message || 'Error creating club', 'error');
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleViewClubMembers = async (clubId, clubName) => {
    try {
      const res = await authFetch(`/api/faculty/clubs/${clubId}/members`);
      const data = await res.json();
      if (res.ok && data.success) {
        setMembersModalData({ title: `${clubName} — Enrolled Members`, type: 'club', list: data.members || [] });
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Event Actions
  const handleCreateEvent = async (e) => {
    e.preventDefault();
    try {
      const res = await authFetch('/api/faculty/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventForm)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast('Campus Event scheduled successfully', 'success');
        setIsEventModalOpen(false);
        fetchClubsAndEvents();
      } else {
        showToast(data.message || 'Error creating event', 'error');
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleViewEventAttendees = async (eventId, eventTitle) => {
    try {
      const res = await authFetch(`/api/faculty/events/${eventId}/attendees`);
      const data = await res.json();
      if (res.ok && data.success) {
        setMembersModalData({ title: `${eventTitle} — Registered Attendees`, type: 'event', list: data.attendees || [] });
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Doubt Actions
  const handleOpenDoubtThread = async (doubtId) => {
    try {
      const res = await authFetch(`/api/faculty/doubts/${doubtId}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setActiveDoubtThread(data);
        setReplyText('');
        setReplyImageUrl('');
        setMarkReplyVerified(false);
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim() || !activeDoubtThread) return;
    try {
      const res = await authFetch(`/api/faculty/doubts/${activeDoubtThread.doubt.id}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          replyText: replyText.trim(),
          imageUrl: replyImageUrl.trim() || null,
          markVerified: markReplyVerified
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(markReplyVerified ? 'Answer posted and marked as VERIFIED' : 'Reply posted', 'success');
        handleOpenDoubtThread(activeDoubtThread.doubt.id);
        fetchDoubtData();
      } else {
        showToast(data.message || 'Error sending reply', 'error');
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleVerifyReply = async (doubtId, replyId) => {
    try {
      const res = await authFetch(`/api/faculty/doubts/${doubtId}/verify-answer`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ replyId })
      });
      if (res.ok) {
        showToast('Answer marked as VERIFIED ANSWER', 'success');
        handleOpenDoubtThread(doubtId);
        fetchDoubtData();
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Create Doubt Page
  const handleCreateDoubtPage = async (e) => {
    e.preventDefault();
    try {
      const emailArray = pageForm.authorizedEmails.split(',').map(e => e.trim()).filter(Boolean);
      const res = await authFetch('/api/faculty/doubt-pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...pageForm, authorizedEmails: emailArray })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast('Class + Subject Discussion Forum created', 'success');
        setIsNewPageModalOpen(false);
        fetchDoubtData();
      } else {
        showToast(data.message || 'Error creating forum', 'error');
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Create Announcement
  const handleCreateAnnouncement = async (e) => {
    e.preventDefault();
    try {
      const res = await authFetch('/api/faculty/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(announcementForm)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast('Announcement published for class', 'success');
        setIsAnnouncementModalOpen(false);
        fetchDoubtData();
      } else {
        showToast(data.message || 'Error publishing announcement', 'error');
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Create FAQ
  const handleCreateFaq = async (e) => {
    e.preventDefault();
    try {
      const res = await authFetch('/api/faculty/faqs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(faqForm)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast('FAQ pinned successfully', 'success');
        setIsFaqModalOpen(false);
        fetchDoubtData();
      } else {
        showToast(data.message || 'Error pinning FAQ', 'error');
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleDeleteAnnouncement = async (ancId) => {
    try {
      const res = await authFetch(`/api/faculty/announcements/${ancId}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Announcement deleted', 'info');
        setAnnouncementsList(prev => prev.filter(a => a.id !== ancId));
      } else {
        const data = await res.json();
        showToast(data.message || 'Error deleting announcement', 'error');
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleDeleteFaq = async (faqId) => {
    try {
      const res = await authFetch(`/api/faculty/faqs/${faqId}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('FAQ deleted', 'info');
        setFaqsList(prev => prev.filter(f => f.id !== faqId));
      } else {
        const data = await res.json();
        showToast(data.message || 'Error deleting FAQ', 'error');
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Academic Performance Batch Save
  const handlePerfStudentChange = (index, field, value) => {
    setPerfStudents(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleSaveAndPublishGrades = async () => {
    try {
      const res = await authFetch('/api/faculty/academic-performance/save-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          department: perfDept,
          year: perfYear,
          division: perfDiv,
          subjectId: perfSubjectId,
          records: perfStudents
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(`Grades saved and published for ${perfStudents.length} students!`, 'success');
        fetchAcademicPerformance();
      } else {
        showToast(data.message || 'Error saving grades', 'error');
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Notifications
  const handleMarkAllNotifsRead = async () => {
    try {
      const res = await authFetch('/api/faculty/notifications/mark-all-read', { method: 'PUT' });
      if (res.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: 1 })));
        setUnreadNotifsCount(0);
        showToast('All notifications marked as read', 'success');
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Lost & Found Actions
  const handleCreateLostFound = async (e) => {
    e.preventDefault();
    try {
      const res = await authFetch('/api/faculty/lost-found', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reportForm)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(data.message || 'Report submitted successfully!', 'success');
        setReportForm({
          type: reportForm.type,
          itemName: '',
          category: 'Electronics',
          description: '',
          location: '',
          date: new Date().toISOString().split('T')[0],
          photoUrl: ''
        });
        setLostFoundSubTab('browse');
        fetchLostFoundItems();
      } else {
        showToast(data.message || 'Failed to submit report', 'error');
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleUpdateReport = async (e) => {
    e.preventDefault();
    if (!editModalItem) return;
    try {
      const res = await authFetch(`/api/faculty/lost-found/${editModalItem.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast('Report updated successfully!', 'success');
        setEditModalItem(null);
        fetchMyReports();
        fetchLostFoundItems();
      } else {
        showToast(data.message || 'Failed to update report', 'error');
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleDeleteReport = async () => {
    if (!deleteModalItem) return;
    try {
      const res = await authFetch(`/api/faculty/lost-found/${deleteModalItem.id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast('Report deleted successfully', 'success');
        setDeleteModalItem(null);
        fetchMyReports();
        fetchLostFoundItems();
      } else {
        showToast(data.message || 'Failed to delete report', 'error');
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleMarkReturned = async (item) => {
    try {
      const res = await authFetch(`/api/faculty/lost-found/${item.id}/return`, {
        method: 'PUT'
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(data.message || 'Item marked as returned!', 'success');
        fetchMyReports();
        fetchLostFoundItems();
        fetchReturnedHistory();
      } else {
        showToast(data.message || 'Failed to mark as returned', 'error');
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Dynamic Header Meta
  const getHeaderMeta = () => {
    switch (activeTab) {
      case 'timetable':
        return { title: 'Smart Timetable & Lecture Schedule', subtitle: 'Live lectures, weekly matrix & room allocations' };
      case 'clubs-events':
        return { title: 'Clubs & Campus Events Management', subtitle: 'Manage technical clubs, seat capacities & registered attendees' };
      case 'lost-found':
        return { title: 'Campus Lost & Found Portal', subtitle: 'Browse reported items, register lost/found articles & reunite property safely' };
      case 'doubts':
        return { title: 'Smart Doubt Discussion & Help Requests', subtitle: 'Answer student questions, verify solutions & publish announcements' };
      case 'academic-performance':
        return { title: 'Academic Performance & Grading Suite', subtitle: 'Grade internal marks, attendance %, feedback & publish to students' };
      case 'classroom-availability':
        return { title: 'Classroom Availability Matrix', subtitle: 'Check real-time room occupancy and lecture schedules' };
      case 'personal-schedule':
        return { title: 'Personal Schedule & Reminders', subtitle: '🔒 Strictly Private — Your confidential tasks and reminders' };
      case 'notifications':
        return { title: 'Faculty Notification Center', subtitle: 'Student help requests, registrations & academic alerts' };
      case 'profile':
        return { title: 'Faculty Academic Profile', subtitle: 'View appointed subjects, classes & department credentials' };
      default:
        return { title: 'Faculty Command Center', subtitle: `Welcome back, ${user?.name || 'Professor'} • ${user?.department || 'Engineering'}` };
    }
  };

  const { title, subtitle } = getHeaderMeta();

  const currentLecture = timetableData?.currentLecture;
  const nextLecture = timetableData?.nextLecture;
  const todaySchedule = timetableData?.todaySchedule || [];
  const weeklyGrid = timetableData?.weeklyGrid || {};
  const assignedClassrooms = timetableData?.assignedClassrooms || [];

  return (
    <div className="faculty-layout">
      {/* Sidebar */}
      <FacultySidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isMobileOpen={isMobileOpen}
        closeMobileSidebar={() => setIsMobileOpen(false)}
        unreadNotifsCount={unreadNotifsCount}
        pendingDoubtsCount={statsData?.stats?.pendingDoubtRequests || 0}
      />

      {/* Main Content Wrapper */}
      <div className="faculty-main-wrapper">
        <FacultyHeader
          title={title}
          subtitle={subtitle}
          toggleMobileSidebar={() => setIsMobileOpen(!isMobileOpen)}
          unreadCount={unreadNotifsCount}
          notifications={notifications}
          setActiveTab={setActiveTab}
        />

        <main className="faculty-content" style={{ animation: 'fadeIn 0.2s ease-in' }}>
          
          {/* ================================================================ */}
          {/* 1. DASHBOARD OVERVIEW VIEW */}
          {/* ================================================================ */}
          {activeTab === 'dashboard' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              
              {/* Summary Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
                
                {/* Card 1: Today's Lectures */}
                <div className="card" style={{ padding: '1.5rem', background: 'rgba(15, 23, 42, 0.75)', border: '1px solid var(--border-subtle)', borderRadius: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(99, 102, 241, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-light)' }}>
                      <Calendar size={22} />
                    </div>
                    <span className="badge" style={{ background: 'rgba(99, 102, 241, 0.15)', color: 'var(--primary-light)', padding: '0.25rem 0.6rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600 }}>
                      Today's Schedule
                    </span>
                  </div>
                  <div style={{ fontSize: '2rem', fontWeight: 800, color: '#fff', lineHeight: 1 }}>
                    {todaySchedule.length}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
                    Lectures scheduled today
                  </div>
                </div>

                {/* Card 2: Upcoming Lecture */}
                <div className="card" style={{ padding: '1.5rem', background: 'rgba(15, 23, 42, 0.75)', border: '1px solid var(--border-subtle)', borderRadius: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(6, 182, 212, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-cyan)' }}>
                      <Clock size={22} />
                    </div>
                    <span className="badge" style={{ background: 'rgba(6, 182, 212, 0.15)', color: 'var(--accent-cyan)', padding: '0.25rem 0.6rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600 }}>
                      {nextLecture ? (nextLecture.isToday ? `Starts ${nextLecture.starts}` : `Tomorrow (${nextLecture.dayOfWeek})`) : 'No Upcoming'}
                    </span>
                  </div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                    {nextLecture ? nextLecture.subject : 'Schedule Clear'}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
                    {nextLecture ? `${nextLecture.class} • ${nextLecture.room}` : 'No further lectures scheduled'}
                  </div>
                </div>

                {/* Card 3: Assigned Classrooms */}
                <div className="card" style={{ padding: '1.5rem', background: 'rgba(15, 23, 42, 0.75)', border: '1px solid var(--border-subtle)', borderRadius: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-emerald)' }}>
                      <DoorOpen size={22} />
                    </div>
                    <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.15)', color: 'var(--accent-emerald)', padding: '0.25rem 0.6rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600 }}>
                      Venues
                    </span>
                  </div>
                  <div style={{ fontSize: '2rem', fontWeight: 800, color: '#fff', lineHeight: 1 }}>
                    {statsData?.stats?.assignedClassroomsCount || assignedClassrooms.length || 0}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
                    Distinct rooms & labs
                  </div>
                </div>

                {/* Card 4: Pending Doubt Requests */}
                <div className="card" style={{ padding: '1.5rem', background: 'rgba(15, 23, 42, 0.75)', border: '1px solid var(--border-subtle)', borderRadius: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(245, 158, 11, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-amber)' }}>
                      <MessageSquare size={22} />
                    </div>
                    <span className="badge" style={{ background: 'rgba(245, 158, 11, 0.15)', color: 'var(--accent-amber)', padding: '0.25rem 0.6rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600 }}>
                      Faculty Help
                    </span>
                  </div>
                  <div style={{ fontSize: '2rem', fontWeight: 800, color: '#fff', lineHeight: 1 }}>
                    {statsData?.stats?.pendingDoubtRequests || 0}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
                    Pending student help requests
                  </div>
                </div>
              </div>

              {/* Current Ongoing Lecture Banner */}
              {currentLecture && (
                <div
                  style={{
                    padding: '1.5rem 2rem',
                    borderRadius: '16px',
                    background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.25) 0%, rgba(168, 85, 247, 0.2) 100%)',
                    border: '1px solid rgba(99, 102, 241, 0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '1.5rem',
                    boxShadow: '0 0 30px rgba(99, 102, 241, 0.2)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                    <div
                      style={{
                        width: '50px',
                        height: '50px',
                        borderRadius: '14px',
                        background: 'linear-gradient(135deg, #10b981, #06b6d4)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                        boxShadow: '0 0 15px rgba(16, 185, 129, 0.4)'
                      }}
                    >
                      <Sparkles size={26} />
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 800, padding: '0.2rem 0.6rem', borderRadius: '999px', background: '#10b981', color: '#fff', letterSpacing: '0.05em' }}>
                          ONGOING LECTURE
                        </span>
                        <span style={{ fontSize: '0.85rem', color: 'var(--primary-light)', fontWeight: 600 }}>
                          {currentLecture.minutesRemaining} mins remaining
                        </span>
                      </div>
                      <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', marginTop: '0.25rem' }}>
                        {currentLecture.subject}
                      </h2>
                      <div style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', display: 'flex', gap: '1rem', marginTop: '0.2rem' }}>
                        <span>Class: <strong style={{ color: '#fff' }}>{currentLecture.class}</strong></span>
                        <span>•</span>
                        <span>Room: <strong style={{ color: '#fff' }}>{currentLecture.room}</strong></span>
                        <span>•</span>
                        <span>Time: <strong style={{ color: '#fff' }}>{currentLecture.time}</strong></span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setActiveTab('timetable')}
                    style={{
                      padding: '0.75rem 1.25rem',
                      borderRadius: '10px',
                      background: 'rgba(255, 255, 255, 0.1)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      color: '#fff',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    <span>View Timetable</span>
                    <ChevronRight size={16} />
                  </button>
                </div>
              )}

              {/* Main Grid: Today's Schedule & Quick Shortcuts */}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
                
                {/* Today's Schedule Timeline */}
                <div className="card" style={{ padding: '1.5rem', background: 'rgba(15, 23, 42, 0.75)', border: '1px solid var(--border-subtle)', borderRadius: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                    <div>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>Today's Teaching Timeline</h3>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
                        {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                    <button
                      onClick={() => setActiveTab('timetable')}
                      style={{ background: 'none', border: 'none', color: 'var(--primary-light)', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' }}
                    >
                      Weekly Matrix →
                    </button>
                  </div>

                  {todaySchedule.length === 0 ? (
                    <div style={{ padding: '3rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                      <Calendar size={36} style={{ margin: '0 auto 0.75rem auto', opacity: 0.4 }} />
                      <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>No lectures scheduled for today.</p>
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Check the full weekly grid to prepare for upcoming slots.</p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {todaySchedule.map((slot, idx) => (
                        <div
                          key={slot.id || idx}
                          style={{
                            padding: '1rem 1.25rem',
                            borderRadius: '12px',
                            background: 'rgba(255, 255, 255, 0.03)',
                            border: '1px solid var(--border-subtle)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ width: '80px', fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary-light)' }}>
                              {slot.startTime} – {slot.endTime}
                            </div>
                            <div>
                              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#fff' }}>
                                {slot.subjectName}
                              </div>
                              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                                Class: <span style={{ color: '#fff', fontWeight: 600 }}>{slot.classYear}-{slot.classDivision}</span> • Room: <span style={{ color: '#fff', fontWeight: 600 }}>{slot.roomNumber}</span> ({slot.classroomType || 'Classroom'})
                              </div>
                            </div>
                          </div>
                          <span
                            className="badge"
                            style={{
                              padding: '0.3rem 0.75rem',
                              borderRadius: '999px',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              background: 'rgba(99, 102, 241, 0.15)',
                              color: 'var(--primary-light)'
                            }}
                          >
                            Period {slot.periodNumber || (idx + 1)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Right Column: Quick Actions & Recent Notifications */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  
                  {/* Quick Actions Card */}
                  <div className="card" style={{ padding: '1.5rem', background: 'rgba(15, 23, 42, 0.75)', border: '1px solid var(--border-subtle)', borderRadius: '16px' }}>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff', marginBottom: '1rem' }}>
                      Faculty Shortcuts
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                      <button
                        onClick={() => { setActiveTab('doubts'); setDoubtFilter('pending_help'); }}
                        style={{
                          width: '100%',
                          padding: '0.75rem 1rem',
                          borderRadius: '10px',
                          background: 'rgba(245, 158, 11, 0.1)',
                          border: '1px solid rgba(245, 158, 11, 0.3)',
                          color: '#fbbf24',
                          fontWeight: 600,
                          fontSize: '0.85rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <MessageSquare size={16} />
                          <span>Pending Doubt Requests</span>
                        </div>
                        <span style={{ background: '#f59e0b', color: '#000', padding: '0.1rem 0.45rem', borderRadius: '999px', fontSize: '0.7rem', fontWeight: 800 }}>
                          {statsData?.stats?.pendingDoubtRequests || 0}
                        </span>
                      </button>

                      <button
                        onClick={() => setActiveTab('academic-performance')}
                        style={{
                          width: '100%',
                          padding: '0.75rem 1rem',
                          borderRadius: '10px',
                          background: 'rgba(99, 102, 241, 0.1)',
                          border: '1px solid rgba(99, 102, 241, 0.3)',
                          color: 'var(--primary-light)',
                          fontWeight: 600,
                          fontSize: '0.85rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem'
                        }}
                      >
                        <GraduationCap size={16} />
                        <span>Publish Academic Grades</span>
                      </button>

                      <button
                        onClick={() => { setActiveTab('personal-schedule'); setIsTaskModalOpen(true); }}
                        style={{
                          width: '100%',
                          padding: '0.75rem 1rem',
                          borderRadius: '10px',
                          background: 'rgba(168, 85, 247, 0.1)',
                          border: '1px solid rgba(168, 85, 247, 0.3)',
                          color: '#c084fc',
                          fontWeight: 600,
                          fontSize: '0.85rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem'
                        }}
                      >
                        <Plus size={16} />
                        <span>Add Private Task / Reminder</span>
                      </button>

                      <button
                        onClick={() => { setActiveTab('doubts'); setDoubtSubTab('announcements'); setIsAnnouncementModalOpen(true); }}
                        style={{
                          width: '100%',
                          padding: '0.75rem 1rem',
                          borderRadius: '10px',
                          background: 'rgba(6, 182, 212, 0.1)',
                          border: '1px solid rgba(6, 182, 212, 0.3)',
                          color: 'var(--accent-cyan)',
                          fontWeight: 600,
                          fontSize: '0.85rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem'
                        }}
                      >
                        <Pin size={16} />
                        <span>Broadcast Class Circular</span>
                      </button>
                    </div>
                  </div>

                  {/* Recent Notifications Card */}
                  <div className="card" style={{ padding: '1.5rem', background: 'rgba(15, 23, 42, 0.75)', border: '1px solid var(--border-subtle)', borderRadius: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                      <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff' }}>Recent Notifications</h3>
                      <button
                        onClick={() => setActiveTab('notifications')}
                        style={{ background: 'none', border: 'none', color: 'var(--primary-light)', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}
                      >
                        All →
                      </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                      {notifications.slice(0, 3).map(n => (
                        <div
                          key={n.id}
                          style={{
                            padding: '0.65rem 0.85rem',
                            borderRadius: '10px',
                            background: n.isRead ? 'rgba(255, 255, 255, 0.02)' : 'rgba(99, 102, 241, 0.08)',
                            border: '1px solid var(--border-subtle)',
                            fontSize: '0.8rem'
                          }}
                        >
                          <div style={{ fontWeight: 600, color: '#fff' }}>{n.title}</div>
                          <div style={{ color: 'var(--text-secondary)', marginTop: '2px', fontSize: '0.75rem' }}>{n.message}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              </div>
            </div>
          )}

          {/* ================================================================ */}
          {/* 2. SMART TIMETABLE VIEW */}
          {/* ================================================================ */}
          {activeTab === 'timetable' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              {/* Branch / Department Folder Tabs */}
              <DepartmentFolderTabs
                endpoint="/api/faculty/departments"
                selectedDepartment={facultyTtDept}
                onSelectDepartment={(dept) => {
                  setFacultyTtDept(dept);
                  fetchFacultyTimetable(dept);
                }}
                showAllOption={true}
              />

              {/* Day Selector Tabs */}
              <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
                {daysOfWeek.map(day => (
                  <button
                    key={day}
                    onClick={() => setSelectedDay(day)}
                    style={{
                      padding: '0.65rem 1.25rem',
                      borderRadius: '10px',
                      border: selectedDay === day ? '1px solid var(--primary)' : '1px solid var(--border-subtle)',
                      background: selectedDay === day ? 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)' : 'var(--bg-input)',
                      color: '#fff',
                      fontWeight: 600,
                      fontSize: '0.88rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {day}
                  </button>
                ))}
              </div>

              {/* Grid of Lectures for Selected Day */}
              <div className="card" style={{ padding: '1.5rem', background: 'rgba(15, 23, 42, 0.75)', border: '1px solid var(--border-subtle)', borderRadius: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                  <div>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff' }}>
                      {selectedDay}'s Teaching Schedule
                    </h2>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: 0 }}>
                      Official timetable slots assigned to your faculty account
                    </p>
                  </div>
                  <span className="badge" style={{ background: 'rgba(99, 102, 241, 0.15)', color: 'var(--primary-light)', padding: '0.35rem 0.8rem', borderRadius: '999px', fontWeight: 600 }}>
                    {weeklyGrid[selectedDay]?.length || 0} Lectures
                  </span>
                </div>

                {(weeklyGrid[selectedDay] || []).length === 0 ? (
                  <div style={{ padding: '4rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <Calendar size={48} style={{ margin: '0 auto 1rem auto', opacity: 0.3 }} />
                    <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', fontWeight: 600 }}>No Lectures Scheduled on {selectedDay}</p>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>You have no teaching commitments on this day.</p>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
                    {(weeklyGrid[selectedDay] || []).map((slot, i) => (
                      <div
                        key={slot.id || i}
                        style={{
                          padding: '1.25rem',
                          borderRadius: '14px',
                          background: 'rgba(255, 255, 255, 0.03)',
                          border: '1px solid var(--border-subtle)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.85rem'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: '0.78rem', fontWeight: 700, padding: '0.2rem 0.5rem', borderRadius: '6px', background: 'rgba(99, 102, 241, 0.2)', color: 'var(--primary-light)' }}>
                            Period {slot.periodNumber || (i + 1)}
                          </span>
                          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff' }}>
                            {slot.startTime} – {slot.endTime}
                          </span>
                        </div>

                        <div>
                          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff' }}>{slot.subjectName}</h3>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>Code: {slot.subjectCode || 'N/A'} • {slot.credits || 4} Credits</div>
                        </div>

                        <div style={{ paddingTop: '0.75rem', borderTop: '1px solid rgba(255, 255, 255, 0.06)', display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                          <div>
                            <span style={{ color: 'var(--text-muted)' }}>Class:</span>{' '}
                            <strong style={{ color: '#fff' }}>{slot.classYear}-{slot.classDivision}</strong>
                          </div>
                          <div>
                            <span style={{ color: 'var(--text-muted)' }}>Venue:</span>{' '}
                            <strong style={{ color: 'var(--accent-cyan)' }}>{slot.roomNumber}</strong>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Assigned Classrooms Matrix */}
              <div className="card" style={{ padding: '1.5rem', background: 'rgba(15, 23, 42, 0.75)', border: '1px solid var(--border-subtle)', borderRadius: '16px' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', marginBottom: '1rem' }}>
                  Assigned Teaching Classrooms & Laboratories
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem' }}>
                  {assignedClassrooms.map((room) => (
                    <div
                      key={room.id}
                      style={{
                        padding: '1rem',
                        borderRadius: '12px',
                        background: 'rgba(255, 255, 255, 0.02)',
                        border: '1px solid var(--border-subtle)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.85rem'
                      }}
                    >
                      <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(6, 182, 212, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-cyan)' }}>
                        <Building2 size={20} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#fff' }}>{room.roomNumber}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          {room.building} • {room.floor}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ================================================================ */}
          {/* 3. CLUBS & EVENTS MANAGEMENT VIEW */}
          {/* ================================================================ */}
          {activeTab === 'clubs-events' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              {/* Tabs: Clubs vs Events */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={() => setClubsTab('clubs')}
                    style={{
                      padding: '0.6rem 1.25rem',
                      borderRadius: '10px',
                      border: clubsTab === 'clubs' ? '1px solid var(--primary)' : '1px solid var(--border-subtle)',
                      background: clubsTab === 'clubs' ? 'var(--primary)' : 'var(--bg-input)',
                      color: '#fff',
                      fontWeight: 600,
                      fontSize: '0.88rem',
                      cursor: 'pointer'
                    }}
                  >
                    Clubs Management ({clubsList.length})
                  </button>
                  <button
                    onClick={() => setClubsTab('events')}
                    style={{
                      padding: '0.6rem 1.25rem',
                      borderRadius: '10px',
                      border: clubsTab === 'events' ? '1px solid var(--primary)' : '1px solid var(--border-subtle)',
                      background: clubsTab === 'events' ? 'var(--primary)' : 'var(--bg-input)',
                      color: '#fff',
                      fontWeight: 600,
                      fontSize: '0.88rem',
                      cursor: 'pointer'
                    }}
                  >
                    Campus Events ({eventsList.length})
                  </button>
                </div>

                {clubsTab === 'clubs' ? (
                  <button
                    onClick={() => setIsClubModalOpen(true)}
                    style={{
                      padding: '0.65rem 1.25rem',
                      borderRadius: '10px',
                      background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)',
                      border: 'none',
                      color: '#fff',
                      fontWeight: 600,
                      fontSize: '0.88rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    <Plus size={16} />
                    <span>Create New Club</span>
                  </button>
                ) : (
                  <button
                    onClick={() => setIsEventModalOpen(true)}
                    style={{
                      padding: '0.65rem 1.25rem',
                      borderRadius: '10px',
                      background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)',
                      border: 'none',
                      color: '#fff',
                      fontWeight: 600,
                      fontSize: '0.88rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    <Plus size={16} />
                    <span>Schedule Campus Event</span>
                  </button>
                )}
              </div>

              {/* Clubs List */}
              {clubsTab === 'clubs' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.5rem' }}>
                  {clubsList.map(club => (
                    <div
                      key={club.id}
                      className="card"
                      style={{
                        padding: '1.5rem',
                        background: 'rgba(15, 23, 42, 0.75)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '16px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: '1rem'
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: '999px', background: 'rgba(6, 182, 212, 0.15)', color: 'var(--accent-cyan)' }}>
                            {club.category}
                          </span>
                          <span
                            style={{
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              padding: '0.2rem 0.6rem',
                              borderRadius: '999px',
                              background: club.status === 'Seats Full' ? 'rgba(244, 63, 94, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                              color: club.status === 'Seats Full' ? '#fb7185' : '#34d399'
                            }}
                          >
                            {club.status}
                          </span>
                        </div>

                        <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#fff' }}>{club.name}</h3>
                        <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '0.4rem', lineHeight: 1.4 }}>
                          {club.description}
                        </p>
                      </div>

                      <div>
                        {/* Seat Stats */}
                        <div style={{ padding: '0.75rem', borderRadius: '10px', background: 'rgba(0, 0, 0, 0.25)', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', textAlign: 'center', marginBottom: '1rem' }}>
                          <div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Max Seats</div>
                            <div style={{ fontWeight: 700, color: '#fff', fontSize: '0.95rem' }}>{club.maxSeats}</div>
                          </div>
                          <div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Registered</div>
                            <div style={{ fontWeight: 700, color: 'var(--primary-light)', fontSize: '0.95rem' }}>{club.registeredCount || 0}</div>
                          </div>
                          <div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Available</div>
                            <div style={{ fontWeight: 700, color: club.availableSeats > 0 ? '#34d399' : '#fb7185', fontSize: '0.95rem' }}>{club.availableSeats}</div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            onClick={() => handleViewClubMembers(club.id, club.name)}
                            style={{
                              flex: 1,
                              padding: '0.6rem',
                              borderRadius: '8px',
                              background: 'var(--bg-input)',
                              border: '1px solid var(--border-subtle)',
                              color: '#fff',
                              fontSize: '0.82rem',
                              fontWeight: 600,
                              cursor: 'pointer'
                            }}
                          >
                            View Joined Students ({club.registeredCount || 0})
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Events List */}
              {clubsTab === 'events' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.5rem' }}>
                  {eventsList.map(ev => (
                    <div
                      key={ev.id}
                      className="card"
                      style={{
                        padding: '1.5rem',
                        background: 'rgba(15, 23, 42, 0.75)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '16px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: '1rem'
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: '999px', background: 'rgba(168, 85, 247, 0.15)', color: '#c084fc' }}>
                            {ev.clubName || 'Collegiate Event'}
                          </span>
                          <span
                            style={{
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              padding: '0.2rem 0.6rem',
                              borderRadius: '999px',
                              background: ev.status === 'Registration Closed' ? 'rgba(244, 63, 94, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                              color: ev.status === 'Registration Closed' ? '#fb7185' : '#34d399'
                            }}
                          >
                            {ev.status}
                          </span>
                        </div>

                        <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#fff' }}>{ev.title}</h3>
                        <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '0.4rem', lineHeight: 1.4 }}>
                          {ev.description}
                        </p>
                      </div>

                      <div>
                        <div style={{ padding: '0.75rem', borderRadius: '10px', background: 'rgba(0, 0, 0, 0.25)', display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.8rem', marginBottom: '1rem' }}>
                          <div><span style={{ color: 'var(--text-muted)' }}>Date & Time:</span> <strong style={{ color: '#fff' }}>{ev.eventDate} ({ev.eventTime || '10:00 AM'})</strong></div>
                          <div><span style={{ color: 'var(--text-muted)' }}>Venue:</span> <strong style={{ color: 'var(--accent-cyan)' }}>{ev.venue}</strong></div>
                          <div><span style={{ color: 'var(--text-muted)' }}>Reg Deadline:</span> <strong style={{ color: '#fff' }}>{ev.registrationLastDate || 'Open'}</strong></div>
                        </div>

                        <button
                          onClick={() => handleViewEventAttendees(ev.id, ev.title)}
                          style={{
                            width: '100%',
                            padding: '0.6rem',
                            borderRadius: '8px',
                            background: 'var(--bg-input)',
                            border: '1px solid var(--border-subtle)',
                            color: '#fff',
                            fontSize: '0.82rem',
                            fontWeight: 600,
                            cursor: 'pointer'
                          }}
                        >
                          View Registered Students ({ev.registeredCount || 0})
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ================================================================ */}
          {/* CAMPUS LOST & FOUND HUB */}
          {/* ================================================================ */}
          {activeTab === 'lost-found' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
              
              {/* Lost & Found Sub-Navigation Tabs */}
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
                {[
                  { id: 'browse', label: 'Browse Campus Items', icon: Search },
                  { id: 'report-lost', label: 'Report Lost Item', icon: Plus },
                  { id: 'report-found', label: 'Report Found Item', icon: CheckCircle },
                  { id: 'my-reports', label: `My Reports (${myReports.length})`, icon: Package },
                  { id: 'returned-history', label: 'Returned History', icon: History }
                ].map(tab => {
                  const Icon = tab.icon;
                  const isActive = lostFoundSubTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setLostFoundSubTab(tab.id)}
                      style={{
                        padding: '0.55rem 1.1rem',
                        borderRadius: '10px',
                        border: isActive ? '1px solid #10b981' : '1px solid transparent',
                        background: isActive ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
                        color: isActive ? '#34d399' : 'var(--text-secondary)',
                        fontWeight: 700,
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <Icon size={16} />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Sub-View 1: Browse Active Items */}
              {lostFoundSubTab === 'browse' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  
                  {/* Search & Filter Bar */}
                  <div style={{ display: 'flex', gap: '0.85rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                      {/* Type Toggle Chips */}
                      {['ALL', 'LOST', 'FOUND'].map(t => (
                        <button
                          key={t}
                          onClick={() => setLfType(t)}
                          style={{
                            padding: '0.4rem 0.85rem',
                            borderRadius: '8px',
                            border: lfType === t ? '1px solid #10b981' : '1px solid var(--border-subtle)',
                            background: lfType === t ? (t === 'LOST' ? 'rgba(244, 63, 94, 0.2)' : 'rgba(16, 185, 129, 0.2)') : 'var(--bg-input)',
                            color: lfType === t ? (t === 'LOST' ? '#fb7185' : '#34d399') : 'var(--text-secondary)',
                            fontWeight: 700,
                            fontSize: '0.78rem',
                            cursor: 'pointer'
                          }}
                        >
                          {t === 'ALL' ? 'All Types' : (t === 'LOST' ? '🚨 Lost Items' : '✨ Found Items')}
                        </button>
                      ))}

                      {/* Category Dropdown */}
                      <select
                        value={lfCategory}
                        onChange={(e) => setLfCategory(e.target.value)}
                        style={{
                          padding: '0.45rem 0.85rem',
                          borderRadius: '8px',
                          background: 'var(--bg-input)',
                          border: '1px solid var(--border-subtle)',
                          color: '#fff',
                          fontSize: '0.8rem',
                          cursor: 'pointer'
                        }}
                      >
                        {LF_CATEGORIES.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>

                    {/* Search Input */}
                    <div style={{ position: 'relative', minWidth: '240px' }}>
                      <Search size={15} color="var(--text-muted)" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
                      <input
                        type="text"
                        placeholder="Search item, location..."
                        value={lfSearch}
                        onChange={(e) => setLfSearch(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '0.45rem 1rem 0.45rem 2.2rem',
                          borderRadius: '8px',
                          background: 'var(--bg-input)',
                          border: '1px solid var(--border-subtle)',
                          color: '#fff',
                          fontSize: '0.82rem'
                        }}
                      />
                    </div>
                  </div>

                  {/* Items Grid */}
                  {lostFoundItems.length === 0 ? (
                    <div style={{ padding: '4rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                      <Package size={48} style={{ margin: '0 auto 1rem auto', opacity: 0.3 }} />
                      <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', fontWeight: 600 }}>No matching items found</p>
                      <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Try adjusting your filters or search keywords.</p>
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
                      {lostFoundItems.map(item => {
                        const isLost = item.type === 'LOST';
                        return (
                          <div
                            key={item.id}
                            className="card"
                            style={{
                              padding: '1.35rem',
                              background: 'rgba(15, 23, 42, 0.75)',
                              border: isLost ? '1px solid rgba(244, 63, 94, 0.25)' : '1px solid rgba(16, 185, 129, 0.25)',
                              borderRadius: '16px',
                              display: 'flex',
                              flexDirection: 'column',
                              justifyContent: 'space-between',
                              gap: '0.85rem'
                            }}
                          >
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                <span
                                  style={{
                                    fontSize: '0.72rem',
                                    fontWeight: 800,
                                    padding: '0.15rem 0.55rem',
                                    borderRadius: '999px',
                                    background: isLost ? 'rgba(244, 63, 94, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                                    color: isLost ? '#fb7185' : '#34d399'
                                  }}
                                >
                                  {isLost ? 'LOST ITEM' : 'FOUND ITEM'}
                                </span>
                                <span style={{ fontSize: '0.72rem', padding: '0.15rem 0.5rem', borderRadius: '6px', background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-muted)' }}>
                                  {item.category}
                                </span>
                              </div>

                              <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#fff' }}>{item.itemName}</h4>
                              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '0.35rem', lineHeight: 1.45 }}>
                                {item.description}
                              </p>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                <MapPin size={13} color="var(--accent-cyan)" />
                                <span>{isLost ? 'Last Seen:' : 'Found At:'} <strong style={{ color: '#fff' }}>{item.location}</strong></span>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                <Calendar size={13} color="#34d399" />
                                <span>Date: <strong style={{ color: '#fff' }}>{item.date}</strong></span>
                              </div>
                            </div>

                            <div style={{ paddingTop: '0.75rem', borderTop: '1px solid rgba(255, 255, 255, 0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                By: <strong style={{ color: '#fff' }}>{item.userName}</strong> ({item.userRole})
                              </div>
                              <button
                                onClick={() => setContactModalItem(item)}
                                style={{
                                  padding: '0.35rem 0.75rem',
                                  borderRadius: '6px',
                                  background: 'rgba(255, 255, 255, 0.05)',
                                  border: '1px solid var(--border-subtle)',
                                  color: 'var(--accent-cyan)',
                                  fontSize: '0.75rem',
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.35rem'
                                }}
                              >
                                <Mail size={13} /> Contact
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Sub-View 2: Report Lost Item */}
              {lostFoundSubTab === 'report-lost' && (
                <div className="card" style={{ padding: '2rem', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(244, 63, 94, 0.3)', borderRadius: '20px', maxWidth: '700px', margin: '0 auto' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(244, 63, 94, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fb7185' }}>
                      <AlertCircle size={22} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff' }}>Report Missing / Lost Item</h3>
                      <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: 0 }}>
                        Submit details of your misplaced item across campus for peer retrieval.
                      </p>
                    </div>
                  </div>

                  <form onSubmit={handleCreateLostFound} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#fff', display: 'block', marginBottom: '0.4rem' }}>
                        Item Name / Title *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Black Leather Fossil Wallet, Casio FX-991 Calculator"
                        value={reportForm.itemName}
                        onChange={(e) => setReportForm({ ...reportForm, itemName: e.target.value, type: 'LOST' })}
                        style={{ width: '100%', padding: '0.65rem 1rem', borderRadius: '8px', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', color: '#fff', fontSize: '0.88rem' }}
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div>
                        <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#fff', display: 'block', marginBottom: '0.4rem' }}>
                          Category *
                        </label>
                        <select
                          value={reportForm.category}
                          onChange={(e) => setReportForm({ ...reportForm, category: e.target.value })}
                          style={{ width: '100%', padding: '0.65rem 1rem', borderRadius: '8px', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', color: '#fff', fontSize: '0.88rem' }}
                        >
                          {LF_CATEGORIES.filter(c => c !== 'All Categories').map(c => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#fff', display: 'block', marginBottom: '0.4rem' }}>
                          Date Lost *
                        </label>
                        <input
                          type="date"
                          required
                          value={reportForm.date}
                          onChange={(e) => setReportForm({ ...reportForm, date: e.target.value })}
                          style={{ width: '100%', padding: '0.65rem 1rem', borderRadius: '8px', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', color: '#fff', fontSize: '0.88rem' }}
                        />
                      </div>
                    </div>

                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#fff', display: 'block', marginBottom: '0.4rem' }}>
                        Last Seen Campus Location *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Central Library 2nd Floor, Room 301 Desk 4, Cafeteria"
                        value={reportForm.location}
                        onChange={(e) => setReportForm({ ...reportForm, location: e.target.value })}
                        style={{ width: '100%', padding: '0.65rem 1rem', borderRadius: '8px', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', color: '#fff', fontSize: '0.88rem' }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#fff', display: 'block', marginBottom: '0.4rem' }}>
                        Detailed Description & Identifying Marks *
                      </label>
                      <textarea
                        required
                        rows={3}
                        placeholder="Describe color, brand, contents, unique stickers or serial number..."
                        value={reportForm.description}
                        onChange={(e) => setReportForm({ ...reportForm, description: e.target.value })}
                        style={{ width: '100%', padding: '0.65rem 1rem', borderRadius: '8px', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', color: '#fff', fontSize: '0.88rem', resize: 'vertical' }}
                      />
                    </div>

                    <button
                      type="submit"
                      style={{
                        padding: '0.75rem',
                        borderRadius: '10px',
                        background: 'linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)',
                        border: 'none',
                        color: '#fff',
                        fontWeight: 700,
                        fontSize: '0.92rem',
                        cursor: 'pointer',
                        marginTop: '0.5rem',
                        boxShadow: '0 0 15px rgba(244, 63, 94, 0.4)'
                      }}
                    >
                      Submit Lost Item Report
                    </button>
                  </form>
                </div>
              )}

              {/* Sub-View 3: Report Found Item */}
              {lostFoundSubTab === 'report-found' && (
                <div className="card" style={{ padding: '2rem', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '20px', maxWidth: '700px', margin: '0 auto' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#34d399' }}>
                      <CheckCircle size={22} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff' }}>Report Recovered / Found Item</h3>
                      <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: 0 }}>
                        Help a student or professor recover their missing property.
                      </p>
                    </div>
                  </div>

                  <form onSubmit={handleCreateLostFound} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#fff', display: 'block', marginBottom: '0.4rem' }}>
                        Item Name / Title *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Set of 3 Keys with Batman Keychain, Wireless Earbuds Case"
                        value={reportForm.itemName}
                        onChange={(e) => setReportForm({ ...reportForm, itemName: e.target.value, type: 'FOUND' })}
                        style={{ width: '100%', padding: '0.65rem 1rem', borderRadius: '8px', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', color: '#fff', fontSize: '0.88rem' }}
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div>
                        <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#fff', display: 'block', marginBottom: '0.4rem' }}>
                          Category *
                        </label>
                        <select
                          value={reportForm.category}
                          onChange={(e) => setReportForm({ ...reportForm, category: e.target.value })}
                          style={{ width: '100%', padding: '0.65rem 1rem', borderRadius: '8px', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', color: '#fff', fontSize: '0.88rem' }}
                        >
                          {LF_CATEGORIES.filter(c => c !== 'All Categories').map(c => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#fff', display: 'block', marginBottom: '0.4rem' }}>
                          Date Found *
                        </label>
                        <input
                          type="date"
                          required
                          value={reportForm.date}
                          onChange={(e) => setReportForm({ ...reportForm, date: e.target.value })}
                          style={{ width: '100%', padding: '0.65rem 1rem', borderRadius: '8px', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', color: '#fff', fontSize: '0.88rem' }}
                        />
                      </div>
                    </div>

                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#fff', display: 'block', marginBottom: '0.4rem' }}>
                        Found Location / Turn-in Desk *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Near Lab 201 Corridor, Handed to Security Main Gate"
                        value={reportForm.location}
                        onChange={(e) => setReportForm({ ...reportForm, location: e.target.value })}
                        style={{ width: '100%', padding: '0.65rem 1rem', borderRadius: '8px', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', color: '#fff', fontSize: '0.88rem' }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#fff', display: 'block', marginBottom: '0.4rem' }}>
                        Description & Recovery Condition *
                      </label>
                      <textarea
                        required
                        rows={3}
                        placeholder="Describe condition, exact spot where found, or where the owner can collect it..."
                        value={reportForm.description}
                        onChange={(e) => setReportForm({ ...reportForm, description: e.target.value })}
                        style={{ width: '100%', padding: '0.65rem 1rem', borderRadius: '8px', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', color: '#fff', fontSize: '0.88rem', resize: 'vertical' }}
                      />
                    </div>

                    <button
                      type="submit"
                      style={{
                        padding: '0.75rem',
                        borderRadius: '10px',
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        border: 'none',
                        color: '#fff',
                        fontWeight: 700,
                        fontSize: '0.92rem',
                        cursor: 'pointer',
                        marginTop: '0.5rem',
                        boxShadow: '0 0 15px rgba(16, 185, 129, 0.4)'
                      }}
                    >
                      Submit Found Item Report
                    </button>
                  </form>
                </div>
              )}

              {/* Sub-View 4: My Reports (Edit, Delete, Mark as Returned) */}
              {lostFoundSubTab === 'my-reports' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff' }}>My Reported Items</h3>
                      <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: 0 }}>
                        Manage reports you created. Mark items as returned once retrieved.
                      </p>
                    </div>
                  </div>

                  {myReports.length === 0 ? (
                    <div style={{ padding: '4rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                      <Package size={48} style={{ margin: '0 auto 1rem auto', opacity: 0.3 }} />
                      <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', fontWeight: 600 }}>No reports submitted yet</p>
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
                      {myReports.map(report => {
                        const isReturned = report.status === 'RETURNED';
                        return (
                          <div
                            key={report.id}
                            className="card"
                            style={{
                              padding: '1.35rem',
                              background: 'rgba(15, 23, 42, 0.75)',
                              border: isReturned ? '1px solid var(--border-subtle)' : '1px solid rgba(16, 185, 129, 0.3)',
                              borderRadius: '16px',
                              display: 'flex',
                              flexDirection: 'column',
                              justifyContent: 'space-between',
                              gap: '0.85rem'
                            }}
                          >
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                <span style={{ fontSize: '0.72rem', fontWeight: 800, padding: '0.15rem 0.55rem', borderRadius: '999px', background: report.type === 'LOST' ? 'rgba(244, 63, 94, 0.15)' : 'rgba(16, 185, 129, 0.15)', color: report.type === 'LOST' ? '#fb7185' : '#34d399' }}>
                                  {report.type}
                                </span>
                                <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '0.15rem 0.55rem', borderRadius: '999px', background: isReturned ? 'rgba(99, 102, 241, 0.2)' : 'rgba(16, 185, 129, 0.2)', color: isReturned ? 'var(--primary-light)' : '#34d399' }}>
                                  {report.status}
                                </span>
                              </div>
                              <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#fff' }}>{report.itemName}</h4>
                              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '0.35rem', lineHeight: 1.45 }}>
                                {report.description}
                              </p>
                            </div>

                            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                              <div>📍 {report.location}</div>
                              <div>📅 {report.date}</div>
                            </div>

                            <div style={{ paddingTop: '0.75rem', borderTop: '1px solid rgba(255, 255, 255, 0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                              {!isReturned && (
                                <button
                                  onClick={() => handleMarkReturned(report)}
                                  style={{
                                    padding: '0.35rem 0.75rem',
                                    borderRadius: '6px',
                                    background: 'linear-gradient(135deg, #10b981, #059669)',
                                    border: 'none',
                                    color: '#fff',
                                    fontSize: '0.75rem',
                                    fontWeight: 700,
                                    cursor: 'pointer'
                                  }}
                                >
                                  ✓ Mark Returned
                                </button>
                              )}

                              <div style={{ display: 'flex', gap: '0.4rem', marginLeft: 'auto' }}>
                                {!isReturned && (
                                  <button
                                    onClick={() => {
                                      setEditModalItem(report);
                                      setEditForm({
                                        itemName: report.itemName,
                                        category: report.category,
                                        description: report.description,
                                        location: report.location,
                                        date: report.date,
                                        photoUrl: report.photoUrl || ''
                                      });
                                    }}
                                    style={{ padding: '0.35rem 0.6rem', borderRadius: '6px', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', color: 'var(--accent-cyan)', cursor: 'pointer' }}
                                  >
                                    <Edit3 size={13} />
                                  </button>
                                )}

                                <button
                                  onClick={() => setDeleteModalItem(report)}
                                  style={{ padding: '0.35rem 0.6rem', borderRadius: '6px', background: 'rgba(244, 63, 94, 0.1)', border: '1px solid rgba(244, 63, 94, 0.3)', color: '#fb7185', cursor: 'pointer' }}
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Sub-View 5: Returned History */}
              {lostFoundSubTab === 'returned-history' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff' }}>Campus Returned Archive</h3>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: 0 }}>
                      Official college record of successfully recovered property and returned belongings.
                    </p>
                  </div>

                  {returnedHistory.length === 0 ? (
                    <div style={{ padding: '4rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                      <History size={48} style={{ margin: '0 auto 1rem auto', opacity: 0.3 }} />
                      <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', fontWeight: 600 }}>No returned history records yet</p>
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
                      {returnedHistory.map(item => (
                        <div
                          key={item.id}
                          className="card"
                          style={{
                            padding: '1.35rem',
                            background: 'rgba(15, 23, 42, 0.6)',
                            border: '1px solid var(--border-subtle)',
                            borderRadius: '16px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.75rem'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '0.15rem 0.55rem', borderRadius: '999px', background: 'rgba(99, 102, 241, 0.15)', color: 'var(--primary-light)' }}>
                              {item.category}
                            </span>
                            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#34d399', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                              <CheckCircle size={14} /> Returned
                            </span>
                          </div>

                          <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#fff' }}>{item.itemName}</h4>
                          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.45, margin: 0 }}>
                            {item.description}
                          </p>

                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', paddingTop: '0.5rem', borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
                            <div>Reported by: <strong style={{ color: '#fff' }}>{item.userName}</strong> ({item.userRole})</div>
                            <div>Location: {item.location} • Returned on: {item.returnedAt ? new Date(item.returnedAt).toLocaleDateString() : 'Completed'}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

            </div>
          )}

          {/* ================================================================ */}
          {/* 4. SMART DOUBT DISCUSSION VIEW */}
          {/* ================================================================ */}
          {activeTab === 'doubts' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              {/* Top Sub-Nav (Doubts vs Announcements vs FAQs) */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={() => setDoubtSubTab('doubts')}
                    style={{
                      padding: '0.6rem 1.25rem',
                      borderRadius: '10px',
                      border: doubtSubTab === 'doubts' ? '1px solid var(--primary)' : '1px solid var(--border-subtle)',
                      background: doubtSubTab === 'doubts' ? 'var(--primary)' : 'var(--bg-input)',
                      color: '#fff',
                      fontWeight: 600,
                      fontSize: '0.88rem',
                      cursor: 'pointer'
                    }}
                  >
                    Doubt Discussions ({doubtsList.length})
                  </button>
                  <button
                    onClick={() => setDoubtSubTab('announcements')}
                    style={{
                      padding: '0.6rem 1.25rem',
                      borderRadius: '10px',
                      border: doubtSubTab === 'announcements' ? '1px solid var(--primary)' : '1px solid var(--border-subtle)',
                      background: doubtSubTab === 'announcements' ? 'var(--primary)' : 'var(--bg-input)',
                      color: '#fff',
                      fontWeight: 600,
                      fontSize: '0.88rem',
                      cursor: 'pointer'
                    }}
                  >
                    Class Announcements ({announcementsList.length})
                  </button>
                  <button
                    onClick={() => setDoubtSubTab('faqs')}
                    style={{
                      padding: '0.6rem 1.25rem',
                      borderRadius: '10px',
                      border: doubtSubTab === 'faqs' ? '1px solid var(--primary)' : '1px solid var(--border-subtle)',
                      background: doubtSubTab === 'faqs' ? 'var(--primary)' : 'var(--bg-input)',
                      color: '#fff',
                      fontWeight: 600,
                      fontSize: '0.88rem',
                      cursor: 'pointer'
                    }}
                  >
                    Pinned FAQs ({faqsList.length})
                  </button>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  {doubtSubTab === 'doubts' && (
                    <button
                      onClick={() => setIsNewPageModalOpen(true)}
                      style={{
                        padding: '0.6rem 1.1rem',
                        borderRadius: '10px',
                        background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)',
                        border: 'none',
                        color: '#fff',
                        fontWeight: 600,
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}
                    >
                      <Plus size={16} />
                      <span>Create Discussion Page</span>
                    </button>
                  )}
                  {doubtSubTab === 'announcements' && (
                    <button
                      onClick={() => setIsAnnouncementModalOpen(true)}
                      style={{
                        padding: '0.6rem 1.1rem',
                        borderRadius: '10px',
                        background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)',
                        border: 'none',
                        color: '#fff',
                        fontWeight: 600,
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}
                    >
                      <Plus size={16} />
                      <span>New Announcement</span>
                    </button>
                  )}
                  {doubtSubTab === 'faqs' && (
                    <button
                      onClick={() => setIsFaqModalOpen(true)}
                      style={{
                        padding: '0.6rem 1.1rem',
                        borderRadius: '10px',
                        background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)',
                        border: 'none',
                        color: '#fff',
                        fontWeight: 600,
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}
                    >
                      <Plus size={16} />
                      <span>Pin New FAQ</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Sub-tab 1: Doubts Discussion */}
              {doubtSubTab === 'doubts' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  
                  {/* Filters Bar */}
                  <div className="card" style={{ padding: '1rem 1.25rem', background: 'rgba(15, 23, 42, 0.75)', border: '1px solid var(--border-subtle)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                    
                    {/* Filter Pills */}
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      {[
                        { id: 'all', label: 'All Doubts' },
                        { id: 'pending_help', label: '🚨 Pending Faculty Help' },
                        { id: 'new', label: 'Unanswered' },
                        { id: 'answered', label: 'Answered' },
                        { id: 'verified', label: 'Verified Answers' }
                      ].map(f => (
                        <button
                          key={f.id}
                          onClick={() => setDoubtFilter(f.id)}
                          style={{
                            padding: '0.4rem 0.85rem',
                            borderRadius: '999px',
                            border: '1px solid var(--border-subtle)',
                            background: doubtFilter === f.id ? 'var(--primary)' : 'var(--bg-input)',
                            color: '#fff',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            cursor: 'pointer'
                          }}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>

                    {/* Page Selector */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Discussion Forum:</span>
                      <select
                        value={selectedPageId}
                        onChange={(e) => setSelectedPageId(e.target.value)}
                        className="form-select"
                        style={{ width: 'auto', padding: '0.4rem 0.85rem', fontSize: '0.8rem' }}
                      >
                        <option value="ALL">All Authorized Forums</option>
                        {doubtPages.map(p => (
                          <option key={p.id} value={p.id}>{p.title} ({p.department} {p.year}-{p.division})</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Doubts Grid / List */}
                  {doubtsList.length === 0 ? (
                    <div style={{ padding: '4rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                      <HelpCircle size={48} style={{ margin: '0 auto 1rem auto', opacity: 0.3 }} />
                      <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', fontWeight: 600 }}>No doubts found matching this filter</p>
                      <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Student doubt discussions will appear here in real-time.</p>
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1.25rem' }}>
                      {doubtsList.map(dbt => (
                        <div
                          key={dbt.id}
                          onClick={() => handleOpenDoubtThread(dbt.id)}
                          className="card"
                          style={{
                            padding: '1.35rem',
                            background: 'rgba(15, 23, 42, 0.75)',
                            border: dbt.isFacultyHelpRequested ? '1px solid rgba(245, 158, 11, 0.5)' : '1px solid var(--border-subtle)',
                            borderRadius: '16px',
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            gap: '1rem',
                            transition: 'all 0.2s ease',
                            position: 'relative'
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
                          onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
                        >
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
                              <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '0.15rem 0.55rem', borderRadius: '6px', background: 'rgba(99, 102, 241, 0.15)', color: 'var(--primary-light)' }}>
                                {dbt.subjectName || 'Academic Subject'}
                              </span>

                              {dbt.isFacultyHelpRequested ? (
                                <span style={{ fontSize: '0.72rem', fontWeight: 800, padding: '0.15rem 0.55rem', borderRadius: '999px', background: 'rgba(245, 158, 11, 0.2)', color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                  <AlertCircle size={12} />
                                  <span>Help Requested</span>
                                </span>
                              ) : dbt.status === 'ANSWERED' ? (
                                <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '0.15rem 0.55rem', borderRadius: '999px', background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                  <CheckCircle size={12} />
                                  <span>Answered</span>
                                </span>
                              ) : (
                                <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                                  Open
                                </span>
                              )}
                            </div>

                            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff', lineHeight: 1.3 }}>
                              {dbt.title}
                            </h3>
                            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '0.4rem', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                              {dbt.description}
                            </p>
                          </div>

                          <div style={{ paddingTop: '0.75rem', borderTop: '1px solid rgba(255, 255, 255, 0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.78rem' }}>
                            <div style={{ color: 'var(--text-muted)' }}>
                              Asked by <strong style={{ color: '#fff' }}>{dbt.isAnonymous ? 'Anonymous Student' : dbt.studentName}</strong>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--primary-light)', fontWeight: 600 }}>
                              <MessageCircle size={14} />
                              <span>{dbt.repliesCount || 0} replies</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Sub-tab 2: Announcements */}
              {doubtSubTab === 'announcements' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {announcementsList.length === 0 ? (
                    <div style={{ padding: '4rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                      <Pin size={48} style={{ margin: '0 auto 1rem auto', opacity: 0.3 }} />
                      <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', fontWeight: 600 }}>No Announcements Published Yet</p>
                      <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Create class announcements for lecture room relocations or assignment notices.</p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {announcementsList.map(anc => (
                        <div
                          key={anc.id}
                          className="card"
                          style={{
                            padding: '1.25rem 1.5rem',
                            background: 'rgba(15, 23, 42, 0.75)',
                            border: '1px solid var(--border-subtle)',
                            borderRadius: '14px',
                            display: 'flex',
                            alignItems: 'flex-start',
                            justifyContent: 'space-between',
                            gap: '1rem'
                          }}
                        >
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.4rem' }}>
                              <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: '6px', background: anc.priority === 'Important' ? 'rgba(244, 63, 94, 0.2)' : 'rgba(99, 102, 241, 0.2)', color: anc.priority === 'Important' ? '#fb7185' : 'var(--primary-light)' }}>
                                {anc.priority}
                              </span>
                              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                Target: {anc.department} ({anc.year}-{anc.division}) • {anc.subjectName || 'All Subjects'}
                              </span>
                            </div>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>{anc.title}</h3>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.35rem', lineHeight: 1.4 }}>
                              {anc.message}
                            </p>
                          </div>
                          <button
                            onClick={() => handleDeleteAnnouncement(anc.id)}
                            style={{
                              background: 'rgba(244, 63, 94, 0.1)',
                              border: '1px solid rgba(244, 63, 94, 0.3)',
                              color: '#fb7185',
                              padding: '0.4rem 0.6rem',
                              borderRadius: '8px',
                              cursor: 'pointer'
                            }}
                            title="Delete Announcement"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Sub-tab 3: FAQs */}
              {doubtSubTab === 'faqs' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {faqsList.length === 0 ? (
                    <div style={{ padding: '4rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                      <HelpCircle size={48} style={{ margin: '0 auto 1rem auto', opacity: 0.3 }} />
                      <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', fontWeight: 600 }}>No FAQs Pinned</p>
                      <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Pin frequently asked questions to guide your students.</p>
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1.25rem' }}>
                      {faqsList.map(faq => (
                        <div
                          key={faq.id}
                          className="card"
                          style={{
                            padding: '1.35rem',
                            background: 'rgba(15, 23, 42, 0.75)',
                            border: '1px solid var(--border-subtle)',
                            borderRadius: '14px',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            gap: '0.6rem'
                          }}
                        >
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary-light)', fontWeight: 700, fontSize: '0.88rem' }}>
                                <Pin size={16} />
                                <span>{faq.question}</span>
                              </div>
                              <button
                                onClick={() => handleDeleteFaq(faq.id)}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  color: 'var(--text-muted)',
                                  cursor: 'pointer',
                                  padding: '2px'
                                }}
                                title="Delete FAQ"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                            <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                              {faq.answer}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ================================================================ */}
          {/* 5. ACADEMIC PERFORMANCE (Faculty Grading Suite) */}
          {/* ================================================================ */}
          {activeTab === 'academic-performance' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              {/* Filter Bar */}
              <div className="card" style={{ padding: '1.25rem 1.5rem', background: 'rgba(15, 23, 42, 0.75)', border: '1px solid var(--border-subtle)', borderRadius: '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', alignItems: 'flex-end' }}>
                  
                  <div className="form-group">
                    <label className="form-label">Department</label>
                    <select value={perfDept} onChange={(e) => setPerfDept(e.target.value)} className="form-select">
                      <option value="Computer Engineering">Computer Engineering</option>
                      <option value="Information Technology">Information Technology</option>
                      <option value="Mechanical Engineering">Mechanical Engineering</option>
                      <option value="Electronics & Telecommunication">Electronics & Telecommunication</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Academic Year</label>
                    <select value={perfYear} onChange={(e) => setPerfYear(e.target.value)} className="form-select">
                      <option value="SE">SE (Second Year)</option>
                      <option value="TE">TE (Third Year)</option>
                      <option value="BE">BE (Final Year)</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Division</label>
                    <select value={perfDiv} onChange={(e) => setPerfDiv(e.target.value)} className="form-select">
                      <option value="A">Division A</option>
                      <option value="B">Division B</option>
                      <option value="C">Division C</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Assigned Subject</label>
                    <select value={perfSubjectId} onChange={(e) => setPerfSubjectId(e.target.value)} className="form-select">
                      <option value="sub_java">Java Programming (CE401)</option>
                      <option value="sub_dbms">Database Management Systems (CE402)</option>
                      <option value="sub_os">Operating Systems (CE501)</option>
                      <option value="sub_cn">Computer Networks (CE502)</option>
                    </select>
                  </div>

                  <button
                    onClick={fetchAcademicPerformance}
                    className="btn btn-primary"
                    style={{ height: '42px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                  >
                    <RefreshCw size={16} />
                    <span>Load Students</span>
                  </button>
                </div>
              </div>

              {/* Privacy Notice Banner */}
              <div style={{ padding: '0.85rem 1.25rem', borderRadius: '12px', background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.25)', display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.82rem', color: '#fff' }}>
                <Shield size={18} color="var(--primary-light)" style={{ flexShrink: 0 }} />
                <div>
                  <strong>Strict 1:1 Privacy Protection:</strong> Once saved & published, marks and performance feedback are strictly scoped. Student A can only view Student A's data; Student B can only view Student B's data.
                </div>
              </div>

              {/* Student Roster & Grading Table */}
              <div className="card" style={{ padding: '1.5rem', background: 'rgba(15, 23, 42, 0.75)', border: '1px solid var(--border-subtle)', borderRadius: '16px', overflowX: 'auto' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                  <div>
                    <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff' }}>
                      Enrolled Student Performance Roster ({perfStudents.length} Students)
                    </h2>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
                      Edit internal test scores, attendance % and personalized feedback below
                    </p>
                  </div>

                  {perfStudents.length > 0 && (
                    <button
                      onClick={handleSaveAndPublishGrades}
                      style={{
                        padding: '0.65rem 1.5rem',
                        borderRadius: '10px',
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        border: 'none',
                        color: '#fff',
                        fontWeight: 700,
                        fontSize: '0.88rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        boxShadow: '0 0 20px rgba(16, 185, 129, 0.4)'
                      }}
                    >
                      <CheckCircle size={17} />
                      <span>SAVE & PUBLISH GRADES</span>
                    </button>
                  )}
                </div>

                {perfStudents.length === 0 ? (
                  <div style={{ padding: '3rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <Users size={40} style={{ margin: '0 auto 0.75rem auto', opacity: 0.3 }} />
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>No active students found in this section.</p>
                  </div>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
                        <th style={{ padding: '0.75rem 0.5rem', width: '60px' }}>Roll</th>
                        <th style={{ padding: '0.75rem 0.5rem', minWidth: '160px' }}>Student Name</th>
                        <th style={{ padding: '0.75rem 0.5rem', width: '120px' }}>Internal Marks</th>
                        <th style={{ padding: '0.75rem 0.5rem', width: '110px' }}>Attendance %</th>
                        <th style={{ padding: '0.75rem 0.5rem', width: '160px' }}>Performance Status</th>
                        <th style={{ padding: '0.75rem 0.5rem', minWidth: '220px' }}>Faculty Feedback</th>
                      </tr>
                    </thead>
                    <tbody>
                      {perfStudents.map((st, idx) => (
                        <tr key={st.studentId} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                          <td style={{ padding: '0.85rem 0.5rem', fontWeight: 700, color: '#fff' }}>
                            {st.rollNumber || (idx + 1)}
                          </td>
                          <td style={{ padding: '0.85rem 0.5rem' }}>
                            <div style={{ fontWeight: 600, color: '#fff' }}>{st.name}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{st.email}</div>
                          </td>
                          <td style={{ padding: '0.85rem 0.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                              <input
                                type="number"
                                min="0"
                                max="20"
                                value={st.internalMarks}
                                onChange={(e) => handlePerfStudentChange(idx, 'internalMarks', e.target.value)}
                                className="form-input"
                                style={{ width: '65px', padding: '0.4rem 0.5rem', textAlign: 'center', fontWeight: 700 }}
                              />
                              <span style={{ color: 'var(--text-muted)' }}>/20</span>
                            </div>
                          </td>
                          <td style={{ padding: '0.85rem 0.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                              <input
                                type="number"
                                min="0"
                                max="100"
                                value={st.attendancePercentage}
                                onChange={(e) => handlePerfStudentChange(idx, 'attendancePercentage', e.target.value)}
                                className="form-input"
                                style={{ width: '65px', padding: '0.4rem 0.5rem', textAlign: 'center' }}
                              />
                              <span style={{ color: 'var(--text-muted)' }}>%</span>
                            </div>
                          </td>
                          <td style={{ padding: '0.85rem 0.5rem' }}>
                            <select
                              value={st.performanceStatus}
                              onChange={(e) => handlePerfStudentChange(idx, 'performanceStatus', e.target.value)}
                              className="form-select"
                              style={{ padding: '0.4rem 0.6rem', fontSize: '0.82rem' }}
                            >
                              <option value="Excellent">Excellent</option>
                              <option value="Good">Good</option>
                              <option value="Average">Average</option>
                              <option value="Needs Improvement">Needs Improvement</option>
                            </select>
                          </td>
                          <td style={{ padding: '0.85rem 0.5rem' }}>
                            <input
                              type="text"
                              placeholder="Add specific advice or remarks..."
                              value={st.feedback || ''}
                              onChange={(e) => handlePerfStudentChange(idx, 'feedback', e.target.value)}
                              className="form-input"
                              style={{ padding: '0.4rem 0.6rem', fontSize: '0.82rem' }}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* ================================================================ */}
          {/* 6. CLASSROOM AVAILABILITY VIEW */}
          {/* ================================================================ */}
          {activeTab === 'classroom-availability' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              {/* Search & Time Filter Controls */}
              <div className="card" style={{ padding: '1.5rem', background: 'rgba(15, 23, 42, 0.75)', border: '1px solid var(--border-subtle)', borderRadius: '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', alignItems: 'flex-end' }}>
                  
                  <div className="form-group">
                    <label className="form-label">Date</label>
                    <input
                      type="date"
                      value={availDate}
                      onChange={(e) => setAvailDate(e.target.value)}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Start Time</label>
                    <input
                      type="time"
                      value={availStartTime}
                      onChange={(e) => setAvailStartTime(e.target.value)}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">End Time</label>
                    <input
                      type="time"
                      value={availEndTime}
                      onChange={(e) => setAvailEndTime(e.target.value)}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Filter Room / Building</label>
                    <input
                      type="text"
                      placeholder="e.g. Room 301, Lab 201..."
                      value={roomSearch}
                      onChange={(e) => setRoomSearch(e.target.value)}
                      className="form-input"
                    />
                  </div>

                  <button
                    onClick={checkClassroomAvailability}
                    className="btn btn-primary"
                    style={{ height: '42px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                  >
                    <Search size={16} />
                    <span>Check Availability</span>
                  </button>
                </div>
              </div>

              {/* Status Summary Pills */}
              {availResults?.summary && (
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  <div style={{ padding: '0.75rem 1.25rem', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#34d399', fontWeight: 700, fontSize: '0.88rem' }}>
                    🟢 Available Rooms: {availResults.summary.available}
                  </div>
                  <div style={{ padding: '0.75rem 1.25rem', borderRadius: '12px', background: 'rgba(244, 63, 94, 0.15)', border: '1px solid rgba(244, 63, 94, 0.3)', color: '#fb7185', fontWeight: 700, fontSize: '0.88rem' }}>
                    🔴 Occupied Rooms: {availResults.summary.occupied}
                  </div>
                  <div style={{ padding: '0.75rem 1.25rem', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.88rem' }}>
                    Total Evaluated: {availResults.summary.total}
                  </div>
                </div>
              )}

              {/* Rooms Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' }}>
                {availResults?.rooms?.map(room => (
                  <div
                    key={room.id}
                    className="card"
                    style={{
                      padding: '1.35rem',
                      background: 'rgba(15, 23, 42, 0.75)',
                      border: room.status === 'OCCUPIED' ? '1px solid rgba(244, 63, 94, 0.3)' : '1px solid rgba(16, 185, 129, 0.3)',
                      borderRadius: '16px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: '999px', background: room.status === 'OCCUPIED' ? 'rgba(244, 63, 94, 0.15)' : 'rgba(16, 185, 129, 0.15)', color: room.status === 'OCCUPIED' ? '#fb7185' : '#34d399' }}>
                        {room.status === 'OCCUPIED' ? '🔴 OCCUPIED' : '🟢 AVAILABLE'}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Capacity: {room.capacity}
                      </span>
                    </div>

                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff' }}>{room.roomNumber}</h3>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      {room.building} • {room.floor} ({room.classroomType})
                    </div>

                    {room.occupiedDetails ? (
                      <div style={{ marginTop: '0.75rem', padding: '0.65rem 0.85rem', borderRadius: '10px', background: 'rgba(0, 0, 0, 0.25)', borderLeft: '3px solid #f43f5e', fontSize: '0.78rem' }}>
                        <div><span style={{ color: 'var(--text-muted)' }}>Subject:</span> <strong style={{ color: '#fff' }}>{room.occupiedDetails.subject}</strong></div>
                        <div><span style={{ color: 'var(--text-muted)' }}>Faculty:</span> <strong style={{ color: '#fff' }}>{room.occupiedDetails.faculty}</strong></div>
                        <div><span style={{ color: 'var(--text-muted)' }}>Class:</span> <strong style={{ color: '#fff' }}>{room.occupiedDetails.class}</strong></div>
                      </div>
                    ) : (
                      <div style={{ marginTop: '0.75rem', padding: '0.65rem 0.85rem', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.05)', fontSize: '0.78rem', color: '#34d399' }}>
                        ✓ Free for scheduling & personal tutorials during {availResults?.selectedTime}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ================================================================ */}
          {/* 7. PERSONAL SCHEDULE VIEW (Strictly Private) */}
          {/* ================================================================ */}
          {activeTab === 'personal-schedule' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              {/* Top Banner & Add Button */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff' }}>
                    Confidential Faculty Task Planner
                  </h2>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: 0 }}>
                    🔒 Strictly Private — Only visible to your authenticated account
                  </p>
                </div>

                <button
                  onClick={() => setIsTaskModalOpen(true)}
                  style={{
                    padding: '0.65rem 1.25rem',
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, #a855f7 0%, #6366f1 100%)',
                    border: 'none',
                    color: '#fff',
                    fontWeight: 600,
                    fontSize: '0.88rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    boxShadow: '0 0 20px rgba(168, 85, 247, 0.3)'
                  }}
                >
                  <Plus size={16} />
                  <span>Add Personal Task</span>
                </button>
              </div>

              {/* Tasks List */}
              {personalTasks.length === 0 ? (
                <div style={{ padding: '4rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <CheckSquare size={48} style={{ margin: '0 auto 1rem auto', opacity: 0.3 }} />
                  <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Your Personal Planner is Empty</p>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Add reminders for syllabus deadlines, department meetings, and grading targets.</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
                  {personalTasks.map(task => (
                    <div
                      key={task.id}
                      className="card"
                      style={{
                        padding: '1.35rem',
                        background: 'rgba(15, 23, 42, 0.75)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '16px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: '0.85rem',
                        opacity: task.isCompleted ? 0.65 : 1
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                          <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '0.15rem 0.55rem', borderRadius: '6px', background: 'rgba(168, 85, 247, 0.15)', color: '#c084fc' }}>
                            {task.category || 'Task'}
                          </span>
                          <span
                            style={{
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              padding: '0.15rem 0.55rem',
                              borderRadius: '6px',
                              background: task.priority === 'High' ? 'rgba(244, 63, 94, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                              color: task.priority === 'High' ? '#fb7185' : 'var(--text-secondary)'
                            }}
                          >
                            {task.priority || 'Medium'} Priority
                          </span>
                        </div>

                        <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff', textDecoration: task.isCompleted ? 'line-through' : 'none' }}>
                          {task.title}
                        </h3>
                        {task.note && (
                          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '0.35rem', lineHeight: 1.4 }}>
                            {task.note}
                          </p>
                        )}
                      </div>

                      <div style={{ paddingTop: '0.75rem', borderTop: '1px solid rgba(255, 255, 255, 0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <Clock size={13} />
                          <span>{task.taskDate} {task.taskTime ? `at ${task.taskTime}` : ''}</span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <button
                            onClick={() => handleToggleTaskComplete(task.id, task.isCompleted)}
                            style={{
                              background: task.isCompleted ? 'rgba(16, 185, 129, 0.2)' : 'var(--bg-input)',
                              border: '1px solid var(--border-subtle)',
                              color: task.isCompleted ? '#34d399' : '#fff',
                              padding: '0.35rem 0.65rem',
                              borderRadius: '6px',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              cursor: 'pointer'
                            }}
                          >
                            {task.isCompleted ? '✓ Done' : 'Complete'}
                          </button>
                          <button
                            onClick={() => handleDeleteTask(task.id)}
                            style={{
                              background: 'rgba(244, 63, 94, 0.1)',
                              border: '1px solid rgba(244, 63, 94, 0.2)',
                              color: '#fb7185',
                              padding: '0.35rem 0.5rem',
                              borderRadius: '6px',
                              cursor: 'pointer'
                            }}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ================================================================ */}
          {/* 8. NOTIFICATIONS CENTER VIEW */}
          {/* ================================================================ */}
          {activeTab === 'notifications' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '900px', margin: '0 auto' }}>
              
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff' }}>Notification Feed</h2>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: 0 }}>
                    Real-time alerts, doubt requests, and campus notices
                  </p>
                </div>
                {notifications.some(n => !n.isRead) && (
                  <button
                    onClick={handleMarkAllNotifsRead}
                    style={{
                      padding: '0.5rem 1rem',
                      borderRadius: '8px',
                      background: 'var(--bg-input)',
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--primary-light)',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Mark all as read
                  </button>
                )}
              </div>

              {notifications.length === 0 ? (
                <div style={{ padding: '4rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <Bell size={48} style={{ margin: '0 auto 1rem auto', opacity: 0.3 }} />
                  <p style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>No notifications at this time.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {notifications.map(n => (
                    <div
                      key={n.id}
                      className="card"
                      style={{
                        padding: '1.25rem',
                        borderRadius: '14px',
                        background: n.isRead ? 'rgba(15, 23, 42, 0.6)' : 'rgba(99, 102, 241, 0.08)',
                        border: n.isRead ? '1px solid var(--border-subtle)' : '1px solid rgba(99, 102, 241, 0.3)',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '1rem'
                      }}
                    >
                      <div
                        style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '10px',
                          background: n.type === 'HELP_REQUEST' ? 'rgba(245, 158, 11, 0.15)' : (n.type === 'CLUB_REG' ? 'rgba(6, 182, 212, 0.15)' : 'rgba(99, 102, 241, 0.15)'),
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: n.type === 'HELP_REQUEST' ? '#fbbf24' : (n.type === 'CLUB_REG' ? 'var(--accent-cyan)' : 'var(--primary-light)'),
                          flexShrink: 0
                        }}
                      >
                        {n.type === 'HELP_REQUEST' ? <AlertCircle size={20} /> : (n.type === 'CLUB_REG' ? <Users size={20} /> : <Bell size={20} />)}
                      </div>

                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <h3 style={{ fontSize: '0.98rem', fontWeight: 700, color: '#fff' }}>{n.title}</h3>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                            {n.createdAt ? new Date(n.createdAt).toLocaleDateString() : 'Recent'}
                          </span>
                        </div>
                        <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginTop: '0.3rem', lineHeight: 1.4 }}>
                          {n.message}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ================================================================ */}
          {/* 9. FACULTY PROFILE VIEW */}
          {/* ================================================================ */}
          {activeTab === 'profile' && (
            <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              <div className="card" style={{ padding: '2rem', background: 'rgba(15, 23, 42, 0.85)', border: '1px solid var(--border-subtle)', borderRadius: '20px' }}>
                
                {/* Avatar & Name */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '2rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--border-subtle)' }}>
                  <div
                    style={{
                      width: '72px',
                      height: '72px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: '1.8rem',
                      color: '#fff',
                      boxShadow: '0 0 25px rgba(99, 102, 241, 0.4)'
                    }}
                  >
                    {user?.name ? user.name.charAt(0).toUpperCase() : 'F'}
                  </div>
                  <div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff' }}>{user?.name || "Sharma Ma'am"}</h2>
                    <div style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginTop: '2px' }}>{user?.email || 'sharma@college.edu'}</div>
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: '999px', background: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}>
                        Active Faculty
                      </span>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: '999px', background: 'rgba(99, 102, 241, 0.15)', color: 'var(--primary-light)' }}>
                        Verified ID: {user?.id || 'usr_fac_001'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Profile Fields */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  
                  <div>
                    <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Department Affiliation
                    </label>
                    <div style={{ marginTop: '0.35rem', padding: '0.85rem 1rem', borderRadius: '10px', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', color: '#fff', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span>{user?.department || 'Computer Engineering'}</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        <Lock size={12} />
                        <span>Admin Governed</span>
                      </span>
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Assigned Academic Subjects
                    </label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.4rem' }}>
                      {(statsData?.profile?.assignedSubjects || ['Java Programming', 'Database Management Systems']).map(sub => (
                        <span
                          key={sub}
                          style={{
                            padding: '0.45rem 0.85rem',
                            borderRadius: '8px',
                            background: 'rgba(99, 102, 241, 0.12)',
                            border: '1px solid rgba(99, 102, 241, 0.25)',
                            color: 'var(--primary-light)',
                            fontWeight: 600,
                            fontSize: '0.84rem'
                          }}
                        >
                          {sub}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Assigned Classes / Cohorts
                    </label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.4rem' }}>
                      {(statsData?.profile?.assignedClasses || ['SE-B', 'TE-A']).map(cls => (
                        <span
                          key={cls}
                          style={{
                            padding: '0.45rem 0.85rem',
                            borderRadius: '8px',
                            background: 'rgba(6, 182, 212, 0.12)',
                            border: '1px solid rgba(6, 182, 212, 0.25)',
                            color: 'var(--accent-cyan)',
                            fontWeight: 600,
                            fontSize: '0.84rem'
                          }}
                        >
                          {cls}
                        </span>
                      ))}
                    </div>
                  </div>

                </div>

                {/* Central Admin Security Card */}
                <div style={{ marginTop: '2rem', padding: '1rem', borderRadius: '12px', background: 'rgba(0, 0, 0, 0.25)', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  <Shield size={20} color="var(--primary-light)" style={{ flexShrink: 0 }} />
                  <div>
                    Role, Department, and Assigned Classes are centrally mapped by Institutional Administration. Contact Central Admin for official course allocations.
                  </div>
                </div>

              </div>
            </div>
          )}

        </main>
      </div>

      {/* ==================================================================== */}
      {/* MODALS */}
      {/* ==================================================================== */}

      {/* 1. Add Personal Task Modal */}
      {isTaskModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>🔒 Add Private Task / Reminder</h3>
              <button onClick={() => setIsTaskModalOpen(false)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateTask}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Task Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Submit Internal Marks for SE-B"
                    value={taskForm.title}
                    onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                    className="form-input"
                  />
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Date *</label>
                    <input
                      type="date"
                      required
                      value={taskForm.taskDate}
                      onChange={(e) => setTaskForm({ ...taskForm, taskDate: e.target.value })}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Time</label>
                    <input
                      type="time"
                      value={taskForm.taskTime}
                      onChange={(e) => setTaskForm({ ...taskForm, taskTime: e.target.value })}
                      className="form-input"
                    />
                  </div>
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Category</label>
                    <select
                      value={taskForm.category}
                      onChange={(e) => setTaskForm({ ...taskForm, category: e.target.value })}
                      className="form-select"
                    >
                      <option value="Task">Task</option>
                      <option value="Grading">Grading</option>
                      <option value="Meeting">Meeting</option>
                      <option value="Preparation">Preparation</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Priority</label>
                    <select
                      value={taskForm.priority}
                      onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}
                      className="form-select"
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Note / Details (Optional)</label>
                  <textarea
                    rows="3"
                    placeholder="Confidential notes only visible to you..."
                    value={taskForm.note}
                    onChange={(e) => setTaskForm({ ...taskForm, note: e.target.value })}
                    className="form-textarea"
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setIsTaskModalOpen(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Private Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Create Club Modal */}
      {isClubModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Create Student Club</h3>
              <button onClick={() => setIsClubModalOpen(false)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateClub}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Club Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Competitive Coding Guild"
                    value={clubForm.name}
                    onChange={(e) => setClubForm({ ...clubForm, name: e.target.value })}
                    className="form-input"
                  />
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Category *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Technical, AI, Robotics"
                      value={clubForm.category}
                      onChange={(e) => setClubForm({ ...clubForm, category: e.target.value })}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Max Limited Seats *</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={clubForm.maxSeats}
                      onChange={(e) => setClubForm({ ...clubForm, maxSeats: e.target.value })}
                      className="form-input"
                    />
                  </div>
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Registration Start Date</label>
                    <input
                      type="date"
                      value={clubForm.registrationStartDate}
                      onChange={(e) => setClubForm({ ...clubForm, registrationStartDate: e.target.value })}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Registration End Date</label>
                    <input
                      type="date"
                      value={clubForm.registrationEndDate}
                      onChange={(e) => setClubForm({ ...clubForm, registrationEndDate: e.target.value })}
                      className="form-input"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Club Description</label>
                  <textarea
                    rows="3"
                    placeholder="Describe club activities and workshops..."
                    value={clubForm.description}
                    onChange={(e) => setClubForm({ ...clubForm, description: e.target.value })}
                    className="form-textarea"
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setIsClubModalOpen(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Launch Club
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Create Event Modal */}
      {isEventModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Schedule Campus Event</h3>
              <button onClick={() => setIsEventModalOpen(false)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateEvent}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Event Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Annual Hackathon 2026"
                    value={eventForm.title}
                    onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                    className="form-input"
                  />
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Event Date *</label>
                    <input
                      type="date"
                      required
                      value={eventForm.eventDate}
                      onChange={(e) => setEventForm({ ...eventForm, eventDate: e.target.value })}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Time</label>
                    <input
                      type="text"
                      placeholder="e.g. 10:00 AM"
                      value={eventForm.eventTime}
                      onChange={(e) => setEventForm({ ...eventForm, eventTime: e.target.value })}
                      className="form-input"
                    />
                  </div>
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Venue *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Seminar Hall 101"
                      value={eventForm.venue}
                      onChange={(e) => setEventForm({ ...eventForm, venue: e.target.value })}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Registration Last Date</label>
                    <input
                      type="date"
                      value={eventForm.registrationLastDate}
                      onChange={(e) => setEventForm({ ...eventForm, registrationLastDate: e.target.value })}
                      className="form-input"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea
                    rows="3"
                    placeholder="Event objectives and schedule details..."
                    value={eventForm.description}
                    onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                    className="form-textarea"
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setIsEventModalOpen(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Schedule Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Joined Members / Attendees Modal */}
      {membersModalData && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '650px' }}>
            <div className="modal-header">
              <h3>{membersModalData.title}</h3>
              <button onClick={() => setMembersModalData(null)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
              {membersModalData.list.length === 0 ? (
                <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No students registered yet.
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
                      <th style={{ padding: '0.5rem' }}>Roll</th>
                      <th style={{ padding: '0.5rem' }}>Student Name</th>
                      <th style={{ padding: '0.5rem' }}>Cohort</th>
                      <th style={{ padding: '0.5rem' }}>Registered At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {membersModalData.list.map((m, idx) => (
                      <tr key={m.id || idx} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                        <td style={{ padding: '0.65rem 0.5rem', fontWeight: 700, color: '#fff' }}>{m.rollNumber || (idx + 1)}</td>
                        <td style={{ padding: '0.65rem 0.5rem' }}>
                          <div style={{ fontWeight: 600, color: '#fff' }}>{m.studentName}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{m.studentEmail}</div>
                        </td>
                        <td style={{ padding: '0.65rem 0.5rem', color: 'var(--text-secondary)' }}>{m.year}-{m.division}</td>
                        <td style={{ padding: '0.65rem 0.5rem', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                          {m.registeredAt ? new Date(m.registeredAt).toLocaleDateString() : 'Active'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <div className="modal-footer">
              <button onClick={() => setMembersModalData(null)} className="btn btn-secondary">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Doubt Thread Structured Post & Reply Modal */}
      {activeDoubtThread && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '750px', maxHeight: '85vh' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <h3 style={{ fontSize: '1.15rem' }}>Doubt Discussion Thread</h3>
                {activeDoubtThread.doubt.isFacultyHelpRequested ? (
                  <span style={{ fontSize: '0.72rem', fontWeight: 800, padding: '0.15rem 0.55rem', borderRadius: '999px', background: '#f59e0b', color: '#000' }}>
                    🚨 HELP REQUESTED
                  </span>
                ) : null}
              </div>
              <button onClick={() => setActiveDoubtThread(null)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <div className="modal-body" style={{ maxHeight: '60vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              {/* Question Box */}
              <div style={{ padding: '1.25rem', borderRadius: '14px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                  Posted by <strong style={{ color: '#fff' }}>{activeDoubtThread.doubt.isAnonymous ? 'Anonymous Student' : activeDoubtThread.doubt.studentName}</strong> • {activeDoubtThread.doubt.department} ({activeDoubtThread.doubt.year}-{activeDoubtThread.doubt.division})
                </div>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff', lineHeight: 1.3 }}>
                  {activeDoubtThread.doubt.title}
                </h2>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '0.5rem', lineHeight: 1.5 }}>
                  {activeDoubtThread.doubt.description}
                </p>
                {activeDoubtThread.doubt.imageUrl && (
                  <img
                    src={activeDoubtThread.doubt.imageUrl}
                    alt="Doubt Attachment"
                    style={{ marginTop: '0.75rem', maxHeight: '200px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}
                  />
                )}
              </div>

              {/* Replies Thread */}
              <div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff', marginBottom: '0.75rem' }}>
                  Replies & Solutions ({activeDoubtThread.replies.length})
                </h4>

                {activeDoubtThread.replies.length === 0 ? (
                  <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    No answers yet. Post a faculty solution below.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {activeDoubtThread.replies.map(reply => (
                      <div
                        key={reply.id}
                        style={{
                          padding: '1rem',
                          borderRadius: '12px',
                          background: reply.isVerified ? 'rgba(16, 185, 129, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                          border: reply.isVerified ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid var(--border-subtle)'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <strong style={{ color: '#fff', fontSize: '0.88rem' }}>{reply.authorName}</strong>
                            <span style={{ fontSize: '0.72rem', color: 'var(--primary-light)', padding: '0.1rem 0.45rem', borderRadius: '4px', background: 'rgba(99, 102, 241, 0.15)' }}>
                              {reply.authorRole}
                            </span>
                          </div>

                          {reply.isVerified ? (
                            <span style={{ fontSize: '0.72rem', fontWeight: 800, padding: '0.2rem 0.6rem', borderRadius: '999px', background: '#10b981', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                              <CheckCircle size={12} />
                              <span>VERIFIED ANSWER</span>
                            </span>
                          ) : (
                            <button
                              onClick={() => handleVerifyReply(activeDoubtThread.doubt.id, reply.id)}
                              style={{
                                background: 'none',
                                border: '1px solid rgba(16, 185, 129, 0.4)',
                                color: '#34d399',
                                padding: '0.2rem 0.6rem',
                                borderRadius: '6px',
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                cursor: 'pointer'
                              }}
                            >
                              ✓ Mark as Verified
                            </button>
                          )}
                        </div>

                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                          {reply.replyText}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Reply Form */}
              <form onSubmit={handleSendReply} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)' }}>
                <label className="form-label" style={{ fontWeight: 700, color: '#fff' }}>Post Faculty Solution</label>
                <textarea
                  rows="3"
                  required
                  placeholder="Type official explanation or academic solution..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  className="form-textarea"
                />

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', color: '#34d399', cursor: 'pointer', fontWeight: 600 }}>
                    <input
                      type="checkbox"
                      checked={markReplyVerified}
                      onChange={(e) => setMarkReplyVerified(e.target.checked)}
                      style={{ width: '16px', height: '16px', accentColor: '#10b981' }}
                    />
                    <span>Mark this reply as Official VERIFIED ANSWER</span>
                  </label>

                  <button
                    type="submit"
                    style={{
                      padding: '0.6rem 1.25rem',
                      borderRadius: '8px',
                      background: 'var(--primary)',
                      border: 'none',
                      color: '#fff',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    <Send size={15} />
                    <span>Post Solution</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* 6. Create Discussion Page Modal */}
      {isNewPageModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Create Class + Subject Discussion Forum</h3>
              <button onClick={() => setIsNewPageModalOpen(false)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateDoubtPage}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Forum Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. SE-B Java Programming Discussion Forum"
                    value={pageForm.title}
                    onChange={(e) => setPageForm({ ...pageForm, title: e.target.value })}
                    className="form-input"
                  />
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Department</label>
                    <select
                      value={pageForm.department}
                      onChange={(e) => setPageForm({ ...pageForm, department: e.target.value })}
                      className="form-select"
                    >
                      <option value="Computer Engineering">Computer Engineering</option>
                      <option value="Information Technology">Information Technology</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Class (Year & Div)</label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <select
                        value={pageForm.year}
                        onChange={(e) => setPageForm({ ...pageForm, year: e.target.value })}
                        className="form-select"
                      >
                        <option value="SE">SE</option>
                        <option value="TE">TE</option>
                        <option value="BE">BE</option>
                      </select>
                      <select
                        value={pageForm.division}
                        onChange={(e) => setPageForm({ ...pageForm, division: e.target.value })}
                        className="form-select"
                      >
                        <option value="A">A</option>
                        <option value="B">B</option>
                        <option value="C">C</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Subject</label>
                  <select
                    value={pageForm.subjectId}
                    onChange={(e) => setPageForm({ ...pageForm, subjectId: e.target.value })}
                    className="form-select"
                  >
                    <option value="sub_java">Java Programming</option>
                    <option value="sub_dbms">Database Management Systems</option>
                    <option value="sub_os">Operating Systems</option>
                    <option value="sub_cn">Computer Networks</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Authorized Student Emails (Comma Separated)</label>
                  <textarea
                    rows="2"
                    placeholder="student@college.edu, student.alex@college.edu"
                    value={pageForm.authorizedEmails}
                    onChange={(e) => setPageForm({ ...pageForm, authorizedEmails: e.target.value })}
                    className="form-textarea"
                  />
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    All students enrolled in the selected class are authorized by default. Add specific external emails here.
                  </span>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setIsNewPageModalOpen(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create Forum
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. Create Announcement Modal */}
      {isAnnouncementModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Broadcast Class Announcement</h3>
              <button onClick={() => setIsAnnouncementModalOpen(false)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateAnnouncement}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Announcement Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Tomorrow's lecture conducted in Room 305"
                    value={announcementForm.title}
                    onChange={(e) => setAnnouncementForm({ ...announcementForm, title: e.target.value })}
                    className="form-input"
                  />
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Target Class (Year & Div)</label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <select
                        value={announcementForm.year}
                        onChange={(e) => setAnnouncementForm({ ...announcementForm, year: e.target.value })}
                        className="form-select"
                      >
                        <option value="SE">SE</option>
                        <option value="TE">TE</option>
                        <option value="BE">BE</option>
                      </select>
                      <select
                        value={announcementForm.division}
                        onChange={(e) => setAnnouncementForm({ ...announcementForm, division: e.target.value })}
                        className="form-select"
                      >
                        <option value="A">A</option>
                        <option value="B">B</option>
                        <option value="C">C</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Priority</label>
                    <select
                      value={announcementForm.priority}
                      onChange={(e) => setAnnouncementForm({ ...announcementForm, priority: e.target.value })}
                      className="form-select"
                    >
                      <option value="Normal">Normal</option>
                      <option value="Important">Important</option>
                      <option value="Urgent">Urgent</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Message / Details *</label>
                  <textarea
                    rows="4"
                    required
                    placeholder="Type official notice details..."
                    value={announcementForm.message}
                    onChange={(e) => setAnnouncementForm({ ...announcementForm, message: e.target.value })}
                    className="form-textarea"
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setIsAnnouncementModalOpen(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Publish Notice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 8. Create FAQ Modal */}
      {isFaqModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Pin FAQ for Students</h3>
              <button onClick={() => setIsFaqModalOpen(false)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateFaq}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Question *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. How do we submit the Java assignment?"
                    value={faqForm.question}
                    onChange={(e) => setFaqForm({ ...faqForm, question: e.target.value })}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Answer / Guidance *</label>
                  <textarea
                    rows="3"
                    required
                    placeholder="e.g. Submit through the college assignment portal before Friday."
                    value={faqForm.answer}
                    onChange={(e) => setFaqForm({ ...faqForm, answer: e.target.value })}
                    className="form-textarea"
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setIsFaqModalOpen(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Pin FAQ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 9. Contact Finder / Reporter Modal (Safe Official Email Popup) */}
      {contactModalItem && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem'
          }}
        >
          <div
            className="card"
            style={{
              width: '100%',
              maxWidth: '460px',
              padding: '1.75rem',
              background: '#0d1527',
              border: '1px solid var(--border-subtle)',
              borderRadius: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem',
              boxShadow: '0 0 40px rgba(0, 0, 0, 0.5)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(6, 182, 212, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-cyan)' }}>
                  <Mail size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff' }}>Official Campus Contact</h3>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>Privacy Protected • Official College Email</p>
                </div>
              </div>
              <button onClick={() => setContactModalItem(null)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '1rem', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Item: <strong style={{ color: '#fff' }}>{contactModalItem.itemName}</strong> ({contactModalItem.type})
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Reported by: <strong style={{ color: 'var(--accent-cyan)' }}>{contactModalItem.userName}</strong> ({contactModalItem.userRole})
              </div>
              <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#fff', marginTop: '0.35rem', wordBreak: 'break-all' }}>
                ✉️ {contactModalItem.userEmail}
              </div>
            </div>

            <div style={{ padding: '0.75rem', borderRadius: '8px', background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.25)', fontSize: '0.75rem', color: 'var(--primary-light)', lineHeight: 1.4 }}>
              🛡️ To protect student and faculty privacy, personal phone numbers and private addresses are kept confidential. Please communicate strictly through official collegiate mail.
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={() => setContactModalItem(null)}
                style={{ flex: 1, padding: '0.65rem', borderRadius: '8px', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', color: '#fff', cursor: 'pointer' }}
              >
                Close
              </button>
              <a
                href={`mailto:${contactModalItem.userEmail}?subject=Regarding Campus Lost and Found: ${encodeURIComponent(contactModalItem.itemName)}`}
                style={{
                  flex: 1,
                  padding: '0.65rem',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  textAlign: 'center',
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem'
                }}
              >
                <Mail size={15} /> Send Email
              </a>
            </div>
          </div>
        </div>
      )}

      {/* 10. Edit Report Modal */}
      {editModalItem && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem'
          }}
        >
          <div
            className="card"
            style={{
              width: '100%',
              maxWidth: '520px',
              padding: '1.75rem',
              background: '#0d1527',
              border: '1px solid var(--border-subtle)',
              borderRadius: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff' }}>
                Edit {editModalItem.type === 'LOST' ? 'Lost' : 'Found'} Report
              </h3>
              <button onClick={() => setEditModalItem(null)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleUpdateReport} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>Item Title *</label>
                <input
                  type="text"
                  required
                  value={editForm.itemName}
                  onChange={(e) => setEditForm({ ...editForm, itemName: e.target.value })}
                  style={{ width: '100%', padding: '0.55rem 0.85rem', borderRadius: '8px', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', color: '#fff', fontSize: '0.85rem' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>Category *</label>
                  <select
                    value={editForm.category}
                    onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                    style={{ width: '100%', padding: '0.55rem 0.85rem', borderRadius: '8px', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', color: '#fff', fontSize: '0.85rem' }}
                  >
                    {LF_CATEGORIES.filter(c => c !== 'All Categories').map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>Date *</label>
                  <input
                    type="date"
                    required
                    value={editForm.date}
                    onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                    style={{ width: '100%', padding: '0.55rem 0.85rem', borderRadius: '8px', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', color: '#fff', fontSize: '0.85rem' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>Location *</label>
                <input
                  type="text"
                  required
                  value={editForm.location}
                  onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                  style={{ width: '100%', padding: '0.55rem 0.85rem', borderRadius: '8px', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', color: '#fff', fontSize: '0.85rem' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>Description *</label>
                <textarea
                  required
                  rows={3}
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  style={{ width: '100%', padding: '0.55rem 0.85rem', borderRadius: '8px', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', color: '#fff', fontSize: '0.85rem' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setEditModalItem(null)}
                  style={{ flex: 1, padding: '0.65rem', borderRadius: '8px', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', color: '#fff', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ flex: 1, padding: '0.65rem', borderRadius: '8px', background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none', color: '#fff', fontWeight: 700, cursor: 'pointer' }}
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 11. Delete Confirmation Modal */}
      {deleteModalItem && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem'
          }}
        >
          <div
            className="card"
            style={{
              width: '100%',
              maxWidth: '420px',
              padding: '1.75rem',
              background: '#0d1527',
              border: '1px solid rgba(244, 63, 94, 0.3)',
              borderRadius: '18px',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              textAlign: 'center'
            }}
          >
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(244, 63, 94, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fb7185', margin: '0 auto' }}>
              <Trash2 size={24} />
            </div>

            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff' }}>
              Delete Report?
            </h3>

            <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', margin: 0 }}>
              Are you sure you want to delete your report for <strong>"{deleteModalItem.itemName}"</strong>? This action cannot be undone.
            </p>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.75rem' }}>
              <button
                type="button"
                onClick={() => setDeleteModalItem(null)}
                style={{ flex: 1, padding: '0.65rem', borderRadius: '8px', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', color: '#fff', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteReport}
                style={{ flex: 1, padding: '0.65rem', borderRadius: '8px', background: '#f43f5e', border: 'none', color: '#fff', fontWeight: 700, cursor: 'pointer' }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
