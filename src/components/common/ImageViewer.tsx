import { useState, useRef, useCallback, useEffect } from 'react';
import {
    ZoomIn,
    ZoomOut,
    RotateCw,
    RotateCcw,
    FlipHorizontal,
    FlipVertical,
    Download,
    Upload,
    Crop,
    RefreshCw,
    X,
    Check,
    Undo,
    Redo,
    Sun,
    Contrast,
    Droplets,
    Search,
    RectangleHorizontal,
    Square,
    RectangleVertical,
    Smartphone,
    Film,
    Maximize,
    Minimize,
    Info,
    Copy,
    Share2,
    Image as ImageIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogTitle } from '../atoms/dialog';
import { Tooltip, TooltipContent, TooltipTrigger } from '../atoms/tooltip';
import { Button } from '../atoms/button';
import { Slider } from '../atoms/slider';

interface ImageViewerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    imageSrc?: string;
    editMode?: boolean;
    onSave?: (imageData: string) => void;
    title?: string;
}

interface ImageState {
    zoom: number;
    rotation: number;
    flipX: boolean;
    flipY: boolean;
    brightness: number;
    contrast: number;
    saturation: number;
    filter: string;
}

interface CropArea {
    startX: number;
    startY: number;
    endX: number;
    endY: number;
}

interface AspectRatio {
    name: string;
    ratio: number | null; // null = free
    icon: React.ElementType;
}

const aspectRatios: AspectRatio[] = [
    { name: 'Libre', ratio: null, icon: Crop },
    { name: '1:1', ratio: 1, icon: Square },
    { name: '16:9', ratio: 16 / 9, icon: RectangleHorizontal },
    { name: '9:16', ratio: 9 / 16, icon: Smartphone },
    { name: '4:3', ratio: 4 / 3, icon: RectangleHorizontal },
    { name: '3:4', ratio: 3 / 4, icon: RectangleVertical },
    { name: '21:9', ratio: 21 / 9, icon: Film },
];

const predefinedFilters = [
    { name: 'Normal', filter: '', brightness: 100, contrast: 100, saturation: 100 },
    { name: 'B/N', filter: 'grayscale(100%)', brightness: 100, contrast: 110, saturation: 0 },
    { name: 'Sepia', filter: 'sepia(80%)', brightness: 100, contrast: 100, saturation: 100 },
    { name: 'Vintage', filter: 'sepia(30%)', brightness: 90, contrast: 85, saturation: 80 },
    { name: 'Cálido', filter: '', brightness: 105, contrast: 100, saturation: 120 },
    { name: 'Frío', filter: 'hue-rotate(20deg)', brightness: 100, contrast: 105, saturation: 90 },
    { name: 'Alto Contraste', filter: '', brightness: 100, contrast: 150, saturation: 110 },
    { name: 'Bajo Contraste', filter: '', brightness: 105, contrast: 75, saturation: 90 },
    { name: 'Vibrante', filter: '', brightness: 105, contrast: 110, saturation: 150 },
    { name: 'Desaturado', filter: '', brightness: 100, contrast: 100, saturation: 50 },
];

const initialState: ImageState = {
    zoom: 1,
    rotation: 0,
    flipX: false,
    flipY: false,
    brightness: 100,
    contrast: 100,
    saturation: 100,
    filter: '',
};

