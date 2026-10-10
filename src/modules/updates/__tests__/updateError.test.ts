import { describe, expect, it } from 'vitest';
import { describeUpdateError } from '../utils/updateError';
import { displayVersion } from '../utils/version';

describe('describeUpdateError', () => {
  it('usa el texto con que rechazan los comandos de Tauri (un string, no un Error)', () => {
    expect(describeUpdateError('error sending request for url (https://github.com/…)')).toBe(
      'error sending request for url (https://github.com/…)',
    );
  });

  it('usa el mensaje de un Error', () => {
    expect(describeUpdateError(new Error('signature mismatch'))).toBe('signature mismatch');
  });

  it('serializa objetos y cae a un texto genérico si no hay nada que mostrar', () => {
    expect(describeUpdateError({ code: 403 })).toBe('{"code":403}');
    expect(describeUpdateError({})).toBe('Error desconocido');
    expect(describeUpdateError('   ')).toBe('Error desconocido');
    expect(describeUpdateError(undefined)).toBe('Error desconocido');
  });
});

describe('displayVersion', () => {
  it('quita la "v" y la variante del tenant', () => {
    expect(displayVersion('v1.13.0-t1')).toBe('1.13.0');
    expect(displayVersion('1.13.0-t2')).toBe('1.13.0');
    expect(displayVersion('1.12.0')).toBe('1.12.0');
  });
});
