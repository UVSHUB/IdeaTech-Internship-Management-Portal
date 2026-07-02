"use client";

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import Sidebar from '@/components/Sidebar';
import GlassCard from '@/components/GlassCard';
import { FileText, CheckCircle, XCircle, Clock, BookOpen, Send, Calendar } from 'lucide-react';

export default function MentorDashboard() {
  const { token } = useAuth();

  // States
  const [reports, setReports] = useState<any[]>([]);
  const [logbooks, setLogbooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Forms mapping
  const [reportRemarks, setReportRemarks] = useState<Record<string, string>>({});
  const [logbookComments, setLogbookComments] = useState<Record<string, string>>({});

  // Meeting scheduler
  const [meetingTitle, setMeetingTitle] = useState('');
  const [meetingAgenda, setMeetingAgenda] = useState('');
  const [meetingTime, setMeetingTime] = useState('');
  const [meetingLink, setMeetingLink] = useState('');
  const [meetingPlatform, setMeetingPlatform] = useState('Google Meet');
  const [meetingMsg, setMeetingMsg] = useState('');

  useEffect(() => {
    fetchMentorData();
  }, []);

  const fetchMentorData = async () => {
    setLoading(true);
    try {
      // 1. Pending Reports
      const reportsRes = await fetch('/api/reports/pending', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (reportsRes.ok) {
        setReports(await reportsRes.json());
      }

      // 2. Pending Logbooks
      const logsRes = await fetch('/api/logbook/pending', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (logsRes.ok) {
        setLogbooks(await logsRes.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Review report
  const handleReviewReport = async (reportId: string, status: 'APPROVED' | 'REJECTED') => {
    const remarks = reportRemarks[reportId] || '';
    try {
      const res = await fetch(`/api/reports/review/${reportId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status, remarks })
      });

      if (res.ok) {
        alert(`Daily report ${status.toLowerCase()} successfully.`);
        fetchMentorData();
      } else {
        alert('Action failed.');
      }
    } catch (err) {
      alert('Error.');
    }
  };

  // Review logbook
  const handleReviewLogbook = async (logbookId: string, status: 'APPROVED' | 'REJECTED') => {
    const comments = logbookComments[logbookId] || '';
    try {
      const res = await fetch(`/api/logbook/review/${logbookId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status, mentorComments: comments })
      });

      if (res.ok) {
        alert(`Logbook entry ${status.toLowerCase()} successfully.`);
        fetchMentorData();
      } else {
        alert('Action failed.');
      }
    } catch (err) {
      alert('Error.');
    }
  };

  // Schedule Meeting
  const handleCreateMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    setMeetingMsg('Scheduling...');

    try {
      const res = await fetch('/api/meetings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: meetingTitle,
          agenda: meetingAgenda,
          meetingTime,
          platform: meetingPlatform,
          link: meetingLink,
        })
      });

      if (res.ok) {
        setMeetingMsg('Weekly meeting scheduled successfully! Reminders sent.');
        setMeetingTitle('');
        setMeetingAgenda('');
        setMeetingTime('');
        setMeetingLink('');
      } else {
        setMeetingMsg('Scheduling failed.');
      }
    } catch (err) {
      setMeetingMsg('Error.');
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-900 text-slate-100">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">Loading Mentor portal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 flex">
      <Sidebar />

      <main className="flex-1 lg:ml-64 p-8 pt-20 lg:pt-8 space-y-6 overflow-y-auto max-h-screen">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Mentor Workspace</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Review your interns' daily reports, verify logbook reflections, and schedule sprints.</p>
        </div>

        {/* Action Panels */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Daily Reports Review */}
          <div className="lg:col-span-2 space-y-6">
            <GlassCard className="space-y-4">
              <h2 className="text-base font-bold flex items-center space-x-2 text-blue-400">
                <FileText size={18} />
                <span>Pending Daily Reports ({reports.length})</span>
              </h2>

              {reports.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-16">No daily reports awaiting review.</p>
              ) : (
                <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
                  {reports.map((report) => (
                    <div key={report.id} className="p-4 bg-slate-900/60 border border-white/5 rounded-2xl space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="text-sm font-bold text-white">{report.user.firstName} {report.user.lastName} ({report.user.internProfile?.internId})</h4>
                          <p className="text-[10px] text-zinc-500 dark:text-zinc-400">Logged date: {new Date(report.date).toLocaleDateString()}</p>
                        </div>
                        <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2.5 py-0.5 rounded-full font-bold">
                          Pending
                        </span>
                      </div>

                      <div className="text-xs space-y-1.5 bg-zinc-100 dark:bg-zinc-950/40 p-3 rounded-xl text-zinc-700 dark:text-zinc-300 leading-relaxed">
                        <p><strong>Today's Tasks:</strong> {report.todayTasks}</p>
                        <p><strong>Completed:</strong> {report.completedWork}</p>
                        {report.problemsFaced && <p><strong>Blockers:</strong> <span className="text-red-400 font-semibold">{report.problemsFaced}</span></p>}
                        <p className="text-[10px] text-slate-500 mt-2">Hours logged: {report.hoursWorked} hrs | Git: {report.githubLink || 'N/A'}</p>
                      </div>

                      <div className="flex space-x-2 items-center">
                        <input
                          type="text"
                          value={reportRemarks[report.id] || ''}
                          onChange={(e) => setReportRemarks({ ...reportRemarks, [report.id]: e.target.value })}
                          className="flex-1 bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-500 transition-colors"
                          placeholder="Feedback/remarks (optional)"
                        />
                        <button
                          onClick={() => handleReviewReport(report.id, 'APPROVED')}
                          className="p-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs"
                          title="Approve"
                        >
                          <CheckCircle size={15} />
                        </button>
                        <button
                          onClick={() => handleReviewReport(report.id, 'REJECTED')}
                          className="p-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-xs"
                          title="Reject"
                        >
                          <XCircle size={15} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </GlassCard>

            {/* Logbook Reviews */}
            <GlassCard className="space-y-4">
              <h2 className="text-base font-bold flex items-center space-x-2 text-purple-400">
                <BookOpen size={18} />
                <span>Pending Logbook Journals ({logbooks.length})</span>
              </h2>

              {logbooks.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-16">No logbook entries awaiting review.</p>
              ) : (
                <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
                  {logbooks.map((log) => (
                    <div key={log.id} className="p-4 bg-slate-900/60 border border-white/5 rounded-2xl space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="text-sm font-bold text-white">{log.user.firstName} {log.user.lastName} ({log.user.internProfile?.internId})</h4>
                          <p className="text-[10px] text-zinc-500 dark:text-zinc-400">Date logged: {new Date(log.date).toLocaleDateString()}</p>
                        </div>
                        <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2.5 py-0.5 rounded-full font-bold">
                          Pending
                        </span>
                      </div>

                      <div className="text-xs space-y-2 bg-zinc-100 dark:bg-zinc-950/40 p-3 rounded-xl text-zinc-650 dark:text-zinc-350 leading-normal">
                        <div><strong>Activities:</strong> {log.activities}</div>
                        <div><strong>Learning gained:</strong> {log.learning}</div>
                        <div><strong>Skills:</strong> {log.skillsLearned}</div>
                        {log.challenges && <div><strong>Challenges:</strong> {log.challenges}</div>}
                        {log.solutions && <div><strong>Solutions:</strong> {log.solutions}</div>}
                      </div>

                      <div className="flex space-x-2 items-center">
                        <input
                          type="text"
                          value={logbookComments[log.id] || ''}
                          onChange={(e) => setLogbookComments({ ...logbookComments, [log.id]: e.target.value })}
                          className="flex-1 bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-500 transition-colors"
                          placeholder="Comments to include (optional)"
                        />
                        <button
                          onClick={() => handleReviewLogbook(log.id, 'APPROVED')}
                          className="p-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs"
                          title="Approve Log"
                        >
                          <CheckCircle size={15} />
                        </button>
                        <button
                          onClick={() => handleReviewLogbook(log.id, 'REJECTED')}
                          className="p-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-xs"
                          title="Reject Log"
                        >
                          <XCircle size={15} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </GlassCard>
          </div>

          {/* Sprints Scheduling Block */}
          <div className="space-y-6">
            <GlassCard>
              <h3 className="text-sm font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-4 flex items-center space-x-1.5">
                <Calendar size={16} className="text-blue-400" />
                <span>Schedule Weekly Meeting</span>
              </h3>

              {meetingMsg && (
                <div className="p-3 mb-4 rounded-xl bg-slate-900 border border-white/5 text-[11px] text-blue-400 leading-normal text-center">
                  {meetingMsg}
                </div>
              )}

              <form onSubmit={handleCreateMeeting} className="space-y-4">
                <div>
                  <label className="block text-xs text-zinc-500 dark:text-zinc-400 mb-1">Meeting Title *</label>
                  <input
                    type="text"
                    required
                    value={meetingTitle}
                    onChange={(e) => setMeetingTitle(e.target.value)}
                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-blue-500"
                    placeholder="e.g. Sprint Planning Review"
                  />
                </div>
                <div>
                  <label className="block text-xs text-zinc-500 dark:text-zinc-400 mb-1">Meeting Agenda *</label>
                  <textarea
                    required
                    rows={3}
                    value={meetingAgenda}
                    onChange={(e) => setMeetingAgenda(e.target.value)}
                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-blue-500"
                    placeholder="Provide meeting bullets..."
                  />
                </div>
                <div>
                  <label className="block text-xs text-zinc-500 dark:text-zinc-400 mb-1">Meeting Time *</label>
                  <input
                    type="datetime-local"
                    required
                    value={meetingTime}
                    onChange={(e) => setMeetingTime(e.target.value)}
                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-blue-500 text-zinc-650 dark:text-zinc-350"
                  />
                </div>
                <div>
                  <label className="block text-xs text-zinc-500 dark:text-zinc-400 mb-1">Platform *</label>
                  <select
                    value={meetingPlatform}
                    onChange={(e) => setMeetingPlatform(e.target.value)}
                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-blue-500 text-zinc-650 dark:text-zinc-350"
                  >
                    <option value="Google Meet">Google Meet</option>
                    <option value="Zoom">Zoom</option>
                    <option value="Microsoft Teams">Microsoft Teams</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-zinc-500 dark:text-zinc-400 mb-1">Meeting Video URL *</label>
                  <input
                    type="url"
                    required
                    value={meetingLink}
                    onChange={(e) => setMeetingLink(e.target.value)}
                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-blue-500"
                    placeholder="https://meet.google.com/xxx-xxxx-xxx"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-theme-gradient text-white text-xs font-semibold hover:opacity-90 transition-opacity shadow-lg shadow-blue-500/20"
                >
                  Schedule Sprint (+10 XP to attendees)
                </button>
              </form>
            </GlassCard>
          </div>

        </div>
      </main>
    </div>
  );
}
