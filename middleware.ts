import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const SESSION_COOKIE = 'moneto-session';
const REFRESH_COOKIE = 'moneto-refresh';

const PUBLIC_PATHS = [
  '/api',
  '/_next',
  '/icons',
  '/manifest.json',
  '/favicon',
  '/sw.js',
  '/workbox-',
];

async function verifyAccessToken(token: string): Promise<boolean> {
  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) return false;
    await jwtVerify(token, new TextEncoder().encode(secret));
    return true;
  } catch {
    return false;
  }
}

async function tryRefreshSession(request: NextRequest): Promise<NextResponse | null> {
  const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value;
  if (!refreshToken) return null;

  try {
    // Appeler l'endpoint refresh en interne
    const baseUrl = request.nextUrl.origin;
    const refreshResponse = await fetch(`${baseUrl}/api/auth/refresh`, {
      method: 'POST',
      headers: {
        cookie: `${REFRESH_COOKIE}=${refreshToken}`,
      },
    });

    if (!refreshResponse.ok) return null;

    // Extraire les nouveaux cookies de la réponse refresh
    const setCookieHeaders = refreshResponse.headers.getSetCookie();
    if (setCookieHeaders.length === 0) return null;

    // Continuer la navigation avec les nouveaux cookies
    const response = NextResponse.next();
    for (const cookie of setCookieHeaders) {
      response.headers.append('set-cookie', cookie);
    }
    return response;
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Autoriser les routes publiques
  if (PUBLIC_PATHS.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  const accessToken = request.cookies.get(SESSION_COOKIE)?.value;
  let isAuthenticated = false;

  if (accessToken) {
    isAuthenticated = await verifyAccessToken(accessToken);
  }

  // Si l'access token est expiré, tenter un refresh
  if (!isAuthenticated && request.cookies.get(REFRESH_COOKIE)?.value) {
    const refreshedResponse = await tryRefreshSession(request);
    if (refreshedResponse) {
      // Routes auth : rediriger les utilisateurs connectés
      if (pathname.startsWith('/auth')) {
        const redirectResponse = NextResponse.redirect(new URL('/dashboard', request.url));
        for (const cookie of refreshedResponse.headers.getSetCookie()) {
          redirectResponse.headers.append('set-cookie', cookie);
        }
        return redirectResponse;
      }
      // Racine
      if (pathname === '/' || pathname === '/home') {
        const redirectResponse = NextResponse.redirect(new URL('/dashboard', request.url));
        for (const cookie of refreshedResponse.headers.getSetCookie()) {
          redirectResponse.headers.append('set-cookie', cookie);
        }
        return redirectResponse;
      }
      return refreshedResponse;
    }
  }

  // Routes auth : rediriger les utilisateurs connectés vers le dashboard
  if (pathname.startsWith('/auth')) {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return NextResponse.next();
  }

  // Racine : rediriger les utilisateurs connectés vers le dashboard
  if (pathname === '/' || pathname === '/home') {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return NextResponse.next();
  }

  // Routes protégées : rediriger les non-connectés vers login
  if (!isAuthenticated) {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|icons|manifest.json|sw.js|workbox-).*)',
  ],
};
