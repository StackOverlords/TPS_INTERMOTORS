import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { applyColorThemeVariables } from '@/themes/applyColorTheme';
import {
  mapColorsToCssVariables,
  parseVsCodeTheme,
  type ColorThemeDefinition,
} from '@/themes/colorTheme';
import { DEFAULT_COLOR_THEME_ID, PRESET_COLOR_THEMES } from '@/themes/presets';
import { createPlatformStorage } from './platformStateStorage';
import { useAppearanceStore } from './appearanceStore';
import { useThemeStore } from './themeStore';

/**
 * Tema de color activo (opcional, encima de claro/oscuro).
 *
 * - `default` = los colores de Intermotors: no se aplica nada.
 * - Elegir un tema cambia también el modo claro/oscuro al del tema.
 * - Elegir claro/oscuro/sistema a mano con un tema del modo contrario activo
 *   vuelve al tema por defecto (si no, quedaría una paleta oscura con los
 *   componentes en modo claro).
 * - Con "alto contraste" activo se muestran los colores de alto contraste.
 */

interface ColorThemeState {
  activeThemeId: string;
  customThemes: ColorThemeDefinition[];
  setColorTheme: (id: string) => void;
  /** Importa un tema de VS Code (`*.json`) y lo activa. Lanza un error legible si no sirve. */
  importVsCodeTheme: (text: string, fileName: string) => ColorThemeDefinition;
  removeCustomTheme: (id: string) => void;
}

export function getAllColorThemes(customThemes: ColorThemeDefinition[]): ColorThemeDefinition[] {
  return [...PRESET_COLOR_THEMES, ...customThemes];
}

export function findColorTheme(
  id: string,
  customThemes: ColorThemeDefinition[],
): ColorThemeDefinition | undefined {
  return getAllColorThemes(customThemes).find((theme) => theme.id === id);
}

/** Variables CSS ya resueltas (con contraste verificado) de un tema. */
const variablesCache = new WeakMap<ColorThemeDefinition, Record<string, string>>();
export function getColorThemeVariables(theme: ColorThemeDefinition): Record<string, string> {
  let variables = variablesCache.get(theme);
  if (!variables) {
    variables = mapColorsToCssVariables(theme.colors, theme.kind);
    variablesCache.set(theme, variables);
  }
  return variables;
}

function applyActiveTheme(state: Pick<ColorThemeState, 'activeThemeId' | 'customThemes'>): void {
  const theme = findColorTheme(state.activeThemeId, state.customThemes);
  const highContrast = useAppearanceStore.getState().highContrast;
  applyColorThemeVariables(theme && !highContrast ? getColorThemeVariables(theme) : null);
}

export const useColorThemeStore = create<ColorThemeState>()(
  persist(
    (set, get) => ({
      activeThemeId: DEFAULT_COLOR_THEME_ID,
      customThemes: [],

      setColorTheme: (id) => {
        const theme = findColorTheme(id, get().customThemes);
        const activeThemeId = theme ? theme.id : DEFAULT_COLOR_THEME_ID;
        set({ activeThemeId });
        if (theme && useThemeStore.getState().resolvedTheme !== theme.kind) {
          useThemeStore.getState().setTheme(theme.kind);
        }
        applyActiveTheme(get());
      },

      importVsCodeTheme: (text, fileName) => {
        const fallbackName = fileName.replace(/(-color-theme)?\.jsonc?$/i, '') || 'Tema importado';
        const parsed = parseVsCodeTheme(text, fallbackName);
        const theme: ColorThemeDefinition = {
          ...parsed,
          id: `custom-${Date.now().toString(36)}`,
        };
        set((state) => ({ customThemes: [...state.customThemes, theme] }));
        get().setColorTheme(theme.id);
        return theme;
      },

      removeCustomTheme: (id) => {
        set((state) => ({
          customThemes: state.customThemes.filter((theme) => theme.id !== id),
          activeThemeId: state.activeThemeId === id ? DEFAULT_COLOR_THEME_ID : state.activeThemeId,
        }));
        applyActiveTheme(get());
      },
    }),
    {
      name: 'color-theme-storage',
      storage: createJSONStorage(() => createPlatformStorage('color-theme-storage.json')),
      partialize: (state) => ({
        activeThemeId: state.activeThemeId,
        customThemes: state.customThemes,
      }),
      // Al rehidratar solo se aplican las variables: el modo claro/oscuro ya
      // quedó persistido por el themeStore cuando se eligió el tema.
      onRehydrateStorage: () => (state) => {
        if (state) applyActiveTheme(state);
      },
    },
  ),
);

// Elegir claro/oscuro a mano con un tema del modo contrario → tema por defecto.
useThemeStore.subscribe((state, previous) => {
  if (state.resolvedTheme === previous.resolvedTheme) return;
  const { activeThemeId, customThemes, setColorTheme } = useColorThemeStore.getState();
  const theme = findColorTheme(activeThemeId, customThemes);
  if (theme && theme.kind !== state.resolvedTheme) setColorTheme(DEFAULT_COLOR_THEME_ID);
});

// Alto contraste tiene prioridad sobre el tema de color.
useAppearanceStore.subscribe((state, previous) => {
  if (state.highContrast !== previous.highContrast) applyActiveTheme(useColorThemeStore.getState());
});
