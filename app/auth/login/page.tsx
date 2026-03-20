'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';

export default function LoginPage() {
  const { signIn, signUp, sendMagicLink } = useAuth();
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'signup' | 'magic'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [magicSent, setMagicSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'magic') {
        await sendMagicLink(email);
        setMagicSent(true);
      } else if (mode === 'signup') {
        await signUp(email, password);
        router.push('/auth/setup');
      } else {
        await signIn(email, password);
        router.push('/');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Something went wrong';
      setError(msg.replace('Firebase: ', '').replace(/\(.*\)/, '').trim());
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8 justify-center">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center text-2xl shadow-lg">🚀</div>
          <div>
            <h1 className="text-2xl font-bold text-stone-900">DuoSpace</h1>
            <p className="text-xs text-stone-500">Your shared productivity workspace</p>
          </div>
        </div>

        {/* Card */}
        <div className="duo-card p-8">
          <h2 className="text-xl font-semibold text-stone-800 mb-1">
            {mode === 'signup' ? 'Create account' : mode === 'magic' ? 'Magic link' : 'Welcome back'}
          </h2>
          <p className="text-sm text-stone-500 mb-6">
            {mode === 'signup' ? 'Start your shared workspace' : mode === 'magic' ? 'Sign in without a password' : 'Sign in to your workspace'}
          </p>

          {magicSent ? (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
              <div className="text-2xl mb-2">✉️</div>
              <p className="font-medium text-amber-800">Check your email!</p>
              <p className="text-sm text-amber-600 mt-1">We sent a magic link to <strong>{email}</strong></p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1.5">Email</label>
                <input
                  type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com" required
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                />
              </div>
              {mode !== 'magic' && (
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1.5">Password</label>
                  <input
                    type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••" required={true}
                    className="w-full px-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                  />
                </div>
              )}
              {error && <p className="text-red-500 text-sm bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
              <button
                type="submit" disabled={loading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-white font-semibold shadow-sm hover:from-amber-500 hover:to-amber-600 active:scale-[0.98] disabled:opacity-60 transition-all"
              >
                {loading ? '...' : mode === 'magic' ? 'Send magic link' : mode === 'signup' ? 'Create account' : 'Sign in'}
              </button>
            </form>
          )}

          {/* Mode switcher */}
          <div className="mt-6 flex flex-col gap-2 text-center text-sm text-stone-500">
            {mode !== 'login' && <button onClick={() => setMode('login')} className="hover:text-amber-600">← Back to sign in</button>}
            {mode === 'login' && (
              <>
                <button onClick={() => setMode('signup')} className="hover:text-amber-600">Don&apos;t have an account? <span className="font-medium text-amber-600">Sign up</span></button>
                <button onClick={() => setMode('magic')} className="hover:text-amber-600">Or sign in with a <span className="font-medium text-amber-600">magic link</span></button>
              </>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
