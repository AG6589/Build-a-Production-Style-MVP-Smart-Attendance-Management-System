import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import Badge from '../components/Badge';
import Modal from '../components/Modal';
import {
  CheckSquare,
  Search,
  CheckCircle2,
  XCircle,
  Save,
  Send,
  Lock,
  AlertCircle,
  Clock,
  Calendar,
  Users,
  Loader2
} from 'lucide-react';

const MarkAttendance = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Selector state
  const [subjects, setSubjects] = useState([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState(searchParams.get('subjectId') || '');
  const [selectedSectionId, setSelectedSectionId] = useState(searchParams.get('sectionId') || '');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');

  // Session & student roster state
  const [session, setSession] = useState(null);
  const [records, setRecords] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Loading & error state
  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [message, setMessage] = useState(null); // { type: 'success'|'error', text: '' }
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Fetch available subjects
  useEffect(() => {
    const fetchAcademicData = async () => {
      try {
        const res = await api.get('/academic/subjects');
        if (res.data.success) {
          setSubjects(res.data.data);
          if (!selectedSubjectId && res.data.data.length > 0) {
            setSelectedSubjectId(res.data.data[0]._id);
            setSelectedSectionId(res.data.data[0].section?._id || '');
          }
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchAcademicData();
  }, []);

  // When subject changes, automatically set section
  const handleSubjectChange = (subjectId) => {
    setSelectedSubjectId(subjectId);
    const subj = subjects.find((s) => s._id === subjectId);
    if (subj?.section) {
      setSelectedSectionId(subj.section._id);
    }
    setSession(null);
    setRecords([]);
  };

  // Load or create session
  const handleLoadRoster = async () => {
    if (!selectedSubjectId || !selectedSectionId) {
      setMessage({ type: 'error', text: 'Please select both Subject and Section' });
      return;
    }

    setLoading(true);
    setMessage(null);
    try {
      const res = await api.post('/attendance/sessions', {
        subjectId: selectedSubjectId,
        sectionId: selectedSectionId,
        date,
        startTime,
        endTime
      });

      if (res.data.success) {
        setSession(res.data.data.session);
        // Map records
        const mapped = res.data.data.records.map((r) => ({
          studentId: r.student?._id,
          studentCode: r.student?.studentId,
          name: r.student?.name,
          rollNumber: r.student?.rollNumber,
          status: r.status,
          remarks: r.remarks || ''
        }));
        setRecords(mapped);
        setHasUnsavedChanges(false);
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to load roster' });
    } finally {
      setLoading(false);
    }
  };

  // Individual toggle
  const handleToggleStatus = (studentId, newStatus) => {
    if (session?.status === 'SUBMITTED') return;
    setRecords((prev) =>
      prev.map((r) => (r.studentId === studentId ? { ...r, status: newStatus } : r))
    );
    setHasUnsavedChanges(true);
  };

  // Bulk actions
  const handleMarkAll = (status) => {
    if (session?.status === 'SUBMITTED') return;
    setRecords((prev) => prev.map((r) => ({ ...r, status })));
    setHasUnsavedChanges(true);
  };

  // Save Draft
  const handleSaveDraft = async () => {
    if (!session) return;
    setSaveLoading(true);
    setMessage(null);
    try {
      const res = await api.put(`/attendance/sessions/${session._id}/draft`, {
        records: records.map((r) => ({ studentId: r.studentId, status: r.status }))
      });
      if (res.data.success) {
        setSession(res.data.data);
        setHasUnsavedChanges(false);
        setMessage({ type: 'success', text: 'Attendance draft saved successfully!' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to save draft' });
    } finally {
      setSaveLoading(false);
    }
  };

  // Submit Attendance (Lock)
  const handleConfirmSubmit = async () => {
    if (!session) return;
    setSubmitLoading(true);
    setMessage(null);
    try {
      const res = await api.post(`/attendance/sessions/${session._id}/submit`, {
        records: records.map((r) => ({ studentId: r.studentId, status: r.status }))
      });
      if (res.data.success) {
        setSession(res.data.data);
        setHasUnsavedChanges(false);
        setShowConfirmModal(false);
        setMessage({
          type: 'success',
          text: 'Attendance submitted and locked successfully! Further edits require formal correction requests.'
        });
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to submit attendance' });
    } finally {
      setSubmitLoading(false);
    }
  };

  // Counts & Calculations
  const total = records.length;
  const presentCount = records.filter((r) => r.status === 'PRESENT' || r.status === 'LATE').length;
  const absentCount = total - presentCount;
  const percentage = total > 0 ? Math.round((presentCount / total) * 100) : 0;

  // Filter students by search
  const filteredRecords = records.filter((r) => {
    const q = searchQuery.toLowerCase();
    return r.name?.toLowerCase().includes(q) || r.studentCode?.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Mark Attendance</h1>
          <p className="text-xs text-slate-500 mt-1">
            Conduct lecture session, mark student roster, and submit verified attendance
          </p>
        </div>
        {hasUnsavedChanges && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs font-semibold animate-pulse self-start sm:self-auto">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            Unsaved Changes
          </div>
        )}
      </div>

      {/* Alert Banner */}
      {message && (
        <div
          className={`p-4 rounded-xl text-xs flex items-center justify-between border ${
            message.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{message.text}</span>
          </div>
          <button onClick={() => setMessage(null)} className="text-xs font-bold hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Lock Banner if Submitted */}
      {session?.status === 'SUBMITTED' && (
        <div className="p-4 rounded-xl bg-slate-900 text-white flex items-center justify-between text-xs shadow-lg">
          <div className="flex items-center gap-3">
            <Lock className="w-5 h-5 text-indigo-400 shrink-0" />
            <div>
              <p className="font-bold">Session Locked (Submitted on {new Date(session.submittedAt || session.updatedAt).toLocaleString()})</p>
              <p className="text-slate-400 text-[11px] mt-0.5">
                Attendance records are locked against direct editing to guarantee audit integrity.
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/corrections')}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold shrink-0"
          >
            File Correction Request
          </button>
        </div>
      )}

      {/* Session Config Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Session Details</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Subject */}
          <div className="lg:col-span-2">
            <label className="block text-[11px] font-semibold text-slate-700 uppercase mb-1">Subject</label>
            <select
              value={selectedSubjectId}
              onChange={(e) => handleSubjectChange(e.target.value)}
              disabled={!!session}
              className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 disabled:bg-slate-50"
            >
              {subjects.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.code} - {s.name} ({s.section?.name || 'All'})
                </option>
              ))}
            </select>
          </div>

          {/* Date */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 uppercase mb-1">Session Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              disabled={!!session}
              className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 disabled:bg-slate-50"
            />
          </div>

          {/* Start Time */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 uppercase mb-1">Start Time</label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              disabled={!!session}
              className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 disabled:bg-slate-50"
            />
          </div>

          {/* Action button */}
          <div className="flex items-end">
            {!session ? (
              <button
                type="button"
                onClick={handleLoadRoster}
                disabled={loading}
                className="w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/20 flex items-center justify-center gap-1.5 transition-all"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Load Student Roster'}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setSession(null);
                  setRecords([]);
                }}
                className="w-full py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all"
              >
                Change Session
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Attendance Roster & Controls */}
      {session && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
          {/* Summary KPI Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-50/80 rounded-xl border border-slate-200/80">
            <div>
              <p className="text-[11px] font-semibold text-slate-500 uppercase">Total Students</p>
              <p className="text-xl font-bold text-slate-900 mt-0.5">{total}</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold text-emerald-600 uppercase">Present</p>
              <p className="text-xl font-bold text-emerald-700 mt-0.5">{presentCount}</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold text-rose-600 uppercase">Absent</p>
              <p className="text-xl font-bold text-rose-700 mt-0.5">{absentCount}</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold text-indigo-600 uppercase">Attendance Rate</p>
              <p className="text-xl font-bold text-indigo-700 mt-0.5">{percentage}%</p>
            </div>
          </div>

          {/* Search & Bulk Controls Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search student by name or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              />
            </div>

            {session.status !== 'SUBMITTED' && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleMarkAll('PRESENT')}
                  className="px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" /> Mark All Present
                </button>
                <button
                  type="button"
                  onClick={() => handleMarkAll('ABSENT')}
                  className="px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <XCircle className="w-3.5 h-3.5" /> Mark All Absent
                </button>
              </div>
            )}
          </div>

          {/* Roster Table */}
          <div className="overflow-x-auto border border-slate-100 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">#</th>
                  <th className="py-3 px-4">Student ID</th>
                  <th className="py-3 px-4">Name</th>
                  <th className="py-3 px-4">Roll Number</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Controls</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRecords.map((r, idx) => (
                  <tr key={r.studentId} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 text-slate-400 font-mono">{idx + 1}</td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-700">{r.studentCode}</td>
                    <td className="py-3 px-4 font-semibold text-slate-900">{r.name}</td>
                    <td className="py-3 px-4 text-slate-500">{r.rollNumber || '—'}</td>
                    <td className="py-3 px-4 text-center">
                      <Badge status={r.status} />
                    </td>
                    <td className="py-3 px-4 text-right">
                      {session.status !== 'SUBMITTED' ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(r.studentId, 'PRESENT')}
                            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                              r.status === 'PRESENT'
                                ? 'bg-emerald-600 text-white shadow-sm'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            P
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(r.studentId, 'ABSENT')}
                            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                              r.status === 'ABSENT'
                                ? 'bg-rose-600 text-white shadow-sm'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            A
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400 font-medium">Locked</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Action Footer */}
          {session.status !== 'SUBMITTED' && (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-4 border-t border-slate-100">
              <span className="text-xs text-slate-500">
                Saving as draft keeps records editable. Final submission permanently locks session.
              </span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleSaveDraft}
                  disabled={saveLoading}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 shadow-sm flex items-center gap-1.5"
                >
                  {saveLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save Draft
                </button>
                <button
                  type="button"
                  onClick={() => setShowConfirmModal(true)}
                  disabled={submitLoading}
                  className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md shadow-indigo-600/20 flex items-center gap-1.5"
                >
                  <Send className="w-4 h-4" />
                  Submit Attendance
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Final Submission Confirmation Modal */}
      <Modal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        title="Confirm Attendance Submission"
      >
        <div className="space-y-4 text-xs">
          <p className="text-slate-600 leading-relaxed">
            Are you sure you want to finalize and submit attendance for this session? Once submitted,
            the session will be <strong className="text-slate-900">locked against direct modification</strong>. Any subsequent changes
            will require formal administrative review and correction audit logs.
          </p>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <p><strong>Students Total:</strong> {total}</p>
            <p className="text-emerald-700"><strong>Present:</strong> {presentCount} ({percentage}%)</p>
            <p className="text-rose-700"><strong>Absent:</strong> {absentCount}</p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowConfirmModal(false)}
              className="px-3.5 py-1.5 text-slate-600 hover:bg-slate-100 rounded-xl font-medium"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={submitLoading}
              onClick={handleConfirmSubmit}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold shadow flex items-center gap-1.5"
            >
              {submitLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm & Submit'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default MarkAttendance;
