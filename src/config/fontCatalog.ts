// Catalogo de fuentes que el usuario puede elegir en Ajustes > Apariencia.
// Para agregar una fuente nueva basta con sumar una entrada aqui
// (y, si es "bundled", importar su paquete en fontFaces.ts).

export type FontSource = 'system' | 'bundled' | 'windows';
export type FontCategory = 'sans' | 'serif' | 'mono';

export interface FontOption {
  id: string;
  label: string;
  category: FontCategory;
  source: FontSource;
  // Valor CSS completo. Siempre termina en un stack de respaldo,
  // asi si la fuente no esta disponible la app no queda con letra del navegador.
  stack: string;
}

const SANS_FALLBACK = 'var(--font-sans)';
const SERIF_FALLBACK = 'var(--font-serif)';
const MONO_FALLBACK = 'var(--font-mono)';

const fallbackFor: Record<FontCategory, string> = {
  sans: SANS_FALLBACK,
  serif: SERIF_FALLBACK,
  mono: MONO_FALLBACK,
};

const font = (
  id: string,
  label: string,
  category: FontCategory,
  source: FontSource,
  family: string,
): FontOption => ({
  id,
  label,
  category,
  source,
  stack: `"${family}", ${fallbackFor[category]}`,
});

export const FONT_OPTIONS = [
  // Del sistema: los 3 ids originales, se mantienen para no romper lo ya guardado
  { id: 'sans', label: 'Sistema (Default)', category: 'sans', source: 'system', stack: SANS_FALLBACK },
  { id: 'serif', label: 'Serif del sistema', category: 'serif', source: 'system', stack: SERIF_FALLBACK },
  { id: 'mono', label: 'Monospace del sistema', category: 'mono', source: 'system', stack: MONO_FALLBACK },

  // Incluidas en la app: funcionan igual en cualquier PC y sin internet
  font('montserrat', 'Montserrat', 'sans', 'bundled', 'Montserrat Variable'),
  font('inter', 'Inter', 'sans', 'bundled', 'Inter Variable'),
  font('roboto', 'Roboto', 'sans', 'bundled', 'Roboto Variable'),
  font('open-sans', 'Open Sans', 'sans', 'bundled', 'Open Sans Variable'),
  font('lato', 'Lato', 'sans', 'bundled', 'Lato'),
  font('source-sans-3', 'Source Sans 3', 'sans', 'bundled', 'Source Sans 3 Variable'),
  font('nunito-sans', 'Nunito Sans', 'sans', 'bundled', 'Nunito Sans Variable'),
  font('noto-sans', 'Noto Sans', 'sans', 'bundled', 'Noto Sans Variable'),
  font('ibm-plex-sans', 'IBM Plex Sans', 'sans', 'bundled', 'IBM Plex Sans Variable'),
  font('fira-sans', 'Fira Sans', 'sans', 'bundled', 'Fira Sans'),
  font('work-sans', 'Work Sans', 'sans', 'bundled', 'Work Sans Variable'),
  font('dm-sans', 'DM Sans', 'sans', 'bundled', 'DM Sans Variable'),
  font('manrope', 'Manrope', 'sans', 'bundled', 'Manrope Variable'),
  font('poppins', 'Poppins', 'sans', 'bundled', 'Poppins'),
  font('lora', 'Lora', 'serif', 'bundled', 'Lora Variable'),
  font('merriweather', 'Merriweather', 'serif', 'bundled', 'Merriweather Variable'),
  font('source-serif-4', 'Source Serif 4', 'serif', 'bundled', 'Source Serif 4 Variable'),
  font('jetbrains-mono', 'JetBrains Mono', 'mono', 'bundled', 'JetBrains Mono Variable'),
  font('roboto-mono', 'Roboto Mono', 'mono', 'bundled', 'Roboto Mono Variable'),

  // Instaladas en Windows: no pesan nada, pero en Linux/Mac caen al respaldo
  font('segoe-ui', 'Segoe UI', 'sans', 'windows', 'Segoe UI'),
  font('arial', 'Arial', 'sans', 'windows', 'Arial'),
  font('calibri', 'Calibri', 'sans', 'windows', 'Calibri'),
  font('verdana', 'Verdana', 'sans', 'windows', 'Verdana'),
  font('tahoma', 'Tahoma', 'sans', 'windows', 'Tahoma'),
  font('trebuchet-ms', 'Trebuchet MS', 'sans', 'windows', 'Trebuchet MS'),
  font('georgia', 'Georgia', 'serif', 'windows', 'Georgia'),
  font('times-new-roman', 'Times New Roman', 'serif', 'windows', 'Times New Roman'),
  font('consolas', 'Consolas', 'mono', 'windows', 'Consolas'),
  font('courier-new', 'Courier New', 'mono', 'windows', 'Courier New'),
] as const satisfies readonly FontOption[];

export type FontFamilyId = (typeof FONT_OPTIONS)[number]['id'];

export const DEFAULT_FONT_ID: FontFamilyId = 'sans';

export const FONT_SOURCE_LABELS: Record<FontSource, string> = {
  system: 'Del sistema',
  bundled: 'Incluidas en la app',
  windows: 'Instaladas en Windows',
};

const fontsById = new Map<string, FontOption>(FONT_OPTIONS.map((option) => [option.id, option]));

// Un id desconocido (p. ej. una fuente que se quito del catalogo) cae al default
export const getFontOption = (id: string): FontOption =>
  fontsById.get(id) ?? fontsById.get(DEFAULT_FONT_ID)!;
