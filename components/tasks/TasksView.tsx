'use client';

import { useState, useMemo } from 'react';
import { Task, TimeFilter, TaskStatus } from '@/types';
import { createTask, updateTask, deleteTask } from '@/lib/firestore';
import { format } from 'date-fns';
import {
  DndContext, DragEndEvent, DragOverEvent, PointerSensor,
  useSensor, useSensors, DragOverlay, DragStartEvent, closestCorners,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Plus, Calendar, Tag, GripVertical, Trash2, Clock } from 'lucide-react';
import { getPriorityColor, getStatusColor, cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

const TIME_FILTERS: { id: TimeFilter; label: string }[] = [
  { id: 'daily', label: 'Today' },
  { id: 'weekly', label: 'This Week' },
  { id: 'monthly', label: 'This Month' },
  { id: 'yearly', label: 'This Year' },
];

const COLUMNS: { id: TaskStatus; label: string; color: string }[] = [
  { id: 'pending', label: 'Pending', color: 'bg-stone-100 text-stone-600' },
  { id: 'inprogress', label: 'In Progress', color: 'bg-blue-50 text-blue-600' },
  { id: 'completed', label: 'Completed', color: 'bg-emerald-50 text-emerald-600' },
];

interface TasksViewProps {
  workspaceId: string;
  userId: string;
  tasks: Task[];
  accentClass: string;
  activeUser: 'a' | 'b';
}

export default function TasksView({ workspaceId, userId, tasks, activeUser }: TasksViewProps) {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('weekly');
  const [showModal, setShowModal] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [spaceFilter, setSpaceFilter] = useState<'professional' | 'personal'>('professional');

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const filteredTasks = useMemo(() =>
    tasks.filter(t => t.userId === userId && t.timeFilter === timeFilter && t.space === spaceFilter),
    [tasks, userId, timeFilter, spaceFilter]
  );

  const byStatus = (status: TaskStatus) =>
    filteredTasks.filter(t => t.status === status).sort((a, b) => a.order - b.order);

  const handleDragStart = (e: DragStartEvent) => setActiveId(e.active.id as string);

  const handleDragEnd = async (e: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const activeTask = filteredTasks.find(t => t.id === active.id);
    const overTask = filteredTasks.find(t => t.id === over.id);
    if (!activeTask) return;
    const newStatus = overTask?.status ?? (over.id as string).replace('col-', '') as TaskStatus;
    await updateTask(activeTask.id, { status: newStatus as TaskStatus, order: overTask?.order ?? 999 });
  };

  const handleDragOver = async (e: DragOverEvent) => {
    const { active, over } = e;
    if (!over) return;
    const overId = over.id as string;
    if (overId.startsWith('col-')) {
      const status = overId.replace('col-', '') as TaskStatus;
      const activeTask = filteredTasks.find(t => t.id === active.id);
      if (activeTask && activeTask.status !== status) {
        await updateTask(activeTask.id, { status });
      }
    }
  };

  const activeTask = activeId ? filteredTasks.find(t => t.id === activeId) : null;
  const accentRing = activeUser === 'a' ? 'ring-indigo-400' : 'ring-pink-400';

  return (
    <div>
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        {/* Space toggle */}
        <div className="flex gap-1 bg-stone-100 rounded-xl p-1">
          {(['professional', 'personal'] as const).map(s => (
            <button key={s} onClick={() => setSpaceFilter(s)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all capitalize ${spaceFilter === s ? 'bg-white shadow-sm text-stone-800' : 'text-stone-500 hover:text-stone-700'}`}>
              {s === 'professional' ? '💼 Professional' : '🏠 Personal'}
            </button>
          ))}
        </div>
        {/* Time filter */}
        <div className="flex gap-1 bg-stone-100 rounded-xl p-1 overflow-x-auto">
          {TIME_FILTERS.map(f => (
            <button key={f.id} onClick={() => setTimeFilter(f.id)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${timeFilter === f.id ? 'bg-white shadow-sm text-stone-800' : 'text-stone-500 hover:text-stone-700'}`}>
              {f.label}
            </button>
          ))}
        </div>
        <button onClick={() => setShowModal(true)}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-white font-medium text-sm shadow-sm transition-all hover:shadow-md active:scale-95 ml-auto ${activeUser === 'a' ? 'bg-indigo-500 hover:bg-indigo-600' : 'bg-pink-500 hover:bg-pink-600'}`}>
          <Plus size={16} /> New task
        </button>
      </div>

      {/* Kanban */}
      <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd} onDragOver={handleDragOver}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {COLUMNS.map(col => (
            <div key={col.id} id={`col-${col.id}`} className="bg-stone-50 rounded-2xl p-4 min-h-[300px]">
              <div className="flex items-center justify-between mb-3">
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${col.color}`}>{col.label}</span>
                <span className="text-xs text-stone-400 font-medium">{byStatus(col.id).length}</span>
              </div>
              <SortableContext items={byStatus(col.id).map(t => t.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-2">
                  <AnimatePresence>
                    {byStatus(col.id).map(task => (
                      <SortableTaskCard key={task.id} task={task} accentRing={accentRing} />
                    ))}
                  </AnimatePresence>
                  {byStatus(col.id).length === 0 && (
                    <div className="text-center py-8 text-stone-300 text-sm">Drop tasks here</div>
                  )}
                </div>
              </SortableContext>
            </div>
          ))}
        </div>
        <DragOverlay>
          {activeTask && <TaskCard task={activeTask} isDragging />}
        </DragOverlay>
      </DndContext>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <TaskModal
            onClose={() => setShowModal(false)}
            onCreate={async (data) => {
              await createTask({
                ...data, workspaceId, userId, space: spaceFilter,
                timeFilter, status: 'pending', order: Date.now(),
              });
              setShowModal(false);
            }}
            activeUser={activeUser}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function SortableTaskCard({ task, accentRing }: { task: Task; accentRing: string }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 };
  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <TaskCard task={task} dragListeners={listeners} accentRing={accentRing} />
    </div>
  );
}

