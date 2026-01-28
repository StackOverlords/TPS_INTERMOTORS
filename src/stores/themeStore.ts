import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

type Theme = 'light' | 'dark' | 'system'
type ResolvedTheme = 'light' | 'dark'

interface ThemeStore {
  theme: Theme
  resolvedTheme: ResolvedTheme
  setTheme: (theme: Theme) => void
  initializeTheme: () => void
}

const getSystemTheme = (): ResolvedTheme => {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

const applyTheme = (resolvedTheme: ResolvedTheme) => {
  document.documentElement.style.colorScheme = resolvedTheme
}

const resolveTheme = (theme: Theme): ResolvedTheme => {
  return theme === 'system' ? getSystemTheme() : theme
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set, get) => ({
      theme: 'light',
      resolvedTheme: 'light',

      setTheme: (theme: Theme) => {
        const resolvedTheme = resolveTheme(theme)
        applyTheme(resolvedTheme)
        set({ theme, resolvedTheme })
      },

      initializeTheme: () => {
        const { theme } = get()
        const resolvedTheme = resolveTheme(theme)
        applyTheme(resolvedTheme)
        set({ resolvedTheme })

        // Listen for system theme changes
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
        const handleChange = (e: MediaQueryListEvent) => {
          const { theme } = get()
          if (theme === 'system') {
            const newResolvedTheme = e.matches ? 'dark' : 'light'
            applyTheme(newResolvedTheme)
            set({ resolvedTheme: newResolvedTheme })
          }
        }

        mediaQuery.addEventListener('change', handleChange)
      },
    }),
    {
      name: 'theme-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
)
