import React from 'react';

const Badge = ({ status, text }) => {
  const normalized = (status || '').toUpperCase();

  const styles = {
    PRESENT: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    ABSENT: 'bg-rose-50 text-rose-700 border-rose-200',
    LATE: 'bg-amber-50 text-amber-700 border-amber-200',
    SUBMITTED: 'bg-blue-50 text-blue-700 border-blue-200',
    DRAFT: 'bg-amber-50 text-amber-700 border-amber-200',
    PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
    APPROVED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    REJECTED: 'bg-rose-50 text-rose-700 border-rose-200',
    ACTIVE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    INACTIVE: 'bg-slate-100 text-slate-600 border-slate-200',
    LOW_ATTENDANCE: 'bg-rose-100 text-rose-800 border-rose-300 font-semibold',
    HEALTHY: 'bg-emerald-100 text-emerald-800 border-emerald-300'
  };

  const style = styles[normalized] || 'bg-slate-100 text-slate-700 border-slate-200';

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${style}`}>
      {text || normalized}
    </span>
  );
};

export default Badge;
