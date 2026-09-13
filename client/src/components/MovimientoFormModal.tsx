import { useState } from 'react'
import type { MedioPago, Moneda, Movimiento, MovimientoInput, Propiedad, TipoMovimiento } from '../types'
import { Button } from './Button'

interface Props {
  propiedades: Propiedad[]
  // undefined = alta, Movimiento = edición.
  movimiento?: Movimiento
  onClose: () => void
  onSubmit: (input: MovimientoInput) => Promise<void>
}

const inputClass = 'mt-1 w-full border border-border bg-background rounded px-2 py-1'

// Un solo form sirve para alta y edición: si recibe `movimiento` precarga sus
// valores, si no arranca vacío. Reusable — evita duplicar el form.
export function MovimientoFormModal({ propiedades, movimiento, onClose, onSubmit }: Props) {
  const [gasto, setGasto] = useState(movimiento?.gasto ?? '')
  const [propiedadId, setPropiedadId] = useState(movimiento?.propiedadId ?? propiedades[0]?.id)
  const [tipo, setTipo] = useState<TipoMovimiento>(movimiento?.tipo ?? 'pago')
  const [moneda, setMoneda] = useState<Moneda>(movimiento?.moneda ?? 'ARS')
  const [medioPago, setMedioPago] = useState<MedioPago>(movimiento?.medioPago ?? 'cuenta')
  const [monto, setMonto] = useState(movimiento?.monto ?? 0)
  const [fecha, setFecha] = useState(movimiento?.fecha ?? new Date().toISOString().slice(0, 10))
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!propiedadId) return
    setSaving(true)
    try {
      await onSubmit({ gasto, propiedadId, tipo, monto, fecha, moneda, medioPago })
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4">
      <form
        onSubmit={handleSubmit}
        className="bg-card text-card-foreground border border-border rounded-lg shadow-sm p-6 w-full max-w-sm flex flex-col gap-3"
      >
        <h2 className="text-lg font-semibold">{movimiento ? 'Editar movimiento' : 'Nuevo movimiento'}</h2>

        <label className="text-sm text-muted-foreground">
          Gasto
          <input
            required
            value={gasto}
            onChange={(e) => setGasto(e.target.value)}
            className={inputClass}
          />
        </label>

        <label className="text-sm text-muted-foreground">
          Propiedad
          <select
            required
            value={propiedadId}
            onChange={(e) => setPropiedadId(Number(e.target.value))}
            className={inputClass}
          >
            {propiedades.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm text-muted-foreground">
          Tipo
          <select
            value={tipo}
            onChange={(e) => setTipo(e.target.value as TipoMovimiento)}
            className={inputClass}
          >
            <option value="pago">Pago</option>
            <option value="ingreso">Ingreso</option>
          </select>
        </label>

        <label className="text-sm text-muted-foreground">
          Moneda
          <select
            value={moneda}
            onChange={(e) => setMoneda(e.target.value as Moneda)}
            className={inputClass}
          >
            <option value="ARS">Pesos</option>
            <option value="USD">Dólares</option>
          </select>
        </label>

        <label className="text-sm text-muted-foreground">
          Medio de pago
          <select
            value={medioPago}
            onChange={(e) => setMedioPago(e.target.value as MedioPago)}
            className={inputClass}
          >
            <option value="cuenta">Cuenta</option>
            <option value="efectivo">Efectivo</option>
          </select>
        </label>

        <label className="text-sm text-muted-foreground">
          Monto
          <input
            required
            type="number"
            step="0.01"
            min="0"
            value={monto}
            onChange={(e) => setMonto(Number(e.target.value))}
            className={inputClass}
          />
        </label>

        <label className="text-sm text-muted-foreground">
          Fecha
          <input
            required
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            className={inputClass}
          />
        </label>

        <div className="flex justify-end gap-2 mt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={saving}>
            Guardar
          </Button>
        </div>
      </form>
    </div>
  )
}
