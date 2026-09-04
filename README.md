# 🎓 College Management System (CMS)

A modern, full-stack, enterprise-grade College Management System built with **React (Vite)**, **Node.js / Express**, **SQLite (Native Node 22 DatabaseSync)**, and **TailwindCSS / Lucide Icons**.

---

## 🌟 Key Features

### 1. 🔐 Unified Authentication & Role-Based Access Control (RBAC)
- **Single Login Portal** (`/login`) with automatic role detection and redirect.
- Protected routes with JWT verification & secure authorization for **Admin**, **Faculty**, and **Student** roles.
- Comprehensive demo credentials for quick exploration.

### 2. 👑 Admin Management Suite
- **Interactive KPI Dashboard** with real-time analytics on students, faculty, classrooms, classes, and notifications.
- **Student Management**: Full CRUD with roll number validation, email formatting, cohort assignment, search, and filtering.
- **Faculty Management**: Staff registry, department allocation, designation, and subject expertise management.
- **Class & Section Management**: Course/department mapping, batch years, section capacity, and semester planning.
- **Classroom Management**: Room numbering, capacity checks, building/floor mapping, facility tags (Projector, Smart Board, AC, Lab equipment), and status tracking.
- **Smart Timetable Engine & Triple-Conflict Detection**:
  - `ROOM_CONFLICT`: Detects room double-booking.
  - `FACULTY_CONFLICT`: Prevents overlapping lecture assignments for faculty.
  - `CLASS_CONFLICT`: Eliminates simultaneous class schedule overlaps.
- **Global Broadcast Notifications**: Real-time notifications dispatched to students, faculty, or all campus members.

### 3. 👨‍🏫 Faculty Portal
- **Personal Schedule**: Real-time timetable view isolated to the logged-in faculty with slot indicators and current/upcoming lecture highlights.
- **Classroom Vacancy Matrix**: Real-time inspection of campus classrooms by day and time slot to find available rooms.
- **Club & Event Management**: Create, manage, and coordinate campus clubs and extracurricular events.
- **Doubt Discussion Forum**: Answer student questions across departments, post solutions, and mark official verified answers.
- **Academic Performance & Grading**: Gradebook with automatic GPA/grade computation, internal/external exam marks entry, and batch publishing.

### 4. 👨‍🎓 Student Portal
- **Student Dashboard**: Live summary of enrolled class, current & next lecture countdown, unread announcements, and academic standing.
- **Class Timetable**: Dynamic weekly schedule with room, subject, and faculty details.
- **Club & Event Registrations**: Explore clubs, join with live seat availability counters, register for campus hackathons/workshops, and download/view confirmation passes.
- **Campus Lost & Found**: Report lost items, browse unclaimed belongings with high-res photos and location tags, and track claimed/returned history.
- **Smart Doubt Forum**: Ask academic doubts with tags and code/math descriptions, upvote queries, and view verified instructor answers.
- **Academic Report Card**: Instant 1:1 view of grades, CGPA, semester breakdowns, and performance analytics.

---

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite, TailwindCSS, Lucide Icons, Canvas Confetti
- **Backend**: Node.js (ES Modules), Express.js, JWT (`jsonwebtoken`), `bcryptjs`, CORS
- **Database**: SQLite with Node.js built-in `node:sqlite` (`DatabaseSync`)
- **Testing**: Automated end-to-end API & integration testing suite (over 300 test cases)

---

## 🚀 Getting Started

### Prerequisites
- Node.js >= 18.x (Node 22 recommended)
- npm or yarn

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/shifasiddiqu30/College-Management-System.git
   cd College-Management-System
   ```

2. **Install dependencies**:
   ```bash
   # Install root, backend, and frontend dependencies
   npm install
   cd server && npm install && cd ..
   cd client && npm install && cd ..
   ```

3. **Start the Development Servers**:
   ```bash
   npm run dev
   ```
   - **Backend API**: `http://localhost:5000`
   - **Frontend UI**: `http://localhost:5173` (LAN accessible via `0.0.0.0`)

---

## 🔑 Demo Login Credentials

| Role | Email | Password |
| :--- | :--- | :--- |
| **Admin** | `admin@college.edu` | `admin123` |
| **Faculty** | `rajesh.sharma@college.edu` | `faculty123` |
| **Faculty** | `priya.patel@college.edu` | `faculty123` |
| **Student** | `aarav.sharma@student.college.edu` | `student123` |
| **Student** | `diya.patel@student.college.edu` | `student123` |

---

## 🧪 Running Automated Tests

```bash
cd server
node test_final_system_suite.js
```

---

## 📄 License
This project is open source and available under the [MIT License](LICENSE).
