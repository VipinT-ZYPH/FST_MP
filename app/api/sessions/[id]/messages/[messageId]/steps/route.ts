import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/security/proxy';
import { toggleActionStep } from '@/lib/db';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; messageId: string }> }
) {
  try {
    const user = await requireAuth();
    const { id: sessionId, messageId } = await params;
    const body = await req.json();
    const { stepId } = body;

    if (!stepId) {
      return NextResponse.json({ error: 'stepId is required' }, { status: 400 });
    }

    const success = await toggleActionStep(sessionId, messageId, stepId, user.id);

    if (!success) {
      return NextResponse.json({ error: 'Step not found or update failed' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    const status = error.message?.includes('UNAUTHORIZED') ? 401 : 500;
    return NextResponse.json(
      { error: error.message || 'Failed to toggle action step' },
      { status }
    );
  }
}
