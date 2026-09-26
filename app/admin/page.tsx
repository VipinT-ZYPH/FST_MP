import React from 'react';
import { redirect } from 'next/navigation';
import { Metadata } from 'next';
import Link from 'next/link';
import { ShieldCheck, ArrowLeft, Users, FileText, Sparkles, Activity, AlertTriangle } from 'lucide-react';
import { getSession } from '@/lib/security/proxy';
import { getSystemMetrics } from '@/lib/db';
import { Navbar } from '@/components/Navbar';

export const metadata: Metadata = {
  title: 'Admin Portal & RBAC | ReflectAI',
  description: 'Role-Based Access Control and System Overview',
};

export default async function AdminPage() {
  const session = await getSession();

  if (!session || !session.user) {
    redirect('/login?redirect=/admin');
  }

  // Role-based security check
  if (session.user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-stone-50 text-stone-900 flex flex-col">
        <Navbar user={session.user} />
        <main className="flex-1 max-w-2xl mx-auto px-4 py-16 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-semibold text-stone-900">
            Access Restricted: Administrator Privileges Required
          </h1>
          <p className="text-xs text-stone-500 max-w-md mx-auto">
            Your current account (<span className="font-mono text-stone-700">{session.user.email}</span>) holds the <span className="font-semibold text-stone-800">Member</span> role. The Admin Portal is protected by role-based authorization in <span className="font-mono text-stone-700">proxy.ts</span>.
          </p>
          <div className="pt-4">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-stone-900 text-stone-50 text-xs font-medium hover:bg-stone-800 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Return to Your Private Journal
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const metrics = await getSystemMetrics();

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 flex flex-col">
      <Navbar user={session.user} />

      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-6">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-stone-500 hover:text-stone-900 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Journal Entries
        </Link>

        {/* Header */}
        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-amber-700 uppercase tracking-wider mb-1">
              <ShieldCheck className="w-4 h-4" />
              <span>Role-Based Access Control Active</span>
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-stone-900">
              Administrative Command Center
            </h1>
            <p className="text-xs text-stone-600 mt-1">
              High-level system health, user registry, and reflection telemetry.
            </p>
          </div>

          <div className="px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-medium">
            Authenticated Admin: <span className="font-semibold">{session.user.email}</span>
          </div>
        </div>

        {/* Top KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-stone-200">
            <div className="flex items-center justify-between text-xs text-stone-500 mb-1">
              <span>Registered Users</span>
              <Users className="w-4 h-4 text-stone-400" />
            </div>
            <div className="text-2xl font-semibold text-stone-900">{metrics.totalUsers}</div>
            <div className="text-[11px] text-stone-400 mt-1">Google & GitHub OAuth</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-stone-200">
            <div className="flex items-center justify-between text-xs text-stone-500 mb-1">
              <span>Total System Entries</span>
              <FileText className="w-4 h-4 text-stone-400" />
            </div>
            <div className="text-2xl font-semibold text-stone-900">{metrics.totalEntries}</div>
            <div className="text-[11px] text-stone-400 mt-1">Isolated across all user vaults</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-stone-200">
            <div className="flex items-center justify-between text-xs text-stone-500 mb-1">
              <span>AI Reflections Generated</span>
              <Sparkles className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-2xl font-semibold text-stone-900">{metrics.entriesWithReflections}</div>
            <div className="text-[11px] text-stone-400 mt-1">Processed by Gemini API</div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-stone-900">
              User Accounts Registry
            </h2>
            <span className="text-xs text-stone-500">
              Total {metrics.recentUsers.length} accounts
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-stone-600">
              <thead className="border-b border-stone-200 bg-stone-50 text-stone-700 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Provider</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Registered</th>
                  <th className="py-3 px-4">Last Activity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {metrics.recentUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-stone-50/60 transition-colors">
                    <td className="py-3 px-4 flex items-center gap-2.5">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={u.avatarUrl}
                        alt={u.name}
                        className="w-7 h-7 rounded-full border border-stone-300 object-cover"
                      />
                      <div>
                        <div className="font-medium text-stone-900">{u.name}</div>
                        <div className="text-[11px] text-stone-400">{u.email}</div>
                      </div>
                    </td>
                    <td className="py-3 px-4 capitalize font-medium text-stone-700">{u.provider}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          u.role === 'admin'
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-stone-100 text-stone-700 border border-stone-200'
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-stone-500">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-stone-500">
                      {new Date(u.lastLoginAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Security & RBAC Specs Card */}
        <div className="bg-stone-100/70 border border-stone-200 p-5 rounded-2xl space-y-2 text-xs text-stone-600">
          <div className="font-semibold text-stone-800 flex items-center gap-2">
            <Activity className="w-4 h-4 text-stone-600" />
            Security Architecture & Isolation Guarantees
          </div>
          <p>
            1. All user mutations in Server Actions and Route Handlers pass through <span className="font-mono text-stone-800">lib/security/proxy.ts</span>.
          </p>
          <p>
            2. Endpoints enforce strict user ownership: journal queries mandate <span className="font-mono text-stone-800">userId === session.user.id</span>, preventing cross-tenant access.
          </p>
          <p>
            3. Gemini API keys are maintained exclusively on the server runtime; no tokens or models are ever surfaced to client browsers.
          </p>
        </div>
      </main>
    </div>
  );
}
