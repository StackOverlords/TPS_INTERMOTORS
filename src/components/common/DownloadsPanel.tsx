import { Badge } from '@/components/atoms/badge';
import { Button } from '@/components/atoms/button';
import { ScrollArea } from '@/components/atoms/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/atoms/dropdown-menu';
import { cn } from '@/lib/utils';
import { getFileSystem } from '@/platform';
import { useDownloadStore, type DownloadEntry } from '@/states/downloadStore';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  CheckCircle2,
  Download,
  FileText,
  FileSpreadsheet,
  FolderOpen,
  Loader2,
  Trash2,
  XCircle,
} from 'lucide-react';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const StatusIcon: React.FC<{ status: DownloadEntry['status'] }> = ({ status }) => {
  if (status === 'downloading') return <Loader2 className="size-3 animate-spin text-muted-foreground" />;
  if (status === 'success') return <CheckCircle2 className="size-3 text-green-200" />;
  if (status === 'cancelled') return <XCircle className="size-3 text-red-200" />;
  return <XCircle className="size-3 text-destructive" />;
};

const TypeIcon: React.FC<{ type: DownloadEntry['type'] }> = ({ type }) => {
  if (type === 'excel') return <FileSpreadsheet className="size-3.5 text-muted-foreground" />;
  return <FileText className="size-3.5 text-muted-foreground" />;
};

const revealInExplorer = async (filePath: string) => {
  try {
    await getFileSystem().revealInFolder(filePath);
  } catch {
    // silenciar — el explorador del sistema puede no estar disponible
  }
};

// ─── Component ────────────────────────────────────────────────────────────────

const DownloadsPanel: React.FC = () => {
  const { downloads, removeDownload, clearDownloads } = useDownloadStore();
  // El navegador no da acceso al explorador de archivos: la acción se esconde.
  const canReveal = getFileSystem().canRevealInFolder();

  const activeCount = downloads.filter((d) => d.status === 'downloading').length;

  if (downloads.length === 0) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="relative size-8" title="Descargas recientes">
          <Download className="h-4 w-4" />
          {activeCount > 0 && (
            <Badge
              variant="secondary"
              className="absolute -top-2 -right-2 h-4 w-4 flex items-center justify-center p-0 text-[10px] animate-pulse"
            >
              {activeCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-72 p-1">
        {/* Header */}
        <div className="flex items-center justify-between px-2 py-1 mb-1">
          <span className="text-xs font-medium text-muted-foreground">Descargas recientes</span>
          <Button
            variant="ghost"
            size="sm"
            className="h-5 px-1.5 text-[10px] text-muted-foreground"
            onClick={clearDownloads}
          >
            Limpiar
          </Button>
        </div>

        {/* List */}
        <ScrollArea className="max-h-64">
          <div className="space-y-0.5">
            {downloads.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center gap-2 rounded px-2 py-1.5 hover:bg-accent group"
              >
                <TypeIcon type={entry.type} />

                <div className="flex-1 min-w-0">
                  <p className="text-xs truncate leading-tight text-foreground">
                    {entry.filename}
                  </p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <StatusIcon status={entry.status} />
                    {entry.status === 'error' && (
                      <span className="text-[10px] text-destructive">{entry.error ?? 'Error'}</span>
                    )}
                    <span className="text-[10px] text-muted-foreground/60">
                      {formatDistanceToNow(entry.timestamp, { addSuffix: true, locale: es })}
                    </span>
                  </div>
                </div>

                <div className={cn("flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity")}>
                  {canReveal && entry.path && entry.status === 'success' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      title="Abrir ubicación"
                      onClick={() => revealInExplorer(entry.path!)}
                    >
                      <FolderOpen className="size-3" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 text-muted-foreground"
                    onClick={() => removeDownload(entry.id)}
                  >
                    <Trash2 className="size-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default DownloadsPanel;
