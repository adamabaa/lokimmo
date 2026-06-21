import { describe, it, expect } from 'vitest'
import { formatCurrency } from '../formatCurrency'
import { formatDate, formatDateShort } from '../formatDate'

describe('formatCurrency', () => {
  it('should format valid amounts to FCFA', () => {
    // Le formateur fr-FR insère un espace insécable (non-breaking space) entre les milliers
    const res1 = formatCurrency(150000)
    expect(res1).toMatch(/150\s000\sFCFA/)
    expect(formatCurrency(0)).toBe('0 FCFA')
    expect(formatCurrency('250000')).toMatch(/250\s000\sFCFA/)
  })

  it('should return placeholder for null, undefined or invalid values', () => {
    expect(formatCurrency(null)).toBe('—')
    expect(formatCurrency(undefined)).toBe('—')
    expect(formatCurrency('not-a-number')).toBe('—')
  })
})

describe('formatDate', () => {
  it('should format ISO dates into French format', () => {
    const dateStr = '2026-03-15T00:00:00.000Z'
    expect(formatDate(dateStr)).toContain('2026')
    expect(formatDateShort(dateStr)).toBe('15/03/2026')
  })

  it('should return placeholder for invalid dates', () => {
    expect(formatDate(null)).toBe('—')
    expect(formatDate('')).toBe('—')
    expect(formatDate('invalid-date')).toBe('—')
  })
})
