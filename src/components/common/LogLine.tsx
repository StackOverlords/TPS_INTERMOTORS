import { Button } from '@/components/atoms/button';
import { formatJSONSync, parseLogLineSync } from '@/utils/logFormatter';
import { Check, ChevronDown, ChevronRight, Copy } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface LogLineProps {
  line: string;
  index: number;
  className?: string;
}

/**
 * Componente que renderiza una línea de log con formato inteligente
 */
export function LogLine({ line, index, className = '' }: LogLineProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [copied, setCopied] = useState(false);

  // Parsear la línea para detectar tipo de contenido
  const parsed = useMemo(() => {
    try {
      return parseLogLineSync(line);
    } catch (error) {
      console.error('Error parsing log line:', error);
      return {
        type: 'plain' as const,
        content: line,
        rawContent: line,
      };
    }
  }, [line]);

  // Copiar contenido al clipboard
  const handleCopy = async () => {
    try {
      const textToCopy = parsed.type === 'json' || parsed.type === 'mixed'
        ? parsed.content
        : parsed.rawContent;

      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Error copying to clipboard:', error);
    }
  };

  // Obtener color según nivel de log
  const getLogLevelColor = (text: string): string => {
    if (text.includes('[ERROR')) return 'text-rose-400';
    if (text.includes('[WARN')) return 'text-amber-300';
    if (text.includes('[INFO')) return 'text-sky-300';
    if (text.includes('[DEBUG')) return 'text-zinc-500';
    return 'text-zinc-300';
  };

  // Renderizar texto plano normal
  if (parsed.type === 'plain') {
    return (
      <div className={`${getLogLevelColor(parsed.content)} ${className} group relative hover:bg-zinc-900/50 py-0.5 px-1 rounded transition-colors break-words whitespace-pre-wrap word-break-break-word`} style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
        {parsed.content}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopy}
          className="absolute right-1 top-0.5 opacity-0 group-hover:opacity-100 transition-opacity h-5 w-5 p-0"
        >
          {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-zinc-500" />}
        </Button>
      </div>
    );
  }

  // Renderizar stack trace / error
  if (parsed.type === 'error') {
    return (
      <div className={`text-rose-400/80 ${className} group relative hover:bg-rose-950/20 py-0.5 px-1 rounded transition-colors font-mono text-xs break-words`} style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
        {parsed.content}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopy}
          className="absolute right-1 top-0.5 opacity-0 group-hover:opacity-100 transition-opacity h-5 w-5 p-0"
        >
          {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-zinc-500" />}
        </Button>
      </div>
    );
  }

  // Renderizar logs estructurados (key=value pairs)
  if (parsed.type === 'structured' && parsed.structuredData) {
    const data = parsed.structuredData;
    const entries = Object.entries(data);

    // Detectar si hay SQL query
    const sqlKeys = ['db.statement', 'query', 'sql', 'statement'];
    const sqlEntry = entries.find(([key]) => sqlKeys.includes(key.toLowerCase()));

    return (
      <div className={`${className} group relative overflow-hidden`} style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
        <div className="flex flex-col gap-1 py-1">
          {/* Prefix (timestamps y tags) */}
          {parsed.prefix && (
            <div className="flex items-center gap-2">
              <span className={`${getLogLevelColor(parsed.prefix)} font-mono text-xs break-words`}>
                {parsed.prefix}
              </span>
              {/* Toggle collapse/expand */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="h-5 w-5 p-0 text-zinc-500 hover:text-zinc-300 flex-shrink-0"
              >
                {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
              </Button>
            </div>
          )}

          {/* Contenido estructurado */}
          <div className="w-full overflow-hidden">
            {isExpanded ? (
              <div className="relative bg-[#0f0f0f] rounded-md p-2 space-y-1 overflow-hidden">
                {entries.map(([key, value]) => {
                  const isSQLKey = sqlKeys.includes(key.toLowerCase());
                  const isMultiline = value.includes('\n');

                  return (
                    <div key={key} className="text-xs font-mono break-words" style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                      <span className="text-sky-400 font-semibold">{key}=</span>
                      {isSQLKey && isMultiline ? (
                        <pre className="text-zinc-300 bg-zinc-900/50 px-2 py-1 rounded text-[0.7rem] leading-relaxed whitespace-pre-wrap break-words mt-1">
                          {value}
                        </pre>
                      ) : isMultiline ? (
                        <pre className="text-zinc-300 bg-zinc-900/50 px-2 py-1 rounded text-[0.7rem] leading-relaxed whitespace-pre-wrap break-words mt-1">
                          {value}
                        </pre>
                      ) : (
                        <span className="text-zinc-300 break-words">{value}</span>
                      )}
                    </div>
                  );
                })}

                {/* Botón copiar */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopy}
                  className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0 bg-zinc-800/80 hover:bg-zinc-700"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-zinc-400" />}
                </Button>
              </div>
            ) : (
              <div className="text-zinc-500 text-xs bg-zinc-900/50 px-2 py-1 rounded inline-flex items-center gap-2 flex-wrap">
                <span className="text-zinc-400 font-mono">{'{key=value}'}</span>
                <span className="text-zinc-500">{entries.length} campos - Click para expandir</span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Renderizar JSON formateado (tipo 'json' o 'mixed')
  if (parsed.type === 'json' || parsed.type === 'mixed') {
    let formattedJSON: string;
    try {
      formattedJSON = formatJSONSync(parsed.content);
    } catch (error) {
      console.error('Error formatting JSON:', error);
      formattedJSON = parsed.content; // Fallback a contenido sin formatear
    }
    const lineCount = formattedJSON.split('\n').length;
    const shouldCollapse = lineCount > 5; // Colapsar si más de 5 líneas

    return (
      <div className={`${className} group relative overflow-hidden`} style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
        <div className="flex flex-col gap-1 py-1">
          {/* Prefix y toggle en la misma línea */}
          <div className="flex items-center gap-2 flex-wrap">
            {parsed.prefix && (
              <span className={`${getLogLevelColor(parsed.prefix)} break-words`}>
                {parsed.prefix}
              </span>
            )}
            {shouldCollapse && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="h-5 w-5 p-0 text-zinc-500 hover:text-zinc-300 flex-shrink-0"
              >
                {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
              </Button>
            )}
          </div>

          {/* Contenido JSON */}
          <div className="w-full overflow-hidden">
            {isExpanded ? (
              <div className="relative bg-[#0f0f0f] rounded-md p-2 overflow-hidden">
                <pre
                  className="text-xs font-mono text-emerald-300 whitespace-pre-wrap break-words"
                  style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}
                >
                  {formattedJSON}
                </pre>

                {/* Botón copiar */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopy}
                  className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0 bg-zinc-800/80 hover:bg-zinc-700"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-zinc-400" />}
                </Button>
              </div>
            ) : (
              <div className="text-zinc-500 text-xs bg-zinc-900/50 px-2 py-1 rounded inline-flex items-center gap-2 flex-wrap">
                <span className="text-zinc-400 font-mono">{'{...}'}</span>
                <span className="text-zinc-500">{lineCount} líneas - Click para expandir</span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Fallback
  return <div className={`${className} break-words`} style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}>{line}</div>;
}
