/**
 * Cron job: Player snapshot collector
 * Runs periodically to capture player price and stats data
 *
 * Usage: npx tsx scripts/snapshot-cron.ts
 * Schedule: Every 6 hours via cron or container scheduler
 */

import { fetchBootstrapStatic } from "../app/lib/fpl-api/client";
import { savePlayerSnapshots } from "../app/lib/db/snapshots";

async function run() {
  console.log(`[${new Date().toISOString()}] Starting player snapshot...`);

  try {
    const bootstrap = await fetchBootstrapStatic();
    console.log(`Fetched ${bootstrap.elements.length} players from FPL API`);

    const count = await savePlayerSnapshots(bootstrap.elements);
    console.log(`Saved ${count} player snapshots to database`);

    console.log(`[${new Date().toISOString()}] Snapshot complete`);
  } catch (error) {
    console.error("Snapshot failed:", error);
    process.exit(1);
  }

  process.exit(0);
}

run();
