'use server';

import { revalidatePath } from 'next/cache';
import { requireAuth, setSessionCookie, clearSessionCookie } from '@/lib/security/proxy';
import {
  createEntry,
  updateEntry,
  deleteEntry,
  getEntryById,
  saveReflection,
  listEntries,
  saveWeeklySynthesis,
  createOrUpdateUser,
} from '@/lib/db';
import { generateJournalReflection, generateWeeklySynthesis } from '@/lib/ai/gemini';
import { MoodType } from '@/lib/db/types';

export async function loginAction(formData: {
  email: string;
  name?: string;
  avatarUrl?: string;
  provider?: 'google' | 'github';
  role?: 'user' | 'admin';
}) {
  const user = await createOrUpdateUser({
    email: formData.email,
    name: formData.name || formData.email.split('@')[0],
    avatarUrl: formData.avatarUrl,
    provider: formData.provider || 'google',
    role: formData.role,
  });

  await setSessionCookie(user.id);
  revalidatePath('/dashboard');
  revalidatePath('/');
  return { success: true, user };
}

export async function logoutAction() {
  await clearSessionCookie();
  revalidatePath('/');
  revalidatePath('/dashboard');
  return { success: true };
}

export async function createJournalEntryAction(data: {
  title: string;
  content: string;
  mood: MoodType;
  tags?: string[];
  date?: string;
  generateReflectionImmediately?: boolean;
}) {
  const user = await requireAuth();

  let entry = await createEntry(user.id, {
    title: data.title,
    content: data.content,
    mood: data.mood,
    tags: data.tags,
    date: data.date,
  });

  if (data.generateReflectionImmediately) {
    try {
      const reflection = await generateJournalReflection({
        title: entry.title,
        content: entry.content,
        mood: entry.mood,
        date: entry.date,
      });
      const updated = await saveReflection(entry.id, user.id, reflection);
      if (updated) entry = updated;
    } catch (e) {
      console.error('Server action immediate reflection error:', e);
    }
  }

  revalidatePath('/dashboard');
  revalidatePath(`/dashboard/entries/${entry.id}`);
  return { success: true, entry };
}

export async function updateJournalEntryAction(
  entryId: string,
  data: {
    title?: string;
    content?: string;
    mood?: MoodType;
    tags?: string[];
    date?: string;
  }
) {
  const user = await requireAuth();
  const updated = await updateEntry(entryId, user.id, data);

  if (!updated) {
    throw new Error('Entry not found or unauthorized');
  }

  revalidatePath('/dashboard');
  revalidatePath(`/dashboard/entries/${entryId}`);
  return { success: true, entry: updated };
}

export async function deleteJournalEntryAction(entryId: string) {
  const user = await requireAuth();
  const ok = await deleteEntry(entryId, user.id);

  if (!ok) {
    throw new Error('Entry not found or unauthorized');
  }

  revalidatePath('/dashboard');
  return { success: true };
}

export async function generateEntryReflectionAction(entryId: string) {
  const user = await requireAuth();
  const entry = await getEntryById(entryId, user.id);

  if (!entry) {
    throw new Error('Entry not found or unauthorized');
  }

  const reflection = await generateJournalReflection({
    title: entry.title,
    content: entry.content,
    mood: entry.mood,
    date: entry.date,
  });

  const updated = await saveReflection(entry.id, user.id, reflection);

  revalidatePath('/dashboard');
  revalidatePath(`/dashboard/entries/${entryId}`);
  return { success: true, reflection, entry: updated };
}

export async function generateSynthesisAction(periodLabel = 'Past 7 Days') {
  const user = await requireAuth();
  const entries = await listEntries(user.id);

  if (entries.length === 0) {
    throw new Error('No journal entries found to synthesize');
  }

  const synthesisData = await generateWeeklySynthesis(entries, periodLabel);
  const saved = await saveWeeklySynthesis(user.id, synthesisData);

  revalidatePath('/dashboard');
  return { success: true, synthesis: saved };
}
