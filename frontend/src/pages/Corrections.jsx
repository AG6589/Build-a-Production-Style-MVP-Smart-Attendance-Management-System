import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import Badge from '../components/Badge';
import Modal from '../components/Modal';
import {
  FileCheck2,
  Plus,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Check,
  X,
  Filter,
  Loader2
} from 'lucide-react';

const Corrections = () => {
  const { user, role } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  // Modals
  const [showNewModal, setShowNewModal] = useState(false);
  const [studentRecentAbsentRecords, setStudentRecentAbsentRecords] = useState([]);
  const [selectedRecordId, setSelectedRecordId] = useState('');
  const [requestedStatus, setRequestedStatus] = useState('PRESENT');
  const [reason, setReason] = useState('');
  const [comment, setComment] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Review Modal (for Reviewer/Admin)
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [reviewAction, setReviewAction] = useState(null); // 'approve' | 'reject'
  const [reviewerComment, setReviewerComment] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState('');

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      const res = await api.get('/corrections', { params });
      if (res.data.success) {
        setRequests(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching correction requests:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [statusFilter]);

  // Load student absent records for the new request modal
  const handleOpenNewModal = async () => {
    setShowNewModal(true);
    setSubmitError('');
    try {
      const res = await api.get('/attendance/student-summary');
      if (res.data.success) {
        const absents = (res.data.data.recentRecords || []).filter((r) => r.status === 'ABSENT');
        setStudentRecentAbsentRecords(absents);
        if (absents.length > 0) {
          setSelectedRecordId(absents[0]._id);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateRequest = async (e) => {
    e.preventDefault();
    if (!selectedRecordId) {
      setSubmitError('Please select an absent attendance session');
      return;
    }
    if (!reason.trim()) {
      setSubmitError('Reason is required');
      return;
    }

    setSubmitLoading(true);
    setSubmitError('');
    try {
      const res = await api.post('/corrections', {
        recordId: selectedRecordId,
        requestedStatus,
        reason,
        comment
      });
      if (res.data.success) {
        setShowNewModal(false);
        setReason('');
        setComment('');
        fetchRequests();
      }
    } catch (err) {
      setSubmitError(err.response?.data?.message || 'Failed to submit correction request');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleOpenReview = (req, action) => {
    setSelectedRequest(req);
    setReviewAction(action);
    setReviewerComment(action === 'approve' ? 'Approved after cross-verifying biometric/OD proof' : '');
    setReviewError('');
  };

  const handleConfirmReview = async () => {
    if (reviewAction === 'reject' && !reviewerComment.trim()) {
      setReviewError('A reason is mandatory for rejection');
      return;
    }

    setReviewLoading(true);
    setReviewError('');
    try {
      const endpoint = `/corrections/${selectedRequest._id}/${reviewAction}`;
      await api.put(endpoint, { reviewerComment });
      setSelectedRequest(null);
      fetchRequests();
    } catch (err) {
      setReviewError(err.response?.data?.message || `Failed to ${reviewAction} request`);
    } finally {
      setReviewLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Attendance Correction Requests</h1>
          <p className="text-xs text-slate-500 mt-1">
            Formal audit-logged workflow for reviewing and correcting attendance discrepancies
          </p>
        </div>
        {role === 'student' && (
          <button
            onClick={handleOpenNewModal}
            className="px-4 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md shadow-indigo-600/20 transition-all flex items-center gap-2 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            File Correction Request
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 bg-slate-200/60 p-1 rounded-xl w-fit text-xs font-medium">
        <button
          onClick={() => setStatusFilter('')}
          className={`px-3 py-1.5 rounded-lg transition-all ${
            statusFilter === '' ? 'bg-white text-slate-900 shadow-sm font-semibold' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          All Petitions
        </button>
        <button
          onClick={() => setStatusFilter('PENDING')}
          className={`px-3 py-1.5 rounded-lg transition-all ${
            statusFilter === 'PENDING' ? 'bg-white text-amber-700 shadow-sm font-semibold' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Pending Review
        </button>
        <button
          onClick={() => setStatusFilter('APPROVED')}
          className={`px-3 py-1.5 rounded-lg transition-all ${
            statusFilter === 'APPROVED' ? 'bg-white text-emerald-700 shadow-sm font-semibold' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Approved
        </button>
        <button
          onClick={() => setStatusFilter('REJECTED')}
          className={`px-3 py-1.5 rounded-lg transition-all ${
            statusFilter === 'REJECTED' ? 'bg-white text-rose-700 shadow-sm font-semibold' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Rejected
        </button>
      </div>

      {/* Requests Table */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        {loading ? (
          <div className="py-12 flex justify-center">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
          </div>
        ) : requests.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            No correction requests found matching this status filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/50 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Subject</th>
                  <th className="py-3 px-4">Session Date</th>
                  <th className="py-3 px-4">Correction Type</th>
                  <th className="py-3 px-4">Reason & Justification</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Review Details / Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {requests.map((req) => (
                  <tr key={req._id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4">
                      <p className="font-semibold text-slate-900">{req.student?.name}</p>
                      <p className="text-[10px] text-slate-500 font-mono">{req.student?.studentId}</p>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-mono text-indigo-600 font-semibold">{req.subject?.code}</span>
                      <p className="text-slate-800">{req.subject?.name}</p>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {new Date(req.session?.date).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 font-medium">
                        <span className="text-rose-600 line-through">{req.originalStatus}</span>
                        <span>→</span>
                        <span className="text-emerald-600 font-bold">{req.requestedStatus}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 max-w-xs">
                      <p className="text-slate-900 font-medium">{req.reason}</p>
                      {req.comment && <p className="text-[11px] text-slate-400 mt-0.5">{req.comment}</p>}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Badge status={req.status} />
                    </td>
                    <td className="py-3 px-4 text-right">
                      {req.status === 'PENDING' && (role === 'admin' || role === 'reviewer') ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenReview(req, 'approve')}
                            className="px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg flex items-center gap-1"
                          >
                            <Check className="w-3.5 h-3.5" /> Approve
                          </button>
                          <button
                            onClick={() => handleOpenReview(req, 'reject')}
                            className="px-2.5 py-1 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg flex items-center gap-1"
                          >
                            <X className="w-3.5 h-3.5" /> Reject
                          </button>
                        </div>
                      ) : (
                        <div className="text-[11px] text-slate-500">
                          {req.reviewedBy ? (
                            <>
                              <p className="font-medium text-slate-700">By: {req.reviewedBy?.name}</p>
                              {req.reviewerComment && (
                                <p className="italic text-[10px] text-slate-400">"{req.reviewerComment}"</p>
                              )}
                            </>
                          ) : (
                            <span className="text-amber-600 font-medium">Awaiting Review</span>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* New Correction Request Modal (Student) */}
      <Modal isOpen={showNewModal} onClose={() => setShowNewModal(false)} title="File Attendance Correction Request">
        <form onSubmit={handleCreateRequest} className="space-y-4 text-xs">
          {submitError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{submitError}</span>
            </div>
          )}

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Select Absent Lecture Session</label>
            {studentRecentAbsentRecords.length === 0 ? (
              <p className="p-3 bg-slate-50 rounded-xl text-slate-500">
                No recent absent records detected in your profile.
              </p>
            ) : (
              <select
                value={selectedRecordId}
                onChange={(e) => setSelectedRecordId(e.target.value)}
                required
                className="w-full border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                {studentRecentAbsentRecords.map((r) => (
                  <option key={r._id} value={r._id}>
                    {new Date(r.date).toLocaleDateString()} - {r.subject?.name} ({r.subject?.code})
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Requested Correction Status</label>
            <input
              type="text"
              readOnly
              value={requestedStatus}
              className="w-full border border-slate-200 bg-slate-50 rounded-xl p-2.5 text-xs font-bold text-emerald-700"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Reason for Correction <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Present in room, biometric scanner was malfunctioning"
              className="w-full border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Optional Comment / Proof Reference</label>
            <textarea
              rows={2}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="e.g. Dr. Alan Turing can verify attendance; submitted OD letter to HOD"
              className="w-full border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowNewModal(false)}
              className="px-3 py-1.5 font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitLoading || studentRecentAbsentRecords.length === 0}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold shadow disabled:opacity-50 flex items-center gap-1.5"
            >
              {submitLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit Petition'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Review Modal (Admin / Reviewer) */}
      <Modal
        isOpen={!!selectedRequest}
        onClose={() => setSelectedRequest(null)}
        title={reviewAction === 'approve' ? 'Approve Attendance Correction' : 'Reject Attendance Correction'}
      >
        {selectedRequest && (
          <div className="space-y-4 text-xs">
            {reviewError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{reviewError}</span>
              </div>
            )}

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <p><strong>Student:</strong> {selectedRequest.student?.name} ({selectedRequest.student?.studentId})</p>
              <p><strong>Subject:</strong> {selectedRequest.subject?.name} ({selectedRequest.subject?.code})</p>
              <p><strong>Reason:</strong> {selectedRequest.reason}</p>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Reviewer Remark / Reason {reviewAction === 'reject' && <span className="text-rose-500">*</span>}
              </label>
              <textarea
                rows={3}
                value={reviewerComment}
                onChange={(e) => setReviewerComment(e.target.value)}
                placeholder={reviewAction === 'approve' ? 'Optional verification note' : 'Mandatory rejection reason'}
                className="w-full border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedRequest(null)}
                className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={reviewLoading}
                onClick={handleConfirmReview}
                className={`px-4 py-2 font-semibold text-white rounded-xl shadow flex items-center gap-1.5 ${
                  reviewAction === 'approve' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                {reviewLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : `Confirm ${reviewAction === 'approve' ? 'Approval' : 'Rejection'}`}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Corrections;
