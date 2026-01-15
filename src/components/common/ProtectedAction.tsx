import type { ReactNode } from 'react';
import type { UserRole } from '@/hooks/useUserRole';
import { usePermissionCheck } from '@/hooks/usePermissionCheck';
import { ShieldAlert } from 'lucide-react';

interface ProtectedActionProps {
  permission: string;
  roles: UserRole[];
  children: ReactNode;
  fallback?: ReactNode;
  showLoader?: boolean;
  bypassForSuperAdmin?: boolean;

  showUnauthorizedMessage?: boolean | ReactNode;
}

const DefaultUnauthorizedMessage: React.FC = () => (
  <div className="flex flex-col items-center justify-center h-full min-h-[400px] p-8 text-center">
    <div className="rounded-full bg-red-100 p-4 mb-4">
      <ShieldAlert className="h-12 w-12 text-red-600" />
    </div>
    <h2 className="text-xl font-semibold text-gray-900 mb-2">
      Acceso Denegado
    </h2>
    <p className="text-gray-600 max-w-md">
      No tienes los permisos necesarios para acceder a esta sección.
      Por favor, contacta al administrador si crees que esto es un error.
    </p>
  </div>
);

const LoaderText: React.FC = () => (
  <div className="flex items-center justify-center h-full min-h-[100vh] gap-1">
    <div className="w-2 h-2 bg-blue-300 rounded-full animate-bounce"></div>
    
    <div className="w-2 h-2 bg-blue-300 rounded-full animate-bounce" style={{
      animationDelay: '-0.2s'
    }}></div>

    <div className="w-2 h-2 bg-blue-300 rounded-full animate-bounce" style={{
      animationDelay: '-0.4s'
    }}></div>
  </div>
);
export const ProtectedAction: React.FC<ProtectedActionProps> = ({
  permission,
  roles,
  children,
  fallback,
  showLoader = false,
  bypassForSuperAdmin = true,
  showUnauthorizedMessage = true,
}) => {
  const {
    isAuthorized,
    isLoading,
    // hasRole,
    // hasPermission
  } = usePermissionCheck({
    permission,
    roles,
    bypassForSuperAdmin
  });

  if (isLoading && showLoader) {
    return (
      <LoaderText />
    );
  }

  if (isLoading) {
    return <>{fallback ?? null}</>;
  }

  if (!isAuthorized) {
    if (fallback !== undefined) {
      return <>{fallback}</>;
    }

    if (showUnauthorizedMessage === true) {
      return <DefaultUnauthorizedMessage />;
    }

    if (showUnauthorizedMessage && typeof showUnauthorizedMessage !== 'boolean') {
      return <>{showUnauthorizedMessage}</>;
    }

    return null;
  }

  return <>{children}</>;
};
