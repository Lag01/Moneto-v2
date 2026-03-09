import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_PATHS = [
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

  // Vérifier la présence du cookie de session Stack Auth
  const hasSession = request.cookies.getAll().some(
    (cookie) => cookie.name.startsWith('stack-token-')
  );

  // Routes auth : rediriger les utilisateurs connectés vers le dashboard
  if (pathname.startsWith('/auth')) {
    if (hasSession) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return NextResponse.next();
  }

  // Racine : rediriger les utilisateurs connectés vers le dashboard
  if (pathname === '/' || pathname === '/home') {
    if (hasSession) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return NextResponse.next();
  }

  if (!hasSession) {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|icons|manifest.json|sw.js|workbox-).*)',
  ],
};
