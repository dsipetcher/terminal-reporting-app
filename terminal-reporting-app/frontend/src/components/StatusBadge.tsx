import React from 'react';
import { STATUS_COLORS } from '../utils';

interface StatusBadgeProps {
  status: string;
  label: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, label }) => {
  const colorClass = STATUS_COLORS[status] || 'bg-gray-100 text-gray-800';
  
  return (
    <span className={`px-3 py-1 rounded-full text-sm font-medium ${colorClass}`}>
      {label}
    </span>
  );
};

export default StatusBadge;
