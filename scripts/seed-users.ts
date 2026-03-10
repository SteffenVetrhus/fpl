/**
 * Seed PocketBase users from FPL league members.
 *
 * Usage:
 *   npx tsx scripts/seed-users.ts
 *
 * Required env vars:
 *   FPL_LEAGUE_ID          - Your FPL league ID
 *   POCKETBASE_URL         - PocketBase URL (default: http://localhost:8090)
 *   PB_ADMIN_EMAIL         - Super admin email
 *   PB_ADMIN_PASSWORD      - Super admin password
 */

import PocketBase from "pocketbase";

const FPL_API_BASE = "https://fantasy.premierleague.com/api";

interface FPLStandingsResult {
  entry: number;
  player_name: string;
  entry_name: string;
}

interface FPLLeagueStandings {
  league: { name: string };
  standings: { results: FPLStandingsResult[] };
}

function generateEmail(playerName: string): string {
  return (
    playerName
      .toLowerCase()
      .replace(/[^a-z\s]/g, "")
      .trim()
      .replace(/\s+/g, ".") + "@fpl.local"
  );
}

async function fetchLeagueMembers(leagueId: string): Promise<FPLStandingsResult[]> {
  const url = `${FPL_API_BASE}/leagues-classic/${leagueId}/standings/`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch league standings: ${response.status}`);
  }
  const data: FPLLeagueStandings = await response.json();
  console.log(`League: ${data.league.name}`);
  return data.standings.results;
}

async function main() {
  const leagueId = process.env.FPL_LEAGUE_ID;
  const pocketbaseUrl = process.env.POCKETBASE_URL || "http://localhost:8090";
  const adminEmail = process.env.PB_ADMIN_EMAIL;
  const adminPassword = process.env.PB_ADMIN_PASSWORD;

  if (!leagueId) {
    console.error("FPL_LEAGUE_ID is required");
    process.exit(1);
  }
  if (!adminEmail || !adminPassword) {
    console.error("PB_ADMIN_EMAIL and PB_ADMIN_PASSWORD are required");
    process.exit(1);
  }

  console.log(`Fetching league members for league ${leagueId}...`);
  const members = await fetchLeagueMembers(leagueId);
  console.log(`Found ${members.length} members\n`);

  const pb = new PocketBase(pocketbaseUrl);
  await pb.collection("_superusers").authWithPassword(adminEmail, adminPassword);
  console.log("Authenticated as super admin\n");

  const defaultPassword = "changeme123";
  let created = 0;
  let skipped = 0;

  for (const member of members) {
    const email = generateEmail(member.player_name);

    try {
      const existing = await pb.collection("users").getList(1, 1, {
        filter: `fpl_manager_id = ${member.entry}`,
      });

      if (existing.totalItems > 0) {
        console.log(`  SKIP: ${member.player_name} (${email}) - already exists`);
        skipped++;
        continue;
      }

      await pb.collection("users").create({
        email,
        password: defaultPassword,
        passwordConfirm: defaultPassword,
        name: member.player_name,
        fpl_manager_id: member.entry,
        player_name: member.player_name,
        team_name: member.entry_name,
        password_changed: false,
        emailVisibility: true,
        verified: true,
      });

      console.log(`  CREATE: ${member.player_name} -> ${email}`);
      created++;
    } catch (err) {
      console.error(`  ERROR: ${member.player_name} - ${err}`);
    }
  }

  console.log(`\nDone! Created: ${created}, Skipped: ${skipped}`);
  console.log(`\nDefault password for all users: ${defaultPassword}`);
  console.log("Users should change their password after first login.");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
