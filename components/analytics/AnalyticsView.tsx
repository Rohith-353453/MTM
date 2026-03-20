'use client';

import { useMemo } from 'react';
import { Habit, HabitLog } from '@/types';
import { getWeeklyCompletionRate, getMonthlyCompletionRate, getCompletionScore, calculateStreak } from '@/lib/streaks';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { Flame, Target, Trophy, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';

interface AnalyticsViewProps {
  userId: string;
  habits: Habit[];
  habitLogs: HabitLog[];
  activeUser: 'a' | 'b';
}

export default function AnalyticsView({ userId, habits, habitLogs, activeUser }: AnalyticsViewProps) {
  const accentColor = activeUser === 'a' ? '#6366F1' : '#EC4899';
  const accentLight = activeUser === 'a' ? '#EEF2FF' : '#FDF2F8';

  const score = useMemo(() => getCompletionScore(habitLogs, habits, userId), [habitLogs, habits, userId]);
  const weeklyData = useMemo(() => getWeeklyCompletionRate(habitLogs, habits, userId), [habitLogs, habits, userId]);
  const monthlyData = useMemo(() => getMonthlyCompletionRate(habitLogs, habits, userId), [habitLogs, habits, userId]);

  const allStreaks = useMemo(() => habits.map(h => ({
    habit: h,
    streak: calculateStreak(habitLogs, h.id),
  })).sort((a, b) => b.streak.bestStreak - a.streak.bestStreak), [habits, habitLogs]);

  const totalCompletions = useMemo(() =>
    habitLogs.filter(l => l.userId === userId && l.completed).length,
    [habitLogs, userId]
  );

  const activeStreaks = useMemo(() =>
    allStreaks.filter(s => s.streak.currentStreak > 0).length,
    [allStreaks]
  );

  return (
    <div className="space-y-6">
      {/* Score cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          icon={<Target size={20} style={{ color: accentColor }} />}
          label="Today's Score"
          value={`${score}%`}
          bg={accentLight}
          color={accentColor}
        />
        <StatCard
          icon={<Flame size={20} className="text-amber-500" />}
          label="Active Streaks"
          value={String(activeStreaks)}
          bg="#FEF3C7"
          color="#F59E0B"
        />
        <StatCard
          icon={<Trophy size={20} className="text-emerald-500" />}
          label="Total Habits"
          value={String(habits.length)}
          bg="#ECFDF5"
          color="#10B981"
        />
        <StatCard
          icon={<TrendingUp size={20} className="text-blue-500" />}
          label="All-time Done"
          value={String(totalCompletions)}
          bg="#EFF6FF"
          color="#3B82F6"
        />
      </div>

      {/* Score donut */}
      <div className="duo-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-stone-800">Today&apos;s Completion</h3>
          <span className="text-xs text-stone-400">{format(new Date(), 'EEEE, MMM d')}</span>
        </div>
        <div className="flex items-center gap-6">
          <div className="relative w-24 h-24 shrink-0">
            <svg viewBox="0 0 36 36" className="w-24 h-24 -rotate-90">
              <circle cx="18" cy="18" r="15.9155" fill="none" stroke="#F5F5F4" strokeWidth="3" />
              <circle cx="18" cy="18" r="15.9155" fill="none" stroke={accentColor} strokeWidth="3"
                strokeDasharray={`${score} ${100 - score}`} strokeLinecap="round" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xl font-black" style={{ color: accentColor }}>{score}%</span>
            </div>
          </div>
          <div className="flex-1 space-y-2">
            {habits.slice(0, 4).map(h => {
              const logs = habitLogs.filter(l => l.habitId === h.id && l.userId === userId && l.date === format(new Date(), 'yyyy-MM-dd') && l.completed);
              return (
                <div key={h.id} className="flex items-center gap-2 text-sm">
                  <span>{h.emoji}</span>
                  <span className="text-stone-600 flex-1 truncate">{h.name}</span>
                  <span className={`text-xs font-medium ${logs.length > 0 ? 'text-emerald-500' : 'text-stone-300'}`}>
                    {logs.length > 0 ? '✓' : '○'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Weekly chart */}
      <div className="duo-card p-6">
        <h3 className="font-semibold text-stone-800 mb-4">Weekly Progress</h3>
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={weeklyData}>
            <defs>
              <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={accentColor} stopOpacity={0.2} />
                <stop offset="95%" stopColor={accentColor} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#F5F5F4" />
            <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#A8A29E' }} axisLine={false} tickLine={false} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#A8A29E' }} axisLine={false} tickLine={false} unit="%" />
            <Tooltip formatter={(v) => [`${v}%`, 'Completion']}
              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontSize: 12 }} />
            <Area type="monotone" dataKey="rate" stroke={accentColor} strokeWidth={2.5} fill="url(#areaGrad)" dot={{ r: 4, fill: accentColor }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Monthly chart */}
      <div className="duo-card p-6">
        <h3 className="font-semibold text-stone-800 mb-4">6-Month History</h3>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={monthlyData} barSize={32}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F5F5F4" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#A8A29E' }} axisLine={false} tickLine={false} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#A8A29E' }} axisLine={false} tickLine={false} unit="%" />
            <Tooltip formatter={(v) => [`${v}%`, 'Completion']}
              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontSize: 12 }} />
            <Bar dataKey="rate" radius={[8, 8, 0, 0]}>
              {monthlyData.map((_, i) => <Cell key={i} fill={i === 5 ? accentColor : accentColor + '60'} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Streak leaderboard */}
      {allStreaks.length > 0 && (
        <div className="duo-card p-6">
          <h3 className="font-semibold text-stone-800 mb-4">Streak Highlights</h3>
          <div className="space-y-3">
            {allStreaks.slice(0, 5).map(({ habit, streak }, idx) => (
              <div key={habit.id} className="flex items-center gap-3">
                <span className="text-xs text-stone-300 font-bold w-4">#{idx + 1}</span>
                <div className="w-8 h-8 rounded-xl flex items-center justify-center text-lg"
                  style={{ background: habit.color + '20' }}>
                  {habit.emoji}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-stone-700">{habit.name}</p>
                  <div className="h-2 bg-stone-100 rounded-full mt-1 overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${Math.min(100, (streak.bestStreak / 30) * 100)}%`, background: accentColor }} />
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold" style={{ color: accentColor }}>{streak.currentStreak}d</p>
                  <p className="text-[10px] text-stone-400">best: {streak.bestStreak}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, bg, color }: { icon: React.ReactNode; label: string; value: string; bg: string; color: string }) {
  return (
    <div className="duo-card p-4">
      <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ background: bg }}>
        {icon}
      </div>
      <p className="text-2xl font-black" style={{ color }}>{value}</p>
      <p className="text-xs text-stone-400 mt-0.5">{label}</p>
    </div>
  );
}
