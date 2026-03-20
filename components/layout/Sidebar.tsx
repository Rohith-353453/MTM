'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { useRouter } from 'next/navigation';
import { Workspace } from '@/types';
import { User } from 'firebase/auth';
import { LayoutGrid, Flame, BarChart2, FileText, LogOut } from 'lucide-react';

type NavSection = 'tasks' | 'habits' | 'analytics' | 'notes';

interface SidebarProps {
  section: NavSection;
  onSection: (s: NavSection) => void;
  workspace: Workspace | null;
  user: User | null;
}

const navItems: { id: NavSection; label: string; icon: React.ReactNode }[] = [
  { id: 'tasks', label: 'Tasks', icon: <LayoutGrid size={18} /> },
  { id: 'habits', label: 'Habits', icon: <Flame size={18} /> },
  { id: 'analytics', label: 'Analytics', icon: <BarChart2 size={18} /> },
  { id: 'notes', label: 'Notes', icon: <FileText size={18} /> },
];

export function Sidebar({ section, onSection, workspace, user }: SidebarProps) {
  const { logOut } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logOut();
    router.push('/auth/login');
  };

  return (
    <aside className="w-64 bg-white border-r border-stone-100 flex flex-col h-full">
      {/* Logo */}
      <div className="p-5 border-b border-stone-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center text-lg shadow-sm">🚀</div>
          <div>
            <p className="font-bold text-stone-900 text-sm">DuoSpace</p>
            <p className="text-xs text-stone-400 truncate max-w-[140px]">{workspace?.name}</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1">
        <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-widest px-3 mb-3">Workspace</p>
        {navItems.map((item) => (
          <button key={item.id} onClick={() => onSection(item.id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
              section === item.id
                ? 'bg-amber-50 text-amber-700 shadow-sm'
                : 'text-stone-500 hover:bg-stone-50 hover:text-stone-700'
            }`}>
            <span className={section === item.id ? 'text-amber-500' : 'text-stone-400'}>{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>

      {/* Users */}
      <div className="p-4 border-t border-stone-100 space-y-2">
        {workspace?.userA && (
          <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-indigo-50">
            <span className="text-xl">{workspace.userA.avatar}</span>
            <div>
              <p className="text-xs font-semibold text-indigo-700">{workspace.userA.name}</p>
              <p className="text-[10px] text-indigo-400">User A</p>
            </div>
          </div>
        )}
        {workspace?.userB && (
          <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-pink-50">
            <span className="text-xl">{workspace.userB.avatar}</span>
            <div>
              <p className="text-xs font-semibold text-pink-700">{workspace.userB.name}</p>
              <p className="text-[10px] text-pink-400">User B</p>
            </div>
          </div>
        )}
        <button onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-stone-400 hover:text-red-500 hover:bg-red-50 transition-all mt-2">
          <LogOut size={14} />
          Sign out
        </button>
      </div>
    </aside>
  );
}
