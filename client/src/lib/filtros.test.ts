import { describe, expect, it } from 'vitest'
import type { Movimiento } from '../types'
import { filtrarMovimientos } from './filtros'

const movimientos: Movimiento[] = [
  { id: 1, gasto: 'Alquiler', propiedadId: 1, tipo: 'ingreso', monto: 100000, fecha: '2026-01-05', moneda: 'ARS' },
  { id: 2, gasto: 'Expensas', propiedadId: 1, tipo: 'pago', monto: 20000, fecha: '2026-01-10', moneda: 'ARS' },
  { id: 3, gasto: 'Alquiler', propiedadId: 2, tipo: 'ingreso', monto: 80000, fecha: '2026-02-05', moneda: 'USD' },
]

describe('filtrarMovimientos', () => {
  it('sin filtros devuelve todo', () => {
    expect(filtrarMovimientos(movimientos, {})).toHaveLength(3)
  })

  it('filtra por propiedad', () => {
    expect(filtrarMovimientos(movimientos, { propiedadId: 1 })).toHaveLength(2)
  })

  it('filtra por tipo', () => {
    expect(filtrarMovimientos(movimientos, { tipo: 'pago' })).toEqual([movimientos[1]])
  })

  it('filtra por moneda', () => {
    expect(filtrarMovimientos(movimientos, { moneda: 'USD' })).toEqual([movimientos[2]])
  })

  it('filtra por texto en el gasto, case-insensitive', () => {
    expect(filtrarMovimientos(movimientos, { texto: 'alqui' })).toHaveLength(2)
    expect(filtrarMovimientos(movimientos, { texto: 'EXPEN' })).toEqual([movimientos[1]])
    expect(filtrarMovimientos(movimientos, { texto: '' })).toHaveLength(3)
  })

  it('filtra por rango de fechas inclusive', () => {
    const resultado = filtrarMovimientos(movimientos, { desde: '2026-01-10', hasta: '2026-01-10' })
    expect(resultado).toEqual([movimientos[1]])
  })

  it('combina filtros', () => {
    const resultado = filtrarMovimientos(movimientos, { propiedadId: 1, tipo: 'ingreso' })
    expect(resultado).toEqual([movimientos[0]])
  })
})
