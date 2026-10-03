/**
 * Declaraciones de módulo específicas de este plugin.
 *
 * TypeScript no conoce el sufijo `?inline` de Vite (importar un CSS como
 * string ya compilado) porque no viene en los tipos de `vite/client` para
 * este caso puntual. Sin esto, `import css from "./styles.css?inline"` en
 * `estilos.ts` no tipa.
 */
declare module "*.css?inline" {
  const css: string;
  export default css;
}
