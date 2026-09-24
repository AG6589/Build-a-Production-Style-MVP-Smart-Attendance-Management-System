import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import StatCard from '../components/StatCard';
import Badge from '../components/Badge';
import {
  CalendarCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileCheck2,
  BookOpen,
  ArrowRight,
  Clock
} from 'lucide-react';

const StudentDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/dashboard/stats');
        if (res.data.success) {
          setData(res.data.data);
        }
      } catch (err) {
        console.error('Error fetching student dashboard stats:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const metrics = data?.metrics || {};
  const student = data?.student || {};
  const subjects = data?.subjects || [];
  const recentRecords = data?.recentRecords || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Welcome back, {student.name || 'Student'}!
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {student.studentId} • {student.department} • Section {student.section}
          </p>
        </div>
        <Link
          to="/corrections"
          className="px-4 py-2.5 text-xs font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 shadow-md shadow-indigo-600/20 transition-all flex items-center gap-2 self-start sm:self-auto"
        >
          <FileCheck2 className="w-4 h-4" />
          Request Attendance Correction
        </Link>
      </div>

      {/* Low Attendance Warning Alert Banner */}
      {metrics.isLowAttendance && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-3.5 shadow-sm">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-bold text-rose-900">Attendance Warning: Action Required</h4>
            <p className="text-xs text-rose-700 mt-0.5 leading-relaxed">
              Your overall attendance is currently{' '}
              <span className="font-bold underline">{metrics.overallPercentage}%</span>, which is below the mandatory
              institutional requirement of <span className="font-bold">{metrics.threshold}%</span>. Please consult with your
              course instructors or raise corrections if discrepancies exist.
            </p>
          </div>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Overall Attendance"
          value={`${metrics.overallPercentage}%`}
          subtitle={`Required threshold: ${metrics.threshold}%`}
          icon={CalendarCheck}
          color={metrics.overallPercentage >= metrics.threshold ? 'emerald' : 'rose'}
        />
        <StatCard
          title="Total Conducted Classes"
          value={metrics.totalClasses}
          subtitle="Cumulative semester lectures"
          icon={BookOpen}
          color="indigo"
        />
        <StatCard
          title="Classes Attended"
          value={metrics.presentClasses}
          subtitle="Marked Present or Late"
          icon={CheckCircle2}
          color="emerald"
        />
        <StatCard
          title="Classes Missed"
          value={metrics.absentClasses}
          subtitle="Absences recorded"
          icon={XCircle}
          color="rose"
        />
      </div>

      {/* Subject-Wise Breakdown Table */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Subject-Wise Attendance Breakdown</h3>
            <p className="text-xs text-slate-500">Detailed lecture attendance per course</p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-md">
            {subjects.length} Enrolled Courses
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/50 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Subject</th>
                <th className="py-3 px-4">Faculty</th>
                <th className="py-3 px-4 text-center">Conducted</th>
                <th className="py-3 px-4 text-center">Attended</th>
                <th className="py-3 px-4 text-center">Missed</th>
                <th className="py-3 px-4 text-center">Percentage</th>
                <th className="py-3 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {subjects.map((subj) => (
                <tr key={subj.subjectId} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 px-4 font-semibold text-slate-900">
                    <div>
                      {subj.subjectName}
                      <span className="ml-2 font-mono text-[10px] text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                        {subj.subjectCode}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-slate-600">{subj.faculty}</td>
                  <td className="py-3 px-4 text-center font-medium text-slate-700">{subj.totalClasses}</td>
                  <td className="py-3 px-4 text-center font-medium text-emerald-600">{subj.presentClasses}</td>
                  <td className="py-3 px-4 text-center font-medium text-rose-600">{subj.absentClasses}</td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <span className={`font-bold ${subj.isLowAttendance ? 'text-rose-600' : 'text-emerald-700'}`}>
                        {subj.percentage}%
                      </span>
                      <div className="w-16 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-1.5 rounded-full ${
                            subj.isLowAttendance ? 'bg-rose-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${Math.min(100, subj.percentage)}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Badge status={subj.isLowAttendance ? 'LOW_ATTENDANCE' : 'HEALTHY'} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Attendance Sessions */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-slate-900">Recent Attendance Records</h3>
          <Link to="/attendance/history" className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
            View All History <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="space-y-2">
          {recentRecords.map((rec) => (
            <div
              key={rec._id}
              className="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 text-xs"
            >
              <div className="flex items-center gap-3">
                <Clock className="w-4 h-4 text-slate-400" />
                <div>
                  <p className="font-semibold text-slate-900">
                    {rec.subject?.name} ({rec.subject?.code})
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {new Date(rec.date).toLocaleDateString('en-US', {
                      weekday: 'short',
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Badge status={rec.status} />
                {rec.status === 'ABSENT' && (
                  <Link
                    to="/corrections"
                    className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 hover:underline"
                  >
                    Request Correction
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
