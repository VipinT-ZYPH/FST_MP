import { NextRequest, NextResponse } from 'next/server';
import { createOrUpdateUser } from '@/lib/db';
import { setSessionCookie, SESSION_COOKIE_NAME } from '@/lib/security/proxy';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, name, avatarUrl, provider, role } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const user = await createOrUpdateUser({
      email,
      name: name || email.split('@')[0],
      avatarUrl,
      provider: provider === 'github' ? 'github' : 'google',
      role: role || 'user',
    });

    const token = await setSessionCookie(user.id);

    const response = NextResponse.json({ success: true, user, token });
    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: token,
      httpOnly: false,
      secure: true,
      sameSite: 'none',
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
    });

    return response;
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json({ error: error.message || 'Authentication failed' }, { status: 500 });
  }
}

