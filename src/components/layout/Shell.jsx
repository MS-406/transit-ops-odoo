import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import {
  LayoutDashboard,
  Truck,
  Users,
  Route,
  Wrench,
  Fuel,
  BarChart3,
  Settings,
  LogOut,
  Bell,
  Menu,
  X,
  ShieldCheck
} from 'lucide-react';

export const Shell = ({ children }) => {
  const { user, logout, setRole, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
      roles: ['Fleet Manager', 'Driver', 'Safety Officer', 'Financial Analyst'],
    },
    {
      name: 'Vehicles',
      path: '/vehicles',
      icon: Truck,
      roles: ['Fleet Manager', 'Driver', 'Safety Officer', 'Financial Analyst'],
    },
    {
      name: 'Drivers',
      path: '/drivers',
      icon: Users,
      roles: ['Fleet Manager', 'Safety Officer', 'Driver'], // Financial Analyst has read-only, we can show it or hide based on role
    },
    {
      name: 'Trips',
      path: '/trips',
      icon: Route,
      roles: ['Fleet Manager', 'Driver', 'Safety Officer'],
    },
    {
      name: 'Maintenance',
      path: '/maintenance',
      icon: Wrench,
      roles: ['Fleet Manager', 'Driver', 'Safety Officer'], // Safety Officer can see read-only, Fleet Manager full
    },
    {
      name: 'Fuel & Expenses',
      path: '/fuel-expenses',
      icon: Fuel,
      roles: ['Fleet Manager', 'Financial Analyst'],
    },
    {
      name: 'Reports & Analytics',
      path: '/reports',
      icon: BarChart3,
      roles: ['Fleet Manager', 'Financial Analyst'],
    },
    {
      name: 'Settings',
      path: '/settings',
      icon: Settings,
      roles: ['Fleet Manager', 'Driver', 'Safety Officer', 'Financial Analyst'],
    },
  ];

  // Filter based on active simulated role
  const allowedNavItems = navigationItems.filter(item => 
    user && item.roles.includes(user.role)
  );

  return (
    <div className="min-h-screen flex flex-col bg-uber-gray-100 text-uber-black font-sans">
      
      {/* Top Header Navbar */}
      <header className="sticky top-0 z-40 w-full bg-uber-black text-uber-white flex items-center justify-between px-6 py-4 shadow-md select-none">
        <div className="flex items-center gap-3">
          {/* Mobile hamburger */}
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
            className="md:hidden text-uber-white hover:text-uber-green transition-colors"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          
          <span className="text-xl font-extrabold tracking-tighter uppercase">
            Transit<span className="text-uber-green">Ops</span>
          </span>
        </div>

        {/* Action Panel */}
        <div className="flex items-center gap-6">
          
          {/* Role Simulation Mode (Quick Switcher) */}
          {user && (
            <div className="hidden sm:flex items-center gap-2 bg-uber-gray-900 border border-uber-gray-300/20 px-3 py-1.5 rounded-full text-xs">
              <ShieldCheck size={16} className="text-uber-green" />
              <span className="text-gray-400 font-medium">Role Simulator:</span>
              <select
                value={user.role}
                onChange={(e) => setRole(e.target.value)}
                className="bg-transparent text-uber-white border-none outline-none font-bold cursor-pointer focus:ring-0 text-xs"
              >
                <option value="Fleet Manager" className="bg-uber-black text-uber-white">Fleet Manager</option>
                <option value="Driver" className="bg-uber-black text-uber-white">Driver</option>
                <option value="Safety Officer" className="bg-uber-black text-uber-white">Safety Officer</option>
                <option value="Financial Analyst" className="bg-uber-black text-uber-white">Financial Analyst</option>
              </select>
            </div>
          )}

          {/* Notification Indicator */}
          <button className="relative p-2 text-gray-300 hover:text-uber-white transition-colors hover:scale-105 active:scale-95">
            <Bell size={20} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-uber-green rounded-full"></span>
          </button>

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
      <div className="flex flex-1 relative">

        {/* Sidebar Nav: Desktop */}
        <aside className="hidden md:flex flex-col w-64 bg-uber-white border-r border-uber-gray-300 py-6 px-4 shrink-0 select-none">
          <nav className="flex-1 space-y-1.5">
            {allowedNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
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
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-4 py-3 mt-auto rounded-xl text-sm font-semibold uppercase tracking-wide text-uber-red hover:bg-red-50 transition-colors w-full text-left"
            >
              <LogOut size={18} />
              <span>Log Out</span>
            </button>
          )}
        </aside>

        {/* Sidebar Nav: Mobile Overlay Drawer */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 md:hidden flex">
            {/* Backdrop */}
            <div 
              className="fixed inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            {/* Sidebar drawer content */}
            <aside className="relative flex flex-col w-64 max-w-xs bg-uber-white h-full py-6 px-4 z-10 animate-slide-right shadow-2xl">
              <div className="flex items-center justify-between mb-8">
                <span className="text-lg font-black uppercase tracking-tight">Transit<span className="text-uber-green">Ops</span></span>
                <button 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1 hover:bg-uber-gray-100 rounded-full"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Mobile Role Switching */}
              {user && (
                <div className="mb-6 flex flex-col gap-1 px-2 py-3 bg-uber-gray-100 rounded-xl">
                  <span className="text-[10px] uppercase font-bold text-gray-500">Preview Role</span>
                  <select
                    value={user.role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full bg-transparent text-uber-black font-bold outline-none text-xs border-none"
                  >
                    <option value="Fleet Manager">Fleet Manager</option>
                    <option value="Driver">Driver</option>
                    <option value="Safety Officer">Safety Officer</option>
                    <option value="Financial Analyst">Financial Analyst</option>
                  </select>
                </div>
              )}

              <nav className="flex-1 space-y-1.5" onClick={() => setIsMobileMenuOpen(false)}>
                {allowedNavItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold uppercase tracking-wide
                        ${isActive
                          ? 'bg-uber-black text-uber-white'
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

              {isAuthenticated && (
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className="flex items-center gap-3 px-4 py-3 mt-auto rounded-xl text-sm font-semibold uppercase tracking-wide text-uber-red hover:bg-red-50 transition-colors w-full text-left"
                >
                  <LogOut size={18} />
                  <span>Log Out</span>
                </button>
              )}
            </aside>
          </div>
        )}

        {/* Content Canvas */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-6 md:p-8 bg-uber-gray-100">
          <div className="max-w-7xl mx-auto w-full">
            {children}
          </div>
        </main>

      </div>
    </div>
  );
};
