import { NextResponse, type NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Pass through to Next.js App Router where Server Components handle session validation
  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*'],
};

