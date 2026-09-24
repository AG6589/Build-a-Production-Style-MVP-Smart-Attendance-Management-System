import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  CheckSquare,
  History,
  FileCheck2,
  BarChart3,
  Building2,
  Users,
  GraduationCap,
  ScrollText,
  Settings,
  UserCircle
} from 'lucide-react';

const Sidebar = ({ isOpen, onClose }) => {
  const { user, role } = useAuth();

  const getLinks = () => {
    switch (role) {
      case 'admin':
        return [
          { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
          { name: 'Attendance History', path: '/attendance/history', icon: History },
          { name: 'Correction Review', path: '/corrections', icon: FileCheck2 },
          { name: 'Students', path: '/students', icon: GraduationCap },
          { name: 'Faculty', path: '/faculty', icon: Users },
          { name: 'Academic Hierarchy', path: '/academic', icon: Building2 },
          { name: 'Reports & Analytics', path: '/reports', icon: BarChart3 },
          { name: 'Audit Logs', path: '/audit-logs', icon: ScrollText },
          { name: 'System Settings', path: '/settings', icon: Settings },
          { name: 'My Profile', path: '/profile', icon: UserCircle }
        ];
      case 'faculty':
        return [
          { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
          { name: 'Mark Attendance', path: '/attendance/mark', icon: CheckSquare },
          { name: 'Attendance History', path: '/attendance/history', icon: History },
          { name: 'Correction Requests', path: '/corrections', icon: FileCheck2 },
          { name: 'Reports & Analytics', path: '/reports', icon: BarChart3 },
          { name: 'My Profile', path: '/profile', icon: UserCircle }
        ];
      case 'student':
        return [
          { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
          { name: 'Attendance History', path: '/attendance/history', icon: History },
          { name: 'Correction Requests', path: '/corrections', icon: FileCheck2 },
          { name: 'My Profile', path: '/profile', icon: UserCircle }
        ];
      case 'reviewer':
        return [
          { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
          { name: 'Correction Review Queue', path: '/corrections', icon: FileCheck2 },
          { name: 'Attendance History', path: '/attendance/history', icon: History },
          { name: 'Department Reports', path: '/reports', icon: BarChart3 },
          { name: 'My Profile', path: '/profile', icon: UserCircle }
        ];
      default:
        return [];
    }
  };

  const links = getLinks();

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden" onClick={onClose} />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-slate-900 text-white flex flex-col transition-transform duration-200 ease-in-out border-r border-slate-800 ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="flex items-center gap-3 px-6 h-16 border-b border-slate-800/80">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <CheckSquare className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-sm tracking-tight text-white">Smart Attendance</h1>
            <p className="text-[10px] text-slate-400 font-medium">Enterprise Campus Portal</p>
          </div>
        </div>

        {/* User Card */}
        <div className="p-4 mx-3 my-3 bg-slate-800/60 rounded-xl border border-slate-700/50">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-indigo-500/20 text-indigo-400 font-semibold text-xs flex items-center justify-center border border-indigo-500/30">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-white truncate">{user?.name}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px] uppercase font-bold text-indigo-300 tracking-wider">
                  {user?.role}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          {links.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* System Info */}
        <div className="p-4 border-t border-slate-800/80 text-[11px] text-slate-500 flex justify-between items-center">
          <span>v1.0.0 • Production MVP</span>
          <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 text-[9px] uppercase font-semibold">
            Active
          </span>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
