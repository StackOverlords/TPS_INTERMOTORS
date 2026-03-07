import { Badge } from "@/components/atoms/badge";
import { Button } from "@/components/atoms/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/atoms/card";
import { Checkbox } from "@/components/atoms/checkbox";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/atoms/collapsible";
import { Input } from "@/components/atoms/input";
import { ScrollArea } from "@/components/atoms/scroll-area";
import { Separator } from "@/components/atoms/separator";
import { Skeleton } from "@/components/atoms/skeleton";
import { useToast } from "@/components/atoms/use-toast";
import { ProtectedAction } from "@/components/common/ProtectedAction";
import { useRouteViewConfigWithSync } from "@/hooks/useRouteViewConfig";
import {
  ArrowLeft,
  Calendar,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Edit,
  Loader2,
  Mail,
  Save,
  Search,
  Shield,
  User2,
  UserMinus2,
  XCircle,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router";
import { usePermissions } from "../hooks/usePermissions";
import { useUpdateUserPermissions } from "../hooks/useUpdateUserPermissions";
import { useUserByNickName } from "../hooks/useUserById";
import { useUserPermissions } from "../hooks/useUserPermissions";
import type { Permission, PermissionGroup } from "../types/User";

const UserDetailScreen = () => {
  const { nickname } = useParams<{ nickname: string }>();
  const location = useLocation();
  const permisosRef = useRef<HTMLDivElement>(null);

  const navigate = useNavigate();
  const { toast } = useToast();

  // Estados para gestión de permisos
  const [searchPermissions, setSearchPermissions] = useState("");
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(
    new Set()
  );
  const [isSaving, setIsSaving] = useState(false);

  // Hooks configuraciones
  const viewConfig = useRouteViewConfigWithSync();

  // Debug temporal
  // useEffect(() => {
  //   console.log('[UserDetailScreen] Debug:', {
  //     pathname: location.pathname,
  //     viewConfig,
  //     viewConfigId: viewConfig?.id,
  //     permissionsEnabled: viewConfig?.features?.permissions?.enabled,
  //   });
  // }, [viewConfig, location.pathname]);
  // TODOS los hooks deben ir al inicio, sin condiciones
  const {
    data: user,
    isLoading,
    isError,
    error,
  } = useUserByNickName(nickname!);

  // Queries para permisos - siempre se ejecutan
  const {
    data: allPermissions,
    isLoading: isLoadingPermissions,
    isError: isPermissionsError,
  } = usePermissions();

  const {
    data: userPermissions,
    isLoading: isLoadingUserPermissions,
    isError: isUserPermissionsError,
    refetch: refetchUserPermissions,
  } = useUserPermissions(user?.id || 0);

  const updateUserPermissionsMutation = useUpdateUserPermissions();

  // Procesar permisos y agruparlos
  const processedPermissions = useMemo<PermissionGroup>(() => {
    if (!allPermissions) return {};

    const grouped: PermissionGroup = {};

    Object.keys(allPermissions).forEach((category) => {
      if (Array.isArray(allPermissions[category])) {
        grouped[category] = allPermissions[category];
      }
    });

    return grouped;
  }, [allPermissions]);

  // Filtrar permisos según búsqueda
  const filteredPermissions = useMemo(() => {
    if (!searchPermissions) return processedPermissions;

    const filtered: PermissionGroup = {};

    Object.keys(processedPermissions).forEach((category) => {
      const categoryPermissions = processedPermissions[category].filter(
        (permission) =>
          permission.name
            .toLowerCase()
            .includes(searchPermissions.toLowerCase()) ||
          permission.descripcion
            ?.toLowerCase()
            .includes(searchPermissions.toLowerCase()) ||
          category.toLowerCase().includes(searchPermissions.toLowerCase())
      );

      if (categoryPermissions.length > 0) {
        filtered[category] = categoryPermissions;
      }
    });

    return filtered;
  }, [processedPermissions, searchPermissions]);

  // Efecto para actualizar permisos seleccionados cuando cambian los permisos del usuario
  useEffect(() => {
    if (userPermissions) {
      const userPermissionNames = new Set(userPermissions.map((p) => p.name));
      setSelectedPermissions(userPermissionNames);
    }
  }, [userPermissions]);

  // Expandir grupos con resultados de búsqueda
  useEffect(() => {
    if (searchPermissions && Object.keys(filteredPermissions).length > 0) {
      setExpandedGroups(new Set(Object.keys(filteredPermissions)));
    }
  }, [searchPermissions, filteredPermissions]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "No registrada";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("es-ES", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "Fecha inválida";
    }
  };

  const toggleGroup = (groupName: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupName)) {
      newExpanded.delete(groupName);
    } else {
      newExpanded.add(groupName);
    }
    setExpandedGroups(newExpanded);
  };

  const togglePermission = (permissionName: string) => {
    const newSelected = new Set(selectedPermissions);
    if (newSelected.has(permissionName)) {
      newSelected.delete(permissionName);
    } else {
      newSelected.add(permissionName);
    }
    setSelectedPermissions(newSelected);
  };
  //groupName
  const toggleAllInGroup = (__: string, permissions: Permission[]) => {
    const newSelected = new Set(selectedPermissions);
    const allSelected = permissions.every((p) => newSelected.has(p.name));

    permissions.forEach((permission) => {
      if (allSelected) {
        newSelected.delete(permission.name);
      } else {
        newSelected.add(permission.name);
      }
    });

    setSelectedPermissions(newSelected);
  };

  const handleSavePermissions = async () => {
    if (!user) return;

    setIsSaving(true);
    try {
      const permissionsToSend = Array.from(selectedPermissions).map((name) => {
        // Buscar el permiso completo en todos los grupos
        for (const category of Object.keys(processedPermissions)) {
          const permission = processedPermissions[category].find(
            (p) => p.name === name
          );
          if (permission) {
            return {
              name: permission.name,
              // categoria: category,
              // descripcion: permission.descripcion || null
            };
          }
        }
        return {
          name,
          // categoria: null,
          // descripcion: null
        };
      });

      await updateUserPermissionsMutation.mutateAsync({
        usuario: user.id,
        permisos: permissionsToSend,
      });

      toast({
        title: "Permisos actualizados",
        description: `Se han actualizado correctamente los permisos de ${user.empleado.nombre}`,
        variant: "default",
      });

      // Refrescar permisos del usuario
      refetchUserPermissions();
    } catch (error) {
      console.error("Error al guardar permisos:", error);
      toast({
        title: "Error al guardar permisos",
        description:
          "Ocurrió un error al intentar guardar los permisos del usuario",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    if (location.hash !== "#permisos") return;
    if (!user) return;
    if (!viewConfig?.features?.permissions?.enabled) return;

    const tryScroll = (attemptsLeft: number) => {
      const element = document.getElementById("seccion-permisos");
      const scrollContainer = document.getElementById(
        "user-detail-scroll-container"
      );

      if (!element || !scrollContainer) {
        // El elemento aún no está en el DOM, reintentar
        if (attemptsLeft > 0) {
          setTimeout(() => tryScroll(attemptsLeft - 1), 100);
        }
        return;
      }

      const containerRect = scrollContainer.getBoundingClientRect();
      const elementRect = element.getBoundingClientRect();

      const scrollAmount = elementRect.top - containerRect.top - 16; // 16px de padding
      scrollContainer.scrollBy({ top: scrollAmount, behavior: "smooth" });
    };

    tryScroll(10); // hasta 10 intentos x 100ms = 1 segundo máximo
  }, [location.hash, user, viewConfig]);

  const getGroupStats = (permissions: Permission[]) => {
    const selected = permissions.filter((p) =>
      selectedPermissions.has(p.name)
    ).length;
    const total = permissions.length;
    return { selected, total };
  };
  // console.log(viewConfig?.features?.permissions?.enabled )
  if (
    isLoading ||
    (location.hash === "#permisos" &&
      (isLoadingPermissions || isLoadingUserPermissions))
  ) {
    return (
      <div className="h-full max-w-5xl mx-auto p-6">
        <div className="space-y-6">
          <div className="flex items-center gap-4 p-3 bg-background rounded-md">
            <Skeleton className="h-10 w-10 rounded" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
          <div className="bg-background rounded-md p-3 h-full">
            <Skeleton className="h-96 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (isError || !user) {
    return (
      <div className="h-full max-w-5xl mx-auto p-6">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Error al cargar usuario
          </h2>
          <p className="text-muted-foreground mb-4">
            {error?.message || "No se pudo encontrar el usuario solicitado"}
          </p>
          <Button onClick={() => navigate("/dashboard/user")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a la lista
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      id="user-detail-scroll-container"
      className="h-full overflow-y-auto max-w-5xl mx-auto p-2"
    >
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <Button
            variant="default"
            onClick={() => navigate("/dashboard/user")}
            // className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver a usuarios
          </Button>
        </div>

        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 bg-primary/20 dark:bg-primary/30 rounded-full flex items-center justify-center">
              <User2 className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                {user.empleado.nombre}
              </h1>
              <p className="text-lg text-muted-foreground">@{user.nickname}</p>
              <Badge
                variant={user.activo ? "success" : "destructive"}
                className="flex items-center gap-1 w-fit mt-2"
              >
                {user.activo ? (
                  <CheckCircle className="h-3 w-3" />
                ) : (
                  <XCircle className="h-3 w-3" />
                )}
                {user.activo ? "Usuario Activo" : "Usuario Inactivo"}
              </Badge>
            </div>
          </div>

          <div className="flex gap-2">
            {/* <Button
              variant="outline"
              onClick={() =>
                navigate(`/dashboard/user/${user.id}/permisions`)
              }
              className="flex items-center gap-2"
            >
              <UserCog className="h-4 w-4" />
              Gestionar Permisos
            </Button> */}
            <ProtectedAction permission="usu-editar" roles={["Super Admin"]}>
              <Button
                variant="destructive"
                size={"sm"}
                disabled={true}
                // className="flex items-center gap-1"
              >
                <UserMinus2 className="h-4 w-4" />
                Eliminar usuario
              </Button>
            </ProtectedAction>
            <ProtectedAction permission="usu-editar" roles={["Super Admin"]}>
              <Button
                variant="default"
                size={"sm"}
                onClick={() => navigate(`/dashboard/user/edit/${user.id}`)}
              >
                <Edit className="h-4 w-4" />
                Editar Usuario
              </Button>
            </ProtectedAction>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Información Principal */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border border-border">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">
                Información Personal
              </CardTitle>
              <CardDescription>
                Datos básicos del usuario en el sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-semibold text-foreground">
                      ID de Usuario
                    </label>
                    <p className="text-lg font-mono text-foreground">
                      {user.id}
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-foreground">
                      Nickname
                    </label>
                    <p className="text-lg text-foreground">{user.nickname}</p>
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-foreground">
                      Nombre Completo
                    </label>
                    <p className="text-lg text-foreground">
                      {user.empleado.nombre}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-semibold text-foreground">
                      ID de Empleado
                    </label>
                    <p className="text-lg font-mono text-foreground">
                      {user.empleado.id}
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Email
                    </label>
                    <p className="text-lg text-foreground">
                      {user.email || (
                        <span className="italic text-muted-foreground">
                          No registrado
                        </span>
                      )}
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-foreground">
                      Estado
                    </label>
                    <div className="mt-1">
                      <Badge
                        variant={user.activo ? "success" : "destructive"}
                        className="flex items-center gap-1 w-fit"
                      >
                        {user.activo ? (
                          <CheckCircle className="h-3 w-3" />
                        ) : (
                          <XCircle className="h-3 w-3" />
                        )}
                        {user.activo ? "Activo" : "Inactivo"}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Información Adicional */}
        <div className="space-y-6">
          <Card className="border border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                <Calendar className="h-5 w-5" />
                Información del Sistema
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-foreground">
                  Fecha de Creación
                </label>
                <p className="text-sm text-foreground mt-1">
                  {formatDate(user.fecha_creacion)}
                </p>
              </div>

              <Separator />

              <div>
                <label className="text-sm font-semibold text-foreground">
                  Último Acceso
                </label>
                <p className="text-sm text-muted-foreground italic mt-1">
                  Información no disponible
                </p>
              </div>
            </CardContent>
          </Card>

          {/* <Card className="border border-gray-200">
            <CardHeader>
              <CardTitle className='text-lg font-semibold'>Acciones Rápidas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
               <Button
                className="w-full justify-start"
                variant="outline"
                onClick={() =>
                  navigate(`/dashboard/user/${user.nickname}#permisos`)
                }
              >
                <UserCog className="h-4 w-4 mr-2" />
                Gestionar Permisos
              </Button> 

              <Button className="w-full justify-start" variant="outline">
                <Mail className="h-4 w-4 mr-2" />
                Enviar Email
              </Button>

              <Button
                className="w-full justify-start"
                variant="outline"
                disabled={!user.activo}
              >
                Resetear Contraseña
              </Button>
            </CardContent>
          </Card> */}
        </div>

        {/* Sección de Gestión de Permisos */}
        {viewConfig?.features?.permissions?.enabled && (
          <div
            id="seccion-permisos"
            className="lg:col-span-3 mt-6"
            ref={permisosRef}
          >
            <Card className="border border-border">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-muted-foreground" />
                    <CardTitle className="text-lg font-semibold">
                      Gestión de Permisos
                    </CardTitle>
                  </div>
                  <div className="flex items-center gap-2">
                    {viewConfig?.features?.saveButton?.enabled && (
                      <ProtectedAction
                        permission="usu-editar"
                        roles={["Super Admin"]}
                      >
                        <Button
                          onClick={handleSavePermissions}
                          disabled={
                            isSaving ||
                            isLoadingPermissions ||
                            isLoadingUserPermissions
                          }
                        >
                          {isSaving ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Save className="h-4 w-4" />
                          )}
                          {isSaving ? "Guardando..." : "Guardar Cambios"}
                        </Button>
                      </ProtectedAction>
                    )}
                  </div>
                </div>
                <CardDescription>
                  Gestiona los permisos y accesos del usuario{" "}
                  {user.empleado.nombre}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingPermissions || isLoadingUserPermissions ? (
                  <div className="space-y-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-32 w-full" />
                    <Skeleton className="h-32 w-full" />
                    <Skeleton className="h-32 w-full" />
                  </div>
                ) : isPermissionsError || isUserPermissionsError ? (
                  <div className="text-center py-8">
                    <p className="text-destructive mb-4">
                      Error al cargar los permisos
                    </p>
                    <Button onClick={() => window.location.reload()}>
                      Reintentar
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {/* Buscador de permisos */}
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                      <Input
                        placeholder="Buscar permisos por nombre, descripción o categoría..."
                        value={searchPermissions}
                        onChange={(e) => setSearchPermissions(e.target.value)}
                        className="pl-10"
                      />
                    </div>

                    {/* Estadísticas generales */}
                    <div className="bg-primary/10 dark:bg-primary/20 p-2 rounded-lg">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-primary font-medium">
                          Permisos seleccionados: {selectedPermissions.size}
                        </span>
                        <span className="text-primary">
                          Total disponible:{" "}
                          {Object.values(processedPermissions).flat().length}
                        </span>
                      </div>
                    </div>

                    {/* Botones de acción rápida */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const allPermissionNames = Object.values(
                            processedPermissions
                          )
                            .flat()
                            .map((p) => p.name);
                          setSelectedPermissions(new Set(allPermissionNames));
                        }}
                        disabled={isSaving}
                      >
                        Seleccionar todos
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedPermissions(new Set())}
                        disabled={isSaving}
                      >
                        Deseleccionar todos
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (Object.keys(filteredPermissions).length > 0) {
                            setExpandedGroups(
                              new Set(Object.keys(filteredPermissions))
                            );
                          }
                        }}
                        disabled={isSaving}
                      >
                        Expandir todo
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setExpandedGroups(new Set())}
                        disabled={isSaving}
                      >
                        Colapsar todo
                      </Button>
                    </div>

                    {/* Lista de permisos agrupados */}
                    <ScrollArea className="w-full">
                      <div className="space-y-2 pr-4">
                        {Object.keys(filteredPermissions).length === 0 ? (
                          <div className="text-center py-8 text-muted-foreground">
                            {searchPermissions ? (
                              <>
                                No se encontraron permisos que coincidan con "
                                {searchPermissions}"
                              </>
                            ) : (
                              "No hay permisos disponibles"
                            )}
                          </div>
                        ) : (
                          Object.entries(filteredPermissions).map(
                            ([groupName, permissions]) => {
                              const stats = getGroupStats(permissions);
                              const isExpanded = expandedGroups.has(groupName);
                              const allSelected = permissions.every((p) =>
                                selectedPermissions.has(p.name)
                              );
                              const someSelected = permissions.some((p) =>
                                selectedPermissions.has(p.name)
                              );

                              return (
                                <Collapsible
                                  key={groupName}
                                  open={isExpanded}
                                  onOpenChange={() => toggleGroup(groupName)}
                                >
                                  <CollapsibleTrigger asChild>
                                    <div className="flex items-center justify-between p-3 bg-muted/30 hover:bg-accent rounded-lg cursor-pointer transition-colors">
                                      <div className="flex items-center gap-3">
                                        <div className="flex items-center gap-2">
                                          {isExpanded ? (
                                            <ChevronDown className="h-4 w-4 text-foreground" />
                                          ) : (
                                            <ChevronRight className="h-4 w-4 text-foreground" />
                                          )}
                                          <Checkbox
                                            checked={
                                              allSelected
                                                ? true
                                                : someSelected
                                                  ? "indeterminate"
                                                  : false
                                            }
                                            onCheckedChange={() =>
                                              toggleAllInGroup(
                                                groupName,
                                                permissions
                                              )
                                            }
                                            onClick={(e) => e.stopPropagation()}
                                          />
                                        </div>
                                        <div>
                                          <h3 className="font-medium text-foreground">
                                            {groupName}
                                          </h3>
                                          <p className="text-sm text-muted-foreground">
                                            {stats.selected}/{stats.total}{" "}
                                            permisos seleccionados
                                          </p>
                                        </div>
                                      </div>
                                      <Badge
                                        variant={
                                          stats.selected > 0
                                            ? "default"
                                            : "secondary"
                                        }
                                      >
                                        {stats.selected}/{stats.total}
                                      </Badge>
                                    </div>
                                  </CollapsibleTrigger>

                                  <CollapsibleContent>
                                    <div className="ml-10 mt-2 space-y-2">
                                      {permissions.map((permission) => (
                                        <div
                                          key={permission.name}
                                          className="flex items-center justify-between p-3 bg-card border border-border rounded-lg hover:bg-accent transition-colors"
                                        >
                                          <div className="flex items-center gap-3">
                                            <Checkbox
                                              checked={selectedPermissions.has(
                                                permission.name
                                              )}
                                              onCheckedChange={() =>
                                                togglePermission(
                                                  permission.name
                                                )
                                              }
                                            />
                                            <div className="flex-1">
                                              {/* <h4 className="font-medium text-gray-900 text-sm">
                                            {permission.name}
                                          </h4> */}
                                              {permission.descripcion && (
                                                <p className="text-xs text-muted-foreground mt-1">
                                                  {permission.descripcion}
                                                </p>
                                              )}
                                            </div>
                                          </div>
                                          <Badge
                                            variant="outline"
                                            className={`text-[10px] px-2 py-0.5 rounded-full font-medium tracking-wide border transition-colors
                                          ${
                                            selectedPermissions.has(
                                              permission.name
                                            )
                                              ? "bg-emerald-600 dark:bg-emerald-500 text-white border-emerald-600 dark:border-emerald-500 hover:bg-emerald-500 dark:hover:bg-emerald-400"
                                              : "bg-transparent text-muted-foreground border-border hover:border-muted-foreground/50"
                                          }`}
                                          >
                                            {selectedPermissions.has(
                                              permission.name
                                            )
                                              ? "Asignado"
                                              : "No asignado"}
                                          </Badge>
                                        </div>
                                      ))}
                                    </div>
                                  </CollapsibleContent>
                                </Collapsible>
                              );
                            }
                          )
                        )}
                      </div>
                    </ScrollArea>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserDetailScreen;
