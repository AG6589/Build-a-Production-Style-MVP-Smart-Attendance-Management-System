const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Department = require('../models/Department');
const Class = require('../models/Class');
const Section = require('../models/Section');
const Faculty = require('../models/Faculty');
const Student = require('../models/Student');
const Subject = require('../models/Subject');
const AttendanceSession = require('../models/AttendanceSession');
const AttendanceRecord = require('../models/AttendanceRecord');
const CorrectionRequest = require('../models/CorrectionRequest');
const Notification = require('../models/Notification');
const AuditLog = require('../models/AuditLog');
const Setting = require('../models/Setting');
const { connectDB } = require('../config/db');

const seedAll = async () => {
  console.log('--- Starting Database Seeding ---');

  // Clear existing collections
  await Promise.all([
    User.deleteMany({}),
    Department.deleteMany({}),
    Class.deleteMany({}),
    Section.deleteMany({}),
    Faculty.deleteMany({}),
    Student.deleteMany({}),
    Subject.deleteMany({}),
    AttendanceSession.deleteMany({}),
    AttendanceRecord.deleteMany({}),
    CorrectionRequest.deleteMany({}),
    Notification.deleteMany({}),
    AuditLog.deleteMany({}),
    Setting.deleteMany({})
  ]);

  // 1. Settings
  await Setting.create({
    key: 'lowAttendanceThreshold',
    value: 75,
    description: 'Minimum required attendance percentage for students'
  });
  console.log('✓ Seeded Settings (lowAttendanceThreshold: 75%)');

  // Passwords will be hashed once by User model's pre('save') hook
  const adminPassword = 'Admin@123';
  const facultyPassword = 'Faculty@123';
  const studentPassword = 'Student@123';
  const reviewerPassword = 'Reviewer@123';

  // 2. Demo User Accounts
  const adminUser = await User.create({
    name: 'Dr. Arthur Pendelton',
    email: 'admin@college.edu',
    password: adminPassword,
    role: 'admin',
    phone: '+1-555-0101',
    status: 'active'
  });

  const reviewerUser = await User.create({
    name: 'Prof. Margaret Hamilton',
    email: 'reviewer.cs@college.edu',
    password: reviewerPassword,
    role: 'reviewer',
    phone: '+1-555-0102',
    status: 'active'
  });

  console.log('✓ Seeded Admin and Reviewer accounts');

  // 3. Departments
  const cseDept = await Department.create({
    code: 'CSE',
    name: 'Computer Science and Engineering',
    description: 'Department of Computer Science & Software Systems'
  });

  const itDept = await Department.create({
    code: 'IT',
    name: 'Information Technology',
    description: 'Department of Information Technology & Cloud Computing'
  });

  const eceDept = await Department.create({
    code: 'ECE',
    name: 'Electronics and Communication Engineering',
    description: 'Department of Microelectronics, IoT & Embedded Systems'
  });

  console.log('✓ Seeded 3 Departments');

  // 4. Classes
  const btechCse = await Class.create({
    name: 'B.Tech Computer Science',
    code: 'BT-CSE',
    department: cseDept._id,
    durationYears: 4,
    totalSemesters: 8
  });

  const btechIt = await Class.create({
    name: 'B.Tech Information Technology',
    code: 'BT-IT',
    department: itDept._id,
    durationYears: 4,
    totalSemesters: 8
  });

  // 5. Sections
  const cseA = await Section.create({
    name: 'CSE-A',
    class: btechCse._id,
    department: cseDept._id,
    semester: 5,
    academicYear: '2025-2026'
  });

  const cseB = await Section.create({
    name: 'CSE-B',
    class: btechCse._id,
    department: cseDept._id,
    semester: 5,
    academicYear: '2025-2026'
  });

  const itA = await Section.create({
    name: 'IT-A',
    class: btechIt._id,
    department: itDept._id,
    semester: 5,
    academicYear: '2025-2026'
  });

  const itB = await Section.create({
    name: 'IT-B',
    class: btechIt._id,
    department: itDept._id,
    semester: 5,
    academicYear: '2025-2026'
  });

  console.log('✓ Seeded Classes and Sections');

  // 6. Faculty (10 faculty members)
  const facultyData = [
    { id: 'FAC101', name: 'Dr. Alan Turing', email: 'faculty.cs1@college.edu', dept: cseDept._id, designation: 'Professor & HOD' },
    { id: 'FAC102', name: 'Dr. Grace Hopper', email: 'faculty.cs2@college.edu', dept: cseDept._id, designation: 'Associate Professor' },
    { id: 'FAC103', name: 'Dr. Donald Knuth', email: 'faculty.cs3@college.edu', dept: cseDept._id, designation: 'Professor' },
    { id: 'FAC104', name: 'Dr. Ada Lovelace', email: 'faculty.cs4@college.edu', dept: cseDept._id, designation: 'Associate Professor' },
    { id: 'FAC105', name: 'Dr. Claude Shannon', email: 'faculty.it1@college.edu', dept: itDept._id, designation: 'Professor' },
    { id: 'FAC106', name: 'Dr. Barbara Liskov', email: 'faculty.it2@college.edu', dept: itDept._id, designation: 'Associate Professor' },
    { id: 'FAC107', name: 'Dr. Leslie Lamport', email: 'faculty.it3@college.edu', dept: itDept._id, designation: 'Professor' },
    { id: 'FAC108', name: 'Dr. John von Neumann', email: 'faculty.ece1@college.edu', dept: eceDept._id, designation: 'Professor' },
    { id: 'FAC109', name: 'Dr. Dennis Ritchie', email: 'faculty.cs5@college.edu', dept: cseDept._id, designation: 'Assistant Professor' },
    { id: 'FAC110', name: 'Dr. Ken Thompson', email: 'faculty.it4@college.edu', dept: itDept._id, designation: 'Assistant Professor' }
  ];

  const facultyRecords = [];
  for (let i = 0; i < facultyData.length; i++) {
    const f = facultyData[i];
    const u = await User.create({
      name: f.name,
      email: f.email,
      password: facultyPassword,
      role: 'faculty',
      phone: `+1-555-020${i}`,
      status: 'active'
    });

    const fac = await Faculty.create({
      facultyId: f.id,
      user: u._id,
      name: f.name,
      email: f.email,
      department: f.dept,
      designation: f.designation
    });
    facultyRecords.push(fac);
  }
  console.log(`✓ Seeded ${facultyRecords.length} Faculty members`);

  // 7. Subjects (10 subjects across departments & sections)
  const subjectsData = [
    { code: 'CS301', name: 'Database Management Systems', dept: cseDept._id, cls: btechCse._id, sem: 5, fac: facultyRecords[0]._id, sec: cseA._id },
    { code: 'CS302', name: 'Computer Networks', dept: cseDept._id, cls: btechCse._id, sem: 5, fac: facultyRecords[1]._id, sec: cseA._id },
    { code: 'CS303', name: 'Design & Analysis of Algorithms', dept: cseDept._id, cls: btechCse._id, sem: 5, fac: facultyRecords[2]._id, sec: cseA._id },
    { code: 'CS304', name: 'Operating Systems & Concurrency', dept: cseDept._id, cls: btechCse._id, sem: 5, fac: facultyRecords[3]._id, sec: cseA._id },
    { code: 'CS301B', name: 'Database Management Systems (B)', dept: cseDept._id, cls: btechCse._id, sem: 5, fac: facultyRecords[0]._id, sec: cseB._id },
    { code: 'CS302B', name: 'Computer Networks (B)', dept: cseDept._id, cls: btechCse._id, sem: 5, fac: facultyRecords[1]._id, sec: cseB._id },
    { code: 'IT301', name: 'Cloud Computing & DevOps', dept: itDept._id, cls: btechIt._id, sem: 5, fac: facultyRecords[4]._id, sec: itA._id },
    { code: 'IT302', name: 'Web Application Architecture', dept: itDept._id, cls: btechIt._id, sem: 5, fac: facultyRecords[5]._id, sec: itA._id },
    { code: 'IT303', name: 'Information & Network Security', dept: itDept._id, cls: btechIt._id, sem: 5, fac: facultyRecords[6]._id, sec: itA._id },
    { code: 'EC301', name: 'Microprocessors and Interfacing', dept: eceDept._id, cls: btechCse._id, sem: 5, fac: facultyRecords[7]._id, sec: cseA._id }
  ];

  const subjects = [];
  for (const s of subjectsData) {
    const subj = await Subject.create({
      code: s.code,
      name: s.name,
      department: s.dept,
      class: s.cls,
      semester: s.sem,
      assignedFaculty: s.fac,
      section: s.sec
    });
    subjects.push(subj);
  }
  console.log(`✓ Seeded ${subjects.length} Subjects`);

  // 8. Students (55 students: 30 in CSE-A, 15 in CSE-B, 10 in IT-A)
  const studentNames = [
    'Rahul Sharma', 'Priya Patel', 'Ananya Gupta', 'Rohan Mehta', 'Sneha Reddy',
    'Arjun Nair', 'Vikram Malhotra', 'Pooja Iyer', 'Aditya Verma', 'Meera Joshi',
    'Kavita Rao', 'Karthik Subramanian', 'Deepak Choudhury', 'Tanvi Saxena', 'Siddharth Jain',
    'Nisha Kulkarni', 'Gaurav Bhatt', 'Divya Menon', 'Amitabh Sen', 'Sunita Mukherjee',
    'Rajesh Nambiar', 'Shreya Ghosh', 'Manoj Pillai', 'Bhavna Kapoor', 'Kunal Trivedi',
    'Aniket Das', 'Swati Deshmukh', 'Harish Chandra', 'Ritu Aggarwal', 'Vishal Singhania',
    // CSE-B
    'Aarav Deshpande', 'Diya Chawla', 'Varun Bhatia', 'Ishita Bansal', 'Naveen Kumar',
    'Pallavi Nanda', 'Rakesh Dubey', 'Rhea Mathur', 'Tarun Mittal', 'Komal Pandey',
    'Sameer Kazi', 'Aarti Sethi', 'Pranav Mishra', 'Radhika Goyal', 'Abhishek Tiwari',
    // IT-A
    'Chetan Anand', 'Shruti Somani', 'Devendra Rawat', 'Preeti Bhalla', 'Manish Goel',
    'Simran Sandhu', 'Yashraj Chauhan', 'Ankita Bajaj', 'Nikhil Dhawan', 'Nehal Parekh'
  ];

  const students = [];
  let rahulStudent = null;

  for (let i = 0; i < studentNames.length; i++) {
    const sName = studentNames[i];
    const sId = `STU${101 + i}`;
    const email = i === 0 ? 'student.rahul@college.edu' : `student.${sId.toLowerCase()}@college.edu`;

    let assignedSec = cseA;
    let assignedCls = btechCse;
    let assignedDept = cseDept;

    if (i >= 30 && i < 45) {
      assignedSec = cseB;
    } else if (i >= 45) {
      assignedSec = itA;
      assignedCls = btechIt;
      assignedDept = itDept;
    }

    const u = await User.create({
      name: sName,
      email,
      password: studentPassword,
      role: 'student',
      phone: `+1-555-03${String(i).padStart(2, '0')}`,
      status: 'active'
    });

    const stu = await Student.create({
      studentId: sId,
      user: u._id,
      name: sName,
      email,
      phone: `+1-555-03${String(i).padStart(2, '0')}`,
      department: assignedDept._id,
      class: assignedCls._id,
      section: assignedSec._id,
      semester: 5,
      rollNumber: `2023-${assignedSec.name}-${String(i + 1).padStart(3, '0')}`
    });

    if (i === 0) rahulStudent = stu;
    students.push(stu);
  }
  console.log(`✓ Seeded ${students.length} Students (Rahul Sharma = STU101)`);

  // 9. Attendance Sessions & Records
  // We will generate 20 historical sessions for CSE-A across CS301, CS302, CS303, CS304 over the past 25 days
  const cseAStudents = students.filter(s => s.section.toString() === cseA._id.toString());
  const cseASubjects = subjects.filter(s => s.section && s.section.toString() === cseA._id.toString());

  console.log(`Generating attendance sessions for ${cseAStudents.length} students in CSE-A across ${cseASubjects.length} subjects...`);

  const createdSessions = [];
  const createdRecords = [];

  // Generate sessions across past 20 days
  for (let dayOffset = 20; dayOffset >= 1; dayOffset--) {
    const sessionDate = new Date();
    sessionDate.setDate(sessionDate.getDate() - dayOffset);
    sessionDate.setHours(0, 0, 0, 0);

    // Pick 2 subjects per day
    const subj1 = cseASubjects[(dayOffset * 2) % cseASubjects.length];
    const subj2 = cseASubjects[(dayOffset * 2 + 1) % cseASubjects.length];

    for (const [idx, subj] of [subj1, subj2].entries()) {
      const startTime = idx === 0 ? '09:00' : '11:00';
      const endTime = idx === 0 ? '10:00' : '12:00';

      const session = await AttendanceSession.create({
        subject: subj._id,
        section: cseA._id,
        faculty: subj.assignedFaculty,
        department: cseDept._id,
        date: sessionDate,
        startTime,
        endTime,
        status: 'SUBMITTED',
        totalStudents: cseAStudents.length,
        presentCount: 0,
        absentCount: 0,
        submittedAt: new Date(sessionDate.getTime() + 3600000 * 2)
      });

      let presCount = 0;
      let absCount = 0;

      for (let sIdx = 0; sIdx < cseAStudents.length; sIdx++) {
        const student = cseAStudents[sIdx];

        // Specific profiles:
        // Rahul Sharma (sIdx 0): Make attendance around 68% (Low Attendance for CS301!)
        // Student 1 & 2 (Priya, Ananya): Excellent attendance (>92%)
        // Student 3 (Rohan): Low attendance (~60%)
        // Student 4 (Sneha): Low attendance (~65%)
        let status = 'PRESENT';
        if (sIdx === 0) { // Rahul
          // Absent in ~35% of classes
          status = (dayOffset % 3 === 0) ? 'ABSENT' : 'PRESENT';
        } else if (sIdx === 3 || sIdx === 4) { // Rohan & Sneha (low attendance)
          status = (dayOffset % 2 === 0) ? 'ABSENT' : 'PRESENT';
        } else {
          // General student: mostly present (90% present)
          status = ((dayOffset + sIdx) % 10 === 0) ? 'ABSENT' : 'PRESENT';
        }

        if (status === 'PRESENT') presCount++;
        else absCount++;

        const rec = await AttendanceRecord.create({
          session: session._id,
          student: student._id,
          subject: subj._id,
          section: cseA._id,
          date: sessionDate,
          status,
          markedBy: subj.assignedFaculty
        });
        createdRecords.push(rec);
      }

      session.presentCount = presCount;
      session.absentCount = absCount;
      await session.save();
      createdSessions.push(session);
    }
  }

  // Add 1 DRAFT session for today to demonstrate draft marking
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const draftSession = await AttendanceSession.create({
    subject: cseASubjects[0]._id,
    section: cseA._id,
    faculty: cseASubjects[0].assignedFaculty,
    department: cseDept._id,
    date: today,
    startTime: '14:00',
    endTime: '15:00',
    status: 'DRAFT',
    totalStudents: cseAStudents.length,
    presentCount: cseAStudents.length,
    absentCount: 0,
    remarks: 'Lecture on B-Trees and Query Optimization'
  });

  for (const stu of cseAStudents) {
    await AttendanceRecord.create({
      session: draftSession._id,
      student: stu._id,
      subject: cseASubjects[0]._id,
      section: cseA._id,
      date: today,
      status: 'PRESENT',
      markedBy: cseASubjects[0].assignedFaculty
    });
  }
  createdSessions.push(draftSession);

  console.log(`✓ Seeded ${createdSessions.length} Attendance Sessions and ${createdRecords.length} Attendance Records`);

  // 10. Correction Requests
  // Find a specific absent record for Rahul Sharma in CS301
  const rahulAbsentRecord = await AttendanceRecord.findOne({
    student: rahulStudent._id,
    status: 'ABSENT'
  }).populate('session subject');

  if (rahulAbsentRecord) {
    // 1. Pending Request by Rahul
    await CorrectionRequest.create({
      session: rahulAbsentRecord.session._id,
      record: rahulAbsentRecord._id,
      student: rahulStudent._id,
      subject: rahulAbsentRecord.subject._id,
      requestedBy: rahulStudent.user,
      requestedRole: 'student',
      originalStatus: 'ABSENT',
      requestedStatus: 'PRESENT',
      reason: 'I was present in the second row, but biometric was lagging',
      comment: 'Kindly verify with Professor Alan Turing',
      status: 'PENDING'
    });

    // 2. Approved Request (simulated past approved request for another absent record)
    const otherAbsent = await AttendanceRecord.findOne({
      student: cseAStudents[1]._id,
      status: 'ABSENT'
    }).populate('session subject');

    if (otherAbsent) {
      await CorrectionRequest.create({
        session: otherAbsent.session._id,
        record: otherAbsent._id,
        student: cseAStudents[1]._id,
        subject: otherAbsent.subject._id,
        requestedBy: cseAStudents[1].user,
        requestedRole: 'student',
        originalStatus: 'ABSENT',
        requestedStatus: 'PRESENT',
        reason: 'Attended inter-college coding competition representing college with permission letter',
        reviewerComment: 'Verified on-duty letter signed by Department Head',
        status: 'APPROVED',
        reviewedBy: reviewerUser._id,
        reviewedAt: new Date(Date.now() - 86400000)
      });
    }

    // 3. Rejected Request
    const rejectedAbsent = await AttendanceRecord.findOne({
      student: cseAStudents[3]._id,
      status: 'ABSENT'
    }).populate('session subject');

    if (rejectedAbsent) {
      await CorrectionRequest.create({
        session: rejectedAbsent.session._id,
        record: rejectedAbsent._id,
        student: cseAStudents[3]._id,
        subject: rejectedAbsent.subject._id,
        requestedBy: cseAStudents[3].user,
        requestedRole: 'student',
        originalStatus: 'ABSENT',
        requestedStatus: 'PRESENT',
        reason: 'Came to class 35 minutes late',
        reviewerComment: 'Institute policy strictly forbids marking attendance after 15 minutes of lecture start',
        status: 'REJECTED',
        reviewedBy: reviewerUser._id,
        reviewedAt: new Date(Date.now() - 172800000)
      });
    }
  }

  console.log('✓ Seeded realistic PENDING, APPROVED, and REJECTED Correction Requests');

  // 11. Notifications
  await Notification.create({
    recipient: rahulStudent.user,
    title: 'Low Attendance Alert',
    message: 'Your attendance in Database Management Systems (CS301) has fallen to 68.2%, which is below the mandatory 75% threshold.',
    type: 'WARNING',
    link: '/dashboard'
  });

  await Notification.create({
    recipient: reviewerUser._id,
    title: 'Pending Correction Requests',
    message: '1 new attendance correction request submitted by Rahul Sharma (STU101) awaits review.',
    type: 'CORRECTION',
    link: '/corrections'
  });

  await Notification.create({
    recipient: facultyRecords[0].user,
    title: 'Attendance Submission Confirmation',
    message: 'Attendance session for CS301 (CSE-A) was successfully recorded and submitted.',
    type: 'INFO',
    link: '/attendance/history'
  });

  console.log('✓ Seeded Notifications');

  // 12. Audit Logs
  await AuditLog.create({
    performedBy: adminUser._id,
    userRole: 'admin',
    action: 'SUBJECT_CREATED',
    entity: 'Subject',
    entityId: subjects[0]._id.toString(),
    newValue: { code: 'CS301', name: 'Database Management Systems', semester: 5 },
    reason: 'Initial curriculum setup for Fall Semester 2025'
  });

  await AuditLog.create({
    performedBy: facultyRecords[0].user,
    userRole: 'faculty',
    action: 'ATTENDANCE_SUBMITTED',
    entity: 'AttendanceSession',
    entityId: createdSessions[0]._id.toString(),
    newValue: { totalStudents: 30, presentCount: 28, absentCount: 2, status: 'SUBMITTED' },
    reason: 'Faculty marked and submitted lecture attendance'
  });

  await AuditLog.create({
    performedBy: reviewerUser._id,
    userRole: 'reviewer',
    action: 'CORRECTION_APPROVED',
    entity: 'CorrectionRequest',
    previousValue: { status: 'ABSENT' },
    newValue: { status: 'PRESENT', reviewerComment: 'Verified on-duty letter' },
    reason: 'Reviewer approved approved attendance correction'
  });

  console.log('✓ Seeded Audit Logs');
  console.log('--- Database Seeding Complete ---');
};

// If run directly via node seedData.js
if (require.main === module) {
  (async () => {
    try {
      await connectDB();
      await seedAll();
      process.exit(0);
    } catch (err) {
      console.error('Seeding failed:', err);
      process.exit(1);
    }
  })();
}

module.exports = { seedAll };
