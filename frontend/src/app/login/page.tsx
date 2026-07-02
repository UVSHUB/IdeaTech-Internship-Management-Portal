"use client";

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Mail, ArrowRight, Chrome, ShieldAlert } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Google Login Modal State
  const [googleModalOpen, setGoogleModalOpen] = useState(false);
  const [googleEmail, setGoogleEmail] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
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

  // Pre-fill Admin Credentials & Login
  const handleAdminQuickLogin = () => {
    setEmail('vibodhasilvaulindu@gmail.com');
    setPassword('Ulindu_2004');
    setError('');
    // Automatically submit in next tick
    setTimeout(() => {
      const btn = document.getElementById('login-submit-btn');
      if (btn) btn.click();
    }, 100);
  };

  // Handle Google OAuth Callback Simulation
  const handleGoogleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!googleEmail.trim()) return;

    setGoogleLoading(true);
    setError('');

    try {
      // Simulate ID Token by encoding email as credential
      const mockCredential = btoa(JSON.stringify({ email: googleEmail, iss: 'accounts.google.com' }));
      
      const res = await fetch('/api/auth/google-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ credential: mockCredential }),
      });

      const data = await res.json();
      if (res.ok) {
        setGoogleModalOpen(false);
        login(data.token, data.user);
      } else {
        setError(data.message || 'Google login failed.');
        setGoogleModalOpen(false);
      }
    } catch (err) {
      setError('Connection to auth server failed.');
      setGoogleModalOpen(false);
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-slate-900 text-slate-100">
      {/* Background glow animations */}
      <div className="absolute top-[20%] left-[25%] w-[350px] h-[350px] rounded-full bg-blue-500/10 filter blur-[80px]" />
      <div className="absolute bottom-[20%] right-[25%] w-[350px] h-[350px] rounded-full bg-purple-500/10 filter blur-[80px]" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md rounded-3xl border border-white/10 p-8 glass-panel shadow-2xl relative z-10"
      >
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-theme-gradient mb-3 shadow-lg shadow-blue-500/20 text-white font-bold text-lg">
            IT
          </div>
          <h1 className="text-2xl font-bold tracking-tight font-sans">Welcome Back</h1>
          <p className="text-xs text-slate-400 mt-1">IdeaTech Internship Management Portal (ITIMP)</p>
        </div>

        {/* Admin Quick Login Pill */}
        <div className="mb-6 p-3 rounded-2xl bg-blue-500/10 border border-blue-500/25 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <ShieldAlert size={16} className="text-blue-400" />
            <div className="text-left">
              <span className="text-[10px] text-slate-400 block font-semibold uppercase">Admin Access</span>
              <span className="text-[11px] text-blue-300 font-medium">vibodhasilvaulindu@gmail.com</span>
            </div>
          </div>
          <button
            type="button"
            onClick={handleAdminQuickLogin}
            className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold transition-all shadow-md"
          >
            Quick Login
          </button>
        </div>

        {error && (
          <div className="p-3 mb-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs text-center leading-relaxed">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] text-slate-400 mb-1 font-semibold tracking-wider">EMAIL ADDRESS</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3.5 text-slate-500" size={15} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-950/40 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                placeholder="e.g. vibodhasilvaulindu@gmail.com"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-[11px] text-slate-400 font-semibold tracking-wider">PASSWORD</label>
              <button
                type="button"
                onClick={() => setError('Use your seeded password (e.g. Ulindu_2004 for admin, password123 for others).')}
                className="text-[10px] text-blue-400 hover:underline"
              >
                Forgot Password?
              </button>
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3.5 text-slate-500" size={15} />
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
            id="login-submit-btn"
            disabled={loading}
            className="w-full flex items-center justify-center space-x-2 py-3 rounded-xl bg-theme-gradient text-white font-semibold text-sm hover:opacity-90 transition-opacity shadow-lg shadow-blue-500/20 mt-6"
          >
            {loading ? <span>Authenticating Session...</span> : (
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

        {/* Google OAuth trigger */}
        <button
          type="button"
          onClick={() => setGoogleModalOpen(true)}
          className="w-full flex items-center justify-center space-x-2 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 font-medium text-xs transition-colors border border-white/5 shadow-md"
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

      {/* Google Login Simulator Modal */}
      <AnimatePresence>
        {googleModalOpen && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-50 p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-sm rounded-3xl border border-white/10 p-6 bg-slate-900 shadow-2xl space-y-4"
            >
              <div className="text-center">
                <Chrome size={32} className="text-red-400 mx-auto mb-2" />
                <h3 className="text-base font-bold text-white">Sign in with Google</h3>
                <p className="text-xs text-slate-400 leading-relaxed px-4">
                  Provide your Google Gmail address. Google SSO checks if this address was registered via form application.
                </p>
              </div>

              <form onSubmit={handleGoogleSubmit} className="space-y-3">
                <div>
                  <label className="block text-[10px] text-slate-500 mb-0.5">GOOGLE EMAIL</label>
                  <input
                    type="email"
                    required
                    value={googleEmail}
                    onChange={(e) => setGoogleEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-blue-500"
                    placeholder="e.g. candidate@gmail.com"
                  />
                </div>

                <div className="flex space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setGoogleModalOpen(false)}
                    className="flex-1 py-2 rounded-xl bg-slate-800 text-slate-400 text-xs font-semibold hover:bg-slate-750"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={googleLoading}
                    className="flex-1 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-md shadow-red-500/10"
                  >
                    {googleLoading ? 'Signing In...' : 'Verify Gmail'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
