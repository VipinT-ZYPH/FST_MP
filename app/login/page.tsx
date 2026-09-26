'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Sparkles, ArrowLeft, AlertCircle, Shield, CheckCircle2, Database, Mail, Lock, User as UserIcon, LogIn, Server } from 'lucide-react';

function LoginForm() {
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || '/dashboard';

  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<string | null>(null);
  const [dbStatus, setDbStatus] = useState<{ connected: boolean; message: string; type: string } | null>(null);

  useEffect(() => {
    fetch('/api/auth/status')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.dbStatus) {
          setDbStatus(data.dbStatus);
        }
      })
      .catch(() => {});
  }, []);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessInfo(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          name: name.trim() || email.split('@')[0],
          password: password || undefined,
          provider: 'credentials',
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to authenticate user.');
      }

      setSuccessInfo(`Authenticated successfully! Connecting to MongoDB...`);

      if (data.token) {
        document.cookie = `ai_journal_session=${data.token}; path=/; max-age=2592000; SameSite=None; Secure`;
      }
      if (data.user) {
        try {
          localStorage.setItem('ai_journal_user', JSON.stringify(data.user));
        } catch {}
      }

      setTimeout(() => {
        window.location.href = redirectUrl;
      }, 500);
    } catch (err: any) {
      console.error('Auth error:', err);
      setError(err.message || 'Authentication failed. Please check your credentials.');
      setLoading(false);
    }
  };

  const handleQuickDemo = async (demoEmail: string, demoName: string, role: 'user' | 'admin' = 'user') => {
    setLoading(true);
    setError(null);
    setSuccessInfo(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: demoEmail,
          name: demoName,
          provider: 'credentials',
          role,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to initialize demo session.');
      }

      if (data.token) {
        document.cookie = `ai_journal_session=${data.token}; path=/; max-age=2592000; SameSite=None; Secure`;
      }
      if (data.user) {
        try {
          localStorage.setItem('ai_journal_user', JSON.stringify(data.user));
        } catch {}
      }

      setSuccessInfo(`Signed in as ${demoName}. Redirecting to journal dashboard...`);
      setTimeout(() => {
        window.location.href = redirectUrl;
      }, 400);
    } catch (err: any) {
      setError(err.message || 'Failed to log in as demo account.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-stone-500 hover:text-stone-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Home
        </Link>

        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="w-10 h-10 rounded-xl bg-stone-900 text-stone-50 flex items-center justify-center shadow-xs">
            <Sparkles className="w-5 h-5 text-amber-300" />
          </div>
          <span className="font-bold text-2xl tracking-tight text-stone-900">
            ReflectAI
          </span>
        </div>
        <h2 className="text-center text-lg font-semibold text-stone-800 tracking-tight">
          Sign in to your Reflective Space
        </h2>
        <p className="mt-1 text-center text-xs text-stone-500">
          Direct authentication persisted to MongoDB collections.
        </p>

        {/* Database Status Banner */}
        <div className="mt-4 p-3 rounded-xl border bg-white shadow-xs text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className={`w-4 h-4 ${dbStatus?.connected ? 'text-emerald-600' : 'text-amber-500'}`} />
            <div>
              <div className="font-semibold text-stone-800 flex items-center gap-1.5">
                MongoDB Database Status
                <span className={`w-2 h-2 rounded-full ${dbStatus?.connected ? 'bg-emerald-500' : 'bg-amber-400 animate-pulse'}`} />
              </div>
              <div className="text-[11px] text-stone-500">
                {dbStatus?.connected
                  ? 'Connected & storing data in MongoDB Compass database.'
                  : 'Ready for MONGODB_URI (falling back to local data store).'}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 sm:px-10 border border-stone-200 shadow-sm rounded-2xl space-y-5">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="leading-relaxed">{error}</div>
            </div>
          )}

          {successInfo && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successInfo}</span>
            </div>
          )}

          {/* User Sign In / Register Form */}
          <form onSubmit={handleAuthSubmit} className="space-y-4">
            {isSignUp && (
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 absolute left-3 top-3 text-stone-400" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Jane Doe"
                    className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-900 bg-stone-50/50"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-3 text-stone-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@example.com"
                  className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-900 bg-stone-50/50"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-3 text-stone-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-900 bg-stone-50/50"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-50 font-semibold text-sm transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  {isSignUp ? 'Create Account' : 'Sign In with Email'}
                </>
              )}
            </button>
          </form>

          <div className="flex items-center justify-between text-xs text-stone-500 pt-1">
            <span>
              {isSignUp ? 'Already have an account?' : "Don't have an account?"}
            </span>
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError(null);
              }}
              className="font-semibold text-stone-900 underline hover:text-stone-700 cursor-pointer"
            >
              {isSignUp ? 'Sign In' : 'Sign Up'}
            </button>
          </div>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-stone-200" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-3 text-stone-400 uppercase tracking-wider font-medium">
                Or Quick Demo Access
              </span>
            </div>
          </div>

          {/* Quick Demo Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              disabled={loading}
              onClick={() => handleQuickDemo('journaler@reflectai.internal', 'Demo Journaler', 'user')}
              className="px-3 py-2.5 rounded-xl border border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-800 text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <UserIcon className="w-3.5 h-3.5 text-stone-600" />
              Demo User
            </button>

            <button
              type="button"
              disabled={loading}
              onClick={() => handleQuickDemo('admin@reflectai.internal', 'System Administrator', 'admin')}
              className="px-3 py-2.5 rounded-xl border border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-800 text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Server className="w-3.5 h-3.5 text-stone-600" />
              Admin User
            </button>
          </div>

          <div className="pt-2 flex items-center justify-center gap-2 text-stone-400 text-xs">
            <Shield className="w-3.5 h-3.5 text-stone-400" />
            <span>MongoDB Compass database architecture</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-stone-50 flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-stone-400 border-t-stone-900 animate-spin" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
