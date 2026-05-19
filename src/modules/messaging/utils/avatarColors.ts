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
  {
    vars: {
      "--avatar-bg": "#fee2e2",
      "--avatar-text": "#b91c1c",
      "--avatar-bg-dark": "rgba(220,38,38,0.2)",
      "--avatar-text-dark": "#f87171",
    },
  },
  {
    vars: {
      "--avatar-bg": "#fecaca",
      "--avatar-text": "#991b1b",
      "--avatar-bg-dark": "rgba(185,28,28,0.2)",
      "--avatar-text-dark": "#fca5a5",
    },
  },
  // Rosas
  {
    vars: {
      "--avatar-bg": "#ffe4e6",
      "--avatar-text": "#be185d",
      "--avatar-bg-dark": "rgba(225,29,72,0.2)",
      "--avatar-text-dark": "#fb7185",
    },
  },
  {
    vars: {
      "--avatar-bg": "#fecdd3",
      "--avatar-text": "#9f1239",
      "--avatar-bg-dark": "rgba(190,18,60,0.2)",
      "--avatar-text-dark": "#fda4af",
    },
  },
  // Pink
  {
    vars: {
      "--avatar-bg": "#fce7f3",
      "--avatar-text": "#be185d",
      "--avatar-bg-dark": "rgba(219,39,119,0.2)",
      "--avatar-text-dark": "#f472b6",
    },
  },
  {
    vars: {
      "--avatar-bg": "#fbcfe8",
      "--avatar-text": "#9d174d",
      "--avatar-bg-dark": "rgba(190,24,93,0.2)",
      "--avatar-text-dark": "#f9a8d4",
    },
  },
  // Fuchsia
  {
    vars: {
      "--avatar-bg": "#fae8ff",
      "--avatar-text": "#a21caf",
      "--avatar-bg-dark": "rgba(192,38,211,0.2)",
      "--avatar-text-dark": "#e879f9",
    },
  },
  {
    vars: {
      "--avatar-bg": "#f5d0fe",
      "--avatar-text": "#86198f",
      "--avatar-bg-dark": "rgba(162,28,175,0.2)",
      "--avatar-text-dark": "#f0abfc",
    },
  },
  // Púrpura
  {
    vars: {
      "--avatar-bg": "#f3e8ff",
      "--avatar-text": "#7e22ce",
      "--avatar-bg-dark": "rgba(147,51,234,0.2)",
      "--avatar-text-dark": "#c084fc",
    },
  },
  {
    vars: {
      "--avatar-bg": "#e9d5ff",
      "--avatar-text": "#6b21a8",
      "--avatar-bg-dark": "rgba(126,34,206,0.2)",
      "--avatar-text-dark": "#d8b4fe",
    },
  },
  // Violeta
  {
    vars: {
      "--avatar-bg": "#ede9fe",
      "--avatar-text": "#6d28d9",
      "--avatar-bg-dark": "rgba(124,58,237,0.2)",
      "--avatar-text-dark": "#a78bfa",
    },
  },
  {
    vars: {
      "--avatar-bg": "#ddd6fe",
      "--avatar-text": "#5b21b6",
      "--avatar-bg-dark": "rgba(109,40,217,0.2)",
      "--avatar-text-dark": "#c4b5fd",
    },
  },
  // Índigo
  {
    vars: {
      "--avatar-bg": "#e0e7ff",
      "--avatar-text": "#4338ca",
      "--avatar-bg-dark": "rgba(79,70,229,0.2)",
      "--avatar-text-dark": "#818cf8",
    },
  },
  {
    vars: {
      "--avatar-bg": "#c7d2fe",
      "--avatar-text": "#3730a3",
      "--avatar-bg-dark": "rgba(67,56,202,0.2)",
      "--avatar-text-dark": "#a5b4fc",
    },
  },
  // Azul
  {
    vars: {
      "--avatar-bg": "#dbeafe",
      "--avatar-text": "#1d4ed8",
      "--avatar-bg-dark": "rgba(37,99,235,0.2)",
      "--avatar-text-dark": "#60a5fa",
    },
  },
  {
    vars: {
      "--avatar-bg": "#bfdbfe",
      "--avatar-text": "#1e40af",
      "--avatar-bg-dark": "rgba(29,78,216,0.2)",
      "--avatar-text-dark": "#93c5fd",
    },
  },
  // Sky
  {
    vars: {
      "--avatar-bg": "#e0f2fe",
      "--avatar-text": "#0369a1",
      "--avatar-bg-dark": "rgba(2,132,199,0.2)",
      "--avatar-text-dark": "#38bdf8",
    },
  },
  {
    vars: {
      "--avatar-bg": "#bae6fd",
      "--avatar-text": "#075985",
      "--avatar-bg-dark": "rgba(3,105,161,0.2)",
      "--avatar-text-dark": "#7dd3fc",
    },
  },
  // Cyan
  {
    vars: {
      "--avatar-bg": "#cffafe",
      "--avatar-text": "#0e7490",
      "--avatar-bg-dark": "rgba(8,145,178,0.2)",
      "--avatar-text-dark": "#22d3ee",
    },
  },
  {
    vars: {
      "--avatar-bg": "#a5f3fc",
      "--avatar-text": "#0c6276",
      "--avatar-bg-dark": "rgba(14,116,144,0.2)",
      "--avatar-text-dark": "#67e8f9",
    },
  },
  // Teal
  {
    vars: {
      "--avatar-bg": "#ccfbf1",
      "--avatar-text": "#0f766e",
      "--avatar-bg-dark": "rgba(13,148,136,0.2)",
      "--avatar-text-dark": "#2dd4bf",
    },
  },
  {
    vars: {
      "--avatar-bg": "#99f6e4",
      "--avatar-text": "#0d6e68",
      "--avatar-bg-dark": "rgba(15,118,110,0.2)",
      "--avatar-text-dark": "#5eead4",
    },
  },
  // Emerald
  {
    vars: {
      "--avatar-bg": "#d1fae5",
      "--avatar-text": "#047857",
      "--avatar-bg-dark": "rgba(5,150,105,0.2)",
      "--avatar-text-dark": "#34d399",
    },
  },
  {
    vars: {
      "--avatar-bg": "#a7f3d0",
      "--avatar-text": "#065f46",
      "--avatar-bg-dark": "rgba(4,120,87,0.2)",
      "--avatar-text-dark": "#6ee7b7",
    },
  },
  // Verde
  {
    vars: {
      "--avatar-bg": "#dcfce7",
      "--avatar-text": "#15803d",
      "--avatar-bg-dark": "rgba(22,163,74,0.2)",
      "--avatar-text-dark": "#4ade80",
    },
  },
  {
    vars: {
      "--avatar-bg": "#bbf7d0",
      "--avatar-text": "#166534",
      "--avatar-bg-dark": "rgba(21,128,61,0.2)",
      "--avatar-text-dark": "#86efac",
    },
  },
  // Lima
  {
    vars: {
      "--avatar-bg": "#ecfccb",
      "--avatar-text": "#4d7c0f",
      "--avatar-bg-dark": "rgba(101,163,13,0.2)",
      "--avatar-text-dark": "#a3e635",
    },
  },
  // Ámbar
  {
    vars: {
      "--avatar-bg": "#fef3c7",
      "--avatar-text": "#b45309",
      "--avatar-bg-dark": "rgba(217,119,6,0.2)",
      "--avatar-text-dark": "#fbbf24",
    },
  },
  {
    vars: {
      "--avatar-bg": "#fde68a",
      "--avatar-text": "#92400e",
      "--avatar-bg-dark": "rgba(180,83,9,0.2)",
      "--avatar-text-dark": "#fcd34d",
    },
  },
  // Naranja
  {
    vars: {
      "--avatar-bg": "#ffedd5",
      "--avatar-text": "#c2410c",
      "--avatar-bg-dark": "rgba(234,88,12,0.2)",
      "--avatar-text-dark": "#fb923c",
    },
  },
  {
    vars: {
      "--avatar-bg": "#fed7aa",
      "--avatar-text": "#9a3412",
      "--avatar-bg-dark": "rgba(194,65,12,0.2)",
      "--avatar-text-dark": "#fdba74",
    },
  },
  // Slate
  {
    vars: {
      "--avatar-bg": "#f1f5f9",
      "--avatar-text": "#334155",
      "--avatar-bg-dark": "rgba(71,85,105,0.2)",
      "--avatar-text-dark": "#94a3b8",
    },
  },
  // Zinc
  {
    vars: {
      "--avatar-bg": "#f4f4f5",
      "--avatar-text": "#3f3f46",
      "--avatar-bg-dark": "rgba(82,82,91,0.2)",
      "--avatar-text-dark": "#a1a1aa",
    },
  },
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
export const getUserAvatarColor = (userId?: number | string): AvatarColor => {
  const index = hashString(buildIdentifier(userId)) % COLORS.length;
  return COLORS[index];
};
