import { useEffect, useState } from "react";
import { downloadPDF } from "@/lib/pdfUtils";
import { Loader2, Download, Maximize2, X } from "lucide-react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../atoms/dialog";
import { Button } from "@/components/atoms/button";
import { cn } from "@/lib/utils";

interface PDFViewerProps {
  id: number | null | undefined;
  pdfBlob: Blob | undefined;
  isLoading: boolean;
  isError: boolean;
  isOpen: boolean;
  onClose: (open: boolean) => void;
  title?: string;
  pdfName?: string;
  appendIdToName?: boolean;
}

export const PDFViewer = ({
  id,
  pdfBlob,
  isLoading,
  isError,
  isOpen,
  onClose,
  title = "Detalle de impresión",
  pdfName = "archivo",
  appendIdToName = true,
}: PDFViewerProps) => {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [expandedView, setExpandedView] = useState(false);
  // const environment = getEnvironment();

  useEffect(() => {
    if (pdfBlob) {
      // tauriFetch's .blob() may return type:"" — force application/pdf so the
      // WebView renders it inline instead of treating it as octet-stream
      const typed =
        pdfBlob.type === "application/pdf"
          ? pdfBlob
          : new Blob([pdfBlob], { type: "application/pdf" });
      const url = URL.createObjectURL(typed);
      setPdfUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    setPdfUrl(null);
  }, [pdfBlob]);

  const handleDownload = () => {
    const name =
      appendIdToName && id ? `${pdfName}_${id}.pdf` : `${pdfName}.pdf`;
    if (pdfBlob) {
      downloadPDF(pdfBlob, name);
    }
  };

  // const handlePrint = async () => {
  //     if (pdfBlob) {
  //         try {
  //             await printPDF(pdfBlob);
  //         } catch (error) {
  //             console.error('Error printing PDF:', error);
  //             alert('Error al imprimir el PDF');
  //         }
  //     }
  // };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        showCloseButton={false}
        className={cn(
          "max-w-4xl max-h-[90vh] h-full overflow-hidden flex flex-col gap-2 p-3 z-[9999]",
          (isLoading || isError) && "max-w-max max-h-max",
          expandedView && "max-w-full max-h-full"
        )}
        aria-description="pdf-viewer"
        aria-describedby={undefined}
      >
        {isLoading ? (
          <div className="p-8 flex flex-col items-center gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            <DialogTitle>Cargando PDF...</DialogTitle>
          </div>
        ) : isError ? (
          <div className="p-8 max-w-md flex flex-col items-center gap-2 text-center">
            <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-2">
              Error
            </h3>
            <p className="text-muted-foreground mb-4">
              No se pudo cargar el PDF. Por favor, intenta nuevamente.
            </p>
            <Button onClick={() => onClose(false)}>Cerrar</Button>
          </div>
        ) : (
          <>
            <DialogHeader className="h-max">
              <DialogTitle className="flex items-center justify-between">
                <div className="flex items-center text-base">{title}</div>
                <div className="flex items-center gap-2">
                  <Button
                    className="cursor-pointer"
                    variant="outline"
                    onClick={() => setExpandedView(!expandedView)}
                  >
                    <Maximize2 className="w-4 h-4" />
                  </Button>
                  <Button
                    onClick={handleDownload}
                    type="button"
                    title="Descargar PDF"
                    className="cursor-pointer"
                  >
                    <Download className="size-4" />
                    Descargar
                  </Button>
                  {/* <button
                                    onClick={handlePrint}
                                    className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors"
                                    title={environment.isTauri ? "Abrir para imprimir" : "Imprimir"}
                                >
                                    <Printer className="w-4 h-4" />
                                    {environment.isTauri ? "Abrir" : "Imprimir"}
                                </button> */}
                  <DialogClose className="size-8 rounded-sm ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-secondary flex items-center justify-center">
                    <X className="w-4 h-4" />
                  </DialogClose>
                </div>
              </DialogTitle>
            </DialogHeader>

            <div className="flex-1 min-h-0">
              {pdfUrl ? (
                <iframe
                  src={pdfUrl}
                  className="w-full h-full border-0"
                  title="Vista previa PDF"
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-muted-foreground">No hay PDF disponible</p>
                </div>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
