import type { Moneda } from '../types'

// Formato argentino: punto para miles, coma para decimales. El locale es
// siempre es-AR (así se muestra USD como "US$ 1.234,56", como en la planilla).
const currencyFormatters: Record<Moneda, Intl.NumberFormat> = {
  ARS: new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }),
  USD: new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }),
}

export function formatCurrency(monto: number, moneda: Moneda = 'ARS'): string {
  return currencyFormatters[moneda].format(monto)
}

// Fecha ISO (yyyy-mm-dd, como se guarda en DB) -> d/m/yyyy (como en la planilla original).
export function formatDateARS(isoDate: string): string {
  const [year, month, day] = isoDate.split('-')
  return `${Number(day)}/${Number(month)}/${year}`
}

// d/m/yyyy -> ISO (yyyy-mm-dd), para guardar en DB.
export function parseDateARS(displayDate: string): string {
  const [day, month, year] = displayDate.split('/')
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
}
