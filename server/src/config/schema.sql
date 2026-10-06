-- ============================================================================
-- College Management System - Database Schema (Part 1, 2, 3 & 4 Enhanced)
-- ============================================================================

-- 1. Core Users Table (Authentication & RBAC)
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('ADMIN', 'FACULTY', 'STUDENT')),
    department TEXT,
    year TEXT,                    -- e.g. "SE", "TE", "BE", "1st Year"
    division TEXT,                -- e.g. "A", "B", "C"
    roll_number TEXT,             -- e.g. "23"
    enrollment_number TEXT,       -- e.g. "12502026"
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK(status IN ('ACTIVE', 'SUSPENDED', 'PENDING')),
    assigned_subjects TEXT,       -- JSON Array of subject strings / IDs (Faculty)
    assigned_classes TEXT,        -- JSON Array of class strings / IDs (Faculty)
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Index for instant email lookups during authentication
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- ============================================================================
-- 2. ACADEMIC & INFRASTRUCTURE TABLES
-- ============================================================================

-- Departments
CREATE TABLE IF NOT EXISTS departments (
    id TEXT PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    code TEXT UNIQUE NOT NULL,
    hod_name TEXT,
    status TEXT NOT NULL DEFAULT 'Active' CHECK(status IN ('Active', 'Inactive')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Classrooms & Infrastructure
CREATE TABLE IF NOT EXISTS classrooms (
    id TEXT PRIMARY KEY,
    room_number TEXT UNIQUE NOT NULL,
    classroom_type TEXT NOT NULL DEFAULT 'Classroom',
    building TEXT NOT NULL,
    floor TEXT NOT NULL DEFAULT '1st Floor',
    capacity INTEGER NOT NULL DEFAULT 60,
    status TEXT NOT NULL DEFAULT 'Active',
    has_projector BOOLEAN DEFAULT 1,
    is_available BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_classrooms_room ON classrooms(room_number);
CREATE INDEX IF NOT EXISTS idx_classrooms_type ON classrooms(classroom_type);

-- Academic Subjects
CREATE TABLE IF NOT EXISTS subjects (
    id TEXT PRIMARY KEY,
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    department TEXT NOT NULL,
    semester INTEGER,
    credits INTEGER DEFAULT 3
);

-- Classes & Sections (Department -> Year -> Division)
CREATE TABLE IF NOT EXISTS classes (
    id TEXT PRIMARY KEY,
    department TEXT NOT NULL,
    year TEXT NOT NULL,
    division TEXT NOT NULL,
    class_teacher_id TEXT REFERENCES users(id),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(department, year, division)
);

-- Timetable Module
CREATE TABLE IF NOT EXISTS timetables (
    id TEXT PRIMARY KEY,
    class_id TEXT NOT NULL REFERENCES classes(id),
    day_of_week TEXT NOT NULL,
    period_number INTEGER DEFAULT 1,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    subject_id TEXT REFERENCES subjects(id),
    faculty_id TEXT REFERENCES users(id),
    classroom_id TEXT REFERENCES classrooms(id),
    semester INTEGER DEFAULT 4,
    academic_year TEXT DEFAULT '2026-2027',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_timetables_class ON timetables(class_id);
CREATE INDEX IF NOT EXISTS idx_timetables_faculty ON timetables(faculty_id);
CREATE INDEX IF NOT EXISTS idx_timetables_classroom ON timetables(classroom_id);
CREATE INDEX IF NOT EXISTS idx_timetables_day ON timetables(day_of_week);

-- ============================================================================
-- 3. PERSONAL SCHEDULE / REMINDERS (Strictly Private to Faculty/User)
-- ============================================================================
CREATE TABLE IF NOT EXISTS personal_schedules (
    id TEXT PRIMARY KEY,
    faculty_id TEXT NOT NULL REFERENCES users(id),
    title TEXT NOT NULL,
    task_date DATE NOT NULL,
    task_time TEXT,
    note TEXT,
    category TEXT DEFAULT 'Task',
    priority TEXT DEFAULT 'Medium',
    is_completed BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_personal_schedules_faculty ON personal_schedules(faculty_id);

-- Legacy compatibility table
CREATE TABLE IF NOT EXISTS personal_reminders (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id),
    title TEXT NOT NULL,
    due_date DATETIME,
    is_completed BOOLEAN DEFAULT 0
);

-- ============================================================================
-- 4. CLUBS & CAMPUS EVENTS (Faculty Management & Student Registration)
-- ============================================================================
CREATE TABLE IF NOT EXISTS clubs (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT,
    coordinator_id TEXT REFERENCES users(id),
    max_seats INTEGER DEFAULT 30,
    available_seats INTEGER DEFAULT 30,
    registration_start_date DATE,
    registration_end_date DATE,
    status TEXT DEFAULT 'Registration Open',
    banner_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS club_registrations (
    id TEXT PRIMARY KEY,
    club_id TEXT NOT NULL REFERENCES clubs(id),
    student_id TEXT NOT NULL REFERENCES users(id),
    student_name TEXT NOT NULL,
    student_email TEXT NOT NULL,
    roll_number TEXT,
    department TEXT,
    year TEXT,
    division TEXT,
    status TEXT DEFAULT 'Registered',
    registered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(club_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_club_regs_club ON club_registrations(club_id);
CREATE INDEX IF NOT EXISTS idx_club_regs_student ON club_registrations(student_id);

CREATE TABLE IF NOT EXISTS club_events (
    id TEXT PRIMARY KEY,
    club_id TEXT REFERENCES clubs(id),
    title TEXT NOT NULL,
    description TEXT,
    event_date DATE NOT NULL,
    event_time TEXT,
    venue TEXT NOT NULL,
    registration_start_date DATE,
    registration_last_date DATE,
    coordinator_id TEXT REFERENCES users(id),
    status TEXT DEFAULT 'Upcoming',
    banner_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS event_registrations (
    id TEXT PRIMARY KEY,
    event_id TEXT NOT NULL REFERENCES club_events(id),
    student_id TEXT NOT NULL REFERENCES users(id),
    student_name TEXT NOT NULL,
    student_email TEXT NOT NULL,
    roll_number TEXT,
    department TEXT,
    year TEXT,
    division TEXT,
    registered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(event_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_event_regs_event ON event_registrations(event_id);
CREATE INDEX IF NOT EXISTS idx_event_regs_student ON event_registrations(student_id);

-- ============================================================================
-- 5. SMART DOUBT DISCUSSION FORUM, ANNOUNCEMENTS & FAQS
-- ============================================================================
CREATE TABLE IF NOT EXISTS doubt_pages (
    id TEXT PRIMARY KEY,
    faculty_id TEXT NOT NULL REFERENCES users(id),
    department TEXT NOT NULL,
    year TEXT NOT NULL,
    division TEXT NOT NULL,
    subject_id TEXT REFERENCES subjects(id),
    title TEXT NOT NULL,
    description TEXT,
    semester INTEGER DEFAULT 4,
    authorized_emails TEXT, -- JSON Array of student emails with explicit access
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_doubt_pages_faculty ON doubt_pages(faculty_id);
CREATE INDEX IF NOT EXISTS idx_doubt_pages_class ON doubt_pages(department, year, division);

CREATE TABLE IF NOT EXISTS doubts (
    id TEXT PRIMARY KEY,
    page_id TEXT REFERENCES doubt_pages(id),
    student_id TEXT NOT NULL REFERENCES users(id),
    faculty_id TEXT REFERENCES users(id),
    subject_id TEXT REFERENCES subjects(id),
    department TEXT NOT NULL,
    year TEXT,
    division TEXT,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    image_url TEXT,
    is_anonymous BOOLEAN DEFAULT 0,
    is_faculty_help_requested BOOLEAN DEFAULT 0,
    status TEXT DEFAULT 'OPEN' CHECK(status IN ('OPEN', 'PENDING_FACULTY_HELP', 'ANSWERED', 'CLOSED')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_doubts_page ON doubts(page_id);
CREATE INDEX IF NOT EXISTS idx_doubts_faculty ON doubts(faculty_id);
CREATE INDEX IF NOT EXISTS idx_doubts_student ON doubts(student_id);

CREATE TABLE IF NOT EXISTS doubt_replies (
    id TEXT PRIMARY KEY,
    doubt_id TEXT NOT NULL REFERENCES doubts(id),
    author_id TEXT NOT NULL REFERENCES users(id),
    reply_text TEXT NOT NULL,
    image_url TEXT,
    is_faculty_endorsed BOOLEAN DEFAULT 0,
    is_verified BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_doubt_replies_doubt ON doubt_replies(doubt_id);

CREATE TABLE IF NOT EXISTS announcements (
    id TEXT PRIMARY KEY,
    faculty_id TEXT NOT NULL REFERENCES users(id),
    department TEXT NOT NULL,
    year TEXT NOT NULL,
    division TEXT NOT NULL,
    subject_id TEXT REFERENCES subjects(id),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    priority TEXT DEFAULT 'Normal',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_announcements_class ON announcements(department, year, division);

CREATE TABLE IF NOT EXISTS faqs (
    id TEXT PRIMARY KEY,
    page_id TEXT REFERENCES doubt_pages(id),
    faculty_id TEXT NOT NULL REFERENCES users(id),
    subject_id TEXT REFERENCES subjects(id),
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    is_pinned BOOLEAN DEFAULT 1,
    display_order INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_faqs_page ON faqs(page_id);

-- ============================================================================
-- 6. ACADEMIC PERFORMANCE & ATTENDANCE (Strict 1:1 Student Privacy)
-- ============================================================================
CREATE TABLE IF NOT EXISTS academic_performance (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL REFERENCES users(id),
    faculty_id TEXT NOT NULL REFERENCES users(id),
    subject_id TEXT NOT NULL REFERENCES subjects(id),
    department TEXT NOT NULL,
    year TEXT NOT NULL,
    division TEXT NOT NULL,
    internal_marks REAL DEFAULT 0,
    max_marks REAL DEFAULT 20,
    attendance_percentage REAL DEFAULT 0,
    performance_status TEXT DEFAULT 'Good' CHECK(performance_status IN ('Excellent', 'Good', 'Average', 'Needs Improvement')),
    feedback TEXT,
    is_published BOOLEAN DEFAULT 1,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, subject_id)
);

CREATE INDEX IF NOT EXISTS idx_acad_perf_student ON academic_performance(student_id);
CREATE INDEX IF NOT EXISTS idx_acad_perf_faculty ON academic_performance(faculty_id);
CREATE INDEX IF NOT EXISTS idx_acad_perf_class ON academic_performance(department, year, division);

CREATE TABLE IF NOT EXISTS attendance_records (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL REFERENCES users(id),
    subject_id TEXT NOT NULL REFERENCES subjects(id),
    department TEXT NOT NULL,
    year TEXT NOT NULL,
    division TEXT NOT NULL,
    date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'PRESENT' CHECK(status IN ('PRESENT', 'ABSENT', 'LATE')),
    marked_by TEXT REFERENCES users(id),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, subject_id, date)
);

CREATE INDEX IF NOT EXISTS idx_att_rec_class_subj ON attendance_records(department, year, division, subject_id, date);
CREATE INDEX IF NOT EXISTS idx_att_rec_student ON attendance_records(student_id);

CREATE TABLE IF NOT EXISTS attendance_summaries (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL REFERENCES users(id),
    subject_id TEXT NOT NULL REFERENCES subjects(id),
    department TEXT NOT NULL,
    year TEXT NOT NULL,
    division TEXT NOT NULL,
    start_date DATE,
    end_date DATE,
    total_conducted INTEGER NOT NULL DEFAULT 0,
    total_present INTEGER NOT NULL DEFAULT 0,
    total_absent INTEGER NOT NULL DEFAULT 0,
    total_late INTEGER NOT NULL DEFAULT 0,
    attendance_percentage REAL NOT NULL DEFAULT 0.0,
    is_defaulter BOOLEAN NOT NULL DEFAULT 0,
    is_published BOOLEAN NOT NULL DEFAULT 0,
    published_at DATETIME,
    published_by TEXT REFERENCES users(id),
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, subject_id, department, year, division)
);

CREATE INDEX IF NOT EXISTS idx_att_sum_class_subj ON attendance_summaries(department, year, division, subject_id);
CREATE INDEX IF NOT EXISTS idx_att_sum_student ON attendance_summaries(student_id);
CREATE INDEX IF NOT EXISTS idx_att_sum_defaulter ON attendance_summaries(is_defaulter);


-- ============================================================================
-- 7. NOTIFICATIONS & BROADCASTS
-- ============================================================================
CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES users(id),
    target_role TEXT DEFAULT 'ALL',
    type TEXT DEFAULT 'GENERAL',
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT 0,
    link TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_role ON notifications(target_role);

-- ============================================================================
-- 8. CAMPUS LOST & FOUND HUB (Part 6)
-- ============================================================================
CREATE TABLE IF NOT EXISTS lost_found_items (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id),
    user_name TEXT NOT NULL,
    user_email TEXT NOT NULL,
    user_role TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('LOST', 'FOUND')),
    item_name TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT NOT NULL,
    location TEXT NOT NULL,
    date DATE NOT NULL,
    photo_url TEXT,
    status TEXT DEFAULT 'ACTIVE' CHECK(status IN ('ACTIVE', 'RETURNED')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    returned_at DATETIME
);

CREATE INDEX IF NOT EXISTS idx_lf_user ON lost_found_items(user_id);
CREATE INDEX IF NOT EXISTS idx_lf_type_status ON lost_found_items(type, status);
CREATE INDEX IF NOT EXISTS idx_lf_category ON lost_found_items(category);

-- Legacy compatibility tables
CREATE TABLE IF NOT EXISTS lost_items (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    location_lost TEXT NOT NULL,
    date_lost DATE NOT NULL,
    reported_by TEXT REFERENCES users(id),
    status TEXT DEFAULT 'OPEN' CHECK(status IN ('OPEN', 'RESOLVED'))
);

CREATE TABLE IF NOT EXISTS found_items (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    location_found TEXT NOT NULL,
    date_found DATE NOT NULL,
    stored_at TEXT NOT NULL,
    reported_by TEXT REFERENCES users(id),
    status TEXT DEFAULT 'UNCLAIMED' CHECK(status IN ('UNCLAIMED', 'CLAIMED'))
);

