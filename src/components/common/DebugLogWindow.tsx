import { Button } from '@/components/atoms/button';
import { Input } from '@/components/atoms/input';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/atoms/resizable';
import { getFileSystem, getLogger } from '@/platform';
import { ArrowUpDown, PanelRightClose, PanelRightOpen, RefreshCw, Search, Trash2, Wifi, WifiOff } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { LogLine } from './LogLine';

type LogLevel = 'ALL' | 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';

interface SystemStats {
  memoryUsage: number;
  cpuUsage: number;
}

// Patrones para identificar logs de WebSocket
const WS_PATTERNS = ['[WEBSOCKET]', '[WS_CONTEXT]'];

export function DebugLogWindow() {
  const [logs, setLogs] = useState<string>('Cargando logs...');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [logPath, setLogPath] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [wsSearchTerm, setWsSearchTerm] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<LogLevel>('ALL');
  const [reverseOrder, setReverseOrder] = useState(false);
  const [maxLines, setMaxLines] = useState(1000);
  const [systemStats, setSystemStats] = useState<SystemStats>({ memoryUsage: 0, cpuUsage: 0 });
  const [showWsPanel, setShowWsPanel] = useState(true);
  const [excludeWsFromMain, setExcludeWsFromMain] = useState(true);
  const [wsReverseOrder, setWsReverseOrder] = useState(true); // Por defecto, más recientes arriba

  const loadLogs = async () => {
    try {
      const logger = getLogger();

      // En web no hay archivo: el log vive en memoria y `getLogLocation()`
      // devuelve null.
      const location = await logger.getLogLocation();
      setLogPath(location ?? 'En memoria (se pierde al recargar la página)');

      const logContent = await logger.readLogText();

      if (!logContent) {
        setLogs(`📝 Todavía no hay logs registrados.\n\n` +
                `Se irán acumulando a medida que la app genere actividad.\n\n` +
                `💡 Prueba realizar alguna acción (login, cargar datos, etc.) ` +
                `y luego presiona el botón "Refresh".\n\n` +
                `📂 Ubicación: ${location ?? 'memoria'}`);
        return;
      }

      setLogs(logContent);
    } catch (error) {
      setLogs(`❌ Error cargando logs: ${String(error)}\n\n` +
              `📂 Ruta: ${logPath || 'Calculando...'}\n\n` +
              `💡 Si el error persiste, verifica los permisos del sistema.`);
    }
  };

  const clearLogs = async () => {
    try {
      await getLogger().clearLogs();
      setLogs('✅ Logs limpiados correctamente');
      setTimeout(loadLogs, 500);
    } catch (error) {
      setLogs(`❌ Error limpiando logs: ${error}`);
    }
  };

  const downloadLogs = async () => {
    try {
      const logsToDownload = processedLogs.lines.join('\n');

      if (!logsToDownload || logsToDownload.length === 0) {
        console.error('No logs to download');
        return;
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('.')[0];
      let fileName = `app-logs-${timestamp}`;

      if (selectedLevel !== 'ALL') {
        fileName += `-${selectedLevel}`;
      }

      if (searchTerm) {
        fileName += `-search`;
      }

      fileName += '.txt';

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

      const { saved } = await getFileSystem().saveFile({
        suggestedName: fileName,
        data: finalContent,
        mimeType: 'text/plain;charset=utf-8',
        extensions: ['txt'],
        filterName: 'Text Files',
      });

      if (!saved) {
        console.log('Download cancelled by user');
        return;
      }

      console.log('Filtered logs saved successfully as:', fileName);
    } catch (error) {
      console.error('Error downloading logs:', error);
    }
  };

  const loadSystemStats = async () => {
    try {
      if (performance && (performance as any).memory) {
        const memory = (performance as any).memory;
        const usedMemoryMB = memory.usedJSHeapSize / 1048576;
        setSystemStats(prev => ({ ...prev, memoryUsage: usedMemoryMB }));
      }
    } catch (error) {
      console.error('Error loading system stats:', error);
    }
  };

  // Función helper para detectar si una línea es de WebSocket
  const isWebSocketLog = (line: string): boolean => {
    return WS_PATTERNS.some(pattern => line.includes(pattern));
  };

  // Procesar y filtrar logs generales (excluyendo WebSocket si está activo)
  const processedLogs = useMemo(() => {
    if (!logs || logs.startsWith('📝') || logs.startsWith('❌') || logs.startsWith('✅')) {
      return { lines: [logs], stats: { total: 0, info: 0, warn: 0, error: 0, debug: 0, websocket: 0 } };
    }

    let lines = logs.split('\n').filter(line => line.trim());

    // Estadísticas de todos los logs
    const stats = {
      total: lines.length,
      info: lines.filter(l => l.includes('[INFO')).length,
      warn: lines.filter(l => l.includes('[WARN')).length,
      error: lines.filter(l => l.includes('[ERROR')).length,
      debug: lines.filter(l => l.includes('[DEBUG')).length,
      websocket: lines.filter(l => isWebSocketLog(l)).length,
    };

    // Excluir WebSocket del panel principal si está activo
    if (excludeWsFromMain) {
      lines = lines.filter(line => !isWebSocketLog(line));
    }

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
    if (maxLines > 0 && lines.length > maxLines) {
      lines = lines.slice(-maxLines);
    }

    // Invertir orden si está activo
    if (reverseOrder) {
      lines = [...lines].reverse();
    }

    return { lines, stats };
  }, [logs, selectedLevel, searchTerm, maxLines, reverseOrder, excludeWsFromMain]);

  // Procesar logs de WebSocket exclusivamente
  const wsLogs = useMemo(() => {
    if (!logs || logs.startsWith('📝') || logs.startsWith('❌') || logs.startsWith('✅')) {
      return { lines: [], stats: { total: 0, connected: 0, events: 0, errors: 0 } };
    }

    let lines = logs.split('\n').filter(line => line.trim() && isWebSocketLog(line));

    // Estadísticas de WebSocket
    const stats = {
      total: lines.length,
      connected: lines.filter(l => l.toLowerCase().includes('conectado') || l.toLowerCase().includes('connected') || l.toLowerCase().includes('conexión establecida')).length,
      events: lines.filter(l => l.toLowerCase().includes('evento recibido') || l.toLowerCase().includes('event received')).length,
      errors: lines.filter(l => l.includes('[ERROR') || l.toLowerCase().includes('error') || l.toLowerCase().includes('failed')).length,
    };

    // Filtrar por búsqueda de WebSocket
    if (wsSearchTerm) {
      lines = lines.filter(line =>
        line.toLowerCase().includes(wsSearchTerm.toLowerCase())
      );
    }

    // Limitar a últimas 500 líneas para WebSocket
    if (lines.length > 500) {
      lines = lines.slice(-500);
    }

    // Ordenar según preferencia del usuario
    if (wsReverseOrder) {
      lines = [...lines].reverse();
    }

    return { lines, stats };
  }, [logs, wsSearchTerm, wsReverseOrder]);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        loadLogs();
        loadSystemStats();
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

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
            {/* Toggle WebSocket Panel */}
            <Button
              variant="ghost"
              size="sm"
              className={`h-7 sm:h-8 px-2 sm:px-3 text-xs ${showWsPanel ? 'text-violet-400 bg-violet-950/30 hover:bg-violet-950/50' : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800'}`}
              onClick={() => setShowWsPanel(!showWsPanel)}
              title={showWsPanel ? 'Ocultar panel WebSocket' : 'Mostrar panel WebSocket'}
            >
              {showWsPanel ? <PanelRightClose className="w-3.5 h-3.5" /> : <PanelRightOpen className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline ml-1.5">WS</span>
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
              placeholder="Search logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 sm:pl-9 bg-zinc-900 border-zinc-800 text-zinc-100 placeholder-zinc-600 h-7 sm:h-8 text-xs sm:text-sm focus:border-zinc-700 focus:ring-1 focus:ring-zinc-700"
            />
          </div>

          {/* Filtro de nivel */}
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
            {/* Toggle excluir WS del main */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExcludeWsFromMain(!excludeWsFromMain)}
              className={`h-7 sm:h-8 px-2 sm:px-2.5 transition-all text-[10px] sm:text-xs ${excludeWsFromMain ? 'text-violet-400 bg-violet-950/30' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800'}`}
              title={excludeWsFromMain ? 'WebSocket excluido del panel principal' : 'WebSocket incluido en panel principal'}
            >
              {excludeWsFromMain ? <WifiOff className="w-3 h-3" /> : <Wifi className="w-3 h-3" />}
            </Button>

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
              className="h-7 sm:h-8 px-1.5 sm:px-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-[10px] sm:text-xs font-medium focus:border-zinc-700 focus:ring-1 focus:ring-zinc-700 focus:outline-none text-zinc-300"
            >
              <option value={100}>100</option>
              <option value={500}>500</option>
              <option value={1000}>1K</option>
              <option value={5000}>5K</option>
              <option value={-1}>All</option>
            </select>
          </div>
        </div>

        {/* Stats */}
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
          {processedLogs.stats.websocket > 0 && (
            <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0">
              <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-violet-400"></div>
              <span className="text-zinc-500 hidden sm:inline">WS</span>
              <span className="text-violet-400 font-semibold tabular-nums">{processedLogs.stats.websocket}</span>
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

      {/* Contenido principal - Dos columnas resizables */}
      {showWsPanel ? (
        <ResizablePanelGroup direction="horizontal" className="flex-1">
          {/* Panel izquierdo - Logs generales */}
          <ResizablePanel defaultSize={65} minSize={30}>
            <div className="h-full overflow-y-auto bg-[#0a0a0a] p-2 sm:p-3 md:p-4">
              <div className="space-y-1">
                {processedLogs.lines.map((line, index) => (
                  <div key={index} className="break-words overflow-hidden">
                    <LogLine line={line} index={index} />
                  </div>
                ))}
              </div>
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle className="bg-violet-900/30 hover:bg-violet-700/50 transition-colors" />

          {/* Panel derecho - WebSocket */}
          <ResizablePanel defaultSize={35} minSize={20} maxSize={60}>
            <div className="h-full flex flex-col bg-[#080810]">
              {/* Header WebSocket */}
              <div className="p-3 border-b border-violet-900/30 bg-violet-950/20 flex-shrink-0">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <Wifi className="w-4 h-4 text-violet-400 flex-shrink-0" />
                    <h3 className="text-sm font-semibold text-violet-300 truncate">WebSocket Logs</h3>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] flex-shrink-0">
                    <span className="text-zinc-500">Events</span>
                    <span className="text-violet-400 font-semibold">{wsLogs.stats.events}</span>
                    {wsLogs.stats.errors > 0 && (
                      <>
                        <span className="text-zinc-600">|</span>
                        <span className="text-rose-400 font-semibold">{wsLogs.stats.errors} err</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Búsqueda WebSocket */}
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-3 h-3 text-violet-500/50" />
                  <Input
                    type="text"
                    placeholder="Search WebSocket logs..."
                    value={wsSearchTerm}
                    onChange={(e) => setWsSearchTerm(e.target.value)}
                    className="pl-8 bg-violet-950/30 border-violet-900/50 text-violet-100 placeholder-violet-500/50 h-7 text-xs focus:border-violet-700 focus:ring-1 focus:ring-violet-700"
                  />
                </div>

                {/* Stats y controles WebSocket */}
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-3 text-[10px]">
                    <div className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0"></div>
                      <span className="text-zinc-500">Connected</span>
                      <span className="text-emerald-400 font-semibold">{wsLogs.stats.connected}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-violet-400 flex-shrink-0"></div>
                      <span className="text-zinc-500">Total</span>
                      <span className="text-violet-400 font-semibold">{wsLogs.stats.total}</span>
                    </div>
                  </div>
                  {/* Botón ordenar */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setWsReverseOrder(!wsReverseOrder)}
                    className={`h-6 px-2 transition-all text-[10px] ${wsReverseOrder ? 'text-violet-400 bg-violet-950/30' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800'}`}
                    title={wsReverseOrder ? 'Más recientes arriba' : 'Más antiguos arriba'}
                  >
                    <ArrowUpDown className="w-3 h-3 mr-1" />
                    {wsReverseOrder ? 'Nuevos' : 'Antiguos'}
                  </Button>
                </div>
              </div>

              {/* Contenido WebSocket */}
              <div className="flex-1 overflow-y-auto p-2">
                {wsLogs.lines.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center p-4">
                    <WifiOff className="w-8 h-8 text-violet-500/30 mb-2" />
                    <p className="text-violet-500/50 text-xs">No WebSocket logs yet</p>
                    <p className="text-violet-500/30 text-[10px] mt-1">Logs will appear here when WebSocket events occur</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {wsLogs.lines.map((line, index) => (
                      <div key={index} className="break-words overflow-hidden">
                        <LogLine line={line} index={index} className="text-[11px]" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      ) : (
        /* Panel único cuando WS está oculto */
        <div className="flex-1 overflow-y-auto bg-[#0a0a0a] p-2 sm:p-3 md:p-4">
          <div className="space-y-1">
            {processedLogs.lines.map((line, index) => (
              <div key={index} className="break-words overflow-hidden">
                <LogLine line={line} index={index} />
              </div>
            ))}
          </div>
        </div>
      )}

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
            {excludeWsFromMain && (
              <>
                <span className="text-zinc-700 flex-shrink-0">|</span>
                <span className="flex-shrink-0 text-violet-400">WS excluded</span>
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
