import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import client from '../../api/client';
import { useAuthStore } from '../../store/authStore';
import { CommandPalette } from './CommandPalette';
import { toast } from 'react-hot-toast';
import {
  LayoutDashboard,
  Truck,
  Users,
  Route as RouteIcon,
  Wrench,
  Fuel,
  BarChart3,
  User,
  Settings,
  LogOut,
  Bell,
  Menu,
  X,
  ShieldCheck,
  Loader2
} from 'lucide-react';

export const Shell = ({ children }) => {
  const { user, token, logout, setRole, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  // Initialize based on window width to keep open on desktop and closed on mobile
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 768);
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  const { data: alerts, isLoading } = useQuery({
    queryKey: ['notifications-alerts', token],
    queryFn: async () => {
      if (token === 'mock-jwt-token-12345') {
        return [
          {
            id: 'driver-exp-d-3',
            type: 'critical',
            message: "Driver 'Bob Johnson' license has expired (2026-06-15)."
          },
          {
            id: 'driver-exp-d-2',
            type: 'warning',
            message: "Driver 'Jane Watson' license expires in 13 days."
          }
        ];
      }
      const res = await client.get('/notifications/alerts');
      return res.data;
    },
    enabled: isAuthenticated
  });

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsPaletteOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    // Update sidebar state on resize if needed
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsSidebarOpen(true);
      } else {
        setIsSidebarOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };



  // Nav items with RBAC roles configuration
  const navigationItems = [
    {
      name: 'Dashboard',
      path: '/dashboard',
      icon: LayoutDashboard,
      roles: ['Fleet Manager', 'Financial Analyst', 'Admin'],
    },
    {
      name: 'Fleet',
      path: '/vehicles',
      icon: Truck,
      roles: ['Fleet Manager', 'Dispatcher', 'Financial Analyst', 'Admin'],
    },
    {
      name: 'Drivers',
      path: '/drivers',
      icon: Users,
      roles: ['Fleet Manager', 'Safety Officer', 'Admin'],
    },
    {
      name: 'Trips',
      path: '/trips',
      icon: RouteIcon,
      roles: ['Dispatcher', 'Safety Officer', 'Admin'],
    },
    {
      name: 'Maintenance',
      path: '/maintenance',
      icon: Wrench,
      roles: ['Fleet Manager', 'Admin'],
    },
    {
      name: 'Fuel & Expenses',
      path: '/fuel-expenses',
      icon: Fuel,
      roles: ['Financial Analyst', 'Admin'],
    },
    {
      name: 'Analytics',
      path: '/reports',
      icon: BarChart3,
      roles: ['Fleet Manager', 'Financial Analyst', 'Admin'],
    },
    {
      name: 'Audit Logs',
      path: '/audit-logs',
      icon: ShieldCheck,
      roles: ['Fleet Manager', 'Financial Analyst', 'Safety Officer', 'Dispatcher', 'Admin'],
    },
    {
      name: 'Users',
      path: '/users',
      icon: Users,
      roles: ['Fleet Manager', 'Admin'],
    },
    {
      name: 'Settings',
      path: '/settings',
      icon: Settings,
      roles: ['Fleet Manager', 'Admin'],
    },
  ];

  // Filter based on active simulated role
  const allowedNavItems = navigationItems.filter(item => 
    user && item.roles.includes(user.role)
  );

  const SidebarContent = ({ onNavigate }) => (
    <div className="flex flex-col h-full bg-uber-white">
      <div className="md:hidden flex items-center justify-between mb-8 px-4 pt-6">
        <span className="text-lg font-black uppercase tracking-tight">Transit<span className="text-uber-green">Ops</span></span>
        <button 
          onClick={() => setIsSidebarOpen(false)}
          className="p-1 hover:bg-uber-gray-100 rounded-full"
        >
          <X size={20} />
        </button>
      </div>

      {/* Mobile Role Switching */}
      {user && token === 'mock-jwt-token-12345' && (
        <div className="md:hidden mb-6 mx-4 flex flex-col gap-1 px-2 py-3 bg-uber-gray-100 rounded-xl">
          <span className="text-[10px] uppercase font-bold text-gray-500">Preview Role</span>
          <select
            value={user.role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full bg-transparent text-uber-black font-bold outline-none text-xs border-none"
          >
            <option value="Admin">Admin</option>
            <option value="Fleet Manager">Fleet Manager</option>
            <option value="Dispatcher">Dispatcher</option>
            <option value="Driver">Driver</option>
            <option value="Safety Officer">Safety Officer</option>
            <option value="Financial Analyst">Financial Analyst</option>
          </select>
        </div>
      )}

      <nav className="flex-1 space-y-1.5 px-4 md:pt-6">
        {allowedNavItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onNavigate}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold uppercase tracking-wide transition-all duration-150 ease-out active:scale-[0.98]
                ${isActive
                  ? 'bg-uber-black text-uber-white shadow-sm'
                  : 'text-gray-500 hover:text-uber-black hover:bg-uber-gray-100'
                }`
              }
            >
              <Icon size={18} />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Footer of Sidebar */}
      {isAuthenticated && (
        <div className="px-4 pb-6 mt-auto">
          <button
            onClick={() => {
              if (onNavigate) onNavigate();
              handleLogout();
            }}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold uppercase tracking-wide text-uber-red hover:bg-red-50 transition-colors w-full text-left"
          >
            <LogOut size={18} />
            <span>Log Out</span>
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="h-screen flex flex-col bg-uber-gray-100 text-uber-black font-sans">
      
      {/* Top Header Navbar */}
      <header className="sticky top-0 z-40 w-full bg-uber-black text-uber-white flex items-center justify-between px-6 py-4 shadow-md select-none">
        <div className="flex items-center gap-3">
          {/* Hamburger Menu - Visible on all screens */}
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
            className="text-uber-white hover:text-uber-green transition-colors"
          >
            {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          
          <span className="text-xl font-extrabold tracking-tighter uppercase ml-2">
            Transit<span className="text-uber-green">Ops</span>
          </span>
        </div>

        {/* Action Panel */}
        <div className="flex items-center gap-6">
          
          {/* Role Simulation Mode (Quick Switcher) */}
          {user && token === 'mock-jwt-token-12345' && (
            <div className="hidden sm:flex items-center gap-2 bg-uber-gray-900 border border-uber-gray-300/20 px-3 py-1.5 rounded-full text-xs">
              <ShieldCheck size={16} className="text-uber-green" />
              <span className="text-gray-400 font-medium">Role Simulator:</span>
              <select
                value={user.role}
                onChange={(e) => setRole(e.target.value)}
                className="bg-transparent text-uber-white border-none outline-none font-bold cursor-pointer focus:ring-0 text-xs"
              >
                <option value="Admin" className="bg-uber-black text-uber-white">Admin</option>
                <option value="Fleet Manager" className="bg-uber-black text-uber-white">Fleet Manager</option>
                <option value="Dispatcher" className="bg-uber-black text-uber-white">Dispatcher</option>
                <option value="Driver" className="bg-uber-black text-uber-white">Driver</option>
                <option value="Safety Officer" className="bg-uber-black text-uber-white">Safety Officer</option>
                <option value="Financial Analyst" className="bg-uber-black text-uber-white">Financial Analyst</option>
              </select>
            </div>
          )}

          {/* Notification Indicator */}
          <div className="relative">
            <button 
              onClick={() => setIsNotifOpen(!isNotifOpen)}
              className="relative p-2 text-gray-300 hover:text-uber-white transition-colors hover:scale-105 active:scale-95 flex items-center justify-center"
            >
              <Bell size={20} />
              {alerts && alerts.length > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-uber-green rounded-full"></span>
              )}
            </button>

            {isNotifOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-uber-white text-uber-black border border-uber-gray-300 rounded-2xl shadow-xl z-50 p-4 select-none">
                <div className="flex justify-between items-center mb-3 pb-2 border-b border-uber-gray-300">
                  <span className="font-extrabold text-xs uppercase text-gray-500 tracking-wider">Alert Center</span>
                  {alerts && alerts.length > 0 && (
                    <span className="text-[10px] bg-red-50 text-uber-red font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                      {alerts.length} Warnings
                    </span>
                  )}
                </div>
                {isLoading ? (
                  <div className="flex justify-center py-6">
                    <Loader2 className="animate-spin text-uber-black" size={18} />
                  </div>
                ) : !alerts || alerts.length === 0 ? (
                  <p className="text-xs text-gray-400 py-6 italic text-center">No active compliance or trip alerts.</p>
                ) : (
                  <div className="flex flex-col gap-2.5 max-h-64 overflow-y-auto">
                    {alerts.map((alert) => (
                      <div 
                        key={alert.id} 
                        className={`p-2.5 rounded-xl border text-[11px] font-semibold leading-normal ${
                          alert.type === 'critical' 
                            ? 'bg-red-50/50 border-red-100 text-uber-red' 
                            : 'bg-amber-50/50 border-amber-100 text-amber-800'
                        }`}
                      >
                        {alert.message}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* User Account Capsule */}
          {user && (
            <div className="flex items-center gap-3 pl-3 border-l border-uber-gray-900">
              <div className="w-8 h-8 rounded-full bg-uber-green text-uber-black font-bold flex items-center justify-center text-sm">
                {user.name.charAt(0)}
              </div>
              <div className="hidden lg:flex flex-col text-left">
                <span className="text-xs font-bold leading-none">{user.name}</span>
                <span className="text-[10px] text-gray-400 mt-0.5">{user.role}</span>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main Body */}
      <div className="flex flex-1 relative overflow-hidden">

        {/* Sidebar Nav: Desktop */}
        <div 
          className={`hidden md:block transition-all duration-300 ease-in-out border-r border-uber-gray-300 shrink-0 select-none ${
            isSidebarOpen ? 'w-64 opacity-100' : 'w-0 opacity-0 overflow-hidden'
          }`}
        >
          <SidebarContent />
        </div>

        {/* Sidebar Nav: Mobile Overlay Drawer */}
        {isSidebarOpen && (
          <div className="fixed inset-0 z-50 md:hidden flex">
            {/* Backdrop */}
            <div 
              className="fixed inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setIsSidebarOpen(false)}
            />
            {/* Sidebar drawer content */}
            <aside className="relative flex flex-col w-64 max-w-xs h-full z-10 animate-slide-right shadow-2xl">
              <SidebarContent onNavigate={() => setIsSidebarOpen(false)} />
            </aside>
          </div>
        )}

        {/* Content Canvas */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-6 md:p-8 bg-uber-gray-100 min-w-0">
          <div className="max-w-7xl mx-auto w-full">
            {children}
          </div>
        </main>

        <CommandPalette isOpen={isPaletteOpen} onClose={() => setIsPaletteOpen(false)} />
      </div>
    </div>
  );
};
