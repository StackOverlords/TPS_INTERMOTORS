//! Comandos Tauri para gestión de plugins externos.
//!
//! # Contratos
//!
//! ## manifest.json (por plugin, en `plugins/<id>/manifest.json`)
//! ```json
//! {
//!   "id": "com.rhleone.facturacion",
//!   "name": "facturacionPlugin",
//!   "version": "1.0.0",
//!   "entry": "remoteEntry.js"
//! }
//! ```
//! - `id`      : reverse-DNS, único por plugin
//! - `name`    : identificador JS válido para @module-federation/runtime
//! - `version` : semver
//! - `entry`   : nombre del archivo JS dentro del dir del plugin (SIN path)
//!
//! ## plugins.json (estado global, en `plugins/plugins.json`)
//! ```json
//! {
//!   "com.rhleone.facturacion": true,
//!   "com.rhleone.inventario": false
//! }
//! ```
//! Map `id → enabled`. Si un plugin no aparece: enabled = true (default).
//!
//! ## Contrato Rust ↔ TypeScript (custom scheme `plugin://`)
//! - Rust devuelve `entry` como **path RELATIVO bajo `plugins_dir`**, con forward slashes.
//!   Formato: `"<id>/<manifest.entry>"`, ej: `"com.rhleone.facturacion/remoteEntry.js"`.
//! - TS (`TauriPluginSource`) construye la URL del custom scheme `plugin://`:
//!   Linux/macOS: `plugin://localhost/<id>/remoteEntry.js`
//!   Windows:     `http://plugin.localhost/<id>/remoteEntry.js`
//! - El handler Rust (`register_uri_scheme_protocol("plugin", ...)` en `lib.rs`) parsea
//!   esa URI, mapea a `<app_data_dir>/plugins/<relPath>`, y sirve el archivo con MIME correcto.
//! - Ventaja sobre asset protocol: los imports relativos `./assets/x.js` del remoteEntry.js
//!   resuelven dentro del mismo scheme sin colapsarse (Module Federation multi-chunk funciona).
//!
//! ## ExternalPluginRef (struct serializable, shape alineado a RustExternalPlugin en TS)
//! Campos: `id`, `name`, `version`, `entry` (path RELATIVO bajo plugins_dir), `enabled`
//! Todos snake_case en JSON (sin rename_all) para coincidir con el mapper TS.

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use std::path::{Path, PathBuf};
use tauri::AppHandle;
use tauri::Manager;

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

/// Shape serializable que matchea `RustExternalPlugin` en TauriPluginSource.ts.
/// Campos en snake_case (sin serde rename_all) para coincidir con el mapper TS.
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ExternalPluginRef {
    pub id: String,
    pub name: String,
    pub version: String,
    /// Path RELATIVO bajo `plugins_dir`, con forward slashes.
    /// Formato: `"<id>/<manifest.entry>"`, ej: `"com.rhleone.facturacion/remoteEntry.js"`.
    /// El lado TypeScript construye la URL `plugin://localhost/<entry>` con este valor.
    pub entry: String,
    pub enabled: bool,
}

/// Shape del manifest.json dentro de cada directorio de plugin.
#[derive(Debug, Deserialize)]
struct PluginManifest {
    id: String,
    name: String,
    version: String,
    /// Nombre del archivo JS dentro del dir del plugin. Ej: "remoteEntry.js"
    entry: String,
}

/// Map id → enabled leído/escrito en plugins.json.
type PluginsState = HashMap<String, bool>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/// Devuelve `<app_data_dir>/plugins/`.
/// `pub(crate)` para que el handler del custom scheme en `lib.rs` pueda reutilizarlo.
pub(crate) fn plugins_dir(app: &AppHandle) -> Result<PathBuf, String> {
    let base = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("No se pudo resolver app_data_dir: {e}"))?;
    Ok(base.join("plugins"))
}

/// Devuelve `<plugins_dir>/plugins.json`.
fn state_file(plugins_dir: &Path) -> PathBuf {
    plugins_dir.join("plugins.json")
}

