import prettier from 'prettier';

/**
 * Tipos de contenido que podemos detectar en logs
 */
export type LogContentType = 'plain' | 'json' | 'error' | 'mixed' | 'structured';

export interface ParsedLogContent {
  type: LogContentType;
  prefix?: string; // Ej: "[2024-01-01 10:30:45] [INFO]"
  content: string;
  formattedContent?: string; // Contenido formateado (si aplica)
  rawContent: string; // Contenido original sin formatear
  structuredData?: Record<string, string>; // Para logs con key=value pairs
}

/**
 * Desescapa un JSON string escapado
 * Ej: "{\n  \"key\": \"value\"\n}" -> "{\n  "key": "value"\n}"
 */
function unescapeJSONString(str: string): string {
  try {
    // Si está entre comillas, quitarlas primero
    let cleaned = str.trim();
    if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
      cleaned = cleaned.slice(1, -1);
    }

    // Reemplazar escapes comunes
    return cleaned
      .replace(/\\n/g, '\n')
      .replace(/\\r/g, '\r')
      .replace(/\\t/g, '\t')
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, '\\');
  } catch {
    return str;
  }
}

/**
 * Detecta si un string contiene JSON válido (incluyendo JSON escapado)
 */
function containsJSON(str: string): boolean {
  // Buscar patrones que sugieran JSON
  const jsonPatterns = [
    /\{[^{}]*"[^"]+"\s*:\s*[^}]*\}/,  // Objeto simple
    /\{[\s\S]*"[^"]+"\s*:\s*[\s\S]*\}/,  // Objeto complejo
    /\[[\s\S]*\{[\s\S]*\}[\s\S]*\]/,  // Array de objetos
    /"\\{[^}]*\\"/,  // JSON escapado como string
    /\|\s*"\\{/,  // Pipe seguido de JSON escapado
  ];

  return jsonPatterns.some(pattern => pattern.test(str));
}

/**
 * Extrae JSON de una línea de log (incluyendo JSON escapado)
 * Soporta formatos:
 * - "[INFO] User data: {...}"
 * - "[ERROR] Message | "{\n  \"key\": \"value\"\n}""
 * - "[ERROR] Message | {...}" (sin comillas)
 */
function extractJSON(line: string): { prefix: string; json: string } | null {
  // Caso 1: Detectar JSON con pipe separator (sin comillas)
  // Formato: "... | {...}" o "... | [{...}]"
  const pipeJSONMatch = line.match(/^(.+?)\s*\|\s*(\{[\s\S]*\}|\[[\s\S]*\])$/);
  if (pipeJSONMatch) {
    const prefix = pipeJSONMatch[1].trim();
    const jsonStr = pipeJSONMatch[2].trim();

    // Validar que sea JSON válido
    try {
      JSON.parse(jsonStr);
      return { prefix, json: jsonStr };
    } catch {
      // Si falla, intentar desescapar por si acaso
      try {
        const unescaped = unescapeJSONString(jsonStr);
        JSON.parse(unescaped);
        return { prefix, json: unescaped };
      } catch {
        // Continuar a otros casos
      }
    }
  }

  // Caso 2: Detectar JSON escapado con pipe separator (entre comillas)
  // Formato: "... | "{\n  \"key\": \"value\"\n}""
  const pipeQuotedMatch = line.match(/^(.+?)\s*\|\s*"(.+)"$/);
  if (pipeQuotedMatch) {
    const prefix = pipeQuotedMatch[1].trim();
    const escapedJSON = pipeQuotedMatch[2];

    // Desescapar el JSON
    const unescaped = unescapeJSONString(escapedJSON);

    // Validar que sea JSON válido
    try {
      JSON.parse(unescaped);
      return { prefix, json: unescaped };
    } catch {
      // Si falla, intentar con el contenido original
    }
  }

  // Caso 3: JSON escapado sin pipe (entre comillas)
  const quotedJSONMatch = line.match(/^(.+?)\s*"(\\?\{[\s\S]*\\?\})"$/);
  if (quotedJSONMatch) {
    const prefix = quotedJSONMatch[1].trim();
    const escapedJSON = quotedJSONMatch[2];
    const unescaped = unescapeJSONString(escapedJSON);

    try {
      JSON.parse(unescaped);
      return { prefix, json: unescaped };
    } catch {
      // Si falla, continuar
    }
  }

  // Caso 4: JSON normal (sin escapar, sin pipe)
  const jsonMatch = line.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
  if (!jsonMatch) return null;

  const jsonStr = jsonMatch[0];
  const prefix = line.substring(0, jsonMatch.index).trim();

  // Validar que sea JSON válido
  try {
    JSON.parse(jsonStr);
    return { prefix, json: jsonStr };
  } catch {
    return null;
  }
}

/**
 * Formatea JSON usando Prettier
 */
async function formatJSON(jsonStr: string): Promise<string> {
  try {
    const formatted = await prettier.format(jsonStr, {
      parser: 'json',
      printWidth: 80,
      tabWidth: 2,
      semi: false,
      singleQuote: true,
    });
    return formatted.trim();
  } catch (error) {
    console.error('Error formatting JSON:', error);
    return jsonStr; // Retornar sin formatear si falla
  }
}

/**
 * Detecta si una línea es un stack trace o error
 */
