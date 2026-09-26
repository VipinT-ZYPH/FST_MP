export type UserRole = 'user' | 'admin';

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl: string;
  provider: 'google' | 'github' | 'email' | 'credentials';
  role: UserRole;
  createdAt: string;
  lastLoginAt: string;
  password?: string;
}

export type MoodType =
  | 'peaceful'
  | 'grateful'
  | 'happy'
  | 'reflective'
  | 'energized'
  | 'anxious'
  | 'melancholy';

export interface SentimentAnalysis {
  mood: string;
  score: number; // 1 to 10
  positivity: 'positive' | 'neutral' | 'challenging';
  emotionalTones: string[];
}

export interface JournalReflection {
  summary: string;
  mindfulReflection: string;
  keyInsights: string[];
  sentiment: SentimentAnalysis;
  growthPrompt: string;
  actionableAdvice: string[];
  generatedAt: string;
}

export interface JournalEntry {
  id: string;
  userId: string;
  title: string;
  content: string;
  mood: MoodType;
  tags: string[];
  date: string; // YYYY-MM-DD
  createdAt: string;
  updatedAt: string;
  reflection?: JournalReflection | null;
}

export interface ActionStep {
  id: string;
  task: string;
  timeframe?: string;
  completed: boolean;
}

export type ReflectionMode = 'action_steps' | 'reflection' | 'balanced' | 'socratic';

export interface ChatMessage {
  id: string;
  sessionId: string;
  userId: string;
  role: 'user' | 'assistant';
  content: string;
  mode?: ReflectionMode;
  createdAt: string;
  actionSteps?: ActionStep[];
  moodTag?: string;
  sentimentScore?: number;
  insights?: string[];
  growthPrompt?: string;
}

export interface JournalSession {
  id: string;
  userId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: ChatMessage[];
}

export interface WeeklySynthesis {
  id: string;
  userId: string;
  period: string;
  overview: string;
  keyThemes: string[];
  emotionalLandscape: string;
  growthMilestones: string[];
  guidingQuestion: string;
  generatedAt: string;
}

export interface SessionData {
  user: User;
  token: string;
  expiresAt: number;
}
