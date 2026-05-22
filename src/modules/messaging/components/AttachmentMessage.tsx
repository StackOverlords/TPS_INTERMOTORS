/**
 * Renderiza el contenido de un mensaje tipo FILE:
 *  - Imagen  → thumbnail clicable que abre lightbox fullscreen
 *  - Archivo → chip con ícono por extensión, nombre, tamaño y botón de descarga
 *  - Subiendo → barra de progreso sobre la preview local
 */
import { useState } from "react";
import {
  FileText,
  FileSpreadsheet,
  FileType2,
  Download,
  Loader2,
  AlertCircle,
  Image,
  RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatFileSize, type Attachment } from "../types/Attachment.types";
import type { OptimisticMessage } from "../types/Message.types";
import { Button } from "@/components/atoms/button";
import { ImageViewer } from "@/components/common/ImageViewer";
import { Skeleton } from "@/components/atoms/skeleton";
import { downloadFile, fetchBlob } from "@/lib/fileUtils";
import { PDFViewer } from "@/components/common/PDFViewer";

// ─────────────────────────────────────────────────────────────────────────────
// ICON BY EXTENSION
// ─────────────────────────────────────────────────────────────────────────────

function FileIcon({ ext, className }: { ext: string; className?: string }) {
  const e = ext.toLowerCase();
  if (["pdf"].includes(e))
    return (
      <FileType2 className={cn("text-red-500 dark:text-red-400", className)} />
    );
  if (["xls", "xlsx"].includes(e))
    return (
      <FileSpreadsheet
        className={cn("text-emerald-400 dark:text-emerald-500", className)}
      />
    );
  if (["doc", "docx"].includes(e))
    return (
      <FileText className={cn("text-blue-500 dark:text-blue-400", className)} />
    );
  return (
    <FileText
      className={cn(
        "text-muted-foreground dark:text-muted-foreground/80",
        className
      )}
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// IMAGE ATTACHMENT
// ─────────────────────────────────────────────────────────────────────────────

interface ImageAttachmentProps {
  attachment: Attachment;
  /** URL local (objectURL) mientras se está subiendo */
  localPreviewUrl?: string;
  isUploading: boolean;
  progress?: number;
  isFailed: boolean;
  onRetry?: () => void;
}

function ImageAttachment({
  attachment,
  localPreviewUrl,
  isUploading,
  progress,
  isFailed,
  onRetry,
}: ImageAttachmentProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);

  const displayUrl =
    attachment.url_thumbnail || localPreviewUrl || attachment.url;

  const hasSize = attachment.ancho && attachment.alto;
  const aspectRatio = hasSize
    ? `${attachment.ancho}/${attachment.alto}`
    : "4/3";
  // Sin medidas: altura mínima fija para que el skeleton no colapse
  const minHeight = hasSize ? undefined : "160px";

  return (
    <>
      <div
        className="relative mt-1 overflow-hidden rounded-xl"
        style={{
          aspectRatio,
          minHeight,
          maxHeight: 300,
          maxWidth: 360,
          width: "100%",
        }}
      >
        {/* Skeleton mientras carga (no durante upload fallido) */}
        {!imgLoaded && !isUploading && !isFailed && (
          <Skeleton className="absolute inset-0 rounded-xl bg-muted/50 flex items-center justify-center">
            <Image className="size-12 text-muted-foreground" />
          </Skeleton>
        )}

        <img
          title={attachment.nombre_original}
          src={displayUrl}
          alt={attachment.nombre_original}
          onLoad={() => setImgLoaded(true)}
          className={cn(
            "block w-full h-full object-cover rounded-xl transition-opacity duration-300",
            (!imgLoaded || isUploading) && "opacity-0",
            imgLoaded && !isUploading && !isFailed && "cursor-pointer opacity-100 hover:opacity-90",
            imgLoaded && isFailed && "opacity-60 cursor-default",
          )}
          draggable={false}
          onClick={() =>
            imgLoaded && !isUploading && !isFailed && setLightboxOpen(true)
          }
        />

        {/* Overlay de progreso (uploading) */}
        {isUploading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center rounded-xl bg-black/40">
            <Loader2 className="h-6 w-6 animate-spin text-white" />
            {progress !== undefined && (
              <>
                <span className="mt-2 text-xs font-semibold text-white">
                  {progress}%
                </span>
                <div className="mt-2 h-1 w-2/3 overflow-hidden rounded-full bg-white/30">
                  <div
                    className="h-full rounded-full bg-white transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </>
            )}
          </div>
        )}

        {/* Overlay de error — imagen visible con botón centrado (estilo WhatsApp) */}
        {isFailed && (
          <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/30">
            {onRetry && (
              <button
                onClick={onRetry}
                className="flex h-11 w-11 items-center justify-center rounded-full bg-white/95 shadow-lg transition-all hover:scale-105 hover:bg-white active:scale-95"
                title="Reintentar"
              >
                <RotateCcw className="h-5 w-5 text-gray-800" />
              </button>
            )}
          </div>
        )}
      </div>

      {lightboxOpen && (
        <ImageViewer
          open={lightboxOpen}
          onOpenChange={setLightboxOpen}
          imageSrc={attachment.url}
          editMode={false}
          allowEdit={false}
          title={attachment.nombre_original}
          imageMetadata={{
            fileName: attachment.nombre_original,
            fileExtension: attachment.extension,
          }}
        />
      )}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FILE CHIP ATTACHMENT
// ─────────────────────────────────────────────────────────────────────────────

interface FileChipProps {
  attachment: Attachment;
  isUploading: boolean;
  progress?: number;
  isFailed: boolean;
  isMine: boolean;
  onRetry?: () => void;
}

function FileChip({
  attachment,
  isUploading,
  progress,
  isFailed,
  isMine,
  onRetry,
}: FileChipProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [pdfOpen, setPdfOpen] = useState(false);
  const [pdfBlob, setPdfBlob] = useState<Blob | undefined>();
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState(false);

  const isPdf = attachment.extension.toLowerCase() === "pdf";
  const isClickable = !isUploading && !isFailed && !!attachment.url;

  const handleDownload = async () => {
    if (!isClickable || isDownloading) return;
    setIsDownloading(true);
    try {
      await downloadFile(attachment.url, attachment.nombre_original);
    } catch (err) {
      console.error("[FileChip] Download failed:", err);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleChipClick = async () => {
    if (!isClickable) return;

    if (isPdf) {
      setPdfOpen(true);
      setPdfLoading(true);
      setPdfError(false);
      try {
        const blob = await fetchBlob(attachment.url);
        setPdfBlob(blob);
      } catch {
        setPdfError(true);
      } finally {
        setPdfLoading(false);
      }
    } else {
      // Word/Excel → descarga directa
      void handleDownload();
    }
  };

  return (
    <>
      <div
        role={isClickable ? "button" : undefined}
        onClick={() => void handleChipClick()}
        className={cn(
          "mt-1.5 flex items-center gap-2 rounded-xl border p-2 min-w-[200px] max-w-[280px]",
          isMine
            ? "border-border/40 bg-muted shadow-[0_4px_16px_rgba(0,0,0,0.2)] ring-1 ring-black/[0.07]"
            : "border-border bg-card shadow-md",
          isClickable && "cursor-pointer hover:opacity-80 transition-opacity"
        )}
      >
        {/* Icono */}
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted-foreground/10">
          {isUploading ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : isFailed ? (
            <AlertCircle className="h-4 w-4 text-destructive" />
          ) : (
            <FileIcon ext={attachment.extension} className="h-4 w-4" />
          )}
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <p
            title={attachment.nombre_original}
            className="truncate text-[12px] font-semibold text-foreground"
          >
            {attachment.nombre_original}
          </p>
          <p className={cn("text-[10px]", isFailed ? "text-destructive" : "text-muted-foreground")}>
            {isFailed
              ? "Error al subir"
              : isUploading && progress !== undefined
                ? `Subiendo ${progress}%`
                : isPdf
                  ? `PDF · ${formatFileSize(attachment.tamanio)}`
                  : formatFileSize(attachment.tamanio)}
          </p>

          {isUploading && progress !== undefined && (
            <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-muted-foreground/20">
              <div
                className="h-full rounded-full bg-primary transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
        </div>

        {/* Acciones */}
        {isFailed && onRetry ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRetry();
            }}
            className="shrink-0 flex items-center gap-1.5 rounded-lg bg-destructive px-2.5 py-1.5 text-[10px] font-semibold text-white hover:bg-destructive/90 active:bg-destructive/80 transition-colors"
          >
            <RotateCcw className="h-3 w-3" />
            Reintentar
          </button>
        ) : !isUploading && !isFailed && attachment.url ? (
          <Button
            onClick={(e) => {
              e.stopPropagation();
              void handleDownload();
            }}
            variant="ghost"
            disabled={isDownloading}
            className="shrink-0 h-7 w-7 text-muted-foreground hover:bg-accent hover:text-foreground"
            title="Descargar"
          >
            {isDownloading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Download className="h-3.5 w-3.5" />
            )}
          </Button>
        ) : null}
      </div>

      {isPdf && (
        <PDFViewer
          id={attachment.id}
          pdfBlob={pdfBlob}
          isLoading={pdfLoading}
          isError={pdfError}
          isOpen={pdfOpen}
          onClose={(open) => {
            setPdfOpen(open);
            if (!open) setPdfBlob(undefined);
          }}
          title={attachment.nombre_original}
          pdfName={attachment.nombre_original.replace(/\.pdf$/i, "")}
          appendIdToName={false}
        />
      )}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN EXPORT
// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  adjuntos: Attachment[];
  optimistic?: OptimisticMessage;
  isMine: boolean;
  onRetry?: (tempId: string) => void;
}

export function AttachmentMessage({
  adjuntos,
  optimistic,
  isMine,
  onRetry,
}: Props) {
  const isUploading = optimistic?._status === "uploading";
  const isFailed = optimistic?._status === "failed";
  const progress = optimistic?._progress;
  const localUrl = optimistic?._localPreviewUrl;

  // Tomar solo el primer adjunto (el backend actualmente envía uno por mensaje)
  const attachment = adjuntos[0];
  if (!attachment) return null;

  const handleRetry = () => {
    if (optimistic) onRetry?.(optimistic._tempId);
  };

  if (attachment.es_imagen) {
    return (
      <ImageAttachment
        attachment={attachment}
        localPreviewUrl={localUrl}
        isUploading={!!isUploading}
        progress={progress}
        isFailed={!!isFailed}
        onRetry={isFailed ? handleRetry : undefined}
      />
    );
  }

  return (
    <FileChip
      attachment={attachment}
      isUploading={!!isUploading}
      progress={progress}
      isFailed={!!isFailed}
      isMine={isMine}
      onRetry={isFailed ? handleRetry : undefined}
    />
  );
}
