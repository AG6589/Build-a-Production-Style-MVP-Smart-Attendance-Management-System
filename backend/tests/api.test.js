const request = require('supertest');
const app = require('../src/app');
const { setupTestDB } = require('./setup');
const AttendanceSession = require('../src/models/AttendanceSession');
const AttendanceRecord = require('../src/models/AttendanceRecord');
const Subject = require('../src/models/Subject');
const Section = require('../src/models/Section');
const Student = require('../src/models/Student');
const AuditLog = require('../src/models/AuditLog');

setupTestDB();

describe('Smart Attendance System API Endpoints', () => {
  let adminToken;
  let facultyToken;
  let studentToken;
  let reviewerToken;

  beforeAll(async () => {
    // 1. Login as Admin
    const adminRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@college.edu', password: 'Admin@123' });
    expect(adminRes.statusCode).toBe(200);
    adminToken = adminRes.body.token;

    // 2. Login as Faculty
    const facRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'faculty.cs1@college.edu', password: 'Faculty@123' });
    expect(facRes.statusCode).toBe(200);
    facultyToken = facRes.body.token;

    // 3. Login as Student
    const stuRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'student.rahul@college.edu', password: 'Student@123' });
    expect(stuRes.statusCode).toBe(200);
    studentToken = stuRes.body.token;

    // 4. Login as Reviewer
    const revRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'reviewer.cs@college.edu', password: 'Reviewer@123' });
    expect(revRes.statusCode).toBe(200);
    reviewerToken = revRes.body.token;
  });

  // --- AUTHENTICATION ---
  describe('Authentication & Security', () => {
    test('POST /api/auth/login should fail with invalid password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'admin@college.edu', password: 'WrongPassword' });
      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });

    test('GET /api/auth/me should return current user profile', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${studentToken}`);
      expect(res.statusCode).toBe(200);
      expect(res.body.user.role).toBe('student');
      expect(res.body.user.email).toBe('student.rahul@college.edu');
    });

    test('Unauthorized access should be blocked on protected endpoints', async () => {
      const res = await request(app).get('/api/dashboard/stats');
      expect(res.statusCode).toBe(401);
    });

    test('Student should NOT be able to access Admin audit logs', async () => {
      const res = await request(app)
        .get('/api/audit-logs')
        .set('Authorization', `Bearer ${studentToken}`);
      expect(res.statusCode).toBe(403);
    });
  });

  // --- ATTENDANCE WORKFLOW ---
  describe('Attendance Workflow & Submission Lock', () => {
    let testSessionId;
    let studentsInSection;

    test('Faculty creates a new attendance session in DRAFT state', async () => {
      const subject = await Subject.findOne({ code: 'CS301' });
      const section = await Section.findOne({ name: 'CSE-A' });
      studentsInSection = await Student.find({ section: section._id });

      const res = await request(app)
        .post('/api/attendance/sessions')
        .set('Authorization', `Bearer ${facultyToken}`)
        .send({
          subjectId: subject._id,
          sectionId: section._id,
          date: new Date('2026-09-24'),
          startTime: '16:00',
          endTime: '17:00'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.session.status).toBe('DRAFT');
      expect(res.body.data.records.length).toBe(studentsInSection.length);
      testSessionId = res.body.data.session._id;
    });

    test('Faculty saves draft with customized attendance values', async () => {
      const recordsToUpdate = [
        { studentId: studentsInSection[0]._id, status: 'PRESENT' },
        { studentId: studentsInSection[1]._id, status: 'ABSENT' }
      ];

      const res = await request(app)
        .put(`/api/attendance/sessions/${testSessionId}/draft`)
        .set('Authorization', `Bearer ${facultyToken}`)
        .send({
          records: recordsToUpdate,
          remarks: 'Saved draft in progress'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.status).toBe('DRAFT');
    });

    test('Faculty submits attendance - session transitions to SUBMITTED and locks', async () => {
      const records = studentsInSection.map((s, idx) => ({
        studentId: s._id,
        status: idx === 1 ? 'ABSENT' : 'PRESENT'
      }));

      const res = await request(app)
        .post(`/api/attendance/sessions/${testSessionId}/submit`)
        .set('Authorization', `Bearer ${facultyToken}`)
        .send({
          records,
          remarks: 'Final submitted attendance'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.status).toBe('SUBMITTED');
      expect(res.body.data.absentCount).toBe(1);
    });

    test('Modifying submitted attendance directly MUST fail (Lock Enforcement)', async () => {
      const res = await request(app)
        .put(`/api/attendance/sessions/${testSessionId}/draft`)
        .set('Authorization', `Bearer ${facultyToken}`)
        .send({
          records: [{ studentId: studentsInSection[0]._id, status: 'ABSENT' }]
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toMatch(/submitted and locked/i);
    });

    test('Database unique constraint prevents duplicate attendance records for same student & session', async () => {
      const duplicateRecord = new AttendanceRecord({
        session: testSessionId,
        student: studentsInSection[0]._id,
        subject: (await Subject.findOne({ code: 'CS301' }))._id,
        section: (await Section.findOne({ name: 'CSE-A' }))._id,
        date: new Date('2026-09-24'),
        status: 'PRESENT'
      });

      let err = null;
      try {
        await duplicateRecord.save();
      } catch (e) {
        err = e;
      }
      expect(err).not.toBeNull();
      expect(err.code).toBe(11000); // MongoDB duplicate key error code
    });
  });

  // --- CORRECTION WORKFLOW ---
  describe('Correction Workflow & Audit Trail', () => {
    let pendingRequestId;
    let absentRecord;

    test('Student submits attendance correction request', async () => {
      const rahul = await Student.findOne({ email: 'student.rahul@college.edu' });
      absentRecord = await AttendanceRecord.findOne({
        student: rahul._id,
        status: 'ABSENT'
      }).populate('session');

      const res = await request(app)
        .post('/api/corrections')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          recordId: absentRecord._id,
          requestedStatus: 'PRESENT',
          reason: 'I was present in the lab during testing'
        });

      // It should either succeed or return 400 if already pending
      if (res.statusCode === 201) {
        expect(res.body.data.status).toBe('PENDING');
        pendingRequestId = res.body.data._id;
      } else {
        // If one is already seeded, get the seeded pending request
        const listRes = await request(app)
          .get('/api/corrections?status=PENDING')
          .set('Authorization', `Bearer ${reviewerToken}`);
        expect(listRes.body.data.length).toBeGreaterThan(0);
        pendingRequestId = listRes.body.data[0]._id;
      }
    });

    test('Reviewer approves correction request - updates record and emits audit log', async () => {
      const initialAuditCount = await AuditLog.countDocuments({ action: 'CORRECTION_APPROVED' });

      const res = await request(app)
        .put(`/api/corrections/${pendingRequestId}/approve`)
        .set('Authorization', `Bearer ${reviewerToken}`)
        .send({ reviewerComment: 'Verified with attendance register' });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.status).toBe('APPROVED');

      // Verify audit log created
      const newAuditCount = await AuditLog.countDocuments({ action: 'CORRECTION_APPROVED' });
      expect(newAuditCount).toBe(initialAuditCount + 1);
    });
  });

  // --- CONFIGURABLE SETTINGS ---
  describe('Settings & Threshold Management', () => {
    test('Admin can update low attendance threshold', async () => {
      const res = await request(app)
        .put('/api/settings')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ key: 'lowAttendanceThreshold', value: 80 });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.value).toBe(80);

      // Verify getter returns updated value
      const getRes = await request(app)
        .get('/api/settings')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(getRes.statusCode).toBe(200);
      expect(getRes.body.data.lowAttendanceThreshold).toBe(80);
    });

    test('Non-admin users cannot alter system settings', async () => {
      const res = await request(app)
        .put('/api/settings')
        .set('Authorization', `Bearer ${facultyToken}`)
        .send({ key: 'lowAttendanceThreshold', value: 50 });

      expect(res.statusCode).toBe(403);
    });
  });
});
