"use client";

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import Sidebar from '@/components/Sidebar';
import GlassCard from '@/components/GlassCard';
import { Users, FileText, CheckCircle, XCircle, Clock, UserCheck, AlertTriangle } from 'lucide-react';

export default function HRDashboard() {
  const { token } = useAuth();
  
  // States
  const [stats, setStats] = useState<any>(null);
  const [applications, setApplications] = useState<any[]>([]);
  const [leaves, setLeaves] = useState<any[]>([]);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Forms mapping
  const [selectedMentor, setSelectedMentor] = useState<Record<string, string>>({});
  const [selectedLeader, setSelectedLeader] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchHRData();
  }, []);

  const fetchHRData = async () => {
    setLoading(true);
    try {
      // 1. Stats
      const statsRes = await fetch('/api/analytics/dashboard', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (statsRes.ok) {
        setStats(await statsRes.json());
      }

      // 2. Pending Applications
      const appsRes = await fetch('/api/auth/pending-applications', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (appsRes.ok) {
        setApplications(await appsRes.json());
      }

      // 3. Leaves
      const leavesRes = await fetch('/api/leaves/all', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (leavesRes.ok) {
        setLeaves(await leavesRes.json());
      }

      // 4. Users list (for Mentor/TL selection)
      const usersRes = await fetch('/api/users/list', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (usersRes.ok) {
        setUsersList(await usersRes.json());
      }

    } catch (error) {
      console.error('HR fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Approve Intern
  const handleApprove = async (profileId: string) => {
    const mentorId = selectedMentor[profileId] || '';
    const teamLeaderId = selectedLeader[profileId] || '';

    try {
      const res = await fetch(`/api/auth/approve/${profileId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ mentorId, teamLeaderId }),
      });

      if (res.ok) {
        alert('Intern approved successfully!');
        fetchHRData();
      } else {
        const err = await res.json();
        alert(err.message || 'Approval failed.');
      }
    } catch (error) {
      alert('Error during approval.');
    }
  };

  // Reject Intern
  const handleReject = async (profileId: string) => {
    if (!confirm('Are you sure you want to reject this applicant? This will remove their registration.')) return;

    try {
      const res = await fetch(`/api/auth/reject/${profileId}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (res.ok) {
        alert('Intern registration rejected.');
        fetchHRData();
      } else {
        alert('Rejection failed.');
      }
    } catch (error) {
      alert('Error.');
    }
  };

  // Review Leave
  const handleReviewLeave = async (leaveId: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      const res = await fetch(`/api/leaves/review/${leaveId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });

      if (res.ok) {
        alert(`Leave request ${status.toLowerCase()} successfully.`);
        fetchHRData();
      } else {
        alert('Action failed.');
      }
    } catch (error) {
      alert('Error.');
    }
  };

  const mentors = usersList.filter(u => u.role === 'MENTOR');
  const teamLeaders = usersList.filter(u => u.role === 'TEAM_LEADER');

  if (loading || !stats) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-900 text-slate-100">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">Loading HR metrics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 flex">
      <Sidebar />

      <main className="flex-1 lg:ml-64 p-8 pt-20 lg:pt-8 space-y-6 overflow-y-auto max-h-screen">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">HR Operations Dashboard</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Manage intern approvals, leaves, warnings, and department stats.</p>
        </div>

        {/* Counts Panel Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <GlassCard className="p-4 text-center">
            <h4 className="text-zinc-500 dark:text-zinc-400 text-xs font-semibold uppercase">Total Applications</h4>
            <h2 className="text-2xl font-bold mt-2 text-white">{stats.counts.total}</h2>
          </GlassCard>
          
          <GlassCard className="p-4 text-center border-l-2 border-l-blue-500">
            <h4 className="text-zinc-500 dark:text-zinc-400 text-xs font-semibold uppercase">Active Interns</h4>
            <h2 className="text-2xl font-bold mt-2 text-blue-400">{stats.counts.active}</h2>
          </GlassCard>

          <GlassCard className="p-4 text-center border-l-2 border-l-amber-500">
            <h4 className="text-zinc-500 dark:text-zinc-400 text-xs font-semibold uppercase">Warnings</h4>
            <h2 className="text-2xl font-bold mt-2 text-amber-400">{stats.counts.warning}</h2>
          </GlassCard>

          <GlassCard className="p-4 text-center border-l-2 border-l-red-500">
            <h4 className="text-zinc-500 dark:text-zinc-400 text-xs font-semibold uppercase">Terminated</h4>
            <h2 className="text-2xl font-bold mt-2 text-red-500">{stats.counts.terminated}</h2>
          </GlassCard>

          <GlassCard className="p-4 text-center border-l-2 border-l-green-500">
            <h4 className="text-zinc-500 dark:text-zinc-400 text-xs font-semibold uppercase">Completed</h4>
            <h2 className="text-2xl font-bold mt-2 text-green-400">{stats.counts.completed}</h2>
          </GlassCard>

          <GlassCard className="p-4 text-center">
            <h4 className="text-zinc-500 dark:text-zinc-400 text-xs font-semibold uppercase">Task Complete Rate</h4>
            <h2 className="text-2xl font-bold mt-2 text-white">{stats.tasks.completionRate}%</h2>
          </GlassCard>
        </div>

        {/* 2-Column Worksheets */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Section: Pending Registrations */}
          <GlassCard className="space-y-4">
            <h2 className="text-base font-bold flex items-center space-x-2 text-blue-400">
              <UserCheck size={18} />
              <span>Pending Internship Applications ({applications.length})</span>
            </h2>

            {applications.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-8">No registration applications awaiting approval.</p>
            ) : (
              <div className="space-y-4 max-h-[450px] overflow-y-auto pr-1">
                {applications.map((app) => (
                  <div key={app.id} className="p-4 bg-slate-900/60 border border-white/5 rounded-2xl space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-sm font-bold text-white">{app.user.firstName} {app.user.lastName}</h4>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">{app.university} | {app.degree}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">Applied: {app.positionApplied} ({app.department.name})</p>
                      </div>
                      <span className="text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-full font-bold">
                        Pending
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <div>
                        <label className="block text-[10px] text-slate-500 mb-0.5">ASSIGN MENTOR</label>
                        <select
                          value={selectedMentor[app.id] || ''}
                          onChange={(e) => setSelectedMentor({ ...selectedMentor, [app.id]: e.target.value })}
                          className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-lg px-2 py-1 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-500 transition-colors"
                        >
                          <option value="">Select Mentor...</option>
                          {mentors.map(m => <option key={m.id} value={m.id}>{m.firstName} {m.lastName}</option>)}
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-[10px] text-slate-500 mb-0.5">ASSIGN TEAM LEAD</label>
                        <select
                          value={selectedLeader[app.id] || ''}
                          onChange={(e) => setSelectedLeader({ ...selectedLeader, [app.id]: e.target.value })}
                          className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-lg px-2 py-1 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-500 transition-colors"
                        >
                          <option value="">Select Team Leader...</option>
                          {teamLeaders.map(t => <option key={t.id} value={t.id}>{t.firstName} {t.lastName}</option>)}
                        </select>
                      </div>
                    </div>

                    <div className="flex space-x-2 pt-2 border-t border-white/5">
                      <button
                        onClick={() => handleApprove(app.id)}
                        className="flex-1 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs"
                      >
                        Approve & Issue ID
                      </button>
                      
                      <button
                        onClick={() => handleReject(app.id)}
                        className="px-4 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/25 text-red-500 border border-red-500/20 font-bold text-xs"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>

          {/* Section: Leave Approvals */}
          <GlassCard className="space-y-4">
            <h2 className="text-base font-bold flex items-center space-x-2 text-purple-400">
              <FileText size={18} />
              <span>Intern Leave Requests ({leaves.filter(l => l.status === 'PENDING').length})</span>
            </h2>

            {leaves.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-8">No leave requests logged in system history.</p>
            ) : (
              <div className="space-y-3 max-h-[450px] overflow-y-auto pr-1">
                {leaves.map((leave) => (
                  <div key={leave.id} className="p-3.5 bg-slate-900/60 border border-white/5 rounded-2xl space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-xs font-bold text-white">
                          {leave.user.firstName} {leave.user.lastName} ({leave.user.internProfile?.internId || 'No ID'})
                        </h4>
                        <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                          Dates: {new Date(leave.startDate).toLocaleDateString()} to {new Date(leave.endDate).toLocaleDateString()}
                        </p>
                        <p className="text-[10px] text-purple-400 font-semibold uppercase mt-0.5">Reason: {leave.reason}</p>
                      </div>

                      <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${
                        leave.status === 'APPROVED' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                        leave.status === 'REJECTED' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                        'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}>
                        {leave.status}
                      </span>
                    </div>

                    <p className="text-zinc-500 dark:text-zinc-400 text-xs leading-normal bg-zinc-100 dark:bg-zinc-950/40 p-2 rounded-lg italic">
                      "{leave.description}"
                    </p>

                    {leave.status === 'PENDING' && (
                      <div className="flex space-x-2 pt-2 border-t border-white/5">
                        <button
                          onClick={() => handleReviewLeave(leave.id, 'APPROVED')}
                          className="flex-1 py-1 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px]"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleReviewLeave(leave.id, 'REJECTED')}
                          className="flex-1 py-1 px-3 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-[11px]"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </GlassCard>

        </div>

        {/* Department and University Distribution Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <GlassCard>
            <h3 className="text-sm font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-4">Department Distribution</h3>
            <div className="space-y-3">
              {stats.departments.map((d: any, i: number) => (
                <div key={i} className="flex justify-between items-center bg-slate-900/40 p-3 rounded-xl border border-white/5">
                  <span className="text-sm text-zinc-600 dark:text-zinc-400">{d.name}</span>
                  <span className="text-xs bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-full font-bold">{d.count} Interns</span>
                </div>
              ))}
            </div>
          </GlassCard>

          <GlassCard>
            <h3 className="text-sm font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-4">Top Feeder Universities</h3>
            <div className="space-y-3">
              {stats.universities.map((u: any, i: number) => (
                <div key={i} className="flex justify-between items-center bg-slate-900/40 p-3 rounded-xl border border-white/5">
                  <span className="text-sm text-zinc-600 dark:text-zinc-400 truncate max-w-xs">{u.name}</span>
                  <span className="text-xs bg-purple-500/10 text-purple-400 px-2 py-0.5 rounded-full font-bold">{u.count} Interns</span>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      </main>
    </div>
  );
}
