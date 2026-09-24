const Student = require('../models/Student');
const Subject = require('../models/Subject');
const Department = require('../models/Department');
const AttendanceRecord = require('../models/AttendanceRecord');
const AttendanceSession = require('../models/AttendanceSession');
const { getAttendanceThreshold } = require('../utils/threshold');

// 1. Student Report
const getStudentReport = async (req, res, next) => {
  try {
    const { studentId } = req.params;
    const student = await Student.findById(studentId)
      .populate('department', 'name code')
      .populate('class', 'name code')
      .populate('section', 'name');

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    const threshold = await getAttendanceThreshold();

    // Find all subjects
    const subjects = await Subject.find({
      $or: [{ section: student.section?._id }, { semester: student.semester, department: student.department?._id }]
    });

    const reportData = await Promise.all(
      subjects.map(async (subj) => {
        const total = await AttendanceRecord.countDocuments({ student: student._id, subject: subj._id });
        const present = await AttendanceRecord.countDocuments({
          student: student._id,
          subject: subj._id,
          status: { $in: ['PRESENT', 'LATE'] }
        });
        const absent = total - present;
        const percentage = total > 0 ? Math.round((present / total) * 100 * 10) / 10 : 0;

        return {
          subjectCode: subj.code,
          subjectName: subj.name,
          totalClasses: total,
          presentClasses: present,
          absentClasses: absent,
          percentage,
          status: percentage < threshold ? 'LOW_ATTENDANCE' : 'HEALTHY'
        };
      })
    );

    const totalClasses = reportData.reduce((acc, c) => acc + c.totalClasses, 0);
    const presentClasses = reportData.reduce((acc, c) => acc + c.presentClasses, 0);
    const overallPercentage = totalClasses > 0 ? Math.round((presentClasses / totalClasses) * 100 * 10) / 10 : 0;

    res.status(200).json({
      success: true,
      data: {
        student: {
          id: student._id,
          studentId: student.studentId,
          name: student.name,
          department: student.department?.name,
          class: student.class?.name,
          section: student.section?.name,
          semester: student.semester
        },
        summary: {
          totalClasses,
          presentClasses,
          absentClasses: totalClasses - presentClasses,
          overallPercentage,
          threshold,
          isLowAttendance: overallPercentage < threshold
        },
        subjects: reportData
      }
    });
  } catch (error) {
    next(error);
  }
};

// 2. Subject Report
const getSubjectReport = async (req, res, next) => {
  try {
    const { subjectId } = req.params;
    const subject = await Subject.findById(subjectId)
      .populate('department')
      .populate('class')
      .populate('section')
      .populate('assignedFaculty');

    if (!subject) {
      return res.status(404).json({ success: false, message: 'Subject not found' });
    }

    const threshold = await getAttendanceThreshold();

    // Query all students in this subject's section or department/semester
    const studentFilter = { status: 'active' };
    if (subject.section) {
      studentFilter.section = subject.section._id;
    } else {
      studentFilter.department = subject.department._id;
      studentFilter.semester = subject.semester;
    }

    const students = await Student.find(studentFilter).sort({ studentId: 1 });

    const totalSessions = await AttendanceSession.countDocuments({
      subject: subject._id,
      status: 'SUBMITTED'
    });

    const studentStats = await Promise.all(
      students.map(async (stu) => {
        const attended = await AttendanceRecord.countDocuments({
          student: stu._id,
          subject: subject._id,
          status: { $in: ['PRESENT', 'LATE'] }
        });
        const total = await AttendanceRecord.countDocuments({
          student: stu._id,
          subject: subject._id
        });

        const effectiveTotal = total > 0 ? total : totalSessions;
        const percentage = effectiveTotal > 0 ? Math.round((attended / effectiveTotal) * 100 * 10) / 10 : 0;

        return {
          studentId: stu.studentId,
          name: stu.name,
          email: stu.email,
          totalClasses: effectiveTotal,
          attendedClasses: attended,
          absentClasses: effectiveTotal - attended,
          percentage,
          isLowAttendance: effectiveTotal > 0 && percentage < threshold
        };
      })
    );

    const lowAttendanceStudents = studentStats.filter((s) => s.isLowAttendance);
    const avgAttendance =
      studentStats.length > 0
        ? Math.round((studentStats.reduce((acc, s) => acc + s.percentage, 0) / studentStats.length) * 10) / 10
        : 0;

    res.status(200).json({
      success: true,
      data: {
        subject: {
          id: subject._id,
          name: subject.name,
          code: subject.code,
          department: subject.department?.name,
          semester: subject.semester,
          faculty: subject.assignedFaculty?.name || 'Unassigned',
          section: subject.section?.name || 'All'
        },
        threshold,
        summary: {
          totalStudents: students.length,
          totalConductedSessions: totalSessions,
          averageAttendancePercentage: avgAttendance,
          lowAttendanceCount: lowAttendanceStudents.length
        },
        students: studentStats
      }
    });
  } catch (error) {
    next(error);
  }
};

