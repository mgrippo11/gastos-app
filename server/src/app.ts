import cors from 'cors'
import express from 'express'
import { movimientosRouter } from './routes/movimientos.js'
import { propiedadesRouter } from './routes/propiedades.js'

// App sin .listen(): la usan tanto el entrypoint local (index.ts) como la
// Vercel Function en /api/index.ts.
export const app = express()
app.use(cors())
app.use(express.json())

app.use('/api/movimientos', movimientosRouter)
app.use('/api/propiedades', propiedadesRouter)
