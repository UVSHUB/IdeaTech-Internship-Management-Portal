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
    <div className="min-h-screen flex items-center justify-center p-4 bg-zinc-950 text-zinc-100 relative">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md rounded-2xl border border-zinc-800 p-8 bg-zinc-900/60 shadow-2xl relative z-10"
      >
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-white text-zinc-950 mb-3 font-bold text-lg border border-zinc-200">
            IT
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Welcome Back</h1>
          <p className="text-xs text-zinc-400 mt-1">IdeaTech Internship Management Portal (ITIMP)</p>
        </div>

        {/* Admin Quick Login Pill */}
        <div className="mb-6 p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <ShieldAlert size={16} className="text-zinc-300" />
            <div className="text-left">
              <span className="text-[10px] text-zinc-550 block font-bold uppercase tracking-wider">Admin Sandbox</span>
              <span className="text-[11px] text-zinc-300 font-medium">vibodhasilvaulindu@gmail.com</span>
            </div>
          </div>
          <button
            type="button"
            onClick={handleAdminQuickLogin}
            className="px-3 py-1.5 rounded-lg bg-white text-zinc-950 hover:bg-zinc-200 text-[10px] font-bold transition-colors shadow-sm"
          >
            Quick Login
          </button>
        </div>

        {error && (
          <div className="p-3 mb-4 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-300 text-xs text-center leading-relaxed">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] text-zinc-450 mb-1 font-semibold tracking-wider">EMAIL ADDRESS</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 text-zinc-500" size={14} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-zinc-500 transition-colors"
                placeholder="e.g. name@domain.com"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-[11px] text-zinc-450 font-semibold tracking-wider">PASSWORD</label>
              <button
                type="button"
                onClick={() => setError('Use your seeded password (e.g. Ulindu_2004 for admin, password123 for others).')}
                className="text-[10px] text-zinc-400 hover:underline"
              >
                Forgot Password?
              </button>
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 text-zinc-500" size={14} />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-zinc-500 transition-colors"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            id="login-submit-btn"
            disabled={loading}
            className="w-full flex items-center justify-center space-x-2 py-2.5 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 font-bold text-sm transition-colors mt-6 shadow-md shadow-black/10"
          >
            {loading ? <span>Authenticating Session...</span> : (
              <>
                <span>Secure Sign In</span>
                <ArrowRight size={14} />
              </>
            )}
          </button>
        </form>

        <div className="relative flex py-4 items-center">
          <div className="flex-grow border-t border-zinc-800"></div>
          <span className="flex-shrink mx-4 text-[9px] text-zinc-500 uppercase tracking-widest">or login with</span>
          <div className="flex-grow border-t border-zinc-800"></div>
        </div>

        {/* Google OAuth Simulation trigger */}
        <button
          type="button"
          onClick={() => setGoogleModalOpen(true)}
          className="w-full flex items-center justify-center space-x-2 py-2.5 rounded-xl bg-zinc-950 hover:bg-zinc-900 text-zinc-300 font-semibold text-xs transition-colors border border-zinc-800 shadow-sm"
        >
          <Chrome size={13} className="text-zinc-300" />
          <span>Google Workspace SSO</span>
        </button>

        <div className="text-center mt-6 text-xs text-zinc-400">
          Not registered yet?{' '}
          <button onClick={() => router.push('/apply')} className="text-zinc-200 font-semibold hover:underline">
            Submit Internship Form
          </button>
        </div>
      </motion.div>

      {/* Google Login Simulator Modal */}
      <AnimatePresence>
        {googleModalOpen && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/70 backdrop-blur-xs z-50 p-4 animate-fade-in">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-sm rounded-2xl border border-zinc-800 p-6 bg-zinc-900 shadow-2xl space-y-4"
            >
              <div className="text-center">
                <Chrome size={28} className="text-zinc-300 mx-auto mb-2" />
                <h3 className="text-base font-bold text-zinc-100">Sign in with Google</h3>
                <p className="text-xs text-zinc-400 leading-normal px-2 mt-1">
                  Enter your pre-registered Google email. SSO will query the database to issue your session token.
                </p>
              </div>

              <form onSubmit={handleGoogleSubmit} className="space-y-3">
                <div>
                  <label className="block text-[10px] text-zinc-550 mb-1">GOOGLE EMAIL</label>
                  <input
                    type="email"
                    required
                    value={googleEmail}
                    onChange={(e) => setGoogleEmail(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-zinc-350 focus:outline-none focus:border-zinc-500"
                    placeholder="e.g. name@gmail.com"
                  />
                </div>

                <div className="flex space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setGoogleModalOpen(false)}
                    className="flex-1 py-2 rounded-xl bg-zinc-950 text-zinc-400 text-xs font-semibold hover:bg-zinc-900 border border-zinc-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={googleLoading}
                    className="flex-1 py-2 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 text-xs font-semibold shadow-md"
                  >
                    {googleLoading ? 'Verifying...' : 'Verify SSO'}
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
