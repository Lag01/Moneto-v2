/**
 * API Route proxy pour Neon avec authentification JWT custom
 *
 * Ce proxy sécurise toutes les requêtes vers Neon en :
 * - Vérifiant l'authentification JWT côté serveur
 * - Utilisant une whitelist d'opérations autorisées (pas de SQL brut)
 * - Filtrant automatiquement par user_id
 * - Chiffrant les données des plans (AES-256-GCM)
 * - Empêchant l'accès direct à Neon depuis le client
 */

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getSqlClient } from '@/lib/neon/db';
import { verifyJWT } from '@/lib/auth/jwt';
import { SESSION_COOKIE } from '@/lib/auth/cookies';

// Force la route à être dynamique (pas de pre-rendering au build)
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// --- Chiffrement AES-256-GCM ---

const ENCRYPTION_PREFIX = 'v1:';

function getEncryptionKey(): Buffer {
  const key = process.env.PLAN_ENCRYPTION_KEY;
  if (!key) {
    throw new Error(
      'PLAN_ENCRYPTION_KEY non définie. Ajoutez une clé hex de 64 caractères dans les variables d\'environnement.'
    );
  }
  if (key.length !== 64) {
    throw new Error(
      `PLAN_ENCRYPTION_KEY invalide (${key.length} chars, attendu: 64 hex chars pour AES-256).`
    );
  }
  return Buffer.from(key, 'hex');
}

function encryptData(plaintext: string): string {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');

  return `${ENCRYPTION_PREFIX}${iv.toString('hex')}:${authTag}:${encrypted}`;
}

