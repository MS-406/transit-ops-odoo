import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { ShieldAlert } from 'lucide-react';

export const Login = () => {
  const [email, setEmail] = useState('admin@transitops.com');
  const [password, setPassword] = useState('password123');
  const [role, setRole] = useState('Fleet Manager');
  const [error, setError] = useState('');
  
  const { login } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }
    
    // Perform mock login
    login(email, password, role);
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-uber-white md:bg-uber-gray-100 p-6 select-none font-sans">
      
      {/* Wrapper Card */}
      <div className="w-full max-w-md bg-uber-white md:border md:border-uber-gray-300 rounded-2xl md:shadow-xl p-8 flex flex-col transition-all duration-300">
        
        {/* Brand Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold tracking-tighter uppercase text-uber-black">
            Transit<span className="text-uber-green">Ops</span>
          </h1>
          <p className="text-sm text-gray-500 mt-2 uppercase tracking-wide font-bold">
            Smart Transport Operations Platform
          </p>
        </div>

        {/* Informational Alert Box */}
        <div className="mb-6 p-4 rounded-xl bg-gray-50 border border-gray-200 flex items-start gap-3">
          <ShieldAlert className="text-uber-amber shrink-0 mt-0.5" size={18} />
          <div className="text-xs text-gray-600 leading-relaxed text-left">
            <strong>Role Simulation Active:</strong> Choose a preset role below to preview specific permission levels across the platform.
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-5 text-left">
          
          <Input
            label="Email Address"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError('');
            }}
            placeholder="name@transitops.com"
            required
          />

          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError('');
            }}
            placeholder="••••••••"
            required
          />

          <Select
            label="Simulated Role (RBAC Setup)"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            options={[
              { value: 'Fleet Manager', label: 'Fleet Manager (All Access)' },
              { value: 'Driver', label: 'Driver (Trip Focused)' },
              { value: 'Safety Officer', label: 'Safety Officer (Compliance)' },
              { value: 'Financial Analyst', label: 'Financial Analyst (Expenses/Reports)' }
            ]}
          />

          {error && (
            <span className="text-xs font-semibold text-uber-red mt-1">
              {error}
            </span>
          )}

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full mt-2"
          >
            Sign In
          </Button>

        </form>
        
        {/* Footer Notes */}
        <div className="mt-8 text-center text-xs text-gray-400">
          &copy; {new Date().getFullYear()} TransitOps Inc. All rights reserved.
        </div>

      </div>
    </div>
  );
};