export function ImageViewer({
    open,
    onOpenChange,
    imageSrc,
    editMode = false,
    onSave,
    title = 'Visor de Imagen',
}: ImageViewerProps) {
    const [imageState, setImageState] = useState<ImageState>(initialState);
    const [history, setHistory] = useState<string[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const [isCropping, setIsCropping] = useState(false);
    const [cropArea, setCropArea] = useState<CropArea | null>(null);
    const [isDraggingCrop, setIsDraggingCrop] = useState(false);
    const [activeTab, setActiveTab] = useState<'transform' | 'adjust' | 'filters'>('transform');
    const [currentImage, setCurrentImage] = useState(imageSrc);
    const [selectedAspectRatio, setSelectedAspectRatio] = useState<AspectRatio>(aspectRatios[0]);
    const [magnifierActive, setMagnifierActive] = useState(false);
    const [magnifierPosition, setMagnifierPosition] = useState({ x: 0, y: 0 });
    const [magnifierImagePosition, setMagnifierImagePosition] = useState({ x: 0, y: 0 });
    const [magnifierZoom, setMagnifierZoom] = useState(3);
    const [isDraggingImage, setIsDraggingImage] = useState(false);
    const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showFullscreenControls, setShowFullscreenControls] = useState(false);
    const [imageInfo, setImageInfo] = useState<{ width: number; height: number; size?: string } | null>(null);
    const [showInfo, setShowInfo] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);
    // const canvasRef = useRef<HTMLCanvasElement>(null);
    const imageContainerRef = useRef<HTMLDivElement>(null);
    const imageRef = useRef<HTMLImageElement | null>(null);
    const fullscreenContainerRef = useRef<HTMLDivElement>(null);
    const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Sync with prop changes
    useEffect(() => {
        if (imageSrc !== currentImage) {
            setCurrentImage(imageSrc);
            setHistory([]);
            setHistoryIndex(-1);
            setImageState(initialState);
            setImagePosition({ x: 0, y: 0 });
        }
    }, [imageSrc]);

    // Reset position when zoom changes to 1
    useEffect(() => {
        if (imageState.zoom <= 1) {
            setImagePosition({ x: 0, y: 0 });
        }
    }, [imageState.zoom]);

    // Check if image overflows container (needs drag)
    const needsDrag = imageState.zoom > 1;

    // Add to history when image changes
    const addToHistory = useCallback((imageData: string) => {
        setHistory(prev => {
            const newHistory = prev.slice(0, historyIndex + 1);
            newHistory.push(imageData);
            return newHistory;
        });
        setHistoryIndex(prev => prev + 1);
    }, [historyIndex]);

    const updateState = (newState: Partial<ImageState>) => {
        setImageState((prev) => ({ ...prev, ...newState }));
    };

    const handleRotateCw = () => updateState({ rotation: (imageState.rotation + 90) % 360 });
    const handleRotateCcw = () => updateState({ rotation: (imageState.rotation - 90 + 360) % 360 });
    const handleFlipX = () => updateState({ flipX: !imageState.flipX });
    const handleFlipY = () => updateState({ flipY: !imageState.flipY });

    const handleReset = () => {
        setImageState(initialState);
        setImagePosition({ x: 0, y: 0 });
        if (imageSrc) {
            setCurrentImage(imageSrc);
        }
    };

    const handleUndo = () => {
        if (historyIndex > 0) {
            setHistoryIndex(historyIndex - 1);
            setCurrentImage(history[historyIndex - 1]);
        } else if (historyIndex === 0 && imageSrc) {
            setHistoryIndex(-1);
            setCurrentImage(imageSrc);
        }
    };

    const handleRedo = () => {
        if (historyIndex < history.length - 1) {
            setHistoryIndex(historyIndex + 1);
            setCurrentImage(history[historyIndex + 1]);
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const newImage = event.target?.result as string;
                setCurrentImage(newImage);
                addToHistory(newImage);
                handleReset();
            };
            reader.readAsDataURL(file);
        }
    };

    const applyFilter = (filterConfig: typeof predefinedFilters[0]) => {
        updateState({
            filter: filterConfig.filter,
            brightness: filterConfig.brightness,
            contrast: filterConfig.contrast,
            saturation: filterConfig.saturation,
        });
    };

    // Apply transformations and get final image
    const applyTransformations = useCallback((): Promise<string> => {
        return new Promise((resolve, reject) => {
            if (!currentImage) {
                reject('No image');
                return;
            }

            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    reject('No canvas context');
                    return;
                }

                // Handle rotation dimensions
                const isRotated90or270 = imageState.rotation === 90 || imageState.rotation === 270;
                canvas.width = isRotated90or270 ? img.height : img.width;
                canvas.height = isRotated90or270 ? img.width : img.height;

                ctx.save();
                ctx.translate(canvas.width / 2, canvas.height / 2);
                ctx.rotate((imageState.rotation * Math.PI) / 180);
                ctx.scale(imageState.flipX ? -1 : 1, imageState.flipY ? -1 : 1);
                ctx.filter = `brightness(${imageState.brightness}%) contrast(${imageState.contrast}%) saturate(${imageState.saturation}%) ${imageState.filter}`;
                ctx.drawImage(img, -img.width / 2, -img.height / 2);
                ctx.restore();

                resolve(canvas.toDataURL('image/png'));
            };
            img.onerror = () => reject('Failed to load image');
            img.src = currentImage;
        });
    }, [currentImage, imageState]);

    // Apply crop
    const applyCrop = useCallback(async () => {
        if (!cropArea || !currentImage || !imageRef.current || !imageContainerRef.current) return;

        const img = imageRef.current;
        const container = imageContainerRef.current;
        const imgRect = img.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();

        // Calculate crop coordinates relative to the actual image
        const scaleX = img.naturalWidth / imgRect.width;
        const scaleY = img.naturalHeight / imgRect.height;

        const cropX = Math.min(cropArea.startX, cropArea.endX) - (imgRect.left - containerRect.left);
        const cropY = Math.min(cropArea.startY, cropArea.endY) - (imgRect.top - containerRect.top);
        const cropWidth = Math.abs(cropArea.endX - cropArea.startX);
        const cropHeight = Math.abs(cropArea.endY - cropArea.startY);

        // Clamp to image bounds
        const clampedX = Math.max(0, cropX);
        const clampedY = Math.max(0, cropY);
        const clampedWidth = Math.min(cropWidth, imgRect.width - clampedX);
        const clampedHeight = Math.min(cropHeight, imgRect.height - clampedY);

        if (clampedWidth < 10 || clampedHeight < 10) {
            setIsCropping(false);
            setCropArea(null);
            return;
        }

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.width = clampedWidth * scaleX;
        canvas.height = clampedHeight * scaleY;

        const sourceImg = new Image();
        sourceImg.crossOrigin = 'anonymous';
        sourceImg.onload = () => {
            ctx.drawImage(
                sourceImg,
                clampedX * scaleX,
                clampedY * scaleY,
                clampedWidth * scaleX,
                clampedHeight * scaleY,
                0,
                0,
                canvas.width,
                canvas.height
            );

            const croppedImage = canvas.toDataURL('image/png');
            setCurrentImage(croppedImage);
            addToHistory(croppedImage);
            setIsCropping(false);
            setCropArea(null);
            setImageState(prev => ({ ...prev, zoom: 1 }));
            setImagePosition({ x: 0, y: 0 });
        };
        sourceImg.src = currentImage;
    }, [cropArea, currentImage, addToHistory]);

    const handleCropMouseDown = (e: React.MouseEvent) => {
        if (!isCropping || !imageContainerRef.current) return;

        const rect = imageContainerRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        setCropArea({
            startX: x,
            startY: y,
            endX: x,
            endY: y,
        });
        setIsDraggingCrop(true);
    };

    const handleCropMouseMove = (e: React.MouseEvent) => {
        if (!isDraggingCrop || !cropArea || !imageContainerRef.current) return;

        const rect = imageContainerRef.current.getBoundingClientRect();
        let x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
        let y = Math.max(0, Math.min(e.clientY - rect.top, rect.height));

        // Apply aspect ratio constraint
        if (selectedAspectRatio.ratio !== null) {
            const width = x - cropArea.startX;
            const height = y - cropArea.startY;
            const absWidth = Math.abs(width);
            const absHeight = Math.abs(height);

            if (absWidth / selectedAspectRatio.ratio > absHeight) {
                const newHeight = absWidth / selectedAspectRatio.ratio;
                y = cropArea.startY + (height >= 0 ? newHeight : -newHeight);
            } else {
                const newWidth = absHeight * selectedAspectRatio.ratio;
                x = cropArea.startX + (width >= 0 ? newWidth : -newWidth);
            }
        }

        setCropArea(prev => prev ? { ...prev, endX: x, endY: y } : null);
    };

    const handleCropMouseUp = () => {
        setIsDraggingCrop(false);
    };

    // Image drag handlers for when zoomed
    const handleImageMouseDown = (e: React.MouseEvent) => {
        if (isCropping || magnifierActive || !needsDrag) return;
        e.preventDefault();
        setIsDraggingImage(true);
        setDragStart({ x: e.clientX - imagePosition.x, y: e.clientY - imagePosition.y });
    };

    const handleImageMouseMove = (e: React.MouseEvent) => {
        // Magnifier logic - calculate position relative to the actual image
        if (magnifierActive && imageContainerRef.current && imageRef.current) {
            const containerRect = imageContainerRef.current.getBoundingClientRect();
            const imgRect = imageRef.current.getBoundingClientRect();

            // Cursor position relative to container (for magnifier display position)
            const cursorX = e.clientX - containerRect.left;
            const cursorY = e.clientY - containerRect.top;

            // Cursor position relative to the displayed image
            const imgRelativeX = e.clientX - imgRect.left;
            const imgRelativeY = e.clientY - imgRect.top;

            // Calculate the position as a percentage of the image
            const imgPercentX = imgRelativeX / imgRect.width;
            const imgPercentY = imgRelativeY / imgRect.height;

            setMagnifierPosition({ x: cursorX, y: cursorY });
            setMagnifierImagePosition({ x: imgPercentX, y: imgPercentY });
        }

        // Drag logic
        if (!isDraggingImage || !needsDrag) return;

        const newX = e.clientX - dragStart.x;
        const newY = e.clientY - dragStart.y;

        // Limit drag bounds based on zoom level
        const maxOffset = (imageState.zoom - 1) * 200;
        setImagePosition({
            x: Math.max(-maxOffset, Math.min(maxOffset, newX)),
            y: Math.max(-maxOffset, Math.min(maxOffset, newY)),
        });
    };

    const handleMagnifierWheel = (e: React.WheelEvent) => {
        if (!magnifierActive) return;
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.5 : 0.5;
        setMagnifierZoom(prev => Math.max(1.5, Math.min(8, prev + delta)));
    };

    const handleImageMouseUp = () => {
        setIsDraggingImage(false);
    };

    // Fullscreen handlers
    const toggleFullscreen = useCallback(() => {
        if (!document.fullscreenElement) {
            fullscreenContainerRef.current?.requestFullscreen();
            setIsFullscreen(true);
        } else {
            document.exitFullscreen();
            setIsFullscreen(false);
        }
    }, []);

    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    // Fullscreen controls hover
    const handleFullscreenMouseMove = () => {
        if (!isFullscreen) return;
        setShowFullscreenControls(true);
        if (controlsTimeoutRef.current) {
            clearTimeout(controlsTimeoutRef.current);
        }
        controlsTimeoutRef.current = setTimeout(() => {
            setShowFullscreenControls(false);
        }, 2500);
    };

    // Get image info
    useEffect(() => {
        if (currentImage && imageRef.current) {
            const img = new Image();
            img.onload = () => {
                setImageInfo({
                    width: img.naturalWidth,
                    height: img.naturalHeight,
                    size: currentImage.length > 1000
                        ? `${(currentImage.length / 1024).toFixed(1)} KB`
                        : `${currentImage.length} B`
                });
            };
            img.src = currentImage;
        }
    }, [currentImage]);

    // Copy image to clipboard
    const handleCopyImage = async () => {
        if (!currentImage) return;
        try {
            const finalImage = await applyTransformations();
            const response = await fetch(finalImage);
            const blob = await response.blob();
            await navigator.clipboard.write([
                new ClipboardItem({ [blob.type]: blob })
            ]);
            toast.success('Imagen copiada al portapapeles');
        } catch (error) {
            console.error('Error copying image:', error);
            toast.error('Error al copiar imagen');
        }
    };

    // Share image
    const handleShareImage = async () => {
        if (!currentImage || !navigator.share) {
            toast.error('Compartir no disponible en este navegador');
            return;
        }
        try {
            const finalImage = await applyTransformations();
            const response = await fetch(finalImage);
            const blob = await response.blob();
            const file = new File([blob], 'imagen.png', { type: blob.type });
            await navigator.share({
                files: [file],
                title: 'Imagen',
            });
        } catch (error) {
            if ((error as Error).name !== 'AbortError') {
                console.error('Error sharing image:', error);
            }
        }
    };

    const handleDownload = async () => {
        if (!currentImage) return;
        try {
            const finalImage = await applyTransformations();
            const link = document.createElement('a');
            link.href = finalImage;
            link.download = 'imagen.png';
            link.click();
        } catch (error) {
            console.error('Error downloading image:', error);
        }
    };

    const handleSave = async () => {
        if (!currentImage || !onSave) return;
        try {
            const finalImage = await applyTransformations();
            onSave(finalImage);
            onOpenChange(false);
        } catch (error) {
            console.error('Error saving image:', error);
        }
    };

    const getTransformStyle = (): React.CSSProperties => ({
        transform: `
      translate(${imagePosition.x}px, ${imagePosition.y}px)
      scale(${imageState.zoom})
      rotate(${imageState.rotation}deg)
      scaleX(${imageState.flipX ? -1 : 1})
      scaleY(${imageState.flipY ? -1 : 1})
    `,
        filter: `
      brightness(${imageState.brightness}%)
      contrast(${imageState.contrast}%)
      saturate(${imageState.saturation}%)
      ${imageState.filter}
    `,
        transition: isDraggingImage ? 'none' : 'transform 0.2s ease, filter 0.2s ease',
        cursor: needsDrag && !isCropping && !magnifierActive ? (isDraggingImage ? 'grabbing' : 'grab') : undefined,
    });

    const getCropOverlayStyle = (): React.CSSProperties | null => {
        if (!cropArea) return null;
        const left = Math.min(cropArea.startX, cropArea.endX);
        const top = Math.min(cropArea.startY, cropArea.endY);
        const width = Math.abs(cropArea.endX - cropArea.startX);
        const height = Math.abs(cropArea.endY - cropArea.startY);
        return { left, top, width, height };
    };

    const ToolButton = ({
        icon: Icon,
        label,
        onClick,
        active = false,
        disabled = false,
        side = 'top',
    }: {
        icon: React.ElementType;
        label: string;
        onClick: () => void;
        active?: boolean;
        disabled?: boolean;
        side?: 'top' | 'right' | 'bottom' | 'left';
    }) => (
        <Tooltip>
            <TooltipTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onClick}
                    disabled={disabled}
                    className={cn(
                        'size-8 text-zinc-400 hover:text-white hover:bg-zinc-700/50',
                        active && 'bg-zinc-700 text-white'
                    )}
                >
                    <Icon className="h-4 w-4" />
                </Button>
            </TooltipTrigger>
            <TooltipContent side={side} className="bg-zinc-800 text-white border-zinc-700 text-xs z-50">
                {label}
            </TooltipContent>
        </Tooltip>
    );

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent showCloseButton={false} className="max-w-[95vw] w-full h-[90vh] p-0 bg-zinc-900 border-zinc-800 overflow-hidden">
                <DialogTitle className="sr-only">{title}</DialogTitle>
                <div
                    ref={fullscreenContainerRef}
                    className={cn(
                        "flex flex-col h-full bg-zinc-900 overflow-hidden",
                        isFullscreen && "fixed inset-0 z-[100]"
                    )}
                    onMouseMove={handleFullscreenMouseMove}
                >
                    {/* Header - hidden in fullscreen unless hovering */}
                    <div
                        className={cn(
                            "flex items-center justify-between px-4 py-3 border-b border-zinc-800 flex-shrink-0 transition-all duration-300",
                            (isFullscreen && !showFullscreenControls && !editMode) && "opacity-0 -translate-y-full pointer-events-none absolute",
                            (isFullscreen && showFullscreenControls && !editMode) && "opacity-90 translate-y-0 absolute top-0 left-0 right-0 bg-zinc-900/95 backdrop-blur-sm z-10",
                            // (isFullscreen && showFullscreenControls && editMode) && "opacity-100 translate-y-0 relative top-0 left-0 right-0 bg-zinc-900/95 backdrop-blur-sm z-10",
                        )}
                    >
                        <div className="flex items-center gap-4">
                            <h2 className="text-lg font-medium text-white">{title}</h2>
                            {editMode && (
                                <div className="flex items-center gap-1 px-2 py-1 rounded bg-amber-500/10 text-amber-500 text-xs">
                                    <span>Modo Edición</span>
                                </div>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            {editMode && (
                                <>
                                    <ToolButton
                                        side='bottom'
                                        icon={Undo}
                                        label="Deshacer"
                                        onClick={handleUndo}
                                        disabled={historyIndex < 0}
                                    />
                                    <ToolButton
                                        side='bottom'
                                        icon={Redo}
                                        label="Rehacer"
                                        onClick={handleRedo}
                                        disabled={historyIndex >= history.length - 1}
                                    />
                                    <div className="w-px h-6 bg-zinc-700 mx-2" />
                                </>
                            )}
                            <ToolButton
                                side='bottom'
                                icon={Search}
                                label={magnifierActive ? "Desactivar lupa" : "Activar lupa"}
                                onClick={() => setMagnifierActive(!magnifierActive)}
                                active={magnifierActive}
                            />
                            <ToolButton
                                side='bottom'
                                icon={Info}
                                label={showInfo ? "Ocultar información" : "Mostrar información"}
                                onClick={() => setShowInfo(!showInfo)}
                                active={showInfo}
                            />
                            <ToolButton
                                side='bottom'
                                icon={isFullscreen ? Minimize : Maximize}
                                label={isFullscreen ? "Salir de pantalla completa" : "Pantalla completa"}
                                onClick={toggleFullscreen}
                            />
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                    if (isFullscreen) document.exitFullscreen();
                                    onOpenChange(false);
                                }}
                                className="size-8 text-zinc-400 hover:text-white hover:bg-zinc-700/50"
                            >
                                <X className="h-5 w-5" />
                            </Button>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="flex flex-1 overflow-hidden min-h-0">
                        {/* Image Area */}
                        <div
                            ref={imageContainerRef}
                            className={cn(
                                "flex-1 flex items-center justify-center overflow-hidden bg-zinc-950 relative",
                                isCropping && "cursor-crosshair",
                                magnifierActive && "cursor-none"
                            )}
                            onMouseDown={isCropping ? handleCropMouseDown : handleImageMouseDown}
                            onMouseMove={(e) => {
                                if (isCropping) handleCropMouseMove(e);
                                else handleImageMouseMove(e);
                            }}
                            onMouseUp={() => {
                                if (isCropping) handleCropMouseUp();
                                else handleImageMouseUp();
                            }}
                            onMouseLeave={() => {
                                if (isCropping) handleCropMouseUp();
                                else handleImageMouseUp();
                                if (magnifierActive) setMagnifierPosition({ x: -100, y: -100 });
                            }}
                            onWheel={magnifierActive ? handleMagnifierWheel : undefined}
                        >
                            {currentImage ? (
                                <img
                                    ref={imageRef}
                                    src={currentImage}
                                    alt="Vista previa"
                                    className="max-w-full max-h-full object-contain select-none"
                                    style={getTransformStyle()}
                                    draggable={false}
                                />
                            ) : (
                                <div className="flex flex-col items-center justify-center gap-4 text-zinc-500">
                                    <div className="w-24 h-24 border-2 border-dashed border-zinc-700 rounded-lg flex items-center justify-center">
                                        {
                                            editMode ? (
                                                <Upload className="size-14" />
                                            ) : (
                                                <ImageIcon className="size-14" />
                                            )
                                        }
                                    </div>
                                    <p className="text-sm">No hay imagen cargada</p>
                                    {editMode && (
                                        <Button
                                            variant="outline"
                                            onClick={() => fileInputRef.current?.click()}
                                            className="bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700 hover:text-white"
                                        >
                                            Cargar imagen
                                        </Button>
                                    )}
                                </div>
                            )}

                            {/* Magnifier */}
                            {magnifierActive && currentImage && imageRef.current && (
                                <div
                                    className="absolute w-36 h-36 rounded-full border-2 border-white shadow-lg overflow-hidden pointer-events-none"
                                    style={{
                                        left: magnifierPosition.x - 72,
                                        top: magnifierPosition.y - 72,
                                        display: magnifierPosition.x < 0 ? 'none' : 'block',
                                        boxShadow: '0 0 20px rgba(0,0,0,0.5)',
                                    }}
                                >
                                    <div
                                        className="w-full h-full"
                                        style={{
                                            backgroundImage: `url(${currentImage})`,
                                            backgroundSize: `${(imageRef.current?.naturalWidth || 0) * magnifierZoom}px ${(imageRef.current?.naturalHeight || 0) * magnifierZoom}px`,
                                            backgroundPosition: `${-magnifierImagePosition.x * (imageRef.current?.naturalWidth || 0) * magnifierZoom + 72}px ${-magnifierImagePosition.y * (imageRef.current?.naturalHeight || 0) * magnifierZoom + 72}px`,
                                            backgroundRepeat: 'no-repeat',
                                        }}
                                    />
                                    <div className="absolute bottom-1 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-zinc-900/80 text-white text-xs rounded">
                                        {magnifierZoom.toFixed(1)}x
                                    </div>
                                </div>
                            )}

                            {/* Crop Overlay */}
                            {isCropping && cropArea && (
                                <>
                                    <div className="absolute inset-0 bg-black/60 pointer-events-none" />
                                    <div
                                        className="absolute border-2 border-white bg-transparent pointer-events-none"
                                        style={getCropOverlayStyle() || undefined}
                                    >
                                        {/* Grid lines */}
                                        <div className="absolute inset-0 grid grid-cols-3 grid-rows-3">
                                            {[...Array(9)].map((_, i) => (
                                                <div key={i} className="border border-white/30" />
                                            ))}
                                        </div>
                                        {/* Corner handles */}
                                        <div className="absolute -top-1 -left-1 w-3 h-3 bg-white border border-zinc-800" />
                                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-white border border-zinc-800" />
                                        <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-white border border-zinc-800" />
                                        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-white border border-zinc-800" />
                                        {/* Dimensions */}
                                        {getCropOverlayStyle() && (
                                            <div className="absolute -top-6 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-zinc-800 text-white text-xs rounded">
                                                {Math.round(getCropOverlayStyle()!.width as number)} x {Math.round(getCropOverlayStyle()!.height as number)}
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}

                            {/* Zoom Indicator & Image Info */}
                            <div
                                className={cn(
                                    "absolute bottom-4 left-4 flex flex-col gap-2 transition-opacity duration-300",
                                    isFullscreen && !showFullscreenControls && "opacity-0 pointer-events-none",
                                    (isFullscreen && showFullscreenControls && !editMode) && "bottom-16",
                                )}
                            >
                                <div className={cn(
                                    "px-3 py-1.5 bg-zinc-800/80 rounded text-sm text-white flex items-center gap-2",
                                )}>
                                    <span>{Math.round(imageState.zoom * 100)}%</span>
                                    {needsDrag && (
                                        <span className="text-xs text-zinc-400">• Arrastra para mover</span>
                                    )}
                                </div>
                                {showInfo && imageInfo && (
                                    <div className={cn(
                                        "px-3 py-2 bg-zinc-800/80 rounded text-xs text-white space-y-1 w-max",
                                    )}>
                                        <div className="flex justify-between gap-4">
                                            <span className="text-zinc-400">Dimensiones:</span>
                                            <span>{imageInfo.width} × {imageInfo.height}px</span>
                                        </div>
                                        {imageInfo.size && (
                                            <div className="flex justify-between gap-4">
                                                <span className="text-zinc-400">Tamaño:</span>
                                                <span>{imageInfo.size}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between gap-4">
                                            <span className="text-zinc-400">Rotación:</span>
                                            <span>{imageState.rotation}°</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Sidebar Tools (Edit Mode Only) */}
                        {editMode && (
                            <div className="w-72 border-l border-zinc-800 bg-zinc-900 flex flex-col flex-shrink-0">
                                {/* Tabs */}
                                <div className="flex border-b border-zinc-800">
                                    <button
                                        onClick={() => setActiveTab('transform')}
                                        className={cn(
                                            'flex-1 py-3 text-xs font-medium transition-colors',
                                            activeTab === 'transform'
                                                ? 'text-white border-b-2 border-white'
                                                : 'text-zinc-500 hover:text-zinc-300'
                                        )}
                                    >
                                        Transformar
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('filters')}
                                        className={cn(
                                            'flex-1 py-3 text-xs font-medium transition-colors',
                                            activeTab === 'filters'
                                                ? 'text-white border-b-2 border-white'
                                                : 'text-zinc-500 hover:text-zinc-300'
                                        )}
                                    >
                                        Filtros
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('adjust')}
                                        className={cn(
                                            'flex-1 py-3 text-xs font-medium transition-colors',
                                            activeTab === 'adjust'
                                                ? 'text-white border-b-2 border-white'
                                                : 'text-zinc-500 hover:text-zinc-300'
                                        )}
                                    >
                                        Ajustes
                                    </button>
                                </div>

                                {/* Tab Content */}
                                <div className="flex-1 overflow-y-auto p-4 space-y-6">
                                    {activeTab === 'transform' && (
                                        <>
                                            {/* Zoom */}
                                            <div className="space-y-3">
                                                <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
                                                    Zoom (solo visual)
                                                </label>
                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => updateState({ zoom: Math.max(0.5, imageState.zoom - 0.25) })}
                                                        className="size-8 text-zinc-400 hover:text-white hover:bg-zinc-700/50"
                                                    >
                                                        <ZoomOut className="h-4 w-4" />
                                                    </Button>
                                                    <Slider
                                                        value={[imageState.zoom]}
                                                        min={0.5}
                                                        max={4}
                                                        step={0.1}
                                                        onValueChange={([val]) => updateState({ zoom: val })}
                                                        className="flex-1"
                                                    />
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => updateState({ zoom: Math.min(4, imageState.zoom + 0.25) })}
                                                        className="size-8 text-zinc-400 hover:text-white hover:bg-zinc-700/50"
                                                    >
                                                        <ZoomIn className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                                <div className="text-center text-sm text-zinc-400">
                                                    {Math.round(imageState.zoom * 100)}%
                                                </div>
                                            </div>

                                            {/* Rotation */}
                                            <div className="space-y-3">
                                                <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
                                                    Rotación
                                                </label>
                                                <div className="flex gap-2">
                                                    <Button
                                                        variant="outline"
                                                        onClick={handleRotateCcw}
                                                        className="flex-1 bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700 hover:text-white"
                                                    >
                                                        <RotateCcw className="size-4" />
                                                        -90°
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        onClick={handleRotateCw}
                                                        className="flex-1 bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700 hover:text-white"
                                                    >
                                                        <RotateCw className="size-4" />
                                                        +90°
                                                    </Button>
                                                </div>
                                                <div className="text-center text-sm text-zinc-400">
                                                    {imageState.rotation}°
                                                </div>
                                            </div>

                                            {/* Flip */}
                                            <div className="space-y-3">
                                                <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
                                                    Voltear
                                                </label>
                                                <div className="flex gap-2">
                                                    <Button
                                                        variant="outline"
                                                        onClick={handleFlipX}
                                                        className={cn(
                                                            'flex-1 bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700 hover:text-white',
                                                            imageState.flipX ? 'text-amber-500 border-amber-500 hover:text-amber-500' : 'text-white'
                                                        )}
                                                    >
                                                        <FlipHorizontal className="size-4" />
                                                        Horizontal
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        onClick={handleFlipY}
                                                        className={cn(
                                                            'flex-1 bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700 hover:text-white',
                                                            imageState.flipY ? 'text-amber-500 border-amber-500 hover:text-amber-500' : 'text-white'
                                                        )}
                                                    >
                                                        <FlipVertical className="size-4" />
                                                        Vertical
                                                    </Button>
                                                </div>
                                            </div>

                                            {/* Crop */}
                                            <div className="space-y-3">
                                                <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
                                                    Recortar
                                                </label>

                                                {/* Aspect Ratio Selection */}
                                                <div className="grid grid-cols-4 gap-1">
                                                    {aspectRatios.map((ratio) => (
                                                        <Button
                                                            key={ratio.name}
                                                            variant="outline"
                                                            onClick={() => setSelectedAspectRatio(ratio)}
                                                            className={cn(
                                                                'h-11 p-2 gap-1 flex flex-col items-center justify-center text-xs bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700 hover:text-white',
                                                                selectedAspectRatio.name === ratio.name
                                                                    ? 'text-amber-500 border-amber-500 hover:text-amber-500'
                                                                    : 'text-white'
                                                            )}
                                                        >
                                                            <ratio.icon className="w-3 h-3" />
                                                            <span className="text-[10px]">{ratio.name}</span>
                                                        </Button>
                                                    ))}
                                                </div>

                                                {!isCropping ? (
                                                    <Button
                                                        variant="outline"
                                                        onClick={() => {
                                                            setIsCropping(true);
                                                            setCropArea(null);
                                                        }}
                                                        disabled={!currentImage}
                                                        className="w-full bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700 hover:text-white"
                                                    >
                                                        <Crop className="w-4 h-4 mr-2" />
                                                        Seleccionar área
                                                    </Button>
                                                ) : (
                                                    <div className="space-y-2">
                                                        <p className="text-xs text-zinc-400 text-center">
                                                            Arrastra sobre la imagen para seleccionar el área a recortar
                                                        </p>
                                                        <div className="flex gap-2">
                                                            <Button
                                                                variant="outline"
                                                                onClick={() => {
                                                                    setIsCropping(false);
                                                                    setCropArea(null);
                                                                }}
                                                                className="flex-1 bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700 hover:text-white"
                                                            >
                                                                <X className="size-4" />
                                                                Cancelar
                                                            </Button>
                                                            <Button
                                                                onClick={applyCrop}
                                                                disabled={!cropArea}
                                                                variant={'outline'}
                                                            // className="flex-1 bg-amber-500 text-black hover:bg-amber-400"
                                                            >
                                                                <Check className="size-4" />
                                                                Aplicar
                                                            </Button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </>
                                    )}

                                    {activeTab === 'filters' && (
                                        <div className="space-y-3">
                                            <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
                                                Filtros Predefinidos
                                            </label>
                                            <div className="grid grid-cols-2 gap-2">
                                                {predefinedFilters.map((filterConfig) => (
                                                    <button
                                                        key={filterConfig.name}
                                                        onClick={() => applyFilter(filterConfig)}
                                                        className={cn(
                                                            'p-2 rounded border text-xs font-medium transition-all',
                                                            imageState.filter === filterConfig.filter &&
                                                                imageState.brightness === filterConfig.brightness &&
                                                                imageState.contrast === filterConfig.contrast &&
                                                                imageState.saturation === filterConfig.saturation
                                                                ? 'border-amber-500 bg-amber-500/10 text-amber-500'
                                                                : 'border-zinc-700 bg-zinc-800 text-white hover:bg-zinc-700'
                                                        )}
                                                    >
                                                        {filterConfig.name}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {activeTab === 'adjust' && (
                                        <>
                                            {/* Brightness */}
                                            <div className="space-y-3">
                                                <div className="flex items-center gap-2">
                                                    <Sun className="w-4 h-4 text-zinc-400" />
                                                    <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
                                                        Brillo
                                                    </label>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Slider
                                                        value={[imageState.brightness]}
                                                        min={0}
                                                        max={200}
                                                        step={1}
                                                        onValueChange={([val]) => updateState({ brightness: val })}
                                                        className="flex-1"
                                                    />
                                                    <span className="text-sm text-zinc-400 w-12 text-right">
                                                        {imageState.brightness}%
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Contrast */}
                                            <div className="space-y-3">
                                                <div className="flex items-center gap-2">
                                                    <Contrast className="w-4 h-4 text-zinc-400" />
                                                    <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
                                                        Contraste
                                                    </label>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Slider
                                                        value={[imageState.contrast]}
                                                        min={0}
                                                        max={200}
                                                        step={1}
                                                        onValueChange={([val]) => updateState({ contrast: val })}
                                                        className="flex-1"
                                                    />
                                                    <span className="text-sm text-zinc-400 w-12 text-right">
                                                        {imageState.contrast}%
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Saturation */}
                                            <div className="space-y-3">
                                                <div className="flex items-center gap-2">
                                                    <Droplets className="w-4 h-4 text-zinc-400" />
                                                    <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
                                                        Saturación
                                                    </label>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Slider
                                                        value={[imageState.saturation]}
                                                        min={0}
                                                        max={200}
                                                        step={1}
                                                        onValueChange={([val]) => updateState({ saturation: val })}
                                                        className="flex-1"
                                                    />
                                                    <span className="text-sm text-zinc-400 w-12 text-right">
                                                        {imageState.saturation}%
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Reset Adjustments */}
                                            <Button
                                                variant="outline"
                                                onClick={() => updateState({ brightness: 100, contrast: 100, saturation: 100, filter: '' })}
                                                className="w-full bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700 hover:text-white"
                                            >
                                                <RefreshCw className="w-4 h-4 mr-2" />
                                                Restablecer ajustes
                                            </Button>
                                        </>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Bottom Toolbar - hidden in fullscreen unless hovering */}
                    <div
                        className={cn(
                            "flex items-center justify-between px-4 py-3 border-t border-zinc-800 flex-shrink-0 transition-all duration-300",
                            (isFullscreen && !showFullscreenControls && !editMode) && "opacity-0 translate-y-full pointer-events-none absolute",
                            (isFullscreen && showFullscreenControls && !editMode) && "opacity-90 translate-y-0 absolute bottom-0 left-0 right-0 bg-zinc-900/95 backdrop-blur-sm z-10",
                            // (isFullscreen && showFullscreenControls && editMode) && "opacity-100 translate-y-0 relative bottom-0 left-0 right-0 bg-zinc-900/95 backdrop-blur-sm z-10",
                        )}
                    >
                        <div className="flex items-center gap-1">
                            {!editMode && (
                                <>
                                    <ToolButton icon={ZoomOut} label="Alejar" onClick={() => updateState({ zoom: Math.max(0.5, imageState.zoom - 0.25) })} />
                                    <ToolButton icon={ZoomIn} label="Acercar" onClick={() => updateState({ zoom: Math.min(4, imageState.zoom + 0.25) })} />
                                    <div className="w-px h-6 bg-zinc-700 mx-2" />
                                    <ToolButton icon={RotateCcw} label="Rotar izquierda" onClick={handleRotateCcw} />
                                    <ToolButton icon={RotateCw} label="Rotar derecha" onClick={handleRotateCw} />
                                    <div className="w-px h-6 bg-zinc-700 mx-2" />
                                    <ToolButton icon={FlipHorizontal} label="Voltear horizontal" onClick={handleFlipX} active={imageState.flipX} />
                                    <ToolButton icon={FlipVertical} label="Voltear vertical" onClick={handleFlipY} active={imageState.flipY} />
                                    <div className="w-px h-6 bg-zinc-700 mx-2" />
                                </>
                            )}
                            <ToolButton icon={RefreshCw} label="Restablecer" onClick={handleReset} />
                        </div>

                        <div className="flex items-center gap-2">
                            {!editMode && (
                                <>
                                    <ToolButton icon={Copy} label="Copiar imagen" onClick={handleCopyImage} />
                                    <ToolButton icon={Share2} label="Compartir" onClick={handleShareImage} />
                                    <div className="w-px h-6 bg-zinc-700 mx-2" />
                                </>
                            )}
                            {editMode && (
                                <>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFileUpload}
                                        className="hidden"
                                    />
                                    <Button
                                        variant="outline"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700 hover:text-white"
                                    >
                                        <Upload className="w-4 h-4 mr-2" />
                                        Cargar
                                    </Button>
                                </>
                            )}
                            <Button
                                variant="outline"
                                onClick={handleDownload}
                                disabled={!currentImage}
                                className="bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700 hover:text-white"
                            >
                                <Download className="w-4 h-4 mr-2" />
                                Descargar
                            </Button>
                            {editMode && (
                                <Button
                                    onClick={handleSave}
                                    disabled={!currentImage}
                                    variant={'outline'}
                                // className="bg-amber-500 text-black hover:bg-amber-400"
                                >
                                    <Check className="w-4 h-4 mr-2" />
                                    Guardar
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}