import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, sanitizeText } from '@/lib/security/proxy';
import { listEntries, createEntry } from '@/lib/db';
import { generateJournalReflection } from '@/lib/ai/gemini';
import { saveReflection } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth();
    const searchParams = req.nextUrl.searchParams;
    const mood = searchParams.get('mood') || undefined;
    const tag = searchParams.get('tag') || undefined;
    const search = searchParams.get('search') || undefined;

    const entries = await listEntries(user.id, { mood, tag, search });
    return NextResponse.json({ success: true, entries });
  } catch (error: any) {
    const status = error.message?.includes('UNAUTHORIZED') ? 401 : 500;
    return NextResponse.json({ error: error.message || 'Failed to fetch entries' }, { status });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await req.json();
    const { title, content, mood, tags, date, autoReflect } = body;

    if (!content || !content.trim()) {
      return NextResponse.json({ error: 'Journal entry content is required' }, { status: 400 });
    }

    const sanitizedTitle = sanitizeText(title || 'Untitled Reflection', 200);
    const sanitizedContent = sanitizeText(content, 15000);

    let entry = await createEntry(user.id, {
      title: sanitizedTitle,
      content: sanitizedContent,
      mood: mood || 'reflective',
      tags: Array.isArray(tags) ? tags : [],
      date: date || new Date().toISOString().split('T')[0],
    });

    // Optionally trigger immediate AI reflection
    if (autoReflect) {
      try {
        const reflection = await generateJournalReflection({
          title: entry.title,
          content: entry.content,
          mood: entry.mood,
          date: entry.date,
        });
        const updated = await saveReflection(entry.id, user.id, reflection);
        if (updated) {
          entry = updated;
        }
      } catch (aiErr) {
        console.warn('Background reflection generation note:', aiErr);
      }
    }

    return NextResponse.json({ success: true, entry }, { status: 201 });
  } catch (error: any) {
    const status = error.message?.includes('UNAUTHORIZED') ? 401 : 500;
    return NextResponse.json({ error: error.message || 'Failed to create entry' }, { status });
  }
}
