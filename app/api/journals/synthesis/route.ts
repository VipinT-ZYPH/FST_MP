import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/security/proxy';
import { listEntries, saveWeeklySynthesis, getLatestSynthesis } from '@/lib/db';
import { generateWeeklySynthesis } from '@/lib/ai/gemini';

export async function GET() {
  try {
    const user = await requireAuth();
    const synthesis = await getLatestSynthesis(user.id);
    return NextResponse.json({ success: true, synthesis });
  } catch (error: any) {
    const status = error.message?.includes('UNAUTHORIZED') ? 401 : 500;
    return NextResponse.json({ error: error.message || 'Failed to fetch synthesis' }, { status });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await req.json().catch(() => ({}));
    const periodLabel = body.periodLabel || 'Past 7 Days';

    const entries = await listEntries(user.id);
    if (entries.length === 0) {
      return NextResponse.json(
        { error: 'You need at least one journal entry to generate a holistic synthesis.' },
        { status: 400 }
      );
    }

    const synthesisData = await generateWeeklySynthesis(entries, periodLabel);
    const saved = await saveWeeklySynthesis(user.id, synthesisData);

    return NextResponse.json({ success: true, synthesis: saved });
  } catch (error: any) {
    console.error('Synthesis route error:', error);
    const status = error.message?.includes('UNAUTHORIZED') ? 401 : 500;
    return NextResponse.json({ error: error.message || 'Failed to generate synthesis' }, { status });
  }
}
