/**
 * Puerto: versión de la app y actualizaciones.
 *
 * En escritorio la app se autoactualiza (`plugin-updater` + relanzar el
 * proceso). En web NO existe ese concepto: la versión desplegada la sirve el
 * backend y "actualizar" es recargar la página.
 *
 * Por eso el puerto expone `supportsSelfUpdate()`: la UI debe preguntarlo y
 * esconder la sección de actualizaciones donde no aplica, en vez de mostrar
 * botones que no hacen nada.
 */

export interface AppUpdateInfo {
  currentVersion: string;
  /** Versión disponible para instalar. */
  version: string;
  /** Notas de la release, si el canal las provee. */
  notes: string | null;
  /** Fecha de publicación, si el canal la provee. */
  date: string | null;
}

export type UpdateProgress =
  | { phase: 'started'; contentLength: number }
  | { phase: 'progress'; chunkLength: number }
  | { phase: 'finished' };

export interface AppUpdaterPort {
  getCurrentVersion(): Promise<string>;

  /** `false` en web: no hay binario que reemplazar. */
  supportsSelfUpdate(): boolean;

  /**
   * Consulta el canal de actualizaciones. `null` si ya se está en la última
   * versión o si el target no se autoactualiza.
   *
   * El handle de la actualización queda guardado dentro del adaptador; el
   * consumidor no lo manipula (así el tipo de Tauri no se filtra a la UI).
   */
  checkForUpdate(): Promise<AppUpdateInfo | null>;

  /** Descarga e instala la actualización pendiente. Lanza si no hay ninguna. */
  downloadAndInstall(
    onProgress: (progress: UpdateProgress) => void,
  ): Promise<void>;

  /** Reinicia la aplicación. En web equivale a recargar la página. */
  relaunch(): Promise<void>;

  /** Olvida la actualización pendiente. */
  dismiss(): void;
}
