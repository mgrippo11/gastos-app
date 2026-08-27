import { describe, expect, it } from 'vitest'
import { rowToMovimiento } from './types.js'

describe('rowToMovimiento', () => {
  it('convierte snake_case (SQLite) a camelCase (API/cliente)', () => {
    expect(
      rowToMovimiento({
        id: 1,
        gasto: 'Alquiler',
        propiedad_id: 2,
        tipo: 'ingreso',
        monto: 100000,
        fecha: '2026-08-01',
        moneda: 'ARS',
      }),
    ).toEqual({
      id: 1,
      gasto: 'Alquiler',
      propiedadId: 2,
      tipo: 'ingreso',
      monto: 100000,
      fecha: '2026-08-01',
      moneda: 'ARS',
    })
  })
})
