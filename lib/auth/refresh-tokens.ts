import crypto from 'crypto';
import { getSqlClient } from '@/lib/neon/db';

const REFRESH_TOKEN_EXPIRY_DAYS = 7;

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export async function storeRefreshToken(userId: string, token: string): Promise<void> {
  const db = getSqlClient();
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

  await db`
    INSERT INTO public.refresh_tokens (user_id, token_hash, expires_at)
    VALUES (${userId}, ${tokenHash}, ${expiresAt})
  `;
}

export async function validateRefreshToken(
  token: string
): Promise<{ userId: string; email: string } | null> {
  const db = getSqlClient();
  const tokenHash = hashToken(token);

  const result = await db`
    SELECT rt.user_id, u.email
    FROM public.refresh_tokens rt
    JOIN public.users u ON u.id = rt.user_id
    WHERE rt.token_hash = ${tokenHash}
      AND rt.revoked = false
      AND rt.expires_at > NOW()
    LIMIT 1
  `;

  if (result.length === 0) return null;
  return { userId: result[0].user_id, email: result[0].email };
}

export async function revokeRefreshToken(token: string): Promise<void> {
  const db = getSqlClient();
  const tokenHash = hashToken(token);

  await db`
    UPDATE public.refresh_tokens
    SET revoked = true
    WHERE token_hash = ${tokenHash}
  `;
}

export async function revokeAllUserRefreshTokens(userId: string): Promise<void> {
  const db = getSqlClient();

  await db`
    UPDATE public.refresh_tokens
    SET revoked = true
    WHERE user_id = ${userId} AND revoked = false
  `;
}

export async function cleanupExpiredTokens(): Promise<void> {
  const db = getSqlClient();

  await db`
    DELETE FROM public.refresh_tokens
    WHERE expires_at < NOW() OR revoked = true
  `;
}
