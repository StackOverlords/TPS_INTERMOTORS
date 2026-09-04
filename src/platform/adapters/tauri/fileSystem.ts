/**
 * Adaptador Tauri del puerto `FileSystemPort`.
 *
 * Usa los diálogos nativos del SO y escribe con `plugin-fs`.
 */

import { open as openDialog, save } from '@tauri-apps/plugin-dialog';
import {
  BaseDirectory,
  readTextFile,
  writeFile,
  writeTextFile,
} from '@tauri-apps/plugin-fs';
import { open as openExternalShell } from '@tauri-apps/plugin-shell';
import { downloadDir, tempDir } from '@tauri-apps/api/path';
import { invoke } from '@tauri-apps/api/core';

import type {
  FileData,
  FileSystemPort,
  PickTextFileOptions,
  SaveFileRequest,
  SaveFileResult,
} from '@/platform/ports/fileSystem';

async function toBytes(data: FileData): Promise<Uint8Array | null> {
  if (typeof data === 'string') return null; // se escribe como texto
  if (data instanceof Uint8Array) return data;
  return new Uint8Array(await data.arrayBuffer());
}

/** Ruta por defecto del diálogo: la carpeta de descargas del usuario. */
async function defaultPathFor(suggestedName: string): Promise<string> {
  try {
    const dir = await downloadDir();
    const sep = dir.endsWith('/') || dir.endsWith('\\') ? '' : '/';
    return `${dir}${sep}${suggestedName}`;
  } catch {
    return suggestedName;
  }
}

function extensionOf(name: string): string {
  return name.split('.').pop() || '*';
}

export const tauriFileSystem: FileSystemPort = {
  async saveFile(request: SaveFileRequest): Promise<SaveFileResult> {
    const { suggestedName, data, extensions, filterName } = request;

    const filePath = await save({
      defaultPath: await defaultPathFor(suggestedName),
      filters: [
        {
          name: filterName ?? 'Archivo',
          extensions: extensions ?? [extensionOf(suggestedName)],
        },
      ],
    });

    if (!filePath) return { saved: false, path: null }; // el usuario canceló

    const bytes = await toBytes(data);
    if (bytes) await writeFile(filePath, bytes);
    else await writeTextFile(filePath, data as string);

    return { saved: true, path: filePath };
  },

  async pickTextFile(options: PickTextFileOptions = {}) {
    const selected = await openDialog({
      multiple: false,
      directory: false,
      filters: options.extensions
        ? [
            {
              name: options.filterName ?? 'Archivo',
              extensions: options.extensions,
            },
          ]
        : undefined,
    });

    if (!selected || typeof selected !== 'string') return null;

    return {
      name: selected.split(/[\\/]/).pop() ?? selected,
      text: await readTextFile(selected),
    };
  },

  async openExternal(target: string) {
    await openExternalShell(target);
  },

  async openBlob(blob: Blob, suggestedName: string) {
    const bytes = new Uint8Array(await blob.arrayBuffer());

    // Nombre único: si el visor todavía tiene abierto un archivo anterior con
    // el mismo nombre, la escritura puede fallar o mostrar contenido viejo.
    const dot = suggestedName.lastIndexOf('.');
    const base = dot > 0 ? suggestedName.slice(0, dot) : suggestedName;
    const ext = dot > 0 ? suggestedName.slice(dot) : '';
    const tempFileName = `${base}_${Date.now()}${ext}`;

    await writeFile(tempFileName, bytes, { baseDir: BaseDirectory.Temp });

    const dir = await tempDir();
    const sep = dir.endsWith('/') || dir.endsWith('\\') ? '' : '/';
    await openExternalShell(`${dir}${sep}${tempFileName}`);
  },

  canRevealInFolder() {
    return true;
  },

  async revealInFolder(path: string) {
    // Comando propio del backend Rust (src-tauri/src/commands/fs.rs).
    await invoke('reveal_in_folder', { path });
  },
};
