import { cn } from "@/lib/utils";
import * as React from "react";
import {
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  CornerDownLeft,
  Delete,
  Space,
  ChevronUp,
  ChevronDown,
  MoveDownRight,
  MoveUpLeft,
  CommandIcon,
} from "lucide-react";

type KbdProps = React.ComponentProps<"kbd"> & {
  variant?: "light" | "dark";
  useIcons?: boolean;
  crossPlatform?: boolean; // Mapea teclas equivalentes entre plataformas
};

// Función para detectar la plataforma
const isMac = () => {
  if (typeof window === "undefined") return false;
  return (
    /Mac|iPod|iPhone|iPad/.test(window.navigator.platform) ||
    /Mac/.test(window.navigator.userAgent)
  );
};

// Componente para renderizar iconos
const KeyIcon = ({
  name,
  className = "size-3 font-normal",
}: {
  name: string;
  className?: string;
}) => {
  const iconProps = { className: className };

  switch (name) {
    case "up":
      return <ArrowUp {...iconProps} />;
    case "down":
      return <ArrowDown {...iconProps} />;
    case "left":
      return <ArrowLeft {...iconProps} />;
    case "right":
      return <ArrowRight {...iconProps} />;
    case "enter":
      return <CornerDownLeft {...iconProps} />;
    case "backspace":
      return <Delete {...iconProps} />;
    case "space":
      return <Space {...iconProps} />;
    case "home":
      return <MoveUpLeft {...iconProps} />;
    case "end":
      return <MoveDownRight {...iconProps} />;
    case "pageup":
      return <ChevronUp {...iconProps} />;
    case "pagedown":
      return <ChevronDown {...iconProps} />;
    case "command":
      return <CommandIcon {...iconProps} />;
    default:
      return null;
  }
};

// Mapeo cross-platform de teclas equivalentes
const getCrossPlatformKey = (
  key: string,
  targetPlatform: "mac" | "windows"
): string => {
  const normalizedKey = key.toLowerCase().replace(/\s+/g, "");

  const crossPlatformMappings = {
    // Windows → Mac
    toMac: {
      ctrl: "cmd",
      control: "command",
      win: "cmd",
      windows: "command",
      alt: "option",
      delete: "backspace", // En Mac, Delete actúa como Backspace
      insert: "fn", // Insert no existe en Mac, se mapea a Fn
    } as Record<string, string>,
    // Mac → Windows
    toWindows: {
      cmd: "ctrl",
      command: "ctrl",
      option: "alt",
      backspace: "backspace", // Se mantiene igual
      fn: "insert", // Fn se mapea a Insert en contextos similares
    } as Record<string, string>,
  };

  const mappingKey = targetPlatform === "mac" ? "toMac" : "toWindows";
  return crossPlatformMappings[mappingKey][normalizedKey] || key;
};

// Tipo para la configuración de teclas
type KeyConfig = {
  symbol: string;
  icon: string | null;
  text: string;
};

// Mapeo de teclas a símbolos y configuración de iconos
const getKeyConfig = (
  key: string,
  platform: "mac" | "windows",
  useIcons: boolean,
  crossPlatform: boolean
) => {
  // Si crossPlatform está activado, mapear la tecla primero
  const mappedKey = crossPlatform ? getCrossPlatformKey(key, platform) : key;
  const normalizedKey = mappedKey.toLowerCase().replace(/\s+/g, "");

  const keyConfigs: Record<"mac" | "windows", Record<string, KeyConfig>> = {
    mac: {
      cmd: { symbol: "⌘", icon: "command", text: "Cmd" },
      command: { symbol: "⌘", icon: "command", text: "Cmd" },
      ctrl: { symbol: "⌃", icon: null, text: "Ctrl" },
      control: { symbol: "⌃", icon: null, text: "Ctrl" },
      alt: { symbol: "⌥", icon: null, text: "Alt" },
      option: { symbol: "⌥", icon: null, text: "Option" },
      shift: { symbol: "⇧", icon: null, text: "Shift" },
      tab: { symbol: "⇥", icon: null, text: "Tab" },
      enter: { symbol: "↩", icon: "enter", text: "Enter" },
      return: { symbol: "↩", icon: "enter", text: "Return" },
      backspace: { symbol: "⌫", icon: "backspace", text: "Backspace" },
      delete: { symbol: "⌦", icon: null, text: "Delete" },
      escape: { symbol: "⎋", icon: null, text: "Esc" },
      esc: { symbol: "⎋", icon: null, text: "Esc" },
      space: { symbol: "␣", icon: "space", text: "Space" },
      up: { symbol: "↑", icon: "up", text: "↑" },
      down: { symbol: "↓", icon: "down", text: "↓" },
      left: { symbol: "←", icon: "left", text: "←" },
      right: { symbol: "→", icon: "right", text: "→" },
      capslock: { symbol: "⇪", icon: null, text: "Caps" },
      home: { symbol: "↖", icon: "home", text: "Home" },
      end: { symbol: "↘", icon: "end", text: "End" },
      pageup: { symbol: "⇞", icon: "pageup", text: "PgUp" },
      pagedown: { symbol: "⇟", icon: "pagedown", text: "PgDn" },
    },
    windows: {
      cmd: { symbol: "Win", icon: null, text: "Win" },
      command: { symbol: "Win", icon: null, text: "Win" },
      ctrl: { symbol: "Ctrl", icon: null, text: "Ctrl" },
      control: { symbol: "Ctrl", icon: null, text: "Ctrl" },
      alt: { symbol: "Alt", icon: null, text: "Alt" },
      option: { symbol: "Alt", icon: null, text: "Alt" },
      shift: { symbol: "Shift", icon: null, text: "Shift" },
      tab: { symbol: "Tab", icon: null, text: "Tab" },
      enter: { symbol: "Enter", icon: "enter", text: "Enter" },
      return: { symbol: "Enter", icon: "enter", text: "Enter" },
      backspace: { symbol: "Backspace", icon: "backspace", text: "Backspace" },
      delete: { symbol: "Del", icon: null, text: "Del" },
      escape: { symbol: "Esc", icon: null, text: "Esc" },
      esc: { symbol: "Esc", icon: null, text: "Esc" },
      space: { symbol: "Space", icon: "space", text: "Space" },
      up: { symbol: "↑", icon: "up", text: "↑" },
      down: { symbol: "↓", icon: "down", text: "↓" },
      left: { symbol: "←", icon: "left", text: "←" },
      right: { symbol: "→", icon: "right", text: "→" },
      capslock: { symbol: "Caps Lock", icon: null, text: "Caps" },
      home: { symbol: "Home", icon: "home", text: "Home" },
      end: { symbol: "End", icon: "end", text: "End" },
      pageup: { symbol: "PgUp", icon: "pageup", text: "PgUp" },
      pagedown: { symbol: "PgDn", icon: "pagedown", text: "PgDn" },
    },
  };

  const config = keyConfigs[platform][normalizedKey];
  if (!config) return { display: mappedKey, isIcon: false, originalKey: key };

  if (useIcons && config.icon) {
    return { display: config.icon, isIcon: true, originalKey: key };
  }

  return {
    display: platform === "mac" ? config.symbol : config.text,
    isIcon: false,
    originalKey: key, // Guardamos la tecla original para referencia
  };
};

