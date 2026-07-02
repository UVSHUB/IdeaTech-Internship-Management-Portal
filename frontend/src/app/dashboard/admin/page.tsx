"use client";

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import Sidebar from '@/components/Sidebar';
import GlassCard from '@/components/GlassCard';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell 
} from 'recharts';
import { 
  ShieldAlert, Activity, CheckSquare, Clock, Settings, Play 
} from 'lucide-react';

export default function AdminDashboard() {
  const { token } = useAuth();
  
  // States
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);
  const [triggerMsg, setTriggerMsg] = useState('');

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/analytics/dashboard', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.ok) {
        setStats(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerAudit = async () => {
    setTriggering(true);
    setTriggerMsg('');
    try {
      const res = await fetch('/api/admin/trigger-checks', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setTriggerMsg('Warnings and 5-day inactivity auto-terminations verified and processed successfully!');
        fetchAdminData();
      } else {
        setTriggerMsg(data.message || 'Audit failed.');
      }
    } catch (error) {
      setTriggerMsg('Connection failed.');
    } finally {
      setTriggering(false);
    }
  };

  if (loading || !stats) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-900 text-slate-100">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs text-slate-400">Loading System Cockpit...</p>
        </div>
      </div>
    );
  }

  // Formatting chart data
  const COLORS = ['#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444'];
  const attendanceChartData = [
    { name: 'Present', value: stats.attendance.PRESENT, fill: '#10B981' },
    { name: 'Late', value: stats.attendance.LATE, fill: '#F59E0B' },
    { name: 'Half Day', value: stats.attendance.HALF_DAY, fill: '#8B5CF6' },
    { name: 'Absent', value: stats.attendance.ABSENT, fill: '#EF4444' },
  ].filter(item => item.value > 0);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex">
      <Sidebar />

      <main className="flex-1 lg:ml-64 p-8 pt-20 lg:pt-8 space-y-6 overflow-y-auto max-h-screen">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">System Admin Console</h1>
            <p className="text-sm text-slate-400 mt-1">ITIMP portal health, logs, database reports, and audits.</p>
          </div>
        </div>

        {/* Counts row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          <GlassCard className="flex items-center space-x-4 border-l-4 border-l-blue-500">
            <div className="p-3 bg-blue-500/10 text-blue-400 rounded-2xl"><Activity size={20} /></div>
            <div>
              <p className="text-xs text-slate-400 font-semibold uppercase">Total Database Records</p>
              <h3 className="text-2xl font-bold">{stats.counts.total}</h3>
            </div>
          </GlassCard>
          
          <GlassCard className="flex items-center space-x-4 border-l-4 border-l-emerald-500">
            <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-2xl"><CheckSquare size={20} /></div>
            <div>
              <p className="text-xs text-slate-400 font-semibold uppercase">Task Completion Rate</p>
              <h3 className="text-2xl font-bold">{stats.tasks.completionRate}%</h3>
            </div>
          </GlassCard>

          <GlassCard className="flex items-center space-x-4 border-l-4 border-l-amber-500">
            <div className="p-3 bg-amber-500/10 text-amber-400 rounded-2xl"><ShieldAlert size={20} /></div>
            <div>
              <p className="text-xs text-slate-400 font-semibold uppercase">Active Warning Alerts</p>
              <h3 className="text-2xl font-bold">{stats.counts.warning}</h3>
            </div>
          </GlassCard>

          <GlassCard className="flex items-center space-x-4 border-l-4 border-l-red-500">
            <div className="p-3 bg-red-500/10 text-red-400 rounded-2xl"><Clock size={20} /></div>
            <div>
              <p className="text-xs text-slate-400 font-semibold uppercase">Auto-Terminations</p>
              <h3 className="text-2xl font-bold">{stats.counts.terminated}</h3>
            </div>
          </GlassCard>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Department count Bar chart */}
          <GlassCard className="lg:col-span-2 space-y-4">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Department Capacities</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.departments}>
                  <XAxis dataKey="name" stroke="#64748B" fontSize={12} tickLine={false} />
                  <YAxis stroke="#64748B" fontSize={12} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ background: '#1E293B', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px' }}
                    labelStyle={{ color: '#FFFFFF', fontWeight: 'bold' }}
                  />
                  <Bar dataKey="count" fill="url(#bluePurpleGrad)" radius={[8, 8, 0, 0]} />
                  <defs>
                    <linearGradient id="bluePurpleGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3B82F6" />
                      <stop offset="100%" stopColor="#A855F7" />
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>

          {/* Attendance Pie Chart */}
          <GlassCard className="space-y-4 flex flex-col justify-between">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Aggregate Attendance Mix</h3>
            {attendanceChartData.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-16">No check-in logs submitted yet.</p>
            ) : (
              <div className="h-48 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={attendanceChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={70}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {attendanceChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ background: '#1E293B', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', fontSize: 11 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
            
            {/* Color labels */}
            <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-white/5">
              <div className="flex items-center space-x-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span><span className="text-slate-400">Present</span></div>
              <div className="flex items-center space-x-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span><span className="text-slate-400">Late</span></div>
              <div className="flex items-center space-x-1.5"><span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span><span className="text-slate-400">Half Day</span></div>
              <div className="flex items-center space-x-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-500"></span><span className="text-slate-400">Absent</span></div>
            </div>
          </GlassCard>
        </div>

        {/* Audits & Engine Triggers */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Audit Logs */}
          <GlassCard className="lg:col-span-2 space-y-4">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center space-x-1.5">
              <Settings size={16} />
              <span>Activity & Safety Audit Trail</span>
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-white/5 text-slate-450 uppercase font-semibold">
                    <th className="py-2.5">User</th>
                    <th className="py-2.5">Action</th>
                    <th className="py-2.5">Details</th>
                    <th className="py-2.5">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-slate-350">
                  {stats.activityLogs.map((log: any) => (
                    <tr key={log.id}>
                      <td className="py-3 font-semibold text-white">{log.user.firstName} {log.user.lastName}</td>
                      <td className="py-3">
                        <span className={`px-1.5 py-0.5 rounded font-bold text-[9px] ${
                          log.action === 'AUTO_TERMINATION' ? 'bg-red-500/10 text-red-400' :
                          log.action === 'APPROVE_INTERN' ? 'bg-blue-500/10 text-blue-400' : 'bg-slate-800 text-slate-400'
                        }`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3 max-w-[200px] truncate" title={log.details}>{log.details}</td>
                      <td className="py-3 text-slate-500">{new Date(log.createdAt).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassCard>

          {/* Manual engine execution card */}
          <GlassCard className="space-y-4">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Automation Triggers</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              ITIMP runs automated warning and auto-suspension routines in the background. Press below to force execute the daily audits immediately.
            </p>

            {triggerMsg && (
              <div className="p-3 rounded-xl bg-slate-900 border border-white/5 text-[11px] text-blue-400 leading-normal text-center">
                {triggerMsg}
              </div>
            )}

            <button
              onClick={handleTriggerAudit}
              disabled={triggering}
              className="w-full flex items-center justify-center space-x-2 py-3 rounded-xl bg-theme-gradient text-white font-semibold text-sm hover:opacity-90 transition-opacity shadow-lg shadow-blue-500/20"
            >
              {triggering ? (
                <span>Auditing Database...</span>
              ) : (
                <>
                  <Play size={14} fill="white" />
                  <span>Run Automation Rules</span>
                </>
              )}
            </button>
          </GlassCard>
        </div>
      </main>
    </div>
  );
}
