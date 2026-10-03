import { Badge } from "@/components/atoms/badge";
import { Button } from "@/components/atoms/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/atoms/card";
import { showErrorToast, showSuccessToast } from "@/hooks/use-toast-enhanced";
import { cn } from "@/lib/utils";
import {
  getAllColorThemes,
  getColorThemeVariables,
  useColorThemeStore,
} from "@/stores/colorThemeStore";
import type { ColorThemeDefinition } from "@/themes/colorTheme";
import { DEFAULT_COLOR_THEME_ID, PRESET_COLOR_THEMES } from "@/themes/presets";
import { Check, Palette, Trash2, Upload } from "lucide-react";
import { useMemo, useRef } from "react";

/** Colores de Intermotors (index.css) para la vista previa del tema por defecto. */
const DEFAULT_PREVIEW = {
  light: { bg: "0 0% 100%", card: "210 40% 96.1%", fg: "222.2 84% 4.9%", muted: "215.4 16.3% 46.9%", primary: "222.2 47.4% 11.2%" },
  dark: { bg: "220 13% 16%", card: "220 13% 18%", fg: "0 0% 100%", muted: "215 20.2% 65.1%", primary: "239 84% 67%" },
};

type Preview = (typeof DEFAULT_PREVIEW)["light"];

function previewOf(theme: ColorThemeDefinition): Preview {
  const v = getColorThemeVariables(theme);
  return {
    bg: v["--background"],
    card: v["--card"],
    fg: v["--foreground"],
    muted: v["--muted-foreground"],
    primary: v["--primary"],
  };
}

/** Ventanita con la paleta: fondo, barra lateral, textos y botón de marca. */
function MiniWindow({ colors, className }: { colors: Preview; className?: string }) {
  const c = (value: string) => `hsl(${value})`;
  return (
    <div className={cn("flex h-full w-full overflow-hidden", className)} style={{ background: c(colors.bg) }}>
      <div className="flex w-1/3 flex-col gap-1 p-1.5" style={{ background: c(colors.card) }}>
        <div className="h-1.5 w-3/4 rounded-full" style={{ background: c(colors.primary) }} />
        <div className="h-1 w-2/3 rounded-full" style={{ background: c(colors.muted) }} />
        <div className="h-1 w-1/2 rounded-full" style={{ background: c(colors.muted) }} />
      </div>
      <div className="flex flex-1 flex-col gap-1 p-1.5">
        <div className="h-1.5 w-3/4 rounded-full" style={{ background: c(colors.fg) }} />
        <div className="h-1 w-full rounded-full" style={{ background: c(colors.muted) }} />
        <div className="h-1 w-5/6 rounded-full" style={{ background: c(colors.muted) }} />
        <div className="mt-auto h-2.5 w-1/2 self-end rounded" style={{ background: c(colors.primary) }} />
      </div>
    </div>
  );
}

function ThemeOption({
  label,
  kindLabel,
  selected,
  onSelect,
  onRemove,
  children,
}: {
  label: string;
  kindLabel: string;
  selected: boolean;
  onSelect: () => void;
  onRemove?: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="group relative">
      <button
        type="button"
        onClick={onSelect}
        aria-pressed={selected}
        className={cn(
          "flex w-full flex-col overflow-hidden rounded-lg border text-left transition-shadow",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          selected ? "border-primary ring-2 ring-primary" : "border-border hover:shadow-md"
        )}
      >
        <div className="h-16 w-full">{children}</div>
        <div className="flex items-center justify-between gap-2 border-t border-border bg-card px-2 py-1.5">
          <span className="truncate text-xs font-medium">{label}</span>
          {selected ? (
            <Check className="size-3.5 shrink-0 text-primary" aria-label="Tema activo" />
          ) : (
            <Badge variant="outline" className="shrink-0 px-1 py-0 text-[10px] font-normal">
              {kindLabel}
            </Badge>
          )}
        </div>
      </button>
      {onRemove && (
        <Button
          type="button"
          variant="secondary"
          size="icon"
          onClick={onRemove}
          title={`Quitar "${label}"`}
          className="absolute right-1 top-1 size-6 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
        >
          <Trash2 className="size-3" />
        </Button>
      )}
    </div>
  );
}

const ColorThemePicker = () => {
  const activeThemeId = useColorThemeStore((s) => s.activeThemeId);
  const customThemes = useColorThemeStore((s) => s.customThemes);
  const setColorTheme = useColorThemeStore((s) => s.setColorTheme);
  const importVsCodeTheme = useColorThemeStore((s) => s.importVsCodeTheme);
  const removeCustomTheme = useColorThemeStore((s) => s.removeCustomTheme);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const themes = useMemo(() => getAllColorThemes(customThemes), [customThemes]);
  const presetIds = useMemo(() => new Set(PRESET_COLOR_THEMES.map((t) => t.id)), []);

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      const theme = importVsCodeTheme(await file.text(), file.name);
      showSuccessToast({
        title: "Tema importado",
        description: `"${theme.label}" está activo. Los colores se ajustaron para que todo se lea bien.`,
      });
    } catch (error) {
      showErrorToast({
        title: "No se pudo importar el tema",
        description: error instanceof Error ? error.message : "Archivo no válido.",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="size-4" />
          Tema de color
        </CardTitle>
        <CardDescription>
          Paletas completas para la interfaz. Todas garantizan contraste legible
          (WCAG AA) en textos y botones. Elegir claro/oscuro arriba vuelve al tema
          de Intermotors.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <ThemeOption
            label="Intermotors"
            kindLabel="Original"
            selected={activeThemeId === DEFAULT_COLOR_THEME_ID}
            onSelect={() => setColorTheme(DEFAULT_COLOR_THEME_ID)}
          >
            <div className="flex h-full">
              <MiniWindow colors={DEFAULT_PREVIEW.light} />
              <MiniWindow colors={DEFAULT_PREVIEW.dark} />
            </div>
          </ThemeOption>
          {themes.map((theme) => (
            <ThemeOption
              key={theme.id}
              label={theme.label}
              kindLabel={theme.kind === "dark" ? "Oscuro" : "Claro"}
              selected={activeThemeId === theme.id}
              onSelect={() => setColorTheme(theme.id)}
              onRemove={presetIds.has(theme.id) ? undefined : () => removeCustomTheme(theme.id)}
            >
              <MiniWindow colors={previewOf(theme)} />
            </ThemeOption>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3 rounded-md border border-dashed border-border p-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="size-3.5" />
            Importar tema de VS Code
          </Button>
          <p className="flex-1 text-xs text-muted-foreground">
            Cualquier tema de VS Code sirve: en VS Code ejecuta{" "}
            <span className="font-medium text-foreground">
              Developer: Generate Color Theme From Current Settings
            </span>{" "}
            y guarda el archivo <code>.json</code>.
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,.jsonc,application/json"
            className="hidden"
            onChange={handleImport}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default ColorThemePicker;
