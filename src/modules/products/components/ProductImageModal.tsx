import { Button } from '@/components/atoms/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/atoms/dialog';
import { Separator } from '@/components/atoms/separator';
import { Maximize2, Minimize2, RotateCcw, RotateCw, ZoomIn, ZoomOut } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

interface ProductImageModalProps {
    productId: number | null;
    productName?: string;
    imageUrl?: string | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export const ProductImageModal = ({
    productId,
    productName,
    imageUrl,
    open,
    onOpenChange
}: ProductImageModalProps) => {
    const [zoom, setZoom] = useState(1);
    const [rotation, setRotation] = useState(0);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const containerRef = useRef<HTMLDivElement>(null);
    const imageRef = useRef<HTMLDivElement>(null);

    const handleZoomIn = () => {
        setZoom(prev => Math.min(prev + 0.25, 3));
    };

    const handleZoomOut = () => {
        setZoom(prev => Math.max(prev - 0.25, 0.5));
    };

    const handleRotate = () => {
        setRotation(prev => (prev + 90) % 360);
    };

    const handleDoubleClick = () => {
        if (zoom === 1) {
            setZoom(2);
        } else {
            setZoom(1);
            setPosition({ x: 0, y: 0 }); // Resetear posición al hacer zoom out
        }
    };

    const toggleFullscreen = () => {
        setIsFullscreen(prev => !prev);
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        if (zoom > 1) {
            setIsDragging(true);
            setDragStart({
                x: e.clientX - position.x,
                y: e.clientY - position.y
            });
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (isDragging && zoom > 1) {
            const newX = e.clientX - dragStart.x;
            const newY = e.clientY - dragStart.y;

            // Calcular límites para mantener la imagen dentro del contenedor
            if (containerRef.current && imageRef.current) {
                const containerRect = containerRef.current.getBoundingClientRect();
                const imageRect = imageRef.current.getBoundingClientRect();

                // La imagen escalada puede ser más grande que el contenedor
                const scaledWidth = imageRect.width;
                const scaledHeight = imageRect.height;

                // Calcular cuánto puede moverse la imagen
                const maxX = Math.max(0, (scaledWidth - containerRect.width) / 2);
                const maxY = Math.max(0, (scaledHeight - containerRect.height) / 2);

                // Limitar la posición
                const boundedX = Math.max(-maxX, Math.min(maxX, newX));
                const boundedY = Math.max(-maxY, Math.min(maxY, newY));

                setPosition({
                    x: boundedX,
                    y: boundedY
                });
            } else {
                setPosition({ x: newX, y: newY });
            }
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const handleMouseLeave = () => {
        setIsDragging(false);
    };

    const handleReset = () => {
        setZoom(1);
        setRotation(0);
        setPosition({ x: 0, y: 0 });
    };

    const handleClose = () => {
        handleReset();
        setIsFullscreen(false);
        onOpenChange(false);
    };

    // Resetear posición cuando cambia el zoom
    useEffect(() => {
        if (zoom <= 1) {
            setPosition({ x: 0, y: 0 });
        }
    }, [zoom]);

    // Si no hay imagen, mostrar un placeholder
    const displayImageUrl = imageUrl || '/placeholder-product.png';
    const hasImage = !!imageUrl;

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className={`flex flex-col ${isFullscreen ? 'max-w-[98vw] max-h-[98vh]' : 'max-w-4xl max-h-[90vh]'}`}>
                <DialogHeader>
                    <DialogTitle>
                        {productName || `Producto #${productId}`}
                    </DialogTitle>
                </DialogHeader>

                <Separator />

                {/* Contenedor de imagen con scroll */}
                <div
                    ref={containerRef}
                    className={`flex-1 overflow-hidden bg-gray-50 rounded-lg flex items-center justify-center p-4 ${isFullscreen ? 'min-h-[80vh]' : 'min-h-[500px]'}`}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseLeave}
                >
                    <div
                        ref={imageRef}
                        className={`transition-transform duration-200 ease-out select-none ${
                            zoom > 1 ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-pointer'
                        }`}
                        style={{
                            transform: `translate(${position.x}px, ${position.y}px) scale(${zoom}) rotate(${rotation}deg)`,
                        }}
                        onDoubleClick={handleDoubleClick}
                        title={zoom > 1 ? "Arrastra para mover" : "Doble click para zoom"}
                    >
                        <img
                            src={displayImageUrl}
                            alt={productName || `Producto #${productId}`}
                            className={`object-contain ${isFullscreen ? 'max-w-full max-h-[80vh]' : 'max-w-full max-h-[500px]'}`}
                            onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = '/placeholder-product.png';
                            }}
                            draggable={false}
                        />
                    </div>
                </div>

                {!hasImage && (
                    <p className="text-sm text-center text-gray-500">Sin imagen disponible</p>
                )}

                <Separator />

                {/* Controles */}
                <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleZoomOut}
                            disabled={zoom <= 0.5}
                            title="Alejar (Zoom out)"
                        >
                            <ZoomOut className="h-4 w-4" />
                        </Button>

                        <span className="text-sm font-medium min-w-[60px] text-center">
                            {Math.round(zoom * 100)}%
                        </span>

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleZoomIn}
                            disabled={zoom >= 3}
                            title="Acercar (Zoom in)"
                        >
                            <ZoomIn className="h-4 w-4" />
                        </Button>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleRotate}
                            title="Rotar 90°"
                        >
                            <RotateCw className="h-4 w-4 mr-1" />
                            Rotar
                        </Button>

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleReset}
                            title="Resetear vista"
                        >
                            <RotateCcw className="h-4 w-4 mr-1" />
                            Resetear
                        </Button>

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={toggleFullscreen}
                            title={isFullscreen ? "Salir de pantalla completa" : "Pantalla completa"}
                        >
                            {isFullscreen ? (
                                <>
                                    <Minimize2 className="h-4 w-4 mr-1" />
                                    Minimizar
                                </>
                            ) : (
                                <>
                                    <Maximize2 className="h-4 w-4 mr-1" />
                                    Maximizar
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};
