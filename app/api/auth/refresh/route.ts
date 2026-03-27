import { NextRequest, NextResponse } from 'next/server';
import { signJWT, generateRefreshToken } from '@/lib/auth/jwt';
import { REFRESH_COOKIE, SESSION_COOKIE, clearAuthCookies } from '@/lib/auth/cookies';
import {
  validateRefreshToken,
  revokeRefreshToken,
  storeRefreshToken,
} from '@/lib/auth/refresh-tokens';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const oldRefreshToken = request.cookies.get(REFRESH_COOKIE)?.value;

    if (!oldRefreshToken) {
      return NextResponse.json(
        { success: false, error: 'Refresh token manquant' },
        { status: 401 }
      );
    }

    // Valider l'ancien refresh token
    const userData = await validateRefreshToken(oldRefreshToken);
    if (!userData) {
      const response = NextResponse.json(
        { success: false, error: 'Refresh token invalide ou expiré' },
        { status: 401 }
      );
      return clearAuthCookies(response);
    }

    // Rotation : révoquer l'ancien, émettre un nouveau
    await revokeRefreshToken(oldRefreshToken);

    const newAccessToken = await signJWT({
      userId: userData.userId,
      email: userData.email,
    });
    const newRefreshToken = generateRefreshToken();
    await storeRefreshToken(userData.userId, newRefreshToken);

    const response = NextResponse.json({
      success: true,
      user: {
        id: userData.userId,
        email: userData.email,
        isPremium: true,
        isAuthenticated: true,
      },
    });

    response.cookies.set(SESSION_COOKIE, newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 15, // 15 minutes
      path: '/',
    });

    response.cookies.set(REFRESH_COOKIE, newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 jours
      path: '/',
    });

    return response;
  } catch (error: unknown) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[Auth Refresh] Erreur:', error);
    }
    return NextResponse.json(
      { success: false, error: 'Erreur lors du rafraîchissement de la session' },
      { status: 500 }
    );
  }
}