function decryptData(ciphertext: string): string {
  // Si les données ne sont pas chiffrées (legacy jsonb), les retourner telles quelles
  if (!ciphertext.startsWith(ENCRYPTION_PREFIX)) {
    return ciphertext;
  }

  const key = getEncryptionKey();
  const parts = ciphertext.slice(ENCRYPTION_PREFIX.length).split(':');
  if (parts.length !== 3) {
    throw new Error('Format de données chiffrées invalide');
  }

  const [ivHex, authTagHex, encryptedHex] = parts;
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');

  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

/**
 * Opérations autorisées via le proxy.
 */
type AllowedOperation =
  | 'SELECT_ALL_PLANS'
  | 'SELECT_PLAN_BY_ID'
  | 'INSERT_PLAN'
  | 'UPDATE_PLAN'
  | 'DELETE_PLAN';

export interface NeonProxyRequest {
  operation: AllowedOperation;
  params?: Record<string, any>;
}

export interface NeonProxyResponse {
  success: boolean;
  data?: any;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

/**
 * Déchiffre le champ `data` de chaque row retournée par SELECT.
 */
function decryptRows(rows: any[]): any[] {
  return rows.map((row) => {
    if (row.data && typeof row.data === 'string') {
      try {
        const decrypted = decryptData(row.data);
        row.data = JSON.parse(decrypted);
      } catch {
        try {
          row.data = typeof row.data === 'string' ? JSON.parse(row.data) : row.data;
        } catch {
          // Laisser tel quel
        }
      }
    }
    return row;
  });
}

/**
 * Exécute une opération whitelistée de manière sécurisée.
 */
async function executeWhitelistedOperation(
  db: ReturnType<typeof import('postgres')>,
  operation: AllowedOperation,
  userId: string,
  params: Record<string, any> = {}
): Promise<any[]> {
  switch (operation) {
    case 'SELECT_ALL_PLANS': {
      const rows = await db`
        SELECT * FROM public.monthly_plans
        WHERE user_id = ${userId}
        ORDER BY created_at DESC
      `;
      return decryptRows(Array.from(rows));
    }

    case 'SELECT_PLAN_BY_ID': {
      if (!params.plan_id) throw new Error('plan_id requis');
      const rows = await db`
        SELECT * FROM public.monthly_plans
        WHERE user_id = ${userId} AND plan_id = ${params.plan_id}
        LIMIT 1
      `;
      return decryptRows(Array.from(rows));
    }

    case 'INSERT_PLAN': {
      if (!params.plan_id || !params.data) throw new Error('plan_id et data requis');
      const countResult = await db`
        SELECT COUNT(*)::int AS count FROM public.monthly_plans WHERE user_id = ${userId}
      `;
      if (countResult[0]?.count >= 25) {
        throw Object.assign(new Error('Limite atteinte : maximum 25 plans par utilisateur'), { code: 'PLAN_LIMIT_REACHED' });
      }
      const encryptedData = encryptData(typeof params.data === 'string' ? params.data : JSON.stringify(params.data));
      return db`
        INSERT INTO public.monthly_plans (user_id, plan_id, name, data, created_at, updated_at)
        VALUES (${userId}, ${params.plan_id}, ${params.name || null}, ${encryptedData}, ${params.created_at || new Date().toISOString()}, ${params.updated_at || new Date().toISOString()})
        RETURNING id
      `;
    }

    case 'UPDATE_PLAN': {
      if (!params.plan_id) throw new Error('plan_id requis');
      const encryptedData = encryptData(typeof params.data === 'string' ? params.data : JSON.stringify(params.data));
      return db`
        UPDATE public.monthly_plans
        SET name = ${params.name || null},
            data = ${encryptedData},
            updated_at = NOW()
        WHERE user_id = ${userId} AND plan_id = ${params.plan_id}
        RETURNING id
      `;
    }

    case 'DELETE_PLAN':
      if (!params.plan_id) throw new Error('plan_id requis');
      return db`
        DELETE FROM public.monthly_plans
        WHERE user_id = ${userId} AND plan_id = ${params.plan_id}
      `;

    default:
      throw new Error(`Opération non autorisée: ${operation}`);
  }
}

export async function POST(request: NextRequest): Promise<NextResponse<NeonProxyResponse>> {
  try {
    // Vérifier l'authentification JWT
    const token = request.cookies.get(SESSION_COOKIE)?.value;
    if (!token) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentification requise',
          },
        },
        { status: 401 }
      );
    }

    const payload = await verifyJWT(token);
    if (!payload) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Session expirée ou invalide',
          },
        },
        { status: 401 }
      );
    }

    // Vérifier la taille de la requête (max 1MB)
    const contentLength = request.headers.get('content-length');
    if (contentLength && parseInt(contentLength, 10) > 1_048_576) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'PAYLOAD_TOO_LARGE',
            message: 'La requête dépasse la taille maximale autorisée (1MB)',
          },
        },
        { status: 413 }
      );
    }

    // Parser la requête
    const body = (await request.json()) as NeonProxyRequest;

    if (!body.operation) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_REQUEST',
            message: 'Opération manquante. Utilisez le champ "operation".',
          },
        },
        { status: 400 }
      );
    }

    const allowedOps: AllowedOperation[] = [
      'SELECT_ALL_PLANS',
      'SELECT_PLAN_BY_ID',
      'INSERT_PLAN',
      'UPDATE_PLAN',
      'DELETE_PLAN',
    ];

    if (!allowedOps.includes(body.operation)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: `Opération "${body.operation}" non autorisée`,
          },
        },
        { status: 403 }
      );
    }

    const db = getSqlClient();
    const result = await executeWhitelistedOperation(
      db,
      body.operation,
      payload.userId,
      body.params || {}
    );

    return NextResponse.json({
      success: true,
      data: Array.isArray(result) ? result : [],
    });
  } catch (error: any) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[Neon Proxy] Erreur:', error);
    }

    if (error.code === 'PLAN_LIMIT_REACHED') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'PLAN_LIMIT_REACHED',
            message: error.message,
          },
        },
        { status: 429 }
      );
    }

    if (error.message?.includes('permission denied')) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'PERMISSION_DENIED',
            message: 'Permissions insuffisantes',
          },
        },
        { status: 403 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Erreur lors de l\'exécution de la requête',
          details: process.env.NODE_ENV === 'development' ? error.message : undefined,
        },
      },
      { status: 500 }
    );
  }
}
