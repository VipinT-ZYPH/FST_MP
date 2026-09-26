import React from 'react';
import { redirect, notFound } from 'next/navigation';
import { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowLeft,
  Calendar,
  Sparkles,
  Heart,
  HelpCircle,
  CheckCircle2,
  Quote,
  ArrowUpRight,
} from 'lucide-react';
import { getSession } from '@/lib/security/proxy';
import { getEntryById } from '@/lib/db';
import { Navbar } from '@/components/Navbar';
import { MOODS } from '@/lib/moods';

interface EntryPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: EntryPageProps): Promise<Metadata> {
  const session = await getSession();
  if (!session?.user) return { title: 'Journal Entry | ReflectAI' };
  const { id } = await params;
  const entry = await getEntryById(id, session.user.id);
  return {
    title: entry ? `${entry.title} | ReflectAI` : 'Journal Entry | ReflectAI',
    description: entry?.reflection?.summary || 'Private journal reflection',
  };
}

export default async function EntryDetailPage({ params }: EntryPageProps) {
  const session = await getSession();
  if (!session || !session.user) {
    redirect('/login');
  }

  const { id } = await params;
  const entry = await getEntryById(id, session.user.id);

  if (!entry) {
    notFound();
  }

  const moodInfo = MOODS[entry.mood] || MOODS.reflective;
  const formattedDate = new Date(entry.date).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 flex flex-col">
      <Navbar user={session.user} />

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-6">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-stone-500 hover:text-stone-900 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to All Reflections
        </Link>

        {/* Main Entry Card */}
        <article className="bg-white p-6 sm:p-8 rounded-2xl border border-stone-200 shadow-xs space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-stone-500">
                <Calendar className="w-3.5 h-3.5 text-stone-400" />
                {formattedDate}
              </span>
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${moodInfo.bgClass} ${moodInfo.textClass} ${moodInfo.borderClass}`}
              >
                <span>{moodInfo.emoji}</span>
                <span>{moodInfo.label}</span>
              </span>
            </div>

            {entry.tags && entry.tags.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap">
                {entry.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-[11px] font-medium text-stone-500 bg-stone-100 px-2 py-0.5 rounded-md"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Title */}
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-stone-900">
            {entry.title}
          </h1>

          {/* Body Content */}
          <div className="text-stone-800 text-sm sm:text-base leading-relaxed whitespace-pre-line font-sans">
            {entry.content}
          </div>
        </article>

        {/* AI Reflection Section */}
        {entry.reflection && (
          <section className="bg-white p-6 sm:p-8 rounded-2xl border border-amber-200/90 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-stone-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-stone-900">
                    Mindful AI Reflection & Insights
                  </h2>
                  <p className="text-xs text-stone-500">Generated with Gemini</p>
                </div>
              </div>

              <div className="px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold">
                Score: {entry.reflection.sentiment.score.toFixed(1)} / 10
              </div>
            </div>

            {/* Summary */}
            <div className="p-4 rounded-xl bg-stone-50 border border-stone-200">
              <div className="text-xs font-semibold uppercase tracking-wider text-stone-400 mb-1 flex items-center gap-1.5">
                <Quote className="w-3.5 h-3.5 text-stone-400" />
                Core Summary
              </div>
              <p className="text-sm font-medium text-stone-800 leading-relaxed">
                {entry.reflection.summary}
              </p>
            </div>

            {/* Reflection Text */}
            <div className="p-5 rounded-xl bg-stone-50/50 border border-stone-200/80 space-y-2 text-sm text-stone-700 leading-relaxed">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-400 mb-1">
                Mindful Contemplation
              </h3>
              <p>{entry.reflection.mindfulReflection}</p>
            </div>

            {/* Key Insights */}
            {entry.reflection.keyInsights && (
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-400 mb-2.5">
                  Key Insights & Mental Patterns
                </h3>
                <ul className="space-y-2">
                  {entry.reflection.keyInsights.map((insight, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-2.5 text-xs sm:text-sm text-stone-700 p-2.5 rounded-lg bg-stone-50 border border-stone-200/70"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{insight}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Growth Inquiry Question */}
            <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200">
              <div className="text-xs font-semibold uppercase tracking-wider text-amber-900 mb-1 flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-amber-700" />
                Inquiry for Further Contemplation
              </div>
              <p className="text-sm font-medium text-amber-950 italic">
                &ldquo;{entry.reflection.growthPrompt}&rdquo;
              </p>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
