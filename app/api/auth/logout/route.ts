import { NextResponse } from 'next/server';
import { clearSessionCookie, SESSION_COOKIE_NAME } from '@/lib/security/proxy';

export async function POST() {
  await clearSessionCookie();
  const response = NextResponse.json({ success: true });
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: '',
    path: '/',
    maxAge: 0,
    expires: new Date(0),
    httpOnly: false,
    secure: true,
    sameSite: 'none',
  });
  return response;
}
