# Comunicación entre ventanas (Main ↔ Secondary)
---

## Índice
- Ejemplos prácticos
  - Formulario con validación en tiempo real
  - Dashboard de monitoreo en tiempo real
  - Centro de notificaciones
- Resumen de ventajas
- Patrón recomendado (constantes y uso)

---

## Ejemplo 1 — Formulario con validación en tiempo real

Descripción: ventana principal abre un formulario en una ventana secundaria; la validación puede solicitarse desde la secundaria, y la principal responde con los resultados.

### Ventana principal (EditProductWindow)
```jsx
const EditProduct = () => {
  const [validationErrors, setValidationErrors] = useState({});

  const formWindow = useSecondaryWindow({
    windowId: 'product-form-123',
    route: '/window.html',
    queryParams: { component: 'product-form', productId: '123' },
    listenToEvents: [
      'form-field-changed',
      'form-validate-request',
      'form-submit',
      'form-cancel',
      'form-save-draft',
    ],
    onEvent: async (eventName, data) => {
      switch (eventName) {
        case 'form-field-changed':
          console.log(`Campo ${data.field} cambió a: ${data.value}`);
          break;

        case 'form-validate-request': {
          const errors = await validateProduct(data.formData);
          await emitToWindow('product-form-123', 'form-validation-result', { errors });
          break;
        }

        case 'form-submit':
          await saveProduct(data);
          showSuccessToast('Producto guardado');
          break;

        case 'form-save-draft':
          await saveDraft(data);
          showInfoToast('Borrador guardado');
          break;

        case 'form-cancel':
          console.log('Usuario canceló');
          break;
      }
    },
  });

  return <Button onClick={() => formWindow.open()}>Editar Producto</Button>;
};
```

### Ventana secundaria (ProductFormWindow.tsx)
```jsx
const ProductFormWindow = () => {
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});
  const windowId = new URLSearchParams(window.location.search).get('windowId');

  useEffect(() => {
    let unlisten;
    const setup = async () => {
      const u = await listen(`${windowId}-form-validation-result`, (event) => {
        setErrors(event.payload.errors);
      });
      unlisten = u;
    };
    setup();
    return () => { unlisten?.then(fn => fn()); };
  }, [windowId]);

  const handleFieldChange = async (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    await emitToWindow(windowId, 'form-field-changed', { field, value });
  };

  const handleValidate = async () => {
    await emitToWindow(windowId, 'form-validate-request', { formData });
  };

  const handleSubmit = async () => {
    await emitToWindow(windowId, 'form-submit', formData);
    await getCurrentWebviewWindow().close();
  };

  const handleSaveDraft = async () => {
    await emitToWindow(windowId, 'form-save-draft', formData);
  };

  return (
    <form>
      <Input onChange={(e) => handleFieldChange('name', e.target.value)} />
      {errors.name && <span className="text-red-500">{errors.name}</span>}

      <Button onClick={handleValidate}>Validar</Button>
      <Button onClick={handleSaveDraft}>Guardar Borrador</Button>
      <Button onClick={handleSubmit}>Guardar</Button>
    </form>
  );
};
```

---

## Ejemplo 2 — Dashboard de monitoreo en tiempo real

Descripción: la ventana principal inicia un flujo de métricas periódicas hacia la secundaria; la secundaria puede solicitar refrescos, cambiar umbrales o pedir exportación de datos.

