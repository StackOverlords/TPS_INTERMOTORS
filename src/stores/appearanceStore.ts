import { create } from 'zustand';
import { tauriAppearanceStorage } from './tauriPluginAdapterStore';
import { persist, createJSONStorage } from 'zustand/middleware';

// Definimos los tipos aqui ,, pendiente de cambiar a otro archivo
type FontFamily = 'sans' | 'mono' | 'serif';
type FontSize = 'small' | 'medium' | 'large';
type ContentWidth = 'compact' | 'standard' | 'wide';
type BorderRadius = 'none' | 'sm' | 'md' | 'lg';

// Para las colores en las tablas, igual podriamos
// cambiarlo luego a otro archivo de tipos pero por ahora aqui
type TableColors = {
  selectedRow: string | null;  // null = usar color del tema
  hoverRow: string | null;
  header: string | null;
  alternateRows: string | null;
}


// Aqui definimos la estructura queusaremos
interface AppearanceSettings {

  // tipodgrafia aqui
  fontFamily: FontFamily // POr defecto sera sans
  fontSize: FontSize // Por default medium

  // Aqui pondremos accesibilidad
  highContrast: boolean
  focusWidth: number // 1-6
  reduceAnimations: boolean


  // diseño y el espaciado
  contentWidth: ContentWidth
  elementSpacing: number  // la idea es de 8-32
  borderRadius: BorderRadius

  //tablas
  tableColors: TableColors

}

interface AppearanceStore extends AppearanceSettings {
  // Acciones
  setFontFamily: (fontFamily: FontFamily) => void
  setFontSize: (fontSize: FontSize) => void
  setHighContrast: (enabled: boolean) => void
  setFocusWidth: (width: number) => void
  setReduceAnimations: (enabled: boolean) => void
  setContentWidth: (width: ContentWidth) => void
  setElementSpacing: (spacing: number) => void
  setBorderRadius: (radius: BorderRadius) => void
  setTableColor: (colorType: keyof TableColors, color: string | null) => void
  resetToDefaults: () => void
  initializeAppearance: () => void
}


// aqui los valores por defecto que se usara
const defaultSettings: AppearanceSettings = {
  fontFamily: 'sans',
  fontSize: 'medium',
  highContrast: false,
  focusWidth: 2,
  reduceAnimations: false,
  contentWidth: 'standard',
  elementSpacing: 16,
  borderRadius: 'md',

  tableColors: {
    selectedRow: 'rgba(59, 130, 246, 0.2)',  // Color personalizado por defecto
    hoverRow: 'rgba(59, 130, 246, 0.1)',  // Color personalizado por defecto
    header: null,  // null = usar color del tema automáticamente
    alternateRows: null,  // null = usar color del tema automáticamente
  }
}


// Funciones para aplicar

// Tipografia
const applyTypography = (fontFamily: FontFamily, fontSize: FontSize) => {
  const root = document.documentElement;

  // Cambiar la variable css de fuente activa
  const fontMap = {
    sans: 'var(--font-sans)',
    mono: 'var(--font-mono)',
    serif: 'var(--font-serif)'
  }

  root.style.setProperty('--font-family-active', fontMap[fontFamily]);

  // Cambiar tamaño de fuente
  const sizeMap = {
    small: 'var(--font-size-small)',
    medium: 'var(--font-size-medium)',
    large: 'var(--font-size-large)'
  }

  root.style.fontSize = sizeMap[fontSize];
}

// Accesibiliad
const applyAccessibility = (
  highContrast: boolean,
  focusWidth: number,
  reduceAnimations: boolean
) => {
  const root = document.documentElement;

  if (highContrast) {
    root.classList.add('high-contrast');
  } else {
    root.classList.remove('high-contrast');
  }

  root.style.setProperty('--focus-width', `${focusWidth}px`);

  if (reduceAnimations) {
    root.style.setProperty('--animation-duration', '0.01s');
    root.style.setProperty('--transition-duration', '0.01s');
  } else {
    root.style.removeProperty('--animation-duration');
    root.style.removeProperty('--transition-duration');
  }

}

// Layout, pantalla y etc.
const applyLayout = (
  contentWidth: ContentWidth,
  elementSpacing: number,
  borderRadius: BorderRadius
) => {
  const root = document.documentElement

  // Ancho del contenido
  const widthMap = {
    compact: '1024px',
    standard: '1280px',
    wide: '1536px',
  }
  root.style.setProperty('--max-width', widthMap[contentWidth])

  // Espaciado entre elementos
  root.style.setProperty('--element-spacing', `${elementSpacing}px`)

  // Radio de bordes
  const radiusMap = {
    none: '0',
    sm: '0.25rem',
    md: '0.5rem',
    lg: '0.75rem',
  }
  root.style.setProperty('--border-radius-base', radiusMap[borderRadius])
}

