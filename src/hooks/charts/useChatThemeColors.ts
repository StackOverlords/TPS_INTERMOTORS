import { useTheme } from "../useTheme";

export interface ThemeColors {
  solid: string;
  gradientStart: string;
  gradientEnd: string;
}

export interface ThemeColorConfig {
  light: ThemeColors;
  dark: ThemeColors;
}

/**
 * Hook para obtener los colores según el tema actual
 */
export function useChartThemeColors(colorConfig: ThemeColorConfig): ThemeColors {
  const { resolvedTheme } = useTheme();
  return colorConfig[resolvedTheme];
}

/**
 * Configuraciones de colores predefinidas para diferentes temas
 */
export const themeColorPresets = {
  blue: {
    light: {
      solid: "#3b82f6",
      gradientStart: "rgba(59, 130, 246, 1)",
      gradientEnd: "rgba(59, 130, 246, 0.55)",
    },
    dark: {
      solid: "#60a5fa",
      gradientStart: "rgba(96, 165, 250, 1)",
      gradientEnd: "rgba(96, 165, 250, 0.55)",
    },
  },
  green: {
    light: {
      solid: "#22c55e",
      gradientStart: "rgba(34, 197, 94, 1)",
      gradientEnd: "rgba(34, 197, 94, 0.55)",
    },
    dark: {
      solid: "#4ade80",
      gradientStart: "rgba(74, 222, 128, 1)",
      gradientEnd: "rgba(74, 222, 128, 0.55)",
    },
  },
  purple: {
    light: {
      solid: "#a855f7",
      gradientStart: "rgba(168, 85, 247, 1)",
      gradientEnd: "rgba(168, 85, 247, 0.55)",
    },
    dark: {
      solid: "#c084fc",
      gradientStart: "rgba(192, 132, 252, 1)",
      gradientEnd: "rgba(192, 132, 252, 0.55)",
    },
  },
  orange: {
    light: {
      solid: "#f97316",
      gradientStart: "rgba(249, 115, 22, 1)",
      gradientEnd: "rgba(249, 115, 22, 0.55)",
    },
    dark: {
      solid: "#fb923c",
      gradientStart: "rgba(251, 146, 60, 1)",
      gradientEnd: "rgba(251, 146, 60, 0.55)",
    },
  },
  red: {
    light: {
      solid: "#ef4444",
      gradientStart: "rgba(239, 68, 68, 1)",
      gradientEnd: "rgba(239, 68, 68, 0.55)",
    },
    dark: {
      solid: "#f87171",
      gradientStart: "rgba(248, 113, 113, 1)",
      gradientEnd: "rgba(248, 113, 113, 0.55)",
    },
  },
} as const;
