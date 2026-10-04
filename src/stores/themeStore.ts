import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { themeStorage } from './platformStateStorage'

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

/**
 * Copia síncrona del tema resuelto para el script inline de index.html y
 * window.html, que pinta el fondo correcto ANTES de cargar el JS. El store
 * persiste en el almacenamiento de la plataforma (un archivo en escritorio),
 * que ese script no puede leer: sin esta copia cada ventana arrancaba en claro
 * y, con el tema oscuro, se veía un fogonazo blanco al abrirla.
 */
export const RESOLVED_THEME_CACHE_KEY = 'theme-resolved'

const applyTheme = (resolvedTheme: ResolvedTheme) => {
  const root = document.documentElement
  root.style.colorScheme = resolvedTheme
  try {
    localStorage.setItem(RESOLVED_THEME_CACHE_KEY, resolvedTheme)
  } catch {
    // Sin localStorage solo se pierde el arranque sin parpadeo.
  }

  if (resolvedTheme === 'dark') {
    root.classList.add('dark')
  } else {
    root.classList.remove('dark')
  }
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

        // Notificar a otras ventanas del cambio
        window.dispatchEvent(new CustomEvent('theme-changed', {
          detail: { theme, resolvedTheme }
        }))
      },

      initializeTheme: () => {
        const { theme } = get()
        const resolvedTheme = resolveTheme(theme)
        applyTheme(resolvedTheme)
        set({ resolvedTheme })

        // Escuchar cambios del sistema (prefers-color-scheme)
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
        const handleSystemChange = (e: MediaQueryListEvent) => {
          const { theme } = get()
          if (theme === 'system') {
            const newResolvedTheme = e.matches ? 'dark' : 'light'
            applyTheme(newResolvedTheme)
            set({ resolvedTheme: newResolvedTheme })
          }
        }

        mediaQuery.addEventListener('change', handleSystemChange)

        //  Sincronizar cambios entre ventanas (localStorage)
        const handleStorageChange = (e: StorageEvent) => {
          if (e.key === 'theme-storage' && e.newValue) {
            try {
              const newState = JSON.parse(e.newValue).state
              const newResolvedTheme = resolveTheme(newState.theme)
              applyTheme(newResolvedTheme)
              set({ theme: newState.theme, resolvedTheme: newResolvedTheme })

            } catch (err) {
              console.error('[ThemeStore] Error sincronizando tema:', err)
            }
          }
        }

        window.addEventListener('storage', handleStorageChange)

        // Cleanup
        return () => {
          mediaQuery.removeEventListener('change', handleSystemChange)
          window.removeEventListener('storage', handleStorageChange)
        }
      },
    }),
    {
      name: 'theme-storage',
      storage: createJSONStorage(() => themeStorage),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.initializeTheme();
        }
      }
    }
  )
)
