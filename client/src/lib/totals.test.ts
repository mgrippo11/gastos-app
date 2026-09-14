import { describe, expect, it } from 'vitest'
import type { Movimiento } from '../types'
import { balanceGeneral, balancePorMedioPago, resumenMensual, resumenPorPropiedad } from './totals'

const movimientos: Movimiento[] = [
  { id: 1, gasto: 'Alquiler', propiedadId: 1, tipo: 'ingreso', monto: 100000, fecha: '2026-01-05', moneda: 'ARS', medioPago: 'cuenta' },
  { id: 2, gasto: 'Expensas', propiedadId: 1, tipo: 'pago', monto: 20000, fecha: '2026-01-10', moneda: 'ARS', medioPago: 'cuenta' },
  { id: 3, gasto: 'Alquiler', propiedadId: 2, tipo: 'ingreso', monto: 80000, fecha: '2026-02-05', moneda: 'ARS', medioPago: 'cuenta' },
  { id: 4, gasto: 'Fee USD', propiedadId: 1, tipo: 'ingreso', monto: 300, fecha: '2026-01-20', moneda: 'USD', medioPago: 'cuenta' },
]

describe('resumenPorPropiedad', () => {
  it('agrupa ingresos, pagos y balance por propiedad y moneda', () => {
    const resumen = resumenPorPropiedad(movimientos)
    expect(resumen).toContainEqual({
      propiedadId: 1,
      moneda: 'ARS',
      ingresos: 100000,
      pagos: 20000,
      balance: 80000,
    })
    expect(resumen).toContainEqual({
      propiedadId: 2,
      moneda: 'ARS',
      ingresos: 80000,
      pagos: 0,
      balance: 80000,
    })
    // Propiedad 1 tiene movimientos en ARS y USD: no se mezclan en un solo total.
    expect(resumen).toContainEqual({
      propiedadId: 1,
      moneda: 'USD',
      ingresos: 300,
      pagos: 0,
      balance: 300,
    })
  })
})

describe('resumenMensual', () => {
  it('agrupa por mes y moneda, y ordena cronológicamente', () => {
    const resumen = resumenMensual(movimientos)
    expect(resumen.map((r) => `${r.mes}-${r.moneda}`).sort()).toEqual([
      '2026-01-ARS',
      '2026-01-USD',
      '2026-02-ARS',
    ])
    expect(resumen.find((r) => r.mes === '2026-01' && r.moneda === 'ARS')?.balance).toBe(80000)
  })
})

describe('balanceGeneral', () => {
  it('suma ingresos y resta pagos, desglosado por moneda', () => {
    expect(balanceGeneral(movimientos)).toEqual({ ARS: 160000, USD: 300 })
  })
})

describe('balancePorMedioPago', () => {
  it('desglosa el balance por moneda y medio de pago', () => {
    const conEfectivo: Movimiento[] = [
      ...movimientos,
      { id: 5, gasto: 'Propina', propiedadId: 1, tipo: 'pago', monto: 5000, fecha: '2026-01-15', moneda: 'ARS', medioPago: 'efectivo' },
    ]
    expect(balancePorMedioPago(conEfectivo)).toContainEqual({ moneda: 'ARS', medioPago: 'cuenta', monto: 160000 })
    expect(balancePorMedioPago(conEfectivo)).toContainEqual({ moneda: 'ARS', medioPago: 'efectivo', monto: -5000 })
  })
})
