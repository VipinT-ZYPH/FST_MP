import React from 'react';
import { redirect } from 'next/navigation';
import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, Sparkles, BarChart2, Heart, TrendingUp, Calendar, Compass, ShieldCheck } from 'lucide-react';
import { getSession } from '@/lib/security/proxy';
import { listEntries, getLatestSynthesis } from '@/lib/db';
import { Navbar } from '@/components/Navbar';
import { MOODS } from '@/lib/moods';
import { MoodType } from '@/lib/db/types';

export const metadata: Metadata = {
  title: 'Insights & Mood Trends | ReflectAI',
  description: 'Emotional patterns and reflection trends.',
};

export default async function AnalyticsPage() {
  const session = await getSession();

  if (!session || !session.user) {
    redirect('/login?redirect=/dashboard/analytics');
  }

  const entries = await listEntries(session.user.id);
  const synthesis = await getLatestSynthesis(session.user.id);

  // Compute mood counts
  const moodCounts: Record<string, number> = {};
  let totalSentimentScore = 0;
  let scoredCount = 0;

  entries.forEach((e) => {
    moodCounts[e.mood] = (moodCounts[e.mood] || 0) + 1;
    if (e.reflection?.sentiment?.score) {
      totalSentimentScore += e.reflection.sentiment.score;
      scoredCount++;
    }
  });

  const avgSentiment = scoredCount > 0 ? (totalSentimentScore / scoredCount).toFixed(1) : 'N/A';

  // Total words written
  const totalWords = entries.reduce((acc, curr) => {
    return acc + (curr.content ? curr.content.trim().split(/\s+/).length : 0);
  }, 0);

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 flex flex-col">
      <Navbar user={session.user} />

      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-6">
        {/* Back Link */}
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-stone-500 hover:text-stone-900 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Journal Entries
        </Link>

        {/* Header */}
        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1">
            <BarChart2 className="w-3.5 h-3.5 text-stone-400" />
            <span>Self-Attunement & Analytics</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-stone-900">
            Emotional Landscape & Growth Patterns
          </h1>
          <p className="text-xs sm:text-sm text-stone-600 mt-1">
            Grounded metrics from your private journaling practice.
          </p>
        </div>

        {/* Top Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-stone-200">
            <div className="text-xs font-medium text-stone-500 mb-1">Total Reflections</div>
            <div className="text-2xl font-semibold text-stone-900">{entries.length}</div>
            <div className="text-[11px] text-stone-400 mt-1">{totalWords.toLocaleString()} words written</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-stone-200">
            <div className="text-xs font-medium text-stone-500 mb-1">AI Analyzed Entries</div>
            <div className="text-2xl font-semibold text-stone-900">{scoredCount}</div>
            <div className="text-[11px] text-stone-400 mt-1">
              {entries.length > 0 ? Math.round((scoredCount / entries.length) * 100) : 0}% coverage
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-stone-200">
            <div className="text-xs font-medium text-stone-500 mb-1">Average Vitality Score</div>
            <div className="text-2xl font-semibold text-stone-900">
              {avgSentiment} {scoredCount > 0 && <span className="text-xs font-normal text-stone-400">/ 10</span>}
            </div>
            <div className="text-[11px] text-stone-400 mt-1">Derived from mindful AI sentiment</div>
          </div>
        </div>

        {/* Mood Distribution Breakdown */}
        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs space-y-4">
          <h2 className="text-sm font-semibold text-stone-900 uppercase tracking-wider text-xs text-stone-400">
            Emotional Mood Distribution
          </h2>

          <div className="space-y-3">
            {(Object.keys(MOODS) as MoodType[]).map((m) => {
              const count = moodCounts[m] || 0;
              const percent = entries.length > 0 ? Math.round((count / entries.length) * 100) : 0;
              const config = MOODS[m];

              return (
                <div key={m} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-stone-700 flex items-center gap-2">
                      <span>{config.emoji}</span>
                      <span>{config.label}</span>
                    </span>
                    <span className="text-stone-500 font-medium">
                      {count} {count === 1 ? 'entry' : 'entries'} ({percent}%)
                    </span>
                  </div>
                  <div className="w-full bg-stone-100 rounded-full h-2 overflow-hidden border border-stone-200">
                    <div
                      className="bg-stone-800 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Latest Synthesis Callout if exists */}
        {synthesis && (
          <div className="bg-teal-50/60 border border-teal-200/80 p-6 rounded-2xl space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-teal-900 uppercase tracking-wider">
              <Compass className="w-4 h-4 text-teal-700" />
              Latest Synthesis Milestones
            </div>
            <p className="text-xs sm:text-sm text-stone-800 leading-relaxed font-medium">
              {synthesis.overview}
            </p>
            <div className="p-3 bg-white/80 rounded-xl border border-teal-200 text-xs text-stone-700 italic">
              Guiding Question: &ldquo;{synthesis.guidingQuestion}&rdquo;
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