function TaskCard({ task, dragListeners, isDragging, accentRing }: {
  task: Task; dragListeners?: Record<string, unknown>; isDragging?: boolean; accentRing?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
      className={cn('duo-card p-3 group cursor-grab active:cursor-grabbing', isDragging && 'shadow-xl', accentRing && `focus-within:ring-2 ${accentRing}`)}>
      <div className="flex items-start gap-2">
        <button {...dragListeners} className="mt-0.5 text-stone-300 hover:text-stone-500 shrink-0 cursor-grab">
          <GripVertical size={14} />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-stone-800 truncate">{task.title}</p>
          {task.description && <p className="text-xs text-stone-400 mt-0.5 line-clamp-2">{task.description}</p>}
          <div className="flex flex-wrap gap-1.5 mt-2">
            <span className={cn('text-[10px] font-medium px-2 py-0.5 rounded-full capitalize', getPriorityColor(task.priority))}>
              {task.priority}
            </span>
            <select
              value={task.status}
              onChange={(e) => updateTask(task.id, { status: e.target.value as TaskStatus })}
              className="text-[10px] font-medium px-2 py-0.5 rounded-full capitalize bg-stone-100 text-stone-600 border-none outline-none cursor-pointer hover:bg-stone-200 appearance-none text-center"
            >
              <option value="pending">Pending</option>
              <option value="inprogress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
            {task.dueDate && (
              <span className="text-[10px] text-stone-400 flex items-center gap-1">
                <Calendar size={10} />{format(new Date(task.dueDate + 'T00:00:00'), 'MMM d')}
              </span>
            )}
            {task.tags?.map(tag => (
              <span key={tag} className="text-[10px] bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                <Tag size={9} />{tag}
              </span>
            ))}
          </div>
        </div>
        <button onClick={() => deleteTask(task.id)} className="opacity-0 group-hover:opacity-100 text-stone-300 hover:text-red-400 transition-all shrink-0">
          <Trash2 size={13} />
        </button>
      </div>
    </motion.div>
  );
}

function TaskModal({ onClose, onCreate, activeUser }: {
  onClose: () => void;
  onCreate: (data: { title: string; description?: string; priority: Task['priority']; dueDate?: string; tags: string[] }) => void;
  activeUser: 'a' | 'b';
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Task['priority']>('medium');
  const [dueDate, setDueDate] = useState('');
  const [tags, setTags] = useState('');
  const accentBg = activeUser === 'a' ? 'from-indigo-500 to-indigo-600' : 'from-pink-500 to-pink-600';

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }}
        className="duo-card w-full max-w-md p-6">
        <h3 className="font-semibold text-stone-900 mb-4">New Task</h3>
        <div className="space-y-4">
          <input type="text" placeholder="Task title *" value={title} onChange={e => setTitle(e.target.value)} required
            className="w-full px-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
          <textarea placeholder="Description (optional)" value={description} onChange={e => setDescription(e.target.value)} rows={2}
            className="w-full px-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-400" />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-stone-500 mb-1 block">Priority</label>
              <select value={priority} onChange={e => setPriority(e.target.value as Task['priority'])}
                className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-stone-50 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400">
                <option value="low">🟢 Low</option>
                <option value="medium">🟡 Medium</option>
                <option value="high">🔴 High</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-stone-500 mb-1 block">Due date</label>
              <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-stone-50 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
            </div>
          </div>
          <input type="text" placeholder="Tags (comma separated)" value={tags} onChange={e => setTags(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-stone-200 text-stone-600 text-sm font-medium hover:bg-stone-50">Cancel</button>
          <button onClick={() => title.trim() && onCreate({ title: title.trim(), description, priority, dueDate: dueDate || undefined, tags: tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : [] })}
            disabled={!title.trim()}
            className={`flex-1 py-2.5 rounded-xl bg-gradient-to-r ${accentBg} text-white text-sm font-semibold disabled:opacity-60`}>
            Create task
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
