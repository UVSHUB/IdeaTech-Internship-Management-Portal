"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

export interface InternProfile {
  id: string;
  internId: string | null;
  nic: string;
  dob: string;
  university: string;
  degree: string;
  year: number;
  skills: string;
  cvUrl: string;
  portfolio?: string;
  github?: string;
  linkedin?: string;
  mobileNumber: string;
  address: string;
  emergencyContact: string;
  positionApplied: string;
  preferredTech: string;
  availability: string;
  status: 'PENDING' | 'ACTIVE' | 'WARNING' | 'SUSPENDED' | 'TERMINATED' | 'COMPLETED';
  level: number;
  xp: number;
  streak: number;
  completionProgress: number;
  remainingDays: number;
  warningCount: number;
  idCardUrl: string | null;
  department: { name: string };
}

export interface User {
  id: string;
  email: string;
  role: 'SUPER_ADMIN' | 'HR_MANAGER' | 'TEAM_LEADER' | 'PROJECT_MANAGER' | 'MENTOR' | 'INTERN';
  firstName: string;
  lastName: string;
  internProfile?: InternProfile;
  projectMembers?: { project: { id: string; name: string } }[];
}

interface AuthContextProps {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (token: string, userData: User) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Load token and user details on startup
  useEffect(() => {
    async function loadStoredData() {
      const storedToken = localStorage.getItem('itimp_token');
      if (storedToken) {
        setToken(storedToken);
        try {
          const res = await fetch('/api/users/me', {
            headers: {
              'Authorization': `Bearer ${storedToken}`,
            },
          });
          if (res.ok) {
            const userData = await res.json();
            setUser(userData);
          } else {
            // Token expired or invalid
            logout();
          }
        } catch (error) {
          console.error('Error verifying stored token:', error);
          logout();
        }
      }
      setLoading(false);
    }
    loadStoredData();
  }, []);

  const login = (newToken: string, userData: User) => {
    setToken(newToken);
    setUser(userData);
    localStorage.setItem('itimp_token', newToken);
    
    // Redirect based on role
    if (userData.role === 'INTERN') {
      router.push('/dashboard/intern');
    } else if (userData.role === 'SUPER_ADMIN') {
      router.push('/dashboard/admin');
    } else if (userData.role === 'HR_MANAGER') {
      router.push('/dashboard/hr');
    } else if (userData.role === 'TEAM_LEADER' || userData.role === 'PROJECT_MANAGER') {
      router.push('/dashboard/team-leader');
    } else if (userData.role === 'MENTOR') {
      router.push('/dashboard/mentor');
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('itimp_token');
    router.push('/login');
  };

  const refreshUser = async () => {
    const activeToken = token || localStorage.getItem('itimp_token');
    if (!activeToken) return;

    try {
      const res = await fetch('/api/users/me', {
        headers: {
          'Authorization': `Bearer ${activeToken}`,
        },
      });
      if (res.ok) {
        const userData = await res.json();
        setUser(userData);
      }
    } catch (error) {
      console.error('Refresh user profile error:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
