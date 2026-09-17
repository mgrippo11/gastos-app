import { app } from './app.js'
import { dbReady } from './db.js'

// Entrypoint local/self-hosted (npm run dev, npm start). En Vercel se usa
// /api/index.ts en su lugar, que reexporta `app` sin .listen().
await dbReady()

const PORT = process.env.PORT ?? 3001
app.listen(PORT, () => {
  console.log(`API escuchando en http://localhost:${PORT}`)
})
