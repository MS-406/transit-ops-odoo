import React from 'react';

export const Card = ({ children, className = '', hoverable = false, onClick }) => {
  return (
    <div
      onClick={onClick}
      className={`bg-uber-white border border-uber-gray-300 rounded-2xl p-6 transition-all duration-200 
        ${hoverable ? 'hover:shadow-md cursor-pointer hover:border-uber-black/20' : 'shadow-sm'} 
        ${onClick ? 'cursor-pointer active:scale-[0.99]' : ''} 
        ${className}`}
    >
      {children}
    </div>
  );
};

export const CardHeader = ({ children, className = '' }) => (
  <div className={`mb-4 border-b border-uber-gray-300 pb-3 ${className}`}>
    {children}
  </div>
);

export const CardContent = ({ children, className = '' }) => (
  <div className={className}>{children}</div>
);

export const CardFooter = ({ children, className = '' }) => (
  <div className={`mt-4 border-t border-uber-gray-300 pt-3 flex items-center justify-end ${className}`}>
    {children}
  </div>
);
