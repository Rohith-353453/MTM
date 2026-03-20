'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { createWorkspace } from '@/lib/firestore';
import { motion } from 'framer-motion';

const AVATARS = ['🙂', '😎', '🦁', '🐼', '🦊', '🐸', '🦋', '🌟', '🔥', '❄️', '🌙', '☀️'];

export default function SetupPage() {
  const { user } = useAuth();
  const { refetchWorkspace } = useWorkspace();
  const router = useRouter();
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState('🙂');
  const [loading, setLoading] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !name.trim()) return;
    setLoading(true);
    try {
      await createWorkspace({ uid: user.uid, name: name.trim(), avatar });
      await refetchWorkspace();
      router.push('/auth/invite');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-amber-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center text-3xl shadow-lg mx-auto mb-4">{avatar}</div>
          <h1 className="text-2xl font-bold text-stone-900">Set up your profile</h1>
          <p className="text-stone-500 mt-1">You&apos;re User A — the workspace creator</p>
        </div>

        <div className="duo-card p-8">
          <form onSubmit={handleCreate} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">Your name</label>
              <input
                type="text" value={name} onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Alex" required maxLength={30}
                className="w-full px-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">Choose your avatar</label>
              <div className="grid grid-cols-6 gap-2">
                {AVATARS.map((a) => (
                  <button key={a} type="button" onClick={() => setAvatar(a)}
                    className={`text-2xl p-2 rounded-xl transition-all hover:scale-110 ${avatar === a ? 'bg-indigo-100 ring-2 ring-indigo-400 shadow-sm' : 'bg-stone-50 hover:bg-stone-100'}`}>
                    {a}
                  </button>
                ))}
              </div>
            </div>
            <button type="submit" disabled={loading || !name.trim()}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 text-white font-semibold shadow-sm hover:from-indigo-600 hover:to-indigo-700 active:scale-[0.98] disabled:opacity-60 transition-all">
              {loading ? 'Creating workspace...' : 'Create workspace →'}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
