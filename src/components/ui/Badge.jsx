import React from 'react';

export const Badge = ({ children, status, className = '' }) => {
  const normalizedStatus = (status || children || '').toString().toLowerCase().trim();

  // Status mapping
  let bgClass = 'bg-uber-gray-100 text-uber-black border-uber-gray-300';
  
  switch (normalizedStatus) {
    case 'available':
    case 'success':
      bgClass = 'bg-green-50 text-uber-green border-uber-green/20';
      break;
    case 'on trip':
    case 'active':
    case 'dispatched':
    case 'blue':
      bgClass = 'bg-blue-50 text-uber-blue border-uber-blue/20';
      break;
    case 'in shop':
    case 'maintenance':
    case 'amber':
    case 'pending':
      bgClass = 'bg-amber-50 text-uber-amber border-uber-amber/20';
      break;
    case 'retired':
    case 'suspended':
    case 'expired':
    case 'red':
    case 'cancelled':
      bgClass = 'bg-red-50 text-uber-red border-uber-red/20';
      break;
    case 'off duty':
    case 'gray':
    case 'draft':
    default:
      bgClass = 'bg-gray-50 text-gray-500 border-gray-200';
      break;
  }

  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full border text-[10px] uppercase tracking-wide font-bold ${bgClass} ${className}`}
    >
      {children || status}
    </span>
  );
};
