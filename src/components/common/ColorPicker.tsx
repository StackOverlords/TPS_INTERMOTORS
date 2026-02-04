import { useState, useEffect } from 'react';
import { Button } from '@/components/atoms/button';
import { Slider } from '@/components/atoms/slider';
import { Badge } from '@/components/atoms/badge';

interface ColorPickerProps {
  label: string;
  description: string;
  value: string | null; // null = usar color del tema, string = color personalizado
  onChange: (color: string | null) => void;
}

/**
 * Convierte RGBA a objeto separado
 * rgba(255, 0, 0, 0.5) -> { r: 255, g: 0, b: 0, a: 0.5 }
 */
const parseRGBA = (rgba: string) => {
  const match = rgba.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
  if (!match) return { r: 0, g: 0, b: 0, a: 1 };

  return {
    r: parseInt(match[1]),
    g: parseInt(match[2]),
    b: parseInt(match[3]),
    a: match[4] ? parseFloat(match[4]) : 1,
  };
};

/**
 * Convierte RGB a HEX
 * { r: 255, g: 0, b: 0 } -> "#ff0000"
 */
const rgbToHex = (r: number, g: number, b: number) => {
  return '#' + [r, g, b].map(x => {
    const hex = x.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
};

/**
 * Convierte HEX a RGB
 * "#ff0000" -> { r: 255, g: 0, b: 0 }
 */
const hexToRgb = (hex: string) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  } : { r: 0, g: 0, b: 0 };
};

export const ColorPicker = ({ label, description, value, onChange }: ColorPickerProps) => {
  const isUsingThemeColor = value === null;

  // Valores por defecto cuando no hay personalización
  const defaultColor = 'rgba(128, 128, 128, 0.5)'; // Color neutral placeholder
  const effectiveColor = value ?? defaultColor;

  const parsed = parseRGBA(effectiveColor);
  const [hexColor, setHexColor] = useState(rgbToHex(parsed.r, parsed.g, parsed.b));
  const [opacity, setOpacity] = useState(parsed.a);

  // Actualizar cuando cambia el valor externo
  useEffect(() => {
    if (value) {
      const parsed = parseRGBA(value);
      setHexColor(rgbToHex(parsed.r, parsed.g, parsed.b));
      setOpacity(parsed.a);
    }
  }, [value]);

  const handleHexChange = (newHex: string) => {
    setHexColor(newHex);
    const rgb = hexToRgb(newHex);
    const newRgba = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity})`;
    onChange(newRgba);
  };

  const handleOpacityChange = (newOpacity: number) => {
    setOpacity(newOpacity);
    const rgb = hexToRgb(hexColor);
    const newRgba = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${newOpacity})`;
    onChange(newRgba);
  };

  const resetToDefault = () => {
    // Reset a null = usar color del tema
    onChange(null);
  };

  return (
    <div className="flex items-center justify-between py-3">
      <div className="flex-1">
        <p className="font-medium">{label}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="flex items-center gap-3">
        {isUsingThemeColor ? (
          /* Estado: Usando color del tema */
          <>
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-dashed border-primary/30 bg-primary/5">
              <span className="text-sm text-primary font-medium">Color del tema</span>
            </div>
            <Button
              variant="default"
              size="sm"
              onClick={() => {
                // Iniciar con un color base
                const defaultStart = 'rgba(59, 130, 246, 0.15)';
                onChange(defaultStart);
              }}
              className="shrink-0"
            >
              Personalizar
            </Button>
          </>
        ) : (
          /* Estado: Color personalizado */
          <>
            {/* Preview del color */}
            <div
              className="w-10 h-10 rounded-lg border-2 border-border shadow-sm"
              style={{ backgroundColor: effectiveColor }}
            />

            {/* Input de color nativo */}
            <input
              type="color"
              value={hexColor}
              onChange={(e) => handleHexChange(e.target.value)}
              className="w-10 h-10 rounded cursor-pointer border-2 border-border"
              title="Seleccionar color"
            />

            {/* Slider de opacidad */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground whitespace-nowrap">Opacidad:</span>
              <Slider
                value={[opacity * 100]}
                onValueChange={([value]) => handleOpacityChange(value / 100)}
                max={100}
                min={0}
                step={1}
                className="w-20"
              />
              <Badge variant="outline" className="w-12 justify-center">
                {Math.round(opacity * 100)}%
              </Badge>
            </div>

            {/* Botón restablecer */}
            <Button
              variant="outline"
              size="sm"
              onClick={resetToDefault}
              className="shrink-0"
            >
              Reset
            </Button>
          </>
        )}
      </div>
    </div>
  );
};
