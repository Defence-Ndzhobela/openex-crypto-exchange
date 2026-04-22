import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.tsx';
import { Bitcoin, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    setLoading(true);
    setError('');
    try {
      await register({ name, email, password });
      setSuccess(true);
      setTimeout(() => navigate('/login'), 2000);
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-10">
          <div className="bg-yellow-500 p-3 rounded-xl shadow-2xl shadow-yellow-500/20 mb-4">
            <Bitcoin className="w-10 h-10 text-black" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tighter text-white uppercase italic">OpenEx</h1>
        </div>

        <div className="bg-[#111] border border-[#222] p-8 rounded-2xl shadow-2xl">
          <h2 className="text-xl font-bold text-white mb-6">Create Account</h2>
          
          {success ? (
            <div className="space-y-6 py-4">
              <div className="bg-green-500/10 border border-green-500/20 p-6 rounded-2xl flex flex-col items-center gap-4 text-center">
                <CheckCircle2 className="w-12 h-12 text-green-500" />
                <div>
                  <h3 className="text-green-500 font-bold text-lg">Account Created!</h3>
                  <p className="text-gray-400 text-sm mt-1">Redirecting you to login...</p>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#1a1a1a] border border-[#333] rounded-xl px-4 py-3 text-white focus:border-yellow-500/50 outline-none transition-all"
                  placeholder="John Doe"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#1a1a1a] border border-[#333] rounded-xl px-4 py-3 text-white focus:border-yellow-500/50 outline-none transition-all"
                  placeholder="name@example.com"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#1a1a1a] border border-[#333] rounded-xl px-4 py-3 text-white focus:border-yellow-500/50 outline-none transition-all"
                  placeholder="••••••••"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Confirm Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-[#1a1a1a] border border-[#333] rounded-xl px-4 py-3 text-white focus:border-yellow-500/50 outline-none transition-all"
                  placeholder="••••••••"
                  required
                />
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-lg flex items-center gap-2 text-sm text-red-400">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-yellow-500 hover:bg-yellow-400 disabled:opacity-50 disabled:hover:bg-yellow-500 text-black font-bold py-3.5 rounded-xl mt-4 transition-all shadow-lg active:scale-[0.98]"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Create Account'}
              </button>
            </form>
          )}

          <p className="mt-8 text-center text-sm text-gray-400 font-medium tracking-tight">
            Already have an account?{' '}
            <Link to="/login" className="text-yellow-500 font-bold hover:underline">Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
