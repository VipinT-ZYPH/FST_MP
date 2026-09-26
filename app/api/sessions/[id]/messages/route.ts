import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, sanitizeText } from '@/lib/security/proxy';
import { getJournalSession, addMessageToSession } from '@/lib/db';
import { generateChatFeedback } from '@/lib/ai/gemini';
import { ReflectionMode } from '@/lib/db/types';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id: sessionId } = await params;
    const body = await req.json();
    const { content, mode = 'balanced' } = body;

    if (!content || !content.trim()) {
      return NextResponse.json({ error: 'Message content cannot be empty' }, { status: 400 });
    }

    const session = await getJournalSession(sessionId, user.id);
    if (!session) {
      return NextResponse.json({ error: 'Journal session not found' }, { status: 404 });
    }

    const cleanContent = sanitizeText(content, 12000);
    const chosenMode: ReflectionMode = ['action_steps', 'reflection', 'balanced', 'socratic'].includes(mode)
      ? mode
      : 'balanced';

    // 1. Add user message
    const userMsg = await addMessageToSession(sessionId, user.id, {
      role: 'user',
      content: cleanContent,
      mode: chosenMode,
    });

    // 2. Prepare conversation history
    const history = session.messages.slice(-8).map((m) => ({
      role: m.role,
      content: m.content,
    }));

    // 3. Generate AI feedback with actionable steps / reflection
    const aiResult = await generateChatFeedback({
      userMessage: cleanContent,
      mode: chosenMode,
      history,
    });

    // 4. Save assistant response
    const assistantMsg = await addMessageToSession(sessionId, user.id, {
      role: 'assistant',
      content: aiResult.content,
      mode: chosenMode,
      actionSteps: aiResult.actionSteps,
      moodTag: aiResult.moodTag,
      sentimentScore: aiResult.sentimentScore,
      insights: aiResult.insights,
      growthPrompt: aiResult.growthPrompt,
    });

    return NextResponse.json({
      success: true,
      userMessage: userMsg,
      assistantMessage: assistantMsg,
    });
  } catch (error: any) {
    console.error('Session message processing error:', error);
    const status = error.message?.includes('UNAUTHORIZED') ? 401 : 500;
    return NextResponse.json(
      { error: error.message || 'Failed to process reflection message' },
      { status }
    );
  }
}
