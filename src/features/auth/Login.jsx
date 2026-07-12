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

        {/* Brand Header */}

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
