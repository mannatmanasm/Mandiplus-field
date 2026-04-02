'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/AuthContext';

export default function HomeRedirectPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    router.replace(user ? '/field' : '/login');
  }, [loading, router, user]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f7f3ea] text-sm text-slate-600">
      Opening field app...
    </div>
  );
}