function isErrorTrace(line: string): boolean {
  const errorPatterns = [
    /^\s+at\s+/,  // Stack trace: "  at Function.name"
    /^\s+in\s+/,  // React stack: "  in Component"
    /Error:\s+/,  // "Error: message"
    /Exception:\s+/,  // "Exception: message"
    /^\s+\w+Error:/,  // "  TypeError:"
  ];

  return errorPatterns.some(pattern => pattern.test(line));
}

/**
 * Detecta si un log tiene formato estructurado (key=value pairs)
 * Ej: 'summary="..." db.statement="..." rows_affected=0'
 */
function isStructuredLog(line: string): boolean {
  // Debe tener al menos 2 pares key=value
  const kvPattern = /\w+=/g;
  const matches = line.match(kvPattern);
  return matches !== null && matches.length >= 2;
}

/**
 * Parsea un log estructurado en pares clave-valor
 * Maneja valores entre comillas con escapes (\n, etc.)
 */
function parseStructuredLog(line: string): { prefix: string; data: Record<string, string> } | null {
  // Buscar donde empiezan los key=value (después de los tags)
  const firstKVMatch = line.match(/\w+=/);
  if (!firstKVMatch) return null;

  const prefix = line.substring(0, firstKVMatch.index).trim();
  const kvSection = line.substring(firstKVMatch.index!);

  const data: Record<string, string> = {};

  // Regex para capturar key="value" o key=value
  // Soporta valores entre comillas con escapes
  const kvRegex = /(\w+(?:\.\w+)*)=("(?:[^"\\]|\\.)*"|[^\s]+)/g;
  let match;

  while ((match = kvRegex.exec(kvSection)) !== null) {
    const key = match[1];
    let value = match[2];

    // Si está entre comillas, quitarlas y desescapar
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1);
      value = unescapeJSONString(value);
    }

    data[key] = value;
  }

  return Object.keys(data).length > 0 ? { prefix, data } : null;
}

/**
 * Analiza una línea de log y determina su tipo y contenido
 */
export async function parseLogLine(line: string): Promise<ParsedLogContent> {
  const trimmedLine = line.trim();

  // Si la línea está vacía
  if (!trimmedLine) {
    return {
      type: 'plain',
      content: line,
      rawContent: line,
    };
  }

  // Detectar errores/stack traces
  if (isErrorTrace(trimmedLine)) {
    return {
      type: 'error',
      content: trimmedLine,
      rawContent: line,
    };
  }

  // Detectar logs estructurados (key=value pairs) ANTES de JSON
  // Esto es importante porque algunos logs estructurados pueden contener JSON como valor
  if (isStructuredLog(trimmedLine)) {
    const parsed = parseStructuredLog(trimmedLine);

    if (parsed && Object.keys(parsed.data).length > 0) {
      return {
        type: 'structured',
        prefix: parsed.prefix,
        content: trimmedLine,
        rawContent: line,
        structuredData: parsed.data,
      };
    }
  }

  // Detectar JSON
  if (containsJSON(trimmedLine)) {
    const extracted = extractJSON(trimmedLine);

    if (extracted) {
      const formatted = await formatJSON(extracted.json);

      return {
        type: extracted.prefix ? 'mixed' : 'json',
        prefix: extracted.prefix || undefined,
        content: extracted.json,
        formattedContent: formatted,
        rawContent: line,
      };
    }
  }

  // Por defecto, es texto plano
  return {
    type: 'plain',
    content: trimmedLine,
    rawContent: line,
  };
}

/**
 * Procesa múltiples líneas de log
 */
export async function parseLogLines(lines: string[]): Promise<ParsedLogContent[]> {
  return Promise.all(lines.map(line => parseLogLine(line)));
}

/**
 * Versión síncrona (sin formateo) para uso en render
 * Útil cuando no queremos async en el render loop
 */
export function parseLogLineSync(line: string): Omit<ParsedLogContent, 'formattedContent'> {
  const trimmedLine = line.trim();

  if (!trimmedLine) {
    return {
      type: 'plain',
      content: line,
      rawContent: line,
    };
  }

  if (isErrorTrace(trimmedLine)) {
    return {
      type: 'error',
      content: trimmedLine,
      rawContent: line,
    };
  }

  // Detectar logs estructurados primero
  if (isStructuredLog(trimmedLine)) {
    const parsed = parseStructuredLog(trimmedLine);

    if (parsed && Object.keys(parsed.data).length > 0) {
      return {
        type: 'structured',
        prefix: parsed.prefix,
        content: trimmedLine,
        rawContent: line,
        structuredData: parsed.data,
      };
    }
  }

  if (containsJSON(trimmedLine)) {
    const extracted = extractJSON(trimmedLine);

    if (extracted) {
      return {
        type: extracted.prefix ? 'mixed' : 'json',
        prefix: extracted.prefix || undefined,
        content: extracted.json,
        rawContent: line,
      };
    }
  }

  return {
    type: 'plain',
    content: trimmedLine,
    rawContent: line,
  };
}

/**
 * Formatea JSON de forma síncrona (sin Prettier, solo pretty-print básico)
 */
export function formatJSONSync(jsonStr: string): string {
  try {
    const parsed = JSON.parse(jsonStr);
    return JSON.stringify(parsed, null, 2);
  } catch {
    return jsonStr;
  }
}
