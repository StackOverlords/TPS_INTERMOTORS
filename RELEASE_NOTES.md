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
