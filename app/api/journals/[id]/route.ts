import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, sanitizeText } from '@/lib/security/proxy';
import { getEntryById, updateEntry, deleteEntry } from '@/lib/db';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const user = await requireAuth();
    const { id } = await context.params;
    const entry = await getEntryById(id, user.id);

    if (!entry) {
      return NextResponse.json({ error: 'Entry not found or access denied' }, { status: 404 });
    }

    return NextResponse.json({ success: true, entry });
  } catch (error: any) {
    const status = error.message?.includes('UNAUTHORIZED') ? 401 : 500;
    return NextResponse.json({ error: error.message || 'Failed to fetch entry' }, { status });
  }
}

export async function PUT(req: NextRequest, context: RouteContext) {
  try {
    const user = await requireAuth();
    const { id } = await context.params;
    const body = await req.json();
    const { title, content, mood, tags, date } = body;

    const existing = await getEntryById(id, user.id);
    if (!existing) {
      return NextResponse.json({ error: 'Entry not found or access denied' }, { status: 404 });
    }

    const updated = await updateEntry(id, user.id, {
      title: title !== undefined ? sanitizeText(title, 200) : undefined,
      content: content !== undefined ? sanitizeText(content, 15000) : undefined,
      mood,
      tags,
      date,
    });

    return NextResponse.json({ success: true, entry: updated });
  } catch (error: any) {
    const status = error.message?.includes('UNAUTHORIZED') ? 401 : 500;
    return NextResponse.json({ error: error.message || 'Failed to update entry' }, { status });
  }
}

export async function DELETE(req: NextRequest, context: RouteContext) {
  try {
    const user = await requireAuth();
    const { id } = await context.params;

    const existing = await getEntryById(id, user.id);
    if (!existing) {
      return NextResponse.json({ error: 'Entry not found or access denied' }, { status: 404 });
    }

    const success = await deleteEntry(id, user.id);
    return NextResponse.json({ success });
  } catch (error: any) {
    const status = error.message?.includes('UNAUTHORIZED') ? 401 : 500;
    return NextResponse.json({ error: error.message || 'Failed to delete entry' }, { status });
  }
}
