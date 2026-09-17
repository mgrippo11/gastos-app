import cors from 'cors'
import express, { type ErrorRequestHandler } from 'express'
import { movimientosRouter } from './routes/movimientos.js'
import { propiedadesRouter } from './routes/propiedades.js'

// App sin .listen(): la usan tanto el entrypoint local (index.ts) como la
// Vercel Function en /api/index.ts.
export const app = express()
app.use(cors())
app.use(express.json())

app.use('/api/movimientos', movimientosRouter)
app.use('/api/propiedades', propiedadesRouter)

// Sin esto, un error no manejado (DB, body inesperado, etc.) cae en el
// handler por defecto de Express: devuelve HTML en vez del { error } que
// espera client/src/lib/api.ts, y puede incluir el stack trace en la
// respuesta. Loguea el error real server-side, nunca lo expone al cliente.
const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  console.error(err)
  res.status(500).json({ error: 'Error interno del servidor' })
}
app.use(errorHandler)
