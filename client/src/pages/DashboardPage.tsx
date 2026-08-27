import { useEffect, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Card } from '../components/Card'
import { FiltrosBar } from '../components/FiltrosBar'
import { api } from '../lib/api'
import { filtrarMovimientos, type FiltrosMovimiento } from '../lib/filtros'
import { nombrePropiedad, resumenMensual, resumenPorPropiedad } from '../lib/totals'
import { formatCurrency } from '../lib/format'
import type { Movimiento, Propiedad } from '../types'

// Colores fijos (no tokens): Recharts los aplica como atributos SVG, no
// participan del cascade de CSS custom properties. Elegidos para leerse bien
// en claro y oscuro.
const EJE_COLOR = '#9ca3af'
const GRID_COLOR = '#9ca3af33'
const tooltipStyle = {
  background: 'var(--color-card)',
  border: '1px solid var(--color-border)',
  borderRadius: 6,
  color: 'var(--color-foreground)',
}

// Resumen por propiedad (barras) y balance mensual (línea), filtrado por
// rango de fechas y moneda. Los cálculos viven en lib/totals.ts, acá solo se
// renderizan. Cada resumen viene desglosado por moneda (ver totals.ts), así
// que hay que elegir una para no mezclar Pesos y Dólares en el mismo gráfico.
export function DashboardPage() {
  const [movimientos, setMovimientos] = useState<Movimiento[]>([])
  const [propiedades, setPropiedades] = useState<Propiedad[]>([])
  const [loading, setLoading] = useState(true)
  const [filtros, setFiltros] = useState<FiltrosMovimiento>({ moneda: 'ARS' })

  useEffect(() => {
    Promise.all([api.getMovimientos(), api.getPropiedades()])
      .then(([mov, prop]) => {
        setMovimientos(mov)
        setPropiedades(prop)
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <p className="p-6 text-muted-foreground">Cargando...</p>

  const moneda = filtros.moneda ?? 'ARS'
  const filtrados = filtrarMovimientos(movimientos, filtros)
  const porPropiedad = resumenPorPropiedad(filtrados).map((r) => ({
    ...r,
    nombre: nombrePropiedad(propiedades, r.propiedadId),
  }))
  const porMes = resumenMensual(filtrados)

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Dashboard</h1>

      <FiltrosBar filtros={filtros} onChange={setFiltros} requiereMoneda />

      <h2 className="text-lg font-medium mb-2">Por propiedad</h2>
      <Card className="h-72 mb-8 p-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={porPropiedad}>
            <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} />
            <XAxis dataKey="nombre" tick={{ fill: EJE_COLOR }} />
            <YAxis tickFormatter={(v) => formatCurrency(v, moneda)} width={90} tick={{ fill: EJE_COLOR }} />
            <Tooltip formatter={(v) => formatCurrency(Number(v), moneda)} contentStyle={tooltipStyle} />
            <Bar dataKey="ingresos" fill="#16a34a" />
            <Bar dataKey="pagos" fill="#dc2626" />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <h2 className="text-lg font-medium mb-2">Balance mensual</h2>
      <Card className="h-72 p-4">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={porMes}>
            <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} />
            <XAxis dataKey="mes" tick={{ fill: EJE_COLOR }} />
            <YAxis tickFormatter={(v) => formatCurrency(v, moneda)} width={90} tick={{ fill: EJE_COLOR }} />
            <Tooltip formatter={(v) => formatCurrency(Number(v), moneda)} contentStyle={tooltipStyle} />
            <Line type="monotone" dataKey="balance" stroke="#6366f1" />
          </LineChart>
        </ResponsiveContainer>
      </Card>
    </div>
  )
}
