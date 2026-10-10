import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * En escritorio, Tauri le pone un nonce a cada <style> del HTML y lo suma a
 * style-src de la CSP. Con un nonce presente el navegador ignora
 * 'unsafe-inline', y se bloquea el CSS que las librerías inyectan al vuelo:
 * en la 1.11.0 los avisos de sonner quedaron sin estilo y empujaban la ventana.
 * Los estilos de arranque van en src/boot-theme.css.
 */
const ENTRYPOINTS = ['index.html', 'window.html'];

const read = (file: string) => readFileSync(path.resolve(__dirname, '../..', file), 'utf8');

const withoutComments = (html: string) => html.replace(/<!--[\s\S]*?-->/g, '');

describe.each(ENTRYPOINTS)('%s', (file) => {
  it('no tiene estilos en línea (Tauri bloquearía el CSS que se inyecta al vuelo)', () => {
    expect(withoutComments(read(file))).not.toMatch(/<style\b/i);
  });

  it('carga los estilos de arranque desde src/boot-theme.css', () => {
    expect(withoutComments(read(file))).toContain(
      '<link rel="stylesheet" href="/src/boot-theme.css" />',
    );
  });
});
