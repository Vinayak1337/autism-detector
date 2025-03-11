import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// List of public routes that don't require authentication
const publicPaths = [
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhook*',
  '/api/public*',
  '/about*',
  '/eye-test*',
  '/eye-tracking-test*',
];

const isPublic = (path: string) => {
  return publicPaths.find((x) => path.match(new RegExp(`^${x.replace('*', '.*')}$`)));
};

export async function middleware(req: NextRequest) {
  // Allow public routes
  if (isPublic(req.nextUrl.pathname)) {
    return NextResponse.next();
  }

  // Get session token from cookies
  const sessionToken = req.cookies.get('__session')?.value;

  // If no session token, redirect to sign-in
  if (!sessionToken) {
    const signInUrl = new URL('/sign-in', req.url);
    return NextResponse.redirect(signInUrl);
  }

  try {
    // Verify session (replace with actual Clerk session verification)
    // For now, just allow if there's a session token
    return NextResponse.next();
  } catch (error) {
    console.error('Authentication error:', error);
    const signInUrl = new URL('/sign-in', req.url);
    return NextResponse.redirect(signInUrl);
  }
}

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
};
