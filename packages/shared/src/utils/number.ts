/**
 * Number Utilities
 */

/**
 * Format number with options
 * @param value Number to format
 * @param options Intl.NumberFormatOptions
 * @param locale Locale string (default: 'en-US')
 * @returns Formatted number string
 */
export const formatNumber = (
  value: number,
  options?: Intl.NumberFormatOptions,
  locale: string = 'en-US'
): string => {
  return new Intl.NumberFormat(locale, options).format(value)
}

/**
 * Parse a number from string (removes non-numeric chars except . and -)
 * @param value String to parse
 * @returns number or null if invalid
 */
export const parseNumber = (value: string): number | null => {
  if (!value) return null
  // Remove all characters except digits, decimal point, and sign
  const cleaned = value.replace(/[^\d.-]/g, '')
  const parsed = parseFloat(cleaned)
  return isNaN(parsed) ? null : parsed
}

/**
 * Calculate percentage
 * @param value Numerator
 * @param total Denominator
 * @returns Percentage (0-100) rounded to nearest integer
 */
export const calculatePercentage = (value: number, total: number): number => {
  if (total === 0) return 0
  return Math.round((value / total) * 100)
}
