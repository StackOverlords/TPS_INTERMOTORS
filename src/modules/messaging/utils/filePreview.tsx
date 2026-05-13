import {
  Image,
  FileText,
  FileSpreadsheet,
  FileType2,
  File,
} from "lucide-react";

const IMAGE_EXTS = ["jpg", "jpeg", "png", "webp", "gif"];
const PDF_EXTS = ["pdf"];
const EXCEL_EXTS = ["xls", "xlsx"];
const WORD_EXTS = ["doc", "docx"];

export function getExtension(filename: string): string {
  return filename.split(".").pop()?.toLowerCase() ?? "";
}

export function getFilePreviewByName(filename: string): {
  icon: React.ReactNode;
  label: string;
} {
  const ext = getExtension(filename);

  if (IMAGE_EXTS.includes(ext))
    return {
      icon: <Image className="inline h-3 w-3 shrink-0 text-blue-400" />,
      label: "Imagen",
    };
  if (PDF_EXTS.includes(ext))
    return {
      icon: <FileType2 className="inline h-3 w-3 shrink-0 text-red-400" />,
      label: "PDF",
    };
  if (EXCEL_EXTS.includes(ext))
    return {
      icon: (
        <FileSpreadsheet className="inline h-3 w-3 shrink-0 text-emerald-400" />
      ),
      label: "Hoja de cálculo",
    };
  if (WORD_EXTS.includes(ext))
    return {
      icon: <FileText className="inline h-3 w-3 shrink-0 text-blue-400" />,
      label: "Documento",
    };

  return {
    icon: <File className="inline h-3 w-3 shrink-0 text-muted-foreground" />,
    label: "Archivo",
  };
}
