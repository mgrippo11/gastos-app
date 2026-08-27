import { useState } from 'react'
import { NavLink, Navigate, Route, Routes } from 'react-router-dom'
import { DashboardPage } from './pages/DashboardPage'
import { MovimientosPage } from './pages/MovimientosPage'
import { PropiedadesPage } from './pages/PropiedadesPage'
import { applyTheme, getInitialTheme, type Theme } from './lib/theme'

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
    isActive ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'
  }`

export default function App() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme)

  function toggleTheme() {
    const next = theme === 'dark' ? 'light' : 'dark'
    applyTheme(next)
    setTheme(next)
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <nav className="border-b border-border px-4 py-3 flex flex-wrap items-center justify-between gap-y-2 max-w-5xl mx-auto">
        <div className="flex flex-wrap items-center gap-2 sm:gap-4">
          <span className="font-semibold">Gastos</span>
          <NavLink to="/movimientos" className={linkClass}>
            Movimientos
          </NavLink>
          <NavLink to="/dashboard" className={linkClass}>
            Dashboard
          </NavLink>
          <NavLink to="/propiedades" className={linkClass}>
            Propiedades
          </NavLink>
        </div>
        <button
          onClick={toggleTheme}
          aria-label="Cambiar tema"
          className="text-muted-foreground hover:text-foreground hover:bg-muted rounded-md px-2 py-1.5 text-sm"
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
      </nav>
      <div className="max-w-5xl mx-auto">
        <Routes>
          <Route path="/" element={<Navigate to="/movimientos" replace />} />
          <Route path="/movimientos" element={<MovimientosPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/propiedades" element={<PropiedadesPage />} />
        </Routes>
      </div>
    </div>
  )
}
