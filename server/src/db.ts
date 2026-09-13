import { createClient } from '@libsql/client'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// En prod (Vercel), TURSO_DATABASE_URL/TURSO_AUTH_TOKEN apuntan a la DB
// hosteada (funciones serverless no tienen disco persistente). En dev local
// no hace falta cuenta ni conexión: cae a un archivo SQLite local, mismo
// wire protocol (libSQL es superset de SQLite) — ver CLAUDE.md.
const dbPath = path.join(__dirname, '..', 'data', 'gastos.db')

export const db = process.env.TURSO_DATABASE_URL
  ? createClient({ url: process.env.TURSO_DATABASE_URL, authToken: process.env.TURSO_AUTH_TOKEN })
  : createClient({ url: `file:${dbPath}` })

async function migrate() {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS propiedades (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL UNIQUE
    )
  `)

  await db.execute(`
    CREATE TABLE IF NOT EXISTS movimientos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      gasto TEXT NOT NULL,
      propiedad_id INTEGER NOT NULL REFERENCES propiedades(id),
      tipo TEXT NOT NULL CHECK (tipo IN ('ingreso', 'pago')),
      monto REAL NOT NULL,
      fecha TEXT NOT NULL,
      moneda TEXT NOT NULL DEFAULT 'ARS' CHECK (moneda IN ('ARS', 'USD')),
      medio_pago TEXT NOT NULL DEFAULT 'cuenta' CHECK (medio_pago IN ('efectivo', 'cuenta'))
    )
  `)

  // Migración para DBs creadas antes de agregar la columna moneda (movimientos
  // históricos: todo en Pesos, ver CLAUDE.md).
  const info = await db.execute(`PRAGMA table_info(movimientos)`)
  const tieneColumnaMoneda = info.rows.some((col) => col.name === 'moneda')
  if (!tieneColumnaMoneda) {
    await db.execute(
      `ALTER TABLE movimientos ADD COLUMN moneda TEXT NOT NULL DEFAULT 'ARS' CHECK (moneda IN ('ARS', 'USD'))`,
    )
  }

  // Migración para DBs creadas antes de agregar medio_pago — movimientos
  // históricos quedan todos como "cuenta" (default pedido).
  const tieneColumnaMedioPago = info.rows.some((col) => col.name === 'medio_pago')
  if (!tieneColumnaMedioPago) {
    await db.execute(
      `ALTER TABLE movimientos ADD COLUMN medio_pago TEXT NOT NULL DEFAULT 'cuenta' CHECK (medio_pago IN ('efectivo', 'cuenta'))`,
    )
  }

  // Catálogo inicial según la planilla de origen. "Generales" es la categoría
  // comodín para gastos no asociados a una propiedad específica.
  const PROPIEDADES_INICIALES = [
    'Generales',
    'Timbo',
    'Rivadavia',
    'Independencia',
    'Yapeyu',
    'Mar del Plata',
  ]
  for (const nombre of PROPIEDADES_INICIALES) {
    await db.execute({ sql: 'INSERT OR IGNORE INTO propiedades (nombre) VALUES (?)', args: [nombre] })
  }
}

// Se importa una sola vez al arrancar (index.ts / la Vercel function esperan
// esta promesa antes de aceptar requests).
export const dbReady = migrate()
