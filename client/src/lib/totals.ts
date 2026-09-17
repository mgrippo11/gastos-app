import type { MedioPago, Moneda, Movimiento, Propiedad } from '../types'

export interface ResumenPropiedad {
  propiedadId: number
  moneda: Moneda
  ingresos: number
  pagos: number
  balance: number
}

export interface ResumenMensual {
  // yyyy-mm
  mes: string
  moneda: Moneda
  ingresos: number
  pagos: number
  balance: number
}

// Funciones puras: sin dependencias de React ni de la API, fáciles de testear
// (ver totals.test.ts). La UI solo debe llamarlas, nunca reimplementar la suma.
//
// Cada resumen se desglosa por moneda (no se suma ARS + USD en un mismo
// total): una propiedad o un mes con movimientos en ambas monedas produce
// dos filas, una por moneda.

export function resumenPorPropiedad(movimientos: Movimiento[]): ResumenPropiedad[] {
  const porPropiedad = new Map<string, ResumenPropiedad>()

  for (const m of movimientos) {
    const key = `${m.propiedadId}-${m.moneda}`
    const actual = porPropiedad.get(key) ?? {
      propiedadId: m.propiedadId,
      moneda: m.moneda,
      ingresos: 0,
      pagos: 0,
      balance: 0,
    }

    if (m.tipo === 'ingreso') {
      actual.ingresos += m.monto
    } else {
      actual.pagos += m.monto
    }
    actual.balance = actual.ingresos - actual.pagos

    porPropiedad.set(key, actual)
  }

  return [...porPropiedad.values()]
}

export function resumenMensual(movimientos: Movimiento[]): ResumenMensual[] {
  const porMes = new Map<string, ResumenMensual>()

  for (const m of movimientos) {
    const mes = m.fecha.slice(0, 7) // yyyy-mm
    const key = `${mes}-${m.moneda}`
    const actual = porMes.get(key) ?? { mes, moneda: m.moneda, ingresos: 0, pagos: 0, balance: 0 }

    if (m.tipo === 'ingreso') {
      actual.ingresos += m.monto
    } else {
      actual.pagos += m.monto
    }
    actual.balance = actual.ingresos - actual.pagos

    porMes.set(key, actual)
  }

  return [...porMes.values()].sort((a, b) => a.mes.localeCompare(b.mes))
}

export interface BalancePorMedioPago {
  moneda: Moneda
  medioPago: MedioPago
  monto: number
}

// Desglosa el balance por moneda y medio de pago (para mostrar cuánto de la
// caja está en efectivo vs. en cuenta).
export function balancePorMedioPago(movimientos: Movimiento[]): BalancePorMedioPago[] {
  const balances = new Map<string, BalancePorMedioPago>()
  for (const m of movimientos) {
    const key = `${m.moneda}-${m.medioPago}`
    const actual = balances.get(key) ?? { moneda: m.moneda, medioPago: m.medioPago, monto: 0 }
    actual.monto += m.tipo === 'ingreso' ? m.monto : -m.monto
    balances.set(key, actual)
  }
  return [...balances.values()]
}

// Mismo balance, sumado por moneda sin importar el medio de pago — se deriva
// de balancePorMedioPago en vez de reimplementar la regla de signo.
export function balanceGeneral(movimientos: Movimiento[]): Partial<Record<Moneda, number>> {
  const balances: Partial<Record<Moneda, number>> = {}
  for (const { moneda, monto } of balancePorMedioPago(movimientos)) {
    balances[moneda] = (balances[moneda] ?? 0) + monto
  }
  return balances
}

export function nombrePropiedad(propiedades: Propiedad[], propiedadId: number): string {
  return propiedades.find((p) => p.id === propiedadId)?.nombre ?? 'Desconocida'
}
