import { Badge } from '@/components/atoms/badge';
import { Button } from '@/components/atoms/button';
import { Checkbox } from '@/components/atoms/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/atoms/dropdown-menu';
import { Input } from '@/components/atoms/input';
import { Label } from '@/components/atoms/label';
import { Switch } from '@/components/atoms/switch';
import CustomizableTable from '@/components/common/CustomizableTable';
import Pagination from '@/components/common/pagination';
import RowsPerPageSelect from '@/components/common/RowsPerPageSelect';
import TooltipButton from '@/components/common/TooltipButton';
import { useViewConfig } from '@/hooks/useViewConfig'; // ← CAMBIO PRINCIPAL
import authSDK from '@/services/sdk-simple-auth';
import { formatCell } from '@/utils/formatCell';
import { type ColumnDef } from '@tanstack/react-table';
import { ProtectedAction } from '@/components/common/ProtectedAction';
import { useProtectedAction } from '@/hooks/useProtectedAction';
import {
  CheckCircle,
  Eye,
  Loader2,
  MoreVertical,
  RefreshCcw,
  Search,
  Settings,
  Trash2,
  UserCog,
  UserPlus,
  Users,
  XCircle
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import InfiniteScroll from 'react-infinite-scroll-component';
import { useNavigate } from 'react-router';
import DeleteUserDialog from '../components/DeleteUserDialog';
import { useUserFilters } from '../hooks/useUserFilters';
import { useUsersPaginated } from '../hooks/useUsersPaginated';
import { useDeleteUser } from '../hooks/mutations/useDeleteUser';
import type { User } from '../types/User';
import { useCustomTable } from '@/hooks/useCustomTable';
import { showSuccessToast } from '@/hooks/use-toast-enhanced';
import { useErrorHandler } from '@/hooks/useErrorHandler';

const UserListScreen = () => {
  const [isInfiniteScroll, setIsInfiniteScroll] = useState(false);
  const user = authSDK.getCurrentUser();
  const { filters, updateFilter, setPage, resetFilters } = useUserFilters();
  const { handleError } = useErrorHandler();

  const {
    config: viewConfig,
    //  isLoading: isLoadingConfig
  } = useViewConfig('users-list');

  const {
    data: userData,
    isLoading,
    error,
    isFetching,
    isError,
    refetch: refetchUsers,
    isRefetching: isRefetchingUsers,
  } = useUsersPaginated(filters);

  const { mutate: deleteUserMutation, isPending: isDeletingUser } = useDeleteUser();

  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [searchKeywords, setSearchKeywords] = useState('');

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!userData?.data || error) return;

    if (isInfiniteScroll && filters.pagina && filters.pagina > 1) {
      setUsers(prev => {
        const newUsers = userData.data.filter(
          newUser => !prev.some(existingUser => existingUser.id === newUser.id)
        );
        return [...prev, ...newUsers];
      });
    } else {
      setUsers(userData.data);
    }
  }, [userData?.data, isInfiniteScroll, filters.pagina, error]);

  const handleUserDetail = useCallback((user: User) => {
    navigate(`/dashboard/user/${user.nickname}`);
  }, [navigate]);

  const handleDeleteUser = useCallback((user: User) => {
    setSelectedUser(user);
    setShowDeleteDialog(true);
  }, []);

  // Función de eliminación sin protección (para usar con useProtectedAction)
  const handleConfirmDeleteUnprotected = async () => {
    if (!selectedUser) return;
    setIsDeleting(true);

    deleteUserMutation(selectedUser.id, {
      onSuccess: () => {
        showSuccessToast({
          title: 'Usuario eliminado',
          description: `El usuario ${selectedUser.nickname} ha sido eliminado exitosamente.`,
          duration: 5000,
        });
        setShowDeleteDialog(false);
        setSelectedUser(null);
        refetchUsers();
        setIsDeleting(false);
      },
      onError: (error: unknown) => {
        handleError({
          error,
          customTitle: 'No se pudo eliminar el usuario',
          customDescription: 'Ocurrió un error al intentar eliminar el usuario'
        });
        setIsDeleting(false);
      },
    });
  };

  // Proteger la función de eliminación con validación de permisos
  const handleConfirmDelete = useProtectedAction(
    handleConfirmDeleteUnprotected,
    {
      permission: 'usu-set_estado',
      roles: ['Super Admin'],
    }
  );

  const handleManagePermissions = useCallback((user: User) => {
    navigate(`/dashboard/user/${user.nickname}#permisos`);
  }, [navigate]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'No registrada';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
    } catch {
      return formatCell(dateString);
    }
  };

  const columns = useMemo<ColumnDef<User>[]>(
    () => [
      {
        id: 'Select',
        header: ({ table }) => (
          <Checkbox
            className="border border-border"
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && 'indeterminate')
            }
            onCheckedChange={value => table.toggleAllPageRowsSelected(!!value)}
            aria-label="Seleccionar todo"
          />
        ),
        cell: ({ row }) => (
          <div className="px-1">
            <Checkbox
              className="border border-border"
              checked={row.getIsSelected()}
              onCheckedChange={value => row.toggleSelected(!!value)}
              aria-label="Seleccionar fila"
            />
          </div>
        ),
        enableSorting: false,
        enableHiding: true,
        size: 40,
        minSize: 40,
      },
      {
        accessorKey: 'nickname',
        header: 'Usuario',
        size: 200,
        minSize: 150,
        enableHiding: false,
        enableSorting: true,
        cell: ({ row, getValue }) => (
          <div className="flex items-center gap-2">
            <div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="size-6 px-0"
                    onClick={e => e.stopPropagation()}
                  >
                    <MoreVertical className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48">
                  <DropdownMenuItem onClick={() => handleUserDetail(row.original)}>
                    <Eye className="mr-2 h-4 w-4" />
                    Ver detalles
                  </DropdownMenuItem>

                  <ProtectedAction
                    permission="usu-editar"
                    roles={["Super Admin"]}
                    fallback={null}
                  // bypassForSuperAdmin={true}
                  >
                    <DropdownMenuItem onClick={() => handleManagePermissions(row.original)}>
                      <UserCog className="mr-2 h-4 w-4" />
                      Gestionar permisos
                    </DropdownMenuItem>
                  </ProtectedAction>

                  <ProtectedAction
                    permission="usu-set_estado"
                    roles={["Super Admin"]}
                    fallback={null}
                  >
                    <DropdownMenuItem
                      onClick={() => handleDeleteUser(row.original)}
                      className="text-destructive focus:text-destructive focus:bg-destructive/10"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Eliminar usuario
                    </DropdownMenuItem>
                  </ProtectedAction>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="flex flex-col">
              <h3 className="font-medium text-foreground leading-tight hover:underline truncate">
                {getValue<string>()}
              </h3>
            </div>
          </div>
        ),
      },
      {
        accessorKey: 'empleado.nombre',
        header: 'Empleado',
        size: 200,
        minSize: 180,
        enableSorting: true,
        cell: ({ row }) => {
          const empleado = row.original.empleado;
          return (
            <div className="space-y-1">
              <div className="font-medium text-foreground">{empleado.nombre}</div>
            </div>
          );
        },
      },
      {
        accessorKey: 'email',
        header: 'Email',
        size: 200,
        minSize: 150,
        enableSorting: true,
        cell: ({ getValue }) => {
          const email = getValue<string | null>();
          return (
            <div className={`${!email ? 'italic text-muted-foreground' : ''}`}>
              {formatCell(email, 'No registrado')}
            </div>
          );
        },
      },
      {
        accessorKey: 'activo',
        header: 'Estado',
        size: 100,
        minSize: 80,
        enableSorting: true,
        cell: ({ getValue }) => {
          const activo = getValue<boolean>();
          return (
            <Badge
              variant={activo ? 'success' : 'destructive'}
              className="flex items-center gap-1 w-fit rounded-sm"
            >
              {activo ? (
                <CheckCircle className="h-3 w-3" />
              ) : (
                <XCircle className="h-3 w-3" />
              )}
              {activo ? 'Activo' : 'Inactivo'}
            </Badge>
          );
        },
      },
      {
        accessorKey: 'fecha_creacion',
        header: 'Fecha de Creación',
        size: 150,
        minSize: 120,
        enableSorting: true,
        cell: ({ getValue }) => (
          <div className="text-center">
            <div className="font-medium text-sm">
              {formatDate(getValue<string | null>())}
            </div>
          </div>
        ),
      },
    ],
    [handleUserDetail, handleManagePermissions, handleDeleteUser]
  );

  const {
    table,
    rowSelection,
    resetAll,
  } = useCustomTable({
    data: users,
    columns,

    // Configuración de características
    enableSorting: false,
    enableColumnResizing: true,
    enableRowSelection: true,
    enableColumnVisibility: true,
    enableColumnOrdering: true,
    enablePagination: false,

    // Columnas ocultas por defecto
    hiddenColumns: ['Select'],

    // Configuración de resize
    columnResizeMode: "onChange",

    // Persistencia con key única por usuario
    persistenceKey: `users-table-${user?.name}`,
    persistColumnVisibility: true,
    persistColumnOrder: true,
  });

  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isFocused, setIsFocused] = useState(false);
  const tableRef = useRef<HTMLTableElement | null>(null);

  const handleInfiniteScrollChange = useCallback((checked: boolean) => {
    setIsInfiniteScroll(checked);
    setPage(1);
  }, [setPage]);

  const handleTableClick = () => {
    setIsFocused(true);
  };

  const handleRowClick = (index: number) => {
    setSelectedIndex(index);
  };

  const handleRowDoubleClick = (user: User) => {
    handleUserDetail(user);
  };

  const hasSelectedUsers = Object.keys(rowSelection).length;

  const onPageChange = (page: number) => {
    setPage(page);
  };

  const onShowRowsChange = (rows: number) => {
    updateFilter('pagina_registros', rows);
    updateFilter('pagina', 1);
  };

  const handleRefetchUsers = () => {
    refetchUsers();
  };

  const handleResetTableConfig = () => {
    resetAll();
  };

  // Mostrar loading mientras carga la config
  // if (isLoadingConfig) {
  //   return (
  //     <main className="h-full flex items-center justify-center">
  //       <Loader2 className="size-8 animate-spin text-gray-400" />
  //     </main>
  //   );
  // }

  return (
    <main className="h-full flex flex-col overflow-hidden p-2">
      <ProtectedAction
        permission="usu-module"
        roles={["Super Admin"]}
        showUnauthorizedMessage={true}
      >
        <div className="bg-card rounded-lg shadow-sm h-full flex flex-col overflow-hidden">
          {/* Header */}
          <header className="p-2 border-b border-border bg-background">
            <section className="flex items-center justify-between gap-2 md:gap-4 flex-wrap">
              <div className="flex items-center gap-2 md:gap-4 grow">
                <h1 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Gestión de Usuarios
                </h1>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <ProtectedAction
                  permission="usu-create"
                  roles={["Super Admin"]}
                  showUnauthorizedMessage={false}
                >
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => navigate('/dashboard/user/create')}
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Nuevo Usuario
                  </Button>
                </ProtectedAction>

                {viewConfig?.features?.infiniteScroll?.enabled && (
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="infinite-scroll"
                      checked={isInfiniteScroll}
                      onCheckedChange={handleInfiniteScrollChange}
                    />
                    <Label htmlFor="infinite-scroll">
                      {viewConfig?.features?.infiniteScroll?.label || 'Scroll Infinito'}
                    </Label>
                  </div>
                )}

                {viewConfig?.features?.refreshButton?.enabled && (
                  <TooltipButton
                    onClick={handleRefetchUsers}
                    buttonProps={{
                      className: 'w-8',
                      disabled: isRefetchingUsers || isFetching,
                    }}
                    tooltip={viewConfig?.features?.refreshButton?.description || "Recargar usuarios"}
                  >
                    <RefreshCcw
                      className={`size-4 ${isRefetchingUsers || isFetching ? 'animate-spin' : ''}`}
                    />
                  </TooltipButton>
                )}

                {viewConfig?.features?.resetTableButton?.enabled && (
                  <TooltipButton
                    onClick={handleResetTableConfig}
                    buttonProps={{
                      variant: 'outline',
                      size: 'sm',
                    }}
                    tooltip={viewConfig?.features?.resetTableButton?.description || "Resetear tabla"}
                  >
                    <Settings className="h-4 w-4" />
                    {viewConfig?.features?.resetTableButton?.label || 'Resetear Tabla'}
                  </TooltipButton>
                )}

                {viewConfig?.features?.filters?.enabled && (
                  <Button variant="outline" size="sm" onClick={resetFilters}>
                    Limpiar Filtros
                  </Button>
                )}
              </div>
            </section>

            {/* Search Bar */}
            {viewConfig?.features?.searchBar?.enabled && (
              <section className="mt-2">
                <div className="relative w-full">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Buscar usuarios por nickname o nombre..."
                    value={searchKeywords}
                    onChange={e => setSearchKeywords(e.target.value)}
                    className="pl-10 w-full"
                  />
                </div>
              </section>
            )}
          </header>

          {/* Results Info */}
          <div className="flex-shrink-0 p-2 text-sm text-muted-foreground border-b border-border flex items-center justify-between flex-wrap gap-2 bg-background">
            {users.length > 0 ? (
              isInfiniteScroll ? (
                `Mostrando ${users.length} de ${userData?.meta.total} usuarios`
              ) : (
                (() => {
                  const pagina = filters.pagina ?? 1;
                  const porPagina = filters.pagina_registros ?? 1;
                  const inicio = (pagina - 1) * porPagina + 1;
                  const fin = pagina * porPagina;
                  return `Mostrando ${inicio} - ${fin} de ${userData?.meta.total} usuarios`;
                })()
              )
            ) : (
              <span>Cargando...</span>
            )}

            <div className="flex items-center gap-2 flex-wrap">
              {viewConfig?.features?.pagination?.enabled && (
                <div className="flex items-center">
                  <RowsPerPageSelect
                    value={filters.pagina_registros ?? viewConfig?.behaviors?.defaultRowsPerPage ?? 10}
                    onChange={onShowRowsChange}
                  />
                </div>
              )}
              {viewConfig?.features?.columnSelector?.enabled && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Settings className="w-4 h-4" />
                      {viewConfig?.features?.columnSelector?.label || 'Columnas'}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="w-56 max-h-96 overflow-y-auto"
                  >
                    {table
                      .getAllColumns()
                      .filter(column => column.getCanHide())
                      .map(column => (
                        <DropdownMenuItem
                          key={column.id}
                          className="flex items-center space-x-2 cursor-pointer"
                          onSelect={e => e.preventDefault()}
                          onClick={() =>
                            column.toggleVisibility(!column.getIsVisible())
                          }
                        >
                          <Checkbox
                            className="border border-border"
                            checked={column.getIsVisible()}
                            onCheckedChange={value =>
                              column.toggleVisibility(!!value)
                            }
                          />
                          <span className="flex-1">
                            {typeof column.columnDef.header === 'string'
                              ? column.columnDef.header
                              : column.id}
                          </span>
                        </DropdownMenuItem>
                      ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              {viewConfig?.features?.multiSelect?.enabled && table && hasSelectedUsers > 0 && (
                <Button size={'sm'} className="relative">
                  Acciones
                  <Badge
                    variant="destructive"
                    className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-[10px]"
                  >
                    {hasSelectedUsers}
                  </Badge>
                </Button>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-hidden">
            {isInfiniteScroll ? (
              <div className="h-full overflow-auto">
                <InfiniteScroll
                  dataLength={users.length}
                  next={() => setPage((filters.pagina || 1) + 1)}
                  hasMore={users.length < (userData?.meta.total || 0)}
                  loader={
                    <div className="flex items-center justify-center gap-2 text-center p-6 text-xs sm:text-sm text-muted-foreground bg-muted/30">
                      <Loader2 className="size-4 animate-spin" />
                      Cargando más usuarios...
                    </div>
                  }
                  scrollableTarget="main-scroll-container"
                >
                  <CustomizableTable
                    table={table}
                    isError={isError}
                    errorMessage="Ocurrió un error al cargar los usuarios"
                    isLoading={isLoading}
                    rows={filters.pagina_registros}
                    noDataMessage="No se encontraron usuarios"
                    selectedRowIndex={selectedIndex}
                    onRowClick={handleRowClick}
                    onRowDoubleClick={handleRowDoubleClick}
                    tableRef={tableRef}
                    focused={isFocused}
                    keyboardNavigationEnabled={true}
                    enableColumnReordering={true}
                    enableSorting={true}
                  />
                </InfiniteScroll>
              </div>
            ) : (
              <div className="overflow-auto h-full">
                <div onClick={handleTableClick} className="overflow-x-hidden">
                  <CustomizableTable
                    table={table}
                    isError={isError}
                    isFetching={isFetching}
                    isLoading={isLoading}
                    errorMessage="Ocurrió un error al cargar los usuarios"
                    rows={filters.pagina_registros}
                    noDataMessage="No se encontraron usuarios"
                    selectedRowIndex={selectedIndex}
                    onRowClick={handleRowClick}
                    onRowDoubleClick={handleRowDoubleClick}
                    tableRef={tableRef}
                    focused={isFocused}
                    keyboardNavigationEnabled={viewConfig?.features?.keyboardNavigation?.enabled ?? true}
                    enableColumnReordering={true}
                    enableSorting={true}
                  />
                </div>

                {viewConfig?.features?.pagination?.enabled && (userData?.data?.length ?? 0) > 0 && (
                  <Pagination
                    currentPage={filters.pagina || 1}
                    onPageChange={onPageChange}
                    totalData={userData?.meta.total || 1}
                    onShowRowsChange={onShowRowsChange}
                    showRows={filters.pagina_registros}
                  />
                )}
              </div>
            )}
          </div>
        </div>

        <DeleteUserDialog
          open={showDeleteDialog}
          onClose={() => {
            setShowDeleteDialog(false);
            setSelectedUser(null);
          }}
          onConfirm={handleConfirmDelete}
          isLoading={isDeleting || isDeletingUser}
        />
      </ProtectedAction>
    </main>
  );
};

export default UserListScreen;