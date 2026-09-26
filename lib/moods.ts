import { MoodType } from './db/types';

export interface MoodConfig {
  label: string;
  emoji: string;
  bgClass: string;
  textClass: string;
  borderClass: string;
  description: string;
}

export const MOODS: Record<MoodType, MoodConfig> = {
  peaceful: {
    label: 'Peaceful',
    emoji: '🕊️',
    bgClass: 'bg-emerald-50',
    textClass: 'text-emerald-800',
    borderClass: 'border-emerald-200',
    description: 'Serene, centered, and tranquil stillness',
  },
  grateful: {
    label: 'Grateful',
    emoji: '🙏',
    bgClass: 'bg-amber-50',
    textClass: 'text-amber-800',
    borderClass: 'border-amber-200',
    description: 'Deep appreciation for life and people',
  },
  happy: {
    label: 'Joyful',
    emoji: '☀️',
    bgClass: 'bg-yellow-50',
    textClass: 'text-yellow-800',
    borderClass: 'border-yellow-200',
    description: 'Warmth, delight, and contentment',
  },
  reflective: {
    label: 'Reflective',
    emoji: '🌿',
    bgClass: 'bg-teal-50',
    textClass: 'text-teal-800',
    borderClass: 'border-teal-200',
    description: 'Introspective, seeking meaning and lessons',
  },
  energized: {
    label: 'Energized',
    emoji: '⚡',
    bgClass: 'bg-sky-50',
    textClass: 'text-sky-800',
    borderClass: 'border-sky-200',
    description: 'Motivated, creative, and enthusiastic focus',
  },
  anxious: {
    label: 'Anxious',
    emoji: '🌊',
    bgClass: 'bg-rose-50',
    textClass: 'text-rose-800',
    borderClass: 'border-rose-200',
    description: 'Tense, apprehensive, or feeling overwhelmed',
  },
  melancholy: {
    label: 'Melancholy',
    emoji: '🌧️',
    bgClass: 'bg-slate-100',
    textClass: 'text-slate-800',
    borderClass: 'border-slate-300',
    description: 'Gentle sadness, longing, or heavy nostalgia',
  },
};
