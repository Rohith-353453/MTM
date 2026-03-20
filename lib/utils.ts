import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, parseISO } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateStr: string): string {
  return format(parseISO(dateStr), 'MMM d, yyyy');
}

export function todayStr(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

export function getWeekDays(): string[] {
  const start = startOfWeek(new Date(), { weekStartsOn: 1 });
  const end = endOfWeek(new Date(), { weekStartsOn: 1 });
  return eachDayOfInterval({ start, end }).map((d) => format(d, 'yyyy-MM-dd'));
}

export function generateInviteCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export function getPriorityColor(priority: string): string {
  switch (priority) {
    case 'high': return 'text-red-500 bg-red-50';
    case 'medium': return 'text-amber-500 bg-amber-50';
    case 'low': return 'text-emerald-500 bg-emerald-50';
    default: return 'text-gray-500 bg-gray-50';
  }
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'completed': return 'text-emerald-600 bg-emerald-50';
    case 'inprogress': return 'text-blue-600 bg-blue-50';
    case 'pending': return 'text-gray-500 bg-gray-50';
    default: return 'text-gray-500 bg-gray-50';
  }
}

export function downloadCSV(data: Record<string, unknown>[], filename: string) {
  if (!data.length) return;
  const headers = Object.keys(data[0]);
  const rows = data.map((row) =>
    headers.map((h) => JSON.stringify(row[h] ?? '')).join(',')
  );
  const csv = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
