"use client";

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Lock, Mail, HelpCircle, ArrowRight, Chrome } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (res.ok) {
        // Authenticate via context
        login(data.token, data.user);
      } else {
        setError(data.message || 'Invalid credentials.');
      }
    } catch (err) {
      setError('Connection to auth server failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    setError('Google Single Sign-On is currently undergoing sandbox compliance review. Please use email/password.');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-slate-900 text-slate-100">
      {/* Dynamic Background glow blobs */}
      <div className="absolute top-[20%] left-[25%] w-[350px] h-[350px] rounded-full bg-blue-500/10 filter blur-[80px]" />
      <div className="absolute bottom-[20%] right-[25%] w-[350px] h-[350px] rounded-full bg-purple-500/10 filter blur-[80px]" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md rounded-3xl border border-white/10 p-8 glass-panel shadow-2xl relative z-10"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-theme-gradient mb-3 shadow-lg shadow-blue-500/20 text-white font-bold text-lg">
            IT
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Welcome Back</h1>
          <p className="text-xs text-slate-400 mt-1">IdeaTech Internship Management Portal (ITIMP)</p>
        </div>

        {error && (
          <div className="p-3 mb-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] text-slate-400 mb-1 font-medium">EMAIL ADDRESS</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 text-slate-500" size={16} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-950/40 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                placeholder="e.g. intern@ideatech.lk"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-[11px] text-slate-400 font-medium">PASSWORD</label>
              <button
                type="button"
                onClick={() => setError('Password reset instructions were disabled in development mode. Please use seed password.')}
                className="text-[10px] text-blue-400 hover:underline"
              >
                Forgot Password?
              </button>
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 text-slate-500" size={16} />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-950/40 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center space-x-2 py-3 rounded-xl bg-theme-gradient text-white font-semibold text-sm hover:opacity-90 transition-opacity shadow-lg shadow-blue-500/20 mt-6"
          >
            {loading ? <span>Authenticating...</span> : (
              <>
                <span>Secure Sign In</span>
                <ArrowRight size={15} />
              </>
            )}
          </button>
        </form>

        <div className="relative flex py-4 items-center">
          <div className="flex-grow border-t border-white/5"></div>
          <span className="flex-shrink mx-4 text-[10px] text-slate-500 uppercase tracking-widest">or continue with</span>
          <div className="flex-grow border-t border-white/5"></div>
        </div>

        <button
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center space-x-2 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 font-medium text-xs transition-colors border border-white/5"
        >
          <Chrome size={14} className="text-red-400" />
          <span>Google Workspace SSO</span>
        </button>

        <div className="text-center mt-6 text-xs text-slate-400">
          Not an intern yet?{' '}
          <button onClick={() => router.push('/apply')} className="text-blue-400 font-semibold hover:underline">
            Submit Application
          </button>
        </div>
      </motion.div>
    </div>
  );
}
