# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Descripción del proyecto

App de gestión de gastos e ingresos para varias propiedades (alquileres, expensas, servicios, etc.). Reemplaza una planilla de Excel/Google Sheets que se lleva manualmente hoy. La app debe permitir cargar movimientos, filtrarlos, y ver totales por propiedad, tipo y período.

## Stack

npm workspaces monorepo, dos paquetes:

- **client/** — React 19 + Vite + TypeScript + Tailwind CSS v4 (vía `@tailwindcss/vite`), Recharts para gráficos, react-router-dom para ruteo entre páginas.
- **server/** — Express 5 + TypeScript, SQLite vía `@libsql/client` (libSQL: superset compatible de SQLite, mismo SQL).
- **api/** — un único archivo (`[...path].ts`) que reexporta la app Express de `server/src/app.ts` como Vercel Function, para el deploy en producción.
- **Tests**: Vitest en ambos paquetes.
- **Lint**: `oxlint` (solo configurado en client por ahora).

Dev local: `@libsql/client` apunta a un archivo (`server/data/gastos.db`, gitignorado) — cero servicios externos, cero cuenta necesaria para desarrollar. Producción (Vercel): las funciones serverless no tienen disco persistente, así que ahí el mismo cliente apunta a una DB hosteada en Turso vía `TURSO_DATABASE_URL`/`TURSO_AUTH_TOKEN` (ver [server/src/db.ts](server/src/db.ts) y sección "Deploy" más abajo). Antes de esto el proyecto usaba `better-sqlite3` (archivo únicamente, sin esta rama); se migró a libSQL específicamente para poder desplegar en Vercel sin cambiar de motor de DB.

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

Dos procesos separados en dev (client en :5173 vía Vite, server en :3001 vía Express), unidos por el proxy `/api` definido en [client/vite.config.ts](client/vite.config.ts). En producción (Vercel), client y server se despliegan juntos bajo el mismo dominio: `client/dist` como estático + `api/[...path].ts` como Vercel Function — ver "Deploy" más abajo.

**Server: app.ts vs index.ts** — [server/src/app.ts](server/src/app.ts) arma la app Express (middlewares + routers) sin llamar `.listen()`; la reusan tanto [server/src/index.ts](server/src/index.ts) (entrypoint local: `await dbReady` + `.listen()`) como [api/[...path].ts](api/[...path].ts) (entrypoint Vercel: `await dbReady` + delega el request/response a `app`). Si se agrega un router o middleware nuevo, va en `app.ts`, no en `index.ts`.

**Flujo de datos**: libSQL (`@libsql/client`, ver Stack) en [server/src/db.ts](server/src/db.ts) → routers Express en `server/src/routes/` → JSON sobre `/api/*` → `client/src/lib/api.ts` (wrapper fetch) → componentes de página en `client/src/pages/`.

**Tipos duplicados a propósito**: `client/src/types.ts` y `server/src/types.ts` definen el mismo modelo (`Movimiento`, `Propiedad`, `TipoMovimiento`) porque no hay paquete compartido en el monorepo todavía. Al cambiar el modelo de datos, actualizar los dos archivos. El server además tiene `MovimientoRow` + `rowToMovimiento()` en [server/src/types.ts](server/src/types.ts) para mapear entre snake_case (columnas SQLite) y camelCase (API/cliente) — este mapeo es el único lugar que debería tocar ese boundary.

**Cálculos de totales**: viven en funciones puras en [client/src/lib/totals.ts](client/src/lib/totals.ts) (`resumenPorPropiedad`, `resumenMensual`, `balanceGeneral`), testeadas en `totals.test.ts`, separadas de los componentes de UI. Cada resumen viene desglosado por moneda (nunca se suma ARS + USD en un mismo total) — quien lo consume elige una moneda antes de graficar/mostrar (ver `DashboardPage`). Cualquier resumen/reporte nuevo debería agregarse ahí, no reimplementarse dentro de un componente.

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

- **Monto**: guardar en DB como número (`REAL`), formatear a `$ 1.234.567,89` / `US$ 1.234,56` (según `moneda`, formato argentino) solo en la UI. Ver [client/src/lib/format.ts](client/src/lib/format.ts) (`formatCurrency(monto, moneda)`).
- **Fechas**: guardar en formato ISO (`yyyy-mm-dd`) en DB y en la API; mostrar en UI como `d/m/yyyy`. Ver `formatDateARS` / `parseDateARS` en el mismo archivo.
- **Tipo**: enum estricto `'ingreso' | 'pago'` de punta a punta (DB, API, tipos TS) — nunca texto libre.
- **Moneda**: enum estricto `'ARS' | 'USD'`, mismo criterio que Tipo. Los resúmenes de `totals.ts` nunca suman montos de monedas distintas — ver esa sección más abajo.

## Funcionalidades

**MVP**:
1. ✅ Alta/edición/borrado de movimiento — modal [MovimientoFormModal](client/src/components/MovimientoFormModal.tsx) en `MovimientosPage`.
2. ✅ Listado filtrable por Propiedad, Tipo, Moneda y rango de fechas — vía `filtrarMovimientos()`.
3. ✅ Resumen por propiedad — `DashboardPage`, gráfico de barras (ingresos/pagos).
4. ✅ Resumen mensual — `DashboardPage`, gráfico de línea (balance).
5. ✅ ABM de propiedades — [PropiedadesPage](client/src/pages/PropiedadesPage.tsx) (alta/edición inline/borrado; "Generales" protegida, borrado bloqueado si tiene movimientos asociados).
6. ✅ Multi-moneda (ARS/USD) por movimiento, resúmenes desglosados por moneda.
7. Importación desde Excel/CSV del histórico — pendiente.

**Diseño**: tokens semánticos (`background`, `primary`, `success`/`danger`, etc.) vía `@theme inline` de Tailwind v4 en [client/src/index.css](client/src/index.css), con dark mode manual (clase `.dark`, toggle persistido — ver [client/src/lib/theme.ts](client/src/lib/theme.ts)). Componentes reusables en `client/src/components/`: `Card`, `Button`, `Badge`, `FiltrosBar` — revisarlos antes de escribir markup nuevo.

**A futuro** (no MVP, pero tener en mente al tocar el modelo de datos):
- Gastos recurrentes automáticos (generar "Alquiler" de cada propiedad todos los meses sin cargarlo a mano).
- Alertas de pagos pendientes o vencidos.
- Exportar reportes a PDF/Excel.
- Multi-usuario / permisos si más de una persona carga datos (hoy no hay auth de ningún tipo).

## Deploy

Producción en Vercel, un solo proyecto para client + server (ver `vercel.json` en la raíz):

- **Build**: `npm run build -w client`, sirve `client/dist` como estático.
- **API**: [api/[...path].ts](api/[...path].ts) — Vercel Function catch-all que reexporta la app Express (ver "Server: app.ts vs index.ts" arriba). Mismo dominio que el client, sin CORS ni proxy que configurar.
- **Rutas SPA**: rewrite `/(.*) → /index.html` en `vercel.json`, así `BrowserRouter` funciona en deep-links/refresh sin truco de 404.html.
- **DB en producción**: Turso (libSQL hosteado) — variables de entorno `TURSO_DATABASE_URL` y `TURSO_AUTH_TOKEN` configuradas en el proyecto de Vercel (no en el repo). Sin esas variables, `db.ts` cae al archivo local (ver Stack) — por eso dev no necesita cuenta de Turso.
- Cada push a `main` dispara un deploy automático (Vercel conectado al repo de GitHub).

## Cómo trabajar en este repo

- Antes de generar componentes de UI, revisar si ya existe uno reutilizable en `client/src/components/` (`Card`, `Button`, `Badge`, `FiltrosBar`, `MovimientoFormModal`) en vez de duplicar código.
- Los cálculos de totales deben vivir en funciones puras testeables en `client/src/lib/totals.ts`, no mezclados en componentes.
- Si se agrega una librería nueva, dejar registro en la sección "Stack" de este archivo.
- Correr `npm test` antes de dar por terminada una tarea.
- Los scripts de instalación de paquetes nativos (`esbuild`) requieren aprobación explícita en este entorno (`npm approve-scripts`) — ver el warning de npm si un `npm install` nuevo se queda pendiente.