/// Lee el estado global (plugins.json). Si no existe devuelve mapa vacío.
fn read_state(plugins_dir: &Path) -> Result<PluginsState, String> {
    let path = state_file(plugins_dir);
    if !path.exists() {
        return Ok(HashMap::new());
    }
    let raw = fs::read_to_string(&path)
        .map_err(|e| format!("Error leyendo plugins.json: {e}"))?;
    serde_json::from_str(&raw)
        .map_err(|e| format!("plugins.json malformado: {e}"))
}

/// Persiste el estado global (plugins.json).
fn write_state(plugins_dir: &Path, state: &PluginsState) -> Result<(), String> {
    let path = state_file(plugins_dir);
    let raw = serde_json::to_string_pretty(state)
        .map_err(|e| format!("Error serializando plugins.json: {e}"))?;
    fs::write(&path, raw).map_err(|e| format!("Error escribiendo plugins.json: {e}"))
}

/// Lee el manifest.json de un directorio de plugin.
fn read_manifest(plugin_dir: &Path) -> Result<PluginManifest, String> {
    let manifest_path = plugin_dir.join("manifest.json");
    if !manifest_path.exists() {
        return Err(format!(
            "manifest.json no encontrado en: {}",
            plugin_dir.display()
        ));
    }
    let raw = fs::read_to_string(&manifest_path)
        .map_err(|e| format!("Error leyendo manifest.json: {e}"))?;
    serde_json::from_str(&raw)
        .map_err(|e| format!("manifest.json malformado: {e}"))
}

/// Construye un `ExternalPluginRef` desde un directorio de plugin y el estado global.
///
/// `entry` se devuelve como path RELATIVO bajo `plugins_dir`, con forward slashes.
/// Formato: `"<id>/<manifest.entry>"`, ej: `"com.rhleone.facturacion/remoteEntry.js"`.
/// El nombre del directorio del plugin se usa como `<id>` (install copia a `<plugins_dir>/<id>/`).
fn build_ref(plugin_dir: &Path, state: &PluginsState) -> Result<ExternalPluginRef, String> {
    let manifest = read_manifest(plugin_dir)?;
    // Usar el nombre del directorio como primer segmento del path relativo.
    // Esto es el ID porque install_plugin copia a <plugins_dir>/<id>/.
    let dir_name = plugin_dir
        .file_name()
        .and_then(|n| n.to_str())
        .ok_or_else(|| "Nombre de directorio de plugin no es UTF-8 válido".to_string())?;
    // Construir el path relativo con forward slashes (multiplataforma para URLs).
    let entry = format!("{}/{}", dir_name, manifest.entry);
    // Default enabled = true si no aparece en plugins.json
    let enabled = *state.get(&manifest.id).unwrap_or(&true);
    Ok(ExternalPluginRef {
        id: manifest.id,
        name: manifest.name,
        version: manifest.version,
        entry,
        enabled,
    })
}

/// Copia recursiva de un directorio origen a destino.
fn copy_dir_recursive(src: &Path, dst: &Path) -> Result<(), String> {
    fs::create_dir_all(dst)
        .map_err(|e| format!("No se pudo crear directorio {}: {e}", dst.display()))?;
    for entry in fs::read_dir(src)
        .map_err(|e| format!("No se pudo leer directorio {}: {e}", src.display()))?
    {
        let entry = entry.map_err(|e| format!("Error leyendo entrada: {e}"))?;
        let src_path = entry.path();
        let dst_path = dst.join(entry.file_name());
        if src_path.is_dir() {
            copy_dir_recursive(&src_path, &dst_path)?;
        } else {
            fs::copy(&src_path, &dst_path)
                .map_err(|e| format!("Error copiando {}: {e}", src_path.display()))?;
        }
    }
    Ok(())
}

// ---------------------------------------------------------------------------
// Comandos Tauri
// ---------------------------------------------------------------------------

