import type { Movimiento, MovimientoInput, Propiedad } from '../types'

// Wrapper mínimo sobre fetch. En dev, Vite proxea /api -> http://localhost:3001
// (ver vite.config.ts). En prod, el server sirve el build de client/dist.

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) {
    // El server manda { error: string } en los 4xx esperables (nombre duplicado,
    // "Generales" protegida, propiedad con movimientos); se usa como mensaje si está.
    const body = await res.json().catch(() => null)
    throw new Error(body?.error ?? `API ${path} -> ${res.status}`)
  }
  // 204 No Content (DELETE) no trae body — .json() rompería sobre string vacío.
  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

export const api = {
  getMovimientos: () => request<Movimiento[]>('/movimientos'),
  createMovimiento: (input: MovimientoInput) =>
    request<Movimiento>('/movimientos', { method: 'POST', body: JSON.stringify(input) }),
  updateMovimiento: (id: number, input: MovimientoInput) =>
    request<Movimiento>(`/movimientos/${id}`, { method: 'PUT', body: JSON.stringify(input) }),
  deleteMovimiento: (id: number) =>
    request<void>(`/movimientos/${id}`, { method: 'DELETE' }),
  getPropiedades: () => request<Propiedad[]>('/propiedades'),
  createPropiedad: (nombre: string) =>
    request<Propiedad>('/propiedades', { method: 'POST', body: JSON.stringify({ nombre }) }),
  updatePropiedad: (id: number, nombre: string) =>
    request<Propiedad>(`/propiedades/${id}`, { method: 'PUT', body: JSON.stringify({ nombre }) }),
  deletePropiedad: (id: number) => request<void>(`/propiedades/${id}`, { method: 'DELETE' }),
}
