/**
 * Compositor de adjuntos — reemplaza el input normal cuando hay un archivo
 * seleccionado.
 *
 *  ┌─────────────────────────────────────────────┐
 *  │  [Preview grande o chip de archivo]         │
 *  │  [X cancelar]                               │
 *  ├─────────────────────────────────────────────┤
 *  │  [Input caption...]              [Enviar →] │
 *  └─────────────────────────────────────────────┘
 *
 * El input de texto normal y el botón de envío estándar quedan ocultos
 * mientras este compositor está activo.
 */
import { useRef, useState } from "react";
import {
  X,
  Send,
  FileText,
  FileSpreadsheet,
  FileType2,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/atoms/button";
import { Input } from "@/components/atoms/input";
import { cn } from "@/lib/utils";
import {
  formatFileSize,
  isImageMime,
  validateAttachment,
} from "../types/Attachment.types";

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function FileIcon({ ext }: { ext: string }) {
  const e = ext.toLowerCase();
  if (e === "pdf") return <FileType2 className="h-8 w-8 text-red-500" />;
  if (["xls", "xlsx"].includes(e))
    return <FileSpreadsheet className="h-8 w-8 text-emerald-600" />;
  if (["doc", "docx"].includes(e))
    return <FileText className="h-8 w-8 text-blue-500" />;
  return <FileText className="h-8 w-8 text-muted-foreground" />;
}

// ─────────────────────────────────────────────────────────────────────────────
// PROPS
// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  file: File;
  /** URL local para preview de imagen (objectURL) */
  previewUrl: string | null;
  isSending: boolean;
  error: string | null;
  onSend: (caption: string) => void;
  onCancel: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export function AttachmentComposer({
  file,
  previewUrl,
  isSending,
  error,
  onSend,
  onCancel,
}: Props) {
  const [caption, setCaption] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const ext = file.name.split(".").pop() ?? "";

  // Validación local
  const validation = validateAttachment(file);

  const handleSend = () => {
    if (!validation.valid || isSending) return;
    onSend(caption.trim());
    setCaption("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
    if (e.key === "Escape") onCancel();
  };

  return (
    <div className="shrink-0 space-y-2.5 bg-background">
      {/* ── Preview area ─────────────────────────────────────────────────── */}
      <div className="relative">
        {/* Cancel button — siempre visible en la esquina */}
        <Button
          onClick={onCancel}
          disabled={isSending}
          variant="outline"
          className="absolute -right-2 -top-2 z-10 flex h-6 w-6 hover:text-destructive hover:border-destructive/50 transition-colors"
        >
          <X className="h-3.5 w-3.5" />
        </Button>

        {isImageMime(file.type) && previewUrl ? (
          /* ── Imagen: preview grande ──────────────────────────────────── */
          <div className="overflow-hidden rounded-xl bg-muted/20">
            <img
              src={previewUrl}
              alt={file.name}
              className={cn(
                "w-full max-h-[280px] object-contain rounded-xl",
                isSending && "opacity-60"
              )}
              draggable={false}
            />
            {/* Nombre y peso sobre la imagen */}
            <div className="px-3 py-2">
              <p className="truncate text-[11px] font-medium text-muted-foreground">
                {file.name}
              </p>
              <p className="text-[10px] text-muted-foreground/70">
                {formatFileSize(file.size)}
              </p>
            </div>
          </div>
        ) : (
          /* ── Archivo: chip compacto ──────────────────────────────────── */
          <div
            className={cn(
              "flex items-center gap-3 rounded-xl border bg-muted/20 px-4 py-3",
              validation.valid
                ? "border-border/50"
                : "border-destructive/40 bg-destructive/5"
            )}
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-background shadow-sm border border-border/40">
              <FileIcon ext={ext} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-semibold">{file.name}</p>
              <p className="text-[11px] text-muted-foreground">
                {formatFileSize(file.size)}
              </p>
            </div>
          </div>
        )}

        {/* Error de validación / subida */}
        {(error || !validation.valid) && (
          <div className="mt-2 rounded-lg bg-destructive/10 px-3 py-2">
            <p className="text-[11px] text-destructive">
              {!validation.valid ? validation.error : error}
            </p>
          </div>
        )}
      </div>

      {/* ── Caption input + Send ─────────────────────────────────────────── */}
      <div className="flex items-center gap-2">
        <Input
          ref={inputRef}
          autoFocus
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            isImageMime(file.type)
              ? "Añadir descripción..."
              : "Añadir mensaje..."
          }
          className="h-9 rounded-xl border-border/30 bg-muted/20 px-4 text-sm focus-visible:ring-1"
          disabled={isSending || !validation.valid}
        />
        <Button
          size="icon"
          className="h-9 w-9 shrink-0 rounded-xl"
          disabled={!validation.valid || isSending}
          onClick={handleSend}
        >
          {isSending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
}
