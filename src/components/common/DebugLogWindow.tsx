import { Button } from '@/components/atoms/button';
import { Input } from '@/components/atoms/input';
import { ScrollArea } from '@/components/atoms/scroll-area';
import { appLogDir } from '@tauri-apps/api/path';
import { save } from '@tauri-apps/plugin-dialog';
import { BaseDirectory, readTextFile, writeTextFile } from '@tauri-apps/plugin-fs';
import { ArrowUpDown, RefreshCw, Search, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { LogLine } from './LogLine';

type LogLevel = 'ALL' | 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';

interface SystemStats {
  memoryUsage: number;
  cpuUsage: number;
}

export function DebugLogWindow() {
  const [logs, setLogs] = useState<string>('Cargando logs...');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [logPath, setLogPath] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<LogLevel>('ALL');
  const [reverseOrder, setReverseOrder] = useState(false);
  const [maxLines, setMaxLines] = useState(1000);
  const [systemStats, setSystemStats] = useState<SystemStats>({ memoryUsage: 0, cpuUsage: 0 });

  const loadLogs = async () => {
    try {
      const logDir = await appLogDir();
      const logFileName = 'app.log';
      setLogPath(`${logDir}/${logFileName}`);

      const logContent = await readTextFile(logFileName, {
        baseDir: BaseDirectory.AppLog
      });

      setLogs(logContent || 'No hay logs disponibles');
    } catch (error) {
      const errorStr = String(error);

      if (errorStr.includes('No existe el fichero') || errorStr.includes('No such file') || errorStr.includes('os error 2')) {
        setLogs(`📝 Archivo de logs aún no creado.\n\n` +
                `El archivo se creará automáticamente cuando se genere el primer log.\n\n` +
                `💡 Prueba realizar alguna acción en la app (login, cargar datos, etc.) ` +
                `y luego presiona el botón "Refresh" para ver los logs.\n\n` +
                `📂 Ubicación: ${logPath || 'Calculando...'}`);
      } else {
        setLogs(`❌ Error cargando logs: ${errorStr}\n\n` +
                `📂 Ruta: ${logPath || 'Calculando...'}\n\n` +
                `💡 Si el error persiste, verifica los permisos del sistema.`);
      }
    }
  };

  const clearLogs = async () => {
    try {
      await writeTextFile('app.log', '', {
        baseDir: BaseDirectory.AppLog
      });
      setLogs('✅ Logs limpiados correctamente');
      setTimeout(loadLogs, 500);
    } catch (error) {
      setLogs(`❌ Error limpiando logs: ${error}`);
    }
  };

  const downloadLogs = async () => {
    try {
      // Usar logs filtrados (lo que el usuario está viendo)
      const logsToDownload = processedLogs.lines.join('\n');

      if (!logsToDownload || logsToDownload.length === 0) {
        console.error('No logs to download');
        return;
      }

      // Generar nombre de archivo con timestamp y filtros aplicados
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('.')[0];
      let fileName = `app-logs-${timestamp}`;

      // Agregar nivel al nombre si hay filtro activo
      if (selectedLevel !== 'ALL') {
        fileName += `-${selectedLevel}`;
      }

      // Agregar indicador de búsqueda si hay filtro de texto
      if (searchTerm) {
        fileName += `-search`;
      }

      fileName += '.txt';

      // Abrir diálogo nativo "Guardar como"
      const filePath = await save({
        defaultPath: fileName,
        filters: [
          {
            name: 'Text Files',
            extensions: ['txt']
          },
          {
            name: 'All Files',
            extensions: ['*']
          }
        ]
      });

      // Si el usuario canceló, no hacer nada
      if (!filePath) {
        console.log('Download cancelled by user');
        return;
      }

      // Crear header con información de los filtros
      let header = `# TPS Intermotors - Log Export\n`;
      header += `# Export Date: ${new Date().toLocaleString()}\n`;
      header += `# Total Lines: ${processedLogs.lines.length}\n`;
      header += `# Level Filter: ${selectedLevel}\n`;
      if (searchTerm) {
        header += `# Search Term: "${searchTerm}"\n`;
      }
      header += `# Stats: INFO=${processedLogs.stats.info}, WARN=${processedLogs.stats.warn}, ERROR=${processedLogs.stats.error}, DEBUG=${processedLogs.stats.debug}\n`;
      header += `#${'='.repeat(80)}\n\n`;

      const finalContent = header + logsToDownload;

      // Guardar el archivo en la ruta seleccionada
      await writeTextFile(filePath, finalContent);

      console.log('Filtered logs saved successfully to:', filePath);
    } catch (error) {
      console.error('Error downloading logs:', error);
    }
  };

  // Cargar stats del sistema
  const loadSystemStats = async () => {
    try {
      // Memoria usada por el proceso (aproximado usando performance API)
      if (performance && (performance as any).memory) {
        const memory = (performance as any).memory;
        const usedMemoryMB = memory.usedJSHeapSize / 1048576; // Convertir a MB
        setSystemStats(prev => ({ ...prev, memoryUsage: usedMemoryMB }));
      }
    } catch (error) {
      console.error('Error loading system stats:', error);
    }
  };

  // Procesar y filtrar logs
  const processedLogs = useMemo(() => {
    if (!logs || logs.startsWith('📝') || logs.startsWith('❌') || logs.startsWith('✅')) {
      return { lines: [logs], stats: { total: 0, info: 0, warn: 0, error: 0, debug: 0 } };
    }

    let lines = logs.split('\n').filter(line => line.trim());

    // Estadísticas de logs
    const stats = {
      total: lines.length,
      info: lines.filter(l => l.includes('[INFO')).length,
      warn: lines.filter(l => l.includes('[WARN')).length,
      error: lines.filter(l => l.includes('[ERROR')).length,
      debug: lines.filter(l => l.includes('[DEBUG')).length,
    };

    // Filtrar por nivel
    if (selectedLevel !== 'ALL') {
      lines = lines.filter(line => line.includes(`[${selectedLevel}`));
    }

    // Filtrar por búsqueda
    if (searchTerm) {
      lines = lines.filter(line =>
        line.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Limitar líneas
    if (lines.length > maxLines) {
      lines = lines.slice(-maxLines);
    }

    // Invertir orden si está activo
    if (reverseOrder) {
      lines = [...lines].reverse();
    }

    return { lines, stats };
  }, [logs, selectedLevel, searchTerm, maxLines, reverseOrder]);

  // Auto-refresh cada 2 segundos si está activado
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        loadLogs();
        loadSystemStats();
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  // Cargar logs al montar
  useEffect(() => {
    loadLogs();
    loadSystemStats();
  }, []);

  const logLevels: LogLevel[] = ['ALL', 'INFO', 'WARN', 'ERROR', 'DEBUG'];

  return (
    <div className="h-screen w-full bg-[#0a0a0a] flex flex-col">
      {/* Header */}
      <div className="flex flex-col p-3 sm:p-4 border-b border-zinc-800 bg-[#111111]">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0 mb-3">
          <div className="min-w-0 flex-1">
            <h2 className="text-base sm:text-lg font-semibold text-zinc-100">Debug Console</h2>
            <p className="text-[10px] sm:text-xs text-zinc-500 mt-0.5 font-mono truncate">{logPath}</p>
          </div>
          <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap">
            <Button
              variant="ghost"
              size="sm"
              className='text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 h-7 sm:h-8 px-2 sm:px-3 text-xs'
              onClick={loadLogs}
            >
              <RefreshCw className="w-3 h-3 sm:w-3.5 sm:h-3.5 sm:mr-1.5" />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={`h-7 sm:h-8 px-2 sm:px-3 text-xs ${autoRefresh ? 'text-emerald-400 bg-emerald-950/30 hover:bg-emerald-950/50' : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800'}`}
              onClick={() => setAutoRefresh(!autoRefresh)}
            >
              Auto <span className="hidden xs:inline">{autoRefresh ? 'ON' : 'OFF'}</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className='text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 h-7 sm:h-8 px-2 sm:px-3 text-xs'
              onClick={downloadLogs}
            >
              Download
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className='text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 h-7 sm:h-8 px-2 sm:px-3 text-xs'
              onClick={clearLogs}
            >
              <Trash2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 sm:mr-1.5" />
              <span className="hidden sm:inline">Clear</span>
            </Button>
          </div>
        </div>

        {/* Filtros y búsqueda */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          {/* Búsqueda */}
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-2.5 sm:left-3 top-1/2 transform -translate-y-1/2 w-3 h-3 sm:w-3.5 sm:h-3.5 text-zinc-500" />
            <Input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 sm:pl-9 bg-zinc-900 border-zinc-800 text-zinc-100 placeholder-zinc-600 h-7 sm:h-8 text-xs sm:text-sm focus:border-zinc-700 focus:ring-1 focus:ring-zinc-700"
            />
          </div>

          {/* Filtro de nivel - Scrollable en móvil */}
          <div className="flex items-center gap-0.5 bg-zinc-900 rounded-lg p-0.5 border border-zinc-800 overflow-x-auto scrollbar-hide">
            {logLevels.map(level => (
              <Button
                key={level}
                variant="ghost"
                size="sm"
                onClick={() => setSelectedLevel(level)}
                className={`h-6 sm:h-7 px-2 sm:px-2.5 text-[10px] sm:text-xs font-medium transition-all whitespace-nowrap flex-shrink-0 ${
                  selectedLevel === level
                    ? level === 'ERROR' ? 'bg-rose-500/20 text-rose-400 hover:bg-rose-500/30'
                      : level === 'WARN' ? 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30'
                      : level === 'INFO' ? 'bg-sky-500/20 text-sky-400 hover:bg-sky-500/30'
                      : level === 'DEBUG' ? 'bg-zinc-600/20 text-zinc-400 hover:bg-zinc-600/30'
                      : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                    : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800'
                }`}
              >
                {level}
              </Button>
            ))}
          </div>

          {/* Controles adicionales */}
          <div className="flex items-center gap-1.5">
            {/* Orden inverso */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setReverseOrder(!reverseOrder)}
              className={`h-7 sm:h-8 px-2 sm:px-2.5 transition-all ${reverseOrder ? 'text-emerald-400 bg-emerald-950/30' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800'}`}
              title={reverseOrder ? 'Logs más recientes arriba' : 'Logs más antiguos arriba'}
            >
              <ArrowUpDown className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            </Button>

            {/* Límite de líneas */}
            <select
              value={maxLines}
              onChange={(e) => setMaxLines(Number(e.target.value))}
              className="h-7 sm:h-8 px-1.5 sm:px-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-[10px] sm:text-xs font-medium focus:border-zinc-700 focus:ring-1 focus:ring-zinc-700 focus:outline-none"
            >
              <option value={100}>100</option>
              <option value={500}>500</option>
              <option value={1000}>1K</option>
              <option value={5000}>5K</option>
              <option value={-1}>All</option>
            </select>
          </div>
        </div>

        {/* Stats - Scrollable en móvil */}
        <div className="flex items-center gap-2 sm:gap-3 mt-2.5 sm:mt-3 text-[10px] sm:text-xs overflow-x-auto scrollbar-hide pb-1">
          <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0">
            <span className="text-zinc-500 text-[10px] sm:text-xs">Total</span>
            <span className="text-zinc-200 font-semibold tabular-nums">{processedLogs.stats.total}</span>
          </div>
          {processedLogs.stats.info > 0 && (
            <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0">
              <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-sky-400"></div>
              <span className="text-zinc-500 hidden sm:inline">INFO</span>
              <span className="text-sky-400 font-semibold tabular-nums">{processedLogs.stats.info}</span>
            </div>
          )}
          {processedLogs.stats.warn > 0 && (
            <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0">
              <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-amber-400"></div>
              <span className="text-zinc-500 hidden sm:inline">WARN</span>
              <span className="text-amber-400 font-semibold tabular-nums">{processedLogs.stats.warn}</span>
            </div>
          )}
          {processedLogs.stats.error > 0 && (
            <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0">
              <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-rose-400"></div>
              <span className="text-zinc-500 hidden sm:inline">ERROR</span>
              <span className="text-rose-400 font-semibold tabular-nums">{processedLogs.stats.error}</span>
            </div>
          )}
          {processedLogs.stats.debug > 0 && (
            <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0">
              <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-zinc-500"></div>
              <span className="text-zinc-500 hidden sm:inline">DEBUG</span>
              <span className="text-zinc-400 font-semibold tabular-nums">{processedLogs.stats.debug}</span>
            </div>
          )}
          <div className="ml-auto flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <div className="flex items-center gap-1 sm:gap-1.5">
              <span className="text-zinc-500">Showing</span>
              <span className="text-zinc-200 font-semibold tabular-nums">{processedLogs.lines.length}</span>
            </div>
            {systemStats.memoryUsage > 0 && (
              <div className="flex items-center gap-1 sm:gap-1.5">
                <span className="text-zinc-500 hidden xs:inline">Memory</span>
                <span className="text-emerald-400 font-semibold tabular-nums">{systemStats.memoryUsage.toFixed(2)}<span className="hidden xs:inline"> MB</span></span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Contenido de logs */}
      <ScrollArea className="flex-1 p-2 sm:p-3 md:p-4 bg-[#0a0a0a]">
        <div className="space-y-1">
          {processedLogs.lines.map((line, index) => (
            <LogLine key={index} line={line} index={index} />
          ))}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="px-3 sm:px-4 py-2 sm:py-2.5 border-t border-zinc-800 bg-[#111111]">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1.5 sm:gap-0 text-[10px] sm:text-xs">
          <div className="flex items-center gap-1.5 sm:gap-2 text-zinc-500 overflow-x-auto scrollbar-hide w-full sm:w-auto">
            <span className={`flex-shrink-0 ${autoRefresh ? 'text-emerald-400' : ''}`}>
              {autoRefresh ? '● Live' : '○ Paused'}
            </span>
            {searchTerm && (
              <>
                <span className="text-zinc-700 flex-shrink-0">|</span>
                <span className="truncate">Search: <span className="text-zinc-300">"{searchTerm}"</span></span>
              </>
            )}
            {selectedLevel !== 'ALL' && (
              <>
                <span className="text-zinc-700 flex-shrink-0">|</span>
                <span className="flex-shrink-0">Filter: <span className="text-zinc-300">{selectedLevel}</span></span>
              </>
            )}
          </div>
          <span className="text-zinc-500 hidden sm:block flex-shrink-0">
            Press <kbd className="px-1.5 py-0.5 bg-zinc-800 border border-zinc-700 rounded text-zinc-400 font-mono text-[10px]">Ctrl</kbd>
            {' + '}
            <kbd className="px-1.5 py-0.5 bg-zinc-800 border border-zinc-700 rounded text-zinc-400 font-mono text-[10px]">Shift</kbd>
            {' + '}
            <kbd className="px-1.5 py-0.5 bg-zinc-800 border border-zinc-700 rounded text-zinc-400 font-mono text-[10px]">D</kbd>
            {' '}to toggle
          </span>
        </div>
      </div>
    </div>
  );
}
