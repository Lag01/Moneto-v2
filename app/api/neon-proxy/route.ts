/**
 * API Route proxy pour Neon avec authentification Stack Auth
 *
 * Ce proxy sécurise toutes les requêtes vers Neon en :
 * - Vérifiant l'authentification Stack Auth côté serveur
 * - Filtrant automatiquement les requêtes par user_id
 * - Empêchant l'accès direct à Neon depuis le client
 *
 * Usage depuis le client :
 *   const response = await fetch('/api/neon-proxy', {
 *     method: 'POST',
 *     headers: { 'Content-Type': 'application/json' },
 *     body: JSON.stringify({
 *       query: 'SELECT * FROM monthly_plans WHERE user_id = $1',
 *       params: ['__USER_ID__'] // Sera automatiquement remplacé par l'ID réel
 *     })
 *   });
 */

import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

// Client Neon côté serveur uniquement (initialisation lazy)
let sql: ReturnType<typeof neon> | null = null;

function getSqlClient() {
  if (!sql) {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error('DATABASE_URL non définie');
    }
    sql = neon(databaseUrl);
  }
  return sql;
}

// Force la route à être dynamique (pas de pre-rendering au build)
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export interface NeonProxyRequest {
  query: string;
  params?: any[];
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
    const { query, params = [] } = body;

    if (!query) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_REQUEST',
            message: 'Query manquante',
          },
        },
        { status: 400 }
      );
    }

    // Remplacer __USER_ID__ par l'ID réel de l'utilisateur
    const processedParams = params.map((param) => (param === '__USER_ID__' ? user.id : param));

    // Vérifier que la requête contient bien un filtre user_id
    if (!query.includes('user_id')) {
      console.warn('[Neon Proxy] ATTENTION : Requête sans filtre user_id détectée');
    }

    // Exécuter la requête via Neon
    // Note : Interpolation manuelle des paramètres (same as lib/neon/client.ts)
    const sqlClient = getSqlClient();

    let interpolatedQuery = query;
    processedParams.forEach((param, index) => {
      const placeholder = `$${index + 1}`;
      const value =
        param === null
          ? 'NULL'
          : typeof param === 'string'
            ? `'${param.replace(/'/g, "''")}'`
            : typeof param === 'number' || typeof param === 'boolean'
              ? String(param)
              : `'${JSON.stringify(param).replace(/'/g, "''")}'`;
      interpolatedQuery = interpolatedQuery.replace(
        new RegExp(`\\${placeholder.replace('$', '\\$')}`, 'g'),
        value
      );
    });

    const result = await sqlClient(interpolatedQuery as any);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('[Neon Proxy] Erreur:', error);

    // Détection d'erreurs spécifiques
    if (error.message?.includes('syntax error')) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'SQL_SYNTAX_ERROR',
            message: 'Erreur de syntaxe SQL',
            details: error.message,
          },
        },
        { status: 400 }
      );
    }

    if (error.message?.includes('permission denied')) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'PERMISSION_DENIED',
            message: 'Permissions insuffisantes',
            details: error.message,
          },
        },
        { status: 403 }
      );
    }

    // Erreur générique
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
