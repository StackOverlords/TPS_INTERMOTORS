/**
 * Motor de temas de color.
 *
 * Un tema es un diccionario de colores con las claves de los temas de VS Code
 * (`editor.background`, `button.background`, ...), así que sirve cualquier
 * tema de VS Code exportado como JSON además de los predefinidos.
 *
 * Los colores se traducen a las variables CSS de la app (`--background`,
 * `--primary`, ... en formato `H S% L%`) y el resultado se VERIFICA: las claves
 * de VS Code no se usan igual que en la app, así que copiar sin más deja textos
 * ilegibles (con Dracula, el botón gris sobre el fondo gris). Se garantiza
 * contraste WCAG AA en textos (4.5:1) y en el color de marca (3:1).
 *
 * Portado del motor de temas de excalidraw-app.
 */

export type ColorThemeKind = "light" | "dark";

export interface ColorThemeDefinition {
  id: string;
  label: string;
  kind: ColorThemeKind;
  colors: Record<string, string>;
}

interface Rgba {
  r: number;
  g: number;
  b: number;
  a: number;
}

/** Parsea `#rgb`, `#rgba`, `#rrggbb` o `#rrggbbaa` (los formatos que acepta VS Code). */
export function parseHexColor(value: string): Rgba | null {
  const match = /^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.exec(value.trim());
  if (!match) return null;
  let hex = match[1];
  if (hex.length <= 4) hex = [...hex].map((ch) => ch + ch).join("");
  const channel = (index: number) => parseInt(hex.slice(index, index + 2), 16);
  return {
    r: channel(0),
    g: channel(2),
    b: channel(4),
    a: hex.length === 8 ? channel(6) / 255 : 1,
  };
}

/** Compone un color translúcido sobre uno opaco. */
function blend(color: Rgba, base: Rgba): Rgba {
  const mix = (top: number, bottom: number) => Math.round(top * color.a + bottom * (1 - color.a));
  return { r: mix(color.r, base.r), g: mix(color.g, base.g), b: mix(color.b, base.b), a: 1 };
}

