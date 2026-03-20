import { Timestamp } from 'firebase/firestore';

export type Priority = 'low' | 'medium' | 'high';
export type TaskStatus = 'pending' | 'inprogress' | 'completed';
export type TimeFilter = 'daily' | 'weekly' | 'monthly' | 'yearly';
export type SpaceType = 'professional' | 'personal';

export interface UserProfile {
  uid: string;
  name: string;
  avatar?: string; // emoji or URL
  color: string; // accent color for this user
}

export interface Workspace {
  id: string;
  name: string;
  userA: UserProfile;
  userB: UserProfile | null; // null until user B joins
  inviteCode: string;
  createdAt: Timestamp;
}

export interface Task {
  id: string;
  workspaceId: string;
  userId: string; // which user owns this task
  space: SpaceType;
  title: string;
  description?: string;
  tags: string[];
  priority: Priority;
  dueDate?: string; // ISO date string YYYY-MM-DD
  status: TaskStatus;
  timeFilter: TimeFilter;
  order: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Habit {
  id: string;
  workspaceId: string;
  userId: string;
  name: string;
  emoji: string;
  color: string;
  createdAt: Timestamp;
}

export interface HabitLog {
  id: string;
  habitId: string;
  userId: string;
  workspaceId: string;
  date: string; // YYYY-MM-DD
  completed: boolean;
}

export interface SharedNote {
  workspaceId: string;
  content: string;
  updatedAt: Timestamp;
  updatedBy: string; // uid
}

export interface StreakInfo {
  habitId: string;
  currentStreak: number;
  bestStreak: number;
  totalCompletions: number;
  lastCompleted?: string; // YYYY-MM-DD
}
