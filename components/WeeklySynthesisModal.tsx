'use client';

import React, { useState } from 'react';
import { Sparkles, X, Target, HeartHandshake, Compass, RotateCw, CheckCircle } from 'lucide-react';
import { WeeklySynthesis } from '@/lib/db/types';

interface WeeklySynthesisModalProps {
  isOpen: boolean;
  onClose: () => void;
  synthesis: WeeklySynthesis | null;
  onGenerate: () => Promise<void>;
  isGenerating?: boolean;
}

export function WeeklySynthesisModal({
  isOpen,
  onClose,
  synthesis,
  onGenerate,
  isGenerating = false,
}: WeeklySynthesisModalProps) {
  if (!isOpen) return null;

  return (
    <div
      id="synthesis-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isGenerating) onClose();
      }}
    >
      <div
        id="synthesis-modal-dialog"
        className="w-full max-w-2xl bg-white rounded-2xl border border-stone-200 shadow-xl overflow-hidden my-8"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-200 bg-stone-50/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center">
              <Compass className="w-4 h-4 text-teal-700" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-stone-900">
                Holistic Growth Synthesis
              </h2>
              <p className="text-xs text-stone-500">
                AI analysis of recurring patterns, themes, and emotional shifts
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="btn-synthesis-regenerate"
              onClick={onGenerate}
              disabled={isGenerating}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-stone-600 hover:text-stone-900 hover:bg-stone-200/60 transition-colors disabled:opacity-50"
            >
              <RotateCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Recalculate</span>
            </button>
            <button
              id="btn-synthesis-close"
              onClick={onClose}
              className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {!synthesis ? (
            <div className="text-center py-10 px-4">
              <div className="w-12 h-12 rounded-full bg-teal-50 text-teal-700 flex items-center justify-center mx-auto mb-3">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-semibold text-stone-900 mb-1">
                No Weekly Synthesis Generated Yet
              </h3>
              <p className="text-xs text-stone-500 max-w-md mx-auto mb-5">
                ReflectAI examines your recent reflections as an interconnected story, extracting broader themes and milestones.
              </p>
              <button
                id="btn-generate-first-synthesis"
                onClick={onGenerate}
                disabled={isGenerating}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-stone-900 text-stone-50 text-xs font-medium hover:bg-stone-800 disabled:opacity-50 transition-colors shadow-xs"
              >
                <Sparkles className={`w-3.5 h-3.5 text-amber-300 ${isGenerating ? 'animate-spin' : ''}`} />
                {isGenerating ? 'Synthesizing Your Entries...' : 'Synthesize Recent Entries'}
              </button>
            </div>
          ) : (
            <>
              {/* Overview Card */}
              <div className="p-4 rounded-xl bg-teal-50/50 border border-teal-200/80">
                <div className="text-xs font-semibold uppercase tracking-wider text-teal-900 mb-1 flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5 text-teal-700" />
                  Trajectory Overview ({synthesis.period})
                </div>
                <p className="text-sm text-stone-800 leading-relaxed font-medium">
                  {synthesis.overview}
                </p>
              </div>

              {/* Key Themes */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-400 mb-2">
                  Dominant Life Themes
                </h4>
                <div className="flex flex-wrap gap-2">
                  {synthesis.keyThemes.map((theme, idx) => (
                    <span
                      key={idx}
                      className="text-xs font-medium px-3 py-1 rounded-full bg-stone-100 text-stone-800 border border-stone-200"
                    >
                      {theme}
                    </span>
                  ))}
                </div>
              </div>

              {/* Emotional Landscape */}
              <div className="p-4 rounded-xl border border-stone-200 bg-white">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-400 mb-1.5 flex items-center gap-1.5">
                  <HeartHandshake className="w-3.5 h-3.5 text-stone-500" />
                  Emotional Rhythm
                </h4>
                <p className="text-xs text-stone-700 leading-relaxed">
                  {synthesis.emotionalLandscape}
                </p>
              </div>

              {/* Growth Milestones */}
              {synthesis.growthMilestones && synthesis.growthMilestones.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-400 mb-2">
                    Personal Growth Milestones
                  </h4>
                  <ul className="space-y-2">
                    {synthesis.growthMilestones.map((m, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-2.5 text-xs text-stone-700 p-2.5 rounded-lg bg-stone-50 border border-stone-200/70"
                      >
                        <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.2" />
                        <span>{m}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Guiding Question */}
              <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200">
                <div className="text-xs font-semibold uppercase tracking-wider text-amber-900 mb-1 flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5 text-amber-700" />
                  Guiding Question for Coming Days
                </div>
                <p className="text-sm font-medium text-amber-950 italic">
                  &ldquo;{synthesis.guidingQuestion}&rdquo;
                </p>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-stone-200 bg-stone-50/60 flex items-center justify-end">
          <button
            id="btn-close-synthesis-footer"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-stone-900 text-stone-50 text-xs font-medium hover:bg-stone-800 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
