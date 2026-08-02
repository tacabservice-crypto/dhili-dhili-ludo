/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Sparkles, Mail, Lock, LogIn, UserPlus } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import LanguageToggle from './LanguageToggle';
import { auth, db } from '../firebase'; // Import Firebase auth and db instances
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

import { UserProfile } from '../types/game';

const AVATARS = ['🎮', '🏆', '🔥', '👑', '🎲', '⚡', '🤖', '🦊', '🐯', '🐼', '🦁', '🦄'];

interface AuthScreenProps {
  onLoginSuccess: (profile: UserProfile) => void;
  initialError?: string | null;
}

export default function AuthScreen({ onLoginSuccess, initialError }: AuthScreenProps) {
  const { t } = useLanguage();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [avatar, setAvatar] = useState('🎮');
  const [isLogin, setIsLogin] = useState(true); // true for Sign In, false for Sign Up
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(initialError || '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError(t('emailPasswordRequired'));
      return;
    }
    if (!isLogin && !username.trim()) {
      setError(t('nameRequired'));
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        if (userCredential.user) {
          const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
          if (userDoc.exists()) {
            onLoginSuccess(userDoc.data() as UserProfile);
          } else {
            // This case is unlikely if sign-in works, but good to handle.
            throw new Error('User profile not found in database.');
          }
        }
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        // Create a user profile document in Firestore
        await setDoc(doc(db, "users", userCredential.user.uid), {
          uid: userCredential.user.uid,
          email: userCredential.user.email,
          displayName: username,
          avatar: avatar,
          createdAt: new Date(),
          stats: {
            gamesPlayed: 0,
            wins: 0,
            losses: 0,
          }
        });
      }
    } catch (err: any) {
      // Map Firebase auth errors to user-friendly messages
      let errorMessage = 'An unknown error occurred.';
      switch (err.code) {
        case 'auth/invalid-email':
          errorMessage = 'Please enter a valid email address.';
          break;
        case 'auth/user-not-found':
        case 'auth/wrong-password':
          errorMessage = 'Invalid email or password. Please try again.';
          break;
        case 'auth/email-already-in-use':
          errorMessage = 'An account with this email already exists. Please sign in.';
          break;
        case 'auth/weak-password':
          errorMessage = 'The password is too weak. Please use at least 6 characters.';
          break;
        default:
          errorMessage = err.message;
          break;
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#2e1065] via-[#0f052d] to-[#020012] text-white flex flex-col items-center justify-center p-4 selection:bg-purple-500 selection:text-white relative overflow-hidden">
      {/* Top right language toggle */}
      <div className="absolute top-4 right-4 z-20">
        <LanguageToggle />
      </div>

      {/* Background decoration */}
      <div className="absolute inset-0 z-0 pointer-events-none flex items-center justify-center">
        <div className="absolute w-[600px] h-[600px] rounded-full border border-purple-500/10 animate-pulse" />
        <div className="absolute w-[800px] h-[800px] rounded-full border border-purple-500/5" />
      </div>

      <div className="w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl shadow-blue-500/5 space-y-6 relative z-10">
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="w-16 h-16 bg-gradient-to-tr from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/20">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-black tracking-widest bg-gradient-to-r from-yellow-400 via-white to-purple-400 bg-clip-text text-transparent">
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </h1>
          <p className="text-xs font-black text-purple-400 uppercase tracking-widest">
            {t('gameSubtitle')}
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-sm text-center font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <>
              {/* Avatar selector */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  {t('chooseAvatar')}
                </label>
                <div className="grid grid-cols-6 gap-2 bg-black/40 p-2 rounded-xl border border-white/5">
                  {AVATARS.map((av) => (
                    <button
                      key={av}
                      type="button"
                      onClick={() => setAvatar(av)}
                      className={`text-xl p-2 rounded-lg transition-all ${
                        avatar === av 
                          ? 'bg-gradient-to-tr from-blue-600 to-indigo-600 scale-110 shadow-lg shadow-blue-500/30 border border-white/20' 
                          : 'hover:bg-white/5'
                      }`}
                    >
                      {av}
                    </button>
                  ))}
                </div>
              </div>
              {/* Username Input */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  {t('displayName')}
                </label>
                <input
                  type="text"
                  required
                  placeholder={t('displayNamePlaceholder')}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-black/30 border border-white/10 focus:border-blue-400 focus:ring-1 focus:ring-blue-400 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition-all"
                />
              </div>
            </>
          )}

          {/* Email Input */}
          <div className="space-y-1">
             <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Mail className="w-3 h-3 text-slate-500" /> {t('emailAddress')}
              </label>
              <input
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-black/30 border border-white/10 focus:border-blue-400 focus:ring-1 focus:ring-blue-400 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition-all"
              />
          </div>

          {/* Password Input */}
          <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Lock className="w-3 h-3 text-slate-500" /> Password
              </label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-black/30 border border-white/10 focus:border-blue-400 focus:ring-1 focus:ring-blue-400 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition-all"
              />
            </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-sm py-3.5 px-4 rounded-xl shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50 uppercase tracking-wider cursor-pointer"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                {isLogin ? <LogIn className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                {isLogin ? 'Sign In' : 'Sign Up'}
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="text-center text-xs text-slate-400">
          {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
            }}
            className="font-bold text-blue-400 hover:text-blue-300 underline"
          >
            {isLogin ? 'Sign Up' : 'Sign In'}
          </button>
        </div>
      </div>
    </div>
  );
}
