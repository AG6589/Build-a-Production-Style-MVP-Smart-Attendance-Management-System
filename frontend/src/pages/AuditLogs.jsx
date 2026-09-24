import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { ScrollText, Search, Filter, Loader2, ShieldCheck } from 'lucide-react';

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('');
  const [entityFilter, setEntityFilter] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = {};
      if (actionFilter) params.action = actionFilter;
      if (entityFilter) params.entity = entityFilter;

      const res = await api.get('/audit-logs', { params });
      if (res.data.success) {
        setLogs(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [actionFilter, entityFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">System Audit Trail</h1>
        <p className="text-xs text-slate-500 mt-1">
          Immutable historical log of security events, administrative changes, and attendance modifications
        </p>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3">
        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
        >
          <option value="">All Actions</option>
          <option value="ATTENDANCE_SUBMITTED">ATTENDANCE_SUBMITTED</option>
          <option value="CORRECTION_APPROVED">CORRECTION_APPROVED</option>
          <option value="CORRECTION_REJECTED">CORRECTION_REJECTED</option>
          <option value="SETTING_UPDATED">SETTING_UPDATED</option>
          <option value="USER_LOGIN">USER_LOGIN</option>
          <option value="SUBJECT_CREATED">SUBJECT_CREATED</option>
          <option value="DEPARTMENT_CREATED">DEPARTMENT_CREATED</option>
        </select>

        <select
          value={entityFilter}
          onChange={(e) => setEntityFilter(e.target.value)}
          className="border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
        >
          <option value="">All Entities</option>
          <option value="AttendanceSession">AttendanceSession</option>
          <option value="CorrectionRequest">CorrectionRequest</option>
          <option value="Setting">Setting</option>
          <option value="User">User</option>
          <option value="Subject">Subject</option>
          <option value="Department">Department</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            Verified Audit Events ({logs.length})
          </h3>
        </div>

        {loading ? (
          <div className="py-12 flex justify-center">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
          </div>
        ) : logs.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">No audit logs matching filters.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/50 text-slate-500 font-semibold uppercase text-[11px]">
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Operator / Actor</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Target Entity</th>
                  <th className="py-3 px-4">Audit Rationale / Values</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                {logs.map((log) => (
                  <tr key={log._id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-sans">
                      <p className="font-semibold text-slate-900">{log.performedBy?.name || 'System'}</p>
                      <span className="text-[10px] text-slate-400 uppercase font-mono">
                        {log.userRole || 'admin'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-indigo-700 font-bold border border-slate-200">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-700 font-sans font-medium">{log.entity}</td>
                    <td className="py-3 px-4 font-sans text-slate-600 max-w-sm">
                      <p className="font-medium text-slate-900">{log.reason || 'Standard operation'}</p>
                      {log.newValue && (
                        <p className="text-[10px] font-mono text-slate-400 truncate mt-0.5">
                          {JSON.stringify(log.newValue)}
                        </p>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuditLogs;
