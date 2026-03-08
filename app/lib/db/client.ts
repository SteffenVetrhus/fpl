/**
 * PostgreSQL database client
 * Provides connection pool and query utilities for persistent data storage
 */

let pool: any = null;

/**
 * Get or create a PostgreSQL connection pool
 * Uses lazy initialization — only connects when first query is made
 */
export async function getPool() {
  if (pool) return pool;

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL environment variable is required for database features");
  }

  // Dynamic import to avoid requiring pg when not using database features
  const { default: pg } = await import("pg");
  pool = new pg.Pool({
    connectionString: databaseUrl,
    max: 5,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });

  return pool;
}

/**
 * Execute a parameterized query
 */
export async function query<T = any>(
  text: string,
  params?: any[]
): Promise<{ rows: T[]; rowCount: number }> {
  const p = await getPool();
  const result = await p.query(text, params);
  return { rows: result.rows, rowCount: result.rowCount ?? 0 };
}

/**
 * Check if the database is available
 */
export async function isDatabaseAvailable(): Promise<boolean> {
  try {
    if (!process.env.DATABASE_URL) return false;
    const p = await getPool();
    await p.query("SELECT 1");
    return true;
  } catch {
    return false;
  }
}
