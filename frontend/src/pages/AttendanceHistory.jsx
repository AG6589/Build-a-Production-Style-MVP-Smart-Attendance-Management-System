import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import Badge from '../components/Badge';
import Modal from '../components/Modal';
import {
  History,
  Search,
  Filter,
  Eye,
  Calendar,
  Clock,
  BookOpen,
  Users,
  CheckCircle2,
  XCircle,
  Loader2
} from 'lucide-react';

const AttendanceHistory = () => {
  const [sessions, setSessions] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Selected session detail modal
  const [selectedSession, setSelectedSession] = useState(null);
  const [sessionRecords, setSessionRecords] = useState([]);
  const [modalLoading, setModalLoading] = useState(false);

  const fetchFilters = async () => {
    try {
      const [subjRes, secRes] = await Promise.all([
        api.get('/academic/subjects'),
        api.get('/academic/sections')
      ]);
      if (subjRes.data.success) setSubjects(subjRes.data.data);
      if (secRes.data.success) setSections(secRes.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const params = {};
      if (selectedSubject) params.subjectId = selectedSubject;
      if (selectedSection) params.sectionId = selectedSection;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      if (statusFilter) params.status = statusFilter;

      const res = await api.get('/attendance/sessions', { params });
      if (res.data.success) {
        setSessions(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFilters();
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [selectedSubject, selectedSection, startDate, endDate, statusFilter]);

  const handleOpenDetails = async (sess) => {
    setSelectedSession(sess);
    setModalLoading(true);
    try {
      const res = await api.get(`/attendance/sessions/${sess._id}`);
      if (res.data.success) {
        setSessionRecords(res.data.data.records);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setModalLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Attendance History</h1>
        <p className="text-xs text-slate-500 mt-1">
          Historical log of recorded lecture sessions and student attendance rosters
        </p>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
          <Filter className="w-4 h-4 text-indigo-600" /> Filter Sessions
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Subject Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Subject</label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="">All Subjects</option>
              {subjects.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.code} - {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Section Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Section</label>
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              className="w-full border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="">All Sections</option>
              {sections.map((sec) => (
                <option key={sec._id} value={sec._id}>
                  {sec.name}
                </option>
              ))}
            </select>
          </div>

          {/* Start Date */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">From Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          {/* End Date */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">To Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="">All Statuses</option>
              <option value="SUBMITTED">SUBMITTED (Locked)</option>
              <option value="DRAFT">DRAFT (Editable)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Sessions Table */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-slate-900">Recorded Sessions ({sessions.length})</h3>
        </div>

        {loading ? (
          <div className="py-12 flex justify-center">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
          </div>
        ) : sessions.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            No attendance sessions found matching the filter criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/50 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4">Subject</th>
                  <th className="py-3 px-4">Section</th>
                  <th className="py-3 px-4">Faculty</th>
                  <th className="py-3 px-4 text-center">Roster</th>
                  <th className="py-3 px-4 text-center">Present / Absent</th>
                  <th className="py-3 px-4 text-center">Rate</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sessions.map((sess) => {
                  const rate =
                    sess.totalStudents > 0
                      ? Math.round((sess.presentCount / sess.totalStudents) * 100)
                      : 0;
                  return (
                    <tr key={sess._id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4">
                        <p className="font-semibold text-slate-900">
                          {new Date(sess.date).toLocaleDateString('en-US', {
                            weekday: 'short',
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </p>
                        <p className="text-[11px] text-slate-500 font-mono">
                          {sess.startTime} - {sess.endTime || 'Done'}
                        </p>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-mono text-xs font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                          {sess.subject?.code}
                        </span>
                        <p className="text-slate-800 font-medium mt-0.5">{sess.subject?.name}</p>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-700">{sess.section?.name}</td>
                      <td className="py-3 px-4 text-slate-600">{sess.faculty?.name || 'Assigned Faculty'}</td>
                      <td className="py-3 px-4 text-center font-mono font-medium">{sess.totalStudents}</td>
                      <td className="py-3 px-4 text-center">
                        <span className="text-emerald-700 font-semibold">{sess.presentCount}</span> /{' '}
                        <span className="text-rose-700 font-semibold">{sess.absentCount}</span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="font-bold text-slate-800">{rate}%</span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Badge status={sess.status} />
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleOpenDetails(sess)}
                          className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold inline-flex items-center gap-1 transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" /> View Roster
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Session Roster Details Modal */}
      <Modal
        isOpen={!!selectedSession}
        onClose={() => setSelectedSession(null)}
        title="Session Attendance Roster"
        maxWidth="max-w-2xl"
      >
        {selectedSession && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <p className="text-[10px] uppercase font-semibold text-slate-400">Course</p>
                <p className="font-bold text-slate-900">{selectedSession.subject?.code}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-semibold text-slate-400">Section</p>
                <p className="font-bold text-slate-900">{selectedSession.section?.name}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-semibold text-slate-400">Date</p>
                <p className="font-bold text-slate-900">
                  {new Date(selectedSession.date).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-semibold text-slate-400">Status</p>
                <Badge status={selectedSession.status} />
              </div>
            </div>

            {modalLoading ? (
              <div className="py-8 flex justify-center">
                <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
              </div>
            ) : (
              <div className="max-h-96 overflow-y-auto border border-slate-100 rounded-xl">
                <table className="w-full text-left">
                  <thead className="sticky top-0 bg-white border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase">
                    <tr>
                      <th className="py-2.5 px-3">Student ID</th>
                      <th className="py-2.5 px-3">Name</th>
                      <th className="py-2.5 px-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {sessionRecords.map((r) => (
                      <tr key={r._id} className="hover:bg-slate-50">
                        <td className="py-2 px-3 font-mono font-medium text-slate-700">
                          {r.student?.studentId}
                        </td>
                        <td className="py-2 px-3 font-semibold text-slate-900">{r.student?.name}</td>
                        <td className="py-2 px-3 text-right">
                          <Badge status={r.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedSession(null)}
                className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AttendanceHistory;
