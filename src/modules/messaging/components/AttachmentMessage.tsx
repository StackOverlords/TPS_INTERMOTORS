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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatFileSize, type Attachment } from "../types/Attachment.types";
import type { OptimisticMessage } from "../types/Message.types";
import { Button } from "@/components/atoms/button";
import { ImageViewer } from "@/components/common/ImageViewer";

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
}

function ImageAttachment({
  attachment,
  localPreviewUrl,
  isUploading,
  progress,
  isFailed,
}: ImageAttachmentProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);

  // Usar thumbnail si existe (imagen ya subida), o preview local durante subida
  const displayUrl =
    attachment.url_thumbnail || localPreviewUrl || attachment.url;

  return (
    <>
      <div className="relative mt-1 overflow-hidden rounded-xl">
        <img
          title={attachment.nombre_original}
          src={displayUrl}
          alt={attachment.nombre_original}
          className={cn(
            "block max-h-[260px] max-w-[280px] w-full object-cover rounded-xl cursor-pointer transition-opacity",
            (isUploading || isFailed) && "opacity-60",
            !isUploading && !isFailed && "hover:opacity-90"
          )}
          onClick={() => !isUploading && !isFailed && setLightboxOpen(true)}
          draggable={false}
        />

        {/* Overlay de progreso */}
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

        {/* Overlay de error */}
        {isFailed && (
          <div className="absolute inset-0 flex flex-col items-center justify-center rounded-xl bg-black/50">
            <AlertCircle className="h-6 w-6 text-destructive" />
            <span className="mt-1 text-[10px] text-white">Error al subir</span>
          </div>
        )}
      </div>

      {lightboxOpen && (
        <ImageViewer
          open={lightboxOpen}
          onOpenChange={setLightboxOpen}
          imageSrc={attachment.url}
          editMode={false}
          allowEdit={false} // ← oculta el botón de editar
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
}

function FileChip({
  attachment,
  isUploading,
  progress,
  isFailed,
  isMine,
}: FileChipProps) {
  const handleDownload = () => {
    if (isUploading || isFailed || !attachment.url) return;
    window.open(attachment.url, "_blank", "noopener,noreferrer");
  };

  return (
    <div
      className={cn(
        "mt-1.5 flex items-center gap-2 rounded-xl border p-2 min-w-[200px] max-w-[480px]",
        isMine
          ? "border-background/10 bg-background/20"
          : "border-border/50 bg-card/50",
        isFailed && "border-destructive/30 bg-destructive/5"
      )}
    >
      {/* Icon */}
      <div
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
          isMine
            ? "bg-background/10 dark:bg-background/20"
            : "bg-muted-foreground/10"
        )}
      >
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
          className={cn(
            "truncate text-[12px] font-semibold",
            isMine ? "text-primary-foreground" : "text-foreground"
          )}
        >
          {attachment.nombre_original}
        </p>
        <p
          className={cn(
            "text-[10px]",
            isMine ? "text-primary-foreground/60" : "text-muted-foreground"
          )}
        >
          {isFailed
            ? "Error al subir"
            : isUploading && progress !== undefined
              ? `Subiendo ${progress}%`
              : formatFileSize(attachment.tamanio)}
        </p>

        {/* Progress bar */}
        {isUploading && progress !== undefined && (
          <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-muted-foreground/20">
            <div
              className="h-full rounded-full bg-primary transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>

      {/* Download button */}
      {!isUploading && !isFailed && attachment.url && (
        <Button
          onClick={handleDownload}
          variant={"ghost"}
          className={cn(
            "shrink-0 flex h-7 w-7 items-center justify-center rounded-lg transition-colors",
            isMine
              ? "text-primary-foreground/70 hover:bg-primary-foreground/15 hover:text-primary-foreground"
              : "text-muted-foreground hover:bg-accent hover:text-foreground"
          )}
          title="Descargar"
        >
          <Download className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN EXPORT
// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  adjuntos: Attachment[];
  optimistic?: OptimisticMessage;
  isMine: boolean;
}

export function AttachmentMessage({ adjuntos, optimistic, isMine }: Props) {
  const isUploading = optimistic?._status === "uploading";
  const isFailed = optimistic?._status === "failed";
  const progress = optimistic?._progress;
  const localUrl = optimistic?._localPreviewUrl;

  // Tomar solo el primer adjunto (el backend actualmente envía uno por mensaje)
  const attachment = adjuntos[0];
  if (!attachment) return null;

  if (attachment.es_imagen) {
    return (
      <ImageAttachment
        attachment={attachment}
        localPreviewUrl={localUrl}
        isUploading={!!isUploading}
        progress={progress}
        isFailed={!!isFailed}
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
    />
  );
}
