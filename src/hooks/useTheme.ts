import { useThemeStore } from '@/stores/themeStore'

export const useTheme = () => {
  const theme = useThemeStore((state) => state.theme)
  const resolvedTheme = useThemeStore((state) => state.resolvedTheme)
  const setTheme = useThemeStore((state) => state.setTheme)

  return {
    theme,
    resolvedTheme,
    setTheme,
  }
}