// Colores y tabla

const applyTableColors = (tableColors: TableColors) => {
  const root = document.documentElement;

  // Si es null, remover la variable custom (usa el color del tema por defecto)
  // Si tiene valor, setear la variable custom

  if (tableColors.selectedRow === null) {
    root.style.removeProperty('--table-selected-row-custom');
  } else {
    root.style.setProperty('--table-selected-row-custom', tableColors.selectedRow);
  }

  if (tableColors.hoverRow === null) {
    root.style.removeProperty('--table-hover-row-custom');
  } else {
    root.style.setProperty('--table-hover-row-custom', tableColors.hoverRow);
  }

  if (tableColors.header === null) {
    root.style.removeProperty('--table-header-custom');
  } else {
    root.style.setProperty('--table-header-custom', tableColors.header);
  }

  if (tableColors.alternateRows === null) {
    root.style.removeProperty('--table-alternate-rows-custom');
  } else {
    root.style.setProperty('--table-alternate-rows-custom', tableColors.alternateRows);
  }
}


//store
export const useAppearanceStore = create<AppearanceStore>()(
  persist(
    (set, get) => ({
      ...defaultSettings,

      setFontFamily: (fontFamily: FontFamily) => {
        const { fontSize } = get()
        applyTypography(fontFamily, fontSize)
        set({ fontFamily })
      },

      setFontSize: (fontSize: FontSize) => {
        const { fontFamily } = get()
        applyTypography(fontFamily, fontSize)
        set({ fontSize })
      },

      setHighContrast: (highContrast: boolean) => {
        const { focusWidth, reduceAnimations } = get()
        applyAccessibility(highContrast, focusWidth, reduceAnimations)
        set({ highContrast })
      },

      setFocusWidth: (focusWidth: number) => {
        const { highContrast, reduceAnimations } = get()
        applyAccessibility(highContrast, focusWidth, reduceAnimations)
        set({ focusWidth })
      },

      setReduceAnimations: (reduceAnimations: boolean) => {
        const { highContrast, focusWidth } = get()
        applyAccessibility(highContrast, focusWidth, reduceAnimations)
        set({ reduceAnimations })
      },

      setContentWidth: (contentWidth: ContentWidth) => {
        const { elementSpacing, borderRadius } = get()
        applyLayout(contentWidth, elementSpacing, borderRadius)
        set({ contentWidth })
      },

      setElementSpacing: (elementSpacing: number) => {
        const { contentWidth, borderRadius } = get()
        applyLayout(contentWidth, elementSpacing, borderRadius)
        set({ elementSpacing })
      },

      setBorderRadius: (borderRadius: BorderRadius) => {
        const { contentWidth, elementSpacing } = get()
        applyLayout(contentWidth, elementSpacing, borderRadius)
        set({ borderRadius })
      },

      resetToDefaults: () => {
        set(defaultSettings)
        const { fontFamily, fontSize, highContrast, focusWidth, reduceAnimations, contentWidth, elementSpacing, borderRadius, tableColors } = defaultSettings
        applyTypography(fontFamily, fontSize)
        applyAccessibility(highContrast, focusWidth, reduceAnimations)
        applyLayout(contentWidth, elementSpacing, borderRadius)
        applyTableColors(tableColors)
      },

      setTableColor: (colorType: keyof TableColors, color: string | null) => {
        const { tableColors } = get();
        const newColors = { ...tableColors, [colorType]: color };
        applyTableColors(newColors);
        set({ tableColors: newColors });
      },

      initializeAppearance: () => {
        const state = get()
        applyTypography(state.fontFamily, state.fontSize)
        applyAccessibility(state.highContrast, state.focusWidth, state.reduceAnimations)
        applyLayout(state.contentWidth, state.elementSpacing, state.borderRadius)
        applyTableColors(state.tableColors)
      },
    }),
    {
      name: 'appearance-storage',
      storage: createJSONStorage(() => tauriAppearanceStorage),
      onRehydrateStorage: () => (state) => { // Rehidratacionn para el initialized de nuestro main
        if (state) {
          state.initializeAppearance();
        }
      }
    }
  )
)