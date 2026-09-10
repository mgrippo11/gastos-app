import { Button } from './Button'
import type { FiltrosMovimiento } from '../lib/filtros'
import type { Propiedad } from '../types'

interface Props {
  filtros: FiltrosMovimiento
  onChange: (filtros: FiltrosMovimiento) => void
  // Si se pasan propiedades, se muestra el select de Propiedad (MovimientosPage).
  // Si no, solo Moneda + rango de fechas (DashboardPage).
  propiedades?: Propiedad[]
  mostrarTipo?: boolean
  // Buscador de texto libre sobre Gasto (MovimientosPage).
  mostrarTexto?: boolean
  // DashboardPage no puede graficar sin elegir una sola moneda (ver totals.ts:
  // los resúmenes vienen desglosados por moneda). Oculta la opción "todas".
  requiereMoneda?: boolean
}

// Filtros "vacíos": conserva moneda cuando la página la requiere (Dashboard
// no puede graficar sin una moneda elegida, ver totals.ts).
function filtrosLimpios(filtros: FiltrosMovimiento, requiereMoneda?: boolean): FiltrosMovimiento {
  return requiereMoneda ? { moneda: filtros.moneda } : {}
}

const selectClass = 'border border-border bg-card rounded px-2 py-1'

// Barra de filtros compartida entre MovimientosPage y DashboardPage — mismo
// patrón de selects + rango de fechas, cada página elige qué campos mostrar.
export function FiltrosBar({ filtros, onChange, propiedades, mostrarTipo, mostrarTexto, requiereMoneda }: Props) {
  return (
    <div className="flex flex-wrap gap-3 mb-4 text-sm items-center">
      {mostrarTexto && (
        <input
          type="text"
          value={filtros.texto ?? ''}
          onChange={(e) => onChange({ ...filtros, texto: e.target.value || undefined })}
          placeholder="Buscar por gasto..."
          className={`${selectClass} min-w-48`}
        />
      )}

      {propiedades && (
        <select
          value={filtros.propiedadId ?? ''}
          onChange={(e) =>
            onChange({ ...filtros, propiedadId: e.target.value ? Number(e.target.value) : undefined })
          }
          className={selectClass}
        >
          <option value="">Todas las propiedades</option>
          {propiedades.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nombre}
            </option>
          ))}
        </select>
      )}

      {mostrarTipo && (
        <select
          value={filtros.tipo ?? ''}
          onChange={(e) => onChange({ ...filtros, tipo: (e.target.value || undefined) as typeof filtros.tipo })}
          className={selectClass}
        >
          <option value="">Todos los tipos</option>
          <option value="ingreso">Ingreso</option>
          <option value="pago">Pago</option>
        </select>
      )}

      <select
        value={filtros.moneda ?? ''}
        onChange={(e) => onChange({ ...filtros, moneda: (e.target.value || undefined) as typeof filtros.moneda })}
        className={selectClass}
      >
        {!requiereMoneda && <option value="">Todas las monedas</option>}
        <option value="ARS">Pesos</option>
        <option value="USD">Dólares</option>
      </select>

      <input
        type="date"
        aria-label="Desde"
        value={filtros.desde ?? ''}
        onChange={(e) => onChange({ ...filtros, desde: e.target.value || undefined })}
        className={selectClass}
      />
      <input
        type="date"
        aria-label="Hasta"
        value={filtros.hasta ?? ''}
        onChange={(e) => onChange({ ...filtros, hasta: e.target.value || undefined })}
        className={selectClass}
      />

      <Button variant="ghost" onClick={() => onChange(filtrosLimpios(filtros, requiereMoneda))}>
        Limpiar filtros
      </Button>
    </div>
  )
}
