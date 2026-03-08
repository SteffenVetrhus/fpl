-- FPL League Tracker Database Schema
-- Player price and stats snapshots for trend analysis

CREATE TABLE IF NOT EXISTS player_snapshots (
  id SERIAL PRIMARY KEY,
  player_id INTEGER NOT NULL,
  web_name TEXT NOT NULL,
  team_id INTEGER NOT NULL,
  element_type INTEGER NOT NULL,
  now_cost INTEGER NOT NULL,
  selected_by_percent NUMERIC(5,2),
  form NUMERIC(4,2),
  transfers_in_event INTEGER DEFAULT 0,
  transfers_out_event INTEGER DEFAULT 0,
  ep_next NUMERIC(4,2),
  expected_goal_involvements NUMERIC(6,2),
  total_points INTEGER DEFAULT 0,
  minutes INTEGER DEFAULT 0,
  snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(player_id, snapshot_date)
);

CREATE INDEX IF NOT EXISTS idx_snapshots_player_date
  ON player_snapshots(player_id, snapshot_date DESC);

CREATE INDEX IF NOT EXISTS idx_snapshots_date
  ON player_snapshots(snapshot_date DESC);

CREATE INDEX IF NOT EXISTS idx_snapshots_cost_change
  ON player_snapshots(player_id, now_cost, snapshot_date DESC);

-- Price change view: shows players whose price changed vs previous snapshot
CREATE OR REPLACE VIEW price_changes AS
SELECT
  curr.player_id,
  curr.web_name,
  curr.team_id,
  curr.element_type,
  curr.now_cost AS current_cost,
  prev.now_cost AS previous_cost,
  curr.now_cost - prev.now_cost AS cost_change,
  curr.selected_by_percent,
  curr.transfers_in_event,
  curr.transfers_out_event,
  curr.form,
  curr.snapshot_date
FROM player_snapshots curr
JOIN player_snapshots prev
  ON curr.player_id = prev.player_id
  AND prev.snapshot_date = (
    SELECT MAX(snapshot_date)
    FROM player_snapshots
    WHERE player_id = curr.player_id
      AND snapshot_date < curr.snapshot_date
  )
WHERE curr.snapshot_date = (
  SELECT MAX(snapshot_date) FROM player_snapshots
)
AND curr.now_cost != prev.now_cost;
