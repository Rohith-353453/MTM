import { HabitLog, StreakInfo } from '@/types';
import { format, subDays, parseISO, differenceInDays } from 'date-fns';

export function calculateStreak(logs: HabitLog[], habitId: string): StreakInfo {
  const completed = logs
    .filter((l) => l.habitId === habitId && l.completed)
    .map((l) => l.date)
    .sort()
    .reverse();

  if (completed.length === 0) {
    return { habitId, currentStreak: 0, bestStreak: 0, totalCompletions: 0 };
  }

  const totalCompletions = completed.length;
  const today = format(new Date(), 'yyyy-MM-dd');
  const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd');

  let currentStreak = 0;
  let bestStreak = 0;
  let tempStreak = 1;

  // Check if streak is active (last log is today or yesterday)
  const lastLog = completed[0];
  const isActive = lastLog === today || lastLog === yesterday;

  if (isActive) {
    currentStreak = 1;
    for (let i = 1; i < completed.length; i++) {
      const prev = parseISO(completed[i - 1]);
      const curr = parseISO(completed[i]);
      const diff = differenceInDays(prev, curr);
      if (diff === 1) {
        currentStreak++;
      } else {
        break;
      }
    }
  }

  // Calculate best streak across all history
  for (let i = 1; i < completed.length; i++) {
    const prev = parseISO(completed[i - 1]);
    const curr = parseISO(completed[i]);
    const diff = differenceInDays(prev, curr);
    if (diff === 1) {
      tempStreak++;
    } else {
      bestStreak = Math.max(bestStreak, tempStreak);
      tempStreak = 1;
    }
  }
  bestStreak = Math.max(bestStreak, tempStreak);

  return {
    habitId,
    currentStreak,
    bestStreak,
    totalCompletions,
    lastCompleted: lastLog,
  };
}

export function getHeatmapData(logs: HabitLog[], habitId: string) {
  const counts: Record<string, number> = {};
  logs
    .filter((l) => l.habitId === habitId && l.completed)
    .forEach((l) => {
      counts[l.date] = (counts[l.date] || 0) + 1;
    });
  return Object.entries(counts).map(([date, count]) => ({ date, count }));
}

export function getWeeklyCompletionRate(
  logs: HabitLog[],
  habits: { id: string }[],
  userId: string
): { day: string; rate: number }[] {
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = subDays(new Date(), 6 - i);
    return format(d, 'yyyy-MM-dd');
  });

  return days.map((date) => {
    const userLogs = logs.filter((l) => l.userId === userId && l.date === date && l.completed);
    const rate = habits.length === 0 ? 0 : Math.round((userLogs.length / habits.length) * 100);
    return { day: format(parseISO(date), 'EEE'), rate };
  });
}

export function getMonthlyCompletionRate(
  logs: HabitLog[],
  habits: { id: string }[],
  userId: string
): { month: string; rate: number }[] {
  return Array.from({ length: 6 }, (_, i) => {
    const d = subDays(new Date(), (5 - i) * 30);
    const monthStr = format(d, 'yyyy-MM');
    const monthLabel = format(d, 'MMM');
    const userLogs = logs.filter(
      (l) => l.userId === userId && l.date.startsWith(monthStr) && l.completed
    );
    const daysInMonth = 30;
    const maxPossible = habits.length * daysInMonth;
    const rate = maxPossible === 0 ? 0 : Math.min(100, Math.round((userLogs.length / maxPossible) * 100));
    return { month: monthLabel, rate };
  });
}

export function getCompletionScore(logs: HabitLog[], habits: { id: string }[], userId: string): number {
  if (habits.length === 0) return 0;
  const today = format(new Date(), 'yyyy-MM-dd');
  const todayLogs = logs.filter((l) => l.userId === userId && l.date === today && l.completed);
  return Math.round((todayLogs.length / habits.length) * 100);
}
