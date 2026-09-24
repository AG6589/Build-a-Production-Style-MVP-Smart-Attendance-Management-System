import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import StatCard from '../components/StatCard';
import Badge from '../components/Badge';
import Modal from '../components/Modal';
import {
  FileCheck2,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Eye,
  Check,
  X,
  Loader2
} from 'lucide-react';

const ReviewerDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [actionType, setActionType] = useState(null); // 'approve' or 'reject'
  const [reviewerComment, setReviewerComment] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState('');

  const fetchStats = async () => {
    try {
      const res = await api.get('/dashboard/stats');
      if (res.data.success) {
        setData(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching reviewer stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleOpenAction = (req, type) => {
    setSelectedRequest(req);
    setActionType(type);
    setReviewerComment(type === 'approve' ? 'Approved after cross-verifying register/OD' : '');
    setActionError('');
  };

  const handleConfirmAction = async () => {
    if (actionType === 'reject' && !reviewerComment.trim()) {
      setActionError('A remark/reason is required to reject a correction request.');
      return;
    }

    setActionLoading(true);
    setActionError('');
    try {
      const endpoint = `/corrections/${selectedRequest._id}/${actionType}`;
      await api.put(endpoint, { reviewerComment });
      setSelectedRequest(null);
      fetchStats();
    } catch (err) {
      setActionError(err.response?.data?.message || `Failed to ${actionType} request`);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const metrics = data?.metrics || {};
  const pendingRequests = data?.pendingRequests || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Reviewer Portal</h1>
          <p className="text-xs text-slate-500 mt-1">
            Department review queue for student and faculty attendance correction petitions
          </p>
        </div>
        <Link
          to="/corrections"
          className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 shadow-sm transition-all"
        >
          View All Petitions History
        </Link>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Pending Review"
          value={metrics.pendingCount}
          subtitle="Requests awaiting decision"
          icon={Clock}
          color="amber"
        />
        <StatCard
          title="Approved Corrections"
          value={metrics.approvedCount}
          subtitle="Attendance updated"
          icon={CheckCircle2}
          color="emerald"
        />
        <StatCard
          title="Rejected Requests"
          value={metrics.rejectedCount}
          subtitle="Declined petitions"
          icon={XCircle}
          color="rose"
        />
        <StatCard
          title="Total Processed"
          value={metrics.totalProcessed}
          subtitle="Historical petitions resolved"
          icon={FileCheck2}
          color="indigo"
        />
      </div>

      {/* Pending Requests Table */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Pending Review Queue</h3>
            <p className="text-xs text-slate-500">Review petitions submitted by students and faculty</p>
          </div>
          <span className="text-xs font-bold px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg">
            {pendingRequests.length} Pending
          </span>
        </div>

        {pendingRequests.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
            <p className="font-semibold text-slate-700">All caught up!</p>
            <p className="mt-1">There are no pending correction requests in the department queue.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/50 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Subject</th>
                  <th className="py-3 px-4">Session Date</th>
                  <th className="py-3 px-4">Reason / Justification</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pendingRequests.map((req) => (
                  <tr key={req._id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      <div>
                        {req.student?.name}
                        <p className="text-[10px] text-slate-500 font-mono">{req.student?.studentId}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-medium text-slate-800">{req.subject?.name}</p>
                      <span className="text-[10px] font-mono text-indigo-600 bg-indigo-50 px-1 py-0.5 rounded">
                        {req.subject?.code}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {new Date(req.session?.date).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-slate-700 max-w-xs truncate" title={req.reason}>
                      {req.reason}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Badge status={req.status} />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenAction(req, 'approve')}
                          className="px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors flex items-center gap-1"
                        >
                          <Check className="w-3.5 h-3.5" /> Approve
                        </button>
                        <button
                          onClick={() => handleOpenAction(req, 'reject')}
                          className="px-2.5 py-1 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors flex items-center gap-1"
                        >
                          <X className="w-3.5 h-3.5" /> Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Decision Modal */}
      <Modal
        isOpen={!!selectedRequest}
        onClose={() => setSelectedRequest(null)}
        title={actionType === 'approve' ? 'Approve Attendance Correction' : 'Reject Attendance Correction'}
      >
        {selectedRequest && (
          <div className="space-y-4 text-xs">
            {actionError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{actionError}</span>
              </div>
            )}

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1.5">
              <p>
                <strong className="text-slate-700">Student:</strong> {selectedRequest.student?.name} (
                {selectedRequest.student?.studentId})
              </p>
              <p>
                <strong className="text-slate-700">Course:</strong> {selectedRequest.subject?.name} (
                {selectedRequest.subject?.code})
              </p>
              <p>
                <strong className="text-slate-700">Requested Change:</strong>{' '}
                <span className="text-rose-600 line-through">ABSENT</span> →{' '}
                <span className="text-emerald-600 font-bold">PRESENT</span>
              </p>
              <p>
                <strong className="text-slate-700">Student's Reason:</strong> {selectedRequest.reason}
              </p>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Reviewer Remark / Reason {actionType === 'reject' && <span className="text-rose-500">*</span>}
              </label>
              <textarea
                rows={3}
                value={reviewerComment}
                onChange={(e) => setReviewerComment(e.target.value)}
                placeholder={
                  actionType === 'approve'
                    ? 'Enter approval rationale (e.g. On-duty verified)'
                    : 'Provide the specific reason for rejecting this correction request'
                }
                className="w-full border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedRequest(null)}
                className="px-3 py-1.5 font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleConfirmAction}
                className={`px-4 py-2 font-semibold text-white rounded-xl shadow transition-all flex items-center gap-1.5 ${
                  actionType === 'approve'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                {actionLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : actionType === 'approve' ? (
                  'Confirm Approval'
                ) : (
                  'Confirm Rejection'
                )}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ReviewerDashboard;
