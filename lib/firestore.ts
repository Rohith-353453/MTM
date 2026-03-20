import {
  collection, doc, addDoc, updateDoc, deleteDoc, onSnapshot,
  query, where, orderBy, getDoc, setDoc, Timestamp, writeBatch,
  getDocs,
} from 'firebase/firestore';
import { db } from './firebase';
import { Task, Habit, HabitLog, Workspace, SharedNote } from '@/types';
import { generateInviteCode } from './utils';

// ─── Workspaces ───────────────────────────────────────────────

export async function createWorkspace(userA: { uid: string; name: string; avatar?: string }) {
  const inviteCode = generateInviteCode();
  const wsRef = doc(collection(db, 'workspaces'));
  await setDoc(wsRef, {
    name: `${userA.name}'s Space`,
    userA: { uid: userA.uid, name: userA.name, avatar: userA.avatar ?? '🙂', color: '#6366F1' },
    userB: null,
    inviteCode,
    createdAt: Timestamp.now(),
  });
  return { id: wsRef.id, inviteCode };
}

export async function getWorkspaceByInviteCode(code: string): Promise<Workspace | null> {
  const q = query(
    collection(db, 'workspaces'),
    where('inviteCode', '==', code),
    where('userB', '==', null)
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...d.data() } as Workspace;
}

export async function getUserWorkspace(uid: string): Promise<Workspace | null> {
  const qA = query(collection(db, 'workspaces'), where('userA.uid', '==', uid));
  const snapA = await getDocs(qA);
  if (!snapA.empty) return { id: snapA.docs[0].id, ...snapA.docs[0].data() } as Workspace;
  const qB = query(collection(db, 'workspaces'), where('userB.uid', '==', uid));
  const snapB = await getDocs(qB);
  if (!snapB.empty) return { id: snapB.docs[0].id, ...snapB.docs[0].data() } as Workspace;
  return null;
}

export async function joinWorkspace(workspaceId: string, userB: { uid: string; name: string; avatar?: string }) {
  await updateDoc(doc(db, 'workspaces', workspaceId), {
    userB: { uid: userB.uid, name: userB.name, avatar: userB.avatar ?? '🙂', color: '#EC4899' },
  });
}

export function subscribeWorkspace(workspaceId: string, cb: (ws: Workspace) => void) {
  return onSnapshot(doc(db, 'workspaces', workspaceId), (snap) => {
    if (snap.exists()) cb({ id: snap.id, ...snap.data() } as Workspace);
  });
}

// ─── Tasks ────────────────────────────────────────────────────

export function subscribeTasks(workspaceId: string, cb: (tasks: Task[]) => void) {
  const q = query(
    collection(db, 'tasks'),
    where('workspaceId', '==', workspaceId),
    orderBy('order')
  );
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Task)));
  });
}

export async function createTask(task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) {
  const cleanTask = Object.fromEntries(Object.entries(task).filter(([_, v]) => v !== undefined));
  await addDoc(collection(db, 'tasks'), {
    ...cleanTask,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
}

export async function updateTask(id: string, data: Partial<Task>) {
  await updateDoc(doc(db, 'tasks', id), { ...data, updatedAt: Timestamp.now() });
}

export async function deleteTask(id: string) {
  await deleteDoc(doc(db, 'tasks', id));
}

export async function reorderTasks(updates: { id: string; order: number; status: Task['status'] }[]) {
  const batch = writeBatch(db);
  updates.forEach(({ id, order, status }) => {
    batch.update(doc(db, 'tasks', id), { order, status, updatedAt: Timestamp.now() });
  });
  await batch.commit();
}

// ─── Habits ───────────────────────────────────────────────────

export function subscribeHabits(workspaceId: string, cb: (habits: Habit[]) => void) {
  const q = query(collection(db, 'habits'), where('workspaceId', '==', workspaceId));
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Habit)));
  });
}

export async function createHabit(habit: Omit<Habit, 'id' | 'createdAt'>) {
  const cleanHabit = Object.fromEntries(Object.entries(habit).filter(([_, v]) => v !== undefined));
  await addDoc(collection(db, 'habits'), { ...cleanHabit, createdAt: Timestamp.now() });
}

export async function deleteHabit(id: string) {
  await deleteDoc(doc(db, 'habits', id));
}

// ─── Habit Logs ───────────────────────────────────────────────

export function subscribeHabitLogs(workspaceId: string, cb: (logs: HabitLog[]) => void) {
  const q = query(collection(db, 'habitLogs'), where('workspaceId', '==', workspaceId));
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, ...d.data() } as HabitLog)));
  });
}

export async function toggleHabitLog(log: Omit<HabitLog, 'id'>, existingId?: string) {
  if (existingId) {
    await deleteDoc(doc(db, 'habitLogs', existingId));
  } else {
    await addDoc(collection(db, 'habitLogs'), { ...log, completed: true });
  }
}

// ─── Shared Notes ─────────────────────────────────────────────

export function subscribeSharedNotes(workspaceId: string, cb: (note: SharedNote | null) => void) {
  return onSnapshot(doc(db, 'sharedNotes', workspaceId), (snap) => {
    cb(snap.exists() ? ({ workspaceId, ...snap.data() } as SharedNote) : null);
  });
}

export async function updateSharedNotes(workspaceId: string, content: string, uid: string) {
  await setDoc(doc(db, 'sharedNotes', workspaceId), {
    content,
    updatedAt: Timestamp.now(),
    updatedBy: uid,
  });
}
