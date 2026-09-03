import { getFileSystem, getHttp } from "@/platform";
import { Logger } from "./logger";

const MODULE_NAME = "FILE_UTILS";

/**
 * Fetch de un archivo como Blob.
 *
 * En escritorio sale por Rust y bypasea CORS; en web usa `fetch` y depende de
 * que el servidor de origen lo permita (ver `platform/ports/http.ts`).
 */
export async function fetchBlob(url: string): Promise<Blob> {
  return getHttp().fetchBlob(url);
}

/**
 * Descarga un archivo desde una URL y se lo entrega al usuario.
 *
 * Escritorio: diálogo nativo "Guardar como". Web: descarga del navegador.
 */
export async function downloadFile(
  url: string,
  suggestedName: string,
): Promise<void> {
  try {
    const blob = await fetchBlob(url);

    const saved = await getFileSystem().saveFile({
      suggestedName,
      data: blob,
      mimeType: blob.type || undefined,
      filterName: "Archivo",
    });

    if (!saved) {
      Logger.info("User cancelled save dialog", {}, MODULE_NAME);
      return;
    }

    Logger.info("File saved successfully", { suggestedName }, MODULE_NAME);
  } catch (error) {
    Logger.error(
      "Error downloading file",
      { error, suggestedName },
      MODULE_NAME,
    );
    throw error;
  }
}
