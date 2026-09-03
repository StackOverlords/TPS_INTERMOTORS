/**
 * Adaptador web del puerto `FileSystemPort`.
 *
 * ── Por qué NO usamos `showSaveFilePicker` ───────────────────────────────────
 * La File System Access API daría un diálogo "Guardar como" real, igual que en
 * escritorio, pero exige activación transitoria del usuario: se agota unos
 * segundos después del click. Todos nuestros exports hacen trabajo asíncrono
 * ANTES de guardar (generar el Excel, armar el PDF, bajar el blob), así que la
 * activación suele estar vencida cuando llega el momento de escribir, y el
 * navegador rechaza el diálogo.
 *
 * `<a download>` con un object URL no pide activación y funciona en todos los
 * navegadores. Se pierde el diálogo (el archivo va a la carpeta de descargas por
 * defecto), y ese es el trade-off consciente: descargar siempre > diálogo lindo
 * que falla la mitad de las veces.
 *
 * Por eso `saveFile` en web nunca devuelve `false`: no hay cancelación posible.
 */

import type {
  FileData,
  FileSystemPort,
  PickTextFileOptions,
  SaveFileRequest,
} from '@/platform/ports/fileSystem';

function toBlob(data: FileData, mimeType?: string): Blob {
  if (data instanceof Blob) {
    return mimeType && !data.type ? new Blob([data], { type: mimeType }) : data;
  }

  const type = mimeType ?? 'application/octet-stream';

  if (data instanceof Uint8Array) {
    // Copiamos a un ArrayBuffer propio: el buffer original puede ser un
    // SharedArrayBuffer o una vista parcial, y Blob necesita bytes contiguos.
    return new Blob([data.slice()], { type });
  }

  return new Blob([data], { type: mimeType ?? 'text/plain;charset=utf-8' });
}

function triggerDownload(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');

  anchor.href = url;
  anchor.download = fileName;
  anchor.rel = 'noopener';
  anchor.style.display = 'none';

  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  // El navegador necesita el URL vivo mientras arranca la descarga; liberarlo
  // en el mismo turno la cancela en algunos navegadores.
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

export const webFileSystem: FileSystemPort = {
  async saveFile(request: SaveFileRequest): Promise<boolean> {
    triggerDownload(
      toBlob(request.data, request.mimeType),
      request.suggestedName,
    );
    return true;
  },

  pickTextFile(options: PickTextFileOptions = {}) {
    return new Promise((resolve, reject) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.style.display = 'none';

      if (options.extensions?.length) {
        input.accept = options.extensions.map((ext) => `.${ext}`).join(',');
      }

      // `cancel` no está en todos los navegadores; el fallback es que la
      // promesa quede pendiente hasta que el usuario elija o recargue. Para
      // evitarlo, también resolvemos con `null` si la ventana vuelve al foco
      // sin que haya archivo seleccionado.
      const cleanup = () => {
        input.remove();
        window.removeEventListener('focus', onFocusBack);
      };

      const onFocusBack = () => {
        // El evento `focus` llega antes que `change`; damos un margen.
        setTimeout(() => {
          if (!input.files?.length) {
            cleanup();
            resolve(null);
          }
        }, 500);
      };

      input.addEventListener('change', () => {
        const file = input.files?.[0];
        if (!file) {
          cleanup();
          resolve(null);
          return;
        }

        file
          .text()
          .then((text) => {
            cleanup();
            resolve({ name: file.name, text });
          })
          .catch((error) => {
            cleanup();
            reject(error);
          });
      });

      input.addEventListener('cancel', () => {
        cleanup();
        resolve(null);
      });

      document.body.appendChild(input);
      window.addEventListener('focus', onFocusBack);
      input.click();
    });
  },

  async openExternal(target: string) {
    window.open(target, '_blank', 'noopener,noreferrer');
  },

  async openBlob(blob: Blob, suggestedName: string) {
    const url = URL.createObjectURL(blob);
    const viewer = window.open(url, '_blank', 'noopener,noreferrer');

    if (!viewer) {
      // Pestaña bloqueada (típico si el gesto del usuario ya venció mientras se
      // generaba el archivo). Degradamos a descarga en vez de no hacer nada:
      // el usuario igual obtiene el archivo y puede imprimirlo desde su visor.
      URL.revokeObjectURL(url);
      triggerDownload(blob, suggestedName);
      return;
    }

    // La pestaña necesita el URL vivo mientras carga; liberarlo enseguida
    // dejaría el visor en blanco.
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  },

  canRevealInFolder() {
    // El navegador no da acceso al explorador de archivos del sistema.
    return false;
  },

  async revealInFolder() {
    // No-op: la UI debe consultar `canRevealInFolder()` y esconder la acción.
  },
};
