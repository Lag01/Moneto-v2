import { NextRequest, NextResponse } from 'next/server';

export const SESSION_COOKIE = 'moneto-session';

export function setSessionCookie(response: NextResponse, token: string): NextResponse {
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 jours
    path: '/',
  });
  return response;
}

export function getSessionFromCookies(request: NextRequest): string | null {
  return request.cookies.get(SESSION_COOKIE)?.value || null;
}
