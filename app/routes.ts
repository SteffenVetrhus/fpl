import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/_index.tsx"),
  route("gameweeks", "routes/gameweeks.tsx"),
  route("standings", "routes/standings.tsx"),
  route("transfers", "routes/transfers.tsx"),
] satisfies RouteConfig;
