import ProductSelectorWindow from '@/modules/products/screens/ProductSelectorWindow';
import PurchaseSelectorWindow from '@/modules/purchases/screens/PurchaseSelectorWindow';
import React from 'react';

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
  registerWindowComponent('product-selector', ProductSelectorWindow);
  registerWindowComponent('purchase-selector', PurchaseSelectorWindow);
  // registerWindowComponent('settings-routes', ViewSettingsWithSuspense);
}

export const WindowComponentRenderer: React.FC = () => {
  const params = new URLSearchParams(window.location.search);
  const componentId = params.get('component');

  if (!componentId) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Error: No component specified
          </h1>
          <p className="text-gray-600">
            URL debe incluir el parámetro 'component'
          </p>
          <p className="text-sm text-gray-500 mt-2 font-mono">
            Ejemplo: /window.html?component=product-selector
          </p>
        </div>
      </div>
    );
  }

  const Component = getWindowComponent(componentId);

  if (!Component) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-2">
            Error: Component not found
          </h1>
          <p className="text-gray-600">
            Componente "{componentId}" no está registrado
          </p>
          <div className="mt-4 text-left inline-block">
            <p className="text-sm font-semibold text-gray-700 mb-1">
              Componentes disponibles:
            </p>
            <ul className="text-sm text-gray-600 space-y-1">
              {getRegisteredComponentIds().map(id => (
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
