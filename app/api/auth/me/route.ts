import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT } from '@/lib/auth/jwt';
import { SESSION_COOKIE } from '@/lib/auth/cookies';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;

  if (!token) {
    return NextResponse.json(
      { success: false, error: 'Non authentifié' },
      { status: 401 }
    );
  }

  const payload = await verifyJWT(token);

  if (!payload) {
    return NextResponse.json(
      { success: false, error: 'Session expirée' },
      { status: 401 }
    );
  }

  return NextResponse.json({
    success: true,
    user: {
      id: payload.userId,
      email: payload.email,
      isPremium: true,
      isAuthenticated: true,
    },
  });
}
