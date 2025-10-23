import { useEffect, useState } from "react";
import { useQuotationPDF } from "../../modules/quotations/hooks/useQuotationPDF";
import { createObjectURL, revokeObjectURL, downloadPDF } from "@/lib/pdfUtils";
import { Loader2, Download, Maximize2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../atoms/dialog";
import { Button } from "@/components/atoms/button";
import { cn } from "@/lib/utils";

interface PDFViewerProps {
    id: number;
    isOpen: boolean;
    onClose: (open: boolean) => void;
    title?: string;
    pdfName?: string;
}

export const PDFViewer = ({ id, isOpen, onClose, title = "Detalle de impresión", pdfName = "archivo" }: PDFViewerProps) => {
    const [pdfUrl, setPdfUrl] = useState<string | null>(null);
    const { data: pdfBlob, isLoading, isError } = useQuotationPDF(id, isOpen && !!id);
    const [expandedView, setExpandedView] = useState(false)
    // const environment = getEnvironment();

    useEffect(() => {
        if (pdfBlob) {
            const url = createObjectURL(pdfBlob);
            setPdfUrl(url);

            return () => {
                if (url) {
                    revokeObjectURL(url);
                }
            };
        }
    }, [pdfBlob]);

    const handleDownload = () => {
        if (pdfBlob) {
            downloadPDF(pdfBlob, `${pdfName}_${id}.pdf`);
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
            <DialogContent className={cn(
                "max-w-4xl max-h-[90vh] h-full overflow-y-auto flex flex-col gap-2",
                (isLoading || isError) && "max-w-max max-h-max",
                expandedView && "max-w-full max-h-full",
            )} aria-description="pdf-viewer">
                {
                    isLoading ? (
                        <div className="p-8 flex flex-col items-center gap-4">
                            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                            <p className="text-gray-700">Cargando PDF...</p>
                        </div>
                    ) : isError ? (
                        <div className="p-8 max-w-md">
                            <h3 className="text-lg font-semibold text-red-600 mb-2">Error</h3>
                            <p className="text-gray-700 mb-4">
                                No se pudo cargar el PDF. Por favor, intenta nuevamente.
                            </p>
                            <Button
                                onClick={() => onClose(false)}
                            >
                                Cerrar
                            </Button>
                        </div>
                    ) : (
                        <>
                            <DialogHeader className="h-max">
                                <DialogTitle className="flex items-center justify-between">
                                    <div className="flex items-center text-base">
                                        {title}
                                    </div>
                                    <div className="flex items-center gap-2 pr-4">
                                        <Button className="cursor-pointer" variant="outline" onClick={() => setExpandedView(!expandedView)}>
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
                                    </div>
                                </DialogTitle>
                            </DialogHeader>

                            <div className="flex-1 overflow-hidden grow">
                                {pdfUrl ? (
                                    <iframe
                                        src={pdfUrl}
                                        className="w-full h-full border-0"
                                        title="Vista previa PDF"
                                    />
                                ) : (
                                    <div className="flex items-center justify-center h-full">
                                        <p className="text-gray-500">No hay PDF disponible</p>
                                    </div>
                                )}
                            </div>
                        </>
                    )
                }
            </DialogContent>
        </Dialog>
    );
};