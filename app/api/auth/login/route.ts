import { NextRequest, NextResponse } from 'next/server';
import { getSqlClient } from '@/lib/neon/db';
import { verifyPassword } from '@/lib/auth/password';
import { signJWT, generateRefreshToken } from '@/lib/auth/jwt';
import { SESSION_COOKIE, REFRESH_COOKIE } from '@/lib/auth/cookies';
import { storeRefreshToken } from '@/lib/auth/refresh-tokens';
import { checkRateLimit, getClientIp } from '@/lib/auth/rate-limiter';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Hash pré-calculé (bcrypt coût 12) pour timing constant quand l'email n'existe pas
const DUMMY_HASH = '$2b$12$N7dMJLd.mw8nNpVrfgEax.H2TwnzwM2uTGe977R4tVtda/py5uYZy';

export async function POST(request: NextRequest) {
  try {
    // Rate limiting : 5 tentatives par 15 minutes
    const ip = getClientIp(request);
    const rateLimit = checkRateLimit(`login:${ip}`, 5, 15 * 60 * 1000);
    if (!rateLimit.allowed) {
      const retryAfterSeconds = Math.ceil(rateLimit.retryAfterMs / 1000);
      const response = NextResponse.json(
        { success: false, error: 'Trop de tentatives. Réessayez plus tard.' },
        { status: 429 }
      );
      response.headers.set('Retry-After', String(retryAfterSeconds));
      return response;
    }

    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email et mot de passe requis' },
        { status: 400 }
      );
    }

    const db = getSqlClient();

    const result = await db`
      SELECT id, email, password_hash FROM public.users WHERE email = ${email.toLowerCase()}
    `;

    if (result.length === 0) {
      // Timing constant : toujours exécuter bcrypt.compare
      await verifyPassword(password, DUMMY_HASH);
      return NextResponse.json(
        { success: false, error: 'Email ou mot de passe incorrect' },
        { status: 401 }
      );
    }

    const user = result[0];
    const isValid = await verifyPassword(password, user.password_hash);

    if (!isValid) {
      return NextResponse.json(
        { success: false, error: 'Email ou mot de passe incorrect' },
        { status: 401 }
      );
    }

    const accessToken = await signJWT({ userId: user.id, email: user.email });
    const refreshToken = generateRefreshToken();
    await storeRefreshToken(user.id, refreshToken);

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        isPremium: true,
        isAuthenticated: true,
      },
    });

    response.cookies.set(SESSION_COOKIE, accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 15, // 15 minutes
      path: '/',
    });

    response.cookies.set(REFRESH_COOKIE, refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 jours
      path: '/',
    });

    return response;
  } catch (error: unknown) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[Auth Login] Erreur:', error);
    }
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la connexion' },
      { status: 500 }
    );
  }
}
