// Dark mode manual (clase .dark en <html>), con persistencia en localStorage
// y fallback a la preferencia del sistema si el usuario nunca lo tocó.
const STORAGE_KEY = 'theme'

export type Theme = 'light' | 'dark'

export function getInitialTheme(): Theme {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved === 'light' || saved === 'dark') return saved
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark')
  localStorage.setItem(STORAGE_KEY, theme)
}
