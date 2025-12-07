/**
 * Date Utilities
 * Zero dependencies implementation
 */

/**
 * Format a date string or object
 * @param date Date object or ISO string
 * @param locale Locale string (default: 'en-US')
 * @param options Intl.DateTimeFormatOptions
 * @returns Formatted date string
 */
export const formatDate = (
  date: Date | string,
  locale: string = 'en-US',
  options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' }
): string => {
  const d = typeof date === 'string' ? new Date(date) : date
  if (isNaN(d.getTime())) return 'Invalid Date'
  return new Intl.DateTimeFormat(locale, options).format(d)
}

/**
 * Format relative time (e.g., "3 days ago")
 * Simplified implementation using Intl.RelativeTimeFormat
 * @param date Date object or ISO string
 * @param locale Locale string (default: 'en-US')
 * @returns Relative time string
 */
export const formatRelativeTime = (date: Date | string, locale: string = 'en-US'): string => {
  const d = typeof date === 'string' ? new Date(date) : date
  if (isNaN(d.getTime())) return 'Invalid Date'

  const now = new Date()
  const diffInSeconds = Math.floor((d.getTime() - now.getTime()) / 1000)
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' })

  // Array of units and their values in seconds
  const units: { unit: Intl.RelativeTimeFormatUnit; seconds: number }[] = [
    { unit: 'year', seconds: 31536000 },
    { unit: 'month', seconds: 2592000 },
    { unit: 'week', seconds: 604800 },
    { unit: 'day', seconds: 86400 },
    { unit: 'hour', seconds: 3600 },
    { unit: 'minute', seconds: 60 },
    { unit: 'second', seconds: 1 },
  ]

  for (const { unit, seconds } of units) {
    if (Math.abs(diffInSeconds) >= seconds || unit === 'second') {
      return rtf.format(Math.round(diffInSeconds / seconds), unit)
    }
  }

  return 'now'
}

/**
 * Check if a date is valid
 * @param date Any value
 * @returns boolean
 */
export const isValidDate = (date: unknown): boolean => {
  if (date instanceof Date) return !isNaN(date.getTime())
  if (typeof date === 'string') {
    const d = new Date(date)
    return !isNaN(d.getTime())
  }
  return false
}
