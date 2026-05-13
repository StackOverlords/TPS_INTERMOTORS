/**
 * Solo el botón de apertura del selector de archivos.
 * El estado del archivo seleccionado se maneja en el padre (ChatConversation)
 * a través del callback onFileSelected.
 */
import { useRef } from "react";
import { Paperclip } from "lucide-react";
import { Button } from "@/components/atoms/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/atoms/tooltip";
import { ATTACHMENT_ALLOWED_TYPES } from "../types/Attachment.types";

interface Props {
  onFileSelected: (file: File) => void;
  disabled?: boolean;
}

export function FilePickerButton({ onFileSelected, disabled }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onFileSelected(file);
    e.target.value = "";
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept={ATTACHMENT_ALLOWED_TYPES.join(",")}
        className="hidden"
        onChange={handleChange}
      />
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            type="button"
            className="h-9 w-9 shrink-0 rounded-xl text-muted-foreground hover:text-foreground"
            disabled={disabled}
            onClick={() => inputRef.current?.click()}
          >
            <Paperclip className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top">
          Adjuntar archivo (máx. 10 MB)
        </TooltipContent>
      </Tooltip>
    </>
  );
}
