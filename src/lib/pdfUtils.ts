import { save } from "@tauri-apps/plugin-dialog";
import { writeFile, BaseDirectory } from "@tauri-apps/plugin-fs";
import { downloadDir, tempDir } from "@tauri-apps/api/path";
import { open } from "@tauri-apps/plugin-shell";
import { Logger } from "./logger";

const MODULE_NAME = "PDF_UTILS";

export const createObjectURL = (blob: Blob): string => {
  return URL.createObjectURL(blob);
};

export const revokeObjectURL = (url: string): void => {
  URL.revokeObjectURL(url);
};

/**
 * Descarga un PDF con diálogo nativo "Guardar como".
 */
export const downloadPDF = async (
  blob: Blob,
  filename: string,
): Promise<string | null> => {
  try {
    const dir = await downloadDir();
    const sep = dir.endsWith("/") || dir.endsWith("\\") ? "" : "/";

    const filePath = await save({
      defaultPath: `${dir}${sep}${filename}`,
      filters: [{ name: "PDF", extensions: ["pdf"] }],
    });

    if (!filePath) {
      Logger.info("User cancelled save dialog", {}, MODULE_NAME);
      return null;
    }

    const arrayBuffer = await blob.arrayBuffer();
    await writeFile(filePath, new Uint8Array(arrayBuffer));
    Logger.info("PDF saved successfully", { path: filePath }, MODULE_NAME);
    return filePath;
  } catch (error) {
    Logger.error("Error downloading PDF", { error, filename }, MODULE_NAME);
    throw error;
  }
};

/**
 * Abre un PDF con el visor predeterminado del sistema para imprimir.
 */
export const printPDF = async (blob: Blob): Promise<void> => {
  try {
    Logger.info("Starting PDF open process in Tauri", {}, MODULE_NAME);

    const arrayBuffer = await blob.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    const timestamp = Date.now();
    const tempFileName = `cotizacion_temp_${timestamp}.pdf`;

    await writeFile(tempFileName, uint8Array, {
      baseDir: BaseDirectory.Temp,
    });

    Logger.info(
      "PDF saved to temp directory",
      { fileName: tempFileName },
      MODULE_NAME,
    );

    const tempDirPath = await tempDir();
    const sep =
      tempDirPath.endsWith("/") || tempDirPath.endsWith("\\") ? "" : "/";
    const fullPath = `${tempDirPath}${sep}${tempFileName}`;

    Logger.info("Opening PDF", { path: fullPath }, MODULE_NAME);

    await open(fullPath);

    Logger.info("PDF opened successfully", {}, MODULE_NAME);
  } catch (error) {
    Logger.error("Error opening PDF in Tauri", { error }, MODULE_NAME);
    throw error;
  }
};
