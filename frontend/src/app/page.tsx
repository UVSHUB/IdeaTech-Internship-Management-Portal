"use client";

import { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

export default function HomeGateway() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (user) {
        router.push(`/dashboard/${user.role.toLowerCase().replace('_', '-')}`);
      } else {
        router.push('/login');
      }
    }
  }, [user, loading, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-zinc-100">
      <div className="text-center space-y-4">
        <div className="w-10 h-10 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-sm text-zinc-400 tracking-wider">Securing session connection...</p>
      </div>
    </div>
  );
}
