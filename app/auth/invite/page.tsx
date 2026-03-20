'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { getWorkspaceByInviteCode, joinWorkspace } from '@/lib/firestore';
import { motion } from 'framer-motion';

const AVATARS = ['🙂', '😎', '🦁', '🐼', '🦊', '🐸', '🦋', '🌟', '🔥', '❄️', '🌙', '☀️'];

export default function InvitePage() {
  const { user } = useAuth();
  const { workspace, refetchWorkspace } = useWorkspace();
  const router = useRouter();
  const [mode, setMode] = useState<'host' | 'join'>(!workspace ? 'join' : 'host');
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState('🙂');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyCode = () => {
    if (!workspace?.inviteCode) return;
    navigator.clipboard.writeText(workspace.inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !name.trim() || !code.trim()) return;
    setLoading(true);
    setError('');
    try {
      const ws = await getWorkspaceByInviteCode(code.trim().toUpperCase());
      if (!ws) { setError('Invalid invite code. Check with your partner.'); setLoading(false); return; }
      if (ws.userB) { setError('This workspace already has two members.'); setLoading(false); return; }
      await joinWorkspace(ws.id, { uid: user.uid, name: name.trim(), avatar });
      await refetchWorkspace();
      router.push('/workspace');
    } catch (err) {
      console.error(err);
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (mode === 'host') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-pink-50 flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="text-5xl mb-4">🎉</div>
            <h1 className="text-2xl font-bold text-stone-900">Workspace created!</h1>
            <p className="text-stone-500 mt-1">Share your invite code with your partner</p>
          </div>
          <div className="duo-card p-8 space-y-6">
            <div className="text-center">
              <p className="text-sm text-stone-500 mb-2">Your invite code</p>
              <div className="text-4xl font-black tracking-[0.2em] text-indigo-600 bg-indigo-50 rounded-2xl py-4">
                {workspace?.inviteCode ?? '------'}
              </div>
            </div>
            <button onClick={copyCode}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-white font-semibold hover:from-amber-500 hover:to-amber-600 transition-all">
              {copied ? '✅ Copied!' : '📋 Copy code'}
            </button>
            <button onClick={() => router.push('/workspace')}
              className="w-full py-3 rounded-xl border border-stone-200 text-stone-600 font-medium hover:bg-stone-50 transition-all">
              Continue to workspace →
            </button>
            <p className="text-xs text-stone-400 text-center">Your partner can join from their app using this code</p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">{avatar}</div>
          <h1 className="text-2xl font-bold text-stone-900">Join a workspace</h1>
          <p className="text-stone-500 mt-1">Enter the invite code from your partner</p>
        </div>
        <div className="duo-card p-8">
          <form onSubmit={handleJoin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1.5">Your name</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Jordan" required
                className="w-full px-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50 focus:outline-none focus:ring-2 focus:ring-pink-400" />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">Avatar</label>
              <div className="grid grid-cols-6 gap-2">
                {AVATARS.map((a) => (
                  <button key={a} type="button" onClick={() => setAvatar(a)}
                    className={`text-2xl p-2 rounded-xl transition-all hover:scale-110 ${avatar === a ? 'bg-pink-100 ring-2 ring-pink-400' : 'bg-stone-50 hover:bg-stone-100'}`}>
                    {a}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1.5">Invite code</label>
              <input type="text" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="XXXXXX" required maxLength={6}
                className="w-full px-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50 uppercase tracking-widest font-bold text-center text-xl focus:outline-none focus:ring-2 focus:ring-pink-400" />
            </div>
            {error && <p className="text-red-500 text-sm bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
            <button type="submit" disabled={loading || !name.trim() || !code.trim()}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-pink-500 to-pink-600 text-white font-semibold hover:from-pink-600 hover:to-pink-700 disabled:opacity-60 transition-all">
              {loading ? 'Joining...' : 'Join workspace →'}
            </button>
          </form>
          <button onClick={() => router.push('/auth/setup')} className="w-full mt-4 text-sm text-stone-500 hover:text-pink-600 font-medium text-center">
            Or create a new workspace instead
          </button>
        </div>
      </motion.div>
    </div>
  );
}
