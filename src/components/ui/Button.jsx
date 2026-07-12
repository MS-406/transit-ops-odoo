import React from 'react';

export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  type = 'button',
  onClick,
  ...props
}) => {
  const baseStyle = 'inline-flex items-center justify-center font-semibold uppercase tracking-wide text-xs transition-all duration-150 ease-out active:scale-95 focus:outline-none disabled:opacity-50 disabled:pointer-events-none';
  
  const variants = {
    primary: 'bg-uber-black text-uber-white hover:bg-uber-gray-900 border border-transparent',
    secondary: 'bg-uber-white text-uber-black border border-uber-gray-300 hover:bg-uber-gray-100',
    danger: 'bg-uber-red text-uber-white hover:bg-red-700 border border-transparent',
    success: 'bg-uber-green text-uber-white hover:bg-green-700 border border-transparent',
    outline: 'bg-transparent text-uber-black border border-uber-black hover:bg-uber-gray-100',
  };

  const sizes = {
    sm: 'px-4 py-2 text-[10px] rounded-full',
    md: 'px-6 py-3 text-xs rounded-full',
    lg: 'px-8 py-4 text-sm rounded-full',
  };

  const styles = `${baseStyle} ${variants[variant]} ${sizes[size]} ${className}`;

  return (
    <button
      type={type}
      className={styles}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};
