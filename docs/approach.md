# Product Thinking & Architectural Approach

## 1. Problem Understanding

Higher education institutions face unique operational challenges when managing attendance for thousands of students and hundreds of faculty across disparate departments:

1. **Information Asymmetry**: Students frequently have no transparent view of their cumulative attendance until right before examination hall tickets are blocked.
2. **Attendance Fraud & Data Inconsistency**: Paper rolls or loosely controlled spreadsheets allow retroactive or undocumented modifications without accountability.
3. **Dispute Resolution Gridlock**: When a student is legitimately marked absent (due to biometric scanner delays, inter-college athletic competitions, or medical emergencies), standard systems either require cumbersome manual paperwork or rely on informal requests to professors that lack compliance tracking.
4. **Administrative Overhead**: Compiling accreditation reports (such as NAAC, ABET, or internal academic senate audits) often takes weeks of manual collation from faculty diaries.

This MVP was conceived not as a superficial CRUD application, but as a robust operational platform that balances **faculty speed of marking in class**, **student transparency**, **administrative compliance**, and **strict immutable auditability**.

---

## 2. User Personas

### 2.1 The Faculty Member (e.g., Dr. Alan Turing)
- **Goal**: Rapidly mark 60–100 students in a 50-minute lecture period with minimal clicks, save drafts if lecture is interrupted, and lock attendance to prevent tampering accusations.
- **Pain Points**: Lengthy drop-down selections, laggy forms, students disputing attendance weeks later.
- **Solution in MVP**: Quick "Mark All Present" button, fast single-click toggles, live Present/Absent counter, clear "Save Draft" vs "Submit & Lock" workflow.

### 2.2 The Student (e.g., Rahul Sharma)
- **Goal**: Track attendance percentage in real-time across all enrolled courses, receive early warnings before dropping below the required percentage, and submit dispute petitions with evidence.
- **Pain Points**: Being surprised by exam debarment notices; no formal mechanism to contest incorrect marks.
- **Solution in MVP**: High-visibility percentage badge, low-attendance warning banner (< 75%), subject breakdown table, and a dedicated "File Correction Request" dialog.

### 2.3 The Department Reviewer (e.g., Prof. Margaret Hamilton)
- **Goal**: Review student and faculty attendance correction petitions for the department, evaluate justifications, verify proof, and make approve/reject decisions.
- **Pain Points**: Being pressured to make undocumented alterations; lack of clarity on original attendance records.
- **Solution in MVP**: Dedicated Review Queue dashboard displaying original vs requested status, reason, one-click Approve/Reject modals with mandatory remarks, and automated student notification.

### 2.4 The College Administrator (e.g., Dr. Arthur Pendelton)
- **Goal**: Institutional governance, managing departments and curricula, monitoring college-wide compliance, dynamically tuning attendance policies (e.g., 75% to 80%), and auditing system changes.
- **Pain Points**: Data silos across departments; inability to track who changed what record and why.
- **Solution in MVP**: Executive dashboard with department comparisons, 7-day trend charts, policy threshold slider, and an immutable system audit trail.

---

## 3. Key Assumptions

1. **Semester-Based Roster Structure**: Students belong to a primary Department, Class (e.g. B.Tech Computer Science), Section (e.g. CSE-A), and Semester.
2. **Subject Association**: Each subject is mapped to a specific department, semester, class, assigned faculty, and cohort section.
3. **Session Granularity**: Lectures are conducted as distinct sessions defined by `(Subject, Section, Date, StartTime)`. A student cannot have multiple attendance records within the same session.
4. **Two-Stage Attendance State**: An attendance session is either in `DRAFT` (editable by the conducting faculty) or `SUBMITTED` (permanently locked against direct modification).
5. **Zero-Setup Database Assumption**: To guarantee that evaluators and automated tests can run the project on any computer without requiring an external MongoDB daemon or Docker, the backend automatically boots an embedded memory MongoDB instance with initial seed data if an external MongoDB connection is not supplied.

---

## 4. Architectural & Design Decisions

### 4.1 Session-Based Attendance vs Daily Roll Calls
- **Decision**: Modeled attendance as `AttendanceSession` containing multiple `AttendanceRecord` entities, rather than a monolithic student-date matrix.
- **Rationale**: In collegiate environments, students attend different subjects taught by different faculty at different hours throughout the day. Session-based modeling accommodates electives, lab batches, and varying daily timetables.

### 4.2 Two-Stage Submission & Lock Mechanism
- **Decision**: Once a faculty member clicks "Submit Attendance", the session status is updated to `SUBMITTED`, timestamped, and locked. Direct `PUT` requests to the session or records return `400 Bad Request`.
- **Rationale**: Prevents retroactive grade and attendance tampering, which is a major compliance risk in university accreditation.

### 4.3 Non-Destructive Correction Workflow
- **Decision**: Approved corrections update the target record's status, but retain the original status and reviewer rationale inside the `CorrectionRequest` and `AuditLog` collections.
- **Rationale**: Historical attendance data is never silently overwritten. An external auditor can reconstruct the entire timeline of any attendance record.

### 4.4 Configurable Attendance Threshold
- **Decision**: Avoided hard-coding `75%`. Stored the threshold in a dynamic `Setting` collection with admin controls.
- **Rationale**: Academic councils often adjust attendance requirements based on institutional policies (e.g., 80% for technical courses, or 70% during sports seasons).

---

## 5. Trade-offs & Deliberate MVP Scope Limits

| Feature | Decision in MVP | Rationale / Future Roadmap |
| :--- | :--- | :--- |
| **Biometric / QR Hardware Integration** | Simulated via portal interface | Physical scanners require proprietary vendor SDKs. The session model is pre-built to ingest biometric webhook payloads in future iterations. |
| **File Attachment for OD Letters** | Reason text and comment references | Kept MVP lightweight without requiring AWS S3 or GridFS binary configuration; text references (e.g. OD Letter #) suffice for MVP demonstration. |
| **Real-time WebSockets** | Short-polling for notifications (30s) | Eliminates socket connection dropouts in varying proxy environments while providing responsive notification updates. |
| **Batch CSV Import for Students** | Web UI form creation & rich seed script | Standardized seed generator supplies 55+ students, 10 faculty, and 40+ sessions immediately on boot; CSV batch ingestion deferred to v2. |
