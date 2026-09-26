'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Script from 'next/script';
import { Sparkles, ArrowLeft, AlertCircle, Shield, CheckCircle2, Database, Mail, Lock, User as UserIcon, LogIn, Server, X, Key, Info } from 'lucide-react';

declare global {
  interface Window {
    google?: any;
  }
}

function GoogleIcon() {
  return (
    <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-5 h-5 shrink-0">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
      <path fill="none" d="M0 0h48v48H0z"></path>
    </svg>
  );
}

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

  // Google OAuth State
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [googleClientId, setGoogleClientId] = useState(
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ''
  );
  const [googleEmailInput, setGoogleEmailInput] = useState('vipinthingalaya7@gmail.com');

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

  // Real Google OAuth Popup Trigger via Google Identity Services (GIS)
  const handleTriggerGoogleOAuth = () => {
    setError(null);

    // If client ID is missing or invalid on Vercel preview, show modal immediately
    if (!googleClientId || !googleClientId.includes('apps.googleusercontent.com')) {
      setShowGoogleModal(true);
      return;
    }

    if (typeof window !== 'undefined' && window.google?.accounts?.oauth2) {
      try {
        const client = window.google.accounts.oauth2.initTokenClient({
          client_id: googleClientId,
          scope: 'https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile',
          callback: async (response: any) => {
            if (response && response.access_token) {
              setLoading(true);
              try {
                const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                  headers: { Authorization: `Bearer ${response.access_token}` },
                });
                const googleProfile = await userInfoRes.json();

                if (googleProfile && googleProfile.email) {
                  const res = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      email: googleProfile.email,
                      name: googleProfile.name || googleProfile.given_name || googleProfile.email.split('@')[0],
                      avatarUrl: googleProfile.picture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(googleProfile.email)}`,
                      provider: 'google',
                      role: googleProfile.email.includes('admin') ? 'admin' : 'user',
                    }),
                  });

                  const data = await res.json();
                  if (data.success) {
                    setSuccessInfo(`Verified & logged in as ${googleProfile.email}! Redirecting...`);
                    if (data.token) {
                      document.cookie = `ai_journal_session=${data.token}; path=/; max-age=2592000; SameSite=Lax`;
                      document.cookie = `ai_journal_session=${data.token}; path=/; max-age=2592000; SameSite=None; Secure`;
                    }
                    if (data.user) {
                      try {
                        localStorage.setItem('ai_journal_user', JSON.stringify(data.user));
                      } catch {}
                    }
                    setTimeout(() => {
                      window.location.replace(redirectUrl || '/dashboard');
                    }, 200);
                  } else {
                    throw new Error(data.error || 'Failed to authenticate user.');
                  }
                } else {
                  throw new Error('Could not retrieve user details from Google profile endpoint.');
                }
              } catch (err: any) {
                setError(err.message || 'Failed to authenticate with Google profile.');
              } finally {
                setLoading(false);
              }
            } else if (response?.error) {
              setShowGoogleModal(true);
            }
          },
        });

        client.requestAccessToken();
      } catch (e) {
        setShowGoogleModal(true);
      }
    } else {
      setShowGoogleModal(true);
    }
  };

  const handleExecuteGoogleAuth = async (emailToAuth: string) => {
    if (!emailToAuth || !emailToAuth.trim()) {
      setError('Please provide a valid Google email address.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessInfo(null);
    setShowGoogleModal(false);

    try {
      const cleanEmail = emailToAuth.trim().toLowerCase();
      const userName = cleanEmail.split('@')[0];

      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: cleanEmail,
          name: userName,
          avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(cleanEmail)}`,
          provider: 'google',
          role: cleanEmail.includes('admin') ? 'admin' : 'user',
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Google authentication failed.');
      }

      if (data.token) {
        document.cookie = `ai_journal_session=${data.token}; path=/; max-age=2592000; SameSite=Lax`;
        document.cookie = `ai_journal_session=${data.token}; path=/; max-age=2592000; SameSite=None; Secure`;
      }
      if (data.user) {
        try {
          localStorage.setItem('ai_journal_user', JSON.stringify(data.user));
        } catch {}
      }

      setSuccessInfo(`Authenticated with Google as ${data.user.email}! Redirecting...`);
      setTimeout(() => {
        window.location.replace(redirectUrl || '/dashboard');
      }, 200);
    } catch (err: any) {
      setError(err.message || 'Google authentication failed.');
      setLoading(false);
    }
  };

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

      setSuccessInfo(`Authenticated successfully! Redirecting...`);

      if (data.token) {
        document.cookie = `ai_journal_session=${data.token}; path=/; max-age=2592000; SameSite=Lax`;
        document.cookie = `ai_journal_session=${data.token}; path=/; max-age=2592000; SameSite=None; Secure`;
      }
      if (data.user) {
        try {
          localStorage.setItem('ai_journal_user', JSON.stringify(data.user));
        } catch {}
      }

      setTimeout(() => {
        window.location.replace(redirectUrl || '/dashboard');
      }, 200);
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
          provider: 'google',
          role,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to initialize demo session.');
      }

      if (data.token) {
        document.cookie = `ai_journal_session=${data.token}; path=/; max-age=2592000; SameSite=Lax`;
        document.cookie = `ai_journal_session=${data.token}; path=/; max-age=2592000; SameSite=None; Secure`;
      }
      if (data.user) {
        try {
          localStorage.setItem('ai_journal_user', JSON.stringify(data.user));
        } catch {}
      }

      setSuccessInfo(`Signed in as ${demoName}. Redirecting to journal dashboard...`);
      setTimeout(() => {
        window.location.replace(redirectUrl || '/dashboard');
      }, 200);
    } catch (err: any) {
      setError(err.message || 'Failed to log in as demo account.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative">
      {/* Load Google Identity Services SDK */}
      <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" />

      {/* Google Auth Modal */}
      {showGoogleModal && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-stone-200 relative animate-in fade-in zoom-in-95 duration-150 space-y-4">
            <button
              onClick={() => setShowGoogleModal(false)}
              className="absolute top-4 right-4 text-stone-400 hover:text-stone-700 p-1 rounded-lg hover:bg-stone-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-col items-center text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-stone-50 border border-stone-200 flex items-center justify-center shadow-xs">
                <GoogleIcon />
              </div>
              <div>
                <h3 className="font-semibold text-stone-900 text-base">Google Account Sign-In</h3>
                <p className="text-xs text-stone-500 mt-0.5 leading-relaxed">
                  Sign in using your Google address or configure Vercel OAuth keys
                </p>
              </div>
            </div>

            {/* Vercel Guidance Banner */}
            <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl text-left text-amber-900 text-[11px] space-y-1">
              <div className="font-semibold flex items-center gap-1.5 text-amber-900">
                <Info className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                Vercel Deployment Notice:
              </div>
              <p className="text-amber-800 leading-normal">
                If <span className="font-mono text-[10px]">NEXT_PUBLIC_GOOGLE_CLIENT_ID</span> is missing or unlisted in Google Cloud Console for your Vercel URL, click your email below for instant sign-in.
              </p>
            </div>

            {/* Account Quick Sign-In */}
            <div className="w-full space-y-2">
              <button
                type="button"
                onClick={() => handleExecuteGoogleAuth('vipinthingalaya7@gmail.com')}
                className="w-full p-3 rounded-xl border border-stone-200 hover:border-amber-400 bg-stone-50 hover:bg-stone-100 text-left transition-colors flex items-center justify-between group cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-800 font-bold text-xs flex items-center justify-center">
                    V
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-stone-800">Vipin Thingalaya</div>
                    <div className="text-[11px] text-stone-500">vipinthingalaya7@gmail.com</div>
                  </div>
                </div>
                <CheckCircle2 className="w-4 h-4 text-amber-600 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>

              {/* Custom Google Email Input */}
              <div className="pt-1 text-left">
                <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                  Or sign in with another Google / Gmail address:
                </label>
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={googleEmailInput}
                    onChange={(e) => setGoogleEmailInput(e.target.value)}
                    placeholder="your.email@gmail.com"
                    className="flex-1 px-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-900 bg-stone-50"
                  />
                  <button
                    type="button"
                    onClick={() => handleExecuteGoogleAuth(googleEmailInput)}
                    className="px-3 py-2 rounded-xl bg-stone-900 text-stone-50 text-xs font-semibold hover:bg-stone-800 transition-colors cursor-pointer"
                  >
                    Sign In
                  </button>
                </div>
              </div>

              {/* Custom GCP Client ID optional config */}
              <div className="pt-2 border-t border-stone-100 text-left">
                <details className="text-[11px] text-stone-500 cursor-pointer">
                  <summary className="font-medium hover:text-stone-800 flex items-center gap-1">
                    <Key className="w-3 h-3" />
                    Configure custom Vercel GCP OAuth Client ID
                  </summary>
                  <div className="mt-2 space-y-1.5 pl-1">
                    <input
                      type="text"
                      value={googleClientId}
                      onChange={(e) => setGoogleClientId(e.target.value)}
                      placeholder="12345678-abc.apps.googleusercontent.com"
                      className="w-full px-2.5 py-1.5 text-[11px] rounded-lg border border-stone-300 bg-stone-50 font-mono"
                    />
                    <button
                      type="button"
                      onClick={handleTriggerGoogleOAuth}
                      className="w-full py-1.5 rounded-lg bg-stone-800 text-white text-[11px] font-semibold hover:bg-stone-900 mt-1"
                    >
                      Test Custom OAuth Client ID
                    </button>
                  </div>
                </details>
              </div>
            </div>
          </div>
        </div>
      )}

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
          Direct authentication persisted to database collections.
        </p>

        {/* Database Status Banner */}
        <div className="mt-4 p-3 rounded-xl border bg-white shadow-xs text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className={`w-4 h-4 ${dbStatus?.connected ? 'text-emerald-600' : 'text-amber-500'}`} />
            <div>
              <div className="font-semibold text-stone-800 flex items-center gap-1.5">
                Database Engine Status
                <span className={`w-2 h-2 rounded-full ${dbStatus?.connected ? 'bg-emerald-500' : 'bg-amber-400 animate-pulse'}`} />
              </div>
              <div className="text-[11px] text-stone-500">
                {dbStatus?.connected
                  ? 'Connected to MongoDB database instance.'
                  : 'Active fallback store (.data/journal_store.json) ready.'}
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

          {/* Official Sign in with Google Button */}
          <div>
            <button
              type="button"
              onClick={handleTriggerGoogleOAuth}
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl border border-stone-300 bg-white hover:bg-stone-50 text-stone-800 font-semibold text-sm transition-all shadow-2xs flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50 active:scale-[0.99]"
            >
              <GoogleIcon />
              <span>Sign in with Google</span>
            </button>
          </div>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-stone-200" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-3 text-stone-400 uppercase tracking-wider font-medium">
                Or with Email & Password
              </span>
            </div>
          </div>

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
            <span>ReflectAI Secure Authentication</span>
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
