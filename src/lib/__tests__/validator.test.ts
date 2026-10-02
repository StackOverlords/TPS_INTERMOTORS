import { z } from 'zod';
import { describe, expect, it, vi } from 'vitest';

vi.mock('../schemaTransformer', async (importOriginal) => {
  const original = await importOriginal<typeof import('../schemaTransformer')>();
  return { withFallbacks: vi.fn(original.withFallbacks) };
});

const { Validator } = await import('../validator');
const { withFallbacks } = await import('../schemaTransformer');

describe('Validator', () => {
  const schema = z.object({ id: z.number(), nombre: z.string() });

  it('transforma cada schema una sola vez, no en cada respuesta', () => {
    Validator.validate(schema, { id: 1, nombre: 'Filtro' });
    Validator.validate(schema, { id: 2, nombre: 'Bujía' });
    Validator.validate(schema, { id: 3, nombre: 'Pastilla' });

    expect(withFallbacks).toHaveBeenCalledTimes(1);
  });

  it('mantiene los fallbacks para nulls del backend', () => {
    expect(Validator.validate(schema, { id: null, nombre: null })).toEqual({
      id: 0,
      nombre: 'N/A',
    });
  });
});
