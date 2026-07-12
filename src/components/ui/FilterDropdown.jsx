import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export const FilterDropdown = ({ options, value, onChange, placeholder = "Select..." }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find(opt => opt.value === value);

  return (
    <div className="relative inline-block w-full text-left font-sans select-none" ref={dropdownRef}>
      <button
        type="button"
        className={`w-full flex items-center justify-between px-4 py-3 bg-uber-white border rounded-xl text-sm transition-all duration-200 outline-none
          ${isOpen ? 'border-uber-black ring-2 ring-uber-black/10' : 'border-uber-gray-300 hover:border-gray-400'}
        `}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={`block truncate ${!selectedOption && 'text-gray-400'}`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown 
          size={16} 
          className={`text-gray-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-2 w-full origin-top bg-uber-white border border-uber-gray-300 rounded-xl shadow-lg ring-1 ring-black ring-opacity-5 animate-fade-in py-1">
          <ul className="max-h-60 overflow-auto focus:outline-none">
            {options.map((option) => {
              const isSelected = option.value === value;
              return (
                <li
                  key={option.value}
                  className={`cursor-pointer select-none relative py-2.5 pl-4 pr-9 transition-colors
                    ${isSelected ? 'bg-uber-gray-100/50 text-uber-black font-bold' : 'text-gray-700 hover:bg-uber-gray-100 hover:text-uber-black'}
                  `}
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                >
                  <span className="block truncate">{option.label}</span>
                  {isSelected && (
                    <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-uber-black">
                      <Check size={14} strokeWidth={3} />
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
};