/// Lista todos los plugins externos instalados en `app_data_dir/plugins/`.
///
/// - Si el directorio no existe, lo crea y devuelve vec vacío.
/// - Para cada subdirectorio: lee manifest.json y plugins.json para enabled.
/// - `entry` en el resultado es un PATH RELATIVO bajo `plugins_dir` (ej: `"com.rhleone.facturacion/remoteEntry.js"`).
///   El lado TS construye la URL `plugin://localhost/<entry>` con ese valor.
#[tauri::command]
pub fn get_external_plugins(app: AppHandle) -> Result<Vec<ExternalPluginRef>, String> {
    let dir = plugins_dir(&app)?;
    if !dir.exists() {
        fs::create_dir_all(&dir)
            .map_err(|e| format!("No se pudo crear plugins dir: {e}"))?;
        return Ok(vec![]);
    }
    let state = read_state(&dir)?;
    let mut plugins = Vec::new();
    for entry in fs::read_dir(&dir)
        .map_err(|e| format!("Error leyendo plugins dir: {e}"))?
    {
        let entry = entry.map_err(|e| format!("Error leyendo entrada: {e}"))?;
        let path = entry.path();
        // Solo subdirectorios (no plugins.json ni otros archivos)
        if path.is_dir() {
            match build_ref(&path, &state) {
                Ok(plugin_ref) => plugins.push(plugin_ref),
                Err(e) => {
                    // Plugin inválido (sin manifest): skip con log
                    log::warn!("Plugin inválido en {}: {e}", path.display());
                }
            }
        }
    }
    Ok(plugins)
}

/// Instala un plugin desde un directorio fuente.
///
/// - `source`: path absoluto a un directorio de plugin que contiene manifest.json.
/// - Copia el directorio a `app_data_dir/plugins/<id>/`.
/// - Registra en plugins.json con enabled = true.
/// - Devuelve el ExternalPluginRef del plugin instalado.
///
/// TODO: soportar instalación desde archivo ZIP (pendiente para Fase 5+).
#[tauri::command]
pub fn install_plugin(app: AppHandle, source: String) -> Result<ExternalPluginRef, String> {
    let src_path = PathBuf::from(&source);
    if !src_path.is_dir() {
        return Err(format!(
            "La fuente debe ser un directorio: {}",
            src_path.display()
        ));
    }
    // Validar manifest antes de copiar
    let manifest = read_manifest(&src_path)?;
    let dir = plugins_dir(&app)?;
    fs::create_dir_all(&dir)
        .map_err(|e| format!("No se pudo crear plugins dir: {e}"))?;
    let dest = dir.join(&manifest.id);
    // Si ya existe, reemplazamos (reinstalación / actualización)
    if dest.exists() {
        fs::remove_dir_all(&dest)
            .map_err(|e| format!("No se pudo limpiar instalación previa: {e}"))?;
    }
    copy_dir_recursive(&src_path, &dest)?;
    // Registrar en plugins.json como enabled = true
    let mut state = read_state(&dir)?;
    state.insert(manifest.id.clone(), true);
    write_state(&dir, &state)?;
    // Construir ref desde el destino recién copiado
    build_ref(&dest, &state)
}

/// Desinstala un plugin por su ID.
///
/// - Elimina `app_data_dir/plugins/<id>/`.
/// - Elimina la entrada de plugins.json.
#[tauri::command]
pub fn uninstall_plugin(app: AppHandle, id: String) -> Result<(), String> {
    let dir = plugins_dir(&app)?;
    let plugin_dir = dir.join(&id);
    if plugin_dir.exists() {
        fs::remove_dir_all(&plugin_dir)
            .map_err(|e| format!("Error eliminando plugin {id}: {e}"))?;
    }
    // Actualizar plugins.json
    let mut state = read_state(&dir)?;
    state.remove(&id);
    write_state(&dir, &state)?;
    Ok(())
}

/// Habilita o deshabilita un plugin sin desinstalarlo.
///
/// - Actualiza la entrada en plugins.json.
/// - No verifica que el plugin esté instalado (silencioso si no existe).
#[tauri::command]
pub fn set_plugin_enabled(app: AppHandle, id: String, enabled: bool) -> Result<(), String> {
    let dir = plugins_dir(&app)?;
    fs::create_dir_all(&dir)
        .map_err(|e| format!("No se pudo crear plugins dir: {e}"))?;
    let mut state = read_state(&dir)?;
    state.insert(id, enabled);
    write_state(&dir, &state)?;
    Ok(())
}
