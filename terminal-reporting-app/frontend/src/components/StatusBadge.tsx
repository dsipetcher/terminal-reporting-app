import React from 'react';
import { STATUS_COLORS, getStatusLabel } from '../utils';

interface StatusBadgeProps {
  status: string;
  label?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, label }) => {
  const colorClass = STATUS_COLORS[status] || 'bg-gray-200 text-gray-800 dark:bg-slate-700 dark:text-slate-300';
  const displayLabel = label || getStatusLabel(status);

  return (
    <span className={`px-3 py-1 rounded-full text-sm font-medium ${colorClass}`}>
      {displayLabel}
    </span>
  );
};

export default StatusBadge;
