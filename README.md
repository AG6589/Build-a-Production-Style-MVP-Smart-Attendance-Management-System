# Smart Attendance Management System (Enterprise MVP)

A production-style, role-based **Smart Attendance Management System** designed for higher education institutions (~5,000 students, 200 faculty, departments, sections, and subjects). The system streamlines attendance recording, submission locking, formal two-stage corrections, audit trail compliance, configurable low-attendance monitoring, and department-level reporting with CSV export.

---

## 1. Project Overview & Problem Statement

College attendance tracking in large institutions often suffers from:
- **Dispersed Paper Rosters**: Prone to loss, manual calculation errors, and slow aggregation.
- **Silent Tampering**: Faculty or staff modifying historical registers without auditability.
- **Delayed Student Warnings**: Students discovering they are below mandatory thresholds (e.g. 75%) right before final exams.
- **Lack of Dispute Resolution**: No transparent channel for students to contest incorrect absences (e.g., biometric scanner lag, on-duty extracurricular participation).

This system provides a session-based attendance platform with role-based access control, draft saving, submission locking, reviewer-governed correction workflows, automated threshold monitoring, and an immutable audit log.

---

## 2. Technology Stack

- **Frontend**: React 18, Vite, JavaScript, Tailwind CSS v4, React Router v6, Axios, Recharts, Lucide Icons.
- **Backend**: Node.js 22, Express.js REST API.
- **Database**: MongoDB & Mongoose (featuring an automatic zero-configuration embedded memory server fallback if no local MongoDB instance is detected).
- **Authentication**: JWT authentication with bcrypt password hashing.
- **Testing**: Jest, Supertest.

---

## 3. Architecture & Design

```
smart-attendance-system/
├── backend/
│   ├── src/
│   │   ├── config/          # DB connection & JWT settings
│   │   ├── controllers/     # Express route handlers
│   │   ├── middleware/      # JWT auth, role gatekeeper, error handler
│   │   ├── models/          # 13 normalized Mongoose models
│   │   ├── routes/          # RESTful endpoint definitions
│   │   ├── seeds/           # Comprehensive initial seed data generator
│   │   ├── utils/           # Audit logger & threshold helpers
│   │   ├── app.js           # Express app setup & CORS
│   │   └── server.js        # Server bootstrapper & auto-seeder
│   └── tests/               # Supertest API & calculation unit test suite
├── frontend/
│   ├── src/
│   │   ├── api/             # Axios client with interceptors
│   │   ├── components/      # Badges, StatCards, Modals, Navbar, Sidebar
│   │   ├── context/         # AuthContext & Session management
│   │   ├── pages/           # Admin, Faculty, Student, Reviewer dashboards & modules
│   │   └── App.jsx          # Route definitions & protected route guards
├── docs/
│   ├── approach.md          # In-depth product thinking document
│   └── AI_USAGE_REPORT.md   # AI transparency & manual verification report
└── README.md
```

---

## 4. User Roles & Capabilities

| Role | Key Capabilities |
| :--- | :--- |
| **Admin** | Full system administration, manage users, academic hierarchy (Departments, Classes, Sections, Subjects), view institution-wide metrics, configure attendance threshold, inspect immutable audit trail. |
| **Faculty** | View assigned courses, create session rosters, mark individual/bulk attendance, save drafts, submit & lock sessions, monitor at-risk low attendance students. |
| **Student** | View overall attendance percentage, subject-wise breakdown, receive low attendance warnings (< 75%), file formal correction petitions with justifications. |
| **Reviewer** | Review department attendance correction petitions, evaluate student/faculty rationale, approve (updates attendance record & logs audit) or reject (records mandatory reason). |

---

## 5. Demo Credentials (1-Click Login)

The login screen features **1-Click Quick Fill** buttons for immediate evaluation:

