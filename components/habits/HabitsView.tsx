'use client';

import { useState, useMemo } from 'react';
import { Habit, HabitLog } from '@/types';
import { createHabit, deleteHabit, toggleHabitLog } from '@/lib/firestore';
import { calculateStreak, getHeatmapData } from '@/lib/streaks';
import { todayStr } from '@/lib/utils';
import { Plus, Flame, Trash2, Trophy } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import CalendarHeatmap, { ReactCalendarHeatmapValue } from 'react-calendar-heatmap';
import 'react-calendar-heatmap/dist/styles.css';
import { subDays, format } from 'date-fns';

const HABIT_EMOJIS = ['☀️', '💧', '💻', '📚', '🏃', '🧘', '🎯', '✍️', '🎸', '🌿', '💤', '🍎'];
const HABIT_COLORS = ['#6366F1', '#EC4899', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6'];

interface HabitsViewProps {
  workspaceId: string;
  userId: string;
  habits: Habit[];
  allHabits: Habit[];
  habitLogs: HabitLog[];
  activeUser: 'a' | 'b';
}

export default function HabitsView({ workspaceId, userId, habits, habitLogs, activeUser }: HabitsViewProps) {
  const [showModal, setShowModal] = useState(false);
  const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null);
  const today = todayStr();

  const accentColor = activeUser === 'a' ? '#6366F1' : '#EC4899';

  const streaks = useMemo(() =>
    habits.map(h => calculateStreak(habitLogs, h.id)),
    [habits, habitLogs]
  );

  const bestStreak = useMemo(() =>
    streaks.reduce((max, s) => s.bestStreak > max ? s.bestStreak : max, 0),
    [streaks]
  );

  const todayLogMap = useMemo(() => {
    const map: Record<string, string> = {};
    habitLogs.filter(l => l.date === today && l.userId === userId && l.completed).forEach(l => { map[l.habitId] = l.id; });
    return map;
  }, [habitLogs, today, userId]);

  const handleToggle = async (habit: Habit) => {
    const existingId = todayLogMap[habit.id];
    await toggleHabitLog({ habitId: habit.id, userId, workspaceId, date: today, completed: true }, existingId);
  };

  return (
    <div className="space-y-6">
      {/* Best streak banner */}
      {bestStreak > 0 && (
        <div className="flex items-center gap-3 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-100 rounded-2xl p-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-400 flex items-center justify-center text-xl shadow-sm">🏆</div>
          <div>
            <p className="font-semibold text-amber-800">Best streak</p>
            <p className="text-amber-600 text-sm">{bestStreak} days in a row!</p>
          </div>
          <div className="ml-auto text-4xl font-black text-amber-300">{bestStreak}</div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-stone-800">My Habits</h3>
        <button onClick={() => setShowModal(true)}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl text-white text-sm font-medium transition-all active:scale-95`}
          style={{ background: accentColor }}>
          <Plus size={15} /> Add habit
        </button>
      </div>

      {/* Habits grid */}
      {habits.length === 0 ? (
        <div className="text-center py-16 text-stone-400">
          <div className="text-4xl mb-3">🌱</div>
          <p className="font-medium">No habits yet</p>
          <p className="text-sm mt-1">Add your first habit to start tracking</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <AnimatePresence>
            {habits.map((habit, idx) => {
              const streak = streaks[idx] ?? { currentStreak: 0, bestStreak: 0, totalCompletions: 0 };
              const done = !!todayLogMap[habit.id];
              return (
                <motion.div key={habit.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}>
                  <div className="duo-card p-4 group">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                          style={{ background: habit.color + '20', border: `2px solid ${habit.color}30` }}>
                          {habit.emoji}
                        </div>
                        <div>
                          <p className="font-semibold text-stone-800 text-sm">{habit.name}</p>
                          <div className="flex items-center gap-1 mt-0.5">
                            <Flame size={11} style={{ color: streak.currentStreak > 0 ? '#F59E0B' : '#D6D3D1' }} />
                            <span className="text-xs text-stone-400">{streak.currentStreak}d streak</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => handleToggle(habit)}
                          className={`w-7 h-7 rounded-full border-2 flex items-center justify-center text-sm transition-all ${done ? 'bg-emerald-400 border-emerald-400 text-white scale-110' : 'border-stone-200 hover:border-emerald-300'}`}>
                          {done ? '✓' : ''}
                        </button>
                        <button onClick={() => deleteHabit(habit.id)}
                          className="opacity-0 group-hover:opacity-100 text-stone-300 hover:text-red-400 transition-all">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                    {/* Mini stats */}
                    <div className="flex gap-4 text-center">
                      <div className="flex-1 bg-stone-50 rounded-xl py-2">
                        <p className="text-lg font-bold" style={{ color: habit.color }}>{streak.currentStreak}</p>
                        <p className="text-[10px] text-stone-400">Current</p>
                      </div>
                      <div className="flex-1 bg-stone-50 rounded-xl py-2">
                        <p className="text-lg font-bold text-amber-500">{streak.bestStreak}</p>
                        <p className="text-[10px] text-stone-400">Best</p>
                      </div>
                      <div className="flex-1 bg-stone-50 rounded-xl py-2">
                        <p className="text-lg font-bold text-stone-600">{streak.totalCompletions}</p>
                        <p className="text-[10px] text-stone-400">Total</p>
                      </div>
                    </div>
                    {/* View heatmap */}
                    <button onClick={() => setSelectedHabit(selectedHabit?.id === habit.id ? null : habit)}
                      className="w-full mt-3 text-xs text-stone-400 hover:text-stone-600 py-1 rounded-lg hover:bg-stone-50 transition-all">
                      {selectedHabit?.id === habit.id ? 'Hide history ▲' : 'Show history ▼'}
                    </button>
                    {selectedHabit?.id === habit.id && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-3 overflow-hidden">
                        <HeatmapView habit={habit} habitLogs={habitLogs} />
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Create habit modal */}
      <AnimatePresence>
        {showModal && (
          <HabitModal
            onClose={() => setShowModal(false)}
            onCreate={async (data) => {
              await createHabit({ workspaceId, userId, name: data.name, emoji: data.emoji, color: data.color });
              setShowModal(false);
            }}
            activeUser={activeUser}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function HeatmapView({ habit, habitLogs }: { habit: Habit; habitLogs: HabitLog[] }) {
  const data = getHeatmapData(habitLogs, habit.id);
  const endDate = new Date();
  const startDate = subDays(endDate, 90);

  return (
    <div className="bg-stone-50 rounded-xl p-3">
      <p className="text-xs text-stone-400 mb-2">Last 3 months</p>
      <CalendarHeatmap
        startDate={startDate}
        endDate={endDate}
        values={data}
        classForValue={(value: ReactCalendarHeatmapValue<string> | undefined) => {
          if (!value || value.count === 0) return 'color-empty';
          return `color-scale-${Math.min(value.count, 4)}`;
        }}
        showWeekdayLabels
        gutterSize={2}
      />
    </div>
  );
}

function HabitModal({ onClose, onCreate, activeUser }: {
  onClose: () => void;
  onCreate: (data: { name: string; emoji: string; color: string }) => void;
  activeUser: 'a' | 'b';
}) {
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('☀️');
  const [color, setColor] = useState(HABIT_COLORS[0]);
  const accentBg = activeUser === 'a' ? 'from-indigo-500 to-indigo-600' : 'from-pink-500 to-pink-600';

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <motion.div initial={{ y: 50 }} animate={{ y: 0 }} exit={{ y: 50 }}
        className="duo-card w-full max-w-md p-6">
        <h3 className="font-semibold text-stone-900 mb-4">New Habit</h3>
        <div className="space-y-4">
          <input type="text" placeholder="Habit name *" value={name} onChange={e => setName(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
          <div>
            <p className="text-xs text-stone-500 mb-2">Pick an emoji</p>
            <div className="flex flex-wrap gap-2">
              {HABIT_EMOJIS.map(e => (
                <button key={e} onClick={() => setEmoji(e)}
                  className={`text-xl p-2 rounded-xl transition-all hover:scale-110 ${emoji === e ? 'bg-amber-100 ring-2 ring-amber-400' : 'bg-stone-50 hover:bg-stone-100'}`}>
                  {e}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs text-stone-500 mb-2">Color</p>
            <div className="flex gap-2">
              {HABIT_COLORS.map(c => (
                <button key={c} onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-full transition-all hover:scale-110 ${color === c ? 'ring-2 ring-offset-2 ring-stone-400 scale-110' : ''}`}
                  style={{ background: c }} />
              ))}
            </div>
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-stone-200 text-stone-600 text-sm font-medium">Cancel</button>
          <button onClick={() => name.trim() && onCreate({ name: name.trim(), emoji, color })} disabled={!name.trim()}
            className={`flex-1 py-2.5 rounded-xl bg-gradient-to-r ${accentBg} text-white text-sm font-semibold disabled:opacity-60`}>
            Add habit
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
