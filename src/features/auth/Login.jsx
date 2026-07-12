import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { ShieldCheck, ShieldAlert, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export const Login = () => {
  const [email, setEmail] = useState('admin@transitops.com');
  const [password, setPassword] = useState('password123');
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [demoRole, setDemoRole] = useState('Fleet Manager');
  const [localLoading, setLocalLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { login, isLoading } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }
    
    setLocalLoading(true);
    setError('');

    if (isDemoMode) {
      // Offline/demo mode bypass
      setTimeout(() => {
        useAuthStore.setState({
          user: {
            name: email.split('@')[0],
            email,
            role: demoRole,
          },
          token: 'mock-jwt-token-12345',
          isAuthenticated: true,
          isInitialized: true,
        });
        setLocalLoading(false);
        toast.success(`Logged in as simulated ${demoRole} (Sandbox Mode)`);
        navigate('/dashboard');
      }, 800);
      return;
    }

    // Real API Login
    const result = await login(email, password);
    setLocalLoading(false);
    
    if (result.success) {
      toast.success('Logged in successfully!');
      navigate('/dashboard');
    } else {
      setError(result.error);
      toast.error(result.error);
    }
  };

  const loadingState = isLoading || localLoading;

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

        {/* Mode Switcher */}
        <div className="mb-6 p-1 bg-uber-gray-100 rounded-xl flex gap-1 text-xs">
          <button
            type="button"
            onClick={() => {
              setIsDemoMode(false);
              setError('');
            }}
            className={`flex-1 py-2 rounded-lg font-bold uppercase tracking-wider transition-all
              ${!isDemoMode ? 'bg-uber-black text-uber-white shadow-sm' : 'text-gray-500 hover:text-uber-black'}`}
          >
            Live Server API
          </button>
          <button
            type="button"
            onClick={() => {
              setIsDemoMode(true);
              setError('');
            }}
            className={`flex-1 py-2 rounded-lg font-bold uppercase tracking-wider transition-all
              ${isDemoMode ? 'bg-uber-black text-uber-white shadow-sm' : 'text-gray-500 hover:text-uber-black'}`}
          >
            Sandbox Mode
          </button>
        </div>

        {/* Warning Alert Box */}
        {isDemoMode ? (
          <div className="mb-6 p-4 rounded-xl bg-gray-50 border border-gray-200 flex items-start gap-3">
            <ShieldCheck className="text-uber-green shrink-0 mt-0.5" size={18} />
            <div className="text-xs text-gray-600 leading-relaxed text-left">
              <strong>Offline Sandbox Active:</strong> You can select any role to bypass the API server checks for review and layout testing.
            </div>
          </div>
        ) : (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 flex items-start gap-3">
            <ShieldAlert className="text-uber-red shrink-0 mt-0.5" size={18} />
            <div className="text-xs text-red-800 leading-relaxed text-left">
              <strong>Live Server Mode:</strong> This requests credentials against the FastAPI endpoints. Ensure your backend server is active.
            </div>
          </div>
        )}

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
            disabled={loadingState}
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
            disabled={loadingState}
            required
          />

          {isDemoMode && (
            <Select
              label="Simulated Role (RBAC)"
              value={demoRole}
              onChange={(e) => setDemoRole(e.target.value)}
              options={[
                { value: 'Admin', label: 'Admin (All Access)' },
                { value: 'Fleet Manager', label: 'Fleet Manager (Operations)' },
                { value: 'Driver', label: 'Driver (Trip Focused)' },
                { value: 'Safety Officer', label: 'Safety Officer (Compliance)' },
                { value: 'Financial Analyst', label: 'Financial Analyst (Expenses)' }
              ]}
              disabled={loadingState}
            />
          )}

          {error && (
            <span className="text-xs font-semibold text-uber-red mt-1">
              {error}
            </span>
          )}

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full mt-2 flex items-center justify-center gap-2"
            disabled={loadingState}
          >
            {loadingState ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Signing In...</span>
              </>
            ) : (
              <span>Sign In</span>
            )}
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
