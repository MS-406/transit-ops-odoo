import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  className = '',
  size = 'md'
}) => {
  // Prevent body scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-xl',
    lg: 'max-w-3xl',
    xl: 'max-w-5xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div
        className={`relative w-full ${sizes[size]} bg-uber-white rounded-2xl shadow-2xl border border-uber-gray-300 z-10 overflow-hidden transform transition-all duration-300 scale-100 flex flex-col max-h-[90vh] ${className}`}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-uber-gray-300 flex items-center justify-between bg-uber-white">
          <h3 className="text-lg font-bold uppercase tracking-tight text-uber-black">
            {title}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-uber-black transition-colors rounded-full p-1 hover:bg-uber-gray-100"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 bg-uber-white">
          {children}
        </div>
      </div>
    </div>
  );
};
