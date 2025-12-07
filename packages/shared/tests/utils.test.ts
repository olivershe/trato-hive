import { describe, it, expect } from 'vitest'
import {
  formatDate,
  formatRelativeTime,
  isValidDate,
  formatCurrency,
  formatCompactCurrency,
  slugify,
  truncate,
  capitalize,
  humanize,
  formatNumber,
  parseNumber,
  calculatePercentage,
  sleep,
} from '../src/utils/index'

describe('Utilities', () => {
  describe('Date Utils', () => {
    it('should format date correctly', () => {
      const date = new Date('2024-04-29T12:00:00Z')
      expect(formatDate(date)).not.toBe('Invalid Date')
      // Exact string depends on time zone, just check basic validity
      expect(formatDate(date)).toContain('2024')
    })

    it('should format string date', () => {
      expect(formatDate('2024-04-29')).toContain('2024')
    })

    it('should handle invalid date', () => {
      expect(formatDate('invalid')).toBe('Invalid Date')
    })

    it('should format relative time', () => {
      const now = new Date()
      const past = new Date(now.getTime() - 1000 * 60 * 5) // 5 mins ago
      expect(formatRelativeTime(past)).toContain('5 minute')
    })

    it('should handle past relative time (days)', () => {
      const now = new Date()
      const past = new Date(now.getTime() - 1000 * 60 * 60 * 24 * 3) // 3 days ago
      expect(formatRelativeTime(past)).toContain('3 day')
    })

    it('should check valid date', () => {
      expect(isValidDate(new Date())).toBe(true)
      expect(isValidDate('2024-01-01')).toBe(true)
      expect(isValidDate('invalid')).toBe(false)
    })
  })

  describe('Currency Utils', () => {
    it('should format USD by default', () => {
      // Normalize space (some environments use non-breaking space)
      expect(formatCurrency(1234.56).replace(/\s/g, ' ')).toBe('$1,234.56')
    })

    it('should format EUR', () => {
      const result = formatCurrency(1234.56, 'EUR', 'de-DE')
      // 1.234,56 € or similar
      expect(result).toContain('1.234,56')
      expect(result).toContain('€')
    })

    it('should format compact currency', () => {
      expect(formatCompactCurrency(1500000)).toBe('$1.5M')
      expect(formatCompactCurrency(1200)).toBe('$1.2K')
    })
  })

  describe('String Utils', () => {
    it('should truncate string', () => {
      expect(truncate('Hello World', 8)).toBe('Hello...')
      expect(truncate('Hello', 10)).toBe('Hello')
    })

    it('should slugify string', () => {
      expect(slugify('Hello World!')).toBe('hello-world')
      expect(slugify('  Trim Me  ')).toBe('trim-me')
      expect(slugify('Café & Resumé')).toBe('cafe-resume')
    })

    it('should capitalize string', () => {
      expect(capitalize('hello')).toBe('Hello')
      expect(capitalize('')).toBe('')
    })

    it('should humanize string', () => {
      expect(humanize('camelCaseString')).toBe('Camel Case String')
      expect(humanize('snake_case_string')).toBe('Snake Case String')
      expect(humanize('kebab-case-string')).toBe('Kebab Case String')
    })
  })

  describe('Number Utils', () => {
    it('should format number', () => {
      expect(formatNumber(1234.56)).toBe('1,234.56')
    })

    it('should parse number', () => {
      expect(parseNumber('$1,234.56')).toBe(1234.56)
      expect(parseNumber('abc')).toBeNull()
    })

    it('should calculate percentage', () => {
      expect(calculatePercentage(50, 200)).toBe(25)
      expect(calculatePercentage(0, 0)).toBe(0)
    })
  })

  describe('Async Utils', () => {
    it('should sleep', async () => {
      const start = Date.now()
      await sleep(100)
      const end = Date.now()
      expect(end - start).toBeGreaterThanOrEqual(95) // allow small potential drift below 100
    })
  })
})
