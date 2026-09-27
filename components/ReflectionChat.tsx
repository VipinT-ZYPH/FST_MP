'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Send,
  CheckCircle2,
  Circle,
  Clock,
  ListTodo,
  Compass,
  HelpCircle,
  Plus,
  Trash2,
  Lightbulb,
  MessageSquare,
  ArrowRight,
  BookMarked,
  Copy,
  Check,
  RotateCcw,
} from 'lucide-react';
import { User, JournalSession, ChatMessage, ReflectionMode, ActionStep } from '@/lib/db/types';

interface ReflectionChatProps {
  user: User;
  initialSessions: JournalSession[];
  onSaveAsEntry?: (title: string, content: string) => void;
}

const MODES: { id: ReflectionMode; label: string; icon: any; description: string }[] = [
  {
    id: 'action_steps',
    label: 'Action Steps',
    icon: ListTodo,
    description: 'Break down thoughts into clear, prioritized, actionable steps',
  },
  {
    id: 'balanced',
    label: 'Action & Insight',
    icon: Sparkles,
    description: 'Empathetic reflection combined with concrete next steps',
  },
  {
    id: 'reflection',
    label: 'Mindful Reflection',
    icon: Compass,
    description: 'Deep emotional validation, reframing, and perspective',
  },
  {
    id: 'socratic',
    label: 'Socratic Inquiry',
    icon: HelpCircle,
    description: 'Thoughtful probing questions to uncover root causes',
  },
];

const PROMPT_STARTERS = [
  {
    title: 'Overwhelmed with tasks',
    prompt: 'I feel completely overwhelmed by everything on my plate today. Can you help me break this down into bite-sized actionable steps?',
    mode: 'action_steps' as ReflectionMode,
  },
  {
    title: 'Work confrontation dilemma',
    prompt: 'I had a tense interaction with a colleague today and felt invalidated. How should I process this and what constructive actions should I take?',
    mode: 'balanced' as ReflectionMode,
  },
  {
    title: 'Weekly goal setting',
    prompt: 'I want to plan my priorities for this week so I stay focused on what actually moves the needle instead of busywork.',
    mode: 'action_steps' as ReflectionMode,
  },
  {
    title: 'Understanding procrastination',
    prompt: 'I keep delaying an important project even though I know I need to do it. Help me explore what is really blocking me.',
    mode: 'socratic' as ReflectionMode,
  },
];

const createTempId = () => `temp_u_${Math.random().toString(36).slice(2, 9)}`;

