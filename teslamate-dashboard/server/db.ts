import { Pool, type PoolConfig } from 'pg';

const poolConfig: PoolConfig = {
  host: process.env.DB_HOST || '192.168.28.15',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  user: process.env.DB_USER || 'teslamate',
  password: process.env.DB_PASSWORD || 'secret',
  database: process.env.DB_NAME || 'teslamate',
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
};

export const pool = new Pool(poolConfig);

/**
 * Execute a SQL query and return all rows.
 */
export async function query<T = Record<string, unknown>>(
  text: string,
  params: unknown[] = [],
): Promise<T[]> {
  const result = await pool.query(text, params);
  return result.rows as T[];
}

/**
 * Execute a SQL query and return the first row, or null.
 */
export async function queryOne<T = Record<string, unknown>>(
  text: string,
  params: unknown[] = [],
): Promise<T | null> {
  const result = await pool.query(text, params);
  return (result.rows[0] as T) ?? null;
}

/**
 * Graceful shutdown of the connection pool.
 */
export async function closePool(): Promise<void> {
  await pool.end();
}
