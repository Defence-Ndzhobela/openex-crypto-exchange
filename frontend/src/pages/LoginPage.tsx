import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.tsx';
import { Bitcoin, Loader2, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login({ email, password });
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-10">
          <div className="bg-yellow-500 p-3 rounded-xl shadow-2xl shadow-yellow-500/20 mb-4 animate-in fade-in zoom-in duration-700">
            <Bitcoin className="w-10 h-10 text-black" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tighter text-white uppercase italic">OpenEx</h1>
          <p className="text-gray-500 text-sm mt-2">Professional Crypto Trading</p>
        </div>

        <div className="bg-[#111] border border-[#222] p-8 rounded-2xl shadow-2xl">
          <h2 className="text-xl font-bold text-white mb-6">Welcome Back</h2>
          
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#1a1a1a] border border-[#333] rounded-xl px-4 py-3 text-white focus:border-yellow-500/50 outline-none transition-all placeholder:text-gray-700"
                placeholder="name@example.com"
                required
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Password</label>
                <Link to="#" className="text-xs text-yellow-500 hover:underline">Forgot password?</Link>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#1a1a1a] border border-[#333] rounded-xl px-4 py-3 text-white focus:border-yellow-500/50 outline-none transition-all placeholder:text-gray-700"
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
              className="w-full bg-yellow-500 hover:bg-yellow-400 disabled:opacity-50 disabled:hover:bg-yellow-500 text-black font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-yellow-500/10 flex items-center justify-center gap-2 active:scale-[0.98]"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sign In'}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-gray-500">
            Don't have an account?{' '}
            <Link to="/register" className="text-yellow-500 font-semibold hover:underline">Create an account</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
