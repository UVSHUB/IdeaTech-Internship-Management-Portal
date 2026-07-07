"use client";

import React, { Suspense, useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useSearchParams } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import GlassCard from '@/components/GlassCard';
import { motion } from 'framer-motion';
import { 
  Award, Zap, Calendar, AlertTriangle, MessageSquare, 
  Send, CheckCircle, Clock, MapPin, Code, Loader2, Play, FolderGit2
} from 'lucide-react';

export default function InternDashboard() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center bg-slate-900 text-slate-100">
        <div className="text-center space-y-3">
          <Loader2 className="w-10 h-10 text-blue-500 animate-spin mx-auto" />
          <p className="text-xs text-zinc-500 dark:text-zinc-400">Loading Intern Workspace...</p>
        </div>
      </div>
    }>
      <InternDashboardInner />
    </Suspense>
  );
}

function InternDashboardInner() {
  const { user, token, refreshUser } = useAuth();
  const searchParams = useSearchParams();
  const tab = searchParams?.get('tab') ?? undefined; // undefined (Overview), 'attendance', 'reports', 'logbook', 'tasks', 'leaves', 'certificates'

  // Metrics loading
  const [stats, setStats] = useState<any>(null);
  const [tabLoading, setTabLoading] = useState(false);

  // Tab-Specific Lists
  const [attendanceHistory, setAttendanceHistory] = useState<any[]>([]);
  const [reportsHistory, setReportsHistory] = useState<any[]>([]);
  const [logbookHistory, setLogbookHistory] = useState<any[]>([]);
  const [tasksList, setTasksList] = useState<any[]>([]);
  const [leavesList, setLeavesList] = useState<any[]>([]);
  const [certificatesList, setCertificatesList] = useState<any[]>([]);
  const [meetingsList, setMeetingsList] = useState<any[]>([]);
  const [commits, setCommits] = useState<any[]>([]);
  const [scorecards, setScorecards] = useState<any[]>([]);
  const [workingHours, setWorkingHours] = useState<any[]>([]);
  const [hoursPlanner, setHoursPlanner] = useState<Record<string, { startTime: string, endTime: string }>>({
    Monday: { startTime: '09:00', endTime: '17:00' },
    Tuesday: { startTime: '09:00', endTime: '17:00' },
    Wednesday: { startTime: '09:00', endTime: '17:00' },
    Thursday: { startTime: '09:00', endTime: '17:00' },
    Friday: { startTime: '09:00', endTime: '17:00' },
  });
  const [hoursPlannerMsg, setHoursPlannerMsg] = useState('');

  // Clock state
  const [checkInTime, setCheckInTime] = useState<string | null>(null);
  const [checkOutTime, setCheckOutTime] = useState<string | null>(null);
  const [attendanceStatus, setAttendanceStatus] = useState('Not Checked In');

  // Daily Report Form State
  const [todayTasks, setTodayTasks] = useState('');
  const [completedWork, setCompletedWork] = useState('');
  const [problemsFaced, setProblemsFaced] = useState('');
  const [hoursWorked, setHoursWorked] = useState('8');
  const [gitLink, setGitLink] = useState('');
  const [commitLink, setCommitLink] = useState('');
  const [reportMsg, setReportMsg] = useState('');

  // Logbook Form State
  const [activities, setActivities] = useState('');
  const [learning, setLearning] = useState('');
  const [skillsLearned, setSkillsLearned] = useState('');
  const [challenges, setChallenges] = useState('');
  const [solutions, setSolutions] = useState('');
  const [logbookMsg, setLogbookMsg] = useState('');

  // Leave Form State
  const [leaveForm, setLeaveForm] = useState({ reason: 'PERSONAL', startDate: '', endDate: '', description: '' });
  const [leaveMsg, setLeaveMsg] = useState('');

  // Chatbot State
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<Array<{ sender: 'user' | 'bot'; text: string }>>([
    { sender: 'bot', text: 'Hello! I am ITA, your IdeaTech Assistant. How can I help you today with your WFH internship?' }
  ]);
  const [chatLoading, setChatLoading] = useState(false);

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (token) {
      fetchBaseData();
    }
  }, [token]);

  useEffect(() => {
    fetchTabSpecificData();
  }, [tab, token]);

  const fetchBaseData = async () => {
    if (!token) return;
    try {
      // 1. Fetch main metrics & warnings
      const res = await fetch('/api/analytics/intern', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.ok) {
        setStats(await res.json());
      }

      // 2. Fetch attendance history & check-in state
      const attRes = await fetch('/api/attendance/my', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (attRes.ok) {
        const attData = await attRes.json();
        setAttendanceHistory(attData.history || []);
        
        // Find today's clock in/out status
        const today = new Date().toDateString();
        const todayRecord = (attData.history || []).find((h: any) => new Date(h.date).toDateString() === today);
        if (todayRecord) {
          setCheckInTime(new Date(todayRecord.checkIn).toLocaleTimeString());
          if (todayRecord.checkOut) {
            setCheckOutTime(new Date(todayRecord.checkOut).toLocaleTimeString());
            setAttendanceStatus('Checked Out');
          } else {
            setAttendanceStatus('Checked In');
            setCheckOutTime(null);
          }
        } else {
          setCheckInTime(null);
          setCheckOutTime(null);
          setAttendanceStatus('Not Checked In');
        }
      }

      // 3. Fetch scheduled sprint meetings
      const meetRes = await fetch('/api/meetings', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (meetRes.ok) {
        setMeetingsList(await meetRes.json());
      }

      // 4. Fetch GitHub commits
      const commitRes = await fetch('/api/github/commits', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (commitRes.ok) {
        setCommits(await commitRes.json());
      }

      // 5. Fetch Weekly AI Scorecards
      const scRes = await fetch('/api/weekly-scorecard/my', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (scRes.ok) {
        setScorecards(await scRes.json());
      }

      // 6. Fetch Working Hours Plan
      const whRes = await fetch('/api/working-hours/plan', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (whRes.ok) {
        const whData = await whRes.json();
        setWorkingHours(whData);
        // Map workingHours to form state
        if (whData.length > 0) {
          const mapped: any = { ...hoursPlanner };
          whData.forEach((w: any) => {
            mapped[w.dayOfWeek] = { startTime: w.startTime, endTime: w.endTime };
          });
          setHoursPlanner(mapped);
        }
      }
    } catch (err) {
      console.error('Error loading base intern stats:', err);
    }
  };

  const handleSaveHoursPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    setHoursPlannerMsg('');
    try {
      const plans = Object.entries(hoursPlanner).map(([dayOfWeek, times]) => ({
        dayOfWeek,
        startTime: times.startTime,
        endTime: times.endTime,
      }));
      const res = await fetch('/api/working-hours/plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ plans }),
      });
      if (res.ok) {
        setHoursPlannerMsg('✅ Flexible hours plan saved successfully!');
        const whRes = await fetch('/api/working-hours/plan', {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (whRes.ok) setWorkingHours(await whRes.json());
      } else {
        setHoursPlannerMsg('❌ Failed to save working hours plan.');
      }
    } catch {
      setHoursPlannerMsg('❌ Network error.');
    }
  };

  const handleJoinMeeting = async (meetingId: string, meetLink: string) => {
    try {
      const res = await fetch(`/api/meetings/join/${meetingId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (res.ok) {
        window.open(meetLink, '_blank');
        fetchBaseData();
      } else {
        const data = await res.json();
        alert(data.message || 'Failed to log meeting attendance.');
        window.open(meetLink, '_blank');
      }
    } catch {
      window.open(meetLink, '_blank');
    }
  };

  const fetchTabSpecificData = async () => {
    if (!token) return;
    setTabLoading(true);
    try {
      // Tab-Specific Fetches
      if (tab === 'reports') {
        const rRes = await fetch('/api/reports/my', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (rRes.ok) setReportsHistory(await rRes.json());
      } else if (tab === 'logbook') {
        const lRes = await fetch('/api/logbook/my', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (lRes.ok) setLogbookHistory(await lRes.json());
      } else if (tab === 'tasks') {
        const tRes = await fetch('/api/tasks', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (tRes.ok) {
          const allTasks = await tRes.json();
          // Filter tasks assigned to this user
          setTasksList(allTasks.filter((t: any) => t.assigneeId === user?.id));
        }
      } else if (tab === 'leaves') {
        const lvRes = await fetch('/api/leaves/my', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (lvRes.ok) setLeavesList(await lvRes.json());
      } else if (tab === 'certificates') {
        const cRes = await fetch('/api/certificates/my', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (cRes.ok) setCertificatesList(await cRes.json());
      }
    } catch (error) {
      console.error("Error loading tab data:", error);
    } finally {
      setTabLoading(false);
    }
  };

  const fetchInternData = async () => {
    await Promise.all([fetchBaseData(), fetchTabSpecificData()]);
  };

  // Clock In
  const handleCheckIn = async () => {
    setSubmitting(true);
    try {
      const res = await fetch('/api/attendance/checkin', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        alert('Clocked in successfully! Have a great productive day.');
        fetchInternData();
        refreshUser();
      } else {
        alert(data.message || 'Clock-in failed.');
      }
    } catch {
      alert('Network error.');
    } finally {
      setSubmitting(false);
    }
  };

  // Clock Out
  const handleCheckOut = async () => {
    setSubmitting(true);
    try {
      const res = await fetch('/api/attendance/checkout', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        alert('Clocked out successfully! Rest well.');
        fetchInternData();
        refreshUser();
      } else {
        alert(data.message || 'Clock-out failed.');
      }
    } catch {
      alert('Network error.');
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Daily Report
  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setReportMsg('Submitting report...');
    try {
      const res = await fetch('/api/reports/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          todayTasks,
          completedWork,
          problemsFaced,
          hoursWorked: parseFloat(hoursWorked),
          githubLink: gitLink || undefined,
          commitLink: commitLink || undefined,
        })
      });
      const data = await res.json();
      if (res.ok) {
        setReportMsg('Daily report submitted successfully! (+15 XP)');
        setTodayTasks('');
        setCompletedWork('');
        setProblemsFaced('');
        setGitLink('');
        setCommitLink('');
        fetchInternData();
        refreshUser();
      } else {
        setReportMsg(data.message || 'Submission failed.');
      }
    } catch {
      setReportMsg('Submission error.');
    }
  };

  // Submit Logbook
  const handleLogbookSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLogbookMsg('Logging entry...');
    try {
      const res = await fetch('/api/logbook/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(activitiesFormPayload())
      });
      const data = await res.json();
      if (res.ok) {
        setLogbookMsg('Logbook insight registered! (+15 XP)');
        setActivities('');
        setLearning('');
        setSkillsLearned('');
        setChallenges('');
        setSolutions('');
        fetchInternData();
        refreshUser();
      } else {
        setLogbookMsg(data.message || 'Submission failed.');
      }
    } catch {
      setLogbookMsg('Submission error.');
    }
  };

  const activitiesFormPayload = () => ({
    activities,
    learning,
    skillsLearned,
    challenges,
    solutions
  });

  // Submit Leave Request
  const handleLeaveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaveForm.startDate || !leaveForm.endDate || !leaveForm.description) {
      alert('Please fill out all fields.');
      return;
    }
    setLeaveMsg('Submitting leave request...');
    try {
      const res = await fetch('/api/leaves/apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(leaveForm)
      });
      const data = await res.json();
      if (res.ok) {
        setLeaveMsg('Leave request submitted. Awaiting HR review.');
        setLeaveForm({ reason: 'PERSONAL', startDate: '', endDate: '', description: '' });
        fetchInternData();
      } else {
        setLeaveMsg(data.message || 'Application failed.');
      }
    } catch {
      setLeaveMsg('Application error.');
    }
  };

  // Task Status Update
  const handleUpdateTaskStatus = async (taskId: string, newStatus: 'WORKING' | 'COMPLETED') => {
    try {
      const res = await fetch(`/api/tasks/update/${taskId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        alert(`Task marked as ${newStatus.toLowerCase()}!`);
        fetchInternData();
      } else {
        alert('Failed to update task.');
      }
    } catch {
      alert('Network error.');
    }
  };

  // Chatbot Send Message
  const handleChatSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;

    const userText = chatMessage;
    setChatHistory(prev => [...prev, { sender: 'user', text: userText }]);
    setChatMessage('');
    setChatLoading(true);

    try {
      const res = await fetch('/api/chatbot/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ message: userText })
      });
      const data = await res.json();
      if (res.ok) {
        setChatHistory(prev => [...prev, { sender: 'bot', text: data.reply }]);
      } else {
        setChatHistory(prev => [...prev, { sender: 'bot', text: 'Support agent is currently offline.' }]);
      }
    } catch {
      setChatHistory(prev => [...prev, { sender: 'bot', text: 'Error contacting AI agent.' }]);
    } finally {
      setChatLoading(false);
    }
  };

  if (!stats) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-900 text-slate-100">
        <div className="text-center space-y-3">
          <Loader2 className="w-10 h-10 text-blue-500 animate-spin mx-auto" />
          <p className="text-xs text-zinc-500 dark:text-zinc-400">Loading Intern Workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 flex">
      <Sidebar />
      
      <main className="flex-1 lg:ml-64 p-8 pt-20 lg:pt-8 space-y-6 overflow-y-auto max-h-screen">
        {/* Banner Welcome */}
        <div className="flex justify-between items-center bg-theme-gradient p-8 rounded-3xl shadow-xl shadow-zinc-500/5">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white">Welcome, {user?.firstName}!</h1>
            <p className="text-sm text-zinc-300 mt-1">
              Intern ID: <strong className="text-white">{user?.internProfile?.internId || 'Awaiting ID'}</strong> | Department: {user?.internProfile?.department?.name}
            </p>
          </div>
          <div className="flex items-center space-x-3">
            {tabLoading && <Loader2 className="w-5 h-5 text-white animate-spin" />}
            <div className="hidden md:flex items-center space-x-3 bg-white/10 px-5 py-3 rounded-2xl border border-white/10 backdrop-blur-sm">
              <Calendar size={18} />
              <span className="text-sm font-semibold text-white">{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}</span>
            </div>
          </div>
        </div>

        {/* Active Meeting Popup Banner */}
        {(() => {
          const now = new Date();
          const activeMeeting = meetingsList?.find((m: any) => {
            const mTime = new Date(m.meetingTime);
            const diffMinutes = (mTime.getTime() - now.getTime()) / (60 * 1000);
            // active if scheduled starts in next 30 mins or started in last 90 mins
            return diffMinutes >= -90 && diffMinutes <= 30;
          });

          if (!activeMeeting) return null;

          const hasAttended = activeMeeting.myAttendance?.joinedAt;

          return (
            <div className="bg-zinc-900 border border-zinc-700 p-5 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-white shadow-lg animate-pulse">
              <div className="space-y-1">
                <span className="text-[10px] bg-red-600 text-white font-bold uppercase px-2 py-0.5 rounded-full">🔴 Live Sprint Meeting</span>
                <h4 className="text-sm font-bold">{activeMeeting.title}</h4>
                <p className="text-xs text-zinc-400">{activeMeeting.agenda || 'No agenda supplied.'}</p>
                <p className="text-[10px] text-zinc-500">Scheduled: {new Date(activeMeeting.meetingTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
              </div>

              <div>
                {hasAttended ? (
                  <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 px-4 py-2 rounded-xl font-bold block text-center">
                    ✓ Attendance Logged
                  </span>
                ) : (
                  <button
                    onClick={() => handleJoinMeeting(activeMeeting.id, activeMeeting.link)}
                    className="px-5 py-2.5 bg-white text-zinc-950 hover:bg-zinc-200 transition-colors font-bold text-xs rounded-xl shadow-md flex items-center space-x-1.5"
                  >
                    <span>✨ Join Google Meet & Clock Attendance</span>
                  </button>
                )}
              </div>
            </div>
          );
        })()}

        {/* 1. DEFAULT OVERVIEW VIEW */}
        {!tab && (
          <>
            {/* Stats Row Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <GlassCard className="flex items-center space-x-4 border-l-4 border-l-zinc-900 dark:border-l-zinc-100">
                <div className="p-3 bg-zinc-500/10 text-zinc-600 dark:text-zinc-300 rounded-2xl"><Award size={22} /></div>
                <div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 font-semibold uppercase">Current Level</p>
                  <h3 className="text-2xl font-bold">Level {stats.level}</h3>
                </div>
              </GlassCard>

              <GlassCard className="flex items-center space-x-4 border-l-4 border-l-zinc-700 dark:border-l-zinc-300">
                <div className="p-3 bg-zinc-500/10 text-zinc-600 dark:text-zinc-300 rounded-2xl"><Zap size={22} /></div>
                <div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 font-semibold uppercase">Active Streak</p>
                  <h3 className="text-2xl font-bold">{stats.streak} Days</h3>
                </div>
              </GlassCard>

              <GlassCard className="flex items-center space-x-4 border-l-4 border-l-zinc-500 dark:border-l-zinc-500">
                <div className="p-3 bg-zinc-500/10 text-zinc-600 dark:text-zinc-300 rounded-2xl"><CheckCircle size={22} /></div>
                <div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 font-semibold uppercase">Completion Progress</p>
                  <h3 className="text-2xl font-bold">{stats.completionProgress}%</h3>
                </div>
              </GlassCard>

              <GlassCard className="flex items-center space-x-4 border-l-4 border-l-zinc-300 dark:border-l-zinc-700">
                <div className="p-3 bg-zinc-500/10 text-zinc-600 dark:text-zinc-300 rounded-2xl"><Clock size={22} /></div>
                <div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 font-semibold uppercase">Remaining Days</p>
                  <h3 className="text-2xl font-bold">{stats.remainingDays} Days</h3>
                </div>
              </GlassCard>
            </div>

            {/* Middle Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column: Quick CheckIn & Warning Logs */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* Check In Action Card */}
                <GlassCard>
                  <h2 className="text-lg font-bold mb-4 flex items-center space-x-2">
                    <MapPin size={18} className="text-blue-400" />
                    <span>Work From Home Attendance Status</span>
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                    <div className="space-y-1.5 text-xs text-zinc-600 dark:text-zinc-400">
                      <p>Status: <span className="text-blue-400 font-bold">{attendanceStatus}</span></p>
                      {checkInTime && <p>Check-In time: {checkInTime}</p>}
                      {checkOutTime && <p>Check-Out time: {checkOutTime}</p>}
                      <p className="text-[10px] text-zinc-500 italic mt-2">
                        💡 WFH Flexi-Hours: Check in when starting your self-study/development work and check out when finished. Attendance must be logged daily.
                      </p>
                    </div>
                    <div className="flex space-x-3">
                      <button
                        onClick={handleCheckIn}
                        disabled={submitting || attendanceStatus !== 'Not Checked In'}
                        className={`flex-grow py-2.5 rounded-xl font-bold text-xs ${
                          attendanceStatus === 'Not Checked In' ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        }`}
                      >
                        Clock In
                      </button>
                      <button
                        onClick={handleCheckOut}
                        disabled={submitting || attendanceStatus !== 'Checked In'}
                        className={`flex-grow py-2.5 rounded-xl font-bold text-xs ${
                          attendanceStatus === 'Checked In' ? 'bg-purple-600 hover:bg-purple-700 text-white' : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        }`}
                      >
                        Clock Out
                      </button>
                    </div>
                  </div>
                </GlassCard>

                {/* Warning alerts list */}
                <GlassCard>
                  <h3 className="text-sm font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-3 flex items-center space-x-1.5">
                    <AlertTriangle size={16} className="text-red-400" />
                    <span>System Warning Logs ({stats.warnings.length})</span>
                  </h3>
                  {stats.warnings.length === 0 ? (
                    <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs rounded-2xl flex items-center space-x-2">
                      <CheckCircle size={15} />
                      <span>Congratulations! Your profile is clean and has zero warning escalations.</span>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {stats.warnings.map((w: any, i: number) => (
                        <div key={i} className="p-3.5 bg-red-950/20 border border-red-500/20 rounded-2xl text-xs space-y-1">
                          <div className="flex justify-between font-bold text-red-400">
                            <span>{w.type}</span>
                            <span>{new Date(w.date).toLocaleDateString()}</span>
                          </div>
                          <p className="text-zinc-500 dark:text-zinc-400 leading-normal">{w.reason}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </GlassCard>

                {/* GitHub Commit Activity Feed */}
                <GlassCard>
                  <h3 className="text-sm font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-3 flex items-center space-x-1.5">
                    <FolderGit2 size={16} className="text-blue-400" />
                    <span>Real-time GitHub Commit Feed ({commits.length})</span>
                  </h3>
                  {commits.length === 0 ? (
                    <div className="p-4 bg-zinc-950/40 border border-zinc-800 rounded-xl text-center text-xs text-zinc-500 italic">
                      No recent commits fetched. Make sure your GitHub username is set on your profile.
                    </div>
                  ) : (
                    <div className="space-y-3.5 max-h-[300px] overflow-y-auto pr-1">
                      {commits.map((commit: any, index: number) => (
                        <div key={commit.id || index} className="p-3 bg-zinc-950/20 border border-white/5 rounded-xl text-xs flex justify-between items-start gap-4">
                          <div className="space-y-1">
                            <p className="font-semibold text-zinc-200">{commit.message}</p>
                            <div className="flex items-center space-x-2 text-[10px] text-zinc-500">
                              <span className="font-mono bg-zinc-800 text-zinc-400 px-1 py-0.2 rounded">{commit.sha.substring(0, 7)}</span>
                              <span>•</span>
                              <span>{new Date(commit.date).toLocaleString()}</span>
                            </div>
                          </div>
                          <a 
                            href={commit.htmlUrl} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded font-bold text-[10px] border border-white/5 whitespace-nowrap animate-pulse"
                          >
                            View Commit 🔗
                          </a>
                        </div>
                      ))}
                    </div>
                  )}
                </GlassCard>
              </div>

              {/* Right Column: Gamification progress & Assistant */}
              <div className="space-y-6">
                <GlassCard className="text-center">
                  <h3 className="text-sm font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-4">XP Level Progression</h3>
                  <div className="w-32 h-32 rounded-full border-4 border-slate-800 border-t-blue-500 border-r-purple-500 mx-auto flex items-center justify-center mb-4">
                    <div>
                      <span className="text-3xl font-extrabold text-zinc-900 dark:text-white">{stats.xp}</span>
                      <span className="text-[10px] text-zinc-500 dark:text-zinc-400 block font-semibold">XP POINTS</span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full mb-1.5 overflow-hidden">
                    <div className="bg-theme-gradient h-full rounded-full" style={{ width: `${stats.xpProgress}%` }} />
                  </div>
                  <div className="flex justify-between text-[10px] text-zinc-500">
                    <span>Level {stats.level}</span>
                    <span>{stats.xpProgress}% to Level {stats.level + 1}</span>
                  </div>

                  {/* Badges Feed */}
                  {stats.badges && stats.badges.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-white/5 space-y-2">
                      <h4 className="text-[10px] text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-wider text-left">Earned Profile Badges ({stats.badges.length})</h4>
                      <div className="flex flex-wrap gap-1.5 justify-start">
                        {stats.badges.map((badge: any, index: number) => (
                          <span 
                            key={index} 
                            title={badge.desc}
                            className="px-2 py-0.5 bg-zinc-800 text-[10px] text-zinc-400 rounded border border-white/5 font-semibold"
                          >
                            {badge.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </GlassCard>

                {/* AI Assistant chat panel */}
                <GlassCard className="flex flex-col h-[280px]">
                  <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
                    <MessageSquare size={14} className="text-blue-400" />
                    <span>IdeaTech Assistant</span>
                  </h3>
                  <div className="flex-grow bg-zinc-100 dark:bg-zinc-950/40 border border-white/5 rounded-xl p-3 overflow-y-auto space-y-2 mb-2 max-h-[170px]">
                    {chatHistory.map((chat, i) => (
                      <div key={i} className={`flex ${chat.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`p-2 rounded-xl text-[11px] max-w-[85%] ${chat.sender === 'user' ? 'bg-blue-600 text-white' : 'bg-slate-900 text-slate-200 border border-white/5'}`}>
                          {chat.text}
                        </div>
                      </div>
                    ))}
                    {chatLoading && <div className="text-[10px] text-slate-500 animate-pulse">ITA is thinking...</div>}
                  </div>
                  <form onSubmit={handleChatSend} className="flex space-x-1.5">
                    <input
                      type="text"
                      value={chatMessage}
                      onChange={(e) => setChatMessage(e.target.value)}
                      className="flex-grow bg-slate-900 border border-white/10 rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:border-blue-500"
                      placeholder="Ask ITA a question..."
                    />
                    <button type="submit" className="p-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white"><Send size={12} /></button>
                  </form>
                </GlassCard>
              </div>
            </div>
          </>
        )}

        {/* 2. ATTENDANCE HISTORICAL REGISTRY */}
        {tab === 'attendance' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <GlassCard className="lg:col-span-2 space-y-4">
              <h2 className="text-base font-bold flex items-center space-x-2 text-blue-400 border-b border-white/5 pb-2">
                <Clock size={18} />
                <span>My Attendance History</span>
              </h2>
              <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-white/5 text-slate-500 uppercase font-semibold">
                      <th className="py-2.5">Date</th>
                      <th className="py-2.5">Check In</th>
                      <th className="py-2.5">Check Out</th>
                      <th className="py-2.5">Hours</th>
                      <th className="py-2.5 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-zinc-600 dark:text-zinc-400">
                    {attendanceHistory.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center py-12 text-zinc-500">No check-in logs submitted.</td>
                      </tr>
                    ) : (
                      attendanceHistory.map((h: any) => (
                        <tr key={h.id}>
                          <td className="py-3 font-semibold">{new Date(h.date).toLocaleDateString()}</td>
                          <td className="py-3 text-zinc-500 dark:text-zinc-400">{new Date(h.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                          <td className="py-3 text-zinc-500">
                            {h.checkOut ? new Date(h.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Logged Check-In Only'}
                          </td>
                          <td className="py-3 font-mono">{h.workingHours ? `${h.workingHours.toFixed(2)} hrs` : '-'}</td>
                          <td className="py-3 text-center">
                            <span className={`px-2 py-0.5 rounded font-bold text-[9px] ${
                              h.status === 'PRESENT' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                            }`}>
                              {h.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </GlassCard>

            <GlassCard className="space-y-4 h-fit">
              <h3 className="text-sm font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest border-b border-white/5 pb-2">Record WFH Shifts</h3>
              <div className="space-y-4 text-xs">
                <div className="p-3 bg-slate-900 border border-white/5 rounded-2xl text-zinc-700 dark:text-zinc-300">
                  <p className="font-semibold text-blue-400">🕒 Shifts Rules Reminder:</p>
                  <ul className="list-disc pl-4 space-y-1 mt-2 text-zinc-500 dark:text-zinc-400">
                    <li>Work-from-home shifts are flexible: clock in when you start and out when done.</li>
                    <li>Both Clock In and Clock Out must be logged daily.</li>
                    <li>Ensure you log shifts every day of your internship.</li>
                  </ul>
                </div>

                <div className="flex flex-col space-y-2">
                  <button
                    onClick={handleCheckIn}
                    disabled={submitting || attendanceStatus !== 'Not Checked In'}
                    className={`w-full py-3 rounded-xl font-bold ${
                      attendanceStatus === 'Not Checked In' ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-white/5'
                    }`}
                  >
                    Clock In
                  </button>
                  <button
                    onClick={handleCheckOut}
                    disabled={submitting || attendanceStatus !== 'Checked In'}
                    className={`w-full py-3 rounded-xl font-bold ${
                      attendanceStatus === 'Checked In' ? 'bg-purple-600 hover:bg-purple-700 text-white' : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-white/5'
                    }`}
                  >
                    Clock Out
                  </button>
                </div>
              </div>
            </GlassCard>

            {/* Meeting Attendance Requirement */}
            {(() => {
              const totalMeets = meetingsList.length;
              const attendedMeets = meetingsList.filter((m: any) => m.myAttendance?.joinedAt).length;
              const rate = totalMeets > 0 ? Math.round((attendedMeets / totalMeets) * 100) : 100;
              const isBelowThreshold = rate < 80;

              return (
                <GlassCard className="space-y-3">
                  <h3 className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest border-b border-white/5 pb-2">Sprint Meetings Attendance</h3>
                  <div className="flex justify-between items-center pt-1">
                    <span className="text-xs text-zinc-500">Attendance Rate:</span>
                    <span className={`text-base font-bold ${isBelowThreshold ? 'text-red-500' : 'text-emerald-500'}`}>
                      {rate}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-zinc-500">
                    <span>Target Threshold:</span>
                    <span className="font-bold text-zinc-700 dark:text-zinc-300">80% Required</span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-zinc-200 dark:bg-zinc-800 h-2 rounded-full overflow-hidden mt-1">
                    <div 
                      className={`h-full ${isBelowThreshold ? 'bg-red-500' : 'bg-emerald-500'}`}
                      style={{ width: `${Math.min(rate, 100)}%` }}
                    />
                  </div>

                  {isBelowThreshold ? (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-[10px] text-red-400 leading-normal font-semibold">
                      ⚠️ Warning: Your meeting attendance is below the 80% threshold. Please join all scheduled sprint meetings.
                    </div>
                  ) : (
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-[10px] text-emerald-400 leading-normal">
                      ✓ Good Standing: Your meeting attendance meets the portal requirement.
                    </div>
                  )}
                </GlassCard>
              );
            })()}

            {/* Weekly Performance Scorecard */}
            <GlassCard className="space-y-3">
              <h3 className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest border-b border-white/5 pb-2">AI Weekly Performance Scorecards</h3>
              {scorecards.length === 0 ? (
                <p className="text-[10px] text-zinc-500 italic">No scorecards generated yet. Your mentor will generate one soon.</p>
              ) : (
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                  {scorecards.map((sc: any) => (
                    <div key={sc.id} className="p-3 bg-zinc-950/45 border border-white/5 rounded-xl space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] text-zinc-500 font-mono">Week Ending: {new Date(sc.weekEnd).toLocaleDateString()}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          sc.score >= 80 ? 'bg-emerald-500/10 text-emerald-400' :
                          sc.score >= 50 ? 'bg-amber-500/10 text-amber-400' :
                          'bg-red-500/10 text-red-400'
                        }`}>
                          Score: {sc.score}/100
                        </span>
                      </div>
                      <p className="text-[10.5px] text-zinc-600 dark:text-zinc-300 leading-normal"><strong className="text-zinc-400">Feedback:</strong> "{sc.summary}"</p>
                      <p className="text-[10px] text-blue-400 bg-blue-500/5 p-2 rounded-lg leading-normal">💡 <strong className="text-blue-300">Recommendation:</strong> {sc.areasOfImp}</p>
                    </div>
                  ))}
                </div>
              )}
            </GlassCard>

            {/* Flexible WFH Hours Planner */}
            <GlassCard className="space-y-3">
              <h3 className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest border-b border-white/5 pb-2">Flexible WFH Shift Planner</h3>
              {hoursPlannerMsg && (
                <p className={`text-[10px] font-bold ${hoursPlannerMsg.startsWith('✅') ? 'text-emerald-400' : 'text-red-400'}`}>
                  {hoursPlannerMsg}
                </p>
              )}
              <form onSubmit={handleSaveHoursPlan} className="space-y-2 text-[11px]">
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map((day) => (
                  <div key={day} className="flex justify-between items-center gap-2">
                    <span className="font-semibold text-zinc-600 dark:text-zinc-400 w-16">{day}</span>
                    <div className="flex items-center space-x-1">
                      <input
                        type="time"
                        value={hoursPlanner[day]?.startTime || '09:00'}
                        onChange={(e) => setHoursPlanner({
                          ...hoursPlanner,
                          [day]: { ...hoursPlanner[day], startTime: e.target.value }
                        })}
                        className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded px-1.5 py-0.5 text-zinc-900 dark:text-zinc-100 text-[10px]"
                      />
                      <span className="text-zinc-500">-</span>
                      <input
                        type="time"
                        value={hoursPlanner[day]?.endTime || '17:00'}
                        onChange={(e) => setHoursPlanner({
                          ...hoursPlanner,
                          [day]: { ...hoursPlanner[day], endTime: e.target.value }
                        })}
                        className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded px-1.5 py-0.5 text-zinc-900 dark:text-zinc-100 text-[10px]"
                      />
                    </div>
                  </div>
                ))}
                <button
                  type="submit"
                  className="w-full py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] shadow-sm transition-colors mt-2"
                >
                  Save Weekly Shift Plan
                </button>
              </form>
            </GlassCard>

            {/* WFH Hours Analytics Grid */}
            <GlassCard className="space-y-3">
              <h3 className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest border-b border-white/5 pb-2">Shift Analytics (Planned vs. Actual)</h3>
              <div className="space-y-2.5 text-[10.5px]">
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map((day, idx) => {
                  const plan = hoursPlanner[day] || { startTime: '09:00', endTime: '17:00' };
                  const [pStartH, pStartM] = plan.startTime.split(':').map(Number);
                  const [pEndH, pEndM] = plan.endTime.split(':').map(Number);
                  const plannedHours = Math.max(0, (pEndH - pStartH) + (pEndM - pStartM) / 65);

                  // Find attendance record for this day of the current week
                  const today = new Date();
                  const currentDayIndex = today.getDay();
                  const targetDayOffset = (idx + 1) - currentDayIndex;
                  const targetDate = new Date();
                  targetDate.setDate(today.getDate() + targetDayOffset);
                  
                  const record = attendanceHistory.find(h => new Date(h.date).toDateString() === targetDate.toDateString());
                  const actualHours = record?.workingHours || (record ? 8 : 0);

                  return (
                    <div key={day} className="space-y-1">
                      <div className="flex justify-between text-[9.5px]">
                        <span className="font-semibold text-zinc-700 dark:text-zinc-300">{day}</span>
                        <span className="text-zinc-500">Planned: {plannedHours.toFixed(1)}h | Actual: {actualHours.toFixed(1)}h</span>
                      </div>
                      <div className="flex space-x-1.5 items-center">
                        {/* Planned Bar */}
                        <div className="flex-1 bg-zinc-200 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-zinc-500 dark:bg-zinc-500 h-full" style={{ width: `${Math.min(100, (plannedHours / 12) * 100)}%` }} />
                        </div>
                        {/* Actual Bar */}
                        <div className="flex-1 bg-zinc-200 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-blue-500 h-full" style={{ width: `${Math.min(100, (actualHours / 12) * 100)}%` }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </GlassCard>
          </div>
        )}

        {/* 3. DAILY REPORTS TAB */}
        {tab === 'reports' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <GlassCard className="lg:col-span-2 space-y-4">
              <h2 className="text-base font-bold flex items-center space-x-2 text-blue-400 border-b border-white/5 pb-2">
                <Code size={18} />
                <span>My Performance Reports</span>
              </h2>
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {reportsHistory.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-16">No daily reports submitted yet.</p>
                ) : (
                  reportsHistory.map((rep: any) => (
                    <div key={rep.id} className="p-4 bg-slate-900/60 border border-white/5 rounded-2xl space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="text-xs font-bold text-white">{new Date(rep.date).toLocaleDateString()}</h4>
                          <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1 font-semibold">Tasks: {rep.todayTasks}</p>
                          <p className="text-xs text-zinc-600 dark:text-zinc-400">Deliverables: {rep.completedWork}</p>
                        </div>
                        <span className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase ${
                          rep.status === 'APPROVED' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                          rep.status === 'REJECTED' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}>
                          {rep.status}
                        </span>
                      </div>
                      {rep.remarks && <p className="text-[10px] text-amber-400 bg-amber-500/5 p-2 rounded-lg mt-2"><strong>Review Remarks:</strong> "{rep.remarks}"</p>}
                    </div>
                  ))
                )}
              </div>
            </GlassCard>

            <GlassCard className="space-y-4">
              <h3 className="text-sm font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest border-b border-white/5 pb-2">Submit Daily Report</h3>
              {user?.projectMembers?.[0]?.project ? (
                <div className="p-3 mb-3 bg-emerald-50 dark:bg-zinc-950/45 border border-emerald-500/20 rounded-2xl text-[10.5px] text-zinc-600 dark:text-zinc-400 leading-normal">
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 uppercase block mb-1">👥 Group Project: {user.projectMembers[0].project.name}</span>
                  This is a <strong>Group Daily Report</strong>. Only one member of your project group needs to submit this report daily on behalf of the entire group.
                </div>
              ) : (
                <div className="p-3 mb-3 bg-zinc-100 dark:bg-zinc-950/45 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-[10.5px] text-zinc-600 dark:text-zinc-500 leading-normal">
                  <span className="font-bold text-zinc-700 dark:text-zinc-500 uppercase block mb-1">ℹ️ Individual Mode</span>
                  You are not currently assigned to any project group. This report will submit individually.
                </div>
              )}
              {reportMsg && <div className="p-3 mb-2 rounded-xl bg-slate-900 border border-white/5 text-[10px] text-center text-blue-400 font-bold">{reportMsg}</div>}
              <form onSubmit={handleReportSubmit} className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-500 mb-0.5">TODAY'S TASKS *</label>
                  <input
                    type="text"
                    required
                    value={todayTasks}
                    onChange={(e) => setTodayTasks(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-xl px-3 py-2 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-500 transition-colors"
                    placeholder="Short list of work items..."
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-0.5">COMPLETED WORK *</label>
                  <input
                    type="text"
                    required
                    value={completedWork}
                    onChange={(e) => setCompletedWork(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-xl px-3 py-2 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-500 transition-colors"
                    placeholder="Details of deliverables..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-500 mb-0.5">HOURS WORKED *</label>
                    <input
                      type="number"
                      required
                      value={hoursWorked}
                      onChange={(e) => setHoursWorked(e.target.value)}
                      className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-xl px-3 py-2 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 mb-0.5">COMMIT SHA</label>
                    <input
                      type="text"
                      value={commitLink}
                      onChange={(e) => setCommitLink(e.target.value)}
                      className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-xl px-3 py-2 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-500 transition-colors"
                      placeholder="e.g. e50a88f"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-slate-500 mb-0.5">GITHUB REPOSITORY LINK</label>
                  <input
                    type="url"
                    value={gitLink}
                    onChange={(e) => setGitLink(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-xl px-3 py-2 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-500 transition-colors"
                    placeholder="https://github.com/..."
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-0.5">PROBLEMS & BLOCKERS *</label>
                  <textarea
                    required
                    rows={2}
                    value={problemsFaced}
                    onChange={(e) => setProblemsFaced(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-xl px-3 py-2 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-500 transition-colors"
                    placeholder="Write blockers faced or 'None'..."
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all shadow-md mt-2"
                >
                  Submit Report (+15 XP)
                </button>
              </form>
            </GlassCard>
          </div>
        )}

        {/* 4. DIGITAL LOGBOOK TAB */}
        {tab === 'logbook' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <GlassCard className="lg:col-span-2 space-y-4">
              <h2 className="text-base font-bold flex items-center space-x-2 text-blue-400 border-b border-white/5 pb-2">
                <Send size={18} />
                <span>My Academic Logbook History</span>
              </h2>
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {logbookHistory.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-16">No logbook insights recorded yet.</p>
                ) : (
                  logbookHistory.map((l: any) => (
                    <div key={l.id} className="p-4 bg-slate-900/60 border border-white/5 rounded-2xl space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="text-xs font-bold text-white">{new Date(l.date).toLocaleDateString()}</h4>
                          <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1"><strong>Activities:</strong> {l.activities}</p>
                          <p className="text-[11px] text-zinc-600 dark:text-zinc-400"><strong>Learning:</strong> {l.learning}</p>
                          <p className="text-[11px] text-zinc-600 dark:text-zinc-400"><strong>Skills:</strong> {l.skillsLearned}</p>
                        </div>
                        <span className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase ${
                          l.status === 'APPROVED' ? 'bg-green-500/10 text-green-400' : 'bg-amber-500/10 text-amber-400'
                        }`}>
                          {l.status}
                        </span>
                      </div>
                      {l.mentorComments && (
                        <p className="text-[10px] text-blue-400 bg-blue-500/5 p-2 rounded-lg mt-2"><strong>Mentor Comments:</strong> "{l.mentorComments}"</p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </GlassCard>

            <GlassCard className="space-y-4">
              <h3 className="text-sm font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest border-b border-white/5 pb-2">Log Today's Insight</h3>
              <div className="p-3 mb-3 bg-zinc-100 dark:bg-zinc-950/45 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-[10.5px] text-zinc-600 dark:text-zinc-500 leading-normal">
                <span className="font-bold text-zinc-700 dark:text-zinc-400 uppercase block mb-1">📝 Individual Logbook</span>
                This logbook is <strong>individual</strong>. Every intern must submit their own logbook entry daily to record personal study progress and learnings.
              </div>
              {logbookMsg && <div className="p-3 mb-2 rounded-xl bg-slate-900 border border-white/5 text-[10px] text-center text-emerald-400 font-bold">{logbookMsg}</div>}
              <form onSubmit={handleLogbookSubmit} className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-500 mb-0.5">SUMMARY OF ACTIVITIES *</label>
                  <input
                    type="text"
                    required
                    value={activities}
                    onChange={(e) => setActivities(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-xl px-3 py-2 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-500 transition-colors"
                    placeholder="Short summary of work done today..."
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-0.5">LEARNINGS & CONCEPTS GAINED *</label>
                  <textarea
                    required
                    rows={2}
                    value={learning}
                    onChange={(e) => setLearning(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-xl px-3 py-2 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-500 transition-colors"
                    placeholder="Academic concepts or patterns learned..."
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-0.5">CRITICAL SKILLS EXERCISED *</label>
                  <textarea
                    required
                    rows={2}
                    value={skillsLearned}
                    onChange={(e) => setSkillsLearned(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-xl px-3 py-2 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-500 transition-colors"
                    placeholder="Practical skills (e.g. schema mapping)..."
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-0.5">CHALLENGES & OBSTACLES *</label>
                  <textarea
                    required
                    rows={2}
                    value={challenges}
                    onChange={(e) => setChallenges(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-xl px-3 py-2 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-500 transition-colors"
                    placeholder="Impediments or blockers..."
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-0.5">SOLUTIONS IMPLEMENTED *</label>
                  <textarea
                    required
                    rows={2}
                    value={solutions}
                    onChange={(e) => setSolutions(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-xl px-3 py-2 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-500 transition-colors"
                    placeholder="How did you resolve it?"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-all shadow-md mt-2"
                >
                  Log Logbook Entry (+15 XP)
                </button>
              </form>
            </GlassCard>
          </div>
        )}

        {/* 5. TASK BOARD VIEW */}
        {tab === 'tasks' && (
          <GlassCard className="space-y-4">
            <h2 className="text-base font-bold flex items-center space-x-2 text-blue-400 border-b border-white/5 pb-2">
              <Code size={18} />
              <span>Intern Sprint Task Board</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
              {/* Kanban Column: Pending */}
              <div className="p-4 bg-zinc-100 dark:bg-zinc-950/40 border border-white/5 rounded-3xl space-y-3">
                <h3 className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest flex justify-between">
                  <span>To Do</span>
                  <span className="px-1.5 py-0.5 rounded bg-slate-900 text-zinc-500 dark:text-zinc-400 font-bold text-[9px]">{tasksList.filter(t => t.status === 'PENDING').length}</span>
                </h3>
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                  {tasksList.filter(t => t.status === 'PENDING').map(task => (
                    <div key={task.id} className="p-3.5 bg-slate-900 border border-white/5 rounded-2xl space-y-3 shadow-lg">
                      <div>
                        <h4 className="text-xs font-bold text-white">{task.title}</h4>
                        <p className="text-[10px] text-zinc-500 leading-normal mt-1">{task.description}</p>
                      </div>
                      <div className="flex justify-between items-center text-[9px] pt-2 border-t border-white/5">
                        <span className="text-red-400 font-semibold uppercase">{task.priority}</span>
                        <button
                          onClick={() => handleUpdateTaskStatus(task.id, 'WORKING')}
                          className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white font-bold transition-colors"
                        >
                          Start Work
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Kanban Column: Working */}
              <div className="p-4 bg-zinc-100 dark:bg-zinc-950/40 border border-white/5 rounded-3xl space-y-3">
                <h3 className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest flex justify-between">
                  <span>In Progress</span>
                  <span className="px-1.5 py-0.5 rounded bg-slate-900 text-zinc-500 dark:text-zinc-400 font-bold text-[9px]">{tasksList.filter(t => t.status === 'WORKING').length}</span>
                </h3>
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                  {tasksList.filter(t => t.status === 'WORKING').map(task => (
                    <div key={task.id} className="p-3.5 bg-slate-900 border border-white/5 rounded-2xl space-y-3 shadow-lg">
                      <div>
                        <h4 className="text-xs font-bold text-white">{task.title}</h4>
                        <p className="text-[10px] text-zinc-500 leading-normal mt-1">{task.description}</p>
                      </div>
                      <div className="flex justify-between items-center text-[9px] pt-2 border-t border-white/5">
                        <span className="text-amber-400 font-semibold uppercase">{task.priority}</span>
                        <button
                          onClick={() => handleUpdateTaskStatus(task.id, 'COMPLETED')}
                          className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-colors"
                        >
                          Complete Task
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Kanban Column: Completed */}
              <div className="p-4 bg-zinc-100 dark:bg-zinc-950/40 border border-white/5 rounded-3xl space-y-3">
                <h3 className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest flex justify-between">
                  <span>Completed</span>
                  <span className="px-1.5 py-0.5 rounded bg-slate-900 text-zinc-500 dark:text-zinc-400 font-bold text-[9px]">{tasksList.filter(t => t.status === 'COMPLETED').length}</span>
                </h3>
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                  {tasksList.filter(t => t.status === 'COMPLETED').map(task => (
                    <div key={task.id} className="p-3.5 bg-slate-900/40 border border-white/5 rounded-2xl space-y-2 opacity-75">
                      <h4 className="text-xs font-bold text-zinc-700 dark:text-zinc-300 line-through">{task.title}</h4>
                      <p className="text-[10px] text-slate-500">{task.description}</p>
                      <div className="flex justify-between items-center text-[9px] pt-2 border-t border-white/5">
                        <span className="text-slate-500 font-semibold uppercase">{task.priority}</span>
                        <span className="text-emerald-400 font-bold">COMPLETED</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </GlassCard>
        )}

        {/* 6. LEAVE REQUEST MANAGEMENT */}
        {tab === 'leaves' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <GlassCard className="lg:col-span-2 space-y-4">
              <h2 className="text-base font-bold flex items-center space-x-2 text-blue-400 border-b border-white/5 pb-2">
                <AlertTriangle size={18} />
                <span>My Leave Requests</span>
              </h2>
              <div className="space-y-3.5 max-h-[500px] overflow-y-auto pr-1">
                {leavesList.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-16">No leave applications submitted.</p>
                ) : (
                  leavesList.map((leave: any) => (
                    <div key={leave.id} className="p-4 bg-slate-900/60 border border-white/5 rounded-2xl space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="text-xs font-bold text-white uppercase tracking-wider">{leave.reason.replace('_', ' ')} LEAVE</h4>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                            Duration: {new Date(leave.startDate).toLocaleDateString()} to {new Date(leave.endDate).toLocaleDateString()}
                          </p>
                        </div>
                        <span className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase border ${
                          leave.status === 'APPROVED' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                          leave.status === 'REJECTED' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        }`}>
                          {leave.status}
                        </span>
                      </div>
                      <p className="text-zinc-500 dark:text-zinc-400 text-xs italic bg-zinc-100 dark:bg-zinc-950/40 p-2.5 rounded-lg">"{leave.description}"</p>
                    </div>
                  ))
                )}
              </div>
            </GlassCard>

            <GlassCard className="space-y-4 h-fit">
              <h3 className="text-sm font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest border-b border-white/5 pb-2">Apply for Leave</h3>
              {leaveMsg && <div className="p-3 mb-2 rounded-xl bg-slate-900 border border-white/5 text-[10px] text-center text-blue-400 font-bold">{leaveMsg}</div>}
              <form onSubmit={handleLeaveSubmit} className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-500 mb-0.5">LEAVE REASON *</label>
                  <select
                    value={leaveForm.reason}
                    onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-xl px-3 py-2 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-500 transition-colors"
                  >
                    <option value="ONE_DAY">One Day Leave</option>
                    <option value="STUDY">Study Leave</option>
                    <option value="EXAM">University Exam Leave</option>
                    <option value="MEDICAL">Medical Leave</option>
                    <option value="PERSONAL">Personal Reasons</option>
                    <option value="VACATION">Vacation Leave</option>
                    <option value="EMERGENCY">Family Emergency</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-500 mb-0.5">START DATE *</label>
                    <input
                      type="date"
                      required
                      value={leaveForm.startDate}
                      onChange={(e) => setLeaveForm({ ...leaveForm, startDate: e.target.value })}
                      className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-xl px-3 py-2 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 mb-0.5">END DATE *</label>
                    <input
                      type="date"
                      required
                      value={leaveForm.endDate}
                      onChange={(e) => setLeaveForm({ ...leaveForm, endDate: e.target.value })}
                      className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-xl px-3 py-2 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-500 transition-colors"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-slate-500 mb-0.5">DESCRIPTION & RATIONALE *</label>
                  <textarea
                    required
                    rows={4}
                    value={leaveForm.description}
                    onChange={(e) => setLeaveForm({ ...leaveForm, description: e.target.value })}
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-xl px-3 py-2 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-500 transition-colors"
                    placeholder="Provide full description of why leave is requested..."
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all shadow-md mt-2"
                >
                  Apply Leave
                </button>
              </form>
            </GlassCard>
          </div>
        )}

        {/* 7. DIGITAL CERTIFICATES COCKPIT */}
        {tab === 'certificates' && (
          <GlassCard className="space-y-4">
            <h2 className="text-base font-bold flex items-center space-x-2 text-blue-400 border-b border-white/5 pb-2">
              <Award size={18} />
              <span>My Issued Certificates</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              {certificatesList.length === 0 ? (
                <div className="col-span-2 text-center py-16 text-zinc-500 space-y-2">
                  <Award size={36} className="text-slate-600 mx-auto" />
                  <p className="text-xs">No certificates generated yet.</p>
                  <p className="text-[10px] text-slate-500">Your digital certificate is generated by admin/HR upon successful completion of your WFH internship lifecycle.</p>
                </div>
              ) : (
                certificatesList.map((c) => (
                  <div key={c.id} className="p-6 bg-slate-900 border border-white/5 rounded-3xl space-y-4 flex flex-col justify-between shadow-xl">
                    <div className="space-y-2">
                      <div className="flex justify-between items-start">
                        <h4 className="text-sm font-bold text-white uppercase tracking-wider">{c.certificateType} CERTIFICATE</h4>
                        <Award className="text-amber-400" size={18} />
                      </div>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 font-mono">Serial: {c.serialNumber}</p>
                      <p className="text-xs text-slate-500">Issued On: {new Date(c.issuedAt).toLocaleDateString()}</p>
                    </div>

                    <a 
                      href={c.pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full block py-2 rounded-xl bg-theme-gradient text-white text-xs font-bold text-center hover:opacity-90 shadow-md"
                    >
                      View & Download Document PDF
                    </a>
                  </div>
                ))
              )}
            </div>
          </GlassCard>
        )}
      </main>
    </div>
  );
}
