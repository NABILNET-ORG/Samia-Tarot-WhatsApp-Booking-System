/**
 * 🎨 Theme Provider
 * Manages dark/light theme preferences (simplified - no system theme)
 */

'use client'

import { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'light' | 'dark'

type ThemeContextType = {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('light')

  useEffect(() => {
    // Load theme from localStorage (default to light if not set)
    const savedTheme = localStorage.getItem('theme') as string | null

    // Migrate from old 'system' theme or invalid values to 'light'
    if (savedTheme === 'dark') {
      setThemeState('dark')
    } else {
      // Default to light for: null, 'light', 'system', or any other value
      setThemeState('light')
      localStorage.setItem('theme', 'light')
    }
  }, [])

  useEffect(() => {
    // Update document class
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [theme])

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme)
    localStorage.setItem('theme', newTheme)
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider')
  }
  return context
}
