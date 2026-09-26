'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Sparkles, MessageSquare, BarChart3, LogOut, Plus, User as UserIcon, Database } from 'lucide-react';
import { User } from '@/lib/db/types';

interface NavbarProps {
  user: User | null;
  onOpenNewEntry?: () => void;
}

export function Navbar({ user, onOpenNewEntry }: NavbarProps) {
  const pathname = usePathname();
  const [loggingOut, setLoggingOut] = React.useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      try {
        localStorage.removeItem('ai_journal_user');
        document.cookie =
          'ai_journal_session=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=None; Secure';
      } catch {}
      await fetch('/api/auth/logout', { method: 'POST' });
      window.location.href = '/login';
    } catch (e) {
      console.error(e);
      window.location.href = '/login';
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <header id="main-navbar" className="sticky top-0 z-40 w-full border-b border-stone-200 bg-stone-50/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href={user ? '/dashboard' : '/'} className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-stone-900 text-stone-50 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <span className="font-semibold text-base tracking-tight text-stone-900 block leading-none">
                ReflectAI
              </span>
              <span className="text-[11px] text-stone-500 font-medium tracking-wide uppercase flex items-center gap-1">
                <Database className="w-3 h-3 text-emerald-600" /> MongoDB Powered
              </span>
            </div>
          </Link>

          {user && (
            <nav className="hidden md:flex items-center gap-1 text-sm font-medium">
              <Link
                href="/dashboard"
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  pathname === '/dashboard'
                    ? 'bg-stone-200/80 text-stone-900'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4" />
                  Companion & Journal
                </span>
              </Link>
              <Link
                href="/dashboard/analytics"
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  pathname === '/dashboard/analytics'
                    ? 'bg-stone-200/80 text-stone-900'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <BarChart3 className="w-4 h-4" />
                  Moods & Insights
                </span>
              </Link>
            </nav>
          )}
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              {onOpenNewEntry && (
                <button
                  id="btn-navbar-new-entry"
                  onClick={onOpenNewEntry}
                  className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-stone-900 text-stone-50 text-sm font-medium hover:bg-stone-800 transition-colors shadow-xs cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  New Reflection
                </button>
              )}

              <div className="flex items-center gap-3 pl-2 border-l border-stone-200">
                <div className="flex items-center gap-2">
                  {user.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={user.avatarUrl}
                      alt={user.name}
                      className="w-8 h-8 rounded-full border border-stone-300 object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-stone-200 flex items-center justify-center text-stone-600">
                      <UserIcon className="w-4 h-4" />
                    </div>
                  )}
                  <div className="hidden lg:block text-left">
                    <div className="text-xs font-semibold text-stone-900 leading-tight">
                      {user.name}
                    </div>
                    <div className="text-[11px] text-stone-500 truncate max-w-[140px]">
                      {user.email}
                    </div>
                  </div>
                </div>

                <button
                  id="btn-logout"
                  onClick={handleLogout}
                  disabled={loggingOut}
                  title="Sign Out"
                  className="p-1.5 rounded-lg text-stone-500 hover:text-stone-900 hover:bg-stone-200/60 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                id="btn-nav-login"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-stone-900 text-stone-50 text-sm font-medium hover:bg-stone-800 transition-colors shadow-xs"
              >
                Sign In
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
