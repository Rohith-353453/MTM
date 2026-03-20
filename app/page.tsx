'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkspace } from '@/contexts/WorkspaceContext';

export default function HomePage() {
  const { user, loading: authLoading } = useAuth();
  const { workspace, loading: wsLoading } = useWorkspace();
  const router = useRouter();

  useEffect(() => {
    if (authLoading || wsLoading) return;
    if (!user) { router.replace('/auth/login'); return; }
    if (!workspace) { router.replace('/auth/setup'); return; }
    if (!workspace.userB) { router.replace('/auth/invite'); return; }
    router.replace('/workspace');
  }, [user, workspace, authLoading, wsLoading, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-amber-400 flex items-center justify-center text-2xl shadow-lg animate-pulse-ring">
          🚀
        </div>
        <p className="text-stone-500 text-sm font-medium">Loading DuoSpace...</p>
      </div>
    </div>
  );
}
