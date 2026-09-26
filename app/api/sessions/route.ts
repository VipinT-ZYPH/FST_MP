import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/security/proxy';
import { listJournalSessions, createJournalSession } from '@/lib/db';

export async function GET() {
  try {
    const user = await requireAuth();
    const sessions = await listJournalSessions(user.id);
    return NextResponse.json({ success: true, sessions });
  } catch (error: any) {
    const status = error.message?.includes('UNAUTHORIZED') ? 401 : 500;
    return NextResponse.json({ error: error.message || 'Failed to fetch sessions' }, { status });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await req.json().catch(() => ({}));
    const { title } = body;

    const session = await createJournalSession(user.id, title);
    return NextResponse.json({ success: true, session });
  } catch (error: any) {
    const status = error.message?.includes('UNAUTHORIZED') ? 401 : 500;
    return NextResponse.json({ error: error.message || 'Failed to create session' }, { status });
  }
}
