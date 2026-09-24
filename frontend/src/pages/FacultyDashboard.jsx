import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import StatCard from '../components/StatCard';
import Badge from '../components/Badge';
import {
  CheckSquare,
  BookOpen,
  CalendarCheck,
  FileCheck2,
  AlertTriangle,
  ArrowRight,
  Clock,
  Percent
} from 'lucide-react';

const FacultyDashboard = () => {
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
        console.error('Error fetching faculty dashboard stats:', err);
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
  const assignedSubjects = data?.assignedSubjects || [];
  const todaySessions = data?.todaySessions || [];
  const lowAttendanceList = data?.lowAttendanceList || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Faculty Dashboard</h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage your courses, mark daily session attendance, and monitor student retention
          </p>
        </div>
        <Link
          to="/attendance/mark"
          className="px-4 py-2.5 text-xs font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 shadow-md shadow-indigo-600/20 transition-all flex items-center gap-2 self-start sm:self-auto"
        >
          <CheckSquare className="w-4 h-4" />
          Mark Attendance Now
        </Link>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Assigned Subjects"
          value={metrics.assignedSubjectsCount || assignedSubjects.length}
          subtitle="Courses in current term"
          icon={BookOpen}
          color="indigo"
        />
        <StatCard
          title="Conducted Sessions"
          value={metrics.totalConductedSessions}
          subtitle="Submitted lectures"
          icon={CalendarCheck}
          color="blue"
        />
        <StatCard
          title="Average Attendance"
          value={`${metrics.averageAttendance}%`}
          subtitle="Across your classes"
          icon={Percent}
          color="emerald"
        />
        <StatCard
          title="At-Risk Students"
          value={metrics.lowAttendanceCount}
          subtitle={`Below ${metrics.threshold}% requirement`}
          icon={AlertTriangle}
          color="rose"
        />
      </div>

      {/* Two Column Layout: Assigned Subjects & Low Attendance Alert */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Assigned Subjects */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900">Your Assigned Subjects & Sections</h3>
              <span className="text-xs text-slate-500">{assignedSubjects.length} Active Courses</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {assignedSubjects.map((subj) => (
                <div
                  key={subj._id}
                  className="p-4 rounded-xl border border-slate-200 hover:border-indigo-300 transition-all hover:shadow-sm bg-slate-50/50"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-xs font-bold px-2 py-0.5 rounded bg-indigo-100 text-indigo-700">
                        {subj.code}
                      </span>
                      <h4 className="text-sm font-semibold text-slate-900 mt-2">{subj.name}</h4>
                    </div>
                    <span className="text-xs font-medium text-slate-500 px-2 py-0.5 rounded bg-white border border-slate-200">
                      {subj.section?.name || 'All Sections'}
                    </span>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs">
                    <span className="text-slate-500">Semester {subj.semester}</span>
                    <Link
                      to={`/attendance/mark?subjectId=${subj._id}&sectionId=${subj.section?._id}`}
                      className="font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                    >
                      Mark Roster <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Today's Scheduled / Conducted Sessions */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 mb-3">Today's Attendance Sessions</h3>
            {todaySessions.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">No sessions recorded for today yet.</p>
            ) : (
              <div className="space-y-2">
                {todaySessions.map((sess) => (
                  <div
                    key={sess._id}
                    className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50 text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <Clock className="w-4 h-4 text-slate-400" />
                      <div>
                        <p className="font-semibold text-slate-900">
                          {sess.subject?.name} ({sess.subject?.code}) - {sess.section?.name}
                        </p>
                        <p className="text-slate-500 text-[11px]">{sess.startTime} - {sess.endTime || 'Ongoing'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-slate-600 font-medium">
                        {sess.presentCount} / {sess.totalStudents} Present
                      </span>
                      <Badge status={sess.status} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Students Below Threshold Alert */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Low Attendance Alerts</h3>
              <p className="text-[11px] text-slate-500">Students below {metrics.threshold}% requirement</p>
            </div>
            <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
              {lowAttendanceList.length}
            </span>
          </div>

          <div className="mt-3 flex-1 overflow-y-auto space-y-2 max-h-[450px]">
            {lowAttendanceList.length === 0 ? (
              <p className="text-xs text-slate-400 py-8 text-center">
                All students in your subjects are currently meeting attendance thresholds!
              </p>
            ) : (
              lowAttendanceList.map((stu, i) => (
                <div
                  key={i}
                  className="p-3 rounded-xl border border-rose-100 bg-rose-50/40 text-xs flex items-center justify-between"
                >
                  <div>
                    <p className="font-semibold text-slate-900">{stu.name}</p>
                    <p className="text-[10px] text-slate-500">
                      {stu.studentId} • {stu.subject} ({stu.section})
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-rose-600">{stu.percentage}%</span>
                    <p className="text-[9px] text-slate-400">{stu.classesAttended} classes</p>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100">
            <Link
              to="/reports"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center justify-center gap-1"
            >
              View Full Attendance Reports <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FacultyDashboard;
