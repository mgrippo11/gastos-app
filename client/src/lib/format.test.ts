import { describe, expect, it } from 'vitest'
import { formatCurrency, formatDateARS, parseDateARS } from './format'

// Intl.NumberFormat separa simbolo y monto con NBSP (codepoint 160), no espacio normal.
const NBSP = String.fromCharCode(160)

describe('formatCurrency', () => {
  it('formatea Pesos por defecto', () => {
    expect(formatCurrency(1234.5)).toBe(`$${NBSP}1.234,50`)
  })

  it('formatea Dolares con US$', () => {
    expect(formatCurrency(1234.5, 'USD')).toBe(`US$${NBSP}1.234,50`)
  })
})

describe('formatDateARS', () => {
  it('convierte ISO a d/m/yyyy sin ceros a la izquierda', () => {
    expect(formatDateARS('2026-01-01')).toBe('1/1/2026')
    expect(formatDateARS('2026-05-11')).toBe('11/5/2026')
  })
})

describe('parseDateARS', () => {
  it('convierte d/m/yyyy a ISO', () => {
    expect(parseDateARS('1/1/2026')).toBe('2026-01-01')
    expect(parseDateARS('11/5/2026')).toBe('2026-05-11')
  })
})
