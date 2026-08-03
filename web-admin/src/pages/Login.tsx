import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/api/axios';
import { Lock, User, Loader2, ShieldCheck, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Login() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await api.post('/auth/login/', { username, password });
      localStorage.setItem('access_token', res.data.access);
      const userRes = await api.get('/auth/me/', {
        headers: { Authorization: `Bearer ${res.data.access}` }
      });
      login(res.data.access, res.data.refresh, userRes.data);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.detail || 'Authentication failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex font-sans">
      {/* Left Side - Visual/Marketing */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary-600 relative overflow-hidden items-center justify-center p-12">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-700 to-primary-500 opacity-90"></div>
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        <div className="relative z-10 max-w-lg text-white">
          <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-8 border border-white/30 shadow-2xl">
            <span className="text-white font-black text-2xl">H</span>
          </div>
          <h1 className="text-5xl font-bold tracking-tight mb-6 leading-tight">
            Elevate Your <br />
            <span className="text-primary-200">Hotel Operations.</span>
          </h1>
          <p className="text-lg text-primary-50 font-medium leading-relaxed opacity-90">
            A comprehensive, high-performance management ecosystem designed for modern hospitality businesses. Secure, local, and incredibly fast.
          </p>

          <div className="mt-12 grid grid-cols-2 gap-8">
            <div className="space-y-2">
              <p className="text-3xl font-bold">100%</p>
              <p className="text-sm font-semibold text-primary-100 uppercase tracking-wider">Local Uptime</p>
            </div>
            <div className="space-y-2">
              <p className="text-3xl font-bold">Encrypted</p>
              <p className="text-sm font-semibold text-primary-100 uppercase tracking-wider">JWT Security</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white lg:bg-transparent">
        <div className="w-full max-w-[400px] space-y-8">
          <div className="lg:hidden flex justify-center mb-8">
             <div className="w-12 h-12 bg-primary-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg">H</div>
          </div>

          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">System Portal</h2>
            <p className="mt-2 text-slate-500 font-medium">Authorized access only. Please identify yourself.</p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-rose-50 border border-rose-100 text-rose-700 text-[13px] font-bold p-4 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-1">
                <div className="w-5 h-5 bg-rose-100 rounded-full flex items-center justify-center shrink-0">
                  <span className="text-[10px]">!</span>
                </div>
                {error}
              </div>
            )}
            
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">Username</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-primary-600">
                  <User className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="block w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-[14px] font-medium focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 focus:bg-white outline-none transition-all"
                  placeholder="Enter your username"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between px-1">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Access Key</label>
                <a href="#" className="text-[11px] font-bold text-primary-600 hover:underline">Forgot?</a>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-primary-600">
                  <Lock className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-[14px] font-medium focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 focus:bg-white outline-none transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-4 px-4 bg-primary-600 hover:bg-primary-700 text-white rounded-2xl text-[14px] font-bold shadow-lg shadow-primary-200 transition-all active:scale-[0.98] disabled:opacity-70 group"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <span>Initialize Session</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="pt-8 border-t border-slate-100 flex flex-col items-center gap-4">
            <div className="flex items-center gap-2 text-slate-400">
              <ShieldCheck className="w-4 h-4" />
              <span className="text-[11px] font-bold uppercase tracking-[0.2em]">Enterprise Grade Security</span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium text-center leading-relaxed">
              By accessing this system, you agree to our Terms of Use and <br />
              Data Security Policy. Unauthorized access is strictly prohibited.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
