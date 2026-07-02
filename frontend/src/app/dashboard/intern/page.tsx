"use client";

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import Sidebar from '@/components/Sidebar';
import GlassCard from '@/components/GlassCard';
import { motion } from 'framer-motion';
import { 
  Award, Zap, Calendar, AlertTriangle, MessageSquare, 
  Send, CheckCircle, Clock, MapPin, Code, Link as LinkIcon 
} from 'lucide-react';

export default function InternDashboard() {
  const { user, token, refreshUser } = useAuth();
  
  // Dashboard states
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Attendance actions
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

  // Chatbot State
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<Array<{ sender: 'user' | 'bot'; text: string }>>([
    { sender: 'bot', text: 'Hello! I am ITA, your IdeaTech Assistant. How can I help you today with your WFH internship?' }
  ]);
  const [chatLoading, setChatLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchInternData();
    }
  }, [user]);

  const fetchInternData = async () => {
    setLoading(true);
    try {
      // 1. Stats
      const res = await fetch('/api/analytics/intern', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }

      // 2. Today's Attendance
      const attRes = await fetch('/api/attendance/my', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (attRes.ok) {
        const attData = await attRes.json();
        const today = new Date().toDateString();
        const todayRecord = attData.history.find((h: any) => new Date(h.date).toDateString() === today);
        if (todayRecord) {
          setCheckInTime(new Date(todayRecord.checkIn).toLocaleTimeString());
          if (todayRecord.checkOut) {
            setCheckOutTime(new Date(todayRecord.checkOut).toLocaleTimeString());
            setAttendanceStatus('Checked Out');
          } else {
            setAttendanceStatus('Checked In');
          }
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Clock In
  const handleCheckIn = async () => {
    try {
      const res = await fetch('/api/attendance/checkin', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        fetchInternData();
        refreshUser();
      } else {
        alert(data.message);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Clock Out
  const handleCheckOut = async () => {
    try {
      const res = await fetch('/api/attendance/checkout', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        fetchInternData();
        refreshUser();
      } else {
        alert(data.message);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Submit Daily Report
  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setReportMsg('Submitting...');
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
          hoursWorked,
          githubLink: gitLink,
          commitLink,
        })
      });
      const data = await res.json();
      if (res.ok) {
        setReportMsg('Daily report submitted successfully!');
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
    } catch (err) {
      setReportMsg('Submission error.');
    }
  };

  // Submit Logbook
  const handleLogbookSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLogbookMsg('Submitting...');
    try {
      const res = await fetch('/api/logbook/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          activities,
          learning,
          skillsLearned,
          challenges,
          solutions
        })
      });
      const data = await res.json();
      if (res.ok) {
        setLogbookMsg('Logbook logged successfully!');
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
    } catch (err) {
      setLogbookMsg('Submission error.');
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
        setChatHistory(prev => [...prev, { sender: 'bot', text: 'Support agent is currently offline. Please try again later.' }]);
      }
    } catch (err) {
      setChatHistory(prev => [...prev, { sender: 'bot', text: 'Error contacting AI agent.' }]);
    } finally {
      setChatLoading(false);
    }
  };

  if (loading || !stats) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-900 text-slate-100">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs text-slate-400">Loading intern metrics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex">
      <Sidebar />
      
      <main className="flex-1 lg:ml-64 p-8 pt-20 lg:pt-8 space-y-6 overflow-y-auto max-h-screen">
        {/* Banner Welcome */}
        <div className="flex justify-between items-center bg-theme-gradient p-8 rounded-3xl shadow-xl shadow-blue-500/10">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Welcome, {user?.firstName}!</h1>
            <p className="text-sm text-blue-100/80 mt-1">Intern ID: <strong className="text-white">{user?.internProfile?.internId || 'Awaiting ID'}</strong> | Department: {user?.internProfile?.department?.name}</p>
          </div>
          <div className="hidden md:flex items-center space-x-3 bg-white/10 px-5 py-3 rounded-2xl border border-white/10 backdrop-blur-sm">
            <Calendar size={18} />
            <span className="text-sm font-semibold">{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}</span>
          </div>
        </div>

        {/* Stats Row Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <GlassCard className="flex items-center space-x-4">
            <div className="p-3.5 bg-blue-500/10 text-blue-400 rounded-2xl"><Award size={24} /></div>
            <div>
              <p className="text-xs text-slate-400 font-medium">CURRENT LEVEL</p>
              <h3 className="text-2xl font-bold">Level {stats.level}</h3>
            </div>
          </GlassCard>

          <GlassCard className="flex items-center space-x-4">
            <div className="p-3.5 bg-purple-500/10 text-purple-400 rounded-2xl"><Zap size={24} /></div>
            <div>
              <p className="text-xs text-slate-400 font-medium">ACTIVE STREAK</p>
              <h3 className="text-2xl font-bold">{stats.streak} Days</h3>
            </div>
          </GlassCard>

          <GlassCard className="flex items-center space-x-4">
            <div className="p-3.5 bg-green-500/10 text-green-400 rounded-2xl"><CheckCircle size={24} /></div>
            <div>
              <p className="text-xs text-slate-400 font-medium">COMPLETION PROGRESS</p>
              <h3 className="text-2xl font-bold">{stats.completionProgress}%</h3>
            </div>
          </GlassCard>

          <GlassCard className="flex items-center space-x-4">
            <div className="p-3.5 bg-amber-500/10 text-amber-400 rounded-2xl"><Clock size={24} /></div>
            <div>
              <p className="text-xs text-slate-400 font-medium">REMAINING DAYS</p>
              <h3 className="text-2xl font-bold">{stats.remainingDays} Days</h3>
            </div>
          </GlassCard>
        </div>

        {/* Middle content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Actions Column */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* WFH Attendance Action Card */}
            <GlassCard>
              <h2 className="text-lg font-bold mb-4 flex items-center space-x-2">
                <MapPin size={18} className="text-blue-400" />
                <span>Work From Home Attendance</span>
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                <div className="space-y-2">
                  <div className="text-sm font-semibold text-slate-350">Status: <span className="text-blue-400 font-bold">{attendanceStatus}</span></div>
                  <div className="text-xs text-slate-450">
                    {checkInTime && <p>Check-In: {checkInTime}</p>}
                    {checkOutTime && <p>Check-Out: {checkOutTime}</p>}
                  </div>
                </div>
                
                <div className="flex space-x-4">
                  <button
                    onClick={handleCheckIn}
                    disabled={attendanceStatus !== 'Not Checked In'}
                    className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm text-center shadow-lg transition-all ${
                      attendanceStatus === 'Not Checked In'
                        ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/10'
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-white/5'
                    }`}
                  >
                    Clock In
                  </button>
                  <button
                    onClick={handleCheckOut}
                    disabled={attendanceStatus !== 'Checked In'}
                    className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm text-center shadow-lg transition-all ${
                      attendanceStatus === 'Checked In'
                        ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-purple-500/10'
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-white/5'
                    }`}
                  >
                    Clock Out
                  </button>
                </div>
              </div>
            </GlassCard>

            {/* Daily Report Submission Form */}
            <GlassCard>
              <h2 className="text-lg font-bold mb-4 flex items-center space-x-2">
                <Code size={18} className="text-purple-400" />
                <span>Submit Daily Performance Report</span>
              </h2>

              {reportMsg && <div className="p-3 mb-4 rounded-xl bg-slate-900 border border-white/5 text-xs text-center text-blue-400">{reportMsg}</div>}

              <form onSubmit={handleReportSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Today's Assigned Tasks *</label>
                    <input
                      type="text"
                      required
                      value={todayTasks}
                      onChange={(e) => setTodayTasks(e.target.value)}
                      className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-blue-500"
                      placeholder="e.g. Design layouts, link database"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Completed Work & Deliverables *</label>
                    <input
                      type="text"
                      required
                      value={completedWork}
                      onChange={(e) => setCompletedWork(e.target.value)}
                      className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-blue-500"
                      placeholder="e.g. Created Sidebar.tsx and GlassCard.tsx"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Hours Worked *</label>
                    <input
                      type="number"
                      required
                      value={hoursWorked}
                      onChange={(e) => setHoursWorked(e.target.value)}
                      className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-blue-500"
                      placeholder="8"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">GitHub Repo Link</label>
                    <input
                      type="url"
                      value={gitLink}
                      onChange={(e) => setGitLink(e.target.value)}
                      className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-blue-500"
                      placeholder="https://github.com/..."
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Commit SHA / URL</label>
                    <input
                      type="text"
                      value={commitLink}
                      onChange={(e) => setCommitLink(e.target.value)}
                      className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-blue-500"
                      placeholder="e.g. 5ae3bc8"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">Problems / Blockers Faced *</label>
                  <textarea
                    required
                    rows={2}
                    value={problemsFaced}
                    onChange={(e) => setProblemsFaced(e.target.value)}
                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-blue-500"
                    placeholder="Describe any technical blockers or write 'None'"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-theme-gradient text-white text-sm font-semibold hover:opacity-90 transition-opacity shadow-md shadow-blue-500/10"
                >
                  Submit Daily Report (+15 XP)
                </button>
              </form>
            </GlassCard>
            
            {/* Digital Logbook Record Form */}
            <GlassCard>
              <h2 className="text-lg font-bold mb-4 flex items-center space-x-2">
                <Send size={18} className="text-emerald-400" />
                <span>Log Today's Educational Insights</span>
              </h2>

              {logbookMsg && <div className="p-3 mb-4 rounded-xl bg-slate-900 border border-white/5 text-xs text-center text-emerald-400">{logbookMsg}</div>}

              <form onSubmit={handleLogbookSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Summary of Activities Logged *</label>
                  <input
                    type="text"
                    required
                    value={activities}
                    onChange={(e) => setActivities(e.target.value)}
                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-blue-500"
                    placeholder="Short summary of work done"
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Academic Learning & Concepts Gained *</label>
                    <textarea
                      required
                      rows={2}
                      value={learning}
                      onChange={(e) => setLearning(e.target.value)}
                      className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-blue-500"
                      placeholder="What concepts did you study/learn?"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Critical Skills Exercised *</label>
                    <textarea
                      required
                      rows={2}
                      value={skillsLearned}
                      onChange={(e) => setSkillsLearned(e.target.value)}
                      className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-blue-500"
                      placeholder="e.g. JWT Auth routing, Database relationships"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Challenges & Impediments Encountered *</label>
                    <textarea
                      required
                      rows={2}
                      value={challenges}
                      onChange={(e) => setChallenges(e.target.value)}
                      className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-blue-500"
                      placeholder="Describe blockers"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Remedial Actions / Solutions Implemented *</label>
                    <textarea
                      required
                      rows={2}
                      value={solutions}
                      onChange={(e) => setSolutions(e.target.value)}
                      className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-blue-500"
                      placeholder="How did you resolve it?"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition-colors shadow-md shadow-emerald-500/10"
                >
                  Log Logbook Entry (+15 XP)
                </button>
              </form>
            </GlassCard>

          </div>

          {/* Gamification, Badges & AI Chatbot Column */}
          <div className="space-y-6">
            {/* XP & Level Panel */}
            <GlassCard className="text-center">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Level Progression</h3>
              
              {/* Circular Gauge Mock */}
              <div className="w-32 h-32 rounded-full border-4 border-slate-800 border-t-blue-500 border-r-purple-500 mx-auto flex items-center justify-center mb-4 relative">
                <div className="text-center">
                  <span className="text-3xl font-extrabold text-white">{stats.xp}</span>
                  <span className="text-[10px] text-slate-400 block">XP Earned</span>
                </div>
              </div>

              <div className="w-full bg-slate-800 h-2.5 rounded-full mb-2 overflow-hidden border border-white/5">
                <div 
                  className="bg-theme-gradient h-full rounded-full transition-all duration-500" 
                  style={{ width: `${stats.xpProgress}%` }}
                />
              </div>
              
              <div className="flex justify-between text-xs text-slate-400">
                <span>Level {stats.level}</span>
                <span>{stats.xpProgress}% to Level {stats.level + 1}</span>
              </div>
            </GlassCard>

            {/* Badges Panel */}
            <GlassCard>
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center space-x-1.5">
                <Award size={16} className="text-amber-400" />
                <span>Earned Badges</span>
              </h3>
              {stats.badges.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-4">No badges unlocked yet. Keep logging reports and checkouts to earn rewards!</p>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {stats.badges.map((badge: any, i: number) => (
                    <div key={i} className="p-3 bg-slate-900 border border-white/5 rounded-2xl text-center space-y-1">
                      <div className="text-xl">🏆</div>
                      <h4 className="text-xs font-bold text-slate-200">{badge.name}</h4>
                      <p className="text-[9px] text-slate-500 leading-tight">{badge.desc}</p>
                    </div>
                  ))}
                </div>
              )}
            </GlassCard>

            {/* System Warnings Panel */}
            <GlassCard>
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center space-x-1.5">
                <AlertTriangle size={16} className="text-red-400" />
                <span>Active Warning Notifications</span>
              </h3>
              {stats.warnings.length === 0 ? (
                <div className="p-3 bg-slate-900/40 border border-green-500/20 text-green-400 text-xs rounded-xl flex items-center justify-center space-x-2">
                  <CheckCircle size={14} className="flex-shrink-0" />
                  <span>Profile clean. No warnings registered.</span>
                </div>
              ) : (
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {stats.warnings.map((w: any, index: number) => (
                    <div key={index} className="p-2.5 bg-red-950/20 border border-red-500/20 rounded-xl text-xs space-y-1">
                      <div className="flex justify-between font-semibold text-red-400">
                        <span>{w.type}</span>
                        <span>{new Date(w.date).toLocaleDateString()}</span>
                      </div>
                      <p className="text-slate-400 text-[10px] leading-tight">{w.reason}</p>
                    </div>
                  ))}
                </div>
              )}
            </GlassCard>

            {/* AI Assistant Chatbot panel */}
            <GlassCard className="flex flex-col h-[350px]">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center space-x-2">
                <MessageSquare size={16} className="text-blue-400" />
                <span>IdeaTech Assistant (ITA)</span>
              </h3>
              
              {/* Message Log */}
              <div className="flex-1 bg-slate-950/40 border border-white/5 rounded-2xl p-3 overflow-y-auto space-y-3 mb-2 max-h-[220px]">
                {chatHistory.map((chat, i) => (
                  <div key={i} className={`flex ${chat.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div 
                      className={`p-2.5 rounded-2xl text-xs max-w-[85%] leading-normal ${
                        chat.sender === 'user' 
                          ? 'bg-blue-600 text-white rounded-br-none' 
                          : 'bg-slate-900 text-slate-200 rounded-bl-none border border-white/5'
                      }`}
                    >
                      {chat.text}
                    </div>
                  </div>
                ))}
                {chatLoading && (
                  <div className="flex justify-start">
                    <div className="p-2 bg-slate-900 border border-white/5 rounded-2xl text-xs text-slate-400 flex items-center space-x-2">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce"></div>
                      <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce delay-100"></div>
                      <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce delay-200"></div>
                    </div>
                  </div>
                )}
              </div>

              {/* Chat Input */}
              <form onSubmit={handleChatSend} className="flex space-x-2">
                <input
                  type="text"
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  className="flex-1 bg-slate-900 border border-white/10 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-blue-500"
                  placeholder="Ask ITA about attendance or rules..."
                />
                <button
                  type="submit"
                  className="p-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-colors"
                >
                  <Send size={14} />
                </button>
              </form>
            </GlassCard>
          </div>
        </div>
      </main>
    </div>
  );
}
