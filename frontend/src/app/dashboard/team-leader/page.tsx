"use client";

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import Sidebar from '@/components/Sidebar';
import GlassCard from '@/components/GlassCard';
import { CheckSquare, PlusCircle, Clock, Calendar, Check, AlertCircle } from 'lucide-react';

export default function TeamLeaderDashboard() {
  const { token } = useAuth();

  // States
  const [tasks, setTasks] = useState<any[]>([]);
  const [interns, setInterns] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Create Task Form
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [assigneeId, setAssigneeId] = useState('');
  const [projectId, setProjectId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [taskMsg, setTaskMsg] = useState('');

  useEffect(() => {
    fetchTLData();
  }, []);

  const fetchTLData = async () => {
    setLoading(true);
    try {
      // 1. Tasks
      const tasksRes = await fetch('/api/tasks', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (tasksRes.ok) {
        setTasks(await tasksRes.json());
      }

      // 2. Projects
      const projRes = await fetch('/api/projects', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (projRes.ok) {
        setProjects(await projRes.json());
      }

      // 3. User lists (specifically interns to assign tasks)
      const usersRes = await fetch('/api/users/list', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (usersRes.ok) {
        const uData = await usersRes.json();
        setInterns(uData.filter((u: any) => u.role === 'INTERN'));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Create Task Submit
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setTaskMsg('Assigning...');

    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title,
          description,
          priority,
          assigneeId,
          projectId: projectId || undefined,
          dueDate,
        })
      });

      if (res.ok) {
        setTaskMsg('Task created and assigned successfully!');
        setTitle('');
        setDescription('');
        setDueDate('');
        fetchTLData();
      } else {
        const err = await res.json();
        setTaskMsg(err.message || 'Creation failed.');
      }
    } catch (err) {
      setTaskMsg('Network error.');
    }
  };

  // Review completed task
  const handleReviewTask = async (taskId: string, approval: 'APPROVED' | 'REJECTED') => {
    try {
      const res = await fetch(`/api/tasks/review/${taskId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ approval })
      });

      if (res.ok) {
        alert(`Task marked as ${approval === 'APPROVED' ? 'completed' : 'rejected'}.`);
        fetchTLData();
      } else {
        alert('Review submission failed.');
      }
    } catch (err) {
      alert('Error.');
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-900 text-slate-100">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">Loading Leader board...</p>
        </div>
      </div>
    );
  }

  // Filter tasks into columns
  const getTasksByStatus = (status: string) => tasks.filter(t => t.status === status);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 flex">
      <Sidebar />

      <main className="flex-1 lg:ml-64 p-8 pt-20 lg:pt-8 space-y-6 overflow-y-auto max-h-screen">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Team Lead Workspace</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Manage active development projects, schedule tasks, and approve completed milestones.</p>
        </div>

        {/* Task Dashboard Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Sprints & Kanban Board Columns (occupies 3 cols) */}
          <div className="lg:col-span-3 space-y-6">
            
            {/* Project Header Capsule */}
            <GlassCard className="p-4 flex flex-wrap justify-between items-center bg-slate-900/40">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse"></span>
                <span className="font-semibold text-white">Active Project:</span>
                <span className="text-zinc-650 dark:text-zinc-350">{projects[0]?.name || 'IdeaTech Core Portal Development'}</span>
              </div>
              <div className="text-xs text-blue-400 font-semibold">{tasks.length} Total Sprint Tasks</div>
            </GlassCard>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* Column 1: Pending */}
              <div className="space-y-3">
                <div className="flex justify-between items-center px-1">
                  <h3 className="text-xs font-bold text-slate-450 uppercase tracking-wider">Pending</h3>
                  <span className="text-[10px] bg-slate-800 text-zinc-500 dark:text-zinc-400 px-1.5 py-0.2 rounded font-bold">{getTasksByStatus('PENDING').length}</span>
                </div>
                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                  {getTasksByStatus('PENDING').map(t => (
                    <div key={t.id} className="p-3 bg-slate-900/80 border-t-2 border-t-blue-500 rounded-xl space-y-2">
                      <h4 className="text-xs font-bold text-white leading-normal truncate">{t.title}</h4>
                      <p className="text-[10px] text-zinc-500 dark:text-zinc-400 line-clamp-2">{t.description}</p>
                      <div className="flex justify-between text-[9px] text-slate-500">
                        <span>Due: {new Date(t.dueDate).toLocaleDateString()}</span>
                        <span className="font-bold text-blue-400">{t.priority}</span>
                      </div>
                      <div className="text-[9px] text-slate-500 border-t border-white/5 pt-1.5">Assignee: {t.assignee.firstName}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Column 2: Working */}
              <div className="space-y-3">
                <div className="flex justify-between items-center px-1">
                  <h3 className="text-xs font-bold text-slate-450 uppercase tracking-wider">Working</h3>
                  <span className="text-[10px] bg-slate-800 text-zinc-500 dark:text-zinc-400 px-1.5 py-0.2 rounded font-bold">{getTasksByStatus('WORKING').length}</span>
                </div>
                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                  {getTasksByStatus('WORKING').map(t => (
                    <div key={t.id} className="p-3 bg-slate-900/80 border-t-2 border-t-purple-500 rounded-xl space-y-2">
                      <h4 className="text-xs font-bold text-white leading-normal truncate">{t.title}</h4>
                      <p className="text-[10px] text-zinc-500 dark:text-zinc-400 line-clamp-2">{t.description}</p>
                      <div className="w-full bg-slate-950 h-1 rounded overflow-hidden mt-1">
                        <div className="bg-purple-500 h-full" style={{ width: `${t.progress}%` }}></div>
                      </div>
                      <div className="flex justify-between text-[9px] text-slate-500">
                        <span>Progress: {t.progress}%</span>
                        <span className="font-bold text-purple-400">{t.priority}</span>
                      </div>
                      <div className="text-[9px] text-slate-500 border-t border-white/5 pt-1.5">Assignee: {t.assignee.firstName}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Column 3: Completed */}
              <div className="space-y-3">
                <div className="flex justify-between items-center px-1">
                  <h3 className="text-xs font-bold text-slate-450 uppercase tracking-wider">Needs Review</h3>
                  <span className="text-[10px] bg-slate-800 text-zinc-500 dark:text-zinc-400 px-1.5 py-0.2 rounded font-bold">{getTasksByStatus('COMPLETED').length}</span>
                </div>
                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                  {getTasksByStatus('COMPLETED').map(t => (
                    <div key={t.id} className="p-3 bg-slate-900/80 border-t-2 border-t-emerald-500 rounded-xl space-y-2">
                      <h4 className="text-xs font-bold text-white leading-normal truncate">{t.title}</h4>
                      <p className="text-[10px] text-zinc-500 dark:text-zinc-400 line-clamp-2">{t.description}</p>
                      <div className="text-[9px] text-slate-500">Assignee: {t.assignee.firstName}</div>
                      
                      <div className="flex space-x-1.5 pt-1 border-t border-white/5">
                        <button
                          onClick={() => handleReviewTask(t.id, 'APPROVED')}
                          className="flex-1 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[9px] font-bold"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleReviewTask(t.id, 'REJECTED')}
                          className="flex-1 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-[9px] font-bold"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Column 4: Rejected */}
              <div className="space-y-3">
                <div className="flex justify-between items-center px-1">
                  <h3 className="text-xs font-bold text-slate-450 uppercase tracking-wider">Rejected</h3>
                  <span className="text-[10px] bg-slate-800 text-zinc-500 dark:text-zinc-400 px-1.5 py-0.2 rounded font-bold">{getTasksByStatus('REJECTED').length}</span>
                </div>
                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                  {getTasksByStatus('REJECTED').map(t => (
                    <div key={t.id} className="p-3 bg-slate-900/80 border-t-2 border-t-red-500 rounded-xl space-y-2">
                      <h4 className="text-xs font-bold text-red-400 leading-normal truncate">{t.title}</h4>
                      <p className="text-[10px] text-zinc-500 dark:text-zinc-400 line-clamp-2">{t.description}</p>
                      <div className="text-[9px] text-slate-500 border-t border-white/5 pt-1.5">Assignee: {t.assignee.firstName}</div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>

          {/* Task creation & team listing (occupies 1 col) */}
          <div className="space-y-6">
            
            {/* Create Task Card */}
            <GlassCard>
              <h3 className="text-sm font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-3 flex items-center space-x-1.5">
                <PlusCircle size={16} className="text-blue-400" />
                <span>Assign New Task</span>
              </h3>

              {taskMsg && (
                <div className="p-2 mb-3 rounded-xl bg-slate-900 border border-white/5 text-[10px] text-blue-400 text-center">
                  {taskMsg}
                </div>
              )}

              <form onSubmit={handleCreateTask} className="space-y-3">
                <div>
                  <label className="block text-[10px] text-slate-500 mb-0.5">TASK TITLE *</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none"
                    placeholder="e.g. Implement layout"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 mb-0.5">DESCRIPTION</label>
                  <textarea
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none"
                    placeholder="Tasks specifications..."
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 mb-0.5">ASSIGNEE INTERN *</label>
                  <select
                    required
                    value={assigneeId}
                    onChange={(e) => setAssigneeId(e.target.value)}
                    className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-zinc-650 dark:text-zinc-350 focus:outline-none"
                  >
                    <option value="">Select Intern...</option>
                    {interns.map(i => <option key={i.id} value={i.id}>{i.firstName} {i.lastName}</option>)}
                  </select>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-0.5">PRIORITY</label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value)}
                      className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-zinc-650 dark:text-zinc-350 focus:outline-none"
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-0.5">PROJECT</label>
                    <select
                      value={projectId}
                      onChange={(e) => setProjectId(e.target.value)}
                      className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-zinc-650 dark:text-zinc-350 focus:outline-none"
                    >
                      <option value="">Choose...</option>
                      {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] text-slate-500 mb-0.5">DUE DATE *</label>
                  <input
                    type="date"
                    required
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-zinc-650 dark:text-zinc-350 focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-theme-gradient text-white text-xs font-semibold hover:opacity-90 shadow-md"
                >
                  Create & Assign Task
                </button>
              </form>
            </GlassCard>

            {/* Team Members List */}
            <GlassCard>
              <h3 className="text-sm font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-3">Project Team Members</h3>
              <div className="space-y-2">
                {interns.map(intern => (
                  <div key={intern.id} className="flex items-center space-x-2 bg-slate-900/40 p-2.5 rounded-xl border border-white/5">
                    <div className="w-6 h-6 rounded-full bg-blue-500/10 text-blue-400 font-bold flex items-center justify-center text-xs">
                      {intern.firstName.charAt(0)}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">{intern.firstName} {intern.lastName}</h4>
                      <p className="text-[9px] text-slate-500 uppercase tracking-wider">Software Intern</p>
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>

          </div>

        </div>
      </main>
    </div>
  );
}
