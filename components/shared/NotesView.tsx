'use client';

import { useState, useEffect, useRef } from 'react';
import { subscribeSharedNotes, updateSharedNotes } from '@/lib/firestore';
import { SharedNote } from '@/types';
import { FileText, Save } from 'lucide-react';
import { format } from 'date-fns';

interface NotesViewProps {
  workspaceId: string;
  authUserId: string;
}

export default function NotesView({ workspaceId, authUserId }: NotesViewProps) {
  const [note, setNote] = useState<SharedNote | null>(null);
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const saveTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const unsub = subscribeSharedNotes(workspaceId, (n) => {
      setNote(n);
      if (n && content === '') setContent(n.content);
    });
    return unsub;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId]);

  const handleChange = (value: string) => {
    setContent(value);
    setSaved(false);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      setSaving(true);
      await updateSharedNotes(workspaceId, value, authUserId);
      setSaving(false);
      setSaved(true);
    }, 1500);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText size={18} className="text-amber-500" />
          <h3 className="font-semibold text-stone-800">Shared Notes</h3>
        </div>
        <div className="flex items-center gap-2 text-xs text-stone-400">
          {saving && <span className="animate-pulse">Saving...</span>}
          {saved && !saving && <span className="text-emerald-500 flex items-center gap-1"><Save size={11} /> Saved</span>}
          {note?.updatedAt && (
            <span>Last edited {format(note.updatedAt.toDate(), 'MMM d, h:mm a')}</span>
          )}
        </div>
      </div>

      <div className="duo-card overflow-hidden">
        <div className="bg-amber-50 border-b border-amber-100 px-4 py-2 flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-300" />
            <div className="w-3 h-3 rounded-full bg-amber-300" />
            <div className="w-3 h-3 rounded-full bg-green-300" />
          </div>
          <p className="text-xs text-amber-600 font-medium ml-2">Shared workspace note — visible and editable by both users</p>
        </div>
        <textarea
          value={content}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="Write anything here... ideas, plans, reminders, grocery lists 🛒&#10;&#10;This note is shared between both of you and auto-saves as you type."
          className="w-full min-h-[500px] p-6 text-stone-700 text-sm leading-relaxed resize-none focus:outline-none bg-white font-mono"
        />
      </div>

      <p className="text-xs text-stone-400 text-center">✨ Auto-saves as you type · Shared between both users in real-time</p>
    </div>
  );
}
