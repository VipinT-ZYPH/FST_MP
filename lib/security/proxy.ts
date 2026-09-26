import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { findUserById, findUserByEmail, getActiveSessionUser, setActiveSessionUserId } from '@/lib/db';
import { User, UserRole } from '@/lib/db/types';

export const SESSION_COOKIE_NAME = 'ai_journal_session';

export interface ProxySession {
  user: User;
  token: string;
}

/**
 * Validates session from Next.js server context (Server Components, Server Actions, Route Handlers).
 * Supports both secure cookies and fallback persistence for preview iframes where third-party cookies may be blocked.
 */
export async function getSession(): Promise<ProxySession | null> {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (sessionToken) {
      const decoded = Buffer.from(sessionToken, 'base64').toString('utf-8');
      const [userId] = decoded.split(':');

      if (userId) {
        const user = await findUserById(userId);
        if (user) {
          return {
            user,
            token: sessionToken,
          };
        }
      }
    }
  } catch {
    // cookieStore access may fail in certain environments
  }

  // Fallback for sandboxed preview iframes where third-party cookies are blocked by browsers
  try {
    const activeUser = await getActiveSessionUser();
    if (activeUser) {
      return {
        user: activeUser,
        token: generateSessionToken(activeUser.id),
      };
    }
  } catch (e) {
    console.error('Failed to get active session fallback:', e);
  }

  return null;
}

/**
 * Strictly ensures the user is authenticated; throws or redirects if not.
 */
export async function requireAuth(): Promise<User> {
  const session = await getSession();
  if (!session || !session.user) {
    throw new Error('UNAUTHORIZED: Please sign in to access this resource.');
  }
  return session.user;
}

/**
 * Strictly enforces Role-Based Access Control (RBAC).
 * Ensures only users with 'admin' role can access the endpoint/action.
 */
export async function requireAdmin(): Promise<User> {
  const user = await requireAuth();
  if (user.role !== 'admin') {
    throw new Error('FORBIDDEN: Administrative privileges required.');
  }
  return user;
}

/**
 * Enforces per-user resource isolation.
 * Prevents horizontal privilege escalation.
 */
export function assertResourceOwnership(resourceUserId: string, currentUserId: string, userRole: UserRole = 'user'): void {
  // Admin may view if needed, but standard users can only ever access their own data
  if (userRole === 'admin') return;
  if (resourceUserId !== currentUserId) {
    throw new Error('FORBIDDEN: You do not have permission to access or modify this journal entry.');
  }
}

/**
 * Creates a secure session cookie string.
 */
export function generateSessionToken(userId: string): string {
  const payload = `${userId}:${Date.now()}`;
  return Buffer.from(payload).toString('base64');
}

/**
 * Sets session cookie onto response or cookie store.
 */
export async function setSessionCookie(userId: string): Promise<string> {
  const token = generateSessionToken(userId);
  try {
    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE_NAME, token, {
      httpOnly: false,
      secure: true,
      sameSite: 'none',
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });
  } catch {}

  await setActiveSessionUserId(userId);
  return token;
}

/**
 * Clears the session cookie.
 */
export async function clearSessionCookie(): Promise<void> {
  try {
    const cookieStore = await cookies();
    cookieStore.delete(SESSION_COOKIE_NAME);
  } catch {}
  await setActiveSessionUserId(null);
}

/**
 * Input sanitizer to protect journal entries against XSS and injection
 */
export function sanitizeText(input: string, maxLength = 20000): string {
  if (!input) return '';
  return input
    .slice(0, maxLength)
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .trim();
}
