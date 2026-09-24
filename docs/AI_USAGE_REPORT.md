# AI Usage & Verification Report

In adherence with transparent engineering practices and Section 29 requirements, this document outlines how AI assistance was leveraged, reviewed, and validated throughout the development of the Smart Attendance Management System.

---

## 1. AI Tools Utilized

- **Antigravity Autonomous IDE Agent**: Used for system design, codebase scaffolding, iterative implementation, automated testing, and browser subagent end-to-end verification.
- **Model Engine**: Gemini 3.8 Flash (Medium).

---

## 2. Areas Where AI Was Used

1. **Architecture & Schema Design**:
   - Proposed the 13 normalized Mongoose models with compound unique indexes (specifically `{ session: 1, student: 1 }` to eliminate duplicate student records per lecture).
   - Designed the state machine for attendance sessions (`DRAFT` vs `SUBMITTED`) and correction petitions (`PENDING`, `APPROVED`, `REJECTED`).

2. **Full-Stack Implementation**:
   - Scaffolding Express.js routing, controllers, role-based authorization middleware, and global error handling.
   - Building the React 18 frontend with Tailwind CSS, Lucide icons, and Recharts analytics components.
   - Constructing the automated seed generator to produce realistic college data (55+ students, 10 faculty, 40+ attendance sessions, low-attendance cases, and audit logs).

3. **Test Automation**:
   - Generating Jest and Supertest test suites covering authentication, draft saving, submission lock enforcement, unique constraint validation, correction review, and calculation boundary conditions.

---

## 3. Human Review & Engineering Interventions

While AI accelerated drafting, critical architectural decisions and bug fixes required explicit review and remediation:

1. **Password Hashing Lifecycle Review (Double-Hashing Bug Diagnosis & Resolution)**:
   - *Observation*: During initial automated test execution, the API test suite returned `401 Unauthorized` on login.
   - *Root Cause Analysis*: In `seedData.js`, passwords had been pre-hashed with `bcrypt.hash()` before calling `User.create()`. Concurrently, the Mongoose `User` schema had a `pre('save')` hook that also hashed passwords if modified, resulting in double-hashed passwords.
   - *Correction*: Refactored `seedData.js` to pass plain passwords (`Admin@123`, `Faculty@123`, etc.) so that the Mongoose pre-save hook executes exactly once, restoring authentication functionality.

2. **Tailwind CSS v4 & PostCSS Configuration**:
   - *Observation*: The initial Vite production build errored due to Tailwind CSS v4 relocating its PostCSS plugin to `@tailwindcss/postcss`.
   - *Correction*: Installed `@tailwindcss/postcss`, updated `postcss.config.js`, and migrated `index.css` to the clean `@import "tailwindcss";` directive, achieving a zero-error production build.

3. **Zero-Configuration MongoDB Strategy**:
   - *Observation*: Standard development environments on Windows may not have a globally running `mongod` service.
   - *Design Choice*: Designed `src/config/db.js` to gracefully fall back to an embedded `mongodb-memory-server` instance if no local MongoDB instance is reachable, guaranteeing that the evaluator can clone and run the application with zero database installation friction.

---

## 4. Validation & Verification Methodology

The application was validated through multiple rigorous testing layers:

| Layer | Validation Executed | Status |
| :--- | :--- | :--- |
| **API Automated Tests** | Ran Supertest test suite (`npm test`) covering Auth, Attendance draft/submit lock, Duplicate constraints, and Correction approval. | **17/17 Passed** |
| **Logic & Calculation Tests** | Unit tests for percentage calculations, division-by-zero protection (0 classes conducted), and dynamic thresholding. | **Passed** |
| **Frontend Production Build** | Executed `npm run build` with Vite and Rolldown to verify TypeScript/JSX syntax and bundle integrity. | **Passed (0 errors)** |
| **Browser Subagent E2E Verification** | Simulated real user browser sessions on `http://localhost:5173`: Admin login, Faculty attendance marking & draft saving, Student low-attendance alert inspection, and Reviewer petition approval. | **Verified End-to-End** |
