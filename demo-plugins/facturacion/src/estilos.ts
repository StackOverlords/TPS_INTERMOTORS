import css from "./styles.css?inline";

/**
 * Ciclo de vida de los estilos del plugin.
 *
 * VERIFICADO contra el loader del host (`HttpPluginSource.ts`,
 * `TauriPluginSource.ts`, `plugin-manager.ts`): ninguno inyecta stylesheets de
 * los remotes. El host solo carga el bundle JS del `remoteEntry.js` y llama a
 * `activate()`. Si el plugin necesita CSS propio, es el plugin quien tiene
 * que ponerlo en el DOM y quien tiene que sacarlo — nadie lo hace por él.
 *
 * `?inline` de Vite entrega el CSS ya compilado como string en build time, así
 * que no dependemos de que el host sepa servir un `.css` aparte por HTTP.
 */
const STYLE_TAG_ATTR = "data-plugin";
const PLUGIN_ID = "com.rhleone.facturacion";

/**
 * Inyecta el `<style>` del plugin en `document.head`.
 * Idempotente: si el plugin se reactiva sin que el head se haya limpiado
 * (por ejemplo, un hot-reload de desarrollo), no duplica el tag.
 */
export function montarEstilos(): void {
  const yaExiste = document.head.querySelector(
    `style[${STYLE_TAG_ATTR}="${PLUGIN_ID}"]`,
  );
  if (yaExiste) {
    return;
  }

  const tag = document.createElement("style");
  tag.setAttribute(STYLE_TAG_ATTR, PLUGIN_ID);
  tag.textContent = css;
  document.head.appendChild(tag);
}

/**
 * Remueve el `<style>` del plugin. Se llama en `deactivate()` para que
 * desinstalar el plugin no deje CSS fantasma en el head del host — el mismo
 * tipo de fantasma que ya mordió a la instalación de plugins antes.
 */
export function desmontarEstilos(): void {
  const tag = document.head.querySelector(
    `style[${STYLE_TAG_ATTR}="${PLUGIN_ID}"]`,
  );
  tag?.remove();
}
