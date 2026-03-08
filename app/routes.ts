import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/_index.tsx"),
  route("gameweeks", "routes/gameweeks.tsx"),
  route("standings", "routes/standings.tsx"),
  route("transfers", "routes/transfers.tsx"),
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
] satisfies RouteConfig;
