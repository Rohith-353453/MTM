'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { Sidebar } from '@/components/layout/Sidebar';
import { MobileNav } from '@/components/layout/MobileNav';
import { motion } from 'framer-motion';

type NavSection = 'tasks' | 'habits' | 'analytics' | 'notes';
type ActiveUser = 'a' | 'b';

export default function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const { workspace, loading: wsLoading } = useWorkspace();
  const router = useRouter();
  const [section, setSection] = useState<NavSection>('tasks');
  const [activeUser, setActiveUser] = useState<ActiveUser>('a');

  useEffect(() => {
    if (authLoading || wsLoading) return;
    if (!user) { router.replace('/auth/login'); return; }
    if (!workspace) { router.replace('/auth/setup'); return; }
  }, [user, workspace, authLoading, wsLoading, router]);

  if (authLoading || wsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 rounded-2xl bg-amber-400 flex items-center justify-center text-xl animate-pulse-ring">🚀</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#FAFAF9]">
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex">
        <Sidebar section={section} onSection={setSection} workspace={workspace} user={user} />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="flex-shrink-0 bg-white border-b border-stone-100 px-4 lg:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center text-sm shadow-sm">🚀</div>
            <div>
              <h1 className="font-bold text-stone-900 text-sm">{workspace?.name ?? 'DuoSpace'}</h1>
              <p className="text-xs text-stone-400 capitalize hidden sm:block">{section}</p>
            </div>
          </div>
          {/* User switcher (visible on all sizes) */}
          <div className="flex items-center gap-1 bg-stone-100 rounded-xl p-1">
            <button onClick={() => setActiveUser('a')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${activeUser === 'a' ? 'bg-indigo-500 text-white shadow-sm' : 'text-stone-500 hover:text-stone-700'}`}>
              <span>{workspace?.userA?.avatar ?? '🙂'}</span>
              <span className="hidden sm:inline">{workspace?.userA?.name ?? 'User A'}</span>
            </button>
            <button onClick={() => setActiveUser('b')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${activeUser === 'b' ? 'bg-pink-500 text-white shadow-sm' : 'text-stone-500 hover:text-stone-700'}`}>
              <span>{workspace?.userB?.avatar ?? '🙂'}</span>
              <span className="hidden sm:inline">{workspace?.userB?.name ?? 'User B'}</span>
            </button>
          </div>
        </header>

        {/* Page */}
        <main className="flex-1 overflow-y-auto pb-20 lg:pb-0">
          <WorkspacePageContent section={section} activeUser={activeUser} />
        </main>
      </div>

      {/* Mobile Bottom Nav */}
      <div className="lg:hidden">
        <MobileNav section={section} onSection={setSection} />
      </div>
    </div>
  );
}

function WorkspacePageContent({ section, activeUser }: { section: NavSection; activeUser: ActiveUser }) {
  const { workspace, tasks, habits, habitLogs } = useWorkspace();
  const { user: authUser } = useAuth();

  // Determine which userId to show based on activeUser
  const userAId = workspace?.userA?.uid;
  const userBId = workspace?.userB?.uid;
  const selectedUserId = activeUser === 'a' ? userAId : userBId;
  const selectedUserProfile = activeUser === 'a' ? workspace?.userA : workspace?.userB;
  const accentClass = activeUser === 'a' ? 'user-a-bar' : 'user-b-bar';

  if (!selectedUserId || !workspace) return null;

  return (
    <motion.div
      key={section + activeUser}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="p-4 lg:p-6 max-w-7xl mx-auto"
    >
      {/* User header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="relative">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-stone-100 to-stone-200 flex items-center justify-center text-2xl border border-stone-200">
            {selectedUserProfile?.avatar ?? '🙂'}
          </div>
          <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full ${accentClass}`} />
        </div>
        <div>
          <h2 className="font-bold text-stone-900 text-lg">{selectedUserProfile?.name ?? 'User'}&apos;s Space</h2>
          <p className="text-sm text-stone-500 capitalize">{section}</p>
        </div>
      </div>

      {/* Dynamic content */}
      {section === 'tasks' && (
        <TasksView
          workspaceId={workspace.id}
          userId={selectedUserId}
          tasks={tasks}
          accentClass={accentClass}
          activeUser={activeUser}
        />
      )}
      {section === 'habits' && (
        <HabitsView
          workspaceId={workspace.id}
          userId={selectedUserId}
          habits={habits.filter(h => h.userId === selectedUserId)}
          allHabits={habits}
          habitLogs={habitLogs}
          activeUser={activeUser}
        />
      )}
      {section === 'analytics' && (
        <AnalyticsView
          userId={selectedUserId}
          habits={habits.filter(h => h.userId === selectedUserId)}
          habitLogs={habitLogs}
          activeUser={activeUser}
        />
      )}
      {section === 'notes' && (
        <NotesView workspaceId={workspace.id} authUserId={authUser?.uid ?? ''} />
      )}
    </motion.div>
  );
}

// Lazy dynamic imports to avoid circular deps
import dynamic from 'next/dynamic';
const TasksView = dynamic(() => import('@/components/tasks/TasksView'));
const HabitsView = dynamic(() => import('@/components/habits/HabitsView'));
const AnalyticsView = dynamic(() => import('@/components/analytics/AnalyticsView'));
const NotesView = dynamic(() => import('@/components/shared/NotesView'));
