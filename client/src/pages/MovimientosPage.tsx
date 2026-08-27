import { useEffect, useState } from 'react'
import { Badge } from '../components/Badge'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { FiltrosBar } from '../components/FiltrosBar'
import { MovimientoFormModal } from '../components/MovimientoFormModal'
import { api } from '../lib/api'
import { formatCurrency, formatDateARS } from '../lib/format'
import { filtrarMovimientos, type FiltrosMovimiento } from '../lib/filtros'
import { balanceGeneral, nombrePropiedad, resumenPorPropiedad } from '../lib/totals'
import type { Movimiento, Propiedad } from '../types'

// Listado de movimientos con filtros (propiedad, tipo, moneda, rango de
// fechas) y ABM (alta/edición vía modal, borrado con confirmación).
export function MovimientosPage() {
  const [movimientos, setMovimientos] = useState<Movimiento[]>([])
  const [propiedades, setPropiedades] = useState<Propiedad[]>([])
  const [loading, setLoading] = useState(true)
  const [filtros, setFiltros] = useState<FiltrosMovimiento>({})
  const [editando, setEditando] = useState<Movimiento | 'nuevo' | null>(null)

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
  const porPropiedad = resumenPorPropiedad(movimientos)

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Movimientos</h1>
        <Button onClick={() => setEditando('nuevo')}>Nuevo</Button>
      </div>

      <Card className="p-4 mb-4">
        <div className="flex flex-wrap gap-x-8 gap-y-2 mb-3">
          <div>
            <div className="text-xs text-muted-foreground uppercase">Caja</div>
            {Object.entries(caja).length === 0 && <div className="text-muted-foreground">—</div>}
            {Object.entries(caja).map(([moneda, monto]) => (
              <div
                key={moneda}
                className={`text-xl font-semibold ${monto < 0 ? 'text-danger' : 'text-success'}`}
              >
                {formatCurrency(monto, moneda as Movimiento['moneda'])}
              </div>
            ))}
          </div>
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

      <FiltrosBar filtros={filtros} onChange={setFiltros} propiedades={propiedades} mostrarTipo />

      <Card className="overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-border text-sm text-muted-foreground">
              <th className="py-2 px-4">Gasto</th>
              <th className="py-2 px-4">Propiedad</th>
              <th className="py-2 px-4">Tipo</th>
              <th className="py-2 px-4">Moneda</th>
              <th className="py-2 px-4 text-right">Monto</th>
              <th className="py-2 px-4">Fecha</th>
              <th className="py-2 px-4"></th>
            </tr>
          </thead>
          <tbody>
            {filtrados.map((m) => (
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