| Persona | Email | Password | Role |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@college.edu` | `Admin@123` | `admin` |
| **Faculty** | `faculty.cs1@college.edu` | `Faculty@123` | `faculty` |
| **Student** | `student.rahul@college.edu` | `Student@123` | `student` |
| **Reviewer** | `reviewer.cs@college.edu` | `Reviewer@123` | `reviewer` |

*Note: You can also use the **"Switch Role"** dropdown in the top navbar to seamlessly jump between personas without logging out!*

---

## 6. Main Workflows

### 6.1 Session-Based Attendance Workflow
1. Faculty selects assigned Course and Section (e.g. `CS301 - Database Management Systems`, Section `CSE-A`).
2. System loads student roster with default Present status.
3. Faculty uses quick controls: **Mark All Present**, **Mark All Absent**, or toggles individual students (`P` / `A`).
4. **Draft Mode**: Faculty can click **Save Draft** to store progress while keeping records editable.
5. **Final Submission**: Faculty clicks **Submit Attendance** and confirms via modal. The session status transitions to `SUBMITTED` and is **locked against direct editing**.
6. Background check detects if any student fell below the attendance threshold and triggers notifications.

### 6.2 Attendance Correction Workflow
1. If an absence was recorded in error, Student or Faculty opens **Attendance Correction Requests** and selects the session.
2. User specifies requested status (`PRESENT`), provides justification (e.g. "On-duty competition", "Biometric lag"), and submits. Request status is `PENDING`.
3. Reviewer/Admin inspects the request in their review queue.
4. **If Approved**: Attendance record is updated, session counts recalculate, request marked `APPROVED`, student is notified, and a structured `AuditLog` entry is written.
5. **If Rejected**: Attendance remains unchanged, mandatory rejection reason is recorded, request marked `REJECTED`, and audit log is written.

### 6.3 Configurable Low Attendance Monitoring
- Minimum threshold is configurable by Admin via **System Settings** (default: `75%`).
- Calculations handle boundary conditions and zero classes (`0/0` safely returns `0%` without division-by-zero).
- Dashboards prominently highlight at-risk students with warning badges and notifications.

---

## 7. Edge Cases Handled

1. **Submission Double-Lock**: Submitted sessions reject subsequent draft modifications with a `400 Session already submitted and locked` error.
2. **Duplicate Attendance Prevention**: Mongoose compound index `{ session: 1, student: 1 }` with a unique constraint prevents multiple records for the same student in a single session.
3. **Cascade Deletion Prevention**: Departments cannot be deleted if active classes, subjects, students, or faculty are linked.
4. **Zero-Session Division Safety**: Attendance calculations verify total classes before dividing, avoiding NaN or division-by-zero errors.
5. **Conflict Prevention on Corrections**: Only one `PENDING` correction request is permitted per attendance record.
6. **Cross-Role Authorization**: Route middleware blocks unauthorized access (e.g. students cannot access audit logs or admin settings).

---

## 8. How to Run Locally

### Prerequisites
- Node.js (v18+)
- npm (v9+)
- *(Optional)* Local MongoDB running on `mongodb://localhost:27017`. If MongoDB is not running, the system **automatically starts an embedded in-memory MongoDB instance**!

### Step 1: Start Backend API
```bash
cd backend
npm install
npm run dev
```
*The backend API will start on `http://localhost:5000`. On first boot, it automatically seeds 55+ students, 10 faculty, subjects, sessions, correction requests, and audit logs.*

### Step 2: Start Frontend Application
In a separate terminal:
```bash
cd frontend
npm install
npm run dev
```
*Open `http://localhost:5173` in your browser.*

---

## 9. Running Automated Tests

To run the backend integration and calculation test suite:
```bash
cd backend
npm test
```
The test suite covers:
- User login, invalid credentials, and role authorization.
- Attendance session creation, draft saving, submission lock, and duplicate prevention.
- Correction request creation, reviewer approval/rejection, and audit log generation.
- Attendance percentage edge cases and threshold boundary calculations.

---

## 10. API Endpoints Overview

| Method | Endpoint | Description | Role Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Authenticate user & return JWT token | Public |
| `GET` | `/api/auth/me` | Current authenticated user & profile | Authenticated |
| `GET` | `/api/dashboard/stats` | Role-tailored dashboard metrics & charts | Authenticated |
| `POST` | `/api/attendance/sessions` | Create or retrieve attendance session | Faculty, Admin |
| `GET` | `/api/attendance/sessions` | Query session history with filters | Authenticated |
| `PUT` | `/api/attendance/sessions/:id/draft`| Save attendance draft | Faculty, Admin |
| `POST` | `/api/attendance/sessions/:id/submit`| Submit & lock attendance session | Faculty, Admin |
| `POST` | `/api/corrections` | Submit correction petition | Student, Faculty |
| `GET` | `/api/corrections` | List correction requests (role scoped) | Authenticated |
| `PUT` | `/api/corrections/:id/approve` | Approve correction petition | Reviewer, Admin |
| `PUT` | `/api/corrections/:id/reject` | Reject correction petition | Reviewer, Admin |
| `GET` | `/api/reports/subject/:id` | Course attendance compliance report | Faculty, Reviewer, Admin |
| `GET` | `/api/reports/export-csv` | Export course report as CSV | Faculty, Reviewer, Admin |
| `GET` | `/api/audit-logs` | Query system audit trail | Admin |
| `GET` | `/api/settings` | Get configurable policies & threshold | Authenticated |
| `PUT` | `/api/settings` | Update attendance threshold | Admin |
