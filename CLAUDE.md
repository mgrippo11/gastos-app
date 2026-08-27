# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Descripción del proyecto

App de gestión de gastos e ingresos para varias propiedades (alquileres, expensas, servicios, etc.). Reemplaza una planilla de Excel/Google Sheets que se lleva manualmente hoy. La app debe permitir cargar movimientos, filtrarlos, y ver totales por propiedad, tipo y período.

## Stack

npm workspaces monorepo, dos paquetes:

- **client/** — React 19 + Vite + TypeScript + Tailwind CSS v4 (vía `@tailwindcss/vite`), Recharts para gráficos, react-router-dom para ruteo entre páginas.
- **server/** — Express 5 + TypeScript, SQLite vía `better-sqlite3` (un solo archivo, sin servicios externos).
- **Tests**: Vitest en ambos paquetes.
- **Lint**: `oxlint` (solo configurado en client por ahora).

Elegido así porque es un proyecto de uso local/familiar: SQLite en archivo evita depender de una cuenta de Supabase/Postgres hosteado. Si el proyecto crece a multi-usuario remoto, revisar esta decisión.

## Comandos

Todos corren desde la raíz del repo (usa `npm run <script> -w <workspace>` por debajo):

```bash
npm run dev          # server (puerto 3001) + client (puerto 5173) en paralelo, con proxy /api -> server
npm run dev:server    # solo server (tsx watch, recarga en caliente)
npm run dev:client    # solo client (vite)
npm run build          # build de producción de ambos (server primero)
npm test                # test suite completa (server, luego client)
npm run lint             # oxlint sobre client
```

Para un solo workspace: `npm run test -w client`, `npm run test -w server`, etc.

**Correr un solo archivo de test**: `npm run test -w client -- src/lib/totals.test.ts` (o el `-w server` equivalente). Vitest también soporta `--watch` para modo interactivo.

No hay CI configurado todavía — correr `npm test` (y `npm run lint`) manualmente antes de dar por terminada una tarea, como indica la sección "Cómo trabajar en este repo" más abajo.

## Arquitectura

Dos procesos separados en dev (client en :5173 vía Vite, server en :3001 vía Express), unidos por el proxy `/api` definido en [client/vite.config.ts](client/vite.config.ts). En producción, sería el server el que sirve el build estático de `client/dist` (no implementado todavía — hoy solo corren por separado).

**Flujo de datos**: SQLite (`server/data/gastos.db`, gitignorado) → `better-sqlite3` en [server/src/db.ts](server/src/db.ts) → routers Express en `server/src/routes/` → JSON sobre `/api/*` → `client/src/lib/api.ts` (wrapper fetch) → componentes de página en `client/src/pages/`.

**Tipos duplicados a propósito**: `client/src/types.ts` y `server/src/types.ts` definen el mismo modelo (`Movimiento`, `Propiedad`, `TipoMovimiento`) porque no hay paquete compartido en el monorepo todavía. Al cambiar el modelo de datos, actualizar los dos archivos. El server además tiene `MovimientoRow` + `rowToMovimiento()` en [server/src/types.ts](server/src/types.ts) para mapear entre snake_case (columnas SQLite) y camelCase (API/cliente) — este mapeo es el único lugar que debería tocar ese boundary.

**Cálculos de totales**: viven en funciones puras en [client/src/lib/totals.ts](client/src/lib/totals.ts) (`resumenPorPropiedad`, `resumenMensual`, `balanceGeneral`), testeadas en `totals.test.ts`, separadas de los componentes de UI. Cualquier resumen/reporte nuevo debería agregarse ahí, no reimplementarse dentro de un componente.

**Filtro de movimientos**: `filtrarMovimientos()` en [client/src/lib/filtros.ts](client/src/lib/filtros.ts) es la única implementación del filtro por propiedad/tipo/rango de fechas; la usan tanto `MovimientosPage` (los tres filtros) como `DashboardPage` (solo rango de fechas). No reimplementar el filtrado dentro de un componente.

**Ruteo**: `BrowserRouter` en [client/src/main.tsx](client/src/main.tsx), rutas declaradas en [client/src/App.tsx](client/src/App.tsx) (`/movimientos`, `/dashboard`, `/` redirige a `/movimientos`).

**Catálogo de propiedades**: modelado como tabla (`propiedades`) en vez de texto libre, sembrada en [server/src/db.ts](server/src/db.ts) con los valores conocidos de la planilla original (Generales, Timbo, Rivadavia, Independencia, Yapeyu, Mar del Plata). "Generales" es la categoría comodín para gastos no asociados a una propiedad específica. Agregar una propiedad nueva es una fila en la tabla, no un cambio de código.

## Modelo de datos (origen: planilla Excel/Sheets)

La planilla que esta app reemplaza tenía una fila por movimiento:

| Columna | Campo     | Tipo                | Notas                                                                    |
|---------|-----------|---------------------|---------------------------------------------------------------------------|
| A       | Gasto     | texto               | Concepto o descripción del movimiento (ej. "Alquiler", "ABL-2206")        |
| B       | Propiedad | texto (categoría)   | Generales, Timbo, Rivadavia, Independencia, Yapeyu, Mar del Plata          |
| C       | Tipo      | enum: Ingreso / Pago| Ingreso = dinero que entra, Pago = dinero que sale                        |
| D       | Monto     | moneda (ARS)        | Formato argentino: "$ 38.800.000,00" (punto = miles, coma = decimales)     |
| E       | Fecha     | fecha               | Formato d/m/yyyy (ej. 1/1/2026, 11/5/2026)                                 |

Notas sobre los datos reales:
- Gastos recurrentes mensuales por propiedad: Alquiler (ingreso), Expensas, ABL, Gas.
- Pagos recurrentes a personas fijas: Vic, Fer, Martin — sueldos o pagos a proveedores, mismo monto cada mes.
- El balance general es `suma(Ingreso) - suma(Pago)` — ver `balanceGeneral()` en `totals.ts`.

## Convenciones de formato

- **Moneda**: guardar en DB como número (`REAL` en SQLite), formatear a `$ 1.234.567,89` (formato argentino) solo en la UI. Ver [client/src/lib/format.ts](client/src/lib/format.ts) (`formatCurrencyARS`).
- **Fechas**: guardar en formato ISO (`yyyy-mm-dd`) en DB y en la API; mostrar en UI como `d/m/yyyy`. Ver `formatDateARS` / `parseDateARS` en el mismo archivo.
- **Tipo**: enum estricto `'ingreso' | 'pago'` de punta a punta (DB, API, tipos TS) — nunca texto libre.

## Funcionalidades

**MVP**:
1. ✅ Alta/edición/borrado de movimiento — modal [MovimientoFormModal](client/src/components/MovimientoFormModal.tsx) en `MovimientosPage`.
2. ✅ Listado filtrable por Propiedad, Tipo y rango de fechas — vía `filtrarMovimientos()`.
3. ✅ Resumen por propiedad — `DashboardPage`, gráfico de barras (ingresos/pagos).
4. ✅ Resumen mensual — `DashboardPage`, gráfico de línea (balance).
5. Importación desde Excel/CSV del histórico — pendiente.

**A futuro** (no MVP, pero tener en mente al tocar el modelo de datos):
- Gastos recurrentes automáticos (generar "Alquiler" de cada propiedad todos los meses sin cargarlo a mano).
- Alertas de pagos pendientes o vencidos.
- Exportar reportes a PDF/Excel.
- Multi-usuario / permisos si más de una persona carga datos (hoy no hay auth de ningún tipo).

## Cómo trabajar en este repo

- Antes de generar componentes de UI, revisar si ya existe uno reutilizable (tabla de movimientos, formulario, tarjeta de resumen) en `client/src/components/` en vez de duplicar código.
- Los cálculos de totales deben vivir en funciones puras testeables en `client/src/lib/totals.ts`, no mezclados en componentes.
- Si se agrega una librería nueva, dejar registro en la sección "Stack" de este archivo.
- Correr `npm test` antes de dar por terminada una tarea.
- Los scripts de instalación de paquetes nativos (`better-sqlite3`, `esbuild`) requieren aprobación explícita en este entorno (`npm approve-scripts`) — ver el warning de npm si un `npm install` nuevo se queda pendiente.
