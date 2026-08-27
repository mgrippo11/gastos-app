import Database from 'better-sqlite3'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Un solo archivo SQLite en server/data/gastos.db. Sin servicios externos:
// alcanza para uso local / de una sola familia (ver CLAUDE.md, decisión de stack).
const dbPath = path.join(__dirname, '..', 'data', 'gastos.db')

export const db = new Database(dbPath)
db.pragma('journal_mode = WAL')

db.exec(`
  CREATE TABLE IF NOT EXISTS propiedades (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL UNIQUE
  );

  CREATE TABLE IF NOT EXISTS movimientos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    gasto TEXT NOT NULL,
    propiedad_id INTEGER NOT NULL REFERENCES propiedades(id),
    tipo TEXT NOT NULL CHECK (tipo IN ('ingreso', 'pago')),
    monto REAL NOT NULL,
    fecha TEXT NOT NULL,
    moneda TEXT NOT NULL DEFAULT 'ARS' CHECK (moneda IN ('ARS', 'USD'))
  );
`)

// Migración para DBs creadas antes de agregar la columna moneda (movimientos
// históricos: todo en Pesos, ver CLAUDE.md).
const tieneColumnaMoneda = (db.pragma('table_info(movimientos)') as { name: string }[]).some(
  (col) => col.name === 'moneda',
)
if (!tieneColumnaMoneda) {
  db.exec(
    `ALTER TABLE movimientos ADD COLUMN moneda TEXT NOT NULL DEFAULT 'ARS' CHECK (moneda IN ('ARS', 'USD'))`,
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

const seedPropiedad = db.prepare('INSERT OR IGNORE INTO propiedades (nombre) VALUES (?)')
for (const nombre of PROPIEDADES_INICIALES) {
  seedPropiedad.run(nombre)
}
