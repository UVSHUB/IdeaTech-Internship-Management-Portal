"use client";

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Lock, Mail, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [logoError, setLogoError] = useState(false);

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

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 relative">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md rounded-2xl border border-zinc-200 dark:border-zinc-800 p-8 bg-zinc-50 dark:bg-zinc-900/60 shadow-xl dark:shadow-2xl relative z-10"
      >
        <div className="text-center mb-6">
          {!logoError ? (
            <img 
              src="/logo.png" 
              alt="Logo" 
              onError={() => setLogoError(true)} 
              className="w-20 h-20 object-contain mx-auto mb-3 dark:invert"
            />
          ) : (
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-white text-zinc-950 mb-3 font-bold text-lg border border-zinc-200 mx-auto">
              IT
            </div>
          )}
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Welcome Back</h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">IdeaTech Internship Management Portal (ITIMP)</p>
        </div>

        {error && (
          <div className="p-3 mb-4 rounded-xl bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-300 text-xs text-center leading-relaxed">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] text-zinc-500 dark:text-zinc-500 mb-1 font-semibold tracking-wider">EMAIL ADDRESS</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 text-zinc-400 dark:text-zinc-500" size={14} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-xl pl-10 pr-4 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-500 transition-colors"
                placeholder="e.g. name@domain.com"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-[11px] text-zinc-500 dark:text-zinc-500 mb-1 font-semibold tracking-wider">PASSWORD</label>
              <button
                type="button"
                onClick={() => setError('Please contact your administrator to reset your password.')}
                className="text-[10px] text-zinc-500 dark:text-zinc-400 hover:underline"
              >
                Forgot Password?
              </button>
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 text-zinc-400 dark:text-zinc-500" size={14} />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-xl pl-10 pr-4 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-500 transition-colors"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center space-x-2 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-zinc-950 font-bold text-sm transition-colors mt-6 shadow-md shadow-black/10"
          >
            {loading ? <span>Authenticating Session...</span> : (
              <>
                <span>Secure Sign In</span>
                <ArrowRight size={14} />
              </>
            )}
          </button>
        </form>

        <div className="text-center mt-6 text-xs text-zinc-500 dark:text-zinc-400">
          Not registered yet?{' '}
          <button onClick={() => router.push('/apply')} className="text-zinc-950 dark:text-zinc-200 font-semibold hover:underline">
            Submit Internship Form
          </button>
        </div>
      </motion.div>
    </div>
  );
}
