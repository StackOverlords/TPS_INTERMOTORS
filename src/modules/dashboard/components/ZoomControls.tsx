import { Button } from '@/components/atoms/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/atoms/dropdown-menu';
import { Input } from '@/components/atoms/input';
import { useZoom } from '@/hooks/useZoom';
import { Minus, MonitorSmartphone, Plus, RotateCcw } from 'lucide-react';
import { useEffect, useState } from 'react';

export function ZoomControls() {
  const { zoomLevel, zoomIn, zoomOut, zoomReset, setZoom } = useZoom();
  const [inputValue, setInputValue] = useState(String(Math.round(zoomLevel * 100)));
  const [isInputFocused, setIsInputFocused] = useState(false);

  // Sincronizar inputValue con zoomLevel solo cuando el input no está en foco
  useEffect(() => {
    if (!isInputFocused) {
      setInputValue(String(Math.round(zoomLevel * 100)));
    }
  }, [zoomLevel, isInputFocused]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    setInputValue(value);
  };

  const handleInputFocus = () => {
    setIsInputFocused(true);
  };

  const handleInputBlur = () => {
    setIsInputFocused(false);
    let numValue = parseInt(inputValue);
    if (isNaN(numValue) || numValue < 50) numValue = 50;
    if (numValue > 300) numValue = 300;

    setZoom(numValue / 100);
    setInputValue(String(numValue));
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      (e.target as HTMLInputElement).blur();
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="size-8"
          title={`Zoom: ${Math.round(zoomLevel * 100)}%`}
        >
          <MonitorSmartphone className="h-4 w-4" />
          {zoomLevel !== 1 && (
            <span className="absolute -top-2 -right-2 flex h-3 w-3 items-center justify-center rounded-full bg-primary text-[8px] text-primary-foreground font-bold">
              {zoomLevel > 1 ? '+' : '-'}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 p-3">
        {/* Control de zoom con botones */}
        <div className="flex items-center justify-center gap-2 mb-3">
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={zoomOut}
            disabled={zoomLevel <= 0.5}
            title="Alejar (Ctrl -)"
          >
            <Minus className="h-4 w-4" />
          </Button>

          <div className="flex items-center gap-1">
            <Input
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
              onKeyDown={handleInputKeyDown}
              className="w-16 h-8 text-sm text-center px-2 tabular-nums font-medium"
              maxLength={3}
            />
            <span className="text-sm text-muted-foreground font-medium">%</span>
          </div>

          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={zoomIn}
            disabled={zoomLevel >= 3}
            title="Acercar (Ctrl +)"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* Límites de referencia */}
        <div className="flex justify-between text-xs text-muted-foreground mb-3 px-1">
          <span>Mín: 50%</span>
          <span>Máx: 300%</span>
        </div>

        {/* Botón de reset */}
        <Button
          variant="outline"
          size="sm"
          onClick={zoomReset}
          className="w-full text-xs h-8"
          disabled={zoomLevel === 1}
        >
          <RotateCcw className="mr-2 h-3.5 w-3.5" />
          Restablecer (100%)
        </Button>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
