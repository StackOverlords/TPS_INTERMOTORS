# Guía: Ventanas Tauri y Eventos Bidireccionales

Esta guía te muestra cómo crear ventanas secundarias en Tauri y comunicarte entre ellas usando eventos bidireccionales.

---

## Tabla de Contenidos

1. [Conceptos Básicos](#conceptos-básicos)
2. [Paso 1: Configurar Permisos en Tauri](#paso-1-configurar-permisos-en-tauri)
3. [Paso 2: Crear Hook Personalizado](#paso-2-crear-hook-personalizado)
4. [Paso 3: Usar el Hook en tu Componente](#paso-3-usar-el-hook-en-tu-componente)
5. [Paso 4: Enviar Eventos (Ventana Principal → Secundaria)](#paso-4-enviar-eventos-ventana-principal--secundaria)
6. [Paso 5: Recibir Eventos (Ventana Secundaria → Principal)](#paso-5-recibir-eventos-ventana-secundaria--principal)
7. [Ejemplo Completo: Sistema de Sincronización](#ejemplo-completo-sistema-de-sincronización)
8. [Troubleshooting](#troubleshooting)

---

## Conceptos Básicos

### ¿Qué son las Ventanas Tauri?

- **Ventana Principal**: La primera ventana que se abre al iniciar la app
- **Ventana Secundaria**: Ventanas adicionales que puedes abrir/cerrar dinámicamente
- **WebviewWindow**: API de Tauri para crear y gestionar ventanas

### ¿Cómo funcionan los eventos?

```
┌─────────────────┐                    ┌─────────────────┐
│  Ventana        │  ── emit() ──>     │  Ventana        │
│  Principal      │                    │  Secundaria     │
│                 │  <── emit() ──     │                 │
└─────────────────┘                    └─────────────────┘
```

Los eventos son **bidireccionales**: cualquier ventana puede enviar y recibir eventos.

---

## Paso 1: Configurar Permisos en Tauri

### 1.1 Abrir `src-tauri/capabilities/default.json`

```json
{
  "$schema": "../gen/schemas/desktop-schema.json",
  "identifier": "default",
  "description": "Capability for the main window",
  "windows": ["main"],
  "permissions": [
    "core:default",
    "core:window:allow-create",           // ✅ Permite crear ventanas
    "core:window:allow-close",            // ✅ Permite cerrar ventanas
    "core:event:allow-emit",              // ✅ Permite enviar eventos
    "core:event:allow-listen",            // ✅ Permite escuchar eventos
    "core:webview:allow-create-webview",  // ✅ Permite crear webviews
    "core:webview:allow-webview-close"    // ✅ Permite cerrar webviews
  ]
}
```

### 1.2 Verificar permisos en `src-tauri/tauri.conf.json`

```json
{
  "bundle": {
    "active": true
  },
  "security": {
    "capabilities": ["default"]  // ✅ Asegúrate que esté configurado
  }
}
```

---

## Paso 2: Crear Hook Personalizado

### 2.1 Crear archivo `src/hooks/useSecondaryWindow.ts`

```typescript
import { WebviewWindow } from '@tauri-apps/api/webviewWindow';
import { useCallback, useEffect, useState } from 'react';

interface UseSecondaryWindowConfig {
  // Identificador único de la ventana
  windowId: string;

  // Ruta que se mostrará en la ventana
  url: string;

  // Título de la ventana
  title: string;

  // Dimensiones (opcional)
  width?: number;
  height?: number;

  // Posición (opcional)
  x?: number;
  y?: number;

  // Otras opciones
  resizable?: boolean;
  center?: boolean;
}

export function useSecondaryWindow(config: UseSecondaryWindowConfig) {
  const [isOpen, setIsOpen] = useState(false);
  const [window, setWindow] = useState<WebviewWindow | null>(null);

  // Verificar si la ventana ya existe
  useEffect(() => {
    const checkWindow = async () => {
      const existingWindow = WebviewWindow.getByLabel(config.windowId);
      if (existingWindow) {
        setIsOpen(true);
        setWindow(existingWindow);
      }
    };
    checkWindow();
  }, [config.windowId]);

  // Función para abrir la ventana
  const open = useCallback(async () => {
    try {
      // Verificar si ya existe
      let existingWindow = WebviewWindow.getByLabel(config.windowId);

      if (existingWindow) {
        // Si existe, solo hacerla visible y enfocarla
        await existingWindow.show();
        await existingWindow.setFocus();
        setIsOpen(true);
        setWindow(existingWindow);
        return;
      }

      // Crear nueva ventana
      const newWindow = new WebviewWindow(config.windowId, {
        url: config.url,
        title: config.title,
        width: config.width || 800,
        height: config.height || 600,
        center: config.center ?? true,
        resizable: config.resizable ?? true,
        x: config.x,
        y: config.y,
      });

      // Esperar a que la ventana se cree
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Timeout creando ventana'));
        }, 5000);

        newWindow.once('tauri://created', () => {
          clearTimeout(timeout);
          resolve();
        });

        newWindow.once('tauri://error', (error) => {
          clearTimeout(timeout);
          reject(error);
        });
      });

      setIsOpen(true);
      setWindow(newWindow);

    } catch (error) {
      console.error('Error abriendo ventana:', error);
      setIsOpen(false);
    }
  }, [config]);

  // Función para cerrar la ventana
  const close = useCallback(async () => {
    try {
      const existingWindow = WebviewWindow.getByLabel(config.windowId);
      if (existingWindow) {
        await existingWindow.close();
      }
      setIsOpen(false);
      setWindow(null);
    } catch (error) {
      console.error('Error cerrando ventana:', error);
    }
  }, [config.windowId]);

  return {
    isOpen,
    window,
    open,
    close,
  };
}
```

---

## Paso 3: Usar el Hook en tu Componente

### 3.1 Ejemplo básico - Abrir ventana de configuración

```typescript
import { useSecondaryWindow } from '@/hooks/useSecondaryWindow';

function SettingsButton() {
  const settingsWindow = useSecondaryWindow({
    windowId: 'settings-window',
    url: '/settings',  // Ruta de tu app
    title: 'Configuración',
    width: 900,
    height: 700,
  });

  return (
    <button onClick={settingsWindow.open}>
      {settingsWindow.isOpen ? 'Configuración Abierta' : 'Abrir Configuración'}
    </button>
  );
}
```

---

## Paso 4: Enviar Eventos (Ventana Principal → Secundaria)

### 4.1 Enviar evento desde la ventana principal

```typescript
import { emit } from '@tauri-apps/api/event';

function MainWindow() {
  const sendConfigUpdate = async () => {
    // Emitir evento que todas las ventanas pueden escuchar
    await emit('config-updated', {
      theme: 'dark',
      language: 'es',
      timestamp: Date.now(),
    });

    console.log('✅ Evento enviado: config-updated');
  };

  return (
    <button onClick={sendConfigUpdate}>
      Actualizar Configuración
    </button>
  );
}
```

### 4.2 Enviar a una ventana específica

```typescript
import { WebviewWindow } from '@tauri-apps/api/webviewWindow';

async function sendToSpecificWindow() {
  const targetWindow = WebviewWindow.getByLabel('settings-window');

  if (targetWindow) {
    await targetWindow.emit('specific-event', {
      message: 'Hola desde ventana principal'
    });
  }
}
```

---

## Paso 5: Recibir Eventos (Ventana Secundaria → Principal)

### 5.1 Escuchar eventos en cualquier ventana

```typescript
import { listen } from '@tauri-apps/api/event';
import { useEffect } from 'react';

function ConfigDisplay() {
  useEffect(() => {
    // Escuchar evento
    const unlisten = listen('config-updated', (event) => {
      console.log('📩 Evento recibido:', event.payload);

      // event.payload contiene los datos enviados
      const { theme, language, timestamp } = event.payload;

      // Actualizar tu estado/UI
      // ...
    });

    // Cleanup: dejar de escuchar cuando el componente se desmonte
    return () => {
      unlisten.then(fn => fn());
    };
  }, []);

  return <div>Configuración</div>;
}
```

### 5.2 Escuchar eventos con tipos TypeScript

```typescript
import { listen, Event } from '@tauri-apps/api/event';

interface ConfigPayload {
  theme: 'light' | 'dark';
  language: string;
  timestamp: number;
}

function ConfigDisplay() {
  useEffect(() => {
    const unlisten = listen<ConfigPayload>('config-updated', (event: Event<ConfigPayload>) => {
      // event.payload ahora tiene tipos
      console.log('Tema:', event.payload.theme);
      console.log('Idioma:', event.payload.language);
    });

    return () => {
      unlisten.then(fn => fn());
    };
  }, []);

  return <div>Configuración</div>;
}
```

---

## Ejemplo Completo: Sistema de Sincronización

### Ventana Principal - `MainScreen.tsx`

```typescript
import { emit } from '@tauri-apps/api/event';
import { listen } from '@tauri-apps/api/event';
import { useEffect, useState } from 'react';
import { useSecondaryWindow } from '@/hooks/useSecondaryWindow';

function MainScreen() {
  const [config, setConfig] = useState({ theme: 'light', fontSize: 14 });

  // Hook para ventana de configuración
  const configWindow = useSecondaryWindow({
    windowId: 'config-window',
    url: '/config',
    title: 'Configuración',
  });

  // 📩 RECIBIR: Escuchar cambios desde la ventana de configuración
  useEffect(() => {
    const unlisten = listen('config-changed', (event) => {
      console.log('📩 Configuración actualizada desde ventana secundaria');
      setConfig(event.payload);
    });

    return () => {
      unlisten.then(fn => fn());
    };
  }, []);

  // 📤 ENVIAR: Notificar cambios a otras ventanas
  const updateConfig = async (newConfig) => {
    setConfig(newConfig);
    await emit('config-changed', newConfig);
    console.log('📤 Configuración enviada a todas las ventanas');
  };

  return (
    <div>
      <h1>Ventana Principal</h1>
      <p>Tema: {config.theme}</p>
      <p>Tamaño: {config.fontSize}px</p>

      <button onClick={configWindow.open}>
        Abrir Configuración
      </button>

      <button onClick={() => updateConfig({ ...config, theme: 'dark' })}>
        Cambiar a Tema Oscuro
      </button>
    </div>
  );
}
```

### Ventana Secundaria - `ConfigScreen.tsx`

```typescript
import { emit } from '@tauri-apps/api/event';
import { listen } from '@tauri-apps/api/event';
import { useEffect, useState } from 'react';

function ConfigScreen() {
  const [config, setConfig] = useState({ theme: 'light', fontSize: 14 });

  // 📩 RECIBIR: Escuchar cambios desde otras ventanas
  useEffect(() => {
    const unlisten = listen('config-changed', (event) => {
      console.log('📩 Configuración actualizada desde otra ventana');
      setConfig(event.payload);
    });

    return () => {
      unlisten.then(fn => fn());
    };
  }, []);

  // 📤 ENVIAR: Notificar cambios a todas las ventanas
  const handleThemeChange = async (theme) => {
    const newConfig = { ...config, theme };
    setConfig(newConfig);
    await emit('config-changed', newConfig);
    console.log('📤 Configuración enviada a todas las ventanas');
  };

  return (
    <div>
      <h1>Configuración</h1>

      <div>
        <label>Tema:</label>
        <select
          value={config.theme}
          onChange={(e) => handleThemeChange(e.target.value)}
        >
          <option value="light">Claro</option>
          <option value="dark">Oscuro</option>
        </select>
      </div>

      <p>Esta ventana está sincronizada con la principal</p>
    </div>
  );
}
```

---

## Patrón Hook Reutilizable para Sincronización

### `useEventSync.ts` - Hook genérico para sincronización

```typescript
import { emit, listen } from '@tauri-apps/api/event';
import { useCallback, useEffect, useRef, useState } from 'react';

export function useEventSync<T>(eventName: string, initialValue: T) {
  const [value, setValue] = useState<T>(initialValue);
  const isUpdatingRef = useRef(false);

  // 📩 Escuchar eventos
  useEffect(() => {
    const unlisten = listen<T>(eventName, (event) => {
      if (!isUpdatingRef.current) {
        console.log(`📩 [${eventName}] Recibido:`, event.payload);
        setValue(event.payload);
      }
    });

    return () => {
      unlisten.then(fn => fn());
    };
  }, [eventName]);

  // 📤 Actualizar y emitir
  const updateValue = useCallback(async (newValue: T) => {
    isUpdatingRef.current = true;
    setValue(newValue);
    await emit(eventName, newValue);
    console.log(`📤 [${eventName}] Enviado:`, newValue);

    // Esperar un tick para evitar loops
    setTimeout(() => {
      isUpdatingRef.current = false;
    }, 0);
  }, [eventName]);

  return [value, updateValue] as const;
}
```

### Uso del hook genérico

```typescript
function AnyComponent() {
  // Sincronización automática entre ventanas
  const [theme, setTheme] = useEventSync('app:theme', 'light');
  const [language, setLanguage] = useEventSync('app:language', 'es');

  return (
    <div>
      <button onClick={() => setTheme('dark')}>
        Tema Oscuro
      </button>

      <button onClick={() => setLanguage('en')}>
        English
      </button>
    </div>
  );
}
```

---

## Troubleshooting

### Problema 1: "Window already exists"

**Error**: `Webview with label 'xxx' already exists`

**Solución**:
```typescript
// Siempre verificar antes de crear
const open = async () => {
  let window = WebviewWindow.getByLabel(windowId);

  if (window) {
    await window.show();
    await window.setFocus();
    return;
  }

  window = new WebviewWindow(windowId, { ... });
};
```

### Problema 2: Eventos no se reciben

**Causas comunes**:
1. ❌ No tienes los permisos en `capabilities/default.json`
2. ❌ No estás limpiando el listener (`unlisten`)
3. ❌ El evento se envía antes de que el listener esté activo

**Solución**:
```typescript
useEffect(() => {
  let unlistenFn: (() => void) | null = null;

  const setupListener = async () => {
    unlistenFn = await listen('my-event', (event) => {
      console.log('Evento recibido');
    });
  };

  setupListener();

  return () => {
    if (unlistenFn) unlistenFn();
  };
}, []);
```

### Problema 3: Ventanas zombie después de hot-reload

**Solución**: Agregar cleanup en desarrollo

```typescript
useEffect(() => {
  const cleanup = async () => {
    const allWindows = await WebviewWindow.getAll();
    const zombies = allWindows.filter(w => w.label === windowId);

    for (const zombie of zombies) {
      await zombie.close();
    }
  };

  cleanup();
}, []);
```

### Problema 4: Loop infinito de eventos

**Causa**: Ventana se escucha a sí misma

**Solución**: Usar flag para evitar loops

```typescript
const isUpdatingRef = useRef(false);

const updateAndEmit = async (data) => {
  isUpdatingRef.current = true;
  setData(data);
  await emit('data-changed', data);

  setTimeout(() => {
    isUpdatingRef.current = false;
  }, 0);
};

useEffect(() => {
  const unlisten = listen('data-changed', (event) => {
    if (!isUpdatingRef.current) {
      setData(event.payload);
    }
  });

  return () => unlisten.then(fn => fn());
}, []);
```

---

## Resumen de Flujo

```
┌─────────────────────────────────────────────────────────────┐
│                    PASO A PASO                              │
└─────────────────────────────────────────────────────────────┘

1. ✅ Configurar permisos en src-tauri/capabilities/default.json

2. ✅ Crear hook useSecondaryWindow

3. ✅ Usar hook en componente:
   const window = useSecondaryWindow({ ... })

4. ✅ Abrir ventana:
   window.open()

5. ✅ Enviar eventos:
   await emit('event-name', { data })

6. ✅ Recibir eventos:
   const unlisten = await listen('event-name', (e) => { ... })

7. ✅ Cleanup:
   return () => unlisten()
```

---

## Archivos de Referencia en el Proyecto

- Hook principal: `src/hooks/useSecondaryWindow.ts`
- Ejemplo de uso: `src/modules/settings/screens/settingsScreen.tsx`
- Sistema de sincronización: `src/hooks/useRouteViewConfig.tsx`
- Utilidades: `src/utils/tauriWindows.ts`

---

**¡Listo!** Con esta guía puedes crear ventanas Tauri y comunicarlas bidireccionalmente. 🚀
