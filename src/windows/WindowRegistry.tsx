import OrderSelectorWindow from "@/modules/orders/screens/OrderSelectorWindow";
import ProductSelectorWindow from "@/modules/products/screens/ProductSelectorWindow";
import PurchaseSelectorWindow from "@/modules/purchases/screens/PurchaseSelectorWindow";
import React from "react";
import SaleDetailSelectorWindow from "@/modules/sales/screens/SaleDetailSelectorWindow";
import QuotationSelectorWindow from "@/modules/quotations/screens/quotationSelectorWindow";

// Tipo para componentes que pueden renderizarse en ventanas
export type WindowComponent = React.ComponentType<any>;

const windowComponentRegistry = new Map<string, WindowComponent>();

export function registerWindowComponent(
  componentId: string,
  component: WindowComponent
): void {
  if (windowComponentRegistry.has(componentId)) {
    // Evitar sobrescribir registros existentes
    return;
  }
  // Registrar el componente
  windowComponentRegistry.set(componentId, component);
}

// Obtener componente registrado por su ID
export function getWindowComponent(
  componentId: string
): WindowComponent | undefined {
  return windowComponentRegistry.get(componentId);
}

export function hasWindowComponent(componentId: string): boolean {
  return windowComponentRegistry.has(componentId);
}

export function getRegisteredComponentIds(): string[] {
  return Array.from(windowComponentRegistry.keys());
}

// ✨ Lazy loading para ViewSettings para evitar importaciones circulares
// const LazyViewSettings = lazy(() => import('@/modules/settings/components/settings/ViewSettings'));

// // Wrapper con Suspense para lazy components
// const ViewSettingsWithSuspense: React.FC = () => (
//   <Suspense fallback={
//     <div className="h-screen flex items-center justify-center">
//       <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
//     </div>
//   }>
//     <LazyViewSettings />
//   </Suspense>
// );

export function registerDefaultWindowComponents(): void {
  // Registrar ProductSelectorWindow || Todos los que vamos a usar
  registerWindowComponent("product-selector", ProductSelectorWindow);
  registerWindowComponent("purchase-selector", PurchaseSelectorWindow);
  registerWindowComponent("order-selector", OrderSelectorWindow);
  registerWindowComponent("sale-detail-selector", SaleDetailSelectorWindow);
  registerWindowComponent("quotation-selector", QuotationSelectorWindow);
  // registerWindowComponent('settings-routes', ViewSettingsWithSuspense);
}

export const WindowComponentRenderer: React.FC = () => {
  const params = new URLSearchParams(window.location.search);
  const componentId = params.get("component");

  if (!componentId) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-primary mb-2">
            Error: No component specified
          </h1>
          <p className="text-foreground">
            URL debe incluir el parámetro 'component'
          </p>
          <p className="text-sm text-muted-foreground mt-2 font-mono">
            Ejemplo: /window.html?component=product-selector
          </p>
        </div>
      </div>
    );
  }

  const Component = getWindowComponent(componentId);

  if (!Component) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-2">
            Error: Component not found
          </h1>
          <p className="text-foreground">
            Componente "{componentId}" no está registrado
          </p>
          <div className="mt-4 text-left inline-block">
            <p className="text-sm font-semibold text-foreground mb-1">
              Componentes disponibles:
            </p>
            <ul className="text-sm text-foreground space-y-1">
              {getRegisteredComponentIds().map((id) => (
                <li key={id} className="font-mono">
                  • {id}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return <Component />;
};

export { windowComponentRegistry };
