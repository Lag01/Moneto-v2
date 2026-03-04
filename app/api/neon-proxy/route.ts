/**
 * API Route proxy pour Neon avec authentification Stack Auth
 *
 * Ce proxy sécurise toutes les requêtes vers Neon en :
 * - Vérifiant l'authentification Stack Auth côté serveur
 * - Utilisant une whitelist d'opérations autorisées (pas de SQL brut)
 * - Filtrant automatiquement par user_id
 * - Empêchant l'accès direct à Neon depuis le client
 */

import { NextRequest, NextResponse } from 'next/server';
import postgres from 'postgres';

// Singleton SQL client
let sql: ReturnType<typeof postgres> | null = null;

function getSqlClient() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL non définie');
  }

  if (!sql) {
    sql = postgres(process.env.DATABASE_URL, {
      ssl: 'require',
      max: 1,
      connect_timeout: 15,
      idle_timeout: 30,
    });
  }

  return sql;
}

// Force la route à être dynamique (pas de pre-rendering au build)
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Opérations autorisées via le proxy.
 * Chaque opération est une requête SQL pré-définie avec des paramètres typés.
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
  // Champs legacy pour rétrocompatibilité temporaire
  query?: string;
  params_legacy?: any[];
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
 * Exécute une opération whitelistée de manière sécurisée.
 * Le user_id est TOUJOURS injecté côté serveur, jamais depuis le client.
 */
async function executeWhitelistedOperation(
  db: ReturnType<typeof postgres>,
  operation: AllowedOperation,
  userId: string,
  params: Record<string, any> = {}
): Promise<any[]> {
  switch (operation) {
    case 'SELECT_ALL_PLANS':
      return db`
        SELECT * FROM public.monthly_plans
        WHERE user_id = ${userId}
        ORDER BY created_at DESC
      `;

    case 'SELECT_PLAN_BY_ID':
      if (!params.plan_id) throw new Error('plan_id requis');
      return db`
        SELECT * FROM public.monthly_plans
        WHERE user_id = ${userId} AND plan_id = ${params.plan_id}
        LIMIT 1
      `;

    case 'INSERT_PLAN':
      if (!params.plan_id || !params.data) throw new Error('plan_id et data requis');
      return db`
        INSERT INTO public.monthly_plans (user_id, plan_id, name, data, created_at, updated_at)
        VALUES (${userId}, ${params.plan_id}, ${params.name || null}, ${params.data}, ${params.created_at || new Date().toISOString()}, ${params.updated_at || new Date().toISOString()})
        RETURNING id
      `;

    case 'UPDATE_PLAN':
      if (!params.plan_id) throw new Error('plan_id requis');
      return db`
        UPDATE public.monthly_plans
        SET name = ${params.name || null},
            data = ${params.data},
            updated_at = NOW()
        WHERE user_id = ${userId} AND plan_id = ${params.plan_id}
        RETURNING id
      `;

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
    // Import dynamique de stackServerApp (évite l'initialisation au build)
    const { stackServerApp } = await import('@/stack/server');

    // Vérifier l'authentification Stack Auth
    const user = await stackServerApp.getUser();

    if (!user) {
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

    // Parser la requête
    const body = (await request.json()) as NeonProxyRequest;

    // Vérifier qu'une opération est spécifiée
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

    // Valider que l'opération est dans la whitelist
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

    // Exécuter l'opération sécurisée (user_id injecté côté serveur)
    const db = getSqlClient();
    const result = await executeWhitelistedOperation(
      db,
      body.operation,
      user.id,
      body.params || {}
    );

    return NextResponse.json({
      success: true,
      data: Array.isArray(result) ? result : [],
    });
  } catch (error: any) {
    // Log uniquement en dev
    if (process.env.NODE_ENV === 'development') {
      console.error('[Neon Proxy] Erreur:', error);
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

    // Erreur générique (pas de détails en production)
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
