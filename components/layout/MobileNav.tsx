'use client';

import { LayoutGrid, Flame, BarChart2, FileText } from 'lucide-react';

type NavSection = 'tasks' | 'habits' | 'analytics' | 'notes';

const navItems = [
  { id: 'tasks' as NavSection, label: 'Tasks', icon: LayoutGrid },
  { id: 'habits' as NavSection, label: 'Habits', icon: Flame },
  { id: 'analytics' as NavSection, label: 'Analytics', icon: BarChart2 },
  { id: 'notes' as NavSection, label: 'Notes', icon: FileText },
];

export function MobileNav({ section, onSection }: { section: NavSection; onSection: (s: NavSection) => void }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-stone-100 safe-bottom z-50 lg:hidden">
      <div className="flex">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = section === item.id;
          return (
            <button key={item.id} onClick={() => onSection(item.id)}
              className={`flex-1 flex flex-col items-center gap-0.5 py-3 text-xs font-medium transition-all ${active ? 'text-amber-600' : 'text-stone-400 hover:text-stone-600'}`}>
              <Icon size={20} className={active ? 'scale-110' : ''} />
              <span className="text-[10px]">{item.label}</span>
              {active && <div className="w-1 h-1 rounded-full bg-amber-500 mt-0.5" />}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