/** Triplete `H S% L%`, el formato de las variables CSS de la app. */
export function toHslTriplet({ r, g, b }: Rgba): string {
  const [rn, gn, bn] = [r / 255, g / 255, b / 255];
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  const d = max - min;
  let h = 0;
  let s = 0;
  if (d !== 0) {
    s = d / (1 - Math.abs(2 * l - 1));
    if (max === rn) h = ((gn - bn) / d) % 6;
    else if (max === gn) h = (bn - rn) / d + 2;
    else h = (rn - gn) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  const round = (n: number) => Math.round(n * 10) / 10;
  return `${round(h)} ${round(s * 100)}% ${round(l * 100)}%`;
}

/** Luminancia relativa WCAG. */
function luminance({ r, g, b }: Rgba): number {
  const channel = (value: number) => {
    const c = value / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

/** Contraste WCAG entre dos colores opacos (1–21). */
export function contrastRatio(a: Rgba, b: Rgba): number {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (light + 0.05) / (dark + 0.05);
}

/** Contraste mínimo para texto (WCAG AA). */
const MIN_TEXT_CONTRAST = 4.5;
/** Contraste mínimo para íconos, texto grande y acentos (WCAG AA). */
const MIN_UI_CONTRAST = 3;
/** Por debajo de esto una superficie no se distingue de su base. */
const MIN_SURFACE_CONTRAST = 1.1;

/**
 * Variable CSS de la app → claves de VS Code, de la más específica a la más
 * general. Gana la primera que el tema defina; después se verifica contraste.
 */
export const CSS_VARIABLE_SOURCES: Record<string, string[]> = {
  "--background": ["editor.background"],
  "--foreground": ["editor.foreground", "foreground"],
  "--card": ["editorWidget.background", "sideBar.background", "editor.background"],
  "--card-foreground": ["editorWidget.foreground", "foreground", "editor.foreground"],
  "--popover": ["menu.background", "dropdown.background", "editorWidget.background"],
  "--popover-foreground": ["menu.foreground", "dropdown.foreground", "foreground"],
  "--secondary": ["button.secondaryBackground", "input.background"],
  "--secondary-foreground": ["button.secondaryForeground", "foreground"],
  "--muted": ["input.background", "editorWidget.background"],
  "--muted-foreground": ["descriptionForeground"],
  "--accent": ["list.hoverBackground", "list.inactiveSelectionBackground"],
  "--accent-foreground": ["list.hoverForeground", "foreground"],
  "--destructive": ["errorForeground", "editorError.foreground"],
  // `--border` delinea cada card, badge e input, así que toma los bordes de
  // componentes y no `panel.border`, que muchos temas pintan con el acento.
  "--border": [
    "contrastBorder",
    "widget.border",
    "editorWidget.border",
    "dropdown.border",
    "input.border",
    "tab.border",
    "sideBarSectionHeader.border",
  ],
  "--input": ["contrastBorder", "input.border", "dropdown.border"],
  "--ring": ["focusBorder"],
};

/**
 * Candidatos para el color de marca (`--primary`). La app lo usa como fondo de
 * botón y como color de texto/ícono (`text-primary`, la pestaña activa), así
 * que gana el primero legible sobre el fondo. `button.background` no va
 * primero: muchos temas (Dracula) lo pintan gris.
 */
export const BRAND_SOURCES = [
  "textLink.foreground",
  "activityBarBadge.background",
  "progressBar.background",
  "button.background",
  "focusBorder",
  "list.highlightForeground",
];

/**
 * Variables derivadas del texto cuando el tema no define ninguna de sus
 * claves, como hace VS Code (`descriptionForeground` = texto al 70 %).
 */
const DERIVED_FROM_FOREGROUND: Record<string, number> = {
  "--muted-foreground": 0.7,
  "--border": 0.15,
  "--input": 0.15,
};

/** Superficies que deben distinguirse de su base; si no, se derivan del texto. */
const SURFACES: Array<{ variable: string; on: string; alpha: number }> = [
  { variable: "--secondary", on: "--background", alpha: 0.1 },
  { variable: "--muted", on: "--background", alpha: 0.08 },
  { variable: "--accent", on: "--background", alpha: 0.12 },
];

/** Variables de texto y la superficie sobre la que se dibujan. */
const TEXT_PAIRS: Array<[background: string, text: string]> = [
  ["--card", "--card-foreground"],
  ["--popover", "--popover-foreground"],
  ["--primary", "--primary-foreground"],
  ["--secondary", "--secondary-foreground"],
  ["--muted", "--muted-foreground"],
  ["--accent", "--accent-foreground"],
  ["--destructive", "--destructive-foreground"],
];

const WHITE: Rgba = { r: 255, g: 255, b: 255, a: 1 };
const BLACK: Rgba = { r: 0, g: 0, b: 0, a: 1 };

/**
 * Acerca `color` a negro o a blanco (lo que más contraste dé sobre
 * `background`) lo justo para llegar a `min`. Conserva el tono del tema en vez
 * de saltar directo a negro/blanco.
 */
function ensureContrast(color: Rgba, background: Rgba, min: number): Rgba {
  if (contrastRatio(color, background) >= min) return color;
  const target = contrastRatio(WHITE, background) >= contrastRatio(BLACK, background) ? WHITE : BLACK;
  for (let amount = 0.05; amount < 1; amount += 0.05) {
    const nudged = blend({ ...target, a: amount }, color);
    if (contrastRatio(nudged, background) >= min) return nudged;
  }
  return target;
}

/**
 * Primer candidato con contraste `min` sobre `background`; si ninguno llega,
 * el de mayor contraste ajustado hasta alcanzarlo.
 */
function pickReadable(
  candidates: Array<Rgba | undefined>,
  background: Rgba,
  min: number,
): Rgba | undefined {
  const defined = candidates.filter((c): c is Rgba => c !== undefined);
  const readable = defined.find((c) => contrastRatio(c, background) >= min);
  if (readable) return readable;
  const best = defined.sort((a, b) => contrastRatio(b, background) - contrastRatio(a, background))[0];
  return best && ensureContrast(best, background, min);
}

/**
 * Traduce los colores de un tema a las variables CSS de la app, garantizando
 * contraste. Los colores translúcidos se componen sobre el fondo, porque las
 * variables se consumen opacas con `hsl(var(--x))`.
 */
export function mapColorsToCssVariables(
  colors: Record<string, string>,
  kind: ColorThemeKind,
): Record<string, string> {
  const fallbackBackground =
    kind === "dark" ? { r: 30, g: 30, b: 30, a: 1 } : { r: 255, g: 255, b: 255, a: 1 };
  const base = parseHexColor(colors["editor.background"] ?? "") ?? fallbackBackground;
  const read = (key: string): Rgba | undefined => {
    const parsed = colors[key] ? parseHexColor(colors[key]) : null;
    if (!parsed) return undefined;
    return parsed.a < 1 ? blend(parsed, base) : parsed;
  };

  const resolved: Record<string, Rgba> = {};
  for (const [variable, keys] of Object.entries(CSS_VARIABLE_SOURCES)) {
    for (const key of keys) {
      const color = read(key);
      if (color) {
        resolved[variable] = color;
        break;
      }
    }
  }

  const background = resolved["--background"] ?? base;
  resolved["--background"] = background;
  const foreground =
    resolved["--foreground"] ??
    (kind === "dark" ? { r: 255, g: 255, b: 255, a: 1 } : { r: 0, g: 0, b: 0, a: 1 });
  // El texto principal debe leerse sobre el fondo; si el tema no lo logra, se
  // ajusta hacia negro o blanco lo justo.
  const readableForeground = pickReadable([foreground], background, MIN_TEXT_CONTRAST)!;
  resolved["--foreground"] = readableForeground;
  const onBase = (variable: string) => resolved[variable] ?? background;
  const tint = (alpha: number, on: Rgba) => blend({ ...readableForeground, a: alpha }, on);

  for (const [variable, alpha] of Object.entries(DERIVED_FROM_FOREGROUND)) {
    resolved[variable] ??= tint(alpha, background);
  }
  if (contrastRatio(resolved["--muted-foreground"], background) < MIN_UI_CONTRAST) {
    resolved["--muted-foreground"] = tint(DERIVED_FROM_FOREGROUND["--muted-foreground"], background);
  }

  // Superficies que la app siempre pinta: si el tema no las trae, se heredan
  // del fondo para no mezclar el tema con los grises por defecto de la app.
  resolved["--card"] ??= background;
  resolved["--popover"] ??= resolved["--card"];

  for (const { variable, on, alpha } of SURFACES) {
    const surface = resolved[variable];
    if (!surface || contrastRatio(surface, onBase(on)) < MIN_SURFACE_CONTRAST) {
      resolved[variable] = tint(alpha, onBase(on));
    }
  }

  const brandCandidates = BRAND_SOURCES.map((key) => ({ key, color: read(key) })).filter(
    (candidate) => candidate.color,
  );
  const brandColor = pickReadable(
    brandCandidates.map((c) => c.color),
    background,
    MIN_UI_CONTRAST,
  );
  const brand = brandColor && brandCandidates.find((c) => c.color === brandColor);
  if (brand?.color) {
    resolved["--primary"] = brand.color;
    // El texto propio del botón es el mejor match cuando ganó el color del botón.
    const buttonForeground = brand.key === "button.background" ? read("button.foreground") : undefined;
    if (buttonForeground) resolved["--primary-foreground"] = buttonForeground;
    resolved["--ring"] ??= brand.color;
  }

  for (const [surfaceVariable, textVariable] of TEXT_PAIRS) {
    const surface = resolved[surfaceVariable];
    if (!surface) continue;
    const min = textVariable === "--muted-foreground" ? MIN_UI_CONTRAST : MIN_TEXT_CONTRAST;
    // El color propio del tema primero; después el texto o el fondo del tema
    // (el que se lea); si ninguno llega, el mejor ajustado.
    const text = pickReadable([resolved[textVariable], readableForeground, background], surface, min);
    if (text) resolved[textVariable] = text;
  }

  return Object.fromEntries(
    Object.entries(resolved).map(([variable, color]) => [variable, toHslTriplet(color)]),
  );
}

/** Light/dark de un tema de VS Code (`type` del JSON, o `uiTheme` de la extensión). */
export function kindFromThemeType(type: string | undefined): ColorThemeKind {
  return type === "light" || type === "vs" || type === "hc-light" ? "light" : "dark";
}

/** Quita comentarios y comas finales: los temas de VS Code son JSONC. */
export function stripJsonComments(text: string): string {
  let out = "";
  let inString = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inString) {
      out += ch;
      if (ch === "\\") out += text[++i] ?? "";
      else if (ch === '"') inString = false;
    } else if (ch === '"') {
      inString = true;
      out += ch;
    } else if (ch === "/" && text[i + 1] === "/") {
      while (i < text.length && text[i] !== "\n") i++;
      out += "\n";
    } else if (ch === "/" && text[i + 1] === "*") {
      i += 2;
      while (i < text.length && !(text[i] === "*" && text[i + 1] === "/")) i++;
      i++;
    } else {
      out += ch;
    }
  }
  return out.replace(/,(\s*[}\]])/g, "$1");
}

