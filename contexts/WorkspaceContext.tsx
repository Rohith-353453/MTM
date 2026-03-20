'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Workspace, Task, Habit, HabitLog } from '@/types';
import {
  subscribeWorkspace, subscribeTasks, subscribeHabits,
  subscribeHabitLogs, getUserWorkspace,
} from '@/lib/firestore';
import { useAuth } from './AuthContext';

interface WorkspaceContextValue {
  workspace: Workspace | null;
  tasks: Task[];
  habits: Habit[];
  habitLogs: HabitLog[];
  loading: boolean;
  refetchWorkspace: () => void;
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [habitLogs, setHabitLogs] = useState<HabitLog[]>([]);
  const [loading, setLoading] = useState(true);

  const loadWorkspace = async () => {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    const ws = await getUserWorkspace(user.uid);
    if (ws) setWorkspace(ws);
    setLoading(false);
  };

  useEffect(() => {
    loadWorkspace();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    if (!workspace) return;
    const unsubWs = subscribeWorkspace(workspace.id, setWorkspace);
    const unsubTasks = subscribeTasks(workspace.id, setTasks);
    const unsubHabits = subscribeHabits(workspace.id, setHabits);
    const unsubLogs = subscribeHabitLogs(workspace.id, setHabitLogs);
    return () => { unsubWs(); unsubTasks(); unsubHabits(); unsubLogs(); };
  }, [workspace?.id]);

  return (
    <WorkspaceContext.Provider value={{ workspace, tasks, habits, habitLogs, loading, refetchWorkspace: loadWorkspace }}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error('useWorkspace must be used within WorkspaceProvider');
  return ctx;
}
