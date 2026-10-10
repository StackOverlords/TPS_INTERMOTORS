# Versión 1.13.0

Esta versión reúne todo lo publicado el 9 y el 10 de octubre (versiones 1.11.0, 1.12.0 y 1.13.0).

### Novedades

- **Aviso de actualización al iniciar sesión.** Cuando hay una versión nueva, la pantalla de inicio de sesión lo indica y permite ver sus novedades o actualizar en el momento. Actualizar es opcional: también se puede hacer después desde Configuración > Actualizaciones.
- **Novedades de cada versión.** Después de actualizar, la aplicación muestra una sola vez los cambios incluidos.
- **Tipografía.** La aplicación usa la fuente Montserrat, incluida en la instalación: se ve igual sin conexión. Se puede cambiar en Configuración > Apariencia > Tipo de fuente.
- **Lista de compras.** Al registrar un pedido, los productos pedidos se descuentan de la lista de compras de la sucursal, o se quitan de ella, según lo elegido en Configuración > Vistas > Pedidos > Lista de Pedidos. Un aviso indica cuántos productos cambiaron y permite deshacer el cambio.
- **Temas de color.** En Configuración > Apariencia > Tema de color se puede elegir un tema predefinido o importar uno de VS Code. Los colores mantienen un contraste legible en modo claro y oscuro.
- **Rendimiento.** La aplicación arranca más rápido, las pantallas se cargan a medida que se abren y cambiar de pestaña ya no recarga su contenido. El menú lateral, los listados y los selectores responden con más fluidez.
- **Plugins.** Nueva sección Configuración > Plugins para gestionar extensiones. Esta versión no incluye ningún plugin.

### Correcciones

- **Transferencias.** Ya no se pueden agregar productos sin stock en la sucursal de origen. El selector de productos muestra el stock de la sucursal de origen; antes mostraba el de CENTRAL. Si una transferencia no se puede enviar, recibir o rechazar, el aviso indica el motivo.
- **Compras y pedidos.** Al editar, se respeta el tipo de cambio con que se registró el documento. Antes se mostraba el último valor usado en la PC y, en compras, se aplicaba a todas las líneas al guardar.
- **Sesión.** Ya no se cierra al suspender la PC, al perder la conexión por un momento ni al trabajar con varias ventanas abiertas. Si venció mientras la aplicación estaba cerrada, se renueva al abrirla.
- **Ventanas secundarias.** Ya no quedan en blanco al abrirlas y, si algo falla, permiten recargar o cerrar la ventana. Al cerrar sesión, se cierran.
- **Avisos.** En la aplicación de escritorio, los avisos aparecían sobre la barra de título y desplazaban el contenido de la ventana.
- **Actualizaciones.** Si una actualización falla, el aviso muestra el motivo en lugar de un mensaje genérico.
- **Notas de versión.** La lista de correcciones se mostraba como texto con etiquetas en lugar de una lista.

---

# Novedades — v1.12.0

---

## Nuevas funcionalidades

### Lista de compras — se actualiza al registrar un pedido

- Al registrar cualquier pedido, los productos que estén en la lista de compras de esa sucursal se actualizan solos, sin importar cómo se agregaron al pedido.
- En **Configuración → Vistas → Pedidos → Lista de Pedidos** se elige el comportamiento: **descontar lo pedido** (por defecto: si había 10 y se pidieron 6, quedan 4) o **quitar el producto de la lista**.
- Un aviso indica cuántos productos cambiaron y ofrece **Deshacer**.

---

## Correcciones

<details>
<summary><strong>Transferencias — productos sin stock en la sucursal de origen</strong></summary>

- Ya no se pueden agregar productos sin stock en la sucursal de origen. Antes se agregaban igual y, al recibir la transferencia, aparecía en el destino stock que no salió de ningún lote.
- El selector de productos muestra el stock de la sucursal de origen. Antes mostraba el de CENTRAL, y un producto con stock podía aparecer con 0.
- Si no se puede enviar, recibir o rechazar una transferencia, el aviso explica el motivo (por ejemplo, stock insuficiente en origen) en vez de un "intenta nuevamente" genérico.

</details>

<details>
<summary><strong>Compras y pedidos — el tipo de cambio cambiaba al editar</strong></summary>

Al editar una compra o un pedido, el tipo de cambio mostraba el último valor escrito en esa PC y no el del documento; en compras, al guardar, se aplicaba a todas las líneas. Ahora se muestra el tipo de cambio con que se registró el documento, cada línea conserva el suyo y solo cambia si se modifica a propósito.

</details>

---

# Novedades — v1.11.0

---

## Nuevas funcionalidades

### Más rápida

- Las pantallas se cargan a medida que las abres: la app arranca más rápido.
- Cambiar de pestaña ya no recarga lo que tenías abierto.
- El menú lateral, los listados y los selectores responden con más fluidez.

---

### Temas de color

- Nueva opción en **Configuración → Apariencia → Tema de color**: elige un tema predefinido o importa uno de VS Code.
- Los colores mantienen siempre un contraste legible, en modo claro y oscuro.
- Con el modo oscuro, abrir la app o una ventana ya no muestra un destello blanco.

---

### Plugins

- Nueva sección **Configuración → Plugins** para gestionar extensiones. Esta versión no incluye ningún plugin.

---

## Correcciones

<details>
<summary><strong>Ventanas secundarias — pantalla en blanco al abrirlas</strong></summary>

Las ventanas secundarias (selector de productos, compras, pedidos, cotizaciones…) podían quedar en blanco al abrirlas. Ahora muestran "Cargando…" desde el primer momento y, si algo falla, ofrecen recargar o cerrar la ventana. Al cerrar sesión desde la ventana principal, las secundarias se cierran.

