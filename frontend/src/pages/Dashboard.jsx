import React from 'react';
import { useAuth } from '../context/AuthContext';
import AdminDashboard from './AdminDashboard';
import FacultyDashboard from './FacultyDashboard';
import StudentDashboard from './StudentDashboard';
import ReviewerDashboard from './ReviewerDashboard';

const Dashboard = () => {
  const { role } = useAuth();

  switch (role) {
    case 'admin':
      return <AdminDashboard />;
    case 'faculty':
      return <FacultyDashboard />;
    case 'student':
      return <StudentDashboard />;
    case 'reviewer':
      return <ReviewerDashboard />;
    default:
      return (
        <div className="p-8 text-center text-slate-500">
          <p>Role unrecognized. Please contact your campus administrator.</p>
        </div>
      );
  }
};

export default Dashboard;