### Ventana principal (MonitoringDashboard)
```jsx
const MonitoringDashboard = () => {
  const dashboardWindow = useSecondaryWindow({
    windowId: 'monitoring-dashboard',
    route: '/window.html',
    queryParams: { component: 'monitoring-dashboard' },
    listenToEvents: [
      'dashboard-ready',
      'metric-refresh-request',
      'alert-threshold-changed',
      'export-data-request',
    ],
    onEvent: async (eventName, data) => {
      const windowId = 'monitoring-dashboard';

      if (eventName === 'dashboard-ready') {
        const interval = setInterval(async () => {
          const metrics = await fetchMetrics();
          await emitToWindow(windowId, 'metrics-update', metrics);
        }, 2000);
        intervals.set(windowId, interval);
      }

      if (eventName === 'metric-refresh-request') {
        const metrics = await fetchMetrics();
        await emitToWindow(windowId, 'metrics-update', metrics);
      }

      if (eventName === 'alert-threshold-changed') {
        updateAlertThreshold(data.metric, data.threshold);
        await emitToWindow(windowId, 'alert-threshold-updated', { success: true });
      }

      if (eventName === 'export-data-request') {
        const csvData = await exportMetricsToCSV(data.dateRange);
        await emitToWindow(windowId, 'export-data-ready', { csvData });
      }
    },
    onWindowClosed: () => {
      const interval = intervals.get('monitoring-dashboard');
      if (interval) clearInterval(interval);
    },
  });

  return <Button onClick={() => dashboardWindow.open()}>Abrir Dashboard</Button>;
};
```

---

## Ejemplo 3 — Centro de notificaciones

Descripción: hook reutilizable que escucha múltiples eventos relacionados con notificaciones (leer, eliminar, filtrar, acciones).

### Hook useNotificationWindow
```ts
export function useNotificationWindow() {
  return useSecondaryWindow({
    windowId: 'notifications-center',
    route: '/window.html',
    title: 'Centro de Notificaciones',
    width: 400,
    height: 600,
    queryParams: { component: 'notifications-center' },
    listenToEvents: [
      'notification-read',
      'notification-deleted',
      'notification-action-click',
      'notifications-clear-all',
      'notifications-filter',
      'window-closed',
    ],
    onEvent: async (eventName, data) => {
      const windowId = 'notifications-center';
      switch (eventName) {
        case 'notification-read':
          await markAsRead(data.notificationId);
          const unreadCount = await getUnreadCount();
          await emitToWindow(windowId, 'unread-count-updated', { count: unreadCount });
          break;

        case 'notification-deleted':
          await deleteNotification(data.notificationId);
          await emitToWindow(windowId, 'notification-deleted-success', {});
          break;

        case 'notification-action-click':
          handleNotificationAction(data.action);
          break;

        case 'notifications-clear-all':
          await clearAllNotifications();
          await emitToWindow(windowId, 'notifications-cleared', {});
          break;

        case 'notifications-filter':
          const filtered = await filterNotifications(data.filter);
          await emitToWindow(windowId, 'notifications-filtered', { notifications: filtered });
          break;
      }
    },
  });
}
```

---

## Resumen de ventajas
- ✅ Múltiples eventos simultáneos — sin límite
- ✅ Comunicación asíncrona — no bloquea la UI
- ✅ Bidireccional — Main ↔ Secondary
- ✅ Type-safe — se pueden tipar los payloads
- ✅ Flexible — acepta cualquier dato JSON-serializable
- ✅ Desacoplado — ventanas independientes

---

## Patrón recomendado

1. Definir constantes de eventos para evitar strings mágicos:
```ts
const EVENTS = {
  // Desde ventana secundaria a main
  SUBMIT: 'form-submit',
  CANCEL: 'form-cancel',
  VALIDATE: 'form-validate-request',
  FIELD_CHANGE: 'form-field-changed',

  // Desde main a ventana secundaria
  VALIDATION_RESULT: 'form-validation-result',
  LOAD_DATA: 'form-load-data',
  RESET: 'form-reset',
} as const;
```

2. Usar las constantes en el hook:
```ts
const formWindow = useSecondaryWindow({
  listenToEvents: Object.values(EVENTS),
  onEvent: (eventName, data) => {
    switch (eventName) {
      case EVENTS.SUBMIT: handleSubmit(data); break;
      case EVENTS.CANCEL: handleCancel(); break;
      // ...
    }
  },
});
```

3. Emitir eventos usando constantes:
```ts
await emitToWindow(windowId, EVENTS.VALIDATION_RESULT, { errors });
```
