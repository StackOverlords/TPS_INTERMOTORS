export interface AvatarColor {
  // Usar en el atributo `style` del elemento
  // Incluye ambos modos (light y dark) via CSS variables inline
  vars: {
    "--avatar-bg": string;
    "--avatar-bg-dark": string;
    "--avatar-text": string;
    "--avatar-text-dark": string;
  };
}

// className fija que usa las variables — copiar en el componente
// "bg-[var(--avatar-bg)] text-[var(--avatar-text)] dark:bg-[var(--avatar-bg-dark)] dark:text-[var(--avatar-text-dark)]"
// O si no usas Tailwind dark: usar style directamente con la clase .dark en CSS

const COLORS: AvatarColor[] = [
  // Rojos
  { vars: { "--avatar-bg": "#fee2e2", "--avatar-text": "#b91c1c", "--avatar-bg-dark": "#7f1d1d", "--avatar-text-dark": "#fecaca" } },
  { vars: { "--avatar-bg": "#fecaca", "--avatar-text": "#991b1b", "--avatar-bg-dark": "#450a0a", "--avatar-text-dark": "#fca5a5" } },
  // Rosas
  { vars: { "--avatar-bg": "#ffe4e6", "--avatar-text": "#be185d", "--avatar-bg-dark": "#881337", "--avatar-text-dark": "#fecdd3" } },
  { vars: { "--avatar-bg": "#fecdd3", "--avatar-text": "#9f1239", "--avatar-bg-dark": "#4c0519", "--avatar-text-dark": "#fda4af" } },
  // Pink
  { vars: { "--avatar-bg": "#fce7f3", "--avatar-text": "#be185d", "--avatar-bg-dark": "#831843", "--avatar-text-dark": "#fbcfe8" } },
  { vars: { "--avatar-bg": "#fbcfe8", "--avatar-text": "#9d174d", "--avatar-bg-dark": "#500724", "--avatar-text-dark": "#f9a8d4" } },
  // Fuchsia
  { vars: { "--avatar-bg": "#fae8ff", "--avatar-text": "#a21caf", "--avatar-bg-dark": "#701a75", "--avatar-text-dark": "#f5d0fe" } },
  { vars: { "--avatar-bg": "#f5d0fe", "--avatar-text": "#86198f", "--avatar-bg-dark": "#4a044e", "--avatar-text-dark": "#f0abfc" } },
  // Púrpura
  { vars: { "--avatar-bg": "#f3e8ff", "--avatar-text": "#7e22ce", "--avatar-bg-dark": "#581c87", "--avatar-text-dark": "#e9d5ff" } },
  { vars: { "--avatar-bg": "#e9d5ff", "--avatar-text": "#6b21a8", "--avatar-bg-dark": "#3b0764", "--avatar-text-dark": "#d8b4fe" } },
  // Violeta
  { vars: { "--avatar-bg": "#ede9fe", "--avatar-text": "#6d28d9", "--avatar-bg-dark": "#4c1d95", "--avatar-text-dark": "#ddd6fe" } },
  { vars: { "--avatar-bg": "#ddd6fe", "--avatar-text": "#5b21b6", "--avatar-bg-dark": "#2e1065", "--avatar-text-dark": "#c4b5fd" } },
  // Índigo
  { vars: { "--avatar-bg": "#e0e7ff", "--avatar-text": "#4338ca", "--avatar-bg-dark": "#312e81", "--avatar-text-dark": "#c7d2fe" } },
  { vars: { "--avatar-bg": "#c7d2fe", "--avatar-text": "#3730a3", "--avatar-bg-dark": "#1e1b4b", "--avatar-text-dark": "#a5b4fc" } },
  // Azul
  { vars: { "--avatar-bg": "#dbeafe", "--avatar-text": "#1d4ed8", "--avatar-bg-dark": "#1e3a8a", "--avatar-text-dark": "#bfdbfe" } },
  { vars: { "--avatar-bg": "#bfdbfe", "--avatar-text": "#1e40af", "--avatar-bg-dark": "#172554", "--avatar-text-dark": "#93c5fd" } },
  // Sky
  { vars: { "--avatar-bg": "#e0f2fe", "--avatar-text": "#0369a1", "--avatar-bg-dark": "#0c4a6e", "--avatar-text-dark": "#bae6fd" } },
  { vars: { "--avatar-bg": "#bae6fd", "--avatar-text": "#075985", "--avatar-bg-dark": "#082f49", "--avatar-text-dark": "#7dd3fc" } },
  // Cyan
  { vars: { "--avatar-bg": "#cffafe", "--avatar-text": "#0e7490", "--avatar-bg-dark": "#164e63", "--avatar-text-dark": "#a5f3fc" } },
  { vars: { "--avatar-bg": "#a5f3fc", "--avatar-text": "#0c6276", "--avatar-bg-dark": "#083344", "--avatar-text-dark": "#67e8f9" } },
  // Teal
  { vars: { "--avatar-bg": "#ccfbf1", "--avatar-text": "#0f766e", "--avatar-bg-dark": "#134e4a", "--avatar-text-dark": "#99f6e4" } },
  { vars: { "--avatar-bg": "#99f6e4", "--avatar-text": "#0d6e68", "--avatar-bg-dark": "#042f2e", "--avatar-text-dark": "#5eead4" } },
  // Emerald
  { vars: { "--avatar-bg": "#d1fae5", "--avatar-text": "#047857", "--avatar-bg-dark": "#064e3b", "--avatar-text-dark": "#a7f3d0" } },
  { vars: { "--avatar-bg": "#a7f3d0", "--avatar-text": "#065f46", "--avatar-bg-dark": "#022c22", "--avatar-text-dark": "#6ee7b7" } },
  // Verde
  { vars: { "--avatar-bg": "#dcfce7", "--avatar-text": "#15803d", "--avatar-bg-dark": "#14532d", "--avatar-text-dark": "#bbf7d0" } },
  { vars: { "--avatar-bg": "#bbf7d0", "--avatar-text": "#166534", "--avatar-bg-dark": "#052e16", "--avatar-text-dark": "#86efac" } },
  // Lima
  { vars: { "--avatar-bg": "#ecfccb", "--avatar-text": "#4d7c0f", "--avatar-bg-dark": "#365314", "--avatar-text-dark": "#d9f99d" } },
  // Ámbar
  { vars: { "--avatar-bg": "#fef3c7", "--avatar-text": "#b45309", "--avatar-bg-dark": "#78350f", "--avatar-text-dark": "#fde68a" } },
  { vars: { "--avatar-bg": "#fde68a", "--avatar-text": "#92400e", "--avatar-bg-dark": "#451a03", "--avatar-text-dark": "#fcd34d" } },
  // Naranja
  { vars: { "--avatar-bg": "#ffedd5", "--avatar-text": "#c2410c", "--avatar-bg-dark": "#7c2d12", "--avatar-text-dark": "#fed7aa" } },
  { vars: { "--avatar-bg": "#fed7aa", "--avatar-text": "#9a3412", "--avatar-bg-dark": "#431407", "--avatar-text-dark": "#fdba74" } },
  // Slate
  { vars: { "--avatar-bg": "#f1f5f9", "--avatar-text": "#334155", "--avatar-bg-dark": "#1e293b", "--avatar-text-dark": "#cbd5e1" } },
  // Zinc
  { vars: { "--avatar-bg": "#f4f4f5", "--avatar-text": "#3f3f46", "--avatar-bg-dark": "#27272a", "--avatar-text-dark": "#d4d4d8" } },
];

const hashString = (str: string): number => {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) ^ str.charCodeAt(i);
    hash = hash >>> 0;
  }
  return hash;
};

const buildIdentifier = (userId?: number | string): string => {
  if (userId !== undefined && userId !== null) return String(userId);
  return "default";
};

/**
 * Devuelve CSS variables inline que funcionan en light Y dark mode
 * sin depender de ningún hook ni estado de React.
 *
 * El switch de tema lo hace CSS solo, via el selector .dark del <html>.
 *
 * Uso en el componente:
 *   const { vars } = getUserAvatarColor(userId, name);
 *   <div style={vars as React.CSSProperties} className="avatar-color">JD</div>
 *
 * CSS global necesario (una sola vez en globals.css):
 *   .avatar-color {
 *     background-color: var(--avatar-bg);
 *     color: var(--avatar-text);
 *   }
 *   .dark .avatar-color {
 *     background-color: var(--avatar-bg-dark);
 *     color: var(--avatar-text-dark);
 *   }
 */
export const getUserAvatarColor = (
  userId?: number | string,
): AvatarColor => {
  const index = hashString(buildIdentifier(userId)) % COLORS.length;
  return COLORS[index];
};