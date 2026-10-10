// Variante sin resaltado de sintaxis: la normal incluye refractor con todos
// los lenguajes de Prism (~580 KB) para unas notas de versión.
import MarkdownPreview from "@uiw/react-markdown-preview/nohighlight";
import { useThemeStore } from "@/stores/themeStore";

/** Notas de versión en Markdown, con los colores del tema activo. */
export function ReleaseNotesMarkdown({ source }: { source: string }) {
  const { resolvedTheme } = useThemeStore();
  const dark = resolvedTheme === "dark";

  return (
    // La variante nohighlight no trae rehype-raw: sin skipHtml={false} el HTML
    // de las notas (<details>, <ul>…) se muestra como texto. Las viñetas las
    // borra el preflight de Tailwind.
    <MarkdownPreview
      source={source}
      skipHtml={false}
      className="[&_ul]:list-disc [&_ol]:list-decimal"
      style={{
        backgroundColor: "transparent",
        color: dark ? "#f9fafb" : "#374151",
        fontSize: "14px",
        fontFamily: "inherit",
      }}
      wrapperElement={{ "data-color-mode": dark ? "dark" : "light" }}
    />
  );
}
