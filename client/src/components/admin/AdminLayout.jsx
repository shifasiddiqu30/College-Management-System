import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';

export default function AdminLayout() {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const location = useLocation();

  // Determine dynamic title & subtitle based on path
  const getHeaderMeta = () => {
    const path = location.pathname;
    if (path.includes('/admin/students')) {
      return { title: 'Student Management', subtitle: 'Enroll, search, filter and manage student academic profiles' };
    }
    if (path.includes('/admin/faculty')) {
      return { title: 'Faculty Management', subtitle: 'Manage professors, department affiliations, subjects & class assignments' };
    }
    if (path.includes('/admin/classrooms')) {
      return { title: 'Classroom Management', subtitle: 'Campus infrastructure, laboratory capacity & block allocations' };
    }
    if (path.includes('/admin/classes')) {
      return { title: 'Class & Section Hierarchy', subtitle: 'Manage Department → Year → Division mappings & section teachers' };
    }
    if (path.includes('/admin/classroom-availability')) {
      return { title: 'Classroom Availability Checker', subtitle: 'Real-time infrastructure occupancy & clash-free schedule matrix' };
    }
    if (path.includes('/admin/timetable')) {
      return { title: 'Master Timetable Engine', subtitle: 'Schedule generation & slot allocation matrix (Coming in Part 3)' };
    }
    if (path.includes('/admin/notifications')) {
      return { title: 'Campus Broadcasts & Circulars', subtitle: 'Announcements, target alerts & notification center' };
    }
    if (path.includes('/admin/profile')) {
      return { title: 'Admin Account & Security', subtitle: 'System administrator profile & privileged session overview' };
    }
    return { title: 'Admin Dashboard', subtitle: 'Central overview of college operations, students, faculty and infrastructure' };
  };

  const { title, subtitle } = getHeaderMeta();

  return (
    <div className="admin-layout">
      <AdminSidebar
        isMobileOpen={isMobileOpen}
        closeMobileSidebar={() => setIsMobileOpen(false)}
      />

      <div className="admin-main-wrapper">
        <AdminHeader
          title={title}
          subtitle={subtitle}
          toggleMobileSidebar={() => setIsMobileOpen(!isMobileOpen)}
        />

        <main className="admin-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
