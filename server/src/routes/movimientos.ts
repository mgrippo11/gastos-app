import { Router } from 'express'
import { db } from '../db.js'
import { rowToMovimiento, type MovimientoInput, type MovimientoRow } from '../types.js'

export const movimientosRouter = Router()

movimientosRouter.get('/', (_req, res) => {
  const rows = db
    .prepare('SELECT * FROM movimientos ORDER BY fecha DESC, id DESC')
    .all() as MovimientoRow[]
  res.json(rows.map(rowToMovimiento))
})

movimientosRouter.post('/', (req, res) => {
  const input = req.body as MovimientoInput
  const result = db
    .prepare(
      'INSERT INTO movimientos (gasto, propiedad_id, tipo, monto, fecha, moneda) VALUES (?, ?, ?, ?, ?, ?)',
    )
    .run(input.gasto, input.propiedadId, input.tipo, input.monto, input.fecha, input.moneda)

  const row = db
    .prepare('SELECT * FROM movimientos WHERE id = ?')
    .get(result.lastInsertRowid) as MovimientoRow
  res.status(201).json(rowToMovimiento(row))
})

movimientosRouter.put('/:id', (req, res) => {
  const input = req.body as MovimientoInput
  db.prepare(
    'UPDATE movimientos SET gasto = ?, propiedad_id = ?, tipo = ?, monto = ?, fecha = ?, moneda = ? WHERE id = ?',
  ).run(input.gasto, input.propiedadId, input.tipo, input.monto, input.fecha, input.moneda, req.params.id)

  const row = db
    .prepare('SELECT * FROM movimientos WHERE id = ?')
    .get(req.params.id) as MovimientoRow | undefined
  if (!row) return res.status(404).end()
  res.json(rowToMovimiento(row))
})

movimientosRouter.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM movimientos WHERE id = ?').run(req.params.id)
  res.status(204).end()
})
