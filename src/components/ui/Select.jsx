import React from 'react';

export const Select = React.forwardRef(({
  label,
  error,
  options = [],
  children,
  className = '',
  id,
  placeholder,
  ...props
}, ref) => {
  const selectId = id || `select-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className={`flex flex-col gap-1.5 w-full ${className}`}>
      {label && (
        <label
          htmlFor={selectId}
          className="text-xs uppercase tracking-wider font-semibold text-gray-500"
        >
          {label}
        </label>
      )}
      <div className="relative">
        <select
          ref={ref}
          id={selectId}
          className={`w-full px-4 py-3 bg-uber-white border rounded-xl text-sm transition-colors duration-150 outline-none appearance-none cursor-pointer text-uber-black
            ${error 
              ? 'border-uber-red focus:border-uber-red' 
              : 'border-uber-gray-300 focus:border-uber-black'
            }
            disabled:bg-uber-gray-100 disabled:text-gray-400`}
          {...props}
        >
          {placeholder && <option value="" disabled>{placeholder}</option>}
          {children ? children : options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {/* Custom Chevron Indicator */}
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
          <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
            <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
          </svg>
        </div>
      </div>
      {error && (
        <span className="text-xs font-semibold text-uber-red mt-0.5">
          {error}
        </span>
      )}
    </div>
  );
});

Select.displayName = 'Select';
