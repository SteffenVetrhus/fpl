import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  route("login", "routes/login.tsx"),
  route("logout", "routes/logout.tsx"),
  route("profile", "routes/profile.tsx"),
  route("profile/change-password", "routes/change-password.tsx"),
  index("routes/_index.tsx"),
  route("health", "routes/health.tsx"),
  route("gameweeks", "routes/gameweeks.tsx"),
  route("standings", "routes/standings.tsx"),
  route("transfers", "routes/transfers.tsx"),
  // Decision Tools
  route("transfer-planner", "routes/transfer-planner.tsx"),
  route("fixtures", "routes/fixtures.tsx"),
  route("captain-picker", "routes/captain-picker.tsx"),
  route("transfer-hub", "routes/transfer-hub.tsx"),
  route("differentials", "routes/differentials.tsx"),
  route("rival-spy", "routes/rival-spy.tsx"),
  route("chip-planner", "routes/chip-planner.tsx"),
  route("price-tracker", "routes/price-tracker.tsx"),
  route("stat-corner", "routes/stat-corner.tsx"),
  route("ai-advisor", "routes/ai-advisor.tsx"),
  route("news", "routes/news.tsx"),

  // Mini Games
  route("mini-games", "routes/mini-games.tsx"),

  // Banter Zone
  route("bench-shame", "routes/bench-shame.tsx"),
  route("captain-hindsight", "routes/captain-hindsight.tsx"),
  route("transfer-clowns", "routes/transfer-clowns.tsx"),
  route("mood-swings", "routes/mood-swings.tsx"),
  route("rich-list", "routes/rich-list.tsx"),
  route("league-vs-world", "routes/league-vs-world.tsx"),
  route("chip-roast", "routes/chip-roast.tsx"),
  route("head-to-head", "routes/head-to-head.tsx"),
  route("banter-bot", "routes/banter-bot.tsx"),
  route("records", "routes/records.tsx"),
  route("roast-news", "routes/roast-news.tsx"),
] satisfies RouteConfig;
