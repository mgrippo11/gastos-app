import { useEffect, useState } from 'react'
import { Badge } from '../components/Badge'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { FiltrosBar } from '../components/FiltrosBar'
import { MovimientoFormModal } from '../components/MovimientoFormModal'
import { api } from '../lib/api'
import { formatCurrency, formatDateARS } from '../lib/format'
import { filtrarMovimientos, type FiltrosMovimiento } from '../lib/filtros'
import { balanceGeneral, balancePorMedioPago, nombrePropiedad, resumenPorPropiedad } from '../lib/totals'
import type { Movimiento, Propiedad } from '../types'

// Listado de movimientos con filtros (propiedad, tipo, moneda, rango de
// fechas) y ABM (alta/edición vía modal, borrado con confirmación).
export function MovimientosPage() {
  const [movimientos, setMovimientos] = useState<Movimiento[]>([])
  const [propiedades, setPropiedades] = useState<Propiedad[]>([])
  const [loading, setLoading] = useState(true)
  const [filtros, setFiltros] = useState<FiltrosMovimiento>({})
  const [editando, setEditando] = useState<Movimiento | 'nuevo' | null>(null)
  const [pageSize, setPageSize] = useState(10)
  const [page, setPage] = useState(1)

  function cargar() {
    return Promise.all([api.getMovimientos(), api.getPropiedades()]).then(([mov, prop]) => {
      setMovimientos(mov)
      setPropiedades(prop)
    })
  }

  useEffect(() => {
    cargar().finally(() => setLoading(false))
  }, [])

  async function handleDelete(id: number) {
    if (!confirm('¿Borrar este movimiento?')) return
    await api.deleteMovimiento(id)
    await cargar()
  }

  if (loading) return <p className="p-6 text-muted-foreground">Cargando...</p>

  const filtrados = filtrarMovimientos(movimientos, filtros)
  // Caja: siempre sobre todos los movimientos, sin importar los filtros de la tabla.
  const caja = balanceGeneral(movimientos)
  const cajaPorMedio = balancePorMedioPago(movimientos)
  const porPropiedad = resumenPorPropiedad(movimientos)

  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / pageSize))
  const paginaActual = Math.min(page, totalPaginas)
  const paginados = filtrados.slice((paginaActual - 1) * pageSize, paginaActual * pageSize)

  function cambiarFiltros(nuevos: FiltrosMovimiento) {
    setFiltros(nuevos)
    setPage(1)
  }

  function cambiarPageSize(size: number) {
    setPageSize(size)
    setPage(1)
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Movimientos</h1>
        <Button onClick={() => setEditando('nuevo')}>Nuevo</Button>
      </div>

      <Card className="p-4 mb-4">
        <div className="mb-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
          <div className="text-xs text-muted-foreground uppercase">Total caja</div>
          {Object.entries(caja).length === 0 ? (
            <div className="text-muted-foreground">—</div>
          ) : (
            <div className="flex items-center divide-x divide-border">
              {Object.entries(caja).map(([moneda, monto]) => (
                <div key={moneda} className="px-4 flex flex-col items-center">
                  <div className={`text-xl font-semibold ${monto < 0 ? 'text-danger' : 'text-success'}`}>
                    {formatCurrency(monto, moneda as Movimiento['moneda'])}
                  </div>
                  <div className="text-xs text-muted-foreground flex gap-2">
                    {cajaPorMedio
                      .filter((c) => c.moneda === moneda)
                      .map((c) => (
                        <span key={c.medioPago}>
                          {c.medioPago === 'efectivo' ? 'Efectivo' : 'Cuenta'}: {formatCurrency(c.monto, c.moneda)}
                        </span>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {porPropiedad.length > 0 && (
          <div className="border-t border-border pt-3 flex flex-wrap gap-x-8 gap-y-2 text-sm">
            {porPropiedad.map((r) => (
              <div key={`${r.propiedadId}-${r.moneda}`}>
                <span className="text-muted-foreground">{nombrePropiedad(propiedades, r.propiedadId)}: </span>
                <span className={r.balance < 0 ? 'text-danger' : 'text-success'}>
                  {formatCurrency(r.balance, r.moneda)}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>

      <FiltrosBar filtros={filtros} onChange={cambiarFiltros} propiedades={propiedades} mostrarTipo mostrarTexto />

      <Card className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-border text-sm text-muted-foreground">
              <th className="py-2 px-4">Gasto</th>
              <th className="py-2 px-4">Propiedad</th>
              <th className="py-2 px-4">Tipo</th>
              <th className="py-2 px-4">Moneda</th>
              <th className="py-2 px-4">Medio</th>
              <th className="py-2 px-4 text-right">Monto</th>
              <th className="py-2 px-4">Fecha</th>
              <th className="py-2 px-4"></th>
            </tr>
          </thead>
          <tbody>
            {paginados.map((m) => (
              <tr key={m.id} className="border-b border-border last:border-0 hover:bg-muted/50">
                <td className="py-2 px-4">{m.gasto}</td>
                <td className="py-2 px-4">
                  {propiedades.find((p) => p.id === m.propiedadId)?.nombre ?? '—'}
                </td>
                <td className="py-2 px-4">
                  <Badge tone={m.tipo === 'ingreso' ? 'success' : 'danger'}>{m.tipo}</Badge>
                </td>
                <td className="py-2 px-4">
                  <Badge>{m.moneda}</Badge>
                </td>
                <td className="py-2 px-4">{m.medioPago === 'efectivo' ? 'Efectivo' : 'Cuenta'}</td>
                <td className="py-2 px-4 text-right">{formatCurrency(m.monto, m.moneda)}</td>
                <td className="py-2 px-4">{formatDateARS(m.fecha)}</td>
                <td className="py-2 px-4 text-right whitespace-nowrap">
                  <Button variant="ghost" onClick={() => setEditando(m)}>
                    Editar
                  </Button>
                  <Button variant="danger" onClick={() => handleDelete(m.id)}>
                    Borrar
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-3 mt-4 text-sm">
        <label className="flex items-center gap-2 text-muted-foreground">
          Por página
          <select
            value={pageSize}
            onChange={(e) => cambiarPageSize(Number(e.target.value))}
            className="border border-border bg-background rounded px-2 py-1"
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </label>

        <div className="flex items-center gap-3">
          <Button variant="ghost" disabled={paginaActual <= 1} onClick={() => setPage(paginaActual - 1)}>
            Anterior
          </Button>
          <span className="text-muted-foreground">
            Página {paginaActual} de {totalPaginas}
          </span>
          <Button
            variant="ghost"
            disabled={paginaActual >= totalPaginas}
            onClick={() => setPage(paginaActual + 1)}
          >
            Siguiente
          </Button>
        </div>
      </div>

      {editando && (
        <MovimientoFormModal
          propiedades={propiedades}
          movimiento={editando === 'nuevo' ? undefined : editando}
          onClose={() => setEditando(null)}
          onSubmit={async (input) => {
            if (editando === 'nuevo') {
              await api.createMovimiento(input)
            } else {
              await api.updateMovimiento(editando.id, input)
            }
            await cargar()
          }}
        />
      )}
    </div>
  )
}
