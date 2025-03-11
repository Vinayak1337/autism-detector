/**
 * Format a date into a readable string
 * @param date Date to format
 * @returns Formatted date string
 */
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

/**
 * Get relative time (e.g., "2 days ago", "just now")
 * @param date Date to get relative time for
 * @returns Relative time string
 */
export function getRelativeTime(date: Date): string {
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  const now = new Date();
  const diffInMs = date.getTime() - now.getTime();
  const diffInSec = Math.floor(diffInMs / 1000);
  const diffInMin = Math.floor(diffInSec / 60);
  const diffInHr = Math.floor(diffInMin / 60);
  const diffInDays = Math.floor(diffInHr / 24);

  if (diffInDays < -30) {
    return formatDate(date);
  } else if (diffInDays < 0) {
    return rtf.format(diffInDays, 'day');
  } else if (diffInHr < 0) {
    return rtf.format(diffInHr, 'hour');
  } else if (diffInMin < 0) {
    return rtf.format(diffInMin, 'minute');
  } else {
    return 'just now';
  }
}
