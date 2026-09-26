'use client';

import React, { useState } from 'react';
import { X, Sparkles, Calendar, Tag, Lightbulb, Check } from 'lucide-react';
import { JournalEntry, MoodType } from '@/lib/db/types';
import { MOODS } from '@/lib/moods';

interface EntryEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    id?: string;
    title: string;
    content: string;
    mood: MoodType;
    tags: string[];
    date: string;
    autoReflect: boolean;
  }) => Promise<void>;
  initialEntry?: JournalEntry | null;
}

const INSPIRATIONAL_PROMPTS = [
  'What brought you unexpected ease or gratitude today?',
  'What felt heavy or demanding, and how did you carry it?',
  'What is a realization about yourself that emerged recently?',
  'Describe a sensory moment from today (a sound, breeze, or taste).',
];

interface FormProps {
  initialEntry?: JournalEntry | null;
  onClose: () => void;
  onSave: EntryEditorModalProps['onSave'];
}

function EntryEditorForm({ initialEntry, onClose, onSave }: FormProps) {
  const [title, setTitle] = useState(initialEntry?.title || '');
  const [content, setContent] = useState(initialEntry?.content || '');
  const [mood, setMood] = useState<MoodType>(initialEntry?.mood || 'reflective');
  const [date, setDate] = useState(initialEntry?.date || new Date().toISOString().split('T')[0]);
  const [tagsInput, setTagsInput] = useState(
    initialEntry?.tags ? initialEntry.tags.join(', ') : ''
  );
  const [autoReflect, setAutoReflect] = useState(!initialEntry);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleApplyPrompt = (promptText: string) => {
    if (!content) {
      setContent(`Prompt: ${promptText}\n\n`);
    } else {
      setContent((prev) => `${prev}\n\nPrompt: ${promptText}\n\n`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      setError('Please write some thoughts before saving.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const parsedTags = tagsInput
        .split(',')
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean);

      await onSave({
        id: initialEntry?.id,
        title: title.trim() || 'Untitled Reflection',
        content: content.trim(),
        mood,
        tags: parsedTags,
        date,
        autoReflect,
      });

      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save entry. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
      {error && (
        <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium">
          {error}
        </div>
      )}

      {/* Title & Date */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="sm:col-span-2">
          <label htmlFor="entry-title" className="block text-xs font-semibold text-stone-700 mb-1">
            Entry Title
          </label>
          <input
            id="entry-title"
            type="text"
            placeholder="e.g. A morning walk and renewed focus..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-stone-800 focus:border-transparent transition-all"
          />
        </div>
        <div>
          <label htmlFor="entry-date" className="block text-xs font-semibold text-stone-700 mb-1 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-stone-400" />
            Date
          </label>
          <input
            id="entry-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-stone-800 focus:border-transparent"
          />
        </div>
      </div>

      {/* Mood Selector */}
      <div>
        <label className="block text-xs font-semibold text-stone-700 mb-2">
          Present Emotional Mood
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {(Object.keys(MOODS) as MoodType[]).map((key) => {
            const config = MOODS[key];
            const isSelected = mood === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setMood(key)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium border text-left transition-all ${
                  isSelected
                    ? `${config.bgClass} ${config.textClass} border-stone-800 shadow-xs ring-1 ring-stone-800`
                    : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50'
                }`}
              >
                <span className="text-base">{config.emoji}</span>
                <span className="truncate">{config.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Inspiration Prompts */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-semibold text-stone-600 flex items-center gap-1">
            <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
            Inspirational Spark (optional)
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {INSPIRATIONAL_PROMPTS.map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleApplyPrompt(p)}
              className="text-[11px] text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200/80 px-2.5 py-1 rounded-md transition-colors"
            >
              + {p}
            </button>
          ))}
        </div>
      </div>

      {/* Content Area */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label htmlFor="entry-content" className="text-xs font-semibold text-stone-700">
            Reflection & Thoughts *
          </label>
          <span className="text-[11px] text-stone-400 font-medium">
            {wordCount} {wordCount === 1 ? 'word' : 'words'}
          </span>
        </div>
        <textarea
          id="entry-content"
          rows={8}
          required
          placeholder="What is on your mind today? Write candidly and freely..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full p-3.5 rounded-xl border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-stone-800 focus:border-transparent resize-y leading-relaxed font-sans"
        />
      </div>

      {/* Tags */}
      <div>
        <label htmlFor="entry-tags" className="block text-xs font-semibold text-stone-700 mb-1 flex items-center gap-1">
          <Tag className="w-3.5 h-3.5 text-stone-400" />
          Tags (comma separated)
        </label>
        <input
          id="entry-tags"
          type="text"
          placeholder="e.g. mindfulness, morning-routine, career, family"
          value={tagsInput}
          onChange={(e) => setTagsInput(e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-stone-800 focus:border-transparent"
        />
      </div>

      {/* Auto-reflect toggle */}
      <div className="flex items-center gap-2.5 p-3 rounded-xl bg-amber-50/70 border border-amber-200/80">
        <input
          id="checkbox-auto-reflect"
          type="checkbox"
          checked={autoReflect}
          onChange={(e) => setAutoReflect(e.target.checked)}
          className="w-4 h-4 text-stone-900 border-stone-300 rounded focus:ring-stone-800"
        />
        <label htmlFor="checkbox-auto-reflect" className="text-xs text-stone-800 font-medium cursor-pointer flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
          Automatically generate Gemini AI reflection & sentiment upon saving
        </label>
      </div>

      {/* Action Buttons */}
      <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-stone-200">
        <button
          type="button"
          id="btn-cancel-editor"
          onClick={onClose}
          disabled={saving}
          className="px-4 py-2 rounded-lg text-xs font-medium text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          id="btn-save-entry"
          disabled={saving}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-stone-900 text-stone-50 text-xs font-medium hover:bg-stone-800 disabled:opacity-50 transition-colors shadow-xs"
        >
          {saving ? (
            <>
              <span className="w-3.5 h-3.5 border-2 border-stone-300 border-t-white rounded-full animate-spin" />
              {autoReflect ? 'Saving & Reflecting...' : 'Saving...'}
            </>
          ) : (
            <>
              <Check className="w-4 h-4" />
              {initialEntry ? 'Update Entry' : 'Save Reflection'}
            </>
          )}
        </button>
      </div>
    </form>
  );
}

export function EntryEditorModal({
  isOpen,
  onClose,
  onSave,
  initialEntry,
}: EntryEditorModalProps) {
  if (!isOpen) return null;

  return (
    <div
      id="entry-editor-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="entry-editor-dialog"
        className="w-full max-w-2xl bg-white rounded-2xl border border-stone-200 shadow-xl overflow-hidden my-8"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-200 bg-stone-50/80 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-stone-900">
              {initialEntry ? 'Edit Journal Entry' : 'New Journal Reflection'}
            </h2>
            <p className="text-xs text-stone-500">
              Capture your candid thoughts, feelings, and personal discoveries.
            </p>
          </div>

          <button
            id="btn-close-editor"
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body keyed to ensure clean re-mount upon entry change */}
        <EntryEditorForm
          key={initialEntry ? initialEntry.id : 'new'}
          initialEntry={initialEntry}
          onClose={onClose}
          onSave={onSave}
        />
      </div>
    </div>
  );
}
