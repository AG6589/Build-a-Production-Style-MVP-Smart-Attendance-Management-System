import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import Badge from '../components/Badge';
import {
  BarChart3,
  Download,
  BookOpen,
  Building2,
  GraduationCap,
  AlertTriangle,
  FileSpreadsheet,
  Loader2
} from 'lucide-react';

const Reports = () => {
  const [reportType, setReportType] = useState('subject'); // 'subject' | 'department'
  const [subjects, setSubjects] = useState([]);
  const [departments, setDepartments] = useState([]);

  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [selectedDepartmentId, setSelectedDepartmentId] = useState('');

  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchEntities = async () => {
      try {
        const [subjRes, deptRes] = await Promise.all([
          api.get('/academic/subjects'),
          api.get('/academic/departments')
        ]);
        if (subjRes.data.success && subjRes.data.data.length > 0) {
          setSubjects(subjRes.data.data);
          setSelectedSubjectId(subjRes.data.data[0]._id);
        }
        if (deptRes.data.success && deptRes.data.data.length > 0) {
          setDepartments(deptRes.data.data);
          setSelectedDepartmentId(deptRes.data.data[0]._id);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchEntities();
  }, []);

  const fetchReport = async () => {
    setLoading(true);
    setReportData(null);
    try {
      if (reportType === 'subject' && selectedSubjectId) {
        const res = await api.get(`/reports/subject/${selectedSubjectId}`);
        if (res.data.success) setReportData(res.data.data);
      } else if (reportType === 'department' && selectedDepartmentId) {
        const res = await api.get(`/reports/department/${selectedDepartmentId}`);
        if (res.data.success) setReportData(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if ((reportType === 'subject' && selectedSubjectId) || (reportType === 'department' && selectedDepartmentId)) {
      fetchReport();
    }
  }, [reportType, selectedSubjectId, selectedDepartmentId]);

  const handleExportCSV = () => {
    if (reportType === 'subject' && selectedSubjectId) {
      const url = `http://localhost:5000/api/reports/export-csv?type=subject&id=${selectedSubjectId}`;
      window.open(url, '_blank');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Reports & Analytics</h1>
          <p className="text-xs text-slate-500 mt-1">
            Institutional attendance compliance audits, course summaries, and CSV data export
          </p>
        </div>
        {reportType === 'subject' && reportData && (
          <button
            onClick={handleExportCSV}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 shadow-sm flex items-center gap-1.5 self-start sm:self-auto transition-all"
          >
            <Download className="w-4 h-4 text-emerald-600" /> Export CSV
          </button>
        )}
      </div>

      {/* Report Selection Tabs & Dropdown */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <button
            onClick={() => setReportType('subject')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
              reportType === 'subject'
                ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <BookOpen className="w-4 h-4" /> Course / Subject Report
          </button>
          <button
            onClick={() => setReportType('department')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
              reportType === 'department'
                ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Building2 className="w-4 h-4" /> Department Aggregate Report
          </button>
        </div>

        {/* Entity Selector */}
        <div className="flex items-center gap-3">
          {reportType === 'subject' ? (
            <div className="w-full sm:w-96">
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Select Course</label>
              <select
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(e.target.value)}
                className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                {subjects.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.code} - {s.name} ({s.section?.name || 'All'})
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="w-full sm:w-96">
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Select Department</label>
              <select
                value={selectedDepartmentId}
                onChange={(e) => setSelectedDepartmentId(e.target.value)}
                className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                {departments.map((d) => (
                  <option key={d._id} value={d._id}>
                    {d.code} - {d.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Report Content */}
      {loading ? (
        <div className="py-16 flex justify-center">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
        </div>
      ) : !reportData ? (
        <div className="py-12 text-center text-slate-400 text-xs">No report data generated.</div>
      ) : reportType === 'subject' ? (
        <div className="space-y-6">
          {/* Summary Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 bg-white rounded-xl border border-slate-200">
              <p className="text-[11px] font-semibold text-slate-500 uppercase">Enrolled Students</p>
              <p className="text-2xl font-bold text-slate-900 mt-0.5">{reportData.summary?.totalStudents}</p>
            </div>
            <div className="p-4 bg-white rounded-xl border border-slate-200">
              <p className="text-[11px] font-semibold text-slate-500 uppercase">Lectures Conducted</p>
              <p className="text-2xl font-bold text-slate-900 mt-0.5">{reportData.summary?.totalConductedSessions}</p>
            </div>
            <div className="p-4 bg-white rounded-xl border border-slate-200">
              <p className="text-[11px] font-semibold text-slate-500 uppercase">Average Attendance</p>
              <p className="text-2xl font-bold text-emerald-700 mt-0.5">
                {reportData.summary?.averageAttendancePercentage}%
              </p>
            </div>
            <div className="p-4 bg-white rounded-xl border border-slate-200">
              <p className="text-[11px] font-semibold text-rose-600 uppercase">Low Attendance Count</p>
              <p className="text-2xl font-bold text-rose-700 mt-0.5">{reportData.summary?.lowAttendanceCount}</p>
            </div>
          </div>

          {/* Student Roster Report Table */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  {reportData.subject?.name} ({reportData.subject?.code})
                </h3>
                <p className="text-xs text-slate-500">
                  Faculty: {reportData.subject?.faculty} • Section: {reportData.subject?.section}
                </p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-md">
                Threshold: {reportData.threshold}%
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4">Student ID</th>
                    <th className="py-3 px-4">Name</th>
                    <th className="py-3 px-4 text-center">Conducted</th>
                    <th className="py-3 px-4 text-center">Attended</th>
                    <th className="py-3 px-4 text-center">Absent</th>
                    <th className="py-3 px-4 text-center">Percentage</th>
                    <th className="py-3 px-4 text-right">Compliance Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(reportData.students || []).map((stu) => (
                    <tr
                      key={stu.studentId}
                      className={`hover:bg-slate-50 transition-colors ${
                        stu.isLowAttendance ? 'bg-rose-50/20' : ''
                      }`}
                    >
                      <td className="py-3 px-4 font-mono font-bold text-slate-700">{stu.studentId}</td>
                      <td className="py-3 px-4 font-semibold text-slate-900">{stu.name}</td>
                      <td className="py-3 px-4 text-center font-medium">{stu.totalClasses}</td>
                      <td className="py-3 px-4 text-center text-emerald-700 font-semibold">{stu.attendedClasses}</td>
                      <td className="py-3 px-4 text-center text-rose-700 font-semibold">{stu.absentClasses}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`font-bold ${stu.isLowAttendance ? 'text-rose-600' : 'text-emerald-700'}`}>
                          {stu.percentage}%
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Badge status={stu.isLowAttendance ? 'LOW_ATTENDANCE' : 'HEALTHY'} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* Department Report */
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 bg-white rounded-xl border border-slate-200">
              <p className="text-[11px] font-semibold text-slate-500 uppercase">Department</p>
              <p className="text-xl font-bold text-slate-900 mt-0.5">{reportData.department?.code}</p>
            </div>
            <div className="p-4 bg-white rounded-xl border border-slate-200">
              <p className="text-[11px] font-semibold text-slate-500 uppercase">Total Students</p>
              <p className="text-xl font-bold text-slate-900 mt-0.5">{reportData.summary?.totalStudents}</p>
            </div>
            <div className="p-4 bg-white rounded-xl border border-slate-200">
              <p className="text-[11px] font-semibold text-slate-500 uppercase">Department Average</p>
              <p className="text-xl font-bold text-emerald-700 mt-0.5">{reportData.summary?.averageAttendance}%</p>
            </div>
            <div className="p-4 bg-white rounded-xl border border-slate-200">
              <p className="text-[11px] font-semibold text-rose-600 uppercase">Low Attendance Count</p>
              <p className="text-xl font-bold text-rose-700 mt-0.5">{reportData.summary?.lowAttendanceCount}</p>
            </div>
          </div>

          {/* Low Attendance Students in Department */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 mb-3">
              Students Below {reportData.threshold}% Threshold in {reportData.department?.name}
            </h3>

            {(reportData.lowAttendanceStudents || []).length === 0 ? (
              <p className="py-8 text-center text-slate-400 text-xs">
                No students currently falling below the {reportData.threshold}% threshold in this department!
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                      <th className="py-3 px-4">Student ID</th>
                      <th className="py-3 px-4">Name</th>
                      <th className="py-3 px-4 text-center">Semester</th>
                      <th className="py-3 px-4 text-center">Total Classes</th>
                      <th className="py-3 px-4 text-center">Attended</th>
                      <th className="py-3 px-4 text-center">Attendance %</th>
                      <th className="py-3 px-4 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {reportData.lowAttendanceStudents.map((s) => (
                      <tr key={s.studentId} className="hover:bg-slate-50">
                        <td className="py-3 px-4 font-mono font-bold text-slate-700">{s.studentId}</td>
                        <td className="py-3 px-4 font-semibold text-slate-900">{s.name}</td>
                        <td className="py-3 px-4 text-center">{s.semester}</td>
                        <td className="py-3 px-4 text-center">{s.totalClasses}</td>
                        <td className="py-3 px-4 text-center text-emerald-700 font-medium">{s.presentClasses}</td>
                        <td className="py-3 px-4 text-center font-bold text-rose-600">{s.percentage}%</td>
                        <td className="py-3 px-4 text-right">
                          <Badge status="LOW_ATTENDANCE" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
