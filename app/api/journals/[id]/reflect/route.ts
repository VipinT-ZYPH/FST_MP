import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/security/proxy';
import { getEntryById, saveReflection } from '@/lib/db';
import { generateJournalReflection } from '@/lib/ai/gemini';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, context: RouteContext) {
  try {
    const user = await requireAuth();
    const { id } = await context.params;

    const entry = await getEntryById(id, user.id);
    if (!entry) {
      return NextResponse.json({ error: 'Entry not found or access denied' }, { status: 404 });
    }

    const reflection = await generateJournalReflection({
      title: entry.title,
      content: entry.content,
      mood: entry.mood,
      date: entry.date,
    });

    const updatedEntry = await saveReflection(entry.id, user.id, reflection);

    return NextResponse.json({ success: true, reflection, entry: updatedEntry });
  } catch (error: any) {
    console.error('Reflection generation route error:', error);
    const status = error.message?.includes('UNAUTHORIZED') ? 401 : 500;
    return NextResponse.json({ error: error.message || 'Failed to generate reflection' }, { status });
  }
}