export function ReflectionChat({ user, initialSessions, onSaveAsEntry }: ReflectionChatProps) {
  const storageKey = `reflectai_chat_sessions_${user.email.toLowerCase()}`;

  const [sessions, setSessions] = useState<JournalSession[]>(() => {
    if (typeof window === 'undefined') return initialSessions;
    try {
      const savedRaw = localStorage.getItem(`reflectai_chat_sessions_${user.email.toLowerCase()}`);
      if (savedRaw) {
        const savedSessions: JournalSession[] = JSON.parse(savedRaw);
        if (Array.isArray(savedSessions) && savedSessions.length > 0) {
          const sessionMap = new Map<string, JournalSession>();
          initialSessions.forEach((s) => sessionMap.set(s.id, s));
          savedSessions.forEach((s) => {
            const existing = sessionMap.get(s.id);
            if (!existing || (s.messages && s.messages.length > (existing.messages?.length || 0))) {
              sessionMap.set(s.id, s);
            }
          });

          return Array.from(sessionMap.values()).sort(
            (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          );
        }
      }
    } catch (e) {
      console.error('Failed to parse local chat sessions:', e);
    }
    return initialSessions;
  });

  const [activeSessionId, setActiveSessionId] = useState<string>(() => {
    return sessions[0]?.id || initialSessions[0]?.id || '';
  });

  const [inputMessage, setInputMessage] = useState('');
  const [selectedMode, setSelectedMode] = useState<ReflectionMode>('action_steps');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Derive active session directly from sessions state
  const activeSession = sessions.find((s) => s.id === activeSessionId) || sessions[0] || null;

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Background server sync on mount
  useEffect(() => {
    if (sessions.length > 0) {
      fetch('/api/sessions/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessions }),
      }).catch(() => {});
    }
  }, []);

  // Save to localStorage when sessions change
  useEffect(() => {
    if (sessions.length > 0) {
      try {
        localStorage.setItem(storageKey, JSON.stringify(sessions));
      } catch (e) {
        console.error('Failed to save chat sessions to local storage:', e);
      }
    }
  }, [sessions, storageKey]);

  // Auto-scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeSession?.messages, loading]);

  // Create a new session
  const handleNewSession = async (initialTitle?: string) => {
    setErrorMessage(null);
    try {
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: initialTitle || 'New Reflection Session' }),
      });
      const data = await res.json();
      if (data.success && data.session) {
        setSessions((prev) => [data.session, ...prev]);
        setActiveSessionId(data.session.id);
        if (textareaRef.current) {
          textareaRef.current.focus();
        }
      }
    } catch (err) {
      console.error('Failed to create session:', err);
      setErrorMessage('Could not create new session. Please check your connection.');
    }
  };

  // Delete session
  const handleDeleteSession = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setErrorMessage(null);
    try {
      const res = await fetch(`/api/sessions/${id}`, { method: 'DELETE' });
      if (res.ok) {
        const remaining = sessions.filter((s) => s.id !== id);
        setSessions(remaining);
        if (activeSessionId === id) {
          setActiveSessionId(remaining[0]?.id || '');
        }
      }
    } catch (err) {
      console.error('Failed to delete session:', err);
      setErrorMessage('Failed to delete session.');
    }
  };

  // Send message
  const handleSendMessage = async (textToSend?: string, modeOverride?: ReflectionMode) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || loading) return;

    setErrorMessage(null);
    const mode = modeOverride || selectedMode;
    let targetSessionId = activeSessionId;

    // If no active session, create one first
    if (!targetSessionId) {
      try {
        const res = await fetch('/api/sessions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: text.slice(0, 36) }),
        });
        const data = await res.json();
        if (data.success && data.session) {
          targetSessionId = data.session.id;
          setActiveSessionId(targetSessionId);
          setSessions((prev) => [data.session, ...prev]);
        } else {
          return;
        }
      } catch {
        setErrorMessage('Failed to initialize session. Please try again.');
        return;
      }
    }

    // Optimistic user message with safe non-impure temp id
    const tempUserId = createTempId();
    const tempUserMsg: ChatMessage = {
      id: tempUserId,
      sessionId: targetSessionId,
      userId: user.id,
      role: 'user',
      content: text,
      mode,
      createdAt: new Date().toISOString(),
    };

    setSessions((prev) =>
      prev.map((s) =>
        s.id === targetSessionId
          ? { ...s, messages: [...s.messages, tempUserMsg] }
          : s
      )
    );

    setInputMessage('');
    setLoading(true);

    try {
      const res = await fetch(`/api/sessions/${targetSessionId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: text, mode }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to receive feedback');
      }

      // Update session with confirmed user message and assistant message
      setSessions((sList) =>
        sList.map((s) => {
          if (s.id === targetSessionId) {
            const filtered = s.messages.filter((m) => m.id !== tempUserMsg.id);
            return {
              ...s,
              title: s.title === 'New Reflection Session' ? text.slice(0, 32) : s.title,
              messages: [...filtered, data.userMessage, data.assistantMessage],
            };
          }
          return s;
        })
      );
    } catch (err: any) {
      console.error('Chat error:', err);
      setErrorMessage(err.message || 'Unable to receive AI reflection feedback. Please try again.');
      // Remove optimistic message on error
      setSessions((sList) =>
        sList.map((s) => {
          if (s.id === targetSessionId) {
            return {
              ...s,
              messages: s.messages.filter((m) => m.id !== tempUserMsg.id),
            };
          }
          return s;
        })
      );
    } finally {
      setLoading(false);
    }
  };

  // Toggle Action Step Completion
  const handleToggleStep = async (messageId: string, stepId: string) => {
    if (!activeSession) return;

    // Optimistic toggle in sessions state
    setSessions((prev) =>
      prev.map((s) => {
        if (s.id === activeSession.id) {
          return {
            ...s,
            messages: s.messages.map((m) => {
              if (m.id === messageId && m.actionSteps) {
                return {
                  ...m,
                  actionSteps: m.actionSteps.map((st) =>
                    st.id === stepId ? { ...st, completed: !st.completed } : st
                  ),
                };
              }
              return m;
            }),
          };
        }
        return s;
      })
    );

    try {
      await fetch(`/api/sessions/${activeSession.id}/messages/${messageId}/steps`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stepId }),
      });
    } catch (err) {
      console.error('Failed to toggle step on server:', err);
    }
  };

  // Quick Action: Break an existing reply into actionable steps
  const handleRequestBreakdown = (priorContent: string) => {
    const prompt = `Based on what we discussed: "${priorContent.slice(0, 150)}...", please break this directly into prioritized actionable steps with timeframes.`;
    handleSendMessage(prompt, 'action_steps');
  };

  // Copy Action Steps to clipboard
  const handleCopySteps = (steps: ActionStep[], msgId: string) => {
    const text = steps
      .map(
        (s, i) =>
          `${i + 1}. [${s.completed ? 'x' : ' '}] ${s.task} (${s.timeframe || 'Today'})`
      )
      .join('\n');
    navigator.clipboard.writeText(text);
    setCopiedId(msgId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-stone-50 border-t border-stone-200 overflow-hidden">
      {/* Sidebar: Reflection Chats List */}
      <aside className="w-72 sm:w-80 bg-stone-100/70 border-r border-stone-200 flex flex-col shrink-0">
        <div className="p-4 border-b border-stone-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-stone-700" />
            <h2 className="text-xs font-bold text-stone-800 uppercase tracking-wider">
              Journal Chats
            </h2>
          </div>
          <button
            id="btn-new-chat-session"
            type="button"
            onClick={() => handleNewSession()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-900 text-stone-50 text-xs font-medium hover:bg-stone-800 transition-colors shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5" />
            New Chat
          </button>
        </div>

        {/* Sessions scrollable list */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
          {sessions.length === 0 ? (
            <div className="p-6 text-center text-xs text-stone-400">
              No chat sessions yet. Type a message or click New Chat to begin!
            </div>
          ) : (
            sessions.map((sess) => {
              const isActive = sess.id === activeSessionId;
              const lastMsg = sess.messages[sess.messages.length - 1];
              const dateStr = new Date(sess.updatedAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              });

              return (
                <div
                  key={sess.id}
                  onClick={() => {
                    setActiveSessionId(sess.id);
                  }}
                  className={`group relative p-3 rounded-xl cursor-pointer transition-all border ${
                    isActive
                      ? 'bg-white border-stone-300 shadow-xs text-stone-900'
                      : 'bg-transparent border-transparent hover:bg-stone-200/60 text-stone-600'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-semibold truncate flex-1">
                      {sess.title || 'Untitled Session'}
                    </span>
                    <span className="text-[10px] text-stone-400 shrink-0">{dateStr}</span>
                  </div>
                  {lastMsg && (
                    <p className="text-[11px] text-stone-500 truncate mt-1">
                      {lastMsg.role === 'assistant' ? '✦ ' : 'You: '}
                      {lastMsg.content}
                    </p>
                  )}

                  {/* Delete icon */}
                  <button
                    type="button"
                    title="Delete session"
                    onClick={(e) => handleDeleteSession(sess.id, e)}
                    className="absolute right-2 top-2.5 opacity-0 group-hover:opacity-100 p-1 text-stone-400 hover:text-rose-600 rounded transition-opacity"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* User profile footer */}
        <div className="p-3 border-t border-stone-200 bg-stone-100/90 flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={user.avatarUrl}
              alt={user.name}
              className="w-7 h-7 rounded-full border border-stone-300 shrink-0"
            />
            <div className="min-w-0 text-left">
              <div className="text-xs font-medium text-stone-900 truncate">{user.name}</div>
              <div className="text-[10px] text-stone-500 truncate capitalize">{user.provider} Auth</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Chat Companion Area */}
      <main className="flex-1 flex flex-col bg-white overflow-hidden">
        {/* Chat Header Bar */}
        <header className="px-6 py-3.5 border-b border-stone-200 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4 text-amber-600" />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm font-semibold text-stone-900 truncate">
                {activeSession?.title || 'Interactive Reflection & Action Companion'}
              </h1>
              <p className="text-[11px] text-stone-400">
                AI feedback grounded in clarity, emotional intelligence, and execution
              </p>
            </div>
          </div>

          {activeSession && activeSession.messages.length > 0 && onSaveAsEntry && (
            <button
              type="button"
              id="btn-save-as-entry"
              onClick={() => {
                const combined = activeSession.messages
                  .map((m) => `${m.role === 'user' ? 'ME' : 'REFLECTION'}:\n${m.content}`)
                  .join('\n\n---\n\n');
                onSaveAsEntry(activeSession.title, combined);
              }}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-200 text-xs font-medium text-stone-700 hover:bg-stone-50 transition-colors"
            >
              <BookMarked className="w-3.5 h-3.5 text-stone-500" />
              Save as Formal Entry
            </button>
          )}
        </header>

        {errorMessage && (
          <div className="px-6 py-2.5 bg-rose-50 border-b border-rose-200 text-xs text-rose-800 flex items-center justify-between">
            <span>{errorMessage}</span>
            <button
              type="button"
              onClick={() => setErrorMessage(null)}
              className="text-rose-600 hover:text-rose-900 font-semibold underline text-[11px]"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {!activeSession || activeSession.messages.length === 0 ? (
            /* Blank state with quick prompt starters */
            <div className="max-w-2xl mx-auto py-8 sm:py-12 space-y-8">
              <div className="text-center space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-stone-900 text-amber-300 mx-auto flex items-center justify-center shadow-xs">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-stone-900 tracking-tight">
                  What is on your mind today?
                </h3>
                <p className="text-xs text-stone-500 max-w-md mx-auto">
                  Type whatever you are experiencing—stress, a to-do list, a tough dilemma, or stream of consciousness. We will turn it into grounded feedback and actionable steps.
                </p>
              </div>

              {/* Suggested prompt cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {PROMPT_STARTERS.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setSelectedMode(item.mode);
                      handleSendMessage(item.prompt, item.mode);
                    }}
                    className="text-left p-4 rounded-xl border border-stone-200 hover:border-stone-400 bg-stone-50/60 hover:bg-white transition-all shadow-2xs group"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-semibold text-stone-900 group-hover:text-stone-950">
                        {item.title}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-stone-400 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                    <p className="text-[11px] text-stone-500 line-clamp-2 leading-relaxed">
                      &ldquo;{item.prompt}&rdquo;
                    </p>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Active message thread */
            activeSession.messages.map((msg) => {
              const isUser = msg.role === 'user';

              return (
                <div
                  key={msg.id}
                  className={`flex gap-3 max-w-3xl ${
                    isUser ? 'ml-auto justify-end' : 'mr-auto justify-start'
                  }`}
                >
                  {!isUser && (
                    <div className="w-8 h-8 rounded-xl bg-stone-900 text-stone-50 flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                      <Sparkles className="w-4 h-4 text-amber-300" />
                    </div>
                  )}

                  <div className={`space-y-3 ${isUser ? 'max-w-xl' : 'w-full'}`}>
                    {/* Message Bubble */}
                    <div
                      className={`p-4 sm:p-5 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                        isUser
                          ? 'bg-stone-900 text-stone-50 rounded-tr-xs shadow-xs'
                          : 'bg-stone-50 border border-stone-200 text-stone-800 rounded-tl-xs shadow-2xs'
                      }`}
                    >
                      {/* Meta badge for assistant */}
                      {!isUser && msg.moodTag && (
                        <div className="flex items-center gap-2 mb-2 pb-2 border-b border-stone-200/70 text-[11px]">
                          <span className="font-semibold text-amber-800 bg-amber-100/70 px-2 py-0.5 rounded-md">
                            {msg.moodTag}
                          </span>
                          {msg.mode && (
                            <span className="text-stone-400 capitalize">
                              &middot; Mode: {msg.mode.replace('_', ' ')}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Content narrative */}
                      <div className="whitespace-pre-wrap leading-relaxed font-normal">
                        {msg.content}
                      </div>

                      {/* Action Steps Checklist Container */}
                      {!isUser && msg.actionSteps && msg.actionSteps.length > 0 && (
                        <div className="mt-4 pt-3 border-t border-stone-200">
                          <div className="flex items-center justify-between mb-2.5">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-stone-900 uppercase tracking-wider">
                              <ListTodo className="w-3.5 h-3.5 text-stone-700" />
                              <span>Actionable Steps Checklist</span>
                              <span className="text-[10px] font-normal text-stone-500 normal-case">
                                ({msg.actionSteps.filter((s) => s.completed).length}/
                                {msg.actionSteps.length} completed)
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleCopySteps(msg.actionSteps!, msg.id)}
                              className="inline-flex items-center gap-1 text-[11px] text-stone-500 hover:text-stone-800 transition-colors"
                            >
                              {copiedId === msg.id ? (
                                <>
                                  <Check className="w-3 h-3 text-emerald-600" />
                                  <span className="text-emerald-700">Copied</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3" />
                                  <span>Copy Steps</span>
                                </>
                              )}
                            </button>
                          </div>

                          <div className="space-y-2">
                            {msg.actionSteps.map((step) => (
                              <div
                                key={step.id}
                                onClick={() => handleToggleStep(msg.id, step.id)}
                                className={`flex items-start gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-all select-none ${
                                  step.completed
                                    ? 'bg-emerald-50/60 border-emerald-200 text-stone-400'
                                    : 'bg-white border-stone-200 text-stone-800 hover:border-stone-300'
                                }`}
                              >
                                <button
                                  type="button"
                                  className="mt-0.5 text-stone-400 hover:text-stone-700 shrink-0"
                                >
                                  {step.completed ? (
                                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                  ) : (
                                    <Circle className="w-4 h-4 text-stone-300 hover:text-stone-400" />
                                  )}
                                </button>
                                <div className="flex-1 min-w-0">
                                  <div
                                    className={`text-xs ${
                                      step.completed ? 'line-through text-stone-400' : 'font-medium'
                                    }`}
                                  >
                                    {step.task}
                                  </div>
                                </div>
                                {step.timeframe && (
                                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-stone-100 text-stone-500 shrink-0 font-medium flex items-center gap-1">
                                    <Clock className="w-2.5 h-2.5" />
                                    {step.timeframe}
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Key Insights List */}
                      {!isUser && msg.insights && msg.insights.length > 0 && (
                        <div className="mt-4 pt-3 border-t border-stone-200/70 space-y-1.5">
                          <div className="text-[11px] font-bold text-stone-700 uppercase tracking-wider flex items-center gap-1.5">
                            <Lightbulb className="w-3.5 h-3.5 text-amber-600" />
                            Key Insights & Patterns
                          </div>
                          <ul className="space-y-1 pl-1">
                            {msg.insights.map((insight, idx) => (
                              <li key={idx} className="text-xs text-stone-600 flex items-start gap-2">
                                <span className="text-amber-500 font-bold">&bull;</span>
                                <span>{insight}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Growth Prompt question */}
                      {!isUser && msg.growthPrompt && (
                        <div className="mt-3 p-2.5 rounded-xl bg-amber-50/80 border border-amber-200/80 text-amber-900 text-xs">
                          <span className="font-semibold block mb-0.5">Contemplation Question:</span>
                          <span className="italic text-amber-950">&ldquo;{msg.growthPrompt}&rdquo;</span>
                        </div>
                      )}
                    </div>

                    {/* Action buttons beneath assistant response */}
                    {!isUser && (
                      <div className="flex flex-wrap items-center gap-2 pl-2">
                        {(!msg.actionSteps || msg.actionSteps.length === 0) && (
                          <button
                            type="button"
                            onClick={() => handleRequestBreakdown(msg.content)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-stone-200 bg-white hover:bg-stone-50 text-[11px] font-medium text-stone-700 transition-colors shadow-2xs"
                          >
                            <ListTodo className="w-3 h-3 text-stone-500" />
                            Break into Action Steps
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            const prompt = `Can you expand deeper on this perspective: "${msg.content.slice(0, 100)}..."?`;
                            handleSendMessage(prompt, 'reflection');
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-stone-200 bg-white hover:bg-stone-50 text-[11px] font-medium text-stone-700 transition-colors shadow-2xs"
                        >
                          <Compass className="w-3 h-3 text-stone-500" />
                          Reflect Deeper
                        </button>
                      </div>
                    )}
                  </div>

                  {isUser && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={user.avatarUrl}
                      alt={user.name}
                      className="w-8 h-8 rounded-xl border border-stone-300 shrink-0 mt-0.5 object-cover"
                    />
                  )}
                </div>
              );
            })
          )}

          {/* Loading indicator */}
          {loading && (
            <div className="flex gap-3 max-w-3xl mr-auto justify-start animate-in fade-in duration-150">
              <div className="w-8 h-8 rounded-xl bg-stone-900 text-stone-50 flex items-center justify-center shrink-0 shadow-xs">
                <Sparkles className="w-4 h-4 text-amber-300 animate-spin" />
              </div>
              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 text-stone-600 text-xs flex items-center gap-2">
                <div className="flex gap-1">
                  <div className="w-2 h-2 rounded-full bg-stone-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 rounded-full bg-stone-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 rounded-full bg-stone-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span>Synthesizing reflection and actionable steps...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar with Mode Switcher */}
        <div className="p-4 border-t border-stone-200 bg-white shrink-0 space-y-2">
          {/* Mode Selector Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider mr-1">
              Mode:
            </span>
            {MODES.map((m) => {
              const Icon = m.icon;
              const isSelected = selectedMode === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setSelectedMode(m.id)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all text-xs font-medium whitespace-nowrap ${
                    isSelected
                      ? 'bg-stone-900 text-white border-stone-900 shadow-2xs'
                      : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100 hover:text-stone-900'
                  }`}
                  title={m.description}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{m.label}</span>
                </button>
              );
            })}
          </div>

          {/* Text Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-end gap-2 bg-stone-50 border border-stone-200 focus-within:border-stone-400 focus-within:ring-2 focus-within:ring-stone-900/10 rounded-2xl p-2 transition-all"
          >
            <textarea
              ref={textareaRef}
              id="input-chat-reflection"
              rows={2}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="What are you experiencing? Pour your thoughts, to-dos, challenges, or dilemmas here..."
              className="flex-1 bg-transparent border-0 resize-none text-xs sm:text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none p-1.5 max-h-32"
            />

            <button
              id="btn-send-chat"
              type="submit"
              disabled={!inputMessage.trim() || loading}
              className="p-2.5 rounded-xl bg-stone-900 text-white hover:bg-stone-800 disabled:opacity-40 transition-colors shrink-0 shadow-xs"
              title="Send (Enter)"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
          <div className="flex items-center justify-between text-[11px] text-stone-400 px-1">
            <span>Press Enter to send, Shift+Enter for new line</span>
            <span>All chats securely stored in your personal space</span>
          </div>
        </div>
      </main>
    </div>
  );
}
