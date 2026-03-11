/**
 * PocketBase filter sanitization utilities.
 *
 * PocketBase does not support parameterized queries, so all filter values
 * are interpolated into strings. These helpers validate inputs before
 * interpolation to prevent filter injection attacks.
 */

/**
 * Validate and return a numeric value safe for PocketBase filter interpolation.
 * Throws if the value is not a finite number.
 */
export function sanitizeFilterNumber(value: unknown): number {
  const n = Number(value);
  if (Number.isNaN(n) || !Number.isFinite(n)) {
    throw new Error(`Invalid numeric filter value: ${String(value)}`);
  }
  return n;
}

/**
 * Validate and return a string value safe for PocketBase filter interpolation.
 * Only allows alphanumeric characters, underscores, hyphens, dots, and @.
 * Throws if the value contains any other characters (e.g. quotes, operators).
 */
export function sanitizeFilterString(value: unknown): string {
  const s = String(value);
  if (!s || !/^[a-zA-Z0-9_\-@.]+$/.test(s)) {
    throw new Error(`Invalid string filter value: ${s}`);
  }
  return s;
}
