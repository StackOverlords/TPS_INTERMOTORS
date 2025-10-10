import { Button } from "@/components/atoms/button";
import { X } from "lucide-react";
import { useEffect, useState } from "react";

// Componente para capturar combinaciones de teclas
const KeyRecorder = ({
  onChange,
  onCancel
}: {
  onChange: (keys: string) => void;
  onCancel: () => void;
}) => {
  const [recording, setRecording] = useState(true); // Empezar grabando automáticamente
  const [currentKeys, setCurrentKeys] = useState<string[]>([]);

  useEffect(() => {
    if (!recording) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const keys: string[] = [];

      if (e.ctrlKey) keys.push('Ctrl');
      if (e.altKey) keys.push('Alt');
      if (e.shiftKey) keys.push('Shift');
      if (e.metaKey) keys.push('Meta');

      // Agregar la tecla principal si no es un modificador
      const key = e.key.toLowerCase();
      if (!['control', 'alt', 'shift', 'meta'].includes(key)) {
        // Capitalizar teclas especiales
        const specialKeys: Record<string, string> = {
          'arrowup': '↑',
          'arrowdown': '↓',
          'arrowleft': '←',
          'arrowright': '→',
          'escape': 'Escape',
          'enter': 'Enter',
          'tab': 'Tab',
          'backspace': 'Backspace',
          'delete': 'Delete',
          'home': 'Home',
          'end': 'End',
          'pageup': 'PageUp',
          'pagedown': 'PageDown',
          ' ': 'Space'
        };
        keys.push(specialKeys[key] || key.toUpperCase());
      }

      setCurrentKeys(keys);
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (currentKeys.length > 0) {
        const keyCombination = currentKeys.join('+');
        onChange(keyCombination);
        setRecording(false);
        setCurrentKeys([]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [recording, currentKeys, onChange]);

  return (
    <div className="flex items-center gap-1">
      <div className="px-2 py-0.5 text-[11px] border border-primary/50 bg-primary/5 font-mono animate-pulse min-w-[60px] text-center rounded">
        {currentKeys.length > 0 ? currentKeys.join('+') : 'Press...'}
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => {
          setRecording(false);
          setCurrentKeys([]);
          onCancel();
        }}
        className="h-6 w-6 p-0"
      >
        <X className="w-3 h-3" />
      </Button>
    </div>
  );
};

export default KeyRecorder;