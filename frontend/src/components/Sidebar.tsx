"use client";

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  UserCheck,
  Clock,
  CheckSquare,
  FolderGit2,
  CalendarRange,
  FileText,
  Award,
  AlertTriangle,
  MessageSquare,
  LogOut,
  Sun,
  Moon,
  Menu,
  X,
  User
} from 'lucide-react';

interface SidebarProps {
  activeTab?: string;
}

export default function Sidebar({ activeTab }: SidebarProps) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  if (!user) return null;

  // Generate links based on Role
  const getLinks = () => {
    const role = user.role;
    let roleSlug = role.toLowerCase().replace('_', '-');
    if (role === 'SUPER_ADMIN') roleSlug = 'admin';
    if (role === 'HR_MANAGER') roleSlug = 'hr';

    const base = [
      { name: 'Dashboard', icon: LayoutDashboard, path: `/dashboard/${roleSlug}` }
    ];

    if (role === 'SUPER_ADMIN') {
      return [
        ...base,
        { name: 'Applications', icon: UserCheck, path: '/dashboard/admin/applications' },
        { name: 'Attendance Logs', icon: Clock, path: '/dashboard/admin/attendance' },
        { name: 'Sprint Tasks', icon: CheckSquare, path: '/dashboard/admin/tasks' },
        { name: 'Projects', icon: FolderGit2, path: '/dashboard/admin/projects' },
        { name: 'Meetings', icon: CalendarRange, path: '/dashboard/admin/meetings' },
        { name: 'Leave Requests', icon: FileText, path: '/dashboard/admin/leaves' },
        { name: 'Certificates', icon: Award, path: '/dashboard/admin/certificates' },
      ];
    }

    if (role === 'HR_MANAGER') {
      return [
        ...base,
        { name: 'Applications', icon: UserCheck, path: '/dashboard/hr/applications' },
        { name: 'Attendance Reports', icon: Clock, path: '/dashboard/hr/attendance' },
        { name: 'Leave Approvals', icon: FileText, path: '/dashboard/hr/leaves' },
        { name: 'Certificates', icon: Award, path: '/dashboard/hr/certificates' },
      ];
    }

    if (role === 'TEAM_LEADER') {
      return [
        ...base,
        { name: 'Task Board', icon: CheckSquare, path: '/dashboard/team-leader/tasks' },
        { name: 'Projects', icon: FolderGit2, path: '/dashboard/team-leader/projects' },
        { name: 'Schedules', icon: CalendarRange, path: '/dashboard/team-leader/meetings' },
        { name: 'Intern Logs', icon: FileText, path: '/dashboard/team-leader/logs' },
      ];
    }

    if (role === 'MENTOR') {
      return [
        ...base,
        { name: 'Report Reviews', icon: FileText, path: '/dashboard/mentor/reports' },
        { name: 'Logbook Reviews', icon: Clock, path: '/dashboard/mentor/logbooks' },
        { name: 'Sprint Meetings', icon: CalendarRange, path: '/dashboard/mentor/meetings' },
      ];
    }

    // Role: INTERN
    return [
      ...base,
      { name: 'Clock In/Out', icon: Clock, path: '/dashboard/intern/attendance' },
      { name: 'Daily Reports', icon: FileText, path: '/dashboard/intern/reports' },
      { name: 'Digital Logbook', icon: FolderGit2, path: '/dashboard/intern/logbook' },
      { name: 'Task Board', icon: CheckSquare, path: '/dashboard/intern/tasks' },
      { name: 'Leave Request', icon: AlertTriangle, path: '/dashboard/intern/leaves' },
      { name: 'My Certificates', icon: Award, path: '/dashboard/intern/certificates' },
    ];
  };

  const links = getLinks();

  const handleNav = (path: string) => {
    router.push(path);
    setIsOpen(false);
  };

  return (
    <>
      {/* Mobile Toggle Button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 rounded-xl glass-panel text-slate-800 dark:text-slate-200"
        >
          {isOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Sidebar Panel */}
      <aside className={`fixed top-0 left-0 h-screen w-64 p-6 flex flex-col justify-between transition-all duration-300 z-40 lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full lg:block'}`}>
        <div className="h-full flex flex-col justify-between p-4 rounded-3xl glass-panel relative overflow-hidden border border-white/20 dark:border-white/5">
          {/* Header logo */}
          <div>
            <div className="flex items-center space-x-3 mb-8 px-2">
              <div className="w-9 h-9 rounded-xl bg-theme-gradient flex items-center justify-center font-bold text-white shadow-lg shadow-blue-500/20">
                IT
              </div>
              <div>
                <h1 className="font-bold tracking-wider text-sm bg-clip-text text-transparent bg-theme-gradient">
                  IDEATECH
                </h1>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">ITIMP Portal</p>
              </div>
            </div>

            {/* Navigation links */}
            <nav className="space-y-1.5">
              {links.map((link) => {
                const isActive = pathname === link.path;
                return (
                  <button
                    key={link.name}
                    onClick={() => handleNav(link.path)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-theme-gradient text-white shadow-lg shadow-blue-500/10'
                        : 'text-slate-600 dark:text-slate-350 hover:bg-slate-100 dark:hover:bg-slate-800/40 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <link.icon size={18} className={isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400'} />
                    <span>{link.name}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Footer controls & user details */}
          <div className="space-y-4 pt-6 border-t border-slate-200/50 dark:border-slate-800/50">
            {/* User profile capsule */}
            <div className="flex items-center space-x-3 px-2 py-1">
              <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-800 dark:text-slate-200 font-semibold border border-slate-350/20">
                {user.firstName.charAt(0).toUpperCase()}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-[9px] font-bold text-zinc-500 dark:text-zinc-450 uppercase tracking-widest truncate">
                  {user.role.replace('_', ' ')}
                </p>
              </div>
            </div>

            {/* Toggle Theme / Logout */}
            <div className="flex items-center justify-between px-2">
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 hover:text-primary-500 transition-colors"
                title="Toggle Theme"
              >
                {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
              </button>
              
              <button
                onClick={logout}
                className="flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/25 text-red-600 dark:text-red-400 text-xs font-semibold transition-colors"
              >
                <LogOut size={13} />
                <span>Log Out</span>
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Backdrop for mobile */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="lg:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-30"
        />
      )}
    </>
  );
}
