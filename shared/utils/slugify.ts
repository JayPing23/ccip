/**
 * Slug Generation Utility
 * Converts titles to URL-safe slugs for content
 */

/**
 * Convert a title to a URL-safe slug
 * @example
 * generateSlug("Enrollment Deadline 2025") // "enrollment-deadline-2025"
 */
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special chars
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Generate a unique slug by appending a short UUID suffix
 * Used when a slug collision is detected
 * @example
 * appendUuidToSlug("enrollment-deadline-2025") // "enrollment-deadline-2025-a3f2"
 */
export function appendUuidToSlug(slug: string): string {
  const uuid = crypto
    .getRandomValues(new Uint8Array(2))
    .reduce((str, byte) => str + byte.toString(16).padStart(2, '0'), '')
    .substring(0, 4);
  return `${slug}-${uuid}`;
}
