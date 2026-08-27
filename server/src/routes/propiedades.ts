import { Router } from 'express'
import { db } from '../db.js'
import type { Propiedad } from '../types.js'

export const propiedadesRouter = Router()

// Categoría comodín que el resto del código asume que existe (ver CLAUDE.md) — no se puede renombrar ni borrar.
const NOMBRE_PROTEGIDO = 'Generales'

function esConstraintUnique(err: unknown): boolean {
  return err instanceof Error && err.message.includes('UNIQUE constraint failed')
}

propiedadesRouter.get('/', (_req, res) => {
  const propiedades = db.prepare('SELECT id, nombre FROM propiedades ORDER BY nombre').all() as Propiedad[]
  res.json(propiedades)
})

propiedadesRouter.post('/', (req, res) => {
  const { nombre } = req.body as { nombre: string }
  try {
    const result = db.prepare('INSERT INTO propiedades (nombre) VALUES (?)').run(nombre)
    res.status(201).json({ id: result.lastInsertRowid, nombre })
  } catch (err) {
    if (esConstraintUnique(err)) return res.status(409).json({ error: 'Ya existe una propiedad con ese nombre' })
    throw err
  }
})

propiedadesRouter.put('/:id', (req, res) => {
  const { nombre } = req.body as { nombre: string }
  const actual = db.prepare('SELECT * FROM propiedades WHERE id = ?').get(req.params.id) as Propiedad | undefined
  if (!actual) return res.status(404).end()
  if (actual.nombre === NOMBRE_PROTEGIDO) {
    return res.status(400).json({ error: `"${NOMBRE_PROTEGIDO}" no se puede renombrar` })
  }
  try {
    db.prepare('UPDATE propiedades SET nombre = ? WHERE id = ?').run(nombre, req.params.id)
    res.json({ id: Number(req.params.id), nombre })
  } catch (err) {
    if (esConstraintUnique(err)) return res.status(409).json({ error: 'Ya existe una propiedad con ese nombre' })
    throw err
  }
})

propiedadesRouter.delete('/:id', (req, res) => {
  const actual = db.prepare('SELECT * FROM propiedades WHERE id = ?').get(req.params.id) as Propiedad | undefined
  if (!actual) return res.status(404).end()
  if (actual.nombre === NOMBRE_PROTEGIDO) {
    return res.status(400).json({ error: `"${NOMBRE_PROTEGIDO}" no se puede borrar` })
  }
  const { count } = db
    .prepare('SELECT COUNT(*) as count FROM movimientos WHERE propiedad_id = ?')
    .get(req.params.id) as { count: number }
  if (count > 0) {
    return res.status(409).json({ error: `Tiene ${count} movimiento(s) asociado(s), no se puede borrar` })
  }
  db.prepare('DELETE FROM propiedades WHERE id = ?').run(req.params.id)
  res.status(204).end()
})
