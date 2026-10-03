/**
 * Aplica las variables CSS de un tema de color sobre <html>.
 *
 * Las variables van inline en `document.documentElement`, así que ganan a las
 * de index.css (`:root` y `.dark`) sin tocarlas: quitar el tema devuelve los
 * colores de Intermotors tal cual.
 *
 * Copia lo aplicado en localStorage (síncrono) para pintarlo antes del primer
 * render: el store del tema persiste en el almacenamiento de la plataforma,
 * que es asíncrono, y sin esta copia cada arranque mostraría un instante los
 * colores por defecto. La copia también sincroniza las demás ventanas.
 */

const CACHE_KEY = "intermotors:color-theme-vars";

let applied: string[] = [];

function setVariables(variables: Record<string, string> | null): void {
  const root = document.documentElement;
  for (const variable of applied) root.style.removeProperty(variable);
  applied = [];
  if (!variables) return;
  for (const [variable, value] of Object.entries(variables)) {
    root.style.setProperty(variable, value);
  }
  applied = Object.keys(variables);
}

/** Aplica (o con `null`, quita) las variables del tema y actualiza la copia síncrona. */
export function applyColorThemeVariables(variables: Record<string, string> | null): void {
  setVariables(variables);
  try {
    if (variables) localStorage.setItem(CACHE_KEY, JSON.stringify(variables));
    else localStorage.removeItem(CACHE_KEY);
  } catch {
    // Sin localStorage (modo privado, cuota): solo se pierde el arranque sin parpadeo.
  }
}

function readCachedVariables(raw: string | null): Record<string, string> | null {
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    return Object.fromEntries(
      Object.entries(parsed as Record<string, unknown>).filter(
        (entry): entry is [string, string] =>
          entry[0].startsWith("--") && typeof entry[1] === "string",
      ),
    );
  } catch {
    return null;
  }
}

/**
 * Llamar antes del primer render (main y ventanas secundarias): aplica el
 * último tema guardado y escucha cambios hechos desde otra ventana.
 */
export function applyCachedColorTheme(): void {
  try {
    setVariables(readCachedVariables(localStorage.getItem(CACHE_KEY)));
  } catch {
    // Sin localStorage: arranca con los colores por defecto.
  }
  window.addEventListener("storage", (event) => {
    if (event.key === CACHE_KEY) setVariables(readCachedVariables(event.newValue));
  });
}
