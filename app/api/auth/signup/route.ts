import { NextRequest, NextResponse } from 'next/server';
import { getSqlClient } from '@/lib/neon/db';
import { hashPassword } from '@/lib/auth/password';
import { signJWT, generateRefreshToken } from '@/lib/auth/jwt';
import { SESSION_COOKIE, REFRESH_COOKIE } from '@/lib/auth/cookies';
import { storeRefreshToken } from '@/lib/auth/refresh-tokens';
import { checkRateLimit, getClientIp } from '@/lib/auth/rate-limiter';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/;

export async function POST(request: NextRequest) {
  try {
    // Rate limiting : 3 tentatives par 15 minutes
    const ip = getClientIp(request);
    const rateLimit = checkRateLimit(`signup:${ip}`, 3, 15 * 60 * 1000);
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

    // Validation
    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email et mot de passe requis' },
        { status: 400 }
      );
    }

    if (email.length > 254 || !EMAIL_REGEX.test(email)) {
      return NextResponse.json(
        { success: false, error: 'Format d\'email invalide' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { success: false, error: 'Le mot de passe doit contenir au moins 8 caractères' },
        { status: 400 }
      );
    }

    if (password.length > 128) {
      return NextResponse.json(
        { success: false, error: 'Le mot de passe ne doit pas dépasser 128 caractères' },
        { status: 400 }
      );
    }

    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    if (!hasUppercase || !hasLowercase || !hasNumber) {
      return NextResponse.json(
        { success: false, error: 'Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre' },
        { status: 400 }
      );
    }

    const db = getSqlClient();

    // Vérifier si l'email existe déjà
    const existing = await db`SELECT id FROM public.users WHERE email = ${email.toLowerCase()}`;
    if (existing.length > 0) {
      // Timing constant : toujours exécuter hashPassword
      await hashPassword(password);
      // Message ambigu pour ne pas révéler si l'email existe
      return NextResponse.json(
        { success: false, error: 'Une erreur est survenue. Si vous avez déjà un compte, essayez de vous connecter.' },
        { status: 400 }
      );
    }

    // Créer l'utilisateur
    const passwordHash = await hashPassword(password);
    const result = await db`
      INSERT INTO public.users (email, password_hash)
      VALUES (${email.toLowerCase()}, ${passwordHash})
      RETURNING id, email
    `;

    const user = result[0];
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
      console.error('[Auth Signup] Erreur:', error);
    }
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la création du compte' },
      { status: 500 }
    );
  }
}
