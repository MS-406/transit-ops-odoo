import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { vehiclesApi } from '../../api/vehicles';
import { driversApi } from '../../api/drivers';
import { Search, Navigation, Wrench, Fuel, DollarSign, Calendar, User, Truck } from 'lucide-react';

export const CommandPalette = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Queries for dynamic search suggestions
  const { data: vehicles } = useQuery({
    queryKey: ['vehicles'],
    queryFn: () => vehiclesApi.getVehicles(),
    select: (res) => res.data,
    enabled: isOpen
  });

  const { data: drivers } = useQuery({
    queryKey: ['drivers'],
    queryFn: () => driversApi.getDrivers(),
    select: (res) => res.data,
    enabled: isOpen
  });

  // Focus input on mount
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Base navigation pages
  const defaultCommands = [
    { type: 'navigation', label: 'Go to Dashboard', icon: <Navigation size={14} />, path: '/dashboard' },
    { type: 'navigation', label: 'Go to Vehicles Registry', icon: <Truck size={14} />, path: '/vehicles' },
    { type: 'navigation', label: 'Go to Drivers Roster', icon: <User size={14} />, path: '/drivers' },
    { type: 'navigation', label: 'Go to Trip Kanban Board', icon: <Calendar size={14} />, path: '/trips' },
    { type: 'navigation', label: 'Go to Maintenance Logs', icon: <Wrench size={14} />, path: '/maintenance' },
    { type: 'navigation', label: 'Go to Fuel & Expenses ledger', icon: <Fuel size={14} />, path: '/fuel-expenses' }
  ];

  // Dynamic matching
  const matchingVehicles = (vehicles || [])
    .filter(v => 
      v.registration_number.toLowerCase().includes(query.toLowerCase()) ||
      v.model.toLowerCase().includes(query.toLowerCase())
    )
    .map(v => ({
      type: 'vehicle',
      label: `Vehicle: ${v.registration_number} — ${v.model}`,
      icon: <Truck size={14} className="text-gray-400" />,
      path: `/vehicles/${v.id}`
    }))
    .slice(0, 3);

  const matchingDrivers = (drivers || [])
    .filter(d => d.name.toLowerCase().includes(query.toLowerCase()))
    .map(d => ({
      type: 'driver',
      label: `Driver: ${d.name} (${d.license_class})`,
      icon: <User size={14} className="text-gray-400" />,
      path: `/drivers/${d.id}`
    }))
    .slice(0, 3);

  const filteredCommands = [
    ...defaultCommands.filter(c => c.label.toLowerCase().includes(query.toLowerCase())),
    ...matchingVehicles,
    ...matchingDrivers
  ];

  const handleSelect = (item) => {
    navigate(item.path);
    onClose();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % filteredCommands.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + filteredCommands.length) % filteredCommands.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredCommands[selectedIndex]) {
        handleSelect(filteredCommands[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4 bg-uber-black/55 backdrop-blur-sm animate-fade-in text-left">
      <div 
        className="w-full max-w-xl bg-uber-white rounded-2xl shadow-2xl border border-uber-gray-300 overflow-hidden flex flex-col"
        onKeyDown={handleKeyDown}
      >
        {/* Search header input */}
        <div className="flex items-center gap-3 px-4 py-4 border-b border-uber-gray-300">
          <Search size={18} className="text-gray-400" />
          <input
            ref={inputRef}
            type="text"
            className="flex-1 bg-transparent border-none outline-none text-sm text-uber-black placeholder-gray-400"
            placeholder="Type a command or registry record..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
          />
          <span className="text-[10px] font-black bg-gray-100 text-gray-400 px-2 py-0.5 rounded uppercase">ESC</span>
        </div>

        {/* Results layout */}
        <div className="max-h-80 overflow-y-auto p-2">
          {filteredCommands.length === 0 ? (
            <div className="py-6 text-center text-xs text-gray-400 italic">No matching commands found.</div>
          ) : (
            <div className="flex flex-col gap-0.5">
              {filteredCommands.map((cmd, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelect(cmd)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors duration-100 ${
                    idx === selectedIndex 
                      ? 'bg-uber-black text-uber-white' 
                      : 'text-gray-700 hover:bg-uber-gray-100/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={idx === selectedIndex ? 'text-uber-green' : 'text-gray-400'}>{cmd.icon}</span>
                    <span>{cmd.label}</span>
                  </div>
                  {idx === selectedIndex && (
                    <span className="text-[9px] uppercase tracking-wider font-extrabold text-uber-green">Select</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Start key controls label footer */}
        <div className="bg-gray-50 border-t border-uber-gray-300 py-3 px-4 flex justify-between items-center text-[10px] text-gray-400 select-none">
          <span>Use &uarr;&darr; keys to navigate, &crarr; to select</span>
          <span>Command Palette</span>
        </div>
      </div>
    </div>
  );
};
