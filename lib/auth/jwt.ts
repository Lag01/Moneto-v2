import { SignJWT, jwtVerify } from 'jose';
import crypto from 'crypto';

function getSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET non définie');
  }
  return new TextEncoder().encode(secret);
}

// Access token : courte durée (15 minutes)
export async function signJWT(payload: { userId: string; email: string }): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('15m')
    .sign(getSecret());
}

export async function verifyJWT(token: string): Promise<{ userId: string; email: string } | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload as { userId: string; email: string };
  } catch {
    return null;
  }
}

// Refresh token : token opaque (non-JWT) stocké en DB
export function generateRefreshToken(): string {
  return crypto.randomBytes(48).toString('hex');
}