</details>

<details>
<summary><strong>Sesión — se cerraba sola</strong></summary>

La sesión ya no se cierra al suspender la PC, al perder internet por un momento ni al trabajar con varias ventanas abiertas. Al volver a abrir la app con la sesión vencida, se renueva automáticamente en vez de pedir iniciar sesión otra vez. Solo se cierra si el servidor la revoca.

</details>

---

# Novedades — v1.4.2

---

## Correcciones

<details>
<summary><strong>Cotizaciones — error 422 al editar el anticipo</strong></summary>

Se corrigieron dos escenarios que generaban un error al guardar una cotización editada:

- **Cotización con anticipo existente** — el campo `forma_pago_anticipo` no se cargaba desde el backend al abrir el formulario de edición, por lo que siempre se enviaba vacío. Ahora se carga correctamente, y las cotizaciones antiguas sin ese dato reciben `Efectivo` como valor por defecto.
- **Agregar anticipo a una cotización sin anticipo** — al ingresar un anticipo por primera vez en la edición, el valor de forma de pago se sincronizaba con un timing incorrecto y podía enviarse vacío. Se reemplazó la lógica por un `useEffect` declarativo que garantiza la sincronización antes del envío.

</details>

<details>
<summary><strong>Ventanas secundarias — errores 401 al buscar productos</strong></summary>

Las ventanas secundarias (selector de productos en Devoluciones y otras) volvían a generar errores 401 en algunas operaciones. La causa era que el interceptor de Axios importaba una instancia del SDK de autenticación configurada siempre como ventana principal (`validateOnStartup: true`), sin importar en qué ventana se ejecutaba. El singleton ahora se auto-configura al iniciarse según el tipo de ventana.

</details>

<details>
<summary><strong>Caja — conceptos y sincronización de movimientos</strong></summary>

- Se agregaron los conceptos `SOBRANTE_CAJA` y `FALTANTE_CAJA` al schema de movimientos, evitando errores de validación al realizar arqueos con diferencias.
- Al editar una venta, ahora se invalidan correctamente las queries de caja para reflejar los movimientos actualizados en tiempo real.
- Se agrega botón de actualización manual en el detalle de sesión de caja.

</details>

---

# Novedades — v1.4.0

---

## Nuevas funcionalidades

### Reportes de Cotizaciones

Se agregan 6 pantallas de análisis dentro del módulo de Cotizaciones:

- **Reporte General** — resumen global con totales y estados
- **Conversion** — tasa de cotizaciones convertidas a venta
- **Top Clientes** — clientes con mayor actividad de cotización
- **Productos** — productos más cotizados
- **Abiertas** — cotizaciones pendientes de respuesta
- **Desempeño** — métricas por responsable

Cada pantalla incluye gráficos y filtros rápidos de fecha.

---

### Ventanas secundarias — barra de título propia

Las ventanas secundarias (selector de productos, compras, etc.) ahora tienen su propia barra de título con estilo diferenciado y borde distintivo, mejorando la claridad visual al trabajar con múltiples ventanas abiertas.

---

### Pestañas — modo de desbordamiento configurable

En **Configuración → Avanzado** se puede elegir cómo se comportan las pestañas cuando hay demasiadas para mostrar:

- **Comprimir** — las pestañas se reducen para caber en el ancho disponible
- **Scroll** — aparece un scroll horizontal para navegar

La sección Avanzado fue rediseñada para mayor claridad.

---

### Categorías — campo patrón de descripción

En la edición de categorías se agrega el campo **Patrón de descripción** (`patron_descripcion`). El preview del patrón se sincroniza en tiempo real mientras se escribe.

---

## Correcciones

<details>
<summary><strong>Estabilidad de ventanas secundarias</strong></summary>

Se resolvieron varios problemas con ventanas secundarias que quedaban abiertas ("zombie") al recargar o cerrar la aplicación principal:

- Al iniciar, la ventana principal cierra automáticamente cualquier ventana secundaria huérfana
- Se agrega un mecanismo de heartbeat: las ventanas secundarias se auto-cierran si no reciben pulso de la ventana principal por más de 5 segundos
- El flujo de cierre fue corregido para no bloquear la operación

</details>

<details>
<summary><strong>Sesión — pérdida esporádica al recargar</strong></summary>

Se corrigió una condición de carrera en la inicialización del SDK de autenticación que causaba, ocasionalmente (aprox. 1 de cada 20 recargas), que la sesión se diera por terminada y redirigiera al login. El inicio de sesión ahora espera correctamente a que IndexedDB resuelva antes de leer el estado.

</details>

<details>
<summary><strong>Validación de datos del backend</strong></summary>

El validador de respuestas ya no interrumpe la interfaz cuando el backend devuelve campos nulos inesperados. Los errores se registran en el log para seguimiento, y los campos nulos se convierten automáticamente a valores seguros (`"N/A"` para texto, `0` para números), evitando pantallas de error en el cliente.

</details>

- Las pestañas fijadas ya no pueden cerrarse accidentalmente
- Mejor visibilidad del scrollbar en modo oscuro
- El selector secundario de productos abre con 10 resultados por defecto

---

## Notas técnicas

- `src/lib/schemaTransformer.ts` — transformador recursivo de schemas Zod con fallbacks por tipo
- `src/lib/validator.ts` — validación suave: log de errores sin interrumpir el flujo
- `src/navigation/Navigation.tsx` — inicialización de sesión vía `authSDK.ready` antes de suscribirse a cambios de estado
