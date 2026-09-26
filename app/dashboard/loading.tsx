import React from 'react';

export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 animate-pulse">
      {/* Navbar Skeleton */}
      <div className="h-16 border-b border-stone-200 bg-white/70 px-4 sm:px-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-stone-200" />
          <div className="w-24 h-4 rounded bg-stone-200" />
        </div>
        <div className="flex items-center gap-3">
          <div className="w-28 h-8 rounded-lg bg-stone-200" />
          <div className="w-8 h-8 rounded-full bg-stone-200" />
        </div>
      </div>

      {/* Content Skeleton */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header Greeting Skeleton */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="w-48 h-7 rounded bg-stone-200" />
            <div className="w-64 h-4 rounded bg-stone-200" />
          </div>
          <div className="flex items-center gap-2">
            <div className="w-32 h-9 rounded-lg bg-stone-200" />
            <div className="w-36 h-9 rounded-lg bg-stone-200" />
          </div>
        </div>

        {/* Filters bar Skeleton */}
        <div className="p-4 rounded-xl border border-stone-200 bg-white flex flex-col sm:flex-row gap-3">
          <div className="flex-1 h-9 rounded-lg bg-stone-100" />
          <div className="w-32 h-9 rounded-lg bg-stone-100" />
          <div className="w-32 h-9 rounded-lg bg-stone-100" />
        </div>

        {/* Grid of Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-64 rounded-2xl border border-stone-200 bg-white p-5 space-y-4">
              <div className="flex justify-between">
                <div className="w-20 h-4 rounded bg-stone-200" />
                <div className="w-16 h-4 rounded-full bg-stone-200" />
              </div>
              <div className="w-3/4 h-5 rounded bg-stone-200" />
              <div className="space-y-2">
                <div className="w-full h-3 rounded bg-stone-100" />
                <div className="w-5/6 h-3 rounded bg-stone-100" />
                <div className="w-4/6 h-3 rounded bg-stone-100" />
              </div>
              <div className="pt-4 border-t border-stone-100 flex justify-between items-center">
                <div className="w-24 h-4 rounded bg-stone-200" />
                <div className="w-20 h-7 rounded-lg bg-stone-200" />
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
