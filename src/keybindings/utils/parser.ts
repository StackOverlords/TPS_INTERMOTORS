/**
 * Utilidades para parsear y normalizar combinaciones de teclas
 */

/**
 * Normaliza una combinación de teclas a formato consistente
 * Ejemplo: "Ctrl+S" → "ctrl+s"
 */
export function normalizeKeys(keys: string): string {
  return keys
    .toLowerCase()
    .replace(/\s+/g, '')
    .split('+')
    .sort()
    .join('+');
}

/**
 * Verifica si dos combinaciones de teclas son equivalentes
 */
export function areKeysEqual(keys1: string, keys2: string): boolean {
  return normalizeKeys(keys1) === normalizeKeys(keys2);
}

/**
 * Parsea un evento de teclado a string de combinación
 */
export function parseKeyboardEvent(event: KeyboardEvent): string {
  const parts: string[] = [];

  if (event.ctrlKey || event.metaKey) parts.push('ctrl');
  if (event.altKey) parts.push('alt');
  if (event.shiftKey) parts.push('shift');

  // Agregar la tecla principal
  const key = event.key.toLowerCase();
  if (key !== 'control' && key !== 'alt' && key !== 'shift' && key !== 'meta') {
    parts.push(key);
  }

  return parts.join('+');
}

/**
 * Valida si una combinación de teclas es válida
 */
export function isValidKeyCombo(keys: string): boolean {
  if (!keys || typeof keys !== 'string') return false;

  const parts = keys.toLowerCase().split('+');

  // Debe tener al menos una tecla
  if (parts.length === 0) return false;

  // Validar que no haya modificadores duplicados
  const modifiers = ['ctrl', 'alt', 'shift', 'meta'];
  const foundModifiers = new Set<string>();

  for (const part of parts) {
    if (modifiers.includes(part)) {
      if (foundModifiers.has(part)) return false;
      foundModifiers.add(part);
    }
  }

  return true;
}

/**
 * Convierte una combinación de teclas a formato legible
 * Ejemplo: "ctrl+shift+s" → "Ctrl + Shift + S"
 */
export function formatKeysForDisplay(keys: string): string {
  return keys
    .split('+')
    .map(part => {
      const normalized = part.trim().toLowerCase();

      // Capitalizar modificadores conocidos
      if (normalized === 'ctrl') return 'Ctrl';
      if (normalized === 'alt') return 'Alt';
      if (normalized === 'shift') return 'Shift';
      if (normalized === 'meta') return 'Meta';

      // Capitalizar teclas normales
      return part.charAt(0).toUpperCase() + part.slice(1);
    })
    .join(' + ');
}

/**
 * Detecta si una combinación es reservada del sistema
 */
export function isSystemReserved(keys: string): boolean {
  const reserved = [
    'ctrl+c',
    'ctrl+v',
    'ctrl+x',
    'ctrl+z',
    'ctrl+y',
    'ctrl+a',
    'alt+f4',
    'ctrl+alt+delete',
  ];

  return reserved.includes(normalizeKeys(keys));
}
