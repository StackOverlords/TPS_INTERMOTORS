/**
 * Puerto: entrada y salida de archivos hacia el usuario.
 *
 * Cubre el patrón que la app repite en exportaciones (Excel, PDF, imágenes,
 * logs, keybindings): "generá estos bytes y dáselos al usuario como archivo".
 *
 * NO modela un sistema de archivos completo a propósito: el navegador no tiene
 * uno, y ningún consumidor actual necesita más que guardar, elegir y abrir.
 */

/** Datos a guardar. `string` se escribe como texto UTF-8. */
export type FileData = Blob | Uint8Array | string;

export interface SaveFileRequest {
  /** Nombre propuesto, con extensión (ej. `reporte_2026-09-02.xlsx`). */
  suggestedName: string;
  data: FileData;
  /** Tipo MIME. Solo lo usa el target web para etiquetar el Blob. */
  mimeType?: string;
  /**
   * Extensiones para el filtro del diálogo nativo (ej. `['xlsx']`).
   * Se ignoran en web: el navegador deduce el tipo por la extensión del nombre.
   */
  extensions?: string[];
  /** Etiqueta del filtro en el diálogo nativo. Se ignora en web. */
  filterName?: string;
}

export interface SaveFileResult {
  /** `false` solo si el usuario canceló el diálogo. */
  saved: boolean;
  /**
   * Ruta absoluta donde quedó el archivo, o `null` si el target no la expone.
   *
   * En web SIEMPRE es `null`: el navegador no revela dónde guardó la descarga.
   * Por eso `saved` y `path` son campos separados — colapsarlos en un solo
   * `string | null` haría que una descarga web exitosa se lea como cancelada.
   */
  path: string | null;
}

export interface PickedTextFile {
  name: string;
  text: string;
}

export interface PickTextFileOptions {
  extensions?: string[];
  filterName?: string;
}

export interface FileSystemPort {
  /**
   * Guarda `data` como archivo.
   *
   * Escritorio: abre el diálogo nativo "Guardar como".
   * Web: dispara la descarga del navegador a la carpeta de descargas por
   * defecto (sin diálogo — ver la nota del adaptador web sobre por qué).
   *
   * `saved` es `false` solo si el usuario canceló explícitamente el diálogo.
   */
  saveFile(request: SaveFileRequest): Promise<SaveFileResult>;

  /**
   * Abre el selector de archivos y devuelve el contenido como texto.
   * `null` si el usuario canceló.
   *
   * ⚠️ Llamalo dentro del gesto del usuario: en web abre un selector de
   * archivos, que los navegadores exigen que nazca de una interacción.
   */
  pickTextFile(options?: PickTextFileOptions): Promise<PickedTextFile | null>;

  /**
   * Abre una ruta o URL con la aplicación por defecto del sistema.
   * En web solo tienen sentido las URLs: se abren en una pestaña nueva.
   */
  openExternal(target: string): Promise<void>;

  /**
   * Abre un archivo en memoria con el visor correspondiente, sin pedirle al
   * usuario dónde guardarlo. El caso de uso es imprimir: se abre el PDF y el
   * usuario usa el botón de imprimir del visor.
   *
   * Escritorio: lo escribe en el directorio temporal y lo abre con la app por
   * defecto del SO. Web: lo abre en una pestaña nueva con un object URL.
   *
   * ⚠️ En web conviene llamarlo dentro del gesto del usuario. Si el navegador
   * bloquea la pestaña, el adaptador degrada a descargar el archivo en vez de
   * fallar en silencio.
   */
  openBlob(blob: Blob, suggestedName: string): Promise<void>;

  /**
   * `true` si el target puede revelar un archivo en el explorador del sistema.
   * En web siempre es `false`: la UI debería esconder esa acción.
   */
  canRevealInFolder(): boolean;

  /** Muestra el archivo en el explorador del sistema. No-op donde no aplica. */
  revealInFolder(path: string): Promise<void>;
}
