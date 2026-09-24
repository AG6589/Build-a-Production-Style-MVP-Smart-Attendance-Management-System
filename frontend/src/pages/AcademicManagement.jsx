import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import Modal from '../components/Modal';
import Badge from '../components/Badge';
import { Building2, Plus, BookOpen, Layers, Grid, AlertCircle, Loader2 } from 'lucide-react';

const AcademicManagement = () => {
  const [activeTab, setActiveTab] = useState('departments'); // 'departments' | 'classes' | 'sections' | 'subjects'

  const [departments, setDepartments] = useState([]);
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // Department Modal
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [deptForm, setDeptForm] = useState({ code: '', name: '', description: '' });

  // Class Modal
  const [showClassModal, setShowClassModal] = useState(false);
  const [classForm, setClassForm] = useState({ name: '', code: '', department: '' });

  // Section Modal
  const [showSecModal, setShowSecModal] = useState(false);
  const [secForm, setSecForm] = useState({ name: '', class: '', department: '', semester: 5 });

  // Subject Modal
  const [showSubjModal, setShowSubjModal] = useState(false);
  const [subjForm, setSubjForm] = useState({ code: '', name: '', department: '', class: '', semester: 5 });

  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [deptRes, clsRes, secRes, subjRes] = await Promise.all([
        api.get('/academic/departments'),
        api.get('/academic/classes'),
        api.get('/academic/sections'),
        api.get('/academic/subjects')
      ]);
      if (deptRes.data.success) setDepartments(deptRes.data.data);
      if (clsRes.data.success) setClasses(clsRes.data.data);
      if (secRes.data.success) setSections(secRes.data.data);
      if (subjRes.data.success) setSubjects(subjRes.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const handleCreateDept = async (e) => {
    e.preventDefault();
    setModalLoading(true);
    setModalError('');
    try {
      await api.post('/academic/departments', deptForm);
      setShowDeptModal(false);
      setDeptForm({ code: '', name: '', description: '' });
      fetchAll();
    } catch (err) {
      setModalError(err.response?.data?.message || 'Failed to create department');
    } finally {
      setModalLoading(false);
    }
  };

  const handleCreateClass = async (e) => {
    e.preventDefault();
    setModalLoading(true);
    setModalError('');
    try {
      await api.post('/academic/classes', classForm);
      setShowClassModal(false);
      fetchAll();
    } catch (err) {
      setModalError(err.response?.data?.message || 'Failed to create class');
    } finally {
      setModalLoading(false);
    }
  };

  const handleCreateSection = async (e) => {
    e.preventDefault();
    setModalLoading(true);
    setModalError('');
    try {
      await api.post('/academic/sections', secForm);
      setShowSecModal(false);
      fetchAll();
    } catch (err) {
      setModalError(err.response?.data?.message || 'Failed to create section');
    } finally {
      setModalLoading(false);
    }
  };

  const handleCreateSubject = async (e) => {
    e.preventDefault();
    setModalLoading(true);
    setModalError('');
    try {
      await api.post('/academic/subjects', subjForm);
      setShowSubjModal(false);
      fetchAll();
    } catch (err) {
      setModalError(err.response?.data?.message || 'Failed to create subject');
    } finally {
      setModalLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Academic Hierarchy</h1>
          <p className="text-xs text-slate-500 mt-1">
            Configure institutional departments, classes, sections, and curriculum subjects
          </p>
        </div>
        <div className="flex items-center gap-2">
          {activeTab === 'departments' && (
            <button
              onClick={() => {
                setShowDeptModal(true);
                setModalError('');
              }}
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md shadow-indigo-600/20 flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Add Department
            </button>
          )}
          {activeTab === 'classes' && (
            <button
              onClick={() => {
                setClassForm({ name: '', code: '', department: departments[0]?._id || '' });
                setShowClassModal(true);
                setModalError('');
              }}
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md shadow-indigo-600/20 flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Add Class
            </button>
          )}
          {activeTab === 'sections' && (
            <button
              onClick={() => {
                setSecForm({
                  name: '',
                  class: classes[0]?._id || '',
                  department: departments[0]?._id || '',
                  semester: 5
                });
                setShowSecModal(true);
                setModalError('');
              }}
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md shadow-indigo-600/20 flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Add Section
            </button>
          )}
          {activeTab === 'subjects' && (
            <button
              onClick={() => {
                setSubjForm({
                  code: '',
                  name: '',
                  department: departments[0]?._id || '',
                  class: classes[0]?._id || '',
                  semester: 5
                });
                setShowSubjModal(true);
                setModalError('');
              }}
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md shadow-indigo-600/20 flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Add Subject
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('departments')}
          className={`pb-3 px-2 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
            activeTab === 'departments'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Building2 className="w-4 h-4" /> Departments ({departments.length})
        </button>
        <button
          onClick={() => setActiveTab('classes')}
          className={`pb-3 px-2 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
            activeTab === 'classes'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Layers className="w-4 h-4" /> Classes ({classes.length})
        </button>
        <button
          onClick={() => setActiveTab('sections')}
          className={`pb-3 px-2 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
            activeTab === 'sections'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Grid className="w-4 h-4" /> Sections ({sections.length})
        </button>
        <button
          onClick={() => setActiveTab('subjects')}
          className={`pb-3 px-2 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
            activeTab === 'subjects'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <BookOpen className="w-4 h-4" /> Subjects ({subjects.length})
        </button>
      </div>

      {/* Tab Panels */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        {loading ? (
          <div className="py-12 flex justify-center">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
          </div>
        ) : activeTab === 'departments' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-semibold uppercase text-[11px]">
                  <th className="py-3 px-4">Code</th>
                  <th className="py-3 px-4">Department Name</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {departments.map((d) => (
                  <tr key={d._id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-mono font-bold text-indigo-600">{d.code}</td>
                    <td className="py-3 px-4 font-semibold text-slate-900">{d.name}</td>
                    <td className="py-3 px-4 text-slate-500">{d.description || '—'}</td>
                    <td className="py-3 px-4 text-right">
                      <Badge status={d.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : activeTab === 'classes' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-semibold uppercase text-[11px]">
                  <th className="py-3 px-4">Class Code</th>
                  <th className="py-3 px-4">Class Name</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4 text-center">Semesters</th>
                  <th className="py-3 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {classes.map((c) => (
                  <tr key={c._id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-mono font-bold text-indigo-600">{c.code}</td>
                    <td className="py-3 px-4 font-semibold text-slate-900">{c.name}</td>
                    <td className="py-3 px-4 text-slate-600">{c.department?.name || '—'}</td>
                    <td className="py-3 px-4 text-center">{c.totalSemesters}</td>
                    <td className="py-3 px-4 text-right">
                      <Badge status={c.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : activeTab === 'sections' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-semibold uppercase text-[11px]">
                  <th className="py-3 px-4">Section Name</th>
                  <th className="py-3 px-4">Class</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4 text-center">Semester</th>
                  <th className="py-3 px-4 text-right">Academic Year</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sections.map((s) => (
                  <tr key={s._id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-bold text-indigo-600">{s.name}</td>
                    <td className="py-3 px-4 font-medium text-slate-900">{s.class?.name || '—'}</td>
                    <td className="py-3 px-4 text-slate-600">{s.department?.name || '—'}</td>
                    <td className="py-3 px-4 text-center font-mono">{s.semester}</td>
                    <td className="py-3 px-4 text-right text-slate-500">{s.academicYear}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-semibold uppercase text-[11px]">
                  <th className="py-3 px-4">Subject Code</th>
                  <th className="py-3 px-4">Subject Name</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Faculty</th>
                  <th className="py-3 px-4">Section</th>
                  <th className="py-3 px-4 text-center">Semester</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {subjects.map((subj) => (
                  <tr key={subj._id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-mono font-bold text-indigo-600">{subj.code}</td>
                    <td className="py-3 px-4 font-semibold text-slate-900">{subj.name}</td>
                    <td className="py-3 px-4 text-slate-600">{subj.department?.name || '—'}</td>
                    <td className="py-3 px-4 text-slate-700">{subj.assignedFaculty?.name || 'Unassigned'}</td>
                    <td className="py-3 px-4 text-slate-600">{subj.section?.name || 'All'}</td>
                    <td className="py-3 px-4 text-center font-mono">{subj.semester}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Department Modal */}
      <Modal isOpen={showDeptModal} onClose={() => setShowDeptModal(false)} title="Add Department">
        <form onSubmit={handleCreateDept} className="space-y-3 text-xs">
          {modalError && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{modalError}</span>
            </div>
          )}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Department Code *</label>
            <input
              type="text"
              required
              placeholder="e.g. MECH"
              value={deptForm.code}
              onChange={(e) => setDeptForm({ ...deptForm, code: e.target.value })}
              className="w-full border border-slate-300 rounded-xl p-2 text-xs"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Department Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Mechanical Engineering"
              value={deptForm.name}
              onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })}
              className="w-full border border-slate-300 rounded-xl p-2 text-xs"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Description</label>
            <input
              type="text"
              value={deptForm.description}
              onChange={(e) => setDeptForm({ ...deptForm, description: e.target.value })}
              className="w-full border border-slate-300 rounded-xl p-2 text-xs"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t">
            <button
              type="button"
              onClick={() => setShowDeptModal(false)}
              className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={modalLoading}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold"
            >
              Save Department
            </button>
          </div>
        </form>
      </Modal>

      {/* Add Class Modal */}
      <Modal isOpen={showClassModal} onClose={() => setShowClassModal(false)} title="Add Academic Class">
        <form onSubmit={handleCreateClass} className="space-y-3 text-xs">
          {modalError && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{modalError}</span>
            </div>
          )}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Class Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. B.Tech Mechanical"
              value={classForm.name}
              onChange={(e) => setClassForm({ ...classForm, name: e.target.value })}
              className="w-full border border-slate-300 rounded-xl p-2 text-xs"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Class Code *</label>
            <input
              type="text"
              required
              placeholder="e.g. BT-MECH"
              value={classForm.code}
              onChange={(e) => setClassForm({ ...classForm, code: e.target.value })}
              className="w-full border border-slate-300 rounded-xl p-2 text-xs"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Department *</label>
            <select
              required
              value={classForm.department}
              onChange={(e) => setClassForm({ ...classForm, department: e.target.value })}
              className="w-full border border-slate-300 rounded-xl p-2 text-xs"
            >
              {departments.map((d) => (
                <option key={d._id} value={d._id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t">
            <button
              type="button"
              onClick={() => setShowClassModal(false)}
              className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={modalLoading}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold"
            >
              Save Class
            </button>
          </div>
        </form>
      </Modal>

      {/* Add Section Modal */}
      <Modal isOpen={showSecModal} onClose={() => setShowSecModal(false)} title="Add Cohort Section">
        <form onSubmit={handleCreateSection} className="space-y-3 text-xs">
          {modalError && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{modalError}</span>
            </div>
          )}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Section Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. MECH-A"
              value={secForm.name}
              onChange={(e) => setSecForm({ ...secForm, name: e.target.value })}
              className="w-full border border-slate-300 rounded-xl p-2 text-xs"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Department *</label>
              <select
                required
                value={secForm.department}
                onChange={(e) => setSecForm({ ...secForm, department: e.target.value })}
                className="w-full border border-slate-300 rounded-xl p-2 text-xs"
              >
                {departments.map((d) => (
                  <option key={d._id} value={d._id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Class *</label>
              <select
                required
                value={secForm.class}
                onChange={(e) => setSecForm({ ...secForm, class: e.target.value })}
                className="w-full border border-slate-300 rounded-xl p-2 text-xs"
              >
                {classes.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.code}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Semester *</label>
            <input
              type="number"
              min={1}
              max={12}
              required
              value={secForm.semester}
              onChange={(e) => setSecForm({ ...secForm, semester: Number(e.target.value) })}
              className="w-full border border-slate-300 rounded-xl p-2 text-xs"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t">
            <button
              type="button"
              onClick={() => setShowSecModal(false)}
              className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={modalLoading}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold"
            >
              Save Section
            </button>
          </div>
        </form>
      </Modal>

      {/* Add Subject Modal */}
      <Modal isOpen={showSubjModal} onClose={() => setShowSubjModal(false)} title="Add Subject / Course">
        <form onSubmit={handleCreateSubject} className="space-y-3 text-xs">
          {modalError && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{modalError}</span>
            </div>
          )}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Subject Code *</label>
              <input
                type="text"
                required
                placeholder="e.g. ME301"
                value={subjForm.code}
                onChange={(e) => setSubjForm({ ...subjForm, code: e.target.value })}
                className="w-full border border-slate-300 rounded-xl p-2 text-xs"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Semester *</label>
              <input
                type="number"
                min={1}
                max={12}
                required
                value={subjForm.semester}
                onChange={(e) => setSubjForm({ ...subjForm, semester: Number(e.target.value) })}
                className="w-full border border-slate-300 rounded-xl p-2 text-xs"
              />
            </div>
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Subject Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Thermodynamics & Fluid Mechanics"
              value={subjForm.name}
              onChange={(e) => setSubjForm({ ...subjForm, name: e.target.value })}
              className="w-full border border-slate-300 rounded-xl p-2 text-xs"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Department *</label>
              <select
                required
                value={subjForm.department}
                onChange={(e) => setSubjForm({ ...subjForm, department: e.target.value })}
                className="w-full border border-slate-300 rounded-xl p-2 text-xs"
              >
                {departments.map((d) => (
                  <option key={d._id} value={d._id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Class *</label>
              <select
                required
                value={subjForm.class}
                onChange={(e) => setSubjForm({ ...subjForm, class: e.target.value })}
                className="w-full border border-slate-300 rounded-xl p-2 text-xs"
              >
                {classes.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.code}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t">
            <button
              type="button"
              onClick={() => setShowSubjModal(false)}
              className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={modalLoading}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold"
            >
              Save Subject
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AcademicManagement;
