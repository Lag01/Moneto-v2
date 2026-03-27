import { NextRequest, NextResponse } from 'next/server';

export const SESSION_COOKIE = 'moneto-session';
export const REFRESH_COOKIE = 'moneto-refresh';

const COOKIE_BASE = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
};

// Access token : 15 minutes
export function setSessionCookie(response: NextResponse, token: string): NextResponse {
  response.cookies.set(SESSION_COOKIE, token, {
    ...COOKIE_BASE,
    maxAge: 60 * 15, // 15 minutes
  });
  return response;
}

// Refresh token : 7 jours
export function setRefreshCookie(response: NextResponse, token: string): NextResponse {
  response.cookies.set(REFRESH_COOKIE, token, {
    ...COOKIE_BASE,
    maxAge: 60 * 60 * 24 * 7, // 7 jours
  });
  return response;
}

// Supprimer les deux cookies
export function clearAuthCookies(response: NextResponse): NextResponse {
  response.cookies.set(SESSION_COOKIE, '', { ...COOKIE_BASE, maxAge: 0 });
  response.cookies.set(REFRESH_COOKIE, '', { ...COOKIE_BASE, maxAge: 0 });
  return response;
}

export function getSessionFromCookies(request: NextRequest): string | null {
  return request.cookies.get(SESSION_COOKIE)?.value || null;
}

export function getRefreshFromCookies(request: NextRequest): string | null {
  return request.cookies.get(REFRESH_COOKIE)?.value || null;
}
