/**
 * Puerto: lectura del portapapeles del sistema.
 *
 * Hoy solo cubre imágenes, que es lo único que la app necesita (pegar capturas
 * en el chat). El texto ya lo maneja el propio navegador en los inputs.
 *
 * Escritorio: comando Rust `read_clipboard_image` (crate `arboard`).
 * Web: Async Clipboard API. Soporte sólido en Chrome, Edge y Safari; en Firefox
 * la lectura de imágenes es limitada — de ahí `canReadImage()`.
 */

export interface ClipboardPort {
  /** `true` si el target puede leer imágenes del portapapeles. */
  canReadImage(): boolean;

  /**
   * Devuelve la imagen del portapapeles como data URL base64, o `null` si no
   * hay ninguna (o si el usuario no dio permiso).
   */
  readImage(): Promise<string | null>;
}
