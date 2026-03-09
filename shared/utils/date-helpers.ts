/**
 * Format a date string to a readable format
 * @param dateString ISO 8601 date string
 * @returns Formatted date (e.g., "Mar 9, 2026")
 */
export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return 'Invalid date';
  }
}

/**
 * Format a date string with time
 * @param dateString ISO 8601 date string
 * @returns Formatted date with time (e.g., "Mar 9, 2026, 2:30 PM")
 */
export function formatDateTime(dateString: string | null | undefined): string {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return 'Invalid date';
  }
}

/**
 * Get relative time from now (e.g., "2 hours ago")
 * @param dateString ISO 8601 date string
 * @returns Relative time string
 */
export function getRelativeTime(dateString: string | null | undefined): string {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    const weeks = Math.floor(days / 7);
    if (weeks < 4) return `${weeks}w ago`;

    return formatDate(dateString);
  } catch {
    return 'Invalid date';
  }
}
