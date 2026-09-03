import { getFileSystem } from "@/platform";
import { Logger } from "./logger";

const MODULE_NAME = "PDF_UTILS";

export const createObjectURL = (blob: Blob): string => {
  return URL.createObjectURL(blob);
};

export const revokeObjectURL = (url: string): void => {
  URL.revokeObjectURL(url);
};

/**
 * Entrega un PDF al usuario.
 *
 * Escritorio: diálogo nativo "Guardar como". Web: descarga del navegador.
 * Retorna `true` si se guardó, `false` si el usuario canceló el diálogo.
 */
export const downloadPDF = async (
  blob: Blob,
  filename: string,
): Promise<boolean> => {
  try {
    const saved = await getFileSystem().saveFile({
      suggestedName: filename,
      data: blob,
      mimeType: blob.type || "application/pdf",
      extensions: ["pdf"],
      filterName: "PDF",
    });

    if (!saved) {
      Logger.info("User cancelled save dialog", {}, MODULE_NAME);
      return false;
    }

    Logger.info("PDF saved successfully", { filename }, MODULE_NAME);
    return true;
  } catch (error) {
    Logger.error("Error downloading PDF", { error, filename }, MODULE_NAME);
    throw error;
  }
};

/**
 * Abre un PDF en el visor correspondiente para que el usuario lo imprima.
 *
 * Escritorio: archivo temporal + visor por defecto del SO.
 * Web: pestaña nueva con el visor del navegador (que ya trae botón de imprimir).
 */
export const printPDF = async (blob: Blob): Promise<void> => {
  try {
    Logger.info("Opening PDF for printing", {}, MODULE_NAME);

    await getFileSystem().openBlob(blob, "documento.pdf");

    Logger.info("PDF opened successfully", {}, MODULE_NAME);
  } catch (error) {
    Logger.error("Error opening PDF", { error }, MODULE_NAME);
    throw error;
  }
};
