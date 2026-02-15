import { useCallback } from "react";
import { MoreVertical, ExternalLink, Download, Maximize2 } from "lucide-react";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/atoms/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/atoms/dialog";

interface CardOptionsMenuProps {
  onNavigate?: () => void;
  navigateLabel?: string;
  onDownload?: () => void;
  chartContainerId?: string;
}

export function CardOptionsMenu({
  onNavigate,
  navigateLabel = "Ver reporte completo",
  onDownload,
  chartContainerId,
}: CardOptionsMenuProps) {
  const [expanded, setExpanded] = useState(false);
  const [chartImage, setChartImage] = useState<string | null>(null);

  const captureChart = useCallback((): HTMLCanvasElement | null => {
    if (!chartContainerId) return null;
    const container = document.getElementById(chartContainerId);
    if (!container) return null;
    const svgElement = container.querySelector("svg.recharts-surface");
    if (!svgElement) return null;

    const svgClone = svgElement.cloneNode(true) as SVGElement;
    const { width, height } = svgElement.getBoundingClientRect();
    svgClone.setAttribute("width", String(width));
    svgClone.setAttribute("height", String(height));

    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svgClone);
    const svgBlob = new Blob([svgString], {
      type: "image/svg+xml;charset=utf-8",
    });
    const url = URL.createObjectURL(svgBlob);

    const canvas = document.createElement("canvas");
    const scale = 2;
    canvas.width = width * scale;
    canvas.height = height * scale;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    const img = new Image();
    img.onload = () => {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
    };
    img.src = url;
    return canvas;
  }, [chartContainerId]);

  const handleDownload = useCallback(() => {
    if (onDownload) {
      onDownload();
      return;
    }
    if (!chartContainerId) return;
    const container = document.getElementById(chartContainerId);
    if (!container) return;
    const svgElement = container.querySelector("svg.recharts-surface");
    if (!svgElement) return;

    const { width, height } = svgElement.getBoundingClientRect();
    const svgClone = svgElement.cloneNode(true) as SVGElement;
    svgClone.setAttribute("width", String(width));
    svgClone.setAttribute("height", String(height));
    svgClone.setAttribute("xmlns", "http://www.w3.org/2000/svg");

    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svgClone);
    const canvas = document.createElement("canvas");
    const scale = 2;
    canvas.width = width * scale;
    canvas.height = height * scale;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      ctx.fillStyle = "#1a1a2e";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const link = document.createElement("a");
      link.download = `chart-${chartContainerId}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    };
    img.src =
      "data:image/svg+xml;base64," +
      btoa(unescape(encodeURIComponent(svgString)));
  }, [chartContainerId, onDownload]);

  const handleExpand = useCallback(() => {
    if (!chartContainerId) return;
    const container = document.getElementById(chartContainerId);
    if (!container) return;
    const svgElement = container.querySelector("svg.recharts-surface");
    if (!svgElement) return;

    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svgElement);
    setChartImage(
      "data:image/svg+xml;base64," +
        btoa(unescape(encodeURIComponent(svgString)))
    );
    setExpanded(true);
  }, [chartContainerId]);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center justify-center w-5 h-5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors">
            <MoreVertical className="h-3.5 w-3.5" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-[160px]">
          {onNavigate && (
            <DropdownMenuItem
              onClick={onNavigate}
              className="text-xs cursor-pointer gap-2"
            >
              <ExternalLink className="h-3 w-3" />
              {navigateLabel}
            </DropdownMenuItem>
          )}
          {chartContainerId && (
            <DropdownMenuItem
              onClick={handleDownload}
              className="text-xs cursor-pointer gap-2"
            >
              <Download className="h-3 w-3" />
              Descargar imagen
            </DropdownMenuItem>
          )}
          {chartContainerId && (
            <DropdownMenuItem
              onClick={handleExpand}
              className="text-xs cursor-pointer gap-2"
            >
              <Maximize2 className="h-3 w-3" />
              Expandir
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={expanded} onOpenChange={setExpanded}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="text-sm">Vista expandida</DialogTitle>
          </DialogHeader>
          {chartImage && (
            <div className="w-full flex items-center justify-center p-4">
              <img
                src={chartImage}
                alt="Chart expanded"
                className="max-w-full max-h-[70vh] object-contain"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