/**
 * Lee un tema de VS Code exportado (`*-color-theme.json`). Lanza un error con
 * un mensaje para el usuario si el archivo no sirve.
 */
export function parseVsCodeTheme(text: string, fallbackName: string): Omit<ColorThemeDefinition, "id"> {
  let doc: { name?: unknown; type?: unknown; colors?: unknown };
  try {
    doc = JSON.parse(stripJsonComments(text));
  } catch {
    throw new Error("El archivo no es un JSON válido.");
  }
  const rawColors = doc && typeof doc === "object" ? doc.colors : undefined;
  if (!rawColors || typeof rawColors !== "object") {
    throw new Error('El archivo no tiene la sección "colors" de un tema de VS Code.');
  }
  const colors = Object.fromEntries(
    Object.entries(rawColors as Record<string, unknown>).filter(
      (entry): entry is [string, string] => typeof entry[1] === "string" && parseHexColor(entry[1]) !== null,
    ),
  );
  if (!colors["editor.background"]) {
    throw new Error('El tema no define "editor.background".');
  }
  return {
    label: typeof doc.name === "string" && doc.name.trim() ? doc.name.trim() : fallbackName,
    kind: kindFromThemeType(typeof doc.type === "string" ? doc.type : undefined),
    colors,
  };
}
