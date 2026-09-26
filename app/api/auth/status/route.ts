import { NextResponse } from 'next/server';
import { getDbStatus } from '@/lib/db';

export async function GET() {
  const dbStatus = await getDbStatus();
  return NextResponse.json({
    success: true,
    dbStatus,
  });
}
