# TPS Intermotors

Aplicación de escritorio para gestión de repuestos automotrices. Construida con **React + TypeScript + Tauri**.

## Stack

| Capa | Tecnología |
|------|-----------|
| UI | React 19, TypeScript, Tailwind CSS |
| Desktop | Tauri v2 (Rust) |
| State | Zustand |
| Forms | React Hook Form + Zod |
| Build | Vite |
| CI/CD | GitHub Actions |

---

## Setup local

```bash
# Dependencias
npm install

# Dev (frontend solo)
npm run dev

# Dev (Tauri completo)
npm run tauri:dev
```

> El backend corre en Docker. Ver instrucciones de setup del backend en el repo correspondiente.

---

## Estructura del proyecto

```
src/                    # Frontend React
src-tauri/              # Backend Rust (Tauri)
  src/                  # Código Rust
  tauri.conf.json       # Configuración de la app
  Cargo.toml            # Dependencias Rust
tools/
  release/              # TUI para gestión de releases (Go)
.github/
  workflows/
    release.yml         # Build y release automático (trigger: tags v*-t1/t2)
    demo-build.yml      # Build de demo (trigger: manual)
```

---

## Convenciones de commit

Usamos [Conventional Commits](https://www.conventionalcommits.org/):

```
feat(módulo): descripción
fix(módulo): descripción
chore(release): bump version to X.Y.Z   ← generado automáticamente por tps-release
```

---

## Toasts

```tsx
import {
  showInfoToast,
  showSuccessToast,
  showWarningToast,
  showErrorToast
} from "@/hooks/use-toast-enhanced"

showSuccessToast({
  title: "Éxito",
  description: "La acción se completó correctamente.",
  duration: 5000
})
```

---

## Proceso de release

> Los releases se manejan con **`tps-release`**, una TUI en Go que automatiza todo el proceso.

### Instalación del tool (una sola vez)

Requiere tener Go instalado.

```bash
npm run release:install
```

Esto compila el binario y lo instala en `$GOPATH/bin`. Después de esto, `tps-release` queda disponible globalmente.

### Hacer un release

```bash
# Desde la raíz del proyecto, en la rama development:
tps-release

# O sin instalar el binario:
npm run release
```

### Qué hace el tool

1. Valida que los 3 archivos de versión estén sincronizados:
   - `package.json`
   - `src-tauri/tauri.conf.json`
   - `src-tauri/Cargo.toml`
2. Te permite elegir el tipo de bump: **patch / minor / major**
3. Muestra un preview del commit y los tags que se van a crear
4. Muestra los commits incluidos en el release
5. Ejecuta todo automáticamente:
   - Actualiza los 3 archivos de versión
   - Crea el commit: `chore(release): bump version to X.Y.Z`
   - Crea los tags `vX.Y.Z-t1` y `vX.Y.Z-t2`
   - Pushea commit + tags al remote
6. Si algo falla, hace rollback automático

### Variantes

Cada versión tiene dos variantes que se buildean en CI:

| Variante | Tag | Descripción |
|----------|-----|-------------|
| T1 | `vX.Y.Z-t1` | Tenant 1 |
| T2 | `vX.Y.Z-t2` | Tenant 2 |

El push de los tags dispara el workflow `release.yml` en GitHub Actions, que genera los instaladores (`.msi`, `.exe`) para cada variante.

### Actualizar el tool tras cambios

Si se modifica el código en `tools/release/`, reinstalar:

```bash
npm run release:install
```

---

## Demo Build

Para generar un build de demo con una URL de API personalizada, usar el workflow manual en GitHub Actions (`demo-build.yml`).

Inputs requeridos:
- `api_url` — URL de la API demo (obligatorio)
- `ws_url` — URL WebSocket (opcional, usa `api_url` si se omite)
- `reverb_host`, `reverb_port`, `reverb_scheme` — configuración de Reverb (opcional)
