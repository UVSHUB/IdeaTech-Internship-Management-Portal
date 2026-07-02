"use client";

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Award, Calendar, ShieldCheck, User } from 'lucide-react';

export default function VerifyCertificatePage() {
  const { key } = useParams();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (key) {
      verifyCredential();
    }
  }, [key]);

  const verifyCredential = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/certificates/verify/${key}`);
      const result = await res.json();
      if (res.ok && result.verified) {
        setData(result);
      } else {
        setError(result.message || 'Credential verification failed. The serial or hash is invalid.');
      }
    } catch (err) {
      setError('Error contacting verification registry.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-slate-900 text-slate-100">
      {/* Background glow radial spots */}
      <div className="absolute top-[-10%] left-[-10%] w-[400px] h-[400px] rounded-full bg-blue-500/10 filter blur-[80px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] rounded-full bg-purple-500/10 filter blur-[80px]" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-lg rounded-3xl border border-white/10 p-8 glass-panel shadow-2xl relative z-10 text-center"
      >
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-theme-gradient mb-4 shadow-lg text-white font-bold text-lg">
          IT
        </div>
        <h1 className="text-xl font-bold tracking-tight mb-6">IdeaTech Credential Verification</h1>

        {loading && (
          <div className="space-y-3 py-8">
            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-xs text-slate-400">Verifying signature with registry blockchain...</p>
          </div>
        )}

        {error && (
          <div className="space-y-4 py-8">
            <div className="w-16 h-16 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mx-auto border border-red-500/30">
              <XCircle size={36} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-red-400">Verification Failed</h2>
              <p className="text-xs text-slate-450 mt-1 leading-normal px-6">{error}</p>
            </div>
            <button 
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-slate-800 hover:bg-slate-750 text-xs font-semibold rounded-xl transition-colors border border-white/5"
            >
              Retry Verification
            </button>
          </div>
        )}

        {data && (
          <div className="space-y-6 py-4">
            {/* Verification Seal Badge */}
            <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold shadow-lg shadow-emerald-500/5 mx-auto">
              <ShieldCheck size={14} />
              <span>OFFICIALLY VERIFIED CREDENTIAL</span>
            </div>

            <div className="space-y-4 text-left bg-slate-950/40 p-5 rounded-2xl border border-white/5 mt-4">
              <div className="flex items-center space-x-3 border-b border-white/5 pb-3">
                <div className="p-2.5 bg-blue-500/10 text-blue-400 rounded-xl">
                  <User size={18} />
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase font-bold">Intern Name</span>
                  <strong className="text-sm text-white">{data.internName}</strong>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-b border-white/5 pb-3">
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase font-bold">Intern ID</span>
                  <span className="text-xs text-slate-300 font-semibold">{data.internId}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase font-bold">Role Position</span>
                  <span className="text-xs text-slate-300 font-semibold">{data.position}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-b border-white/5 pb-3">
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase font-bold">Credential Type</span>
                  <span className="text-xs text-blue-400 font-bold tracking-wider">{data.certificateType}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase font-bold">Serial Number</span>
                  <span className="text-xs text-purple-400 font-bold">{data.serialNumber}</span>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-purple-500/10 text-purple-400 rounded-xl">
                  <Calendar size={18} />
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase font-bold">Issue Timestamp</span>
                  <span className="text-xs text-slate-300">{new Date(data.issuedAt).toLocaleString()}</span>
                </div>
              </div>
            </div>

            <a 
              href={data.pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full block py-2.5 rounded-xl bg-theme-gradient text-white text-xs font-semibold hover:opacity-90 transition-opacity text-center shadow-lg shadow-blue-500/10"
            >
              View & Download Document PDF
            </a>
          </div>
        )}

        <div className="mt-8 pt-4 border-t border-white/5 text-[10px] text-slate-500">
          IdeaTech Internship Management Portal (ITIMP) &copy; 2026. All rights reserved.
        </div>
      </motion.div>
    </div>
  );
}