// 3. Department Report
const getDepartmentReport = async (req, res, next) => {
  try {
    const { departmentId } = req.params;
    const department = await Department.findById(departmentId);
    if (!department) {
      return res.status(404).json({ success: false, message: 'Department not found' });
    }

    const threshold = await getAttendanceThreshold();
    const students = await Student.find({ department: department._id, status: 'active' });
    const subjects = await Subject.find({ department: department._id, status: 'active' });

    // Aggregate attendance per student across all department subjects
    const lowAttendanceList = [];
    let totalPctSum = 0;
    let studentsWithRecords = 0;

    for (const stu of students) {
      const totalRecs = await AttendanceRecord.countDocuments({ student: stu._id });
      const presentRecs = await AttendanceRecord.countDocuments({
        student: stu._id,
        status: { $in: ['PRESENT', 'LATE'] }
      });

      if (totalRecs > 0) {
        studentsWithRecords++;
        const pct = Math.round((presentRecs / totalRecs) * 100 * 10) / 10;
        totalPctSum += pct;
        if (pct < threshold) {
          lowAttendanceList.push({
            studentId: stu.studentId,
            name: stu.name,
            semester: stu.semester,
            totalClasses: totalRecs,
            presentClasses: presentRecs,
            percentage: pct
          });
        }
      }
    }

    const departmentAverage = studentsWithRecords > 0 ? Math.round((totalPctSum / studentsWithRecords) * 10) / 10 : 0;

    res.status(200).json({
      success: true,
      data: {
        department: {
          id: department._id,
          name: department.name,
          code: department.code
        },
        threshold,
        summary: {
          totalStudents: students.length,
          totalSubjects: subjects.length,
          averageAttendance: departmentAverage,
          lowAttendanceCount: lowAttendanceList.length
        },
        lowAttendanceStudents: lowAttendanceList
      }
    });
  } catch (error) {
    next(error);
  }
};

// 4. Export CSV
const exportReportCSV = async (req, res, next) => {
  try {
    const { type, id } = req.query; // type: 'student', 'subject', 'department'

    if (type === 'subject') {
      const subject = await Subject.findById(id).populate('department');
      if (!subject) return res.status(404).send('Subject not found');

      const threshold = await getAttendanceThreshold();
      const students = await Student.find({ department: subject.department._id, status: 'active' });

      let csv = 'Student ID,Name,Email,Total Classes,Attended,Absent,Percentage,Status\r\n';

      for (const stu of students) {
        const total = await AttendanceRecord.countDocuments({ student: stu._id, subject: subject._id });
        const attended = await AttendanceRecord.countDocuments({
          student: stu._id,
          subject: subject._id,
          status: { $in: ['PRESENT', 'LATE'] }
        });
        const absent = total - attended;
        const pct = total > 0 ? Math.round((attended / total) * 100) : 0;
        const status = pct < threshold ? 'LOW_ATTENDANCE' : 'HEALTHY';

        csv += `"${stu.studentId}","${stu.name}","${stu.email}",${total},${attended},${absent},${pct}%,"${status}"\r\n`;
      }

      res.header('Content-Type', 'text/csv');
      res.attachment(`Subject_Attendance_${subject.code}.csv`);
      return res.send(csv);
    }

    // Default student CSV
    res.status(400).json({ success: false, message: 'Invalid or unsupported export type' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getStudentReport,
  getSubjectReport,
  getDepartmentReport,
  exportReportCSV
};
