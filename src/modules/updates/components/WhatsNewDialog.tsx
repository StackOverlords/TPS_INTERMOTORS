import { useWhatsNew } from "../hooks/useWhatsNew";
import { displayVersion } from "../utils/version";
import { VersionNotesDialog } from "./VersionNotesDialog";

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("es-ES", { year: "numeric", month: "long", day: "numeric" });

/**
 * Muestra una sola vez las novedades de la versión instalada. Se monta una vez
 * en la ventana principal; en web no hace nada (no hay autoactualización).
 */
export function WhatsNewDialog() {
  const { whatsNew, dismiss } = useWhatsNew();
  if (!whatsNew) return null;

  const version = displayVersion(whatsNew.version);
  const previous = whatsNew.previousVersion;
  const published = whatsNew.date ? `Publicada el ${formatDate(whatsNew.date)}. ` : "";

  return (
    <VersionNotesDialog
      open
      onClose={dismiss}
      title={previous ? `Se actualizó a la versión ${version}` : `Novedades de la versión ${version}`}
      description={
        previous
          ? `${published}Antes tenías la ${displayVersion(previous)}.`
          : `${published}Estos son los cambios que incluye.`
      }
      notes={whatsNew.notes}
      primary={{ label: "Entendido", onClick: dismiss }}
    />
  );
}
