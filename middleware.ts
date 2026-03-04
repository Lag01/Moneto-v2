import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_PATHS = [
  '/auth',
  '/api',
  '/_next',
  '/icons',
  '/manifest.json',
  '/favicon',
  '/sw.js',
  '/workbox-',
  '/handler',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Autoriser les routes publiques
  if (PUBLIC_PATHS.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // Autoriser la racine exacte (landing page future)
  if (pathname === '/' || pathname === '/home') {
    return NextResponse.next();
  }

  // Vérifier la présence du cookie de session Stack Auth
  const hasSession = request.cookies.getAll().some(
    (cookie) => cookie.name.startsWith('stack-token-')
  );

  if (!hasSession) {
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|icons|manifest.json|sw.js|workbox-).*)',
  ],
};
