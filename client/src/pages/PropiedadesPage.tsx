import { useEffect, useState } from 'react'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { api } from '../lib/api'
import type { Propiedad } from '../types'

const NOMBRE_PROTEGIDO = 'Generales'
const inputClass = 'border border-border bg-background rounded px-2 py-1'

// ABM de propiedades: un solo campo (nombre), sin modal — alta con input
// arriba, edición inline por fila. "Generales" es la categoría comodín
// (ver CLAUDE.md) y no se puede editar ni borrar.
export function PropiedadesPage() {
  const [propiedades, setPropiedades] = useState<Propiedad[]>([])
  const [loading, setLoading] = useState(true)
  const [nuevoNombre, setNuevoNombre] = useState('')
  const [editandoId, setEditandoId] = useState<number | null>(null)
  const [editandoNombre, setEditandoNombre] = useState('')

  function cargar() {
    return api.getPropiedades().then(setPropiedades)
  }

  useEffect(() => {
    cargar().finally(() => setLoading(false))
  }, [])

  async function handleAgregar(e: React.FormEvent) {
    e.preventDefault()
    if (!nuevoNombre.trim()) return
    try {
      await api.createPropiedad(nuevoNombre.trim())
      setNuevoNombre('')
      await cargar()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al crear la propiedad')
    }
  }

  function iniciarEdicion(p: Propiedad) {
    setEditandoId(p.id)
    setEditandoNombre(p.nombre)
  }

  async function handleGuardarEdicion(id: number) {
    try {
      await api.updatePropiedad(id, editandoNombre.trim())
      setEditandoId(null)
      await cargar()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al renombrar la propiedad')
    }
  }

  async function handleDelete(p: Propiedad) {
    if (!confirm(`¿Borrar "${p.nombre}"?`)) return
    try {
      await api.deletePropiedad(p.id)
      await cargar()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al borrar la propiedad')
    }
  }

  if (loading) return <p className="p-6 text-muted-foreground">Cargando...</p>

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Propiedades</h1>

      <form onSubmit={handleAgregar} className="flex gap-2 mb-4">
        <input
          value={nuevoNombre}
          onChange={(e) => setNuevoNombre(e.target.value)}
          placeholder="Nueva propiedad"
          className={`${inputClass} flex-1 max-w-xs`}
        />
        <Button type="submit">Agregar</Button>
      </form>

      <Card className="overflow-hidden">
        <table className="w-full text-left border-collapse">
          <tbody>
            {propiedades.map((p) => (
              <tr key={p.id} className="border-b border-border last:border-0">
                <td className="py-2 px-4">
                  {editandoId === p.id ? (
                    <input
                      autoFocus
                      value={editandoNombre}
                      onChange={(e) => setEditandoNombre(e.target.value)}
                      className={inputClass}
                    />
                  ) : (
                    p.nombre
                  )}
                </td>
                <td className="py-2 px-4 text-right whitespace-nowrap">
                  {p.nombre === NOMBRE_PROTEGIDO ? null : editandoId === p.id ? (
                    <>
                      <Button variant="ghost" onClick={() => handleGuardarEdicion(p.id)}>
                        Guardar
                      </Button>
                      <Button variant="ghost" onClick={() => setEditandoId(null)}>
                        Cancelar
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button variant="ghost" onClick={() => iniciarEdicion(p)}>
                        Editar
                      </Button>
                      <Button variant="danger" onClick={() => handleDelete(p)}>
                        Borrar
                      </Button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  )
}
