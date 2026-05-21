import { fetch as tauriFetch } from "@tauri-apps/plugin-http";
import { save } from "@tauri-apps/plugin-dialog";
import { writeFile } from "@tauri-apps/plugin-fs";
import { downloadDir } from "@tauri-apps/api/path";
import { Logger } from "./logger";

const MODULE_NAME = "FILE_UTILS";

/**
 * Fetch de un archivo como Blob usando el cliente HTTP de Tauri (bypasea CORS).
 */
export async function fetchBlob(url: string): Promise<Blob> {
  const response = await tauriFetch(url, { method: "GET" });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.blob();
}

/**
 * Descarga un archivo desde una URL con diálogo nativo "Guardar como".
 */
export async function downloadFile(
  url: string,
  suggestedName: string,
): Promise<void> {
  try {
    const blob = await fetchBlob(url);
    const buffer = await blob.arrayBuffer();

    const dir = await downloadDir();
    const sep = dir.endsWith("/") || dir.endsWith("\\") ? "" : "/";

    const filePath = await save({
      defaultPath: `${dir}${sep}${suggestedName}`,
      filters: [
        {
          name: "Archivo",
          extensions: [suggestedName.split(".").pop() ?? "*"],
        },
      ],
    });

    if (!filePath) {
      Logger.info("User cancelled save dialog", {}, MODULE_NAME);
      return;
    }

    await writeFile(filePath, new Uint8Array(buffer));
    Logger.info("File saved successfully", { path: filePath }, MODULE_NAME);
  } catch (error) {
    Logger.error(
      "Error downloading file",
      { error, suggestedName },
      MODULE_NAME,
    );
    throw error;
  }
}
