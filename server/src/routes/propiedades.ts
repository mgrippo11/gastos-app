import { Router } from 'express'
import { db } from '../db.js'
import type { Propiedad } from '../types.js'

export const propiedadesRouter = Router()

// Categoría comodín que el resto del código asume que existe (ver CLAUDE.md) — no se puede renombrar ni borrar.
const NOMBRE_PROTEGIDO = 'Generales'

function esConstraintUnique(err: unknown): boolean {
  return err instanceof Error && err.message.includes('UNIQUE constraint failed')
}

propiedadesRouter.get('/', async (_req, res) => {
  const result = await db.execute('SELECT id, nombre FROM propiedades ORDER BY nombre')
  res.json(result.rows as unknown as Propiedad[])
})

propiedadesRouter.post('/', async (req, res) => {
  const nombre = (req.body as { nombre?: string }).nombre?.trim()
  if (!nombre) return res.status(400).json({ error: 'El nombre es obligatorio' })
  try {
    const result = await db.execute({ sql: 'INSERT INTO propiedades (nombre) VALUES (?)', args: [nombre] })
    res.status(201).json({ id: Number(result.lastInsertRowid), nombre })
  } catch (err) {
    if (esConstraintUnique(err)) return res.status(409).json({ error: 'Ya existe una propiedad con ese nombre' })
    throw err
  }
})

propiedadesRouter.put('/:id', async (req, res) => {
  // req.params.id llega como string; Turso remoto (a diferencia del archivo
  // local) no aplica la afinidad de tipo de la columna al bindear params, así
  // que un '7' de texto no matchea el id 7 (INTEGER) — hay que castear.
  const id = Number(req.params.id)
  const nombre = (req.body as { nombre?: string }).nombre?.trim()
  if (!nombre) return res.status(400).json({ error: 'El nombre es obligatorio' })
  const selected = await db.execute({ sql: 'SELECT * FROM propiedades WHERE id = ?', args: [id] })
  const actual = selected.rows[0] as unknown as Propiedad | undefined
  if (!actual) return res.status(404).end()
  if (actual.nombre === NOMBRE_PROTEGIDO) {
    return res.status(400).json({ error: `"${NOMBRE_PROTEGIDO}" no se puede renombrar` })
  }
  try {
    await db.execute({ sql: 'UPDATE propiedades SET nombre = ? WHERE id = ?', args: [nombre, id] })
    res.json({ id, nombre })
  } catch (err) {
    if (esConstraintUnique(err)) return res.status(409).json({ error: 'Ya existe una propiedad con ese nombre' })
    throw err
  }
})

propiedadesRouter.delete('/:id', async (req, res) => {
  const id = Number(req.params.id)
  const selected = await db.execute({ sql: 'SELECT * FROM propiedades WHERE id = ?', args: [id] })
  const actual = selected.rows[0] as unknown as Propiedad | undefined
  if (!actual) return res.status(404).end()
  if (actual.nombre === NOMBRE_PROTEGIDO) {
    return res.status(400).json({ error: `"${NOMBRE_PROTEGIDO}" no se puede borrar` })
  }
  const conteo = await db.execute({
    sql: 'SELECT COUNT(*) as count FROM movimientos WHERE propiedad_id = ?',
    args: [id],
  })
  const count = Number((conteo.rows[0] as unknown as { count: number | bigint }).count)
  if (count > 0) {
    return res.status(409).json({ error: `Tiene ${count} movimiento(s) asociado(s), no se puede borrar` })
  }
  await db.execute({ sql: 'DELETE FROM propiedades WHERE id = ?', args: [id] })
  res.status(204).end()
})
