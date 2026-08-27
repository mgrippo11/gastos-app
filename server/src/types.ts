// Espejo de client/src/types.ts. Al modificar uno, actualizar el otro
// (no hay paquete compartido todavía; ver CLAUDE.md).

export type TipoMovimiento = 'ingreso' | 'pago'
export type Moneda = 'ARS' | 'USD'

export interface Propiedad {
  id: number
  nombre: string
}

export interface Movimiento {
  id: number
  gasto: string
  propiedadId: number
  tipo: TipoMovimiento
  monto: number
  fecha: string
  moneda: Moneda
}

export type MovimientoInput = Omit<Movimiento, 'id'>

// Fila cruda tal como sale de SQLite (snake_case).
export interface MovimientoRow {
  id: number
  gasto: string
  propiedad_id: number
  tipo: TipoMovimiento
  monto: number
  fecha: string
  moneda: Moneda
}

export function rowToMovimiento(row: MovimientoRow): Movimiento {
  return {
    id: row.id,
    gasto: row.gasto,
    propiedadId: row.propiedad_id,
    tipo: row.tipo,
    monto: row.monto,
    fecha: row.fecha,
    moneda: row.moneda,
  }
}
