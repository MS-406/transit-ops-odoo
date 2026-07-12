import React from 'react';

export const Input = React.forwardRef(({
  label,
  error,
  type = 'text',
  className = '',
  id,
  ...props
}, ref) => {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className={`flex flex-col gap-1.5 w-full ${className}`}>
      {label && (
        <label
          htmlFor={inputId}
          className="text-xs uppercase tracking-wider font-semibold text-gray-500"
        >
          {label}
        </label>
      )}
      <input
        ref={ref}
        type={type}
        id={inputId}
        className={`w-full px-4 py-3 bg-uber-white border rounded-xl text-sm transition-colors duration-150 outline-none
          placeholder-gray-400 text-uber-black
          ${error 
            ? 'border-uber-red focus:border-uber-red' 
            : 'border-uber-gray-300 focus:border-uber-black'
          }
          disabled:bg-uber-gray-100 disabled:text-gray-400`}
        {...props}
      />
      {error && (
        <span className="text-xs font-semibold text-uber-red mt-0.5">
          {error}
        </span>
      )}
    </div>
  );
});

Input.displayName = 'Input';
