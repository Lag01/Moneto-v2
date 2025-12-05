/**
 * Client Neon avec proxy sécurisé
 *
 * Ce module détecte automatiquement si le code s'exécute côté client ou serveur :
 * - Côté CLIENT (browser) : utilise le proxy API /api/neon-proxy (sécurisé par Stack Auth)
 * - Côté SERVEUR : utilise Neon directement (pour API Routes et scripts)
 */

import { neon, neonConfig } from '@neondatabase/serverless';
import type { NeonProxyRequest, NeonProxyResponse } from '@/app/api/neon-proxy/route';

// Configure Neon pour Node.js runtime (serveur uniquement)
// ⚠️ IMPORTANT : La configuration doit être synchrone, AVANT toute utilisation du client
if (typeof window === 'undefined') {
  try {
    // Import synchrone de ws pour Node.js uniquement
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const ws = require('ws');
    neonConfig.webSocketConstructor = ws;
  } catch (error) {
    // ws n'est pas disponible (ne devrait pas arriver sur le serveur)
    console.error('[Neon Client] ws non disponible:', error);
  }
}

export interface SyncError {
  code: 'NETWORK' | 'AUTH' | 'SERVER' | 'CONFLICT' | 'UNKNOWN';
  message: string;
  details?: unknown;
}

const isClient = typeof window !== 'undefined';
const databaseUrl = !isClient ? process.env.DATABASE_URL : undefined;

export function isNeonConfigured(): boolean {
  // Côté client : toujours configuré (via proxy)
  // Côté serveur : vérifie DATABASE_URL
  return isClient || !!databaseUrl;
}

// Client Neon direct (serveur uniquement)
export const sql = !isClient && isNeonConfigured() && databaseUrl ? neon(databaseUrl) : null;

/**
 * Exécute une requête SQL via le proxy sécurisé (client) ou directement (serveur)
 *
 * @param query - Requête SQL avec placeholders $1, $2, etc.
 * @param params - Paramètres de la requête. Utiliser '__USER_ID__' pour user_id (remplacé automatiquement)
 * @returns Résultat de la requête ou erreur
 */
export async function executeQuery<T = any>(
  query: string,
  params: any[] = []
): Promise<{ success: boolean; data?: T; error?: SyncError }> {
  // --- CLIENT : Utiliser le proxy API ---
  if (isClient) {
    try {
      const response = await fetch('/api/neon-proxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          params,
        } as NeonProxyRequest),
      });

      const result = (await response.json()) as NeonProxyResponse;

      if (!result.success) {
        return {
          success: false,
          error: {
            code: result.error?.code === 'UNAUTHORIZED' ? 'AUTH' : 'SERVER',
            message: result.error?.message || 'Erreur inconnue',
            details: result.error?.details,
          },
        };
      }

      return { success: true, data: result.data as T };
    } catch (error) {
      console.error('[Neon Client] Erreur proxy:', error);
      return {
        success: false,
        error: {
          code: 'NETWORK',
          message: error instanceof Error ? error.message : 'Erreur réseau',
          details: error,
        },
      };
    }
  }

  // --- SERVEUR : Utiliser Neon directement ---
  if (!sql) {
    return {
      success: false,
      error: {
        code: 'SERVER',
        message: 'Base de données non configurée',
      },
    };
  }

  try {
    // TEMPORARY FIX: Neon sql() expects template strings, not parameterized queries
    // Manually interpolate parameters with proper escaping
    // TODO: Refactor to use native Neon template strings throughout the codebase
    let interpolatedQuery = query;
    params.forEach((param, index) => {
      const placeholder = `$${index + 1}`;
      const value =
        param === null
          ? 'NULL'
          : typeof param === 'string'
            ? `'${param.replace(/'/g, "''")}'` // Escape single quotes
            : typeof param === 'number' || typeof param === 'boolean'
              ? String(param)
              : `'${JSON.stringify(param).replace(/'/g, "''")}'`;
      interpolatedQuery = interpolatedQuery.replace(
        new RegExp(`\\${placeholder.replace('$', '\\$')}`, 'g'),
        value
      );
    });

    const result = await sql(interpolatedQuery as any);
    return { success: true, data: result as T };
  } catch (error) {
    console.error('[Neon Client] Erreur requête:', error);
    return {
      success: false,
      error: {
        code: 'UNKNOWN',
        message: error instanceof Error ? error.message : 'Erreur inconnue',
        details: error,
      },
    };
  }
}
