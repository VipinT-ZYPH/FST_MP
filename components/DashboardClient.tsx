'use client';

import React, { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  Filter,
  Sparkles,
  BookOpen,
  Calendar,
  Compass,
  Download,
  Flame,
  CheckCircle2,
  Trash2,
  Smile,
} from 'lucide-react';
import { User, JournalEntry, MoodType, WeeklySynthesis, JournalSession } from '@/lib/db/types';
import { Navbar } from '@/components/Navbar';
import { JournalCard } from '@/components/JournalCard';
import { EntryEditorModal } from '@/components/EntryEditorModal';
import { ReflectionModal } from '@/components/ReflectionModal';
import { WeeklySynthesisModal } from '@/components/WeeklySynthesisModal';
import { ReflectionChat } from '@/components/ReflectionChat';
import { MOODS } from '@/lib/moods';

interface DashboardClientProps {
  user: User;
  initialEntries: JournalEntry[];
  initialSynthesis: WeeklySynthesis | null;
  initialSessions?: JournalSession[];
}

export function DashboardClient({
  user,
  initialEntries,
  initialSynthesis,
  initialSessions = [],
}: DashboardClientProps) {
  const [activeTab, setActiveTab] = useState<'chat' | 'journal'>('chat');
  const [entries, setEntries] = useState<JournalEntry[]>(initialEntries);
  const [synthesis, setSynthesis] = useState<WeeklySynthesis | null>(initialSynthesis);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMood, setSelectedMood] = useState<string>('all');
  const [selectedTag, setSelectedTag] = useState<string>('all');

  // Modals state
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);

  const [activeReflectionEntry, setActiveReflectionEntry] = useState<JournalEntry | null>(null);
  const [isReflectionModalOpen, setIsReflectionModalOpen] = useState(false);
  const [reflectingEntryId, setReflectingEntryId] = useState<string | null>(null);

  const [isSynthesisModalOpen, setIsSynthesisModalOpen] = useState(false);
  const [isGeneratingSynthesis, setIsGeneratingSynthesis] = useState(false);

  // Delete state
  const [deletingEntry, setDeletingEntry] = useState<JournalEntry | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Available tags in current entries
  const availableTags = useMemo(() => {
    const set = new Set<string>();
    entries.forEach((e) => e.tags?.forEach((t) => set.add(t.toLowerCase())));
    return Array.from(set).sort();
  }, [entries]);

  // Filtered entries
  const filteredEntries = useMemo(() => {
    return entries.filter((e) => {
      if (selectedMood !== 'all' && e.mood !== selectedMood) return false;
      if (selectedTag !== 'all' && !e.tags.some((t) => t.toLowerCase() === selectedTag)) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = e.title.toLowerCase().includes(q);
        const matchContent = e.content.toLowerCase().includes(q);
        const matchTags = e.tags.some((t) => t.toLowerCase().includes(q));
        if (!matchTitle && !matchContent && !matchTags) return false;
      }
      return true;
    });
  }, [entries, selectedMood, selectedTag, searchQuery]);

  // Streak calculation (days with entries)
  const streakCount = useMemo(() => {
    if (entries.length === 0) return 0;
    const dates = Array.from(new Set(entries.map((e) => e.date))).sort().reverse();
    let streak = 1;
    let curr = new Date(dates[0]);
    for (let i = 1; i < dates.length; i++) {
      const prev = new Date(dates[i]);
      const diffDays = Math.round((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        streak++;
        curr = prev;
      } else {
        break;
      }
    }
    return streak;
  }, [entries]);

  // Handlers
  const handleSaveEntry = async (data: {
    id?: string;
    title: string;
    content: string;
    mood: MoodType;
    tags: string[];
    date: string;
    autoReflect: boolean;
  }) => {
    if (data.id) {
      // Update
      const res = await fetch(`/api/journals/${data.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || 'Failed to update entry');

      setEntries((prev) => prev.map((e) => (e.id === data.id ? resData.entry : e)));
    } else {
      // Create
      const res = await fetch('/api/journals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || 'Failed to create entry');

      setEntries((prev) => [resData.entry, ...prev]);

      // If immediate reflection was returned, show it or notify
      if (resData.entry.reflection) {
        setActiveReflectionEntry(resData.entry);
        setIsReflectionModalOpen(true);
      }
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingEntry) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/journals/${deletingEntry.id}`, { method: 'DELETE' });
      if (res.ok) {
        setEntries((prev) => prev.filter((e) => e.id !== deletingEntry.id));
        setDeletingEntry(null);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleReflectNow = async (entryId: string) => {
    setReflectingEntryId(entryId);
    try {
      const res = await fetch(`/api/journals/${entryId}/reflect`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate reflection');

      setEntries((prev) => prev.map((e) => (e.id === entryId ? data.entry : e)));
      setActiveReflectionEntry(data.entry);
      setIsReflectionModalOpen(true);
    } catch (err: any) {
      alert(err.message || 'Error generating AI reflection');
    } finally {
      setReflectingEntryId(null);
    }
  };

  const handleGenerateSynthesis = async () => {
    setIsGeneratingSynthesis(true);
    try {
      const res = await fetch('/api/journals/synthesis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ periodLabel: 'Recent Journal Reflections' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to synthesize');

      setSynthesis(data.synthesis);
    } catch (err: any) {
      alert(err.message || 'Error generating holistic synthesis');
    } finally {
      setIsGeneratingSynthesis(false);
    }
  };

  const handleExportData = () => {
    const markdown = entries
      .map((e) => {
        let text = `# ${e.title}\n**Date:** ${e.date} | **Mood:** ${e.mood}\n**Tags:** ${e.tags.join(', ')}\n\n${e.content}\n`;
        if (e.reflection) {
          text += `\n### AI Reflection\n${e.reflection.mindfulReflection}\n\n**Key Insights:**\n${e.reflection.keyInsights.map((k) => `- ${k}`).join('\n')}\n\n**Growth Prompt:** ${e.reflection.growthPrompt}\n`;
        }
        return text;
      })
      .join('\n\n---\n\n');

    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `my-journal-export-${new Date().toISOString().split('T')[0]}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 flex flex-col">
      <Navbar user={user} onOpenNewEntry={() => { setEditingEntry(null); setIsEditorOpen(true); }} />

      {/* Sub-header Navigation Switcher */}
      <div className="bg-white border-b border-stone-200 px-4 sm:px-6 lg:px-8 shrink-0">
        <div className="max-w-7xl mx-auto flex items-center justify-between py-2.5">
          {/* View Switcher Tabs */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-stone-100 border border-stone-200/80">
            <button
              id="tab-chat-companion"
              type="button"
              onClick={() => setActiveTab('chat')}
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'chat'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Reflection Chat & Action Steps</span>
            </button>

            <button
              id="tab-journal-archive"
              type="button"
              onClick={() => setActiveTab('journal')}
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'journal'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 text-stone-500" />
              <span>Saved Journal Log ({entries.length})</span>
            </button>
          </div>

          {/* Quick Stats or Actions */}
          <div className="hidden sm:flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-50 border border-amber-200/60 text-amber-900 text-xs font-semibold">
              <Flame className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
              <span>{streakCount} {streakCount === 1 ? 'Day' : 'Days'} Habit</span>
            </div>

            <button
              id="btn-open-synthesis"
              onClick={() => setIsSynthesisModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-stone-100 hover:bg-stone-200/80 text-stone-700 text-xs font-medium transition-colors border border-stone-200"
            >
              <Compass className="w-3.5 h-3.5 text-teal-700" />
              <span>Growth Synthesis</span>
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'chat' ? (
        <ReflectionChat
          user={user}
          initialSessions={initialSessions}
          onSaveAsEntry={(title, content) => {
            setEditingEntry({
              id: '',
              userId: user.id,
              title,
              content,
              mood: 'reflective',
              tags: ['chat-reflection'],
              date: new Date().toISOString().split('T')[0],
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            });
            setIsEditorOpen(true);
          }}
        />
      ) : (
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-6">
        {/* Welcome Banner & Overview Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-stone-200 shadow-xs">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1">
              <span>Personal Vault</span>
              <span>&middot;</span>
              <span>{user.email}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-stone-900">
              Welcome back, {user.name.split(' ')[0]}
            </h1>
            <p className="text-xs sm:text-sm text-stone-600 mt-1">
              You have recorded {entries.length} reflections. Take a quiet breath and notice how you feel right now.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Streak Counter */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-900 text-xs font-semibold">
              <Flame className="w-4 h-4 text-amber-600 fill-amber-500" />
              <span>{streakCount} {streakCount === 1 ? 'Day' : 'Days'} Mindful Habit</span>
            </div>

            {/* Growth Synthesis Button */}
            <button
              id="btn-open-synthesis"
              onClick={() => setIsSynthesisModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-stone-100 hover:bg-stone-200/80 text-stone-800 text-xs font-medium transition-colors border border-stone-300 shadow-xs"
            >
              <Compass className="w-4 h-4 text-teal-700" />
              <span>Growth Synthesis</span>
            </button>

            {/* New Entry Button */}
            <button
              id="btn-main-new-entry"
              onClick={() => {
                setEditingEntry(null);
                setIsEditorOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-50 text-xs font-medium transition-colors shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Write Reflection</span>
            </button>
          </div>
        </div>

        {/* Filters and Search Bar */}
        <div className="p-4 rounded-2xl border border-stone-200 bg-white flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="input-search-entries"
              type="text"
              placeholder="Search reflections, insights, or topics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-stone-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-stone-800 focus:border-transparent transition-all"
            />
          </div>

          {/* Mood Filter */}
          <div className="flex items-center gap-2">
            <select
              id="select-mood-filter"
              value={selectedMood}
              onChange={(e) => setSelectedMood(e.target.value)}
              className="px-3 py-2 rounded-xl border border-stone-200 text-xs text-stone-700 bg-white focus:outline-none focus:ring-2 focus:ring-stone-800"
            >
              <option value="all">All Emotional Moods</option>
              {(Object.keys(MOODS) as MoodType[]).map((m) => (
                <option key={m} value={m}>
                  {MOODS[m].emoji} {MOODS[m].label}
                </option>
              ))}
            </select>

            {/* Tag Filter */}
            {availableTags.length > 0 && (
              <select
                id="select-tag-filter"
                value={selectedTag}
                onChange={(e) => setSelectedTag(e.target.value)}
                className="px-3 py-2 rounded-xl border border-stone-200 text-xs text-stone-700 bg-white focus:outline-none focus:ring-2 focus:ring-stone-800"
              >
                <option value="all">All Tags</option>
                {availableTags.map((t) => (
                  <option key={t} value={t}>
                    #{t}
                  </option>
                ))}
              </select>
            )}

            {/* Export Markdown */}
            <button
              id="btn-export-markdown"
              onClick={handleExportData}
              title="Export entries to Markdown"
              className="p-2 rounded-xl border border-stone-200 text-stone-500 hover:text-stone-900 hover:bg-stone-50 transition-colors"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Entries Grid */}
        {filteredEntries.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-stone-300 bg-white/60 p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-stone-100 text-stone-500 flex items-center justify-center mx-auto mb-3">
              <BookOpen className="w-6 h-6 text-stone-400" />
            </div>
            <h3 className="text-sm font-semibold text-stone-800 mb-1">
              No matching journal entries found
            </h3>
            <p className="text-xs text-stone-500 max-w-sm mx-auto mb-5">
              {searchQuery || selectedMood !== 'all' || selectedTag !== 'all'
                ? 'Try adjusting your search terms or clearing active filters.'
                : 'Begin your journey today by writing your first candid reflection.'}
            </p>
            <button
              id="btn-empty-new-entry"
              onClick={() => {
                setSearchQuery('');
                setSelectedMood('all');
                setSelectedTag('all');
                setEditingEntry(null);
                setIsEditorOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-stone-900 text-stone-50 text-xs font-medium hover:bg-stone-800 transition-colors shadow-xs"
            >
              <Plus className="w-4 h-4" />
              Write New Reflection
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredEntries.map((entry) => (
              <JournalCard
                key={entry.id}
                entry={entry}
                onViewReflection={(e) => {
                  setActiveReflectionEntry(e);
                  setIsReflectionModalOpen(true);
                }}
                onEdit={(e) => {
                  setEditingEntry(e);
                  setIsEditorOpen(true);
                }}
                onDelete={(e) => {
                  setDeletingEntry(e);
                }}
                onReflectNow={handleReflectNow}
                isReflecting={reflectingEntryId === entry.id}
              />
            ))}
          </div>
        )}
      </main>
      )}

      {/* Editor Modal (Create & Edit) */}
      <EntryEditorModal
        isOpen={isEditorOpen}
        onClose={() => {
          setIsEditorOpen(false);
          setEditingEntry(null);
        }}
        onSave={handleSaveEntry}
        initialEntry={editingEntry}
      />

      {/* Reflection Modal */}
      <ReflectionModal
        isOpen={isReflectionModalOpen}
        onClose={() => {
          setIsReflectionModalOpen(false);
          setActiveReflectionEntry(null);
        }}
        entry={activeReflectionEntry}
        onRegenerate={handleReflectNow}
        isRegenerating={reflectingEntryId === activeReflectionEntry?.id}
      />

      {/* Weekly Synthesis Modal */}
      <WeeklySynthesisModal
        isOpen={isSynthesisModalOpen}
        onClose={() => setIsSynthesisModalOpen(false)}
        synthesis={synthesis}
        onGenerate={handleGenerateSynthesis}
        isGenerating={isGeneratingSynthesis}
      />

      {/* Delete Confirmation Modal */}
      {deletingEntry && (
        <div
          id="delete-modal-backdrop"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs"
        >
          <div className="w-full max-w-md bg-white rounded-2xl border border-stone-200 shadow-xl p-6 space-y-4">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-stone-900">
                Delete journal reflection?
              </h3>
              <p className="text-xs text-stone-500 mt-1">
                Are you sure you want to delete &ldquo;{deletingEntry.title}&rdquo;? This action cannot be undone.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                id="btn-cancel-delete"
                onClick={() => setDeletingEntry(null)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-lg text-xs font-medium text-stone-600 hover:text-stone-900 hover:bg-stone-100"
              >
                Cancel
              </button>
              <button
                type="button"
                id="btn-confirm-delete"
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="px-4 py-2 rounded-lg bg-rose-600 text-white text-xs font-medium hover:bg-rose-700 disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Delete Entry'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
