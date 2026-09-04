import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { webFileSystem } from '../fileSystem';

/** Ancla creada por `triggerDownload`, capturada al insertarse en el DOM. */
let ancla: HTMLAnchorElement | null;
let clickSpy: ReturnType<typeof vi.fn>;

beforeEach(() => {
  ancla = null;
  clickSpy = vi.fn();

  // happy-dom no implementa object URLs.
  vi.stubGlobal('URL', {
    ...URL,
    createObjectURL: vi.fn(() => 'blob:mock-url'),
    revokeObjectURL: vi.fn(),
  });

  const createElement = document.createElement.bind(document);
  vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
    const el = createElement(tag);
    if (tag === 'a') {
      ancla = el as HTMLAnchorElement;
      el.click = clickSpy as unknown as HTMLElement['click'];
    }
    return el;
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('webFileSystem.saveFile', () => {
  it('dispara la descarga con el nombre sugerido', async () => {
    await webFileSystem.saveFile({
      suggestedName: 'reporte_2026-09-03.xlsx',
      data: 'contenido',
    });

    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(ancla?.download).toBe('reporte_2026-09-03.xlsx');
  });

  it('reporta saved:true y path:null', async () => {
    const resultado = await webFileSystem.saveFile({
      suggestedName: 'x.txt',
      data: 'hola',
    });

    // Separar `saved` de `path` es deliberado: el navegador no revela dónde
    // guardó. Colapsarlos en `string | null` haría que una descarga exitosa
    // se leyera como cancelada (fue una regresión real en cash.service).
    expect(resultado).toEqual({ saved: true, path: null });
  });

  it('nunca reporta cancelación: en web no hay diálogo que cancelar', async () => {
    const resultado = await webFileSystem.saveFile({
      suggestedName: 'y.txt',
      data: 'hola',
    });

    expect(resultado.saved).toBe(true);
  });

  it('acepta Blob, Uint8Array y string', async () => {
    for (const data of [
      new Blob(['a']),
      new Uint8Array([1, 2, 3]),
      'texto',
    ]) {
      await expect(
        webFileSystem.saveFile({ suggestedName: 'z.bin', data }),
      ).resolves.toMatchObject({ saved: true });
    }

    expect(clickSpy).toHaveBeenCalledTimes(3);
  });
});

describe('webFileSystem — capacidades ausentes', () => {
  it('declara que no puede revelar en el explorador', () => {
    // La UI usa esto para esconder la acción en vez de mostrar un botón muerto.
    expect(webFileSystem.canRevealInFolder()).toBe(false);
  });

  it('revealInFolder es un no-op silencioso', async () => {
    await expect(webFileSystem.revealInFolder('/lo/que/sea')).resolves.toBeUndefined();
  });
});

describe('webFileSystem.openBlob', () => {
  it('abre el archivo en una pestaña nueva', async () => {
    const open = vi.fn(() => ({}) as Window);
    window.open = open as unknown as typeof window.open;

    await webFileSystem.openBlob(new Blob(['%PDF']), 'documento.pdf');

    expect(open).toHaveBeenCalledWith(
      'blob:mock-url',
      '_blank',
      'noopener,noreferrer',
    );
  });

  it('degrada a descarga si el navegador bloquea la pestaña', async () => {
    window.open = vi.fn(() => null) as unknown as typeof window.open;

    await webFileSystem.openBlob(new Blob(['%PDF']), 'documento.pdf');

    // Preferimos que el usuario obtenga el archivo antes que un no-op mudo.
    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(ancla?.download).toBe('documento.pdf');
  });
});
