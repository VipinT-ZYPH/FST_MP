import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/security/proxy';
import { saveBulkSessions, saveBulkEntries, listJournalSessions, listEntries } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await req.json().catch(() => ({}));
    const { sessions = [], entries = [] } = body;

    if (Array.isArray(sessions) && sessions.length > 0) {
      await saveBulkSessions(user.id, sessions);
    }

    if (Array.isArray(entries) && entries.length > 0) {
      await saveBulkEntries(user.id, entries);
    }

    const [updatedSessions, updatedEntries] = await Promise.all([
      listJournalSessions(user.id),
      listEntries(user.id),
    ]);

    return NextResponse.json({
      success: true,
      sessions: updatedSessions,
      entries: updatedEntries,
    });
  } catch (error: any) {
    const status = error.message?.includes('UNAUTHORIZED') ? 401 : 500;
    return NextResponse.json({ error: error.message || 'Failed to sync sessions' }, { status });
  }
}
