import MarkdownPreview from '@uiw/react-markdown-preview/nohighlight';
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import ReleaseNotes from '../ReleaseNotes';

// React necesita saber que corre en un entorno de tests para que act() funcione.
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

/** Correcciones como las publicó la 1.12.0: HTML dentro del Markdown. */
const HTML_NOTES = [
  '## 🐛 Errores corregidos',
  '',
  '<details><summary>Ver lista completa de correcciones</summary>',
  '<ul>',
  '  <li><input type="checkbox" checked> Transferencias: ya no se pueden agregar productos sin stock.</li>',
  '  <li><input type="checkbox" checked> Compras y pedidos: se respeta el tipo de cambio del documento.</li>',
  '</ul>',
  '</details>',
].join('\n');

/** El mismo contenido como lo arma ahora release.yml: solo Markdown. */
const MARKDOWN_NOTES = [
  '## 🐛 Errores corregidos',
  '',
  '- [x] Transferencias: ya no se pueden agregar productos sin stock.',
  '- [x] Compras y pedidos: se respeta el tipo de cambio del documento.',
].join('\n');

const noop = () => {};

describe('ReleaseNotes', () => {
  let container: HTMLDivElement;
  let root: Root;

  const render = (element: Parameters<Root['render']>[0]) =>
    act(() => {
      root.render(element);
    });

  const renderNotes = (releaseNotes: string) =>
    render(
      createElement(ReleaseNotes, {
        currentVersion: '1.11.0',
        latestVersion: '1.12.0-t1',
        variant: 't1',
        releaseNotes,
        hasUpdate: true,
        isChecking: false,
        isDownloading: false,
        isInstalling: false,
        downloadProgress: 0,
        error: null,
        onCheckUpdate: noop,
        onDownloadUpdate: noop,
        onDismiss: noop,
      }),
    );

  const checkedBoxes = () =>
    container.querySelectorAll<HTMLInputElement>('.wmde-markdown input[type="checkbox"]');

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it('interpreta el HTML de las notas en vez de mostrarlo como texto', async () => {
    await renderNotes(HTML_NOTES);

    const markdown = container.querySelector('.wmde-markdown')!;
    expect(markdown.textContent).not.toContain('<details>');
    expect(markdown.textContent).not.toContain('<li>');
    expect(markdown.querySelector('details summary')?.textContent).toBe(
      'Ver lista completa de correcciones',
    );
    expect(markdown.querySelectorAll('details li')).toHaveLength(2);
    expect([...checkedBoxes()].every((box) => box.checked)).toBe(true);
    expect(checkedBoxes()).toHaveLength(2);
  });

  it('muestra las listas de tareas de Markdown con su casilla marcada', async () => {
    await renderNotes(MARKDOWN_NOTES);

    expect(container.querySelector('.wmde-markdown')!.textContent).not.toContain('[x]');
    expect(checkedBoxes()).toHaveLength(2);
    expect([...checkedBoxes()].every((box) => box.checked)).toBe(true);
  });

  it('las notas solo en Markdown también se ven bien con el visor de la 1.11.0 y la 1.12.0', async () => {
    // Así renderizan esas versiones: nohighlight sin skipHtml={false}.
    await render(createElement(MarkdownPreview, { source: MARKDOWN_NOTES }));

    const markdown = container.querySelector('.wmde-markdown')!;
    expect(markdown.textContent).not.toMatch(/<\w+|\[x\]/);
    expect(checkedBoxes()).toHaveLength(2);
  });

  it('con el visor de la 1.11.0 y la 1.12.0, el HTML se veía como texto (el error reportado)', async () => {
    await render(createElement(MarkdownPreview, { source: HTML_NOTES }));

    expect(container.querySelector('.wmde-markdown')!.textContent).toContain('<details>');
  });
});
