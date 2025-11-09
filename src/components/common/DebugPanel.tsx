// import { useState, useEffect } from 'react';
// import { BaseDirectory, readTextFile, writeTextFile } from '@tauri-apps/plugin-fs';
// import { appLogDir } from '@tauri-apps/api/path';
// import { useHotkeys } from 'react-hotkeys-hook';
// import { X, RefreshCw, Download, Trash2 } from 'lucide-react';
// import { Button } from '@/components/atoms/button';
// import { ScrollArea } from '@/components/atoms/scroll-area';

// interface DebugPanelProps {
//   isOpen: boolean;
//   onClose: () => void;
// }

// export function DebugPanel({ isOpen, onClose }: DebugPanelProps) {
//   const [logs, setLogs] = useState<string>('Cargando logs...');
//   const [autoRefresh, setAutoRefresh] = useState(false);
//   const [logPath, setLogPath] = useState<string>('');

//   // Atajo de teclado para cerrar: Escape
//   useHotkeys('escape', () => {
//     if (isOpen) onClose();
//   }, { enabled: isOpen });

//   const loadLogs = async () => {
//     try {
//       // Obtener la ruta para mostrarla
//       const logDir = await appLogDir();
//       const logFileName = 'app.log';
//       setLogPath(`${logDir}/${logFileName}`);

//       // Leer el archivo de logs
//       const logContent = await readTextFile(logFileName, {
//         baseDir: BaseDirectory.AppLog
//       });

//       // Formatear los logs para mejor visualización
//       // El formato del plugin de Tauri es: [YYYY-MM-DD][HH:MM:SS][module][LEVEL] message
//       const formattedLogs = logContent
//         .split('\n')
//         .filter(line => line.trim()) // Eliminar líneas vacías
//         .join('\n');

//       setLogs(formattedLogs || 'No hay logs disponibles');
//     } catch (error) {
//       const errorStr = String(error);

//       // Verificar si es error de archivo no encontrado
//       if (errorStr.includes('No existe el fichero') || errorStr.includes('No such file') || errorStr.includes('os error 2')) {
//         setLogs(`📝 Archivo de logs aún no creado.\n\n` +
//                 `El archivo se creará automáticamente cuando se genere el primer log.\n\n` +
//                 `💡 Prueba realizar alguna acción en la app (login, cargar datos, etc.) ` +
//                 `y luego presiona el botón "Refresh" para ver los logs.\n\n` +
//                 `📂 Ubicación: ${logPath || 'Calculando...'}`);
//       } else {
//         setLogs(`❌ Error cargando logs: ${errorStr}\n\n` +
//                 `📂 Ruta: ${logPath || 'Calculando...'}\n\n` +
//                 `💡 Si el error persiste, verifica los permisos del sistema.`);
//       }
//     }
//   };

//   const clearLogs = async () => {
//     try {
//       await writeTextFile('app.log', '', {
//         baseDir: BaseDirectory.AppLog
//       });
//       setLogs('✅ Logs limpiados correctamente');
//     } catch (error) {
//       setLogs(`❌ Error limpiando logs: ${error}`);
//     }
//   };

//   const downloadLogs = () => {
//     const element = document.createElement('a');
//     const file = new Blob([logs], { type: 'text/plain' });
//     element.href = URL.createObjectURL(file);
//     element.download = `app-logs-${new Date().toISOString()}.txt`;
//     document.body.appendChild(element);
//     element.click();
//     document.body.removeChild(element);
//   };

//   // Auto-refresh cada 2 segundos si está activado
//   useEffect(() => {
//     if (isOpen && autoRefresh) {
//       const interval = setInterval(loadLogs, 2000);
//       return () => clearInterval(interval);
//     }
//   }, [isOpen, autoRefresh]);

//   // Cargar logs cuando se abre el panel
//   useEffect(() => {
//     if (isOpen) {
//       loadLogs();
//     }
//   }, [isOpen]);

//   if (!isOpen) return null;

//   return (
//     <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
//       <div className="bg-gray-900 rounded-lg shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col border border-gray-700">
//         {/* Header */}
//         <div className="flex items-center justify-between p-4 border-b border-gray-700">
//           <div>
//             <h2 className="text-xl font-bold text-green-400">Panel de Debug</h2>
//             <p className="text-xs text-gray-400 mt-1">{logPath}</p>
//           </div>
//           <div className="flex items-center gap-2">
//             <Button
//               variant="outline"
//               size="sm"
//               onClick={loadLogs}
//               className="text-green-400 border-green-400 hover:bg-green-400/10"
//             >
//               <RefreshCw className="w-4 h-4 mr-1" />
//               Refresh
//             </Button>
//             <Button
//               variant="outline"
//               size="sm"
//               onClick={() => setAutoRefresh(!autoRefresh)}
//               className={autoRefresh ? 'text-green-400 border-green-400 bg-green-400/10' : 'text-gray-400 border-gray-600'}
//             >
//               Auto {autoRefresh ? 'ON' : 'OFF'}
//             </Button>
//             <Button
//               variant="outline"
//               size="sm"
//               onClick={downloadLogs}
//               className="text-blue-400 border-blue-400 hover:bg-blue-400/10"
//             >
//               <Download className="w-4 h-4 mr-1" />
//               Download
//             </Button>
//             <Button
//               variant="outline"
//               size="sm"
//               onClick={clearLogs}
//               className="text-red-400 border-red-400 hover:bg-red-400/10"
//             >
//               <Trash2 className="w-4 h-4 mr-1" />
//               Clear
//             </Button>
//             <Button
//               variant="ghost"
//               size="sm"
//               onClick={onClose}
//               className="text-gray-400 hover:text-white"
//             >
//               <X className="w-5 h-5" />
//             </Button>
//           </div>
//         </div>

//         {/* Contenido de logs */}
//         <ScrollArea className="flex-1 p-4 bg-black/50">
//           <pre className="text-xs text-green-400 font-mono whitespace-pre-wrap break-words leading-relaxed">
//             {logs}
//           </pre>
//         </ScrollArea>

//         {/* Footer con ayuda */}
//         <div className="p-3 border-t border-gray-700 bg-gray-800/50">
//           <div className="flex items-center justify-between text-xs text-gray-400">
//             <span>Presiona <kbd className="px-2 py-1 bg-gray-700 rounded">Esc</kbd> para cerrar</span>
//             <span>Presiona <kbd className="px-2 py-1 bg-gray-700 rounded">Ctrl+Shift+D</kbd> para abrir/cerrar</span>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

// // Hook personalizado para controlar el panel de debug desde cualquier parte
// export function useDebugPanel() {
//   const [isOpen, setIsOpen] = useState(false);

//   // Atajo global: Ctrl+Shift+D (Windows/Linux) o Cmd+Shift+D (Mac)
//   useHotkeys('ctrl+shift+d, meta+shift+d', () => {
//     setIsOpen(prev => !prev);
//   }, { enableOnFormTags: true });

//   // También puedes abrir con F12 como alternativa
//   useHotkeys('f12', () => {
//     setIsOpen(prev => !prev);
//   }, { enableOnFormTags: true });

//   return {
//     isOpen,
//     open: () => setIsOpen(true),
//     close: () => setIsOpen(false),
//     toggle: () => setIsOpen(prev => !prev),
//   };
// }
