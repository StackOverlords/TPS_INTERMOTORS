# TPS Intermotors

Aplicación de escritorio para gestión de repuestos automotrices. Construida con **React + TypeScript + Tauri**.

---

## Gestión de releases

> Usamos **`tps-release`**, una TUI interactiva que automatiza todo el proceso de versioning y release. Reemplaza el proceso manual de editar 3 archivos + crear tags.

### Instalación (una sola vez por máquina)

Requiere tener Go instalado.

```bash
npm run release:install
```

Instala el binario globalmente. Después `tps-release` funciona desde cualquier directorio.

### Modos de uso

```bash
tps-release       # abre la TUI
npm run release   # alternativa sin tener el binario instalado
```

Al abrir la TUI vas a ver el dashboard con las opciones:

| Tecla | Modo | Qué hace |
|-------|------|----------|
| `n` | **Release completo** | Bump + commit + tags `t1`/`t2` + push → dispara CI |
| `b` | **Solo bump** | Bump + commit + push branch → sin tags, CI no se dispara |
| `q` | Salir | — |

### Flujo recomendado

**Opción A — Release directo** (lo más común):
```
tps-release → [n] → elegir patch/minor/major → confirmar → listo
```
El CI buildea automáticamente los instaladores para T1 y T2.

**Opción B — Bump ahora, release después**:
```
# Hoy: subir la versión al repo sin lanzar el build
tps-release → [b] → elegir patch/minor/major → confirmar

# Cuando estén listos para lanzar:
tps-release → [n] → confirmar (ya no pide bump, solo crea los tags)
```

### Qué hace el tool internamente

1. Valida que los 3 archivos de versión estén sincronizados:
   - `package.json` → campo `version`
   - `src-tauri/tauri.conf.json` → campo `version`
   - `src-tauri/Cargo.toml` → `[package].version`
2. Selección interactiva: **patch** / **minor** / **major**
3. Preview de todos los cambios antes de ejecutar
4. Ejecuta en orden y con rollback automático si algo falla:
   - Actualiza los 3 archivos
   - `git add` (solo los 3 archivos, nunca `git add .`)
   - `git commit -m "chore(release): bump version to X.Y.Z"`
   - `git tag vX.Y.Z-t1` y `git tag vX.Y.Z-t2` *(solo en modo release)*
   - `git push origin branch` + tags *(solo en modo release)*

### Actualizar el tool tras cambios en el código

```bash
npm run release:install
```

---

## Setup local

```bash
npm install        # dependencias
npm run dev        # frontend solo
npm run tauri:dev  # Tauri completo (requiere backend corriendo)
```

---

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

## Estructura del proyecto

```
src/                    # Frontend React
src-tauri/              # Backend Tauri (Rust)
  tauri.conf.json       # Config de la app
  Cargo.toml            # Dependencias Rust
tools/
  release/              # TUI de release (Go + BubbleTea)
.github/
  workflows/
    release.yml         # Build automático (trigger: tags v*-t1/t2)
    demo-build.yml      # Build de demo (trigger: manual)
```

---

## Convenciones de commit

Usamos [Conventional Commits](https://www.conventionalcommits.org/):

```
feat(módulo): descripción
fix(módulo): descripción
chore(release): bump version to X.Y.Z   ← generado por tps-release
```

---

## Variantes de build

Cada versión se buildea en dos variantes que apuntan a infraestructuras distintas:

| Variante | Tag | Descripción |
|----------|-----|-------------|
| T1 | `vX.Y.Z-t1` | Tenant 1 |
| T2 | `vX.Y.Z-t2` | Tenant 2 |

El push de los tags dispara `release.yml` en GitHub Actions, que genera los instaladores `.msi` y `.exe` para cada variante.

---

## Demo Build

Para buildear con una URL de API personalizada, usar el workflow manual en GitHub Actions (`demo-build.yml`).

Inputs:
- `api_url` — URL de la API demo (obligatorio)
- `ws_url` — WebSocket (opcional)
- `reverb_host`, `reverb_port`, `reverb_scheme` — Reverb (opcional)

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
