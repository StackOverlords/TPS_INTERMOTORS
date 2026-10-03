import { describe, expect, it } from 'vitest';
import {
  contrastRatio,
  mapColorsToCssVariables,
  parseVsCodeTheme,
  stripJsonComments,
} from '../colorTheme';
import { PRESET_COLOR_THEMES } from '../presets';

/** `H S% L%` → rgb, para medir contraste sobre el resultado final. */
function hslToRgb(triplet: string) {
  const [h, s, l] = triplet.split(' ').map((part) => parseFloat(part));
  const sat = s / 100;
  const light = l / 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = sat * Math.min(light, 1 - light);
  const f = (n: number) => light - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return { r: Math.round(f(0) * 255), g: Math.round(f(8) * 255), b: Math.round(f(4) * 255), a: 1 };
}

const contrast = (vars: Record<string, string>, fg: string, bg: string) =>
  contrastRatio(hslToRgb(vars[fg]), hslToRgb(vars[bg]));

const TEXT_PAIRS: Array<[string, string, number]> = [
  ['--foreground', '--background', 4.5],
  ['--card-foreground', '--card', 4.5],
  ['--popover-foreground', '--popover', 4.5],
  ['--primary-foreground', '--primary', 4.5],
  ['--secondary-foreground', '--secondary', 4.5],
  ['--accent-foreground', '--accent', 4.5],
  ['--muted-foreground', '--muted', 3],
  ['--primary', '--background', 3],
];

describe('mapColorsToCssVariables', () => {
  it.each(PRESET_COLOR_THEMES.map((theme) => [theme.label, theme] as const))(
    '%s: todo texto es legible sobre su superficie (WCAG AA)',
    (_label, theme) => {
      const vars = mapColorsToCssVariables(theme.colors, theme.kind);
      for (const [fg, bg, min] of TEXT_PAIRS) {
        // El redondeo a HSL con un decimal puede mover el contraste unas centésimas.
        expect(contrast(vars, fg, bg), `${fg} sobre ${bg}`).toBeGreaterThanOrEqual(min - 0.05);
      }
    },
  );

  it('no usa un botón gris como color de marca (caso Dracula)', () => {
    const dracula = PRESET_COLOR_THEMES.find((theme) => theme.id === 'dracula')!;
    const vars = mapColorsToCssVariables(dracula.colors, 'dark');
    // #ff79c6 (rosa de Dracula), no #44475a (gris del botón).
    expect(vars['--primary']).toBe(mapColorsToCssVariables({ 'editor.background': '#282a36', 'textLink.foreground': '#ff79c6' }, 'dark')['--primary']);
  });

  it('corrige un texto ilegible del tema', () => {
    const vars = mapColorsToCssVariables(
      { 'editor.background': '#ffffff', 'editor.foreground': '#f0f0f0' },
      'light',
    );
    expect(contrast(vars, '--foreground', '--background')).toBeGreaterThanOrEqual(4.5);
  });
});

describe('parseVsCodeTheme', () => {
  const jsonc = `{
    // exportado desde VS Code
    "name": "Mi tema",
    "type": "light",
    "colors": {
      "editor.background": "#fafafa", /* fondo */
      "editor.foreground": "#333333",
      "statusBar.background": "no-es-un-color",
    },
  }`;

  it('lee JSONC con comentarios y comas finales', () => {
    const theme = parseVsCodeTheme(jsonc, 'archivo');
    expect(theme).toEqual({
      label: 'Mi tema',
      kind: 'light',
      colors: { 'editor.background': '#fafafa', 'editor.foreground': '#333333' },
    });
  });

  it('no rompe URLs ni "//" dentro de strings', () => {
    expect(JSON.parse(stripJsonComments('{"a": "http://x.y", "b": "/* no */"}'))).toEqual({
      a: 'http://x.y',
      b: '/* no */',
    });
  });

  it('da errores legibles', () => {
    expect(() => parseVsCodeTheme('no json', 'x')).toThrow('JSON válido');
    expect(() => parseVsCodeTheme('{"name": "x"}', 'x')).toThrow('"colors"');
    expect(() => parseVsCodeTheme('{"colors": {"foreground": "#fff"}}', 'x')).toThrow('editor.background');
  });

  it('usa el nombre del archivo si el tema no tiene nombre y asume oscuro', () => {
    const theme = parseVsCodeTheme('{"colors": {"editor.background": "#000000"}}', 'monokai');
    expect(theme.label).toBe('monokai');
    expect(theme.kind).toBe('dark');
  });
});
