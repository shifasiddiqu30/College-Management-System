import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  GraduationCap,
  Calendar,
  Sparkles,
  Users,
  MessageSquare,
  Award,
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
  Shield,
  ChevronRight,
  Package,
  CheckSquare,
  Lock,
  Flame,
  Hourglass,
  Tag,
  ExternalLink,
  MessageCircle,
  Edit2,
  Trash2,
  ArrowRight,
  Filter,
  Check,
  MapPin,
  HelpCircle,
  History,
  Mail,
  Pin,
  Send,
  ArrowLeft,
  X,
  FileText
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import StudentSidebar from '../../components/student/StudentSidebar';
import StudentHeader from '../../components/student/StudentHeader';
import DepartmentFolderTabs from '../../components/common/DepartmentFolderTabs';

const LF_CATEGORIES = [
  'All Categories',
  'Electronics',
  'Books',
  'Documents',
  'ID Card',
  'Wallet',
  'Keys',
  'Bags',
  'Clothing',
  'Accessories',
  'Other'
];

export default function StudentDashboard() {
  const { user, logout, authFetch, showToast } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Extract active tab from URL path (e.g. /student/timetable -> 'timetable')
  const pathSegment = location.pathname.replace('/student/', '').replace('/student', '') || 'dashboard';
  const [activeTab, setActiveTabState] = useState(pathSegment || 'dashboard');
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const setActiveTab = (tab) => {
    setActiveTabState(tab);
    navigate(`/student/${tab}`);
  };

  useEffect(() => {
    const currentSegment = location.pathname.replace('/student/', '').replace('/student', '') || 'dashboard';
    if (currentSegment && currentSegment !== activeTab) {
      setActiveTabState(currentSegment);
    }
  }, [location.pathname]);

  // Core Data States
  const [statsData, setStatsData] = useState(null);
  const [timetableData, setTimetableData] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadNotifsCount, setUnreadNotifsCount] = useState(0);

  // Timetable Tab State
  const [selectedDay, setSelectedDay] = useState(
    new Date().toLocaleDateString('en-US', { weekday: 'long' }) === 'Sunday'
      ? 'Monday'
      : new Date().toLocaleDateString('en-US', { weekday: 'long' })
  );

  // Clubs & Events Tab State
  const [clubsEventsData, setClubsEventsData] = useState({ clubs: [], events: [] });
  const [clubCategoryFilter, setClubCategoryFilter] = useState('All');
  const [clubSearchTerm, setClubSearchTerm] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // My Registrations Tab State
  const [myRegistrations, setMyRegistrations] = useState({ myClubs: [], myEvents: [] });
  const [regSubTab, setRegSubTab] = useState('clubs');

  // Campus Lost & Found Tab State
  const [lostFoundSubTab, setLostFoundSubTab] = useState('browse');
  const [lostFoundItems, setLostFoundItems] = useState([]);
  const [myReports, setMyReports] = useState([]);
  const [returnedHistory, setReturnedHistory] = useState([]);
  const [lfSearch, setLfSearch] = useState('');
  const [lfCategory, setLfCategory] = useState('All Categories');
  const [lfType, setLfType] = useState('ALL');
  const [contactModalItem, setContactModalItem] = useState(null);
  const [editModalItem, setEditModalItem] = useState(null);
  const [deleteModalItem, setDeleteModalItem] = useState(null);

  // Lost & Found Forms State
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
    category: '',
    description: '',
    location: '',
    date: '',
    photoUrl: ''
  });

  // Smart Doubt Discussion (Part 7) States
  const [selectedDoubtPage, setSelectedDoubtPage] = useState(null);
  const [pageDoubts, setPageDoubts] = useState([]);
  const [pageAnnouncements, setPageAnnouncements] = useState([]);
  const [pageFaqs, setPageFaqs] = useState([]);
  const [doubtSearch, setDoubtSearch] = useState('');
  const [doubtStatusFilter, setDoubtStatusFilter] = useState('ALL');
  const [selectedDoubtThread, setSelectedDoubtThread] = useState(null);
  const [isPostDoubtModalOpen, setIsPostDoubtModalOpen] = useState(false);
  const [postDoubtForm, setPostDoubtForm] = useState({
    title: '',
    description: '',
    imageUrl: '',
    isAnonymous: false
  });
  const [studentReplyText, setStudentReplyText] = useState('');
  const [studentReplyImageUrl, setStudentReplyImageUrl] = useState('');
  const [doubtActionLoading, setDoubtActionLoading] = useState(false);
  const [doubtPages, setDoubtPages] = useState([]);

  // Academic Performance (Part 7) States
  const [academicPerfData, setAcademicPerfData] = useState(null);
  const [selectedSubjectDetail, setSelectedSubjectDetail] = useState(null);

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  // ==========================================================================
  // Data Fetching Handlers
  // ==========================================================================

  // 1. Initial Dashboard Stats & Timetable
  const fetchStudentData = useCallback(async () => {
    try {
      const [statsRes, ttRes, notifRes] = await Promise.all([
        authFetch('/api/student/dashboard-stats'),
        authFetch('/api/student/timetable'),
        authFetch('/api/student/notifications')
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
      showToast('Error loading student dashboard: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [authFetch, showToast]);

  useEffect(() => {
    fetchStudentData();
  }, [fetchStudentData]);

  // 2. Clubs & Events
  const fetchClubsEvents = useCallback(async () => {
    try {
      const res = await authFetch('/api/student/clubs-events');
      const data = await res.json();
      if (res.ok && data.success) {
        setClubsEventsData({ clubs: data.clubs || [], events: data.events || [] });
      }
    } catch (err) {
      showToast('Error loading campus clubs & events: ' + err.message, 'error');
    }
  }, [authFetch, showToast]);

  // 3. My Registrations
  const fetchMyRegistrations = useCallback(async () => {
    try {
      const res = await authFetch('/api/student/registrations');
      const data = await res.json();
      if (res.ok && data.success) {
        setMyRegistrations({
          myClubs: data.myClubs || [],
          myEvents: data.myEvents || []
        });
      }
    } catch (err) {
      showToast('Error loading registrations: ' + err.message, 'error');
    }
  }, [authFetch, showToast]);

  // 4. Lost & Found
  const fetchLostFoundItems = useCallback(async () => {
    try {
      let url = '/api/student/lost-found?';
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
      const res = await authFetch('/api/student/lost-found/my-reports');
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
      const res = await authFetch('/api/student/lost-found/returned-history');
      const data = await res.json();
      if (res.ok && data.success) {
        setReturnedHistory(data.items || []);
      }
    } catch (err) {
      showToast('Error loading returned history: ' + err.message, 'error');
    }
  }, [authFetch, showToast]);

  // 5. Academic Performance
  const fetchAcademicPerformance = useCallback(async () => {
    try {
      const res = await authFetch('/api/student/academic-performance');
      const data = await res.json();
      if (res.ok && data.success) {
        setAcademicPerfData(data);
      }
    } catch (err) {
      showToast('Error loading academic records: ' + err.message, 'error');
    }
  }, [authFetch, showToast]);

  // 6. Doubt Pages
  const fetchDoubtPages = useCallback(async () => {
    try {
      const res = await authFetch('/api/student/doubt-pages');
      const data = await res.json();
      if (res.ok && data.success) {
        setDoubtPages(data.pages || []);
      }
    } catch (err) {
      showToast('Error loading discussion pages: ' + err.message, 'error');
    }
  }, [authFetch, showToast]);

  // Tab activation triggers
  useEffect(() => {
    if (activeTab === 'clubs-events') fetchClubsEvents();
    if (activeTab === 'registrations') fetchMyRegistrations();
    if (activeTab === 'lost-found') {
      if (lostFoundSubTab === 'browse') fetchLostFoundItems();
      else if (lostFoundSubTab === 'my-reports') fetchMyReports();
      else if (lostFoundSubTab === 'returned-history') fetchReturnedHistory();
    }
    if (activeTab === 'academic-performance') fetchAcademicPerformance();
    if (activeTab === 'doubts') fetchDoubtPages();
  }, [
    activeTab,
    lostFoundSubTab,
    fetchClubsEvents,
    fetchMyRegistrations,
    fetchLostFoundItems,
    fetchMyReports,
    fetchReturnedHistory,
    fetchAcademicPerformance,
    fetchDoubtPages
  ]);

  // ==========================================================================
  // Action Handlers
  // ==========================================================================

  // Join Club
  const handleJoinClub = async (clubId) => {
    setActionLoadingId(clubId);
    try {
      const res = await authFetch(`/api/student/clubs/${clubId}/register`, {
        method: 'POST'
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(data.message || 'Joined club successfully!', 'success');
        fetchClubsEvents();
        fetchMyRegistrations();
      } else {
        showToast(data.message || 'Could not join club', 'error');
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Register Event
  const handleRegisterEvent = async (eventId) => {
    setActionLoadingId(eventId);
    try {
      const res = await authFetch(`/api/student/events/${eventId}/register`, {
        method: 'POST'
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(data.message || 'Registered for event successfully!', 'success');
        fetchClubsEvents();
        fetchMyRegistrations();
      } else {
        showToast(data.message || 'Could not register for event', 'error');
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Report Lost / Found Item Submit
  const handleCreateLostFound = async (e) => {
    e.preventDefault();
    try {
      const res = await authFetch('/api/student/lost-found', {
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

  // Edit Report Submit
  const handleUpdateReport = async (e) => {
    e.preventDefault();
    if (!editModalItem) return;
    try {
      const res = await authFetch(`/api/student/lost-found/${editModalItem.id}`, {
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

  // Delete Report
  const handleDeleteReport = async () => {
    if (!deleteModalItem) return;
    try {
      const res = await authFetch(`/api/student/lost-found/${deleteModalItem.id}`, {
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

  // Mark As Returned
  const handleMarkReturned = async (item) => {
    try {
      const res = await authFetch(`/api/student/lost-found/${item.id}/return`, {
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

  // Mark all notifications read
  const handleMarkAllNotifsRead = async () => {
    try {
      const res = await authFetch('/api/student/notifications/mark-all-read', { method: 'PUT' });
      if (res.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: 1 })));
        setUnreadNotifsCount(0);
        showToast('All notifications marked as read', 'success');
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Smart Doubt Discussion Handlers
  const fetchDoubtPageData = useCallback(async (page) => {
    if (!page) return;
    try {
      const queryParams = new URLSearchParams({ pageId: page.id });
      if (doubtStatusFilter !== 'ALL') queryParams.append('status', doubtStatusFilter);
      if (doubtSearch.trim()) queryParams.append('search', doubtSearch.trim());

      const [doubtsRes, ancRes, faqsRes] = await Promise.all([
        authFetch(`/api/student/doubts?${queryParams.toString()}`),
        authFetch('/api/student/announcements'),
        authFetch(`/api/student/faqs?pageId=${page.id}&subjectId=${page.subjectId || ''}`)
      ]);

      const doubtsData = await doubtsRes.json();
      const ancData = await ancRes.json();
      const faqsData = await faqsRes.json();

      if (doubtsRes.ok && doubtsData.success) {
        setPageDoubts(doubtsData.doubts || []);
      }
      if (ancRes.ok && ancData.success) {
        setPageAnnouncements(ancData.announcements || []);
      }
      if (faqsRes.ok && faqsData.success) {
        setPageFaqs(faqsData.faqs || []);
      }
    } catch (err) {
      showToast('Error loading forum discussions: ' + err.message, 'error');
    }
  }, [authFetch, doubtStatusFilter, doubtSearch, showToast]);

  const handleSelectDoubtPage = (page) => {
    setSelectedDoubtPage(page);
    setDoubtSearch('');
    setDoubtStatusFilter('ALL');
    fetchDoubtPageData(page);
  };

  const handleOpenStudentDoubtThread = async (doubtId) => {
    try {
      const res = await authFetch(`/api/student/doubts/${doubtId}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setSelectedDoubtThread(data);
      } else {
        showToast(data.message || 'Error opening discussion thread', 'error');
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleCreateStudentDoubt = async (e) => {
    e.preventDefault();
    if (!selectedDoubtPage) return;
    setDoubtActionLoading(true);
    try {
      const res = await authFetch('/api/student/doubts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pageId: selectedDoubtPage.id,
          title: postDoubtForm.title.trim(),
          description: postDoubtForm.description.trim(),
          imageUrl: postDoubtForm.imageUrl.trim() || null,
          isAnonymous: postDoubtForm.isAnonymous
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast('Your doubt has been posted to the class forum!', 'success');
        setIsPostDoubtModalOpen(false);
        setPostDoubtForm({ title: '', description: '', imageUrl: '', isAnonymous: false });
        fetchDoubtPageData(selectedDoubtPage);
      } else {
        showToast(data.message || 'Failed to post doubt', 'error');
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setDoubtActionLoading(false);
    }
  };

  const handleReplyStudentDoubt = async (e) => {
    e.preventDefault();
    if (!selectedDoubtThread?.doubt?.id || !studentReplyText.trim()) return;
    setDoubtActionLoading(true);
    try {
      const res = await authFetch(`/api/student/doubts/${selectedDoubtThread.doubt.id}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          replyText: studentReplyText.trim(),
          imageUrl: studentReplyImageUrl.trim() || null
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast('Reply added to discussion thread', 'success');
        setStudentReplyText('');
        setStudentReplyImageUrl('');
        handleOpenStudentDoubtThread(selectedDoubtThread.doubt.id);
        if (selectedDoubtPage) fetchDoubtPageData(selectedDoubtPage);
      } else {
        showToast(data.message || 'Error posting reply', 'error');
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setDoubtActionLoading(false);
    }
  };

  const handleRequestFacultyHelp = async (doubtId) => {
    try {
      const res = await authFetch(`/api/student/doubts/${doubtId}/request-faculty-help`, {
        method: 'PUT'
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast('Faculty has been notified of your doubt!', 'success');
        handleOpenStudentDoubtThread(doubtId);
        if (selectedDoubtPage) fetchDoubtPageData(selectedDoubtPage);
      } else {
        showToast(data.message || 'Could not request faculty help', 'error');
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Dynamic Header Meta
  const getHeaderMeta = () => {
    switch (activeTab) {
      case 'timetable':
        return { title: 'Smart Timetable', subtitle: `${user?.department || 'Engineering'} • ${user?.year || 'SE'}-${user?.division || 'B'} Official Schedule` };
      case 'clubs-events':
        return { title: 'Clubs & Campus Events', subtitle: 'Explore collegiate societies, workshops & limited-seat registrations' };
      case 'registrations':
        return { title: 'My Registrations', subtitle: 'Track your joined clubs, registered workshops & event confirmations' };
      case 'lost-found':
        return { title: 'Campus Lost & Found Hub', subtitle: 'Report missing personal items, search campus recovery listings & track returns' };
      case 'doubts':
        return { title: 'Smart Doubt Discussion', subtitle: 'Ask academic questions & access faculty-verified solutions (Part 7)' };
      case 'academic-performance':
        return { title: 'Academic Performance & Grades', subtitle: '🔒 Strictly Private — Your verified test marks, attendance & feedback' };
      case 'notifications':
        return { title: 'Student Notification Center', subtitle: 'Class announcements, timetable alerts & campus broadcasts' };
      case 'profile':
        return { title: 'Student Academic Profile', subtitle: 'Official enrollment record & institutional details' };
      default:
        return { title: 'Student Dashboard', subtitle: `Welcome back, ${user?.name || 'Student'} • Cohort ${user?.year || 'SE'}-${user?.division || 'B'}` };
    }
  };

  const { title, subtitle } = getHeaderMeta();

  const currentClass = timetableData?.currentClass;
  const nextClass = timetableData?.nextClass;
  const todaySchedule = timetableData?.todaySchedule || [];
  const weeklyGrid = timetableData?.weeklyGrid || {};
  const assignedClassrooms = timetableData?.assignedClassrooms || [];

  return (
    <div className="student-layout">
      {/* Sidebar */}
      <StudentSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isMobileOpen={isMobileOpen}
        closeMobileSidebar={() => setIsMobileOpen(false)}
        unreadNotifsCount={unreadNotifsCount}
      />

      {/* Main Wrapper */}
      <div className="student-main-wrapper">
        <StudentHeader
          title={title}
          subtitle={subtitle}
          toggleMobileSidebar={() => setIsMobileOpen(!isMobileOpen)}
          unreadCount={unreadNotifsCount}
          notifications={notifications}
        />

        <main className="student-content">
          
          {/* ================================================================ */}
          {/* 1. DASHBOARD OVERVIEW HOME TAB */}
          {/* ================================================================ */}
          {activeTab === 'dashboard' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
              
              {/* Top Banner Greeting */}
              <div
                style={{
                  padding: '1.75rem 2rem',
                  borderRadius: '20px',
                  background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(6, 182, 212, 0.1) 100%)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '1rem',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: '999px', background: '#10b981', color: '#060b17' }}>
                      STUDENT PORTAL
                    </span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      Academic Term 2026-2027
                    </span>
                  </div>
                  <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>
                    Welcome, {user?.name ? user.name.split(' ')[0] : 'Shifa'}! 👋
                  </h1>
                  <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                    {user?.department || 'Computer Engineering'} • {user?.year || 'SE'}-Division {user?.division || 'B'} • Roll #{user?.rollNumber || '23'}
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button
                    onClick={() => setActiveTab('timetable')}
                    className="btn btn-primary"
                    style={{
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.65rem 1.1rem',
                      borderRadius: '10px',
                      fontSize: '0.88rem',
                      fontWeight: 600,
                      color: '#fff',
                      boxShadow: '0 0 15px rgba(16, 185, 129, 0.3)'
                    }}
                  >
                    <Calendar size={17} />
                    <span>My Timetable</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('clubs-events')}
                    style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid var(--border-subtle)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.65rem 1.1rem',
                      borderRadius: '10px',
                      fontSize: '0.88rem',
                      fontWeight: 600,
                      color: '#fff',
                      cursor: 'pointer'
                    }}
                  >
                    <Users size={17} color="var(--accent-cyan)" />
                    <span>Clubs & Events</span>
                  </button>
                </div>
              </div>

              {/* Summary Metric Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
                
                {/* Card 1: Today's Classes */}
                <div className="card" style={{ padding: '1.35rem', background: 'rgba(15, 23, 42, 0.75)', border: '1px solid var(--border-subtle)', borderRadius: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
                    <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#34d399' }}>
                      <Calendar size={20} />
                    </div>
                    <span style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', padding: '0.2rem 0.55rem', borderRadius: '999px', fontSize: '0.72rem', fontWeight: 600 }}>
                      Today
                    </span>
                  </div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff', lineHeight: 1 }}>
                    {todaySchedule.length}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.3rem' }}>
                    Lectures scheduled today
                  </div>
                </div>

                {/* Card 2: Current Class */}
                <div className="card" style={{ padding: '1.35rem', background: 'rgba(15, 23, 42, 0.75)', border: '1px solid var(--border-subtle)', borderRadius: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
                    <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: currentClass ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: currentClass ? '#34d399' : 'var(--text-muted)' }}>
                      <Sparkles size={20} />
                    </div>
                    <span
                      style={{
                        background: currentClass ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                        color: currentClass ? '#34d399' : 'var(--text-muted)',
                        padding: '0.2rem 0.55rem',
                        borderRadius: '999px',
                        fontSize: '0.72rem',
                        fontWeight: 700
                      }}
                    >
                      {currentClass ? 'ONGOING' : 'NO CURRENT CLASS'}
                    </span>
                  </div>
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                    {currentClass ? currentClass.subject : 'No Active Class'}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.3rem' }}>
                    {currentClass ? `${currentClass.classroom} • ${currentClass.faculty}` : 'Free period / break'}
                  </div>
                </div>

                {/* Card 3: Next Class */}
                <div className="card" style={{ padding: '1.35rem', background: 'rgba(15, 23, 42, 0.75)', border: '1px solid var(--border-subtle)', borderRadius: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
                    <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(6, 182, 212, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-cyan)' }}>
                      <Clock size={20} />
                    </div>
                    <span style={{ background: 'rgba(6, 182, 212, 0.15)', color: 'var(--accent-cyan)', padding: '0.2rem 0.55rem', borderRadius: '999px', fontSize: '0.72rem', fontWeight: 600 }}>
                      {nextClass ? (nextClass.isToday ? (nextClass.startsInMinutes !== undefined ? `Starts in ${nextClass.startsInMinutes}m` : `Starts ${nextClass.starts}`) : `Tomorrow`) : 'Done'}
                    </span>
                  </div>
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                    {nextClass ? nextClass.subject : 'Schedule Done'}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.3rem' }}>
                    {nextClass ? `${nextClass.classroom} • ${nextClass.faculty}` : 'No more classes today.'}
                  </div>
                </div>

                {/* Card 4: Clubs & Events Hub */}
                <div className="card" style={{ padding: '1.35rem', background: 'rgba(15, 23, 42, 0.75)', border: '1px solid var(--border-subtle)', borderRadius: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
                    <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(99, 102, 241, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-light)' }}>
                      <Award size={20} />
                    </div>
                    <span style={{ background: 'rgba(99, 102, 241, 0.15)', color: 'var(--primary-light)', padding: '0.2rem 0.55rem', borderRadius: '999px', fontSize: '0.72rem', fontWeight: 600 }}>
                      Campus
                    </span>
                  </div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff', lineHeight: 1 }}>
                    {clubsEventsData.clubs.length + clubsEventsData.events.length || '5+'}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.3rem' }}>
                    Clubs & Events Active
                  </div>
                </div>

                {/* Card 5: Unread Notifications */}
                <div className="card" style={{ padding: '1.35rem', background: 'rgba(15, 23, 42, 0.75)', border: '1px solid var(--border-subtle)', borderRadius: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
                    <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(244, 63, 94, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fb7185' }}>
                      <Bell size={20} />
                    </div>
                    <span style={{ background: 'rgba(244, 63, 94, 0.15)', color: '#fb7185', padding: '0.2rem 0.55rem', borderRadius: '999px', fontSize: '0.72rem', fontWeight: 600 }}>
                      Alerts
                    </span>
                  </div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff', lineHeight: 1 }}>
                    {unreadNotifsCount}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.3rem' }}>
                    Unread notifications
                  </div>
                </div>

              </div>

              {/* Main Grid: Today's Timeline & Campus Hub */}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
                
                {/* Today's Classes Timeline */}
                <div className="card" style={{ padding: '1.5rem', background: 'rgba(15, 23, 42, 0.75)', border: '1px solid var(--border-subtle)', borderRadius: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                    <div>
                      <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff' }}>Today's Lecture Timeline</h2>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
                        {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                    <button
                      onClick={() => setActiveTab('timetable')}
                      style={{ background: 'none', border: 'none', color: '#34d399', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' }}
                    >
                      Weekly Matrix →
                    </button>
                  </div>

                  {todaySchedule.length === 0 ? (
                    <div style={{ padding: '3rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                      <Calendar size={40} style={{ margin: '0 auto 0.75rem auto', opacity: 0.3 }} />
                      <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)' }}>No classes scheduled for today.</p>
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Enjoy your break or check upcoming weekly slots.</p>
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
                            <div style={{ width: '80px', fontSize: '0.85rem', fontWeight: 700, color: '#34d399' }}>
                              {slot.startTime} – {slot.endTime}
                            </div>
                            <div>
                              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#fff' }}>
                                {slot.subjectName}
                              </div>
                              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                                Faculty: <strong style={{ color: '#fff' }}>{slot.facultyName}</strong> • Room: <strong style={{ color: 'var(--accent-cyan)' }}>{slot.roomNumber}</strong>
                              </div>
                            </div>
                          </div>
                          <span
                            style={{
                              padding: '0.25rem 0.65rem',
                              borderRadius: '999px',
                              fontSize: '0.72rem',
                              fontWeight: 600,
                              background: 'rgba(16, 185, 129, 0.15)',
                              color: '#34d399'
                            }}
                          >
                            Period {slot.periodNumber || (idx + 1)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Right Column: Campus Shortcuts & Lost & Found */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  
                  {/* Quick Modules */}
                  <div className="card" style={{ padding: '1.35rem', background: 'rgba(15, 23, 42, 0.75)', border: '1px solid var(--border-subtle)', borderRadius: '16px' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff', marginBottom: '1rem' }}>
                      Campus Fast Actions
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                      <button
                        onClick={() => setActiveTab('clubs-events')}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '0.75rem 1rem',
                          borderRadius: '10px',
                          background: 'rgba(255, 255, 255, 0.03)',
                          border: '1px solid var(--border-subtle)',
                          color: '#fff',
                          fontSize: '0.84rem',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                          <Users size={16} color="var(--accent-cyan)" />
                          <span>Join Collegiate Clubs</span>
                        </div>
                        <ChevronRight size={16} color="var(--text-muted)" />
                      </button>

                      <button
                        onClick={() => setActiveTab('registrations')}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '0.75rem 1rem',
                          borderRadius: '10px',
                          background: 'rgba(255, 255, 255, 0.03)',
                          border: '1px solid var(--border-subtle)',
                          color: '#fff',
                          fontSize: '0.84rem',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                          <CheckSquare size={16} color="#34d399" />
                          <span>My Registrations Hub</span>
                        </div>
                        <ChevronRight size={16} color="var(--text-muted)" />
                      </button>

                      <button
                        onClick={() => setActiveTab('lost-found')}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '0.75rem 1rem',
                          borderRadius: '10px',
                          background: 'rgba(255, 255, 255, 0.03)',
                          border: '1px solid var(--border-subtle)',
                          color: '#fff',
                          fontSize: '0.84rem',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                          <Package size={16} color="var(--primary-light)" />
                          <span>Campus Lost & Found</span>
                        </div>
                        <ChevronRight size={16} color="var(--text-muted)" />
                      </button>
                    </div>
                  </div>

                  {/* Academic Integrity Badge */}
                  <div
                    style={{
                      padding: '1.25rem',
                      borderRadius: '14px',
                      background: 'rgba(16, 185, 129, 0.06)',
                      border: '1px solid rgba(16, 185, 129, 0.2)',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '0.75rem'
                    }}
                  >
                    <Shield size={20} color="#34d399" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                      <strong style={{ color: '#fff', display: 'block', marginBottom: '2px' }}>Role Scoped & Isolated</strong>
                      Your student session is strictly connected to {user?.department || 'Computer Engineering'} ({user?.year || 'SE'}-{user?.division || 'B'}).
                    </div>
                  </div>

                </div>

              </div>

            </div>
          )}

          {/* ================================================================ */}
          {/* 2. SMART TIMETABLE VIEW (Automatic Cohort Scoping) */}
          {/* ================================================================ */}
          {activeTab === 'timetable' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              {/* Branch / Department Folder Tabs */}
              <DepartmentFolderTabs
                endpoint="/api/student/departments"
                selectedDepartment={user?.department || 'Computer Engineering'}
                onSelectDepartment={() => {}}
                showAllOption={false}
              />

              {/* Cohort Scoping Notification Banner */}
              <div
                style={{
                  padding: '1rem 1.25rem',
                  borderRadius: '14px',
                  background: 'rgba(16, 185, 129, 0.1)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '0.75rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <Shield size={20} color="#34d399" style={{ flexShrink: 0 }} />
                  <div style={{ fontSize: '0.85rem', color: '#fff' }}>
                    <strong>Automated Timetable Scoping:</strong> Displaying official schedule strictly matching <strong>{user?.department || 'Computer Engineering'} • {user?.year || 'SE'} - Division {user?.division || 'B'}</strong>.
                  </div>
                </div>
                <div style={{ fontSize: '0.78rem', color: '#34d399', fontWeight: 600 }}>
                  Semester {user?.year === 'SE' ? 4 : (user?.year === 'TE' ? 6 : 2)} • 2026-2027
                </div>
              </div>

              {/* Day Selector Pills */}
              <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
                {daysOfWeek.map((day) => (
                  <button
                    key={day}
                    onClick={() => setSelectedDay(day)}
                    style={{
                      padding: '0.65rem 1.25rem',
                      borderRadius: '10px',
                      border: selectedDay === day ? '1px solid #10b981' : '1px solid var(--border-subtle)',
                      background: selectedDay === day ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'var(--bg-input)',
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
                      {selectedDay}'s Class Schedule
                    </h2>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: 0 }}>
                      Official timetable for {user?.department || 'Computer Engineering'} ({user?.year || 'SE'}-{user?.division || 'B'})
                    </p>
                  </div>
                  <span style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', padding: '0.35rem 0.8rem', borderRadius: '999px', fontWeight: 600, fontSize: '0.78rem' }}>
                    {weeklyGrid[selectedDay]?.length || 0} Lectures
                  </span>
                </div>

                {(weeklyGrid[selectedDay] || []).length === 0 ? (
                  <div style={{ padding: '4rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <Calendar size={48} style={{ margin: '0 auto 1rem auto', opacity: 0.3 }} />
                    <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', fontWeight: 600 }}>No Lectures Scheduled on {selectedDay}</p>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>You have no classes scheduled on this day.</p>
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
                          <span style={{ fontSize: '0.78rem', fontWeight: 700, padding: '0.2rem 0.5rem', borderRadius: '6px', background: 'rgba(16, 185, 129, 0.2)', color: '#34d399' }}>
                            Period {slot.periodNumber || (i + 1)}
                          </span>
                          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff' }}>
                            {slot.startTime} – {slot.endTime}
                          </span>
                        </div>

                        <div>
                          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff' }}>{slot.subjectName}</h3>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                            Code: {slot.subjectCode || 'N/A'} • {slot.credits || 4} Credits
                          </div>
                        </div>

                        <div style={{ paddingTop: '0.75rem', borderTop: '1px solid rgba(255, 255, 255, 0.06)', display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                          <div>
                            <span style={{ color: 'var(--text-muted)' }}>Faculty:</span>{' '}
                            <strong style={{ color: '#fff' }}>{slot.facultyName}</strong>
                          </div>
                          <div>
                            <span style={{ color: 'var(--text-muted)' }}>Room:</span>{' '}
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
                  Assigned Lecture Halls & Laboratories
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
                          {room.building} • {room.floor} ({room.classroomType})
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ================================================================ */}
          {/* 3. CLUBS & CAMPUS EVENTS (Part 6 Complete) */}
          {/* ================================================================ */}
          {activeTab === 'clubs-events' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              
              {/* Top Filter Bar */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {['All', 'Technical', 'Cultural', 'Sports', 'Literary', 'Social'].map(cat => (
                    <button
                      key={cat}
                      onClick={() => setClubCategoryFilter(cat)}
                      style={{
                        padding: '0.45rem 0.9rem',
                        borderRadius: '999px',
                        border: clubCategoryFilter === cat ? '1px solid #10b981' : '1px solid var(--border-subtle)',
                        background: clubCategoryFilter === cat ? 'rgba(16, 185, 129, 0.15)' : 'var(--bg-input)',
                        color: clubCategoryFilter === cat ? '#34d399' : 'var(--text-secondary)',
                        fontSize: '0.82rem',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                <div style={{ position: 'relative', minWidth: '240px' }}>
                  <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="text"
                    placeholder="Search clubs or events..."
                    value={clubSearchTerm}
                    onChange={(e) => setClubSearchTerm(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.5rem 1rem 0.5rem 2.2rem',
                      borderRadius: '10px',
                      background: 'var(--bg-input)',
                      border: '1px solid var(--border-subtle)',
                      color: '#fff',
                      fontSize: '0.85rem'
                    }}
                  />
                </div>
              </div>

              {/* Section 1: Collegiate Clubs (Limited Seats) */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff' }}>
                      Collegiate Clubs & Societies (Limited Seats)
                    </h3>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: 0 }}>
                      Join departmental societies with verified limited seating capacity.
                    </p>
                  </div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {clubsEventsData.clubs.length} Clubs Available
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.35rem' }}>
                  {clubsEventsData.clubs
                    .filter(c => clubCategoryFilter === 'All' || c.category.toLowerCase().includes(clubCategoryFilter.toLowerCase()))
                    .filter(c => !clubSearchTerm || c.name.toLowerCase().includes(clubSearchTerm.toLowerCase()) || c.description?.toLowerCase().includes(clubSearchTerm.toLowerCase()))
                    .map(club => {
                      const isFull = club.availableSeats <= 0;
                      const isRegistered = club.isRegistered;
                      const isClosed = club.status === 'Registration Closed';
                      const isNotStarted = club.status === 'Registration Not Started';
                      const isInactive = club.status === 'Inactive';

                      return (
                        <div
                          key={club.id}
                          className="card"
                          style={{
                            padding: '1.5rem',
                            background: 'rgba(15, 23, 42, 0.8)',
                            border: isRegistered ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid var(--border-subtle)',
                            borderRadius: '16px',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            gap: '1rem',
                            position: 'relative'
                          }}
                        >
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
                              <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '0.15rem 0.55rem', borderRadius: '999px', background: 'rgba(6, 182, 212, 0.15)', color: 'var(--accent-cyan)' }}>
                                {club.category}
                              </span>
                              <span
                                style={{
                                  fontSize: '0.72rem',
                                  fontWeight: 700,
                                  padding: '0.15rem 0.55rem',
                                  borderRadius: '999px',
                                  background: isRegistered ? 'rgba(16, 185, 129, 0.2)' : (isFull ? 'rgba(244, 63, 94, 0.2)' : 'rgba(255, 255, 255, 0.06)'),
                                  color: isRegistered ? '#34d399' : (isFull ? '#fb7185' : 'var(--text-secondary)')
                                }}
                              >
                                {isRegistered ? 'Joined' : club.status}
                              </span>
                            </div>

                            <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff' }}>{club.name}</h4>
                            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '0.4rem', lineHeight: 1.45 }}>
                              {club.description}
                            </p>
                          </div>

                          {/* Seat Capacity Progress Gauge */}
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.35rem' }}>
                              <span style={{ color: 'var(--text-muted)' }}>Seats Availability</span>
                              <strong style={{ color: isFull ? '#fb7185' : '#34d399' }}>
                                {club.availableSeats} of {club.maxSeats} Remaining
                              </strong>
                            </div>
                            <div style={{ width: '100%', height: '6px', borderRadius: '999px', background: 'rgba(255, 255, 255, 0.08)', overflow: 'hidden' }}>
                              <div
                                style={{
                                  width: `${Math.min(100, Math.round(((club.maxSeats - club.availableSeats) / club.maxSeats) * 100))}%`,
                                  height: '100%',
                                  background: isFull ? '#f43f5e' : 'linear-gradient(90deg, #10b981, #06b6d4)',
                                  borderRadius: '999px',
                                  transition: 'width 0.3s ease'
                                }}
                              />
                            </div>
                          </div>

                          {/* Footer Info & Action */}
                          <div style={{ paddingTop: '0.85rem', borderTop: '1px solid rgba(255, 255, 255, 0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              Coord: <strong style={{ color: '#fff' }}>{club.coordinatorName || 'Faculty'}</strong>
                            </div>

                            {isRegistered ? (
                              <button
                                disabled
                                style={{
                                  padding: '0.45rem 0.9rem',
                                  borderRadius: '8px',
                                  background: 'rgba(16, 185, 129, 0.15)',
                                  border: '1px solid #10b981',
                                  color: '#34d399',
                                  fontSize: '0.8rem',
                                  fontWeight: 700,
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.35rem',
                                  cursor: 'default'
                                }}
                              >
                                <Check size={14} /> Joined
                              </button>
                            ) : isFull ? (
                              <button
                                disabled
                                style={{
                                  padding: '0.45rem 0.9rem',
                                  borderRadius: '8px',
                                  background: 'rgba(244, 63, 94, 0.1)',
                                  border: '1px solid rgba(244, 63, 94, 0.3)',
                                  color: '#fb7185',
                                  fontSize: '0.8rem',
                                  fontWeight: 600,
                                  cursor: 'not-allowed'
                                }}
                              >
                                Seats Full
                              </button>
                            ) : isClosed ? (
                              <button
                                disabled
                                style={{
                                  padding: '0.45rem 0.9rem',
                                  borderRadius: '8px',
                                  background: 'rgba(255, 255, 255, 0.04)',
                                  border: '1px solid var(--border-subtle)',
                                  color: 'var(--text-muted)',
                                  fontSize: '0.8rem',
                                  cursor: 'not-allowed'
                                }}
                              >
                                Registration Closed
                              </button>
                            ) : isNotStarted ? (
                              <button
                                disabled
                                style={{
                                  padding: '0.45rem 0.9rem',
                                  borderRadius: '8px',
                                  background: 'rgba(255, 255, 255, 0.04)',
                                  border: '1px solid var(--border-subtle)',
                                  color: 'var(--text-muted)',
                                  fontSize: '0.8rem',
                                  cursor: 'not-allowed'
                                }}
                              >
                                Starts {club.registrationStartDate}
                              </button>
                            ) : isInactive ? (
                              <button
                                disabled
                                style={{
                                  padding: '0.45rem 0.9rem',
                                  borderRadius: '8px',
                                  background: 'rgba(255, 255, 255, 0.04)',
                                  border: '1px solid var(--border-subtle)',
                                  color: 'var(--text-muted)',
                                  fontSize: '0.8rem',
                                  cursor: 'not-allowed'
                                }}
                              >
                                Inactive
                              </button>
                            ) : (
                              <button
                                onClick={() => handleJoinClub(club.id)}
                                disabled={actionLoadingId === club.id}
                                style={{
                                  padding: '0.45rem 1rem',
                                  borderRadius: '8px',
                                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                  border: 'none',
                                  color: '#fff',
                                  fontSize: '0.82rem',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  transition: 'all 0.2s ease',
                                  boxShadow: '0 0 10px rgba(16, 185, 129, 0.3)'
                                }}
                              >
                                {actionLoadingId === club.id ? 'Joining...' : 'Join Club'}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Section 2: Campus Events (No Seat Limits) */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff' }}>
                      Campus Events & Workshops (Deadline Governed)
                    </h3>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: 0 }}>
                      Flagship collegiate hackathons, symposiums and technical conferences (No seat caps).
                    </p>
                  </div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {clubsEventsData.events.length} Upcoming Events
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.35rem' }}>
                  {clubsEventsData.events
                    .filter(e => !clubSearchTerm || e.title.toLowerCase().includes(clubSearchTerm.toLowerCase()) || e.description?.toLowerCase().includes(clubSearchTerm.toLowerCase()) || e.venue?.toLowerCase().includes(clubSearchTerm.toLowerCase()))
                    .map(ev => {
                      const isRegistered = ev.isRegistered;
                      const isCancelled = ev.status === 'Event Cancelled';
                      const isClosed = ev.status === 'Registration Closed';
                      const isNotStarted = ev.status === 'Registration Not Started';

                      return (
                        <div
                          key={ev.id}
                          className="card"
                          style={{
                            padding: '1.5rem',
                            background: 'rgba(15, 23, 42, 0.8)',
                            border: isRegistered ? '1px solid rgba(6, 182, 212, 0.4)' : '1px solid var(--border-subtle)',
                            borderRadius: '16px',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            gap: '1rem'
                          }}
                        >
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
                              <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '0.15rem 0.55rem', borderRadius: '999px', background: 'rgba(99, 102, 241, 0.15)', color: 'var(--primary-light)' }}>
                                {ev.clubName || 'Inter-Departmental'}
                              </span>
                              <span
                                style={{
                                  fontSize: '0.72rem',
                                  fontWeight: 700,
                                  padding: '0.15rem 0.55rem',
                                  borderRadius: '999px',
                                  background: isRegistered ? 'rgba(6, 182, 212, 0.2)' : (isCancelled ? 'rgba(244, 63, 94, 0.2)' : 'rgba(255, 255, 255, 0.06)'),
                                  color: isRegistered ? 'var(--accent-cyan)' : (isCancelled ? '#fb7185' : 'var(--text-secondary)')
                                }}
                              >
                                {isRegistered ? 'Registered' : ev.status}
                              </span>
                            </div>

                            <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff' }}>{ev.title}</h4>
                            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '0.4rem', lineHeight: 1.45 }}>
                              {ev.description}
                            </p>
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <Calendar size={14} color="#34d399" />
                              <span>Date: <strong style={{ color: '#fff' }}>{ev.eventDate}</strong> {ev.eventTime ? `(${ev.eventTime})` : ''}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <MapPin size={14} color="var(--accent-cyan)" />
                              <span>Venue: <strong style={{ color: '#fff' }}>{ev.venue}</strong></span>
                            </div>
                          </div>

                          <div style={{ paddingTop: '0.85rem', borderTop: '1px solid rgba(255, 255, 255, 0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              Coord: <strong style={{ color: '#fff' }}>{ev.coordinatorName || 'Faculty'}</strong>
                            </div>

                            {isRegistered ? (
                              <button
                                disabled
                                style={{
                                  padding: '0.45rem 0.9rem',
                                  borderRadius: '8px',
                                  background: 'rgba(6, 182, 212, 0.15)',
                                  border: '1px solid var(--accent-cyan)',
                                  color: 'var(--accent-cyan)',
                                  fontSize: '0.8rem',
                                  fontWeight: 700,
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.35rem',
                                  cursor: 'default'
                                }}
                              >
                                <Check size={14} /> Registered
                              </button>
                            ) : isCancelled ? (
                              <button
                                disabled
                                style={{
                                  padding: '0.45rem 0.9rem',
                                  borderRadius: '8px',
                                  background: 'rgba(244, 63, 94, 0.1)',
                                  border: '1px solid rgba(244, 63, 94, 0.3)',
                                  color: '#fb7185',
                                  fontSize: '0.8rem',
                                  cursor: 'not-allowed'
                                }}
                              >
                                Event Cancelled
                              </button>
                            ) : isClosed ? (
                              <button
                                disabled
                                style={{
                                  padding: '0.45rem 0.9rem',
                                  borderRadius: '8px',
                                  background: 'rgba(255, 255, 255, 0.04)',
                                  border: '1px solid var(--border-subtle)',
                                  color: 'var(--text-muted)',
                                  fontSize: '0.8rem',
                                  cursor: 'not-allowed'
                                }}
                              >
                                Deadline Passed
                              </button>
                            ) : isNotStarted ? (
                              <button
                                disabled
                                style={{
                                  padding: '0.45rem 0.9rem',
                                  borderRadius: '8px',
                                  background: 'rgba(255, 255, 255, 0.04)',
                                  border: '1px solid var(--border-subtle)',
                                  color: 'var(--text-muted)',
                                  fontSize: '0.8rem',
                                  cursor: 'not-allowed'
                                }}
                              >
                                Starts {ev.registrationStartDate}
                              </button>
                            ) : (
                              <button
                                onClick={() => handleRegisterEvent(ev.id)}
                                disabled={actionLoadingId === ev.id}
                                style={{
                                  padding: '0.45rem 1rem',
                                  borderRadius: '8px',
                                  background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
                                  border: 'none',
                                  color: '#fff',
                                  fontSize: '0.82rem',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  transition: 'all 0.2s ease',
                                  boxShadow: '0 0 10px rgba(6, 182, 212, 0.3)'
                                }}
                              >
                                {actionLoadingId === ev.id ? 'Registering...' : 'Register'}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>

            </div>
          )}

          {/* ================================================================ */}
          {/* 4. MY REGISTRATIONS HUB (/student/registrations) */}
          {/* ================================================================ */}
          {activeTab === 'registrations' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
              
              {/* Dual Sub-Tabs */}
              <div style={{ display: 'flex', gap: '0.75rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
                <button
                  onClick={() => setRegSubTab('clubs')}
                  style={{
                    padding: '0.65rem 1.25rem',
                    borderRadius: '10px',
                    border: regSubTab === 'clubs' ? '1px solid #10b981' : '1px solid transparent',
                    background: regSubTab === 'clubs' ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
                    color: regSubTab === 'clubs' ? '#34d399' : 'var(--text-secondary)',
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <Users size={18} />
                  <span>My Clubs ({myRegistrations.myClubs.length})</span>
                </button>

                <button
                  onClick={() => setRegSubTab('events')}
                  style={{
                    padding: '0.65rem 1.25rem',
                    borderRadius: '10px',
                    border: regSubTab === 'events' ? '1px solid var(--accent-cyan)' : '1px solid transparent',
                    background: regSubTab === 'events' ? 'rgba(6, 182, 212, 0.15)' : 'transparent',
                    color: regSubTab === 'events' ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <Award size={18} />
                  <span>My Events ({myRegistrations.myEvents.length})</span>
                </button>
              </div>

              {/* Sub-Tab 1: My Clubs */}
              {regSubTab === 'clubs' && (
                <div>
                  {myRegistrations.myClubs.length === 0 ? (
                    <div style={{ padding: '4rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                      <Users size={48} style={{ margin: '0 auto 1rem auto', opacity: 0.3 }} />
                      <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', fontWeight: 600 }}>No Club Memberships Yet</p>
                      <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Explore the Clubs & Events catalog to join societies.</p>
                      <button
                        onClick={() => setActiveTab('clubs-events')}
                        className="btn btn-primary"
                        style={{ marginTop: '1rem', padding: '0.5rem 1rem' }}
                      >
                        Explore Clubs
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
                      {myRegistrations.myClubs.map(c => (
                        <div
                          key={c.id}
                          className="card"
                          style={{
                            padding: '1.35rem',
                            background: 'rgba(15, 23, 42, 0.75)',
                            border: '1px solid rgba(16, 185, 129, 0.3)',
                            borderRadius: '16px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.85rem'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '0.15rem 0.55rem', borderRadius: '999px', background: 'rgba(6, 182, 212, 0.15)', color: 'var(--accent-cyan)' }}>
                              {c.category}
                            </span>
                            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#34d399', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                              <CheckCircle size={14} /> Active Member
                            </span>
                          </div>
                          <div>
                            <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff' }}>{c.clubName}</h4>
                            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '0.3rem', lineHeight: 1.4 }}>
                              {c.description}
                            </p>
                          </div>
                          <div style={{ paddingTop: '0.75rem', borderTop: '1px solid rgba(255, 255, 255, 0.06)', display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                            <span>Faculty: <strong style={{ color: '#fff' }}>{c.coordinatorName || 'Faculty'}</strong></span>
                            <span>Joined: <strong style={{ color: '#fff' }}>{c.registeredAt ? new Date(c.registeredAt).toLocaleDateString() : 'Active'}</strong></span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Sub-Tab 2: My Events */}
              {regSubTab === 'events' && (
                <div>
                  {myRegistrations.myEvents.length === 0 ? (
                    <div style={{ padding: '4rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                      <Award size={48} style={{ margin: '0 auto 1rem auto', opacity: 0.3 }} />
                      <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', fontWeight: 600 }}>No Event Registrations Yet</p>
                      <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Register for upcoming collegiate workshops and fests.</p>
                      <button
                        onClick={() => setActiveTab('clubs-events')}
                        className="btn btn-primary"
                        style={{ marginTop: '1rem', padding: '0.5rem 1rem' }}
                      >
                        Browse Events
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
                      {myRegistrations.myEvents.map(ev => (
                        <div
                          key={ev.id}
                          className="card"
                          style={{
                            padding: '1.35rem',
                            background: 'rgba(15, 23, 42, 0.75)',
                            border: '1px solid rgba(6, 182, 212, 0.3)',
                            borderRadius: '16px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.85rem'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '0.15rem 0.55rem', borderRadius: '999px', background: 'rgba(99, 102, 241, 0.15)', color: 'var(--primary-light)' }}>
                              Confirmed Ticket
                            </span>
                            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                              <CheckCircle size={14} /> Registered
                            </span>
                          </div>
                          <div>
                            <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff' }}>{ev.eventName}</h4>
                            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '0.3rem', lineHeight: 1.4 }}>
                              {ev.description}
                            </p>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                            <div>📅 Date: <strong style={{ color: '#fff' }}>{ev.eventDate}</strong> {ev.eventTime ? `(${ev.eventTime})` : ''}</div>
                            <div>📍 Venue: <strong style={{ color: 'var(--accent-cyan)' }}>{ev.venue}</strong></div>
                          </div>
                          <div style={{ paddingTop: '0.75rem', borderTop: '1px solid rgba(255, 255, 255, 0.06)', display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            <span>Coordinator: {ev.coordinatorName || 'Faculty'}</span>
                            <span>Booked on: {ev.registeredAt ? new Date(ev.registeredAt).toLocaleDateString() : 'Recent'}</span>
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
          {/* 5. CAMPUS LOST & FOUND HUB (Part 6 Complete) */}
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
                                    <Edit2 size={13} />
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
                          <div>
                            <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#fff' }}>{item.itemName}</h4>
                            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '0.3rem', lineHeight: 1.4 }}>
                              {item.description}
                            </p>
                          </div>
                          <div style={{ paddingTop: '0.65rem', borderTop: '1px solid rgba(255, 255, 255, 0.05)', fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
                            <span>Location: {item.location}</span>
                            <span>Returned: {item.returnedAt ? new Date(item.returnedAt).toLocaleDateString() : 'Archived'}</span>
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
          {/* 6. SMART DOUBT DISCUSSION (Part 7 Complete) */}
          {/* ================================================================ */}
          {activeTab === 'doubts' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              {!selectedDoubtPage ? (
                /* Overview: Authorized Discussion Pages */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                      <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#fff' }}>
                        Smart Doubt Discussion Forums
                      </h2>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0.25rem 0 0 0' }}>
                        Connect with your classmates and course instructors. Solved answers remain archived in your subject knowledge base.
                      </p>
                    </div>
                  </div>

                  {doubtPages.length === 0 ? (
                    <div className="card" style={{ padding: '4rem 1rem', textAlign: 'center', color: 'var(--text-muted)', borderRadius: '16px' }}>
                      <MessageSquare size={48} style={{ margin: '0 auto 1rem auto', opacity: 0.3 }} />
                      <p style={{ fontSize: '1.05rem', color: 'var(--text-secondary)', fontWeight: 700 }}>No Discussion Forums Assigned</p>
                      <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>Your department faculty will create subject forums for your class shortly.</p>
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.25rem' }}>
                      {doubtPages.map(page => (
                        <div
                          key={page.id}
                          className="card"
                          style={{
                            padding: '1.5rem',
                            background: 'rgba(15, 23, 42, 0.75)',
                            border: '1px solid var(--border-subtle)',
                            borderRadius: '18px',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            gap: '1rem',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                              <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: '8px', background: 'rgba(99, 102, 241, 0.15)', color: 'var(--primary-light)' }}>
                                {page.subjectCode || 'SUBJECT'}
                              </span>
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                                {page.department} • {page.year}-{page.division}
                              </span>
                            </div>

                            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#fff', lineHeight: 1.3 }}>
                              {page.title}
                            </h3>
                            <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginTop: '0.5rem', lineHeight: 1.45 }}>
                              {page.description || `Official academic discussion community for ${page.subjectName || 'this course'}.`}
                            </p>
                          </div>

                          <div style={{ paddingTop: '0.85rem', borderTop: '1px solid rgba(255, 255, 255, 0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                              <span>{page.totalDoubts || 0} Discussions</span>
                              {page.pendingHelpCount > 0 && (
                                <span style={{ marginLeft: '0.5rem', color: '#fbbf24', fontWeight: 700 }}>
                                  • {page.pendingHelpCount} pending help
                                </span>
                              )}
                            </div>
                            <button
                              onClick={() => handleSelectDoubtPage(page)}
                              style={{
                                padding: '0.45rem 1rem',
                                borderRadius: '8px',
                                background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)',
                                border: 'none',
                                color: '#fff',
                                fontWeight: 700,
                                fontSize: '0.8rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.4rem'
                              }}
                            >
                              <span>Enter Forum</span>
                              <ArrowRight size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                /* Forum Drilldown: Class Announcements, FAQs, Search & Doubts List */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  
                  {/* Top Forum Header & Back Button */}
                  <div className="card" style={{ padding: '1.25rem 1.5rem', background: 'rgba(15, 23, 42, 0.85)', border: '1px solid var(--border-subtle)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <button
                        onClick={() => setSelectedDoubtPage(null)}
                        style={{
                          padding: '0.5rem 0.85rem',
                          borderRadius: '8px',
                          background: 'var(--bg-input)',
                          border: '1px solid var(--border-subtle)',
                          color: '#fff',
                          fontSize: '0.82rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.4rem'
                        }}
                      >
                        <ArrowLeft size={16} />
                        <span>All Forums</span>
                      </button>

                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontSize: '0.72rem', fontWeight: 800, padding: '0.15rem 0.55rem', borderRadius: '6px', background: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}>
                            {selectedDoubtPage.subjectCode || 'ACTIVE FORUM'}
                          </span>
                          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                            {selectedDoubtPage.department} • {selectedDoubtPage.year}-{selectedDoubtPage.division}
                          </span>
                        </div>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff', marginTop: '0.2rem' }}>
                          {selectedDoubtPage.title}
                        </h2>
                      </div>
                    </div>

                    <button
                      onClick={() => setIsPostDoubtModalOpen(true)}
                      style={{
                        padding: '0.6rem 1.25rem',
                        borderRadius: '10px',
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        border: 'none',
                        color: '#fff',
                        fontWeight: 700,
                        fontSize: '0.86rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        boxShadow: '0 0 20px rgba(16, 185, 129, 0.4)'
                      }}
                    >
                      <Plus size={16} />
                      <span>Ask a Doubt</span>
                    </button>
                  </div>

                  {/* Class Announcements Section */}
                  {pageAnnouncements.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.88rem', fontWeight: 700, color: '#fbbf24' }}>
                        <Pin size={16} />
                        <span>Class Announcements & Notices ({pageAnnouncements.length})</span>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '0.85rem' }}>
                        {pageAnnouncements.map(anc => (
                          <div
                            key={anc.id}
                            className="card"
                            style={{
                              padding: '1rem 1.25rem',
                              background: 'rgba(245, 158, 11, 0.06)',
                              border: '1px solid rgba(245, 158, 11, 0.3)',
                              borderRadius: '12px',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '0.4rem'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <span style={{ fontSize: '0.72rem', fontWeight: 800, padding: '0.15rem 0.55rem', borderRadius: '4px', background: anc.priority === 'Important' ? 'rgba(244, 63, 94, 0.2)' : 'rgba(245, 158, 11, 0.2)', color: anc.priority === 'Important' ? '#fb7185' : '#fbbf24' }}>
                                {anc.priority}
                              </span>
                              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                {anc.createdAt ? new Date(anc.createdAt).toLocaleDateString() : 'Active'}
                              </span>
                            </div>
                            <h4 style={{ fontSize: '0.98rem', fontWeight: 700, color: '#fff' }}>{anc.title}</h4>
                            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
                              {anc.message}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Pinned FAQs Section */}
                  {pageFaqs.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.88rem', fontWeight: 700, color: 'var(--primary-light)' }}>
                        <HelpCircle size={16} />
                        <span>Pinned FAQs & Quick Reference ({pageFaqs.length})</span>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '0.85rem' }}>
                        {pageFaqs.map(faq => (
                          <div
                            key={faq.id}
                            className="card"
                            style={{
                              padding: '1rem 1.25rem',
                              background: 'rgba(99, 102, 241, 0.06)',
                              border: '1px solid rgba(99, 102, 241, 0.3)',
                              borderRadius: '12px',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '0.4rem'
                            }}
                          >
                            <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                              <Pin size={13} color="var(--primary-light)" />
                              <span>{faq.question}</span>
                            </div>
                            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
                              {faq.answer}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Doubts Search & Status Filter Chips */}
                  <div className="card" style={{ padding: '1rem 1.25rem', background: 'rgba(15, 23, 42, 0.75)', border: '1px solid var(--border-subtle)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                    
                    {/* Status Filter Chips */}
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      {[
                        { id: 'ALL', label: 'All Doubts' },
                        { id: 'OPEN', label: 'Open Doubts' },
                        { id: 'PENDING_FACULTY_HELP', label: '🚨 Faculty Help Requested' },
                        { id: 'ANSWERED', label: 'Answered' },
                        { id: 'VERIFIED', label: 'Verified Answers' }
                      ].map(f => (
                        <button
                          key={f.id}
                          onClick={() => setDoubtStatusFilter(f.id)}
                          style={{
                            padding: '0.4rem 0.85rem',
                            borderRadius: '999px',
                            border: '1px solid var(--border-subtle)',
                            background: doubtStatusFilter === f.id ? 'var(--primary)' : 'var(--bg-input)',
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

                    {/* Search Input */}
                    <div style={{ position: 'relative', width: '260px' }}>
                      <Search size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                      <input
                        type="text"
                        placeholder="Search questions..."
                        value={doubtSearch}
                        onChange={(e) => setDoubtSearch(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '0.45rem 0.75rem 0.45rem 2rem',
                          borderRadius: '8px',
                          background: 'var(--bg-input)',
                          border: '1px solid var(--border-subtle)',
                          color: '#fff',
                          fontSize: '0.82rem'
                        }}
                      />
                    </div>
                  </div>

                  {/* Doubts Thread List */}
                  {pageDoubts.length === 0 ? (
                    <div className="card" style={{ padding: '4rem 1rem', textAlign: 'center', color: 'var(--text-muted)', borderRadius: '16px' }}>
                      <HelpCircle size={48} style={{ margin: '0 auto 1rem auto', opacity: 0.3 }} />
                      <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', fontWeight: 600 }}>No doubts found matching this filter</p>
                      <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Click "Ask a Doubt" to initiate a peer discussion or get instructor assistance.</p>
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1.25rem' }}>
                      {pageDoubts.map(dbt => (
                        <div
                          key={dbt.id}
                          onClick={() => handleOpenStudentDoubtThread(dbt.id)}
                          className="card"
                          style={{
                            padding: '1.35rem',
                            background: 'rgba(15, 23, 42, 0.75)',
                            border: dbt.isFacultyHelpRequested ? '1px solid rgba(245, 158, 11, 0.5)' : (dbt.status === 'ANSWERED' ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid var(--border-subtle)'),
                            borderRadius: '16px',
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            gap: '0.85rem',
                            transition: 'all 0.2s ease'
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
                          onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
                        >
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
                              <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '0.15rem 0.55rem', borderRadius: '6px', background: 'rgba(99, 102, 241, 0.15)', color: 'var(--primary-light)' }}>
                                {dbt.subjectName || 'Academic'}
                              </span>

                              {dbt.status === 'ANSWERED' ? (
                                <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '0.15rem 0.55rem', borderRadius: '999px', background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                  <CheckCircle size={12} />
                                  <span>Answered</span>
                                </span>
                              ) : dbt.isFacultyHelpRequested ? (
                                <span style={{ fontSize: '0.72rem', fontWeight: 800, padding: '0.15rem 0.55rem', borderRadius: '999px', background: 'rgba(245, 158, 11, 0.2)', color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                  <AlertCircle size={12} />
                                  <span>Help Requested</span>
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
                            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '0.35rem', lineHeight: 1.45, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                              {dbt.description}
                            </p>
                          </div>

                          <div style={{ paddingTop: '0.75rem', borderTop: '1px solid rgba(255, 255, 255, 0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.78rem' }}>
                            <div style={{ color: 'var(--text-muted)' }}>
                              Asked by <strong style={{ color: '#fff' }}>{dbt.studentId === user?.id ? 'You' : (dbt.isAnonymous ? 'Anonymous' : dbt.studentName)}</strong>
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

            </div>
          )}

          {/* ================================================================ */}
          {/* 7. ACADEMIC PERFORMANCE VIEW (Strict 1:1 Privacy & Subject Isolation) */}
          {/* ================================================================ */}
          {activeTab === 'academic-performance' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              {/* Privacy Notice Banner */}
              <div style={{ padding: '0.85rem 1.25rem', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.84rem', color: '#fff' }}>
                <Shield size={18} color="#34d399" style={{ flexShrink: 0 }} />
                <div>
                  <strong>Encrypted Student Record:</strong> You are viewing your personal academic progress. These grades are strictly isolated to your student profile.
                </div>
              </div>

              {/* Summary Metric Cards */}
              {academicPerfData?.summary && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
                  <div className="card" style={{ padding: '1.25rem', background: 'rgba(15, 23, 42, 0.75)', border: '1px solid var(--border-subtle)', borderRadius: '16px' }}>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>AVERAGE INTERNAL SCORE</div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#34d399', marginTop: '0.25rem' }}>
                      {academicPerfData.summary.averagePercentage}
                    </div>
                  </div>
                  <div className="card" style={{ padding: '1.25rem', background: 'rgba(15, 23, 42, 0.75)', border: '1px solid var(--border-subtle)', borderRadius: '16px' }}>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>OVERALL ATTENDANCE</div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--accent-cyan)', marginTop: '0.25rem' }}>
                      {academicPerfData.summary.averageAttendance}
                    </div>
                  </div>
                  <div className="card" style={{ padding: '1.25rem', background: 'rgba(15, 23, 42, 0.75)', border: '1px solid var(--border-subtle)', borderRadius: '16px' }}>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>GRADED COURSES</div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff', marginTop: '0.25rem' }}>
                      {academicPerfData.summary.totalSubjectsGraded}
                    </div>
                  </div>
                </div>
              )}

              {/* Subject Isolation Drilldown: Overview Grid vs Isolated Subject Detail */}
              {!selectedSubjectDetail ? (
                /* 1. Subject Cards Grid */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff' }}>
                      Course-Wise Performance Cards
                    </h3>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: '0.2rem 0 0 0' }}>
                      Click on any course card to inspect isolated grade breakdown, attendance standing and official professor remarks.
                    </p>
                  </div>

                  {(!academicPerfData?.records || academicPerfData.records.length === 0) ? (
                    <div className="card" style={{ padding: '4rem 1rem', textAlign: 'center', color: 'var(--text-muted)', borderRadius: '16px' }}>
                      <GraduationCap size={48} style={{ margin: '0 auto 1rem auto', opacity: 0.3 }} />
                      <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', fontWeight: 600 }}>No published marks yet</p>
                      <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Faculty will publish internal test scores and attendance evaluations shortly.</p>
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
                      {academicPerfData.records.map(rec => {
                        const scorePct = Math.round((rec.internalMarks / rec.maxMarks) * 100);
                        const statusColor = rec.performanceStatus === 'Excellent' ? '#34d399' : (rec.performanceStatus === 'Good' ? '#38bdf8' : (rec.performanceStatus === 'Average' ? '#fbbf24' : '#fb7185'));
                        return (
                          <div
                            key={rec.id}
                            onClick={() => setSelectedSubjectDetail(rec)}
                            className="card"
                            style={{
                              padding: '1.5rem',
                              background: 'rgba(15, 23, 42, 0.75)',
                              border: '1px solid var(--border-subtle)',
                              borderRadius: '18px',
                              cursor: 'pointer',
                              display: 'flex',
                              flexDirection: 'column',
                              justifyContent: 'space-between',
                              gap: '1.25rem',
                              transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
                            onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
                          >
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                                <span style={{ fontSize: '0.75rem', fontWeight: 800, padding: '0.2rem 0.6rem', borderRadius: '6px', background: 'rgba(99, 102, 241, 0.15)', color: 'var(--primary-light)' }}>
                                  {rec.subjectCode}
                                </span>
                                <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: '999px', background: `${statusColor}22`, color: statusColor }}>
                                  {rec.performanceStatus}
                                </span>
                              </div>

                              <h4 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#fff', lineHeight: 1.3 }}>
                                {rec.subjectName}
                              </h4>
                              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                                Instructor: {rec.facultyName} • {rec.credits} Credits
                              </div>
                            </div>

                            {/* Meters preview */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                              <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                                  <span>Internal Score</span>
                                  <strong style={{ color: '#34d399' }}>{rec.internalMarks} / {rec.maxMarks} ({scorePct}%)</strong>
                                </div>
                                <div style={{ height: '6px', borderRadius: '999px', background: 'rgba(255, 255, 255, 0.08)', overflow: 'hidden' }}>
                                  <div style={{ width: `${scorePct}%`, height: '100%', background: 'linear-gradient(90deg, #10b981, #059669)', borderRadius: '999px' }} />
                                </div>
                              </div>

                              <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                                  <span>Classroom Attendance</span>
                                  <strong style={{ color: 'var(--accent-cyan)' }}>{rec.attendancePercentage}%</strong>
                                </div>
                                <div style={{ height: '6px', borderRadius: '999px', background: 'rgba(255, 255, 255, 0.08)', overflow: 'hidden' }}>
                                  <div style={{ width: `${rec.attendancePercentage}%`, height: '100%', background: 'linear-gradient(90deg, #06b6d4, #0891b2)', borderRadius: '999px' }} />
                                </div>
                              </div>
                            </div>

                            <div style={{ paddingTop: '0.75rem', borderTop: '1px solid rgba(255, 255, 255, 0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--primary-light)', fontWeight: 700 }}>
                              <span>View Detailed Performance</span>
                              <ChevronRight size={16} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : (
                /* 2. Isolated Subject-Wise Performance Detail View */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  
                  {/* Subject Header & Back Button */}
                  <div className="card" style={{ padding: '1.5rem', background: 'rgba(15, 23, 42, 0.85)', border: '1px solid var(--border-subtle)', borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <button
                        onClick={() => setSelectedSubjectDetail(null)}
                        style={{
                          padding: '0.5rem 0.85rem',
                          borderRadius: '8px',
                          background: 'var(--bg-input)',
                          border: '1px solid var(--border-subtle)',
                          color: '#fff',
                          fontSize: '0.82rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.4rem'
                        }}
                      >
                        <ArrowLeft size={16} />
                        <span>All Subjects</span>
                      </button>

                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: 800, padding: '0.15rem 0.55rem', borderRadius: '6px', background: 'rgba(99, 102, 241, 0.2)', color: 'var(--primary-light)' }}>
                            {selectedSubjectDetail.subjectCode}
                          </span>
                          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                            {selectedSubjectDetail.credits} Academic Credits
                          </span>
                        </div>
                        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', marginTop: '0.2rem' }}>
                          {selectedSubjectDetail.subjectName}
                        </h2>
                        <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                          Course Faculty: <strong>Prof. {selectedSubjectDetail.facultyName}</strong>
                        </div>
                      </div>
                    </div>

                    <span style={{ fontSize: '0.85rem', fontWeight: 800, padding: '0.4rem 1rem', borderRadius: '999px', background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                      Standing: {selectedSubjectDetail.performanceStatus}
                    </span>
                  </div>

                  {/* 3-Metric Detailed Stat Cards for THIS SUBJECT ONLY */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
                    
                    {/* Internal Test Marks */}
                    <div className="card" style={{ padding: '1.5rem', background: 'rgba(15, 23, 42, 0.75)', border: '1px solid var(--border-subtle)', borderRadius: '16px' }}>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>INTERNAL TEST SCORE</div>
                      <div style={{ fontSize: '2rem', fontWeight: 800, color: '#34d399', marginTop: '0.35rem' }}>
                        {selectedSubjectDetail.internalMarks} <span style={{ fontSize: '1.1rem', color: 'var(--text-muted)' }}>/ {selectedSubjectDetail.maxMarks}</span>
                      </div>
                      <div style={{ marginTop: '0.75rem', height: '6px', borderRadius: '999px', background: 'rgba(255, 255, 255, 0.08)', overflow: 'hidden' }}>
                        <div style={{ width: `${Math.round((selectedSubjectDetail.internalMarks / selectedSubjectDetail.maxMarks) * 100)}%`, height: '100%', background: 'linear-gradient(90deg, #10b981, #059669)', borderRadius: '999px' }} />
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                        Percentage Score: {Math.round((selectedSubjectDetail.internalMarks / selectedSubjectDetail.maxMarks) * 100)}%
                      </div>
                    </div>

                    {/* Attendance Percentage */}
                    <div className="card" style={{ padding: '1.5rem', background: 'rgba(15, 23, 42, 0.75)', border: '1px solid var(--border-subtle)', borderRadius: '16px' }}>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>ATTENDANCE RECORD</div>
                      <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--accent-cyan)', marginTop: '0.35rem' }}>
                        {selectedSubjectDetail.attendancePercentage}%
                      </div>
                      <div style={{ marginTop: '0.75rem', height: '6px', borderRadius: '999px', background: 'rgba(255, 255, 255, 0.08)', overflow: 'hidden' }}>
                        <div style={{ width: `${selectedSubjectDetail.attendancePercentage}%`, height: '100%', background: 'linear-gradient(90deg, #06b6d4, #0891b2)', borderRadius: '999px' }} />
                      </div>
                      <div style={{ fontSize: '0.75rem', color: selectedSubjectDetail.attendancePercentage >= 75 ? '#34d399' : '#fb7185', marginTop: '0.5rem', fontWeight: 600 }}>
                        {selectedSubjectDetail.attendancePercentage >= 75 ? '✓ Meets mandatory 75% requirement' : '⚠ Attendance below required threshold'}
                      </div>
                    </div>

                    {/* Performance Status */}
                    <div className="card" style={{ padding: '1.5rem', background: 'rgba(15, 23, 42, 0.75)', border: '1px solid var(--border-subtle)', borderRadius: '16px' }}>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>EVALUATION STATUS</div>
                      <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff', marginTop: '0.35rem' }}>
                        {selectedSubjectDetail.performanceStatus}
                      </div>
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.65rem', lineHeight: 1.4 }}>
                        Official instructor assessment based on laboratory performance and internal test papers.
                      </p>
                    </div>

                  </div>

                  {/* Official Faculty Feedback Card */}
                  <div className="card" style={{ padding: '1.75rem', background: 'rgba(15, 23, 42, 0.85)', border: '1px solid var(--border-subtle)', borderRadius: '18px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'var(--primary-light)', fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.75rem' }}>
                      <MessageCircle size={18} />
                      <span>Official Faculty Feedback & Mentorship Advice</span>
                    </div>

                    <div style={{ padding: '1.25rem', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.02)', borderLeft: '4px solid var(--primary)', fontStyle: 'italic', fontSize: '0.95rem', color: '#fff', lineHeight: 1.6 }}>
                      "{selectedSubjectDetail.feedback || 'Consistent academic performance and positive laboratory engagement.'}"
                    </div>

                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.75rem', textAlign: 'right' }}>
                      — Evaluated by <strong>Prof. {selectedSubjectDetail.facultyName}</strong>
                    </div>
                  </div>

                </div>
              )}

            </div>
          )}

          {/* ================================================================ */}
          {/* 8. NOTIFICATIONS VIEW */}
          {/* ================================================================ */}
          {activeTab === 'notifications' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '900px', margin: '0 auto' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff' }}>Student Alerts Feed</h2>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: 0 }}>
                    Classroom shifts, timetable notifications & campus announcements
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
                      color: '#34d399',
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
                        background: n.isRead ? 'rgba(15, 23, 42, 0.6)' : 'rgba(16, 185, 129, 0.08)',
                        border: n.isRead ? '1px solid var(--border-subtle)' : '1px solid rgba(16, 185, 129, 0.3)',
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
                          background: 'rgba(16, 185, 129, 0.15)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#34d399',
                          flexShrink: 0
                        }}
                      >
                        <Bell size={20} />
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
          {/* 9. STUDENT PROFILE VIEW */}
          {/* ================================================================ */}
          {activeTab === 'profile' && (
            <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              <div className="card" style={{ padding: '2rem', background: 'rgba(15, 23, 42, 0.85)', border: '1px solid var(--border-subtle)', borderRadius: '20px' }}>
                
                {/* Avatar & Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '2rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--border-subtle)' }}>
                  <div
                    style={{
                      width: '72px',
                      height: '72px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #10b981, #06b6d4)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: '1.8rem',
                      color: '#fff',
                      boxShadow: '0 0 25px rgba(16, 185, 129, 0.4)'
                    }}
                  >
                    {user?.name ? user.name.charAt(0).toUpperCase() : 'S'}
                  </div>
                  <div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff' }}>{user?.name || 'Shifa Siddiqui'}</h2>
                    <div style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginTop: '2px' }}>{user?.email || 'student@college.edu'}</div>
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: '999px', background: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}>
                        Enrolled Student
                      </span>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: '999px', background: 'rgba(99, 102, 241, 0.15)', color: 'var(--primary-light)' }}>
                        Roll #{user?.rollNumber || '23'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Profile Data Fields */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
                  
                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Department
                    </label>
                    <div style={{ marginTop: '0.35rem', padding: '0.75rem 1rem', borderRadius: '10px', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', color: '#fff', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span>{user?.department || 'Computer Engineering'}</span>
                      <Lock size={12} color="var(--text-muted)" />
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Academic Year & Section
                    </label>
                    <div style={{ marginTop: '0.35rem', padding: '0.75rem 1rem', borderRadius: '10px', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', color: '#fff', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span>{user?.year || 'SE'} — Division {user?.division || 'B'}</span>
                      <Lock size={12} color="var(--text-muted)" />
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Current Semester
                    </label>
                    <div style={{ marginTop: '0.35rem', padding: '0.75rem 1rem', borderRadius: '10px', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', color: '#fff', fontWeight: 600 }}>
                      Semester {user?.year === 'SE' ? 4 : (user?.year === 'TE' ? 6 : (user?.year === 'BE' ? 8 : 2))}
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Academic Session
                    </label>
                    <div style={{ marginTop: '0.35rem', padding: '0.75rem 1rem', borderRadius: '10px', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', color: '#fff', fontWeight: 600 }}>
                      2026-2027
                    </div>
                  </div>

                </div>

                {/* Central Admin Security Card */}
                <div style={{ marginTop: '2rem', padding: '1rem', borderRadius: '12px', background: 'rgba(0, 0, 0, 0.25)', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  <Shield size={20} color="#34d399" style={{ flexShrink: 0 }} />
                  <div>
                    Academic class mapping and roll numbers are governed by Central Administration. Students cannot modify official cohort information.
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

      {/* 1. Contact Finder / Owner Modal */}
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
              maxWidth: '480px',
              padding: '1.75rem',
              background: '#0d1527',
              border: '1px solid var(--border-subtle)',
              borderRadius: '18px',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#fff' }}>
                Contact {contactModalItem.type === 'LOST' ? 'Owner' : 'Finder'}
              </h3>
              <button
                onClick={() => setContactModalItem(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.2rem' }}
              >
                ✕
              </button>
            </div>

            <div style={{ padding: '1rem', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>ITEM NAME</div>
              <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff', marginTop: '2px' }}>{contactModalItem.itemName}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--accent-cyan)', marginTop: '4px' }}>{contactModalItem.location} • {contactModalItem.date}</div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                You can reach the reporter securely via official college email:
              </div>
              <div style={{ padding: '0.75rem 1rem', borderRadius: '8px', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', color: '#34d399', fontWeight: 700, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Mail size={16} />
                <span>{contactModalItem.userEmail}</span>
              </div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                🔒 In accordance with campus privacy policies, personal phone numbers and private addresses are strictly hidden.
              </div>
            </div>

            <button
              onClick={() => setContactModalItem(null)}
              className="btn btn-primary"
              style={{ width: '100%', padding: '0.65rem', borderRadius: '8px' }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* 2. Edit Own Report Modal */}
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
              borderRadius: '18px',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#fff' }}>
                Edit Lost & Found Report
              </h3>
              <button
                onClick={() => setEditModalItem(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.2rem' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateReport} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.78rem', color: '#fff', fontWeight: 600 }}>Item Name</label>
                <input
                  type="text"
                  required
                  value={editForm.itemName}
                  onChange={(e) => setEditForm({ ...editForm, itemName: e.target.value })}
                  style={{ width: '100%', padding: '0.55rem 0.85rem', borderRadius: '8px', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', color: '#fff', fontSize: '0.85rem' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', color: '#fff', fontWeight: 600 }}>Category</label>
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
                  <label style={{ fontSize: '0.78rem', color: '#fff', fontWeight: 600 }}>Date</label>
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
                <label style={{ fontSize: '0.78rem', color: '#fff', fontWeight: 600 }}>Location</label>
                <input
                  type="text"
                  required
                  value={editForm.location}
                  onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                  style={{ width: '100%', padding: '0.55rem 0.85rem', borderRadius: '8px', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', color: '#fff', fontSize: '0.85rem' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', color: '#fff', fontWeight: 600 }}>Description</label>
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

      {/* 3. Delete Confirmation Modal */}
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

      {/* 4. Student Doubt Thread & Solutions Modal */}
      {selectedDoubtThread && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(6px)',
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
              maxWidth: '750px',
              maxHeight: '90vh',
              background: '#0d1527',
              border: '1px solid var(--border-subtle)',
              borderRadius: '20px',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden'
            }}
          >
            {/* Header */}
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff' }}>Doubt Discussion Thread</h3>
                {selectedDoubtThread.doubt?.isFacultyHelpRequested ? (
                  <span style={{ fontSize: '0.72rem', fontWeight: 800, padding: '0.15rem 0.55rem', borderRadius: '999px', background: 'rgba(245, 158, 11, 0.2)', color: '#fbbf24' }}>
                    🚨 HELP REQUESTED
                  </span>
                ) : selectedDoubtThread.doubt?.status === 'ANSWERED' ? (
                  <span style={{ fontSize: '0.72rem', fontWeight: 800, padding: '0.15rem 0.55rem', borderRadius: '999px', background: 'rgba(16, 185, 129, 0.2)', color: '#34d399' }}>
                    ✓ SOLVED
                  </span>
                ) : null}
              </div>
              <button
                onClick={() => setSelectedDoubtThread(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.2rem' }}
              >
                ✕
              </button>
            </div>

            {/* Body */}
            <div style={{ padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              {/* Question Card */}
              <div style={{ padding: '1.25rem', borderRadius: '14px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Posted by <strong style={{ color: '#fff' }}>{selectedDoubtThread.doubt?.studentId === user?.id ? 'You' : (selectedDoubtThread.doubt?.isAnonymous ? 'Anonymous Student' : selectedDoubtThread.doubt?.studentName)}</strong> • {selectedDoubtThread.doubt?.createdAt ? new Date(selectedDoubtThread.doubt.createdAt).toLocaleDateString() : 'Recent'}
                  </div>
                  {/* Escalate button */}
                  {!selectedDoubtThread.doubt?.isFacultyHelpRequested && selectedDoubtThread.doubt?.status === 'OPEN' && (
                    <button
                      onClick={() => handleRequestFacultyHelp(selectedDoubtThread.doubt.id)}
                      style={{
                        padding: '0.3rem 0.75rem',
                        borderRadius: '6px',
                        background: 'rgba(245, 158, 11, 0.15)',
                        border: '1px solid rgba(245, 158, 11, 0.4)',
                        color: '#fbbf24',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.3rem'
                      }}
                    >
                      <AlertCircle size={13} />
                      <span>Request Faculty Help</span>
                    </button>
                  )}
                </div>

                <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff', lineHeight: 1.35 }}>
                  {selectedDoubtThread.doubt?.title}
                </h2>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginTop: '0.5rem', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                  {selectedDoubtThread.doubt?.description}
                </p>
                {selectedDoubtThread.doubt?.imageUrl && (
                  <img
                    src={selectedDoubtThread.doubt.imageUrl}
                    alt="Doubt attachment"
                    style={{ marginTop: '0.75rem', maxHeight: '220px', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}
                  />
                )}
              </div>

              {/* Replies Thread */}
              <div>
                <h4 style={{ fontSize: '0.98rem', fontWeight: 700, color: '#fff', marginBottom: '0.75rem' }}>
                  Peer & Instructor Solutions ({selectedDoubtThread.replies?.length || 0})
                </h4>

                {(!selectedDoubtThread.replies || selectedDoubtThread.replies.length === 0) ? (
                  <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    No answers posted yet. Help your classmate by replying below!
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                    {selectedDoubtThread.replies.map(reply => {
                      const isFaculty = reply.authorRole === 'FACULTY' || reply.authorRole === 'faculty';
                      return (
                        <div
                          key={reply.id}
                          style={{
                            padding: '1.1rem',
                            borderRadius: '14px',
                            background: reply.isVerified ? 'rgba(16, 185, 129, 0.08)' : (isFaculty ? 'rgba(99, 102, 241, 0.08)' : 'rgba(255, 255, 255, 0.02)'),
                            border: reply.isVerified ? '1px solid rgba(16, 185, 129, 0.5)' : (isFaculty ? '1px solid rgba(99, 102, 241, 0.4)' : '1px solid var(--border-subtle)')
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <strong style={{ color: '#fff', fontSize: '0.88rem' }}>{reply.authorName}</strong>
                              <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '0.1rem 0.5rem', borderRadius: '4px', background: isFaculty ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255, 255, 255, 0.06)', color: isFaculty ? 'var(--primary-light)' : 'var(--text-muted)' }}>
                                {isFaculty ? 'Faculty Instructor' : 'Classmate'}
                              </span>
                            </div>

                            {reply.isVerified ? (
                              <span style={{ fontSize: '0.72rem', fontWeight: 800, padding: '0.2rem 0.65rem', borderRadius: '999px', background: '#10b981', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                <CheckCircle size={13} />
                                <span>VERIFIED ANSWER</span>
                              </span>
                            ) : null}
                          </div>

                          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.45, margin: 0, whiteSpace: 'pre-wrap' }}>
                            {reply.replyText}
                          </p>

                          {reply.imageUrl && (
                            <img
                              src={reply.imageUrl}
                              alt="Solution attachment"
                              style={{ marginTop: '0.65rem', maxHeight: '180px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Reply Input Form */}
              <form onSubmit={handleReplyStudentDoubt} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)' }}>
                <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#fff' }}>Post Your Explanation or Solution</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Explain step-by-step or share your notes/code..."
                  value={studentReplyText}
                  onChange={(e) => setStudentReplyText(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', color: '#fff', fontSize: '0.85rem' }}
                />

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <input
                    type="url"
                    placeholder="Optional image/diagram URL..."
                    value={studentReplyImageUrl}
                    onChange={(e) => setStudentReplyImageUrl(e.target.value)}
                    style={{ flex: 1, minWidth: '220px', padding: '0.5rem 0.75rem', borderRadius: '8px', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', color: '#fff', fontSize: '0.82rem' }}
                  />

                  <button
                    type="submit"
                    disabled={doubtActionLoading}
                    style={{
                      padding: '0.55rem 1.25rem',
                      borderRadius: '8px',
                      background: 'var(--primary)',
                      border: 'none',
                      color: '#fff',
                      fontWeight: 700,
                      fontSize: '0.84rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem'
                    }}
                  >
                    <Send size={14} />
                    <span>{doubtActionLoading ? 'Posting...' : 'Post Reply'}</span>
                  </button>
                </div>
              </form>

            </div>
          </div>
        </div>
      )}

      {/* 5. Student Post a Doubt Modal */}
      {isPostDoubtModalOpen && selectedDoubtPage && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(6px)',
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
              maxWidth: '550px',
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
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff' }}>
                  Ask a Doubt
                </h3>
                <div style={{ fontSize: '0.78rem', color: 'var(--primary-light)', marginTop: '2px' }}>
                  Forum: {selectedDoubtPage.title}
                </div>
              </div>
              <button
                onClick={() => setIsPostDoubtModalOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.2rem' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateStudentDoubt} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.78rem', color: '#fff', fontWeight: 600 }}>Question Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. How does method overriding work with interface defaults in Java 8?"
                  value={postDoubtForm.title}
                  onChange={(e) => setPostDoubtForm({ ...postDoubtForm, title: e.target.value })}
                  style={{ width: '100%', marginTop: '0.35rem', padding: '0.6rem 0.85rem', borderRadius: '8px', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', color: '#fff', fontSize: '0.85rem' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', color: '#fff', fontWeight: 600 }}>Detailed Problem / Code Snippet *</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Describe your confusion, what you tried, or paste your error output..."
                  value={postDoubtForm.description}
                  onChange={(e) => setPostDoubtForm({ ...postDoubtForm, description: e.target.value })}
                  style={{ width: '100%', marginTop: '0.35rem', padding: '0.6rem 0.85rem', borderRadius: '8px', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', color: '#fff', fontSize: '0.85rem' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', color: '#fff', fontWeight: 600 }}>Optional Screenshot / Diagram URL</label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={postDoubtForm.imageUrl}
                  onChange={(e) => setPostDoubtForm({ ...postDoubtForm, imageUrl: e.target.value })}
                  style={{ width: '100%', marginTop: '0.35rem', padding: '0.6rem 0.85rem', borderRadius: '8px', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', color: '#fff', fontSize: '0.85rem' }}
                />
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={postDoubtForm.isAnonymous}
                  onChange={(e) => setPostDoubtForm({ ...postDoubtForm, isAnonymous: e.target.checked })}
                  style={{ width: '16px', height: '16px', accentColor: 'var(--primary)' }}
                />
                <span>Post anonymously (hide my name from classmates)</span>
              </label>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setIsPostDoubtModalOpen(false)}
                  style={{ flex: 1, padding: '0.65rem', borderRadius: '8px', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', color: '#fff', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={doubtActionLoading}
                  style={{ flex: 1, padding: '0.65rem', borderRadius: '8px', background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none', color: '#fff', fontWeight: 700, cursor: 'pointer' }}
                >
                  {doubtActionLoading ? 'Posting...' : 'Submit Doubt'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
