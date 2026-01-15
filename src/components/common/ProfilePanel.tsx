// import { ScrollArea } from '@/components/atoms/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/atoms/dropdown-menu';
import { Button } from '@/components/atoms/button';
import { Badge } from '@/components/atoms/badge';
import {
  Mail,
  User,
  Building2,
  // Shield,
  LogOut,
  // ChevronDown,
  // ChevronRight,
} from 'lucide-react';
// import { useState, useMemo } from 'react';
import authSDK from '@/services/sdk-simple-auth';
// import { useNavigate } from 'react-router';

interface Permission {
  name: string;
  categoria: string;
  descripcion: string;
}

interface Sucursal {
  id: number | string;
  name?: string;
  nombre?: string;
  sucursal?: string;
}

interface UserData {
  id?: number;
  name?: string;
  full_name?: string;
  email?: string;
  permisos?: Permission[];
  permissions?: Permission[];
  sucursales?: Sucursal[];
  role?: string;
}

interface ProfilePanelProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  trigger?: React.ReactNode;
}

const ProfilePanel: React.FC<ProfilePanelProps> = ({
  isOpen,
  onOpenChange,
  trigger,
}) => {
  // const navigate = useNavigate();
  const user = authSDK.getCurrentUser();
  // const [showPermissions, setShowPermissions] = useState(false);

  // const permissions = user?.permisos || user?.permissions || [];
  const sucursales = user?.sucursales || [];

  // const permissionsByCategory = useMemo(() => {
  //   const grouped: Record<string, Permission[]> = {};
  //   permissions.forEach((perm) => {
  //     const category = perm.categoria?.trim() || 'Otros';
  //     if (!grouped[category]) {
  //       grouped[category] = [];
  //     }
  //     grouped[category].push(perm);
  //   });
  //   return grouped;
  // }, [permissions]);

  // const categoryCount = Object.keys(permissionsByCategory).length;

  // const handleLogout = async () => {
  //   try {
  //     await authSDK.logout();
  //     navigate('/login');
  //   } catch (error) {
  //     console.error('Error al cerrar sesión:', error);
  //   }
  // };

  const getInitials = (name?: string, fullName?: string) => {
    if (fullName) {
      const parts = fullName.split(' ');
      if (parts.length >= 2) {
        return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
      }
      return fullName.charAt(0).toUpperCase();
    }
    return name?.charAt(0).toUpperCase() || 'U';
  };

  const handleLogout = async () => {
    await authSDK.logout();
  }
  return (
    <DropdownMenu open={isOpen} onOpenChange={onOpenChange}>
      <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        {/* Header con Avatar */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="h-14 w-14 bg-gray-900 rounded-full flex items-center justify-center">
              <span className="text-white text-xl font-bold">
                {getInitials(user?.name, user?.full_name)}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-gray-900 font-semibold text-base truncate">
                {user?.full_name || 'Usuario'}
              </h3>
              <p className="text-gray-500 text-sm truncate">@{user?.name || 'username'}</p>
            </div>
          </div>
        </div>

        {/* Info del usuario */}
        <div className="p-3 space-y-2 bg-gray-50">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <User className="h-4 w-4 text-gray-400" />
            <Badge variant={"success"}>ID: {user?.id || 'N/A'}</Badge>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Mail className="h-4 w-4 text-gray-400" />
            <span className="truncate">{user?.email || 'Sin email'}</span>
          </div>
        </div>

        <DropdownMenuSeparator className="m-0" />

        {/* Sucursales */}
        {sucursales.length > 0 && (
          <>
            <div className="p-3">
              <div className="flex items-center gap-2 mb-2">
                <Building2 className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Sucursales</span>
                <Badge variant="secondary" className="ml-auto text-xs">
                  {sucursales.length}
                </Badge>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {sucursales.map((suc, idx) => (
                  <Badge key={idx} variant="outline" className="text-xs">
                    {suc?.sucursal || `Sucursal ${idx + 1}`}
                  </Badge>
                ))}
              </div>
            </div>
            <DropdownMenuSeparator className="m-0" />
          </>
        )}

        {/* Permisos
        {permissions.length > 0 && (
          <>
            <div className="p-3">
              <button
                onClick={() => setShowPermissions(!showPermissions)}
                className="flex items-center gap-2 w-full text-left hover:bg-gray-50 -m-1 p-1 rounded transition-colors"
              >
                <Shield className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Permisos</span>
                <Badge variant="secondary" className="ml-auto text-xs">
                  {permissions.length}
                </Badge>
                {showPermissions ? (
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                )}
              </button>

              {showPermissions && (
                <ScrollArea className="mt-3 h-48 pr-2">
                  <div className="space-y-3">
                    {Object.entries(permissionsByCategory).map(([category, perms]) => (
                      <div key={category}>
                        <p className="text-xs font-medium text-gray-500 mb-1.5">
                          {category} ({perms.length})
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {perms.map((perm, idx) => (
                            <Badge
                              key={idx}
                              variant="outline"
                              className="text-xs py-0.5 px-1.5"
                              title={perm.descripcion}
                            >
                              {perm.descripcion}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}

              {!showPermissions && (
                <p className="text-xs text-gray-400 mt-1">
                  {categoryCount} categorías de permisos
                </p>
              )}
            </div>
            <DropdownMenuSeparator className="m-0" />
          </>
        )} */}

        {/* Logout */}
        <div className="p-2">
          <Button
            variant="default"
            className="w-full justify-start hover:bg-gray-700"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Cerrar sesión
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ProfilePanel;
