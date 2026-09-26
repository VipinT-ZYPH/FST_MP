import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/security/proxy';
import { getSystemMetrics } from '@/lib/db';

export async function GET() {
  try {
    await requireAdmin();
    const metrics = await getSystemMetrics();
    return NextResponse.json({ success: true, metrics });
  } catch (error: any) {
    const status = error.message?.includes('UNAUTHORIZED')
      ? 401
      : error.message?.includes('FORBIDDEN')
      ? 403
      : 500;
    return NextResponse.json({ error: error.message || 'Access denied' }, { status });
  }
}