// Función para parsear combinaciones de teclas
const parseKeyCombo = (
  input: string,
  platform: "mac" | "windows",
  useIcons: boolean,
  crossPlatform: boolean
) => {
  // Dividir por '+' o espacios, pero mantener palabras como "page up"
  const parts = input
    .split(/(\s*\+\s*|\s+)/)
    .map((part) => part.trim())
    .filter((part) => part && part !== "+");

  return parts
    .map((part, index) => {
      const config = getKeyConfig(part, platform, useIcons, crossPlatform);
      return {
        key: `${part}-${index}`,
        display: config.display,
        isIcon: config.isIcon,
        isPlus: false,
        originalKey: config.originalKey,
      };
    })
    .reduce(
      (acc, item, index, array) => {
        acc.push(item);
        // Agregar '+' entre elementos (excepto el último)
        if (index < array.length - 1) {
          acc.push({
            key: `plus-${index}`,
            display: "+",
            isIcon: false,
            isPlus: true,
            originalKey: "+",
          });
        }
        return acc;
      },
      [] as Array<{
        key: string;
        display: string;
        isIcon: boolean;
        isPlus: boolean;
        originalKey: string;
      }>
    );
};

const Kbd = React.forwardRef<HTMLElement, KbdProps>(
  (
    {
      className,
      variant = "light",
      useIcons = false,
      crossPlatform = true,
      children,
      ...props
    },
    ref
  ) => {
    const [platform, setPlatform] = React.useState<"mac" | "windows">("mac");

    React.useEffect(() => {
      setPlatform(isMac() ? "mac" : "windows");
    }, []);

    const variantClasses =
      variant === "dark"
        ? "bg-primary-foreground/20 text-primary-foreground border border-primary-foreground/30 shadow-gray-600"
        : "text-muted-foreground border-border bg-card";

    // Procesar el contenido para mostrar los símbolos/iconos correctos
    const processedContent = React.useMemo(() => {
      if (typeof children === "string") {
        const keyCombo = parseKeyCombo(
          children,
          platform,
          useIcons,
          crossPlatform
        );

        if (keyCombo.length === 1 && !keyCombo[0].isPlus) {
          // Una sola tecla
          const item = keyCombo[0];
          return item.isIcon ? <KeyIcon name={item.display} /> : item.display;
        }

        // Múltiples teclas o combinación
        return (
          <span className="flex items-center gap-0.5 justify-center">
            {keyCombo.map((item) =>
              item.isPlus ? (
                <span key={item.key} className="text-[0.5rem]">
                  {""}
                </span>
              ) : item.isIcon ? (
                <KeyIcon key={item.key} name={item.display} />
              ) : (
                <span key={item.key}>{item.display}</span>
              )
            )}
          </span>
        );
      }
      return children;
    }, [children, platform, useIcons, crossPlatform]);

    return (
      <kbd
        className={cn(
          "inline-flex h-5 min-w-5 max-w-max shadow-sm items-center justify-center rounded border px-1 font-medium text-[0.625rem]",
          variantClasses,
          className
        )}
        ref={ref}
        {...props}
      >
        {processedContent}
      </kbd>
    );
  }
);
Kbd.displayName = "Kbd";

export { Kbd };
