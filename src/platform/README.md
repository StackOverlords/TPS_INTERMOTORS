# Capa de plataforma

Frontera entre el código de negocio y el host que lo ejecuta. El negocio pide
capacidades acá y **nunca** importa `@tauri-apps/*` ni toca APIs del navegador
directamente.

Dos targets con el mismo código de negocio:

| Target  | Host                                                            |
| ------- | --------------------------------------------------------------- |
| `tauri` | Escritorio: webview del SO + backend Rust                        |
| `web`   | Navegador, servido como estático desde el `public/` del backend  |

```
src/platform/
  env.ts        isTauri() / getPlatformTarget()  — detección SÍNCRONA
  index.ts      los get*() que resuelven el adaptador activo
  ports/        los contratos (no mencionan Tauri ni el navegador)
  adapters/
    tauri/      implementación de escritorio
    web/        implementación de navegador
```

## Puertos disponibles

| Puerto                     | Acceso                        | Reemplaza a                                          |
| -------------------------- | ----------------------------- | ---------------------------------------------------- |
| `WindowManagerPort`        | `getWindowManager()`          | `api/webviewWindow`, `api/event`                      |
| `WindowChromePort`         | `getWindowChrome()`           | `api/window` (barra de título, zoom)                  |
| `KeyValueStorePort`        | `getKeyValueStore()`          | `plugin-store`                                        |
| `FileSystemPort`           | `getFileSystem()`             | `plugin-fs`, `plugin-dialog`, `plugin-shell`, `api/path` |
| `HttpPort`                 | `getHttp()`                   | `plugin-http`                                         |
| `LoggerPort`               | `getLogger()`                 | `plugin-log` (solo escritura)                         |
| `AppUpdaterPort`           | `getAppUpdater()`             | `api/app`, `plugin-updater`, `plugin-process`         |
| `ImageProcessorPort`       | `getImageProcessor()`         | comandos Rust de imagen                               |
| `ClipboardPort`            | `getClipboard()`              | comando Rust `read_clipboard_image`                   |
| `KeybindingsRepositoryPort`| `getKeybindingsRepository()`  | tabla `keybindings` de SQLite                         |
| `PreferencesRepositoryPort`| `getPreferencesRepository()`  | tabla `user_preferences` de SQLite                    |

## Reglas

### 1. La resolución es SÍNCRONA, y no es negociable

`window.open()` y `requestFullscreen()` solo se permiten **dentro del gesto del
usuario**. Cualquier `await` previo termina la tarea del gesto y el navegador
bloquea la acción **en silencio** (`window.open` devuelve `null`, sin lanzar).

Por eso el adaptador se elige **en build**, no en runtime: los `get*()` devuelven
el adaptador ya resuelto, sin `await`. Un import dinámico por target volvería
asíncrona la resolución y rompería el target web.

**Corolario para los consumidores:** al abrir una ventana secundaria, no metas
ningún `await` antes de `create()`. Ver `hooks/useSecondaryWindow.ts`. Hay un
test que lo verifica por mutación (`adapters/web/__tests__/windowManager.test.ts`).

### 1b. Un codebase, dos artefactos

`@platform-adapters` es un alias de Vite que resuelve a `adapters/tauri/index.ts`
o `adapters/web/index.ts` según `BUILD_TARGET`. El bundle de cada target **no
contiene el código del otro**.

| Comando | Target | Quién lo usa |
| --- | --- | --- |
| `npm run dev` / `npm run build` | tauri (default) | `tauri.conf.json` |
| `npm run dev:web` / `npm run build:web` | web | el navegador |

Sin la variable resuelve a `tauri` a propósito: así los comandos que ya invoca
Tauri siguen funcionando sin cambios.

Medido: el bundle web pasa de 4760,29 KB a 4721,58 KB. Lo único de Tauri que
queda es `isTauri()`, una comparación de strings de ~80 bytes — cero código de
`@tauri-apps`.

En DEV hay un chequeo que avisa si el target compilado no coincide con el host
real, para que el error no aparezca más tarde disfrazado adentro de `@tauri-apps`.

### 2. Capacidad ausente = booleano, no excepción

Cuando algo no existe en un target, el puerto expone un booleano y la UI
**esconde** la funcionalidad, en vez de mostrar controles inertes o reventar:

- `WindowChromePort.hasCustomChrome()`
- `AppUpdaterPort.supportsSelfUpdate()`
- `FileSystemPort.canRevealInFolder()`
- `ClipboardPort.canReadImage()`

### 3. El puerto va donde está la intención, no la tecnología

Los repositorios de atajos y preferencias son puertos de **dominio**, no un
`SqlPort`. El navegador no tiene motor SQL: un `SqlPort` sería una abstracción
imposible de implementar sin cargar ~1 MB de WASM.

Beneficio colateral: el adaptador de escritorio conserva las mismas sentencias
sobre `sqlite:app.db`, así que **no hay migración de datos** para los usuarios
que ya tienen atajos y preferencias guardados.

Regla general: cuando los targets difieren en **capacidad** (y no solo en API),
subí la frontera hasta la operación de negocio.

### 4. Los tipos del host no se filtran

Ningún puerto devuelve un tipo de `@tauri-apps`. `WebviewWindow` se reemplazó
por `SecondaryWindowHandle`; el handle `Update` de `plugin-updater` vive dentro
del adaptador y nunca llega al estado de React.

## Agregar un puerto nuevo

1. **Medí el uso real primero** (`rg -o 'this\.store\.\w+' | sort | uniq -c`).
   Diseñá el contrato sobre lo que los consumidores ya hacen, no sobre lo que la
   API del host ofrece.
2. Escribí `ports/<nombre>.ts` sin mencionar ningún host.
3. Implementá los dos adaptadores. El de Tauri suele ser un traslado literal.
4. Agregá el `get<Nombre>()` en `index.ts`.
5. Migrá los consumidores y verificá con `npm run typecheck` y `npm test`.

> ⚠️ El typecheck DEBE ser `tsc --noEmit -p tsconfig.app.json` (lo que corre
> `npm run typecheck`). El `tsconfig.json` raíz es *solution-style*
> (`"files": []` + `references`), así que un `tsc --noEmit` a secas **no compila
> ni un archivo** y siempre da verde. Ya ocultó 8 errores una vez.

6. Escribí los tests del adaptador web en `adapters/web/__tests__/`. Son lógica
   pura: `happy-dom` alcanza. Y comprobá que el test puede fallar —mutá el
   adaptador y verificá que rompe— antes de darlo por bueno.
