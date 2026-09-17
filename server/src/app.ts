import express, { type ErrorRequestHandler } from 'express'
import { movimientosRouter } from './routes/movimientos.js'
import { propiedadesRouter } from './routes/propiedades.js'

// App sin .listen(): la usan tanto el entrypoint local (index.ts) como la
// Vercel Function en /api/index.ts.
export const app = express()
// Sin CORS a propósito: client y server viven bajo el mismo dominio (dev:
// proxy de Vite; prod: mismo dominio de Vercel, ver vercel.json), así que el
// browser nunca hace un fetch cross-origin. Habilitar cors() acá no agrega
// nada funcional y sí amplía la superficie de ataque de una API sin auth.
app.use(express.json())

app.use('/api/movimientos', movimientosRouter)
app.use('/api/propiedades', propiedadesRouter)

// Sin esto, un error no manejado (DB, body inesperado, etc.) cae en el
// handler por defecto de Express: devuelve HTML en vez del { error } que
// espera client/src/lib/api.ts, y puede incluir el stack trace en la
// respuesta. Loguea el error real server-side, nunca lo expone al cliente.
const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  console.error(err)
  // express.json() marca los JSON malformados con status 400 (SyntaxError) —
  // respetarlo evita reportar un problema del cliente como error del servidor.
  const status = (err as { status?: number; statusCode?: number }).status ?? (err as { statusCode?: number }).statusCode ?? 500
  res.status(status).json({ error: 'Error interno del servidor' })
}
app.use(errorHandler)
