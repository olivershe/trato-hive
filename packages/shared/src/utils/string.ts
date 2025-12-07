/**
 * String Utilities
 */

/**
 * Truncate string with ellipsis
 * @param str String to truncate
 * @param maxLength Maximum length including ellipsis
 * @returns Truncated string
 */
export const truncate = (str: string, maxLength: number): string => {
  if (str.length <= maxLength) return str
  return str.slice(0, maxLength - 3) + '...'
}

/**
 * Convert string to URL-friendly slug
 * @param text text to slugify
 * @returns slug string
 */
export const slugify = (text: string): string => {
  return text
    .toString()
    .normalize('NFD') // Normalize to NFD form
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/[^\w-]+/g, '') // Remove all non-word chars
    .replace(/--+/g, '-') // Replace multiple - with single -
    .replace(/^-+/, '') // Trim - from start
    .replace(/-+$/, '') // Trim - from end
}

/**
 * Capitalize first letter of string
 * @param text input string
 * @returns capitalized string
 */
export const capitalize = (text: string): string => {
  if (!text) return text
  return text.charAt(0).toUpperCase() + text.slice(1)
}

/**
 * Humanize string (convert camelCase/snake_case to Title Case)
 * @param text input string
 * @returns humanized string
 */
export const humanize = (text: string): string => {
  if (!text) return text

  // Replace underscores and dashes with spaces
  let result = text.replace(/[-_]+/g, ' ')

  // Insert space before camelCase caps
  result = result.replace(/([a-z])([A-Z])/g, '$1 $2')

  // Capitalize first letter of each word
  return result.replace(/\w\S*/g, (w) => w.replace(/^\w/, (c) => c.toUpperCase()))
}
