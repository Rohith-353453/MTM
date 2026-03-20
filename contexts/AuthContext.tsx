'use client';

import {
  createContext, useContext, useEffect, useState, ReactNode
} from 'react';
import {
  User, signInWithEmailAndPassword, createUserWithEmailAndPassword,
  signOut, onAuthStateChanged, sendSignInLinkToEmail, isSignInWithEmailLink,
  signInWithEmailLink,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  logOut: () => Promise<void>;
  sendMagicLink: (email: string) => Promise<void>;
  completeMagicLink: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsub;
  }, []);

  const signIn = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signUp = async (email: string, password: string) => {
    await createUserWithEmailAndPassword(auth, email, password);
  };

  const logOut = async () => {
    await signOut(auth);
  };

  const sendMagicLink = async (email: string) => {
    const actionCodeSettings = {
      url: typeof window !== 'undefined' ? window.location.origin + '/auth/magic' : '',
      handleCodeInApp: true,
    };
    await sendSignInLinkToEmail(auth, email, actionCodeSettings);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('emailForSignIn', email);
    }
  };

  const completeMagicLink = async (): Promise<boolean> => {
    if (typeof window === 'undefined') return false;
    if (!isSignInWithEmailLink(auth, window.location.href)) return false;
    const email = window.localStorage.getItem('emailForSignIn') || '';
    if (!email) return false;
    await signInWithEmailLink(auth, email, window.location.href);
    window.localStorage.removeItem('emailForSignIn');
    return true;
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, logOut, sendMagicLink, completeMagicLink }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
