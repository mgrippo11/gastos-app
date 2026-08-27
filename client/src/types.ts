// Modelo de datos compartido entre frontend y backend.
// Mantener alineado con server/src/db.ts (definición de tablas).

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
  // Monto en la moneda indicada por `moneda`, siempre positivo. El signo lo determina `tipo`.
  monto: number
  // Fecha en formato ISO (yyyy-mm-dd).
  fecha: string
  moneda: Moneda
}

export type MovimientoInput = Omit<Movimiento, 'id'>
