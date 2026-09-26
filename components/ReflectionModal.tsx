'use client';

import React from 'react';
import { Sparkles, X, Heart, HelpCircle, CheckCircle2, RotateCw, Quote, ArrowUpRight } from 'lucide-react';
import { JournalEntry, JournalReflection } from '@/lib/db/types';
import { MOODS } from '@/lib/moods';
import styles from '@/styles/ReflectionView.module.css';

interface ReflectionModalProps {
  entry: JournalEntry | null;
  isOpen: boolean;
  onClose: () => void;
  onRegenerate: (entryId: string) => Promise<void>;
  isRegenerating?: boolean;
}

export function ReflectionModal({
  entry,
  isOpen,
  onClose,
  onRegenerate,
  isRegenerating = false,
}: ReflectionModalProps) {
  if (!isOpen || !entry || !entry.reflection) return null;

  const reflection: JournalReflection = entry.reflection;
  const moodInfo = MOODS[entry.mood] || MOODS.reflective;
  const sentimentScore = reflection.sentiment?.score || 7.5;
  const sentimentPercent = Math.min(Math.max((sentimentScore / 10) * 100, 10), 100);

  return (
    <div
      id="reflection-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs overflow-y-auto animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="reflection-modal-dialog"
        className="w-full max-w-2xl bg-white rounded-2xl border border-stone-200 shadow-xl overflow-hidden my-8"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-200 bg-stone-50/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-stone-900">
                AI Reflection & Insights
              </h2>
              <p className="text-xs text-stone-500">
                Grounded in your entry from {new Date(entry.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="btn-modal-regenerate"
              onClick={() => onRegenerate(entry.id)}
              disabled={isRegenerating}
              title="Regenerate Reflection with Gemini"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-stone-600 hover:text-stone-900 hover:bg-stone-200/60 transition-colors disabled:opacity-50"
            >
              <RotateCw className={`w-3.5 h-3.5 ${isRegenerating ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <button
              id="btn-modal-close"
              onClick={onClose}
              className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Executive Summary */}
          <div className="p-4 rounded-xl bg-stone-50 border border-stone-200">
            <div className="text-xs font-semibold uppercase tracking-wider text-stone-400 mb-1 flex items-center gap-1.5">
              <Quote className="w-3.5 h-3.5 text-stone-400" />
              Core Summary
            </div>
            <p className="text-sm font-medium text-stone-800 leading-relaxed">
              {reflection.summary}
            </p>
          </div>

          {/* Emotional Tone & Sentiment Meter */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-stone-200 bg-white">
              <div className="text-xs font-semibold uppercase tracking-wider text-stone-400 mb-1.5 flex items-center gap-1.5">
                <Heart className="w-3.5 h-3.5 text-rose-500" />
                Emotional Landscape
              </div>
              <div className="text-sm font-semibold text-stone-900 mb-2">
                {reflection.sentiment.mood}
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                {reflection.sentiment.emotionalTones?.map((tone) => (
                  <span
                    key={tone}
                    className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-stone-100 text-stone-700 border border-stone-200"
                  >
                    {tone}
                  </span>
                ))}
              </div>
            </div>

            <div className="p-4 rounded-xl border border-stone-200 bg-white">
              <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-stone-400 mb-1.5">
                <span>Vitality & Balance Score</span>
                <span className="text-stone-900 font-bold text-sm">
                  {sentimentScore.toFixed(1)} / 10
                </span>
              </div>
              <div className="w-full bg-stone-100 rounded-full h-2.5 overflow-hidden my-2 border border-stone-200">
                <div
                  className="bg-amber-500 h-2.5 rounded-full transition-all duration-700"
                  style={{ width: `${sentimentPercent}%` }}
                />
              </div>
              <p className="text-[11px] text-stone-500">
                {reflection.sentiment.positivity === 'positive'
                  ? 'High flourishing, gratitude, and emotional grounding.'
                  : reflection.sentiment.positivity === 'challenging'
                  ? 'Healthy emotional processing of difficulty and vulnerability.'
                  : 'Equanimous, observant, and measured perspective.'}
              </p>
            </div>
          </div>

          {/* Mindful Reflection Text */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-400 mb-2">
              Philosophical & Mindful Reflection
            </h3>
            <div className="text-sm text-stone-700 leading-relaxed space-y-2 bg-stone-50/50 p-4 rounded-xl border border-stone-200/80">
              <p>{reflection.mindfulReflection}</p>
            </div>
          </div>

          {/* Key Insights List */}
          {reflection.keyInsights && reflection.keyInsights.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-400 mb-2.5">
                Key Insights & Mental Patterns
              </h3>
              <ul className="space-y-2">
                {reflection.keyInsights.map((insight, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-2.5 text-sm text-stone-700 p-2.5 rounded-lg bg-white border border-stone-200/70"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{insight}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Growth Question / Prompt for contemplation */}
          <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200">
            <div className="text-xs font-semibold uppercase tracking-wider text-amber-900 mb-1 flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-amber-700" />
              Inquiry for Your Next Reflection
            </div>
            <p className="text-sm font-medium text-amber-950 italic">
              &ldquo;{reflection.growthPrompt}&rdquo;
            </p>
          </div>

          {/* Actionable Micro-habits */}
          {reflection.actionableAdvice && reflection.actionableAdvice.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-400 mb-2">
                Suggested Mindful Practices
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {reflection.actionableAdvice.map((advice, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-lg border border-stone-200 bg-stone-50/50 text-xs text-stone-700 flex items-start gap-2"
                  >
                    <ArrowUpRight className="w-3.5 h-3.5 text-stone-400 shrink-0 mt-0.5" />
                    <span>{advice}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-stone-200 bg-stone-50/60 flex items-center justify-between text-xs text-stone-500">
          <span>AI analysis generated via Gemini</span>
          <button
            id="btn-modal-close-footer"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-stone-900 text-stone-50 text-xs font-medium hover:bg-stone-800 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
