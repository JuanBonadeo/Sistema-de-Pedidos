/**
 * Business slugs we reserve for platform-level routes. If a business tried
 * to use one, it would collide with /admin, /super, /api, etc.
 *
 * Shared by createBusiness (platform) and updateBusinessSettings (per-
 * business admin).
 */
export const RESERVED_SLUGS = new Set([
  "admin",
  "super",
  "api",
  "auth",
  "www",
  "app",
  "login",
]);

export const SLUG_PATTERN = /^[a-z0-9-]+$/;

export function isValidSlug(slug: string): boolean {
  return (
    slug.length >= 2 &&
    slug.length <= 60 &&
    SLUG_PATTERN.test(slug) &&
    !RESERVED_SLUGS.has(slug)
  );
}

/**
 * Convert a human name into a url-safe slug candidate.
 * "Golf Club Rosario" → "golf-club-rosario"
 * "Pizza Napoli!!!"   → "pizza-napoli"
 */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 60);
}
