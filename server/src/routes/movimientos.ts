import { Router } from 'express'
import { db } from '../db.js'
import { rowToMovimiento, type MovimientoInput, type MovimientoRow } from '../types.js'

export const movimientosRouter = Router()

// Solo la UI llama a esta API hoy, pero no hay auth de ningún tipo — sin esto
// un tipo/moneda/medioPago fuera del enum revienta el CHECK de la DB y sale
// como 500 genérico en vez de un 400 con el campo que está mal.
function errorDeValidacion(input: MovimientoInput): string | null {
  if (!input.gasto?.trim()) return 'Gasto es obligatorio'
  if (!Number.isInteger(input.propiedadId)) return 'Propiedad inválida'
  if (input.tipo !== 'ingreso' && input.tipo !== 'pago') return 'Tipo inválido'
  if (typeof input.monto !== 'number' || !(input.monto > 0)) return 'Monto debe ser un número positivo'
  if (!input.fecha) return 'Fecha es obligatoria'
  if (input.moneda !== 'ARS' && input.moneda !== 'USD') return 'Moneda inválida'
  if (input.medioPago !== undefined && input.medioPago !== 'efectivo' && input.medioPago !== 'cuenta') {
    return 'Medio de pago inválido'
  }
  return null
}

movimientosRouter.get('/', async (_req, res) => {
  const result = await db.execute('SELECT * FROM movimientos ORDER BY fecha DESC, id DESC')
  const rows = result.rows as unknown as MovimientoRow[]
  res.json(rows.map(rowToMovimiento))
})

movimientosRouter.post('/', async (req, res) => {
  const input = req.body as MovimientoInput
  const error = errorDeValidacion(input)
  if (error) return res.status(400).json({ error })

  const result = await db.execute({
    sql: 'INSERT INTO movimientos (gasto, propiedad_id, tipo, monto, fecha, moneda, medio_pago) VALUES (?, ?, ?, ?, ?, ?, ?)',
    args: [input.gasto, input.propiedadId, input.tipo, input.monto, input.fecha, input.moneda, input.medioPago ?? 'cuenta'],
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
  const error = errorDeValidacion(input)
  if (error) return res.status(400).json({ error })

  await db.execute({
    sql: 'UPDATE movimientos SET gasto = ?, propiedad_id = ?, tipo = ?, monto = ?, fecha = ?, moneda = ?, medio_pago = ? WHERE id = ?',
    args: [input.gasto, input.propiedadId, input.tipo, input.monto, input.fecha, input.moneda, input.medioPago ?? 'cuenta', id],
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
