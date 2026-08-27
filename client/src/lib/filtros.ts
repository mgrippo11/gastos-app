import type { Moneda, Movimiento, TipoMovimiento } from '../types'

export interface FiltrosMovimiento {
  propiedadId?: number
  tipo?: TipoMovimiento
  moneda?: Moneda
  // Fechas ISO (yyyy-mm-dd), inclusive.
  desde?: string
  hasta?: string
}

// Función pura: usada tanto por MovimientosPage (todos los filtros) como
// por DashboardPage (solo desde/hasta), para no reimplementar el filtro dos veces.
export function filtrarMovimientos(
  movimientos: Movimiento[],
  filtros: FiltrosMovimiento,
): Movimiento[] {
  return movimientos.filter((m) => {
    if (filtros.propiedadId !== undefined && m.propiedadId !== filtros.propiedadId) return false
    if (filtros.tipo !== undefined && m.tipo !== filtros.tipo) return false
    if (filtros.moneda !== undefined && m.moneda !== filtros.moneda) return false
    if (filtros.desde !== undefined && m.fecha < filtros.desde) return false
    if (filtros.hasta !== undefined && m.fecha > filtros.hasta) return false
    return true
  })
}
