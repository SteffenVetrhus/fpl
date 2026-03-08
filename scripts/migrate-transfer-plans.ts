/**
 * Database migration for transfer planner feature
 * Creates the transfer_plans table for persisting user plans
 *
 * Run: npx tsx scripts/migrate-transfer-plans.ts
 */

import { getPool } from "../app/lib/db/client";

async function migrate() {
  const pool = await getPool();

  await pool.query(`
    CREATE TABLE IF NOT EXISTS transfer_plans (
      id SERIAL PRIMARY KEY,
      manager_id INTEGER NOT NULL UNIQUE,
      plan_data JSONB NOT NULL DEFAULT '{}',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_transfer_plans_manager_id
      ON transfer_plans (manager_id);
  `);

  console.log("Migration complete: transfer_plans table created");
  await pool.end();
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
