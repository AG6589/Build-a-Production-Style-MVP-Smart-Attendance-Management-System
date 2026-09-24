import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { Settings as SettingsIcon, Save, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

const Settings = () => {
  const [threshold, setThreshold] = useState(75);
  const [originalThreshold, setOriginalThreshold] = useState(75);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.get('/settings');
        if (res.data.success) {
          const val = res.data.data.lowAttendanceThreshold || 75;
          setThreshold(val);
          setOriginalThreshold(val);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const res = await api.put('/settings', {
        key: 'lowAttendanceThreshold',
        value: Number(threshold)
      });
      if (res.data.success) {
        setOriginalThreshold(threshold);
        setMessage({
          type: 'success',
          text: `Institutional minimum attendance threshold updated to ${threshold}%. Analytics and alert systems refreshed.`
        });
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to update threshold' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">System Configuration</h1>
        <p className="text-xs text-slate-500 mt-1">
          Configure institution-wide attendance policies, compliance thresholds, and notification rules
        </p>
      </div>

      {message && (
        <div
          className={`p-4 rounded-xl text-xs flex items-center gap-2 border ${
            message.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Threshold Config Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900 mb-1">Low Attendance Policy Threshold</h3>
        <p className="text-xs text-slate-500 mb-6 leading-relaxed">
          Students whose attendance percentage falls below this threshold will be flagged as{' '}
          <span className="font-semibold text-rose-600">"Low Attendance"</span> across dashboards, student alerts,
          and department reports.
        </p>

        <form onSubmit={handleSave} className="space-y-6">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700">Minimum Required Attendance</label>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={threshold}
                  onChange={(e) => setThreshold(Number(e.target.value))}
                  className="w-16 text-center font-bold text-indigo-700 bg-white border border-slate-300 rounded-lg py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
                <span className="text-xs font-bold text-slate-600">%</span>
              </div>
            </div>

            {/* Slider */}
            <input
              type="range"
              min={50}
              max={95}
              step={1}
              value={threshold}
              onChange={(e) => setThreshold(Number(e.target.value))}
              className="w-full accent-indigo-600 cursor-pointer"
            />

            <div className="flex justify-between text-[11px] font-mono text-slate-400">
              <span>50% (Lenient)</span>
              <span className="font-semibold text-indigo-600">Current: {threshold}%</span>
              <span>95% (Strict)</span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-[11px] text-slate-400">
              {threshold !== originalThreshold ? 'Unsaved changes pending' : 'Policy is active and enforced'}
            </span>
            <button
              type="submit"
              disabled={saving || threshold === originalThreshold}
              className="px-5 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md shadow-indigo-600/20 disabled:opacity-40 flex items-center gap-1.5 transition-all"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Configuration
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Settings;
