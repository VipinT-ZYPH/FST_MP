'use client';

import React from 'react';
import { Sparkles, Calendar, Tag, Edit3, Trash2, ArrowRight, Compass } from 'lucide-react';
import { JournalEntry } from '@/lib/db/types';
import { MOODS } from '@/lib/moods';
import styles from '@/styles/JournalCard.module.css';

interface JournalCardProps {
  entry: JournalEntry;
  onViewReflection: (entry: JournalEntry) => void;
  onEdit: (entry: JournalEntry) => void;
  onDelete: (entry: JournalEntry) => void;
  onReflectNow: (entryId: string) => Promise<void>;
  isReflecting?: boolean;
}

export function JournalCard({
  entry,
  onViewReflection,
  onEdit,
  onDelete,
  onReflectNow,
  isReflecting = false,
}: JournalCardProps) {
  const moodInfo = MOODS[entry.mood] || MOODS.reflective;
  const formattedDate = new Date(entry.date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <article
      id={`journal-entry-${entry.id}`}
      className={`rounded-2xl border border-stone-200 bg-white p-5 flex flex-col justify-between ${styles.journalCard}`}
    >
      <div>
        {/* Top Header: Date, Mood & Quick Actions */}
        <div className="flex items-center justify-between gap-2 mb-3">
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

          <div className="flex items-center gap-1">
            <button
              id={`btn-edit-${entry.id}`}
              onClick={() => onEdit(entry)}
              title="Edit Entry"
              className="p-1.5 rounded-md text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
            >
              <Edit3 className="w-4 h-4" />
            </button>
            <button
              id={`btn-delete-${entry.id}`}
              onClick={() => onDelete(entry)}
              title="Delete Entry"
              className="p-1.5 rounded-md text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Title */}
        <h3 className="text-lg font-semibold text-stone-900 tracking-tight mb-2 line-clamp-1">
          {entry.title}
        </h3>

        {/* Content Excerpt */}
        <p className={`text-stone-600 text-sm leading-relaxed mb-4 ${styles.contentClamp}`}>
          {entry.content}
        </p>

        {/* Tags */}
        {entry.tags && entry.tags.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap mb-4">
            <Tag className="w-3 h-3 text-stone-400" />
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

      {/* AI Reflection Section / Action Footer */}
      <div className="pt-3 border-t border-stone-100 mt-2">
        {entry.reflection ? (
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center text-xs font-bold">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              </span>
              <div className="text-left">
                <div className="text-xs font-semibold text-stone-800 flex items-center gap-1">
                  AI Reflection Ready
                  <span className="text-[10px] text-stone-500 font-normal">
                    ({entry.reflection.sentiment.score}/10)
                  </span>
                </div>
                <div className="text-[11px] text-stone-500 truncate max-w-[200px] sm:max-w-[260px]">
                  {entry.reflection.summary}
                </div>
              </div>
            </div>

            <button
              id={`btn-view-reflection-${entry.id}`}
              onClick={() => onViewReflection(entry)}
              className="inline-flex items-center gap-1 text-xs font-medium text-amber-800 hover:text-amber-950 px-2.5 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 transition-colors"
            >
              View Insights
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-stone-400 flex items-center gap-1">
              <Compass className="w-3.5 h-3.5" />
              Not analyzed yet
            </span>
            <button
              id={`btn-reflect-${entry.id}`}
              disabled={isReflecting}
              onClick={() => onReflectNow(entry.id)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-900 text-stone-50 text-xs font-medium hover:bg-stone-800 disabled:opacity-50 transition-colors shadow-xs"
            >
              <Sparkles className={`w-3.5 h-3.5 text-amber-300 ${isReflecting ? 'animate-spin' : ''}`} />
              {isReflecting ? 'Reflecting...' : 'Reflect with AI'}
            </button>
          </div>
        )}
      </div>
    </article>
  );
}
