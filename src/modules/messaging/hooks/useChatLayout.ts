/**
 * Detecta si el contenedor del chat es "compacto" (ventana flotante, panel lateral)
 * o "amplio" (pantalla completa) usando ResizeObserver.
 *
 * Umbral: < 680px → compact (comportamiento móvil/WhatsApp iOS)
 *         ≥ 680px → wide   (comportamiento WhatsApp Web desktop)
 *
 * Uso:
 *   const { containerRef, isCompact } = useChatLayout();
 *   return <div ref={containerRef}>...</div>
 */
import { useEffect, useRef, useState } from "react";

const COMPACT_THRESHOLD = 680;

export function useChatLayout() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isCompact, setIsCompact] = useState(true); // default compact hasta medir

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width ?? 0;
      setIsCompact(width < COMPACT_THRESHOLD);
    });

    observer.observe(el);

    // Medir inmediatamente sin esperar el primer resize event
    setIsCompact(el.getBoundingClientRect().width < COMPACT_THRESHOLD);

    return () => observer.disconnect();
  }, []);

  return { containerRef, isCompact };
}
