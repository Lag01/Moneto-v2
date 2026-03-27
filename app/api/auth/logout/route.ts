import { NextRequest, NextResponse } from 'next/server';
import { REFRESH_COOKIE, clearAuthCookies } from '@/lib/auth/cookies';
import { revokeRefreshToken } from '@/lib/auth/refresh-tokens';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const response = NextResponse.json({ success: true });

  // Révoquer le refresh token en DB si présent
  const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value;
  if (refreshToken) {
    try {
      await revokeRefreshToken(refreshToken);
    } catch {
      // Ne pas bloquer le logout si la révocation échoue
    }
  }

  return clearAuthCookies(response);
}
