import { neon } from '@neondatabase/serverless';

const databaseUrl = process.env.DATABASE_URL;

export interface SyncError {
  code: 'NETWORK' | 'AUTH' | 'SERVER' | 'CONFLICT' | 'UNKNOWN';
  message: string;
  details?: unknown;
}

export function isNeonConfigured(): boolean {
  return !!databaseUrl;
}

export const sql = isNeonConfigured() && databaseUrl ? neon(databaseUrl) : null;

export async function executeQuery<T = any>(
  query: string,
  params: any[] = []
): Promise<{ success: boolean; data?: T; error?: SyncError }> {
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
      const value = param === null
        ? 'NULL'
        : typeof param === 'string'
        ? `'${param.replace(/'/g, "''")}'` // Escape single quotes
        : typeof param === 'number' || typeof param === 'boolean'
        ? String(param)
        : `'${JSON.stringify(param).replace(/'/g, "''")}'`;
      interpolatedQuery = interpolatedQuery.replace(new RegExp(`\\${placeholder.replace('$', '\\$')}`, 'g'), value);
    });

    const result = await sql(interpolatedQuery as any);
    return { success: true, data: result as T };
  } catch (error) {
    console.error('Erreur requête:', error);
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
