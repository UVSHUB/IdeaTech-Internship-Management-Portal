"use client";

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useParams } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import GlassCard from '@/components/GlassCard';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell 
} from 'recharts';
import { 
  ShieldAlert, Activity, CheckSquare, Clock, Settings, Play, 
  UserCheck, FolderGit2, CalendarRange, FileText, Award, Plus, Loader2 
} from 'lucide-react';

export default function AdminDashboard() {
  const { token } = useAuth();
  const params = useParams();
  const tab = params?.tab as string | undefined; // undefined (Overview), 'applications', 'attendance', 'tasks', 'projects', 'meetings', 'leaves', 'certificates'

  // Global Lists
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Tab-Specific States
  const [applications, setApplications] = useState<any[]>([]);
  const [attendanceLogs, setAttendanceLogs] = useState<any[]>([]);
  const [tasksList, setTasksList] = useState<any[]>([]);
  const [projectsList, setProjectsList] = useState<any[]>([]);
  const [meetingsList, setMeetingsList] = useState<any[]>([]);
  const [leavesList, setLeavesList] = useState<any[]>([]);
  const [usersList, setUsersList] = useState<any[]>([]);

  // Selection state for assignments
  const [selectedMentor, setSelectedMentor] = useState<Record<string, string>>({});
  const [selectedLeader, setSelectedLeader] = useState<Record<string, string>>({});

  // Form Creation States
  const [taskForm, setTaskForm] = useState({ title: '', description: '', priority: 'MEDIUM', dueDate: '', assigneeId: '', projectId: '' });
  const [projectForm, setProjectForm] = useState({ name: '', description: '', githubUrl: '' });
  const [meetingForm, setMeetingForm] = useState({ title: '', agenda: '', meetingTime: '', platform: 'Google Meet', link: '' });
  const [certificateForm, setCertificateForm] = useState({ userId: '', certificateType: 'COMPLETION' });

  // Project member assigner and AI Advisor states
  const [selectedProjectMembers, setSelectedProjectMembers] = useState<Record<string, string>>({});
  const [aiAdviceModalOpen, setAiAdviceModalOpen] = useState(false);
  const [aiAdviceText, setAiAdviceText] = useState('');
  const [aiAdviceLoading, setAiAdviceLoading] = useState(false);

  // Execution states
  const [submitting, setSubmitting] = useState(false);
  const [triggering, setTriggering] = useState(false);
  const [triggerMsg, setTriggerMsg] = useState('');

  useEffect(() => {
    fetchAllData();
  }, [tab]);

  const fetchAllData = async () => {
    if (!token) return;
    setLoading(true);
    try {
      // 1. Fetch default stats anyway for global counts
      const statsRes = await fetch('/api/analytics/dashboard', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (statsRes.ok) {
        setStats(await statsRes.json());
      }

      // 2. Fetch all system users (required for assignment dropdowns and certificate generation)
      const usersRes = await fetch('/api/users/list', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (usersRes.ok) {
        setUsersList(await usersRes.json());
      }

      // 3. Tab-Specific Fetches
      if (tab === 'applications') {
        const res = await fetch('/api/auth/pending-applications', {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (res.ok) setApplications(await res.json());
      } else if (tab === 'attendance') {
        const res = await fetch('/api/attendance/reports', {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (res.ok) setAttendanceLogs(await res.json());
      } else if (tab === 'tasks') {
        const res = await fetch('/api/tasks', {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (res.ok) setTasksList(await res.json());
      } else if (tab === 'projects') {
        const res = await fetch('/api/projects', {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (res.ok) setProjectsList(await res.json());
      } else if (tab === 'meetings') {
        const res = await fetch('/api/meetings', {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (res.ok) setMeetingsList(await res.json());
      } else if (tab === 'leaves') {
        const res = await fetch('/api/leaves/all', {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (res.ok) setLeavesList(await res.json());
      }
    } catch (err) {
      console.error("Error loading data:", err);
    } finally {
      setLoading(false);
    }
  };

  // Applications Actions
  const handleApprove = async (profileId: string) => {
    const mentorId = selectedMentor[profileId] || '';
    const teamLeaderId = selectedLeader[profileId] || '';
    setSubmitting(true);
    try {
      const res = await fetch(`/api/auth/approve/${profileId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ mentorId, teamLeaderId }),
      });
      const data = await res.json();
      if (res.ok) {
        alert('Intern approved and ID Card compiled!');
        fetchAllData();
      } else {
        alert(data.message || 'Approval failed.');
      }
    } catch {
      alert('Network error.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async (profileId: string) => {
    if (!confirm('Are you sure you want to reject this candidate?')) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/auth/reject/${profileId}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.ok) {
        alert('Candidate application rejected.');
        fetchAllData();
      } else {
        alert('Rejection failed.');
      }
    } catch {
      alert('Network error.');
    } finally {
      setSubmitting(false);
    }
  };

  // Leaves Review
  const handleReviewLeave = async (leaveId: string, status: 'APPROVED' | 'REJECTED') => {
    setSubmitting(true);
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
        fetchAllData();
      } else {
        alert('Review failed.');
      }
    } catch {
      alert('Network error.');
    } finally {
      setSubmitting(false);
    }
  };

  // Automation Triggers
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
        setTriggerMsg('Warnings & Suspensions computed successfully.');
        fetchAllData();
      } else {
        setTriggerMsg(data.message || 'Audit failed.');
      }
    } catch {
      setTriggerMsg('Connection failed.');
    } finally {
      setTriggering(false);
    }
  };

  // Form Submissions
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskForm.title || !taskForm.assigneeId || !taskForm.dueDate) {
      alert('Please fill out task title, assignee, and due date.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...taskForm,
          projectId: taskForm.projectId || undefined
        }),
      });
      if (res.ok) {
        alert('Sprint task created and allocated!');
        setTaskForm({ title: '', description: '', priority: 'MEDIUM', dueDate: '', assigneeId: '', projectId: '' });
        fetchAllData();
      } else {
        const err = await res.json();
        alert(err.message || 'Failed to create task.');
      }
    } catch {
      alert('Network error.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectForm.name) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(projectForm),
      });
      if (res.ok) {
        alert('Project registered!');
        setProjectForm({ name: '', description: '', githubUrl: '' });
        fetchAllData();
      } else {
        alert('Failed to create project.');
      }
    } catch {
      alert('Network error.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddMember = async (e: React.FormEvent, projectId: string) => {
    e.preventDefault();
    const userId = selectedProjectMembers[projectId];
    if (!userId) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/projects/member', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ projectId, userId }),
      });
      const data = await res.json();
      if (res.ok) {
        setSelectedProjectMembers({ ...selectedProjectMembers, [projectId]: '' });
        // Refresh projects list
        const projRes = await fetch('/api/projects', {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (projRes.ok) setProjectsList(await projRes.json());
        alert('Member added successfully!');
      } else {
        alert(data.message || 'Failed to add member.');
      }
    } catch (err) {
      alert('Connection error.');
    } finally {
      setSubmitting(false);
    }
  };

  const triggerProjectAIAdvice = async (projectId: string) => {
    setAiAdviceLoading(true);
    setAiAdviceText('');
    setAiAdviceModalOpen(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/ai-advise`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setAiAdviceText(data.advice);
      } else {
        setAiAdviceText(`Error: ${data.message || 'Could not fetch AI advice.'}`);
      }
    } catch (err) {
      setAiAdviceText('Failed to reach AI service.');
    } finally {
      setAiAdviceLoading(false);
    }
  };

  const handleCreateMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!meetingForm.title || !meetingForm.meetingTime || !meetingForm.link) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/meetings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(meetingForm),
      });
      if (res.ok) {
        alert('Sprint meeting scheduled!');
        setMeetingForm({ title: '', agenda: '', meetingTime: '', platform: 'Google Meet', link: '' });
        fetchAllData();
      } else {
        alert('Failed to schedule meeting.');
      }
    } catch {
      alert('Network error.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGenerateCertificate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!certificateForm.userId) {
      alert('Please select an intern.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/certificates/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(certificateForm),
      });
      const data = await res.json();
      if (res.ok) {
        alert('Certificate generated successfully! PDF is compiled.');
        setCertificateForm({ userId: '', certificateType: 'COMPLETION' });
        // Download directly or open
        window.open(data.pdfUrl, '_blank');
        fetchAllData();
      } else {
        alert(data.message || 'Failed to generate certificate.');
      }
    } catch {
      alert('Network error.');
    } finally {
      setSubmitting(false);
    }
  };

  // Filter helper mappings
  const interns = usersList.filter(u => u.role === 'INTERN');
  const mentors = usersList.filter(u => u.role === 'MENTOR');
  const teamLeaders = usersList.filter(u => u.role === 'TEAM_LEADER');

  if (loading || !stats) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-900 text-slate-100">
        <div className="text-center space-y-3">
          <Loader2 className="w-10 h-10 text-blue-500 animate-spin mx-auto" />
          <p className="text-xs text-zinc-500 dark:text-zinc-400">Loading System Cockpit...</p>
        </div>
      </div>
    );
  }

  // Dashboard Overview Variables
  const COLORS = ['#09090b', '#27272a', '#71717a', '#d4d4d8'];
  const attendanceChartData = [
    { name: 'Present', value: stats.attendance.PRESENT, fill: '#18181b' },
    { name: 'Late', value: stats.attendance.LATE, fill: '#3f3f46' },
    { name: 'Half Day', value: stats.attendance.HALF_DAY, fill: '#71717a' },
    { name: 'Absent', value: stats.attendance.ABSENT, fill: '#a1a1aa' },
  ].filter(item => item.value > 0);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 flex">
      <Sidebar />

      <main className="flex-1 lg:ml-64 p-8 pt-20 lg:pt-8 space-y-6 overflow-y-auto max-h-screen">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-zinc-200 dark:border-zinc-800 pb-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight capitalize">
              {tab ? `${tab} Console` : 'System Admin Console'}
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              {tab ? `Manage and view portal ${tab} inputs.` : 'ITIMP portal health, logs, database reports, and audits.'}
            </p>
          </div>
        </div>

        {/* 1. DEFAULT OVERVIEW VIEW */}
        {!tab && (
          <>
            {/* Counts row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              <GlassCard className="flex items-center space-x-4 border-l-4 border-l-zinc-900 dark:border-l-zinc-100">
                <div className="p-3 bg-zinc-500/10 text-zinc-600 dark:text-zinc-300 rounded-2xl"><Activity size={20} /></div>
                <div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 font-semibold uppercase">Total Database Records</p>
                  <h3 className="text-2xl font-bold">{stats.counts.total}</h3>
                </div>
              </GlassCard>
              
              <GlassCard className="flex items-center space-x-4 border-l-4 border-l-zinc-700 dark:border-l-zinc-300">
                <div className="p-3 bg-zinc-500/10 text-zinc-600 dark:text-zinc-300 rounded-2xl"><CheckSquare size={20} /></div>
                <div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 font-semibold uppercase">Task Completion Rate</p>
                  <h3 className="text-2xl font-bold">{stats.tasks.completionRate}%</h3>
                </div>
              </GlassCard>

              <GlassCard className="flex items-center space-x-4 border-l-4 border-l-zinc-500 dark:border-l-zinc-500">
                <div className="p-3 bg-zinc-500/10 text-zinc-600 dark:text-zinc-300 rounded-2xl"><ShieldAlert size={20} /></div>
                <div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 font-semibold uppercase">Active Warning Alerts</p>
                  <h3 className="text-2xl font-bold">{stats.counts.warning}</h3>
                </div>
              </GlassCard>

              <GlassCard className="flex items-center space-x-4 border-l-4 border-l-zinc-300 dark:border-l-zinc-700">
                <div className="p-3 bg-zinc-500/10 text-zinc-600 dark:text-zinc-300 rounded-2xl"><Clock size={20} /></div>
                <div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 font-semibold uppercase">Auto-Terminations</p>
                  <h3 className="text-2xl font-bold">{stats.counts.terminated}</h3>
                </div>
              </GlassCard>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Department count Bar chart */}
              <GlassCard className="lg:col-span-2 space-y-4">
                <h3 className="text-sm font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">Department Capacities</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.departments}>
                      <XAxis dataKey="name" stroke="#71717a" fontSize={12} tickLine={false} />
                      <YAxis stroke="#71717a" fontSize={12} tickLine={false} />
                      <Tooltip 
                        contentStyle={{ background: '#18181b', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px' }}
                        labelStyle={{ color: '#FFFFFF', fontWeight: 'bold' }}
                      />
                      <Bar dataKey="count" fill="url(#bluePurpleGrad)" radius={[8, 8, 0, 0]} />
                      <defs>
                        <linearGradient id="bluePurpleGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#09090b" />
                          <stop offset="100%" stopColor="#71717a" />
                        </linearGradient>
                      </defs>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </GlassCard>

              {/* Attendance Pie Chart */}
              <GlassCard className="space-y-4 flex flex-col justify-between">
                <h3 className="text-sm font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">Aggregate Attendance Mix</h3>
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
                
                <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-white/5">
                  <div className="flex items-center space-x-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span><span className="text-zinc-500 dark:text-zinc-400">Present</span></div>
                  <div className="flex items-center space-x-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span><span className="text-zinc-500 dark:text-zinc-400">Late</span></div>
                  <div className="flex items-center space-x-1.5"><span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span><span className="text-zinc-500 dark:text-zinc-400">Half Day</span></div>
                  <div className="flex items-center space-x-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-500"></span><span className="text-zinc-500 dark:text-zinc-400">Absent</span></div>
                </div>
              </GlassCard>
            </div>

            {/* Audits & Engine Triggers */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <GlassCard className="lg:col-span-2 space-y-4">
                <h3 className="text-sm font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest flex items-center space-x-1.5">
                  <Settings size={16} />
                  <span>Activity & Safety Audit Trail</span>
                </h3>

                <div className="overflow-x-auto max-h-[300px] overflow-y-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-white/5 text-slate-500 uppercase font-semibold">
                        <th className="py-2.5">User</th>
                        <th className="py-2.5">Action</th>
                        <th className="py-2.5">Details</th>
                        <th className="py-2.5">Timestamp</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-zinc-600 dark:text-zinc-400">
                      {stats.activityLogs.map((log: any) => (
                        <tr key={log.id}>
                          <td className="py-3 font-semibold text-white">{log.user.firstName} {log.user.lastName}</td>
                          <td className="py-3">
                            <span className={`px-1.5 py-0.5 rounded font-bold text-[9px] ${
                              log.action.includes('TERMINATION') ? 'bg-red-500/10 text-red-400' :
                              log.action.includes('APPROVE') ? 'bg-blue-500/10 text-blue-400' : 'bg-slate-800 text-zinc-500'
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

              <GlassCard className="space-y-4">
                <h3 className="text-sm font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">Automation Triggers</h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed font-normal">
                  ITIMP runs automated warning and auto-suspension routines in the background. Press below to force execute the daily audits immediately.
                </p>

                {triggerMsg && (
                  <div className="p-3 rounded-xl bg-slate-900 border border-white/5 text-[11px] text-blue-400 leading-normal text-center font-semibold">
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
          </>
        )}

        {/* 2. APPLICATIONS MANAGEMENT TAB */}
        {tab === 'applications' && (
          <GlassCard className="space-y-4">
            <h2 className="text-lg font-bold flex items-center space-x-2 text-blue-400 border-b border-white/5 pb-2">
              <UserCheck size={20} />
              <span>Pending Candidates ({applications.length})</span>
            </h2>

            {applications.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-16">No candidate applications awaiting review.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                {applications.map((app) => (
                  <div key={app.id} className="p-5 bg-slate-900/60 border border-white/5 rounded-3xl space-y-4 shadow-xl">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-base font-bold text-white">{app.user.firstName} {app.user.lastName}</h4>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">{app.university} ({app.degree})</p>
                        <p className="text-xs text-blue-300 font-medium mt-1">Applied: {app.positionApplied} | {app.department.name}</p>
                      </div>
                      <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/25 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                        Pending
                      </span>
                    </div>

                    <div className="text-xs space-y-1.5 text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-950/40 p-3.5 rounded-xl border border-white/5">
                      <p>📧 <strong>Email:</strong> {app.user.email}</p>
                      <p>📱 <strong>Mobile:</strong> {app.mobileNumber}</p>
                      <p>🛠️ <strong>Preferred Tech:</strong> {app.preferredTech}</p>
                      <p>📅 <strong>Availability:</strong> {app.availability}</p>
                      {app.cvUrl && (
                        <p className="pt-1.5">
                          📄 <a href={app.cvUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline font-bold">Download CV / Resume PDF</a>
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] text-slate-500 font-bold mb-1">ASSIGN MENTOR</label>
                        <select
                          value={selectedMentor[app.id] || ''}
                          onChange={(e) => setSelectedMentor({ ...selectedMentor, [app.id]: e.target.value })}
                          className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-500 transition-colors"
                        >
                          <option value="">Select Mentor...</option>
                          {mentors.map(m => <option key={m.id} value={m.id}>{m.firstName} {m.lastName}</option>)}
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-[10px] text-slate-500 font-bold mb-1">ASSIGN TEAM LEAD</label>
                        <select
                          value={selectedLeader[app.id] || ''}
                          onChange={(e) => setSelectedLeader({ ...selectedLeader, [app.id]: e.target.value })}
                          className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-500 transition-colors"
                        >
                          <option value="">Select Team Leader...</option>
                          {teamLeaders.map(t => <option key={t.id} value={t.id}>{t.firstName} {t.lastName}</option>)}
                        </select>
                      </div>
                    </div>

                    <div className="flex space-x-2 pt-2 border-t border-white/5">
                      <button
                        onClick={() => handleApprove(app.id)}
                        disabled={submitting}
                        className="flex-grow py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-colors shadow-md"
                      >
                        Approve Candidate
                      </button>
                      <button
                        onClick={() => handleReject(app.id)}
                        disabled={submitting}
                        className="px-4 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/25 text-red-500 border border-red-500/20 font-bold text-xs transition-colors"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>
        )}

        {/* 3. ATTENDANCE LOGS VIEW */}
        {tab === 'attendance' && (
          <GlassCard className="space-y-4">
            <h2 className="text-lg font-bold flex items-center space-x-2 text-blue-400 border-b border-white/5 pb-2">
              <Clock size={20} />
              <span>Intern Attendance Registry</span>
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-white/5 text-slate-500 uppercase font-semibold">
                    <th className="py-3">Date</th>
                    <th className="py-3">Intern</th>
                    <th className="py-3">Check In</th>
                    <th className="py-3">Check Out</th>
                    <th className="py-3">Hours Worked</th>
                    <th className="py-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-zinc-600 dark:text-zinc-400">
                  {attendanceLogs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-16 text-slate-500">No attendance records logged.</td>
                    </tr>
                  ) : (
                    attendanceLogs.map((log: any) => (
                      <tr key={log.id}>
                        <td className="py-3.5 font-medium">{new Date(log.date).toLocaleDateString()}</td>
                        <td className="py-3.5 font-bold text-white">{log.user.firstName} {log.user.lastName}</td>
                        <td className="py-3.5 text-zinc-500 dark:text-zinc-400">{new Date(log.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                        <td className="py-3.5 text-zinc-500">
                          {log.checkOut ? new Date(log.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Still Working'}
                        </td>
                        <td className="py-3.5 font-mono">{log.workingHours ? `${log.workingHours.toFixed(2)} hrs` : '-'}</td>
                        <td className="py-3.5 text-center">
                          <span className={`px-2 py-0.5 rounded-full font-bold text-[9px] ${
                            log.status === 'PRESENT' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                            log.status === 'LATE' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-red-500/10 text-red-400'
                          }`}>
                            {log.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </GlassCard>
        )}

        {/* 4. SPRINT TASKS VIEW */}
        {tab === 'tasks' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <GlassCard className="lg:col-span-2 space-y-4">
              <h2 className="text-lg font-bold flex items-center space-x-2 text-blue-400 border-b border-white/5 pb-2">
                <CheckSquare size={20} />
                <span>Sprint Tasks List</span>
              </h2>

              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                {tasksList.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-16">No sprint tasks created yet.</p>
                ) : (
                  tasksList.map((task: any) => (
                    <div key={task.id} className="p-4 bg-slate-900/60 border border-white/5 rounded-2xl space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="text-sm font-bold text-white">{task.title}</h4>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{task.description}</p>
                        </div>
                        <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${
                          task.priority === 'HIGH' ? 'bg-red-500/10 text-red-400' :
                          task.priority === 'MEDIUM' ? 'bg-amber-500/10 text-amber-400' : 'bg-blue-500/10 text-blue-400'
                        }`}>
                          {task.priority}
                        </span>
                      </div>

                      <div className="flex justify-between items-center text-[10px] text-slate-500 pt-2 border-t border-white/5">
                        <span>Assignee: <strong className="text-zinc-600 dark:text-zinc-400">{task.assignee.firstName} {task.assignee.lastName}</strong></span>
                        <span>Status: <strong className={`font-bold ${task.status === 'COMPLETED' ? 'text-emerald-400' : 'text-amber-400'}`}>{task.status}</strong></span>
                        <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </GlassCard>

            {/* Task creation form */}
            <GlassCard className="space-y-4">
              <h3 className="text-sm font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest border-b border-white/5 pb-2">Create Sprint Task</h3>
              <form onSubmit={handleCreateTask} className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-500 mb-1">TASK TITLE *</label>
                  <input
                    type="text"
                    required
                    value={taskForm.title}
                    onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-xl px-3 py-2 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-500 transition-colors"
                    placeholder="e.g. Design Settings View"
                  />
                </div>

                <div>
                  <label className="block text-slate-500 mb-1">DESCRIPTION</label>
                  <textarea
                    rows={3}
                    value={taskForm.description}
                    onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-xl px-3 py-2 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-500 transition-colors"
                    placeholder="Write detailed deliverables..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-500 mb-1">PRIORITY</label>
                    <select
                      value={taskForm.priority}
                      onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}
                      className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-xl px-3 py-2 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-500 transition-colors"
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-500 mb-1">DUE DATE *</label>
                    <input
                      type="date"
                      required
                      value={taskForm.dueDate}
                      onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
                      className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-xl px-3 py-2 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-500 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-500 mb-1">ALLOCATE TO INTERN *</label>
                  <select
                    value={taskForm.assigneeId}
                    onChange={(e) => setTaskForm({ ...taskForm, assigneeId: e.target.value })}
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-xl px-3 py-2 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-500 transition-colors"
                  >
                    <option value="">Select Intern...</option>
                    {interns.map(i => <option key={i.id} value={i.id}>{i.firstName} {i.lastName}</option>)}
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all shadow-md mt-2"
                >
                  Create Task
                </button>
              </form>
            </GlassCard>
          </div>
        )}

        {/* 5. PROJECTS MANAGEMENT VIEW */}
        {tab === 'projects' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <GlassCard className="lg:col-span-2 space-y-4">
              <h2 className="text-lg font-bold flex items-center space-x-2 text-blue-400 border-b border-white/5 pb-2">
                <FolderGit2 size={20} />
                <span>Active Portal Projects</span>
              </h2>

              <div className="grid grid-cols-1 gap-6">
                {projectsList.length === 0 ? (
                  <p className="col-span-3 text-xs text-zinc-500 text-center py-16">No active projects registered.</p>
                ) : (
                  projectsList.map((project: any) => (
                    <div key={project.id} className="p-5 bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-2xl space-y-4 shadow-sm relative overflow-hidden">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="text-base font-bold text-zinc-900 dark:text-white">{project.name}</h4>
                          <span className="text-[10px] text-zinc-500 dark:text-zinc-450 block mt-0.5">ID: {project.id}</span>
                        </div>
                        <span className="text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/25 px-2 py-0.5 rounded font-bold uppercase">
                          {project.status}
                        </span>
                      </div>

                      <p className="text-xs text-zinc-500 dark:text-zinc-400">{project.description || 'No description supplied.'}</p>

                      {project.githubUrl && (
                        <a href={project.githubUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] text-blue-500 hover:underline flex items-center space-x-1 font-bold">
                          <span>🌐 Open GitHub Repository</span>
                        </a>
                      )}

                      {/* Members Section */}
                      <div className="pt-3.5 border-t border-zinc-200 dark:border-zinc-800">
                        <h5 className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">Team Members ({project.members?.length || 0})</h5>
                        {project.members && project.members.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5 mb-3.5">
                            {project.members.map((m: any) => (
                              <span key={m.id} className="text-[10px] bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 px-2 py-0.5 rounded-full text-zinc-700 dark:text-zinc-300 font-medium">
                                {m.user.firstName} {m.user.lastName} <span className="text-[8px] text-zinc-500 uppercase font-bold">({m.user.role.replace('_', ' ')})</span>
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-[10px] text-zinc-500 italic mb-3.5">No members assigned to this project.</p>
                        )}

                        {/* Assign Member Form */}
                        <form onSubmit={(e) => handleAddMember(e, project.id)} className="flex items-center space-x-2">
                          <select
                            value={selectedProjectMembers[project.id] || ''}
                            onChange={(e) => setSelectedProjectMembers({ ...selectedProjectMembers, [project.id]: e.target.value })}
                            className="flex-grow bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-lg px-2.5 py-1.5 text-[11px] text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-500"
                          >
                            <option value="">Select Member to Assign...</option>
                            {usersList.map((u: any) => (
                              <option key={u.id} value={u.id}>
                                {u.firstName} {u.lastName} ({u.role.replace('_', ' ')})
                              </option>
                            ))}
                          </select>
                          <button
                            type="submit"
                            disabled={submitting}
                            className="px-3.5 py-1.5 rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 text-[10px] font-bold hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors shadow-sm"
                          >
                            Assign
                          </button>
                        </form>
                      </div>

                      {/* AI Sprint Advisor Button */}
                      <div className="pt-3 border-t border-zinc-200 dark:border-zinc-850 flex justify-between items-center">
                        <span className="text-[10px] text-zinc-500 font-bold uppercase">{project.tasks?.length || 0} Tasks Assigned</span>
                        <button
                          type="button"
                          onClick={() => triggerProjectAIAdvice(project.id)}
                          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-950 text-[10px] font-bold transition-all shadow-sm"
                        >
                          <span>✨ AI Sprint Advisor</span>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </GlassCard>

            <GlassCard className="space-y-4">
              <h3 className="text-sm font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest border-b border-white/5 pb-2">Register New Project</h3>
              <form onSubmit={handleCreateProject} className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-500 mb-1">PROJECT NAME *</label>
                  <input
                    type="text"
                    required
                    value={projectForm.name}
                    onChange={(e) => setProjectForm({ ...projectForm, name: e.target.value })}
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-xl px-3 py-2 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-500 transition-colors"
                    placeholder="e.g. ITIMP NextGen Dashboard"
                  />
                </div>

                <div>
                  <label className="block text-slate-500 mb-1">DESCRIPTION</label>
                  <textarea
                    rows={4}
                    value={projectForm.description}
                    onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })}
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-xl px-3 py-2 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-500 transition-colors"
                    placeholder="Briefly state scope and targets..."
                  />
                </div>

                <div>
                  <label className="block text-slate-500 mb-1">GITHUB REPOSITORY URL</label>
                  <input
                    type="url"
                    value={projectForm.githubUrl}
                    onChange={(e) => setProjectForm({ ...projectForm, githubUrl: e.target.value })}
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-xl px-3 py-2 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-500 transition-colors"
                    placeholder="e.g. https://github.com/..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all shadow-md mt-2"
                >
                  Create Project
                </button>
              </form>
            </GlassCard>
          </div>
        )}

        {/* 6. MEETINGS SCHEDULER VIEW */}
        {tab === 'meetings' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <GlassCard className="lg:col-span-2 space-y-4">
              <h2 className="text-lg font-bold flex items-center space-x-2 text-blue-400 border-b border-white/5 pb-2">
                <CalendarRange size={20} />
                <span>Sprint Meetings Schedule</span>
              </h2>

              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                {meetingsList.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-16">No scheduled meetings.</p>
                ) : (
                  meetingsList.map((meeting: any) => (
                    <div key={meeting.id} className="p-4 bg-slate-900/60 border border-white/5 rounded-2xl space-y-2.5">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="text-sm font-bold text-white">{meeting.title}</h4>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400">{meeting.agenda}</p>
                        </div>
                        <span className="text-[9px] bg-purple-500/10 text-purple-400 border border-purple-500/25 px-2 py-0.5 rounded font-bold uppercase">
                          {meeting.platform}
                        </span>
                      </div>

                      <div className="flex justify-between items-center text-[10px] text-slate-500 pt-2 border-t border-white/5">
                        <span>Time: <strong className="text-zinc-600 dark:text-zinc-400">{new Date(meeting.meetingTime).toLocaleString()}</strong></span>
                        <a href={meeting.link} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline font-bold">
                          Join Meeting 🔗
                        </a>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </GlassCard>

            <GlassCard className="space-y-4">
              <h3 className="text-sm font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest border-b border-white/5 pb-2">Schedule Meeting</h3>
              <form onSubmit={handleCreateMeeting} className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-500 mb-1">MEETING TITLE *</label>
                  <input
                    type="text"
                    required
                    value={meetingForm.title}
                    onChange={(e) => setMeetingForm({ ...meetingForm, title: e.target.value })}
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-xl px-3 py-2 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-500 transition-colors"
                    placeholder="e.g. Engineering Weekly Sync"
                  />
                </div>

                <div>
                  <label className="block text-slate-500 mb-1">AGENDA</label>
                  <textarea
                    rows={3}
                    value={meetingForm.agenda}
                    onChange={(e) => setMeetingForm({ ...meetingForm, agenda: e.target.value })}
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-xl px-3 py-2 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-500 transition-colors"
                    placeholder="State topics to be reviewed..."
                  />
                </div>

                <div>
                  <label className="block text-slate-500 mb-1">DATE & TIME *</label>
                  <input
                    type="datetime-local"
                    required
                    value={meetingForm.meetingTime}
                    onChange={(e) => setMeetingForm({ ...meetingForm, meetingTime: e.target.value })}
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-xl px-3 py-2 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-slate-500 mb-1">MEETING LINK *</label>
                  <input
                    type="url"
                    required
                    value={meetingForm.link}
                    onChange={(e) => setMeetingForm({ ...meetingForm, link: e.target.value })}
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-xl px-3 py-2 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-500 transition-colors"
                    placeholder="e.g. https://meet.google.com/..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all shadow-md mt-2"
                >
                  Schedule Sprints
                </button>
              </form>
            </GlassCard>
          </div>
        )}

        {/* 7. LEAVE REQUESTS VIEW */}
        {tab === 'leaves' && (
          <GlassCard className="space-y-4">
            <h2 className="text-lg font-bold flex items-center space-x-2 text-blue-400 border-b border-white/5 pb-2">
              <FileText size={20} />
              <span>Leave Approval Queue</span>
            </h2>

            {leavesList.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-16">No leave requests logged in system history.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                {leavesList.map((leave) => (
                  <div key={leave.id} className="p-5 bg-slate-900/60 border border-white/5 rounded-3xl space-y-3.5 shadow-xl">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-sm font-bold text-white">
                          {leave.user.firstName} {leave.user.lastName} ({leave.user.internProfile?.internId || 'No ID'})
                        </h4>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                          Duration: {new Date(leave.startDate).toLocaleDateString()} to {new Date(leave.endDate).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-purple-400 font-bold uppercase mt-1">Reason: {leave.reason}</p>
                      </div>

                      <span className={`text-[9px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                        leave.status === 'APPROVED' ? 'bg-green-500/10 text-green-400 border border-green-500/25' :
                        leave.status === 'REJECTED' ? 'bg-red-500/10 text-red-400 border border-red-500/25' :
                        'bg-amber-500/10 text-amber-400 border border-amber-500/25'
                      }`}>
                        {leave.status}
                      </span>
                    </div>

                    <p className="text-zinc-600 dark:text-zinc-400 text-xs leading-normal bg-zinc-100 dark:bg-zinc-950/40 p-3 rounded-xl border border-white/5 italic">
                      "{leave.description}"
                    </p>

                    {leave.status === 'PENDING' && (
                      <div className="flex space-x-2 pt-2 border-t border-white/5">
                        <button
                          onClick={() => handleReviewLeave(leave.id, 'APPROVED')}
                          disabled={submitting}
                          className="flex-grow py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors shadow-md"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleReviewLeave(leave.id, 'REJECTED')}
                          disabled={submitting}
                          className="flex-grow py-2 rounded-xl bg-red-600 hover:bg-red-750 text-white font-bold text-xs transition-colors shadow-md"
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
        )}

        {/* 8. CERTIFICATES VIEW */}
        {tab === 'certificates' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <GlassCard className="lg:col-span-2 space-y-4">
              <h2 className="text-lg font-bold flex items-center space-x-2 text-blue-400 border-b border-white/5 pb-2">
                <Award size={20} />
                <span>Issued Certificates Log</span>
              </h2>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-white/5 text-slate-500 uppercase font-semibold">
                      <th className="py-2.5">Intern</th>
                      <th className="py-2.5">Type</th>
                      <th className="py-2.5">Serial Number</th>
                      <th className="py-2.5">Issued Date</th>
                      <th className="py-2.5 text-right">PDF File</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-zinc-600 dark:text-zinc-400">
                    {usersList.flatMap(u => u.certificates || []).length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center py-16 text-slate-500">No certificates issued yet.</td>
                      </tr>
                    ) : (
                      usersList.flatMap(u => (u.certificates || []).map((c: any) => ({ ...c, user: u }))).map((cert: any) => (
                        <tr key={cert.id}>
                          <td className="py-3.5 font-bold text-white">{cert.user.firstName} {cert.user.lastName}</td>
                          <td className="py-3.5 font-semibold text-purple-400 uppercase tracking-wider">{cert.certificateType}</td>
                          <td className="py-3.5 font-mono text-amber-400">{cert.serialNumber}</td>
                          <td className="py-3.5 text-zinc-500">{new Date(cert.issuedAt).toLocaleDateString()}</td>
                          <td className="py-3.5 text-right">
                            <a href={cert.pdfUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline font-bold">
                              Open Certificate PDF
                            </a>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </GlassCard>

            <GlassCard className="space-y-4">
              <h3 className="text-sm font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest border-b border-white/5 pb-2">Generate Certificate</h3>
              <form onSubmit={handleGenerateCertificate} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-500 mb-1">SELECT ACTIVE INTERN *</label>
                  <select
                    value={certificateForm.userId}
                    onChange={(e) => setCertificateForm({ ...certificateForm, userId: e.target.value })}
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-xl px-3 py-2 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-500 transition-colors"
                  >
                    <option value="">Select Intern...</option>
                    {interns.map(i => <option key={i.id} value={i.id}>{i.firstName} {i.lastName}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-500 mb-1">CERTIFICATE TYPE *</label>
                  <select
                    value={certificateForm.certificateType}
                    onChange={(e) => setCertificateForm({ ...certificateForm, certificateType: e.target.value })}
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-xl px-3 py-2 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-500 transition-colors"
                  >
                    <option value="COMPLETION">Completion Certificate</option>
                    <option value="EXPERIENCE">Experience Letter</option>
                    <option value="RECOMMENDATION">Letter of Recommendation</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all shadow-md"
                >
                  Generate & Download Certificate
                </button>
              </form>
            </GlassCard>
          </div>
        )}
      </main>

      {/* AI Sprint Advisor Modal */}
      <AnimatePresence>
        {aiAdviceModalOpen && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-xs z-50 p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-2xl rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 bg-white dark:bg-zinc-900 shadow-2xl space-y-4 text-zinc-900 dark:text-zinc-100 max-h-[85vh] flex flex-col"
            >
              <div className="flex justify-between items-center border-b border-zinc-200 dark:border-zinc-800 pb-3">
                <div className="flex items-center space-x-2 text-blue-500">
                  <span className="text-xl">✨</span>
                  <h3 className="text-base font-bold">Gemini AI Project Sprint Advisor</h3>
                </div>
                <button
                  onClick={() => setAiAdviceModalOpen(false)}
                  className="text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 font-bold"
                >
                  Close
                </button>
              </div>

              <div className="flex-grow overflow-y-auto pr-1 text-xs leading-relaxed space-y-2.5 whitespace-pre-wrap">
                {aiAdviceLoading ? (
                  <div className="flex flex-col items-center justify-center py-12 space-y-3">
                    <div className="w-8 h-8 rounded-full border-4 border-zinc-200 dark:border-zinc-800 border-t-blue-500 animate-spin"></div>
                    <p className="text-zinc-500 text-[11px]">Consulting Gemini AI Sprint Advisor...</p>
                  </div>
                ) : (
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    {aiAdviceText}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
