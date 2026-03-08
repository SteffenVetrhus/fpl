/**
 * Health check endpoint for container orchestration (Docker, Coolify).
 * Returns 200 OK with no external dependencies.
 */
export async function loader() {
  return Response.json({ status: "ok" });
}
