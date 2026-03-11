/**
 * URL validation for environment configuration.
 *
 * Prevents SSRF attacks by rejecting URLs pointing to private/internal networks.
 */

const PRIVATE_IP_PATTERNS = [
  /^10\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^192\.168\./,
  /^169\.254\./,
  /^127\./,
  /^0\.0\.0\.0$/,
];

const PRIVATE_HOSTNAMES = new Set(["localhost", "[::1]"]);

function isPrivateHost(hostname: string): boolean {
  if (PRIVATE_HOSTNAMES.has(hostname)) return true;
  return PRIVATE_IP_PATTERNS.some((pattern) => pattern.test(hostname));
}

/**
 * Validate a URL from environment configuration.
 * Requires HTTPS unless allowLocalhost is set for development use.
 * Rejects private IP ranges to prevent SSRF.
 */
export function validateConfigUrl(
  url: string,
  options?: { allowLocalhost?: boolean },
): string {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error(`Invalid URL: ${url}`);
  }

  const allowLocalhost = options?.allowLocalhost ?? false;

  if (parsed.protocol === "http:") {
    if (!allowLocalhost || !isLocalhost(parsed.hostname)) {
      throw new Error(
        `URL must use HTTPS: ${url}`,
      );
    }
    // http://localhost is allowed in dev
    return url;
  }

  if (parsed.protocol !== "https:") {
    throw new Error(`URL must use HTTPS: ${url}`);
  }

  // Block private IPs even over HTTPS (SSRF prevention)
  if (isPrivateHost(parsed.hostname)) {
    throw new Error(`URL must not point to a private network: ${url}`);
  }

  return url;
}

function isLocalhost(hostname: string): boolean {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]";
}
