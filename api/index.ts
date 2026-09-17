import type { IncomingMessage, ServerResponse } from 'node:http'
import { app } from '../server/src/app.js'
import { dbReady } from '../server/src/db.js'

// Vercel Function: reusa la misma app Express que el entrypoint local
// (server/src/index.ts), sin .listen(). `dbReady` corre la migración una
// sola vez por cold start; en requests siguientes la promesa ya está resuelta.
//
// Nombre fijo (no [...path].ts): las funciones catch-all fuera de un
// framework como Next.js no matchean rutas anidadas de forma confiable en
// Vercel (ej. /api/propiedades/7 -> 404). En vez de depender de esa
// convención, vercel.json reescribe /api/:path* -> /api ; req.url adentro
// de la función sigue siendo la ruta original, así que Express rutea igual.
export default async function handler(req: IncomingMessage, res: ServerResponse) {
  await dbReady()
  app(req, res)
}
