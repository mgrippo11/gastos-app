import cors from 'cors'
import express from 'express'
import './db.js' // corre migraciones/seed al importar
import { movimientosRouter } from './routes/movimientos.js'
import { propiedadesRouter } from './routes/propiedades.js'

const app = express()
app.use(cors())
app.use(express.json())

app.use('/api/movimientos', movimientosRouter)
app.use('/api/propiedades', propiedadesRouter)

const PORT = process.env.PORT ?? 3001
app.listen(PORT, () => {
  console.log(`API escuchando en http://localhost:${PORT}`)
})
