import { useEffect, useState } from 'react'

const read = () => {
  try { return localStorage.getItem('pg_theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') } catch { return 'light' }
}

export default function ThemeToggle({ className = 'theme-btn' }) {
  const [theme, setTheme] = useState(read)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    try { localStorage.setItem('pg_theme', theme) } catch { return }
  }, [theme])

  const dark = theme === 'dark'
  return (
    <button type="button" className={className} onClick={() => setTheme(dark ? 'light' : 'dark')} aria-label={dark ? 'Switch to light theme' : 'Switch to dark theme'} title={dark ? 'Light theme' : 'Dark theme'}>
      {dark ? (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4.5" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>
      ) : (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" /></svg>
      )}
    </button>
  )
}