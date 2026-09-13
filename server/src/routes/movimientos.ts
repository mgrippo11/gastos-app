import { Router } from 'express'
import { db } from '../db.js'
import { rowToMovimiento, type MovimientoInput, type MovimientoRow } from '../types.js'

export const movimientosRouter = Router()

movimientosRouter.get('/', async (_req, res) => {
  const result = await db.execute('SELECT * FROM movimientos ORDER BY fecha DESC, id DESC')
  const rows = result.rows as unknown as MovimientoRow[]
  res.json(rows.map(rowToMovimiento))
})

movimientosRouter.post('/', async (req, res) => {
  const input = req.body as MovimientoInput
  const result = await db.execute({
    sql: 'INSERT INTO movimientos (gasto, propiedad_id, tipo, monto, fecha, moneda, medio_pago) VALUES (?, ?, ?, ?, ?, ?, ?)',
    args: [input.gasto, input.propiedadId, input.tipo, input.monto, input.fecha, input.moneda, input.medioPago],
  })

  const selected = await db.execute({
    sql: 'SELECT * FROM movimientos WHERE id = ?',
    args: [Number(result.lastInsertRowid)],
  })
  res.status(201).json(rowToMovimiento(selected.rows[0] as unknown as MovimientoRow))
})

movimientosRouter.put('/:id', async (req, res) => {
  // req.params.id llega como string; Turso remoto (a diferencia del archivo
  // local) no aplica la afinidad de tipo de la columna al bindear params, así
  // que un '7' de texto no matchea el id 7 (INTEGER) — hay que castear.
  const id = Number(req.params.id)
  const input = req.body as MovimientoInput
  await db.execute({
    sql: 'UPDATE movimientos SET gasto = ?, propiedad_id = ?, tipo = ?, monto = ?, fecha = ?, moneda = ?, medio_pago = ? WHERE id = ?',
    args: [input.gasto, input.propiedadId, input.tipo, input.monto, input.fecha, input.moneda, input.medioPago, id],
  })

  const selected = await db.execute({ sql: 'SELECT * FROM movimientos WHERE id = ?', args: [id] })
  const row = selected.rows[0] as unknown as MovimientoRow | undefined
  if (!row) return res.status(404).end()
  res.json(rowToMovimiento(row))
})

movimientosRouter.delete('/:id', async (req, res) => {
  await db.execute({ sql: 'DELETE FROM movimientos WHERE id = ?', args: [Number(req.params.id)] })
  res.status(204).end()
})
