import postgres from 'postgres';

let sql: ReturnType<typeof postgres> | null = null;

export function getSqlClient() {
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
