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
import ResizableBox from '@/components/atoms/resizable-box';
import { Switch } from '@/components/atoms/switch';
import CustomizableTable from '@/components/common/CustomizableTable';
import Pagination from '@/components/common/pagination';
import RowsPerPageSelect from '@/components/common/RowsPerPageSelect';
import TooltipButton from '@/components/common/TooltipButton';
import { useCustomTable } from '@/hooks/useCustomTable';
import authSDK from '@/services/sdk-simple-auth';
import { formatCell } from '@/utils/formatCell';
import { type ColumnDef } from '@tanstack/react-table';
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
  Users,
  XCircle
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import InfiniteScroll from 'react-infinite-scroll-component';
import { useNavigate } from 'react-router';
import DeleteUserDialog from '../components/DeleteUserDialog';
import { useUserFilters } from '../hooks/useUserFilters';
import { useUsersPaginated } from '../hooks/useUsersPaginated';
import type { User } from '../types/User';

const UserListScreen = () => {
  const [isInfiniteScroll, setIsInfiniteScroll] = useState(false);
  const user = authSDK.getCurrentUser();
  const { filters, updateFilter, setPage, resetFilters } = useUserFilters();

  const {
    data: userData,
    isLoading,
    error,
    isFetching,
    isError,
    refetch: refetchUsers,
    isRefetching: isRefetchingUsers,
  } = useUsersPaginated(filters);
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [searchKeywords, setSearchKeywords] = useState('');

  // Estados para los diálogos
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Limpiar datos cuando se cambie el modo de scroll infinito
  useEffect(() => {
    if (!isInfiniteScroll) {
      setUsers([]);
      setPage(1);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isInfiniteScroll]);

  useEffect(() => {
    if (!userData?.data || error) return;

    if (isInfiniteScroll && filters.pagina && filters.pagina > 1) {
      setUsers(prev => {
        // Evitar duplicados
        const newUsers = userData.data.filter(
          newUser => !prev.some(existingUser => existingUser.id === newUser.id)
        );
        return [...prev, ...newUsers];
      });
    } else {
      // En modo paginación normal, siempre reemplazar los datos
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

  const handleConfirmDelete = async () => {
    if (!selectedUser) return;

    setIsDeleting(true);
    try {
      // Aquí iría la lógica de eliminación
      // console.log('Eliminando usuario:', selectedUser.id);
      // await deleteUser(selectedUser.id);
      setShowDeleteDialog(false);
      setSelectedUser(null);
      refetchUsers();
    } catch (error) {
      console.error('Error al eliminar usuario:', error);
    } finally {
      setIsDeleting(false);
    }
  };

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
            className="border border-gray-400"
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
              className="border border-gray-400"
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
                    onClick={e => {
                      e.stopPropagation();
                    }}
                    onKeyDown={e => {
                      if (['ArrowUp', 'ArrowDown'].includes(e.key)) {
                        e.stopPropagation();
                      }
                    }}
                  >
                    <MoreVertical className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  onCloseAutoFocus={e => {
                    e.preventDefault();
                  }}
                  align="start"
                  className="w-48"
                >
                  <DropdownMenuItem
                    onKeyDown={e => e.stopPropagation()}
                    onClick={() => handleUserDetail(row.original)}
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    Ver detalles
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onKeyDown={e => e.stopPropagation()}
                    onClick={() => handleManagePermissions(row.original)}
                  >
                    <UserCog className="mr-2 h-4 w-4" />
                    Gestionar permisos
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onKeyDown={e => e.stopPropagation()}
                    onClick={() => handleDeleteUser(row.original)}
                    className="text-red-600 focus:text-red-600 focus:bg-red-50"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Eliminar usuario
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="flex flex-col">
              <h3 className="font-medium text-gray-900 leading-tight hover:underline truncate">
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
              <div className="font-medium">{empleado.nombre}</div>
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
            <div className={`${!email ? 'italic text-gray-400' : ''}`}>
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

  return (
    <main className="min-h-screen max-w-full">
      <div className="bg-white rounded-lg shadow-sm">
        {/* Header */}
        <header className="p-2 border-b border-gray-200">
          <section className="flex items-center justify-between gap-2 md:gap-4 flex-wrap">
            <div className="flex items-center gap-2 md:gap-4 grow">
              <h1 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Users className="h-5 w-5" />
                Gestión de Usuarios
              </h1>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center space-x-2">
                <Switch
                  id="infinite-scroll"
                  checked={isInfiniteScroll}
                  onCheckedChange={checked => {
                    setIsInfiniteScroll(checked);
                    setPage(1);
                  }}
                />
                <Label htmlFor="infinite-scroll">Scroll Infinito</Label>
              </div>

              <TooltipButton
                onClick={handleRefetchUsers}
                buttonProps={{
                  className: 'w-8',
                  disabled: isRefetchingUsers || isFetching,
                }}
                tooltip={"Recargar usuarios"}
              >
                <RefreshCcw
                  className={`size-4 ${isRefetchingUsers || isFetching ? 'animate-spin' : ''}`}
                />
              </TooltipButton>

              <TooltipButton
                onClick={handleResetTableConfig}
                buttonProps={{
                  variant: 'outline',
                  size: 'sm',
                }}
                tooltip="Resetear orden y visibilidad de columnas"
              >
                <Settings className="h-4 w-4" />
                Resetear Tabla
              </TooltipButton>

              <Button variant="outline" size="sm" onClick={resetFilters}>
                Reset Filters
              </Button>
            </div>
          </section>

          {/* Search Bar */}
          <section className="mt-2">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar usuarios por nickname o nombre..."
                value={searchKeywords}
                onChange={e => setSearchKeywords(e.target.value)}
                className="pl-10 w-full"
              />
            </div>
          </section>
        </header>

        {/* Results Info */}
        <div className="p-2 text-sm text-gray-600 border-b border-gray-200 flex items-center justify-between flex-wrap gap-2">
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
            <div className="flex items-center">
              <RowsPerPageSelect
                value={filters.pagina_registros ?? 10}
                onChange={onShowRowsChange}
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Settings className="w-4 h-4" />
                  Columnas
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-56 max-h-96 overflow-y-auto border border-gray-200"
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
                        className="border border-gray-400"
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
            {table && hasSelectedUsers > 0 && (
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

        {isInfiniteScroll ? (
          <InfiniteScroll
            dataLength={users.length}
            next={() => setPage((filters.pagina || 1) + 1)}
            hasMore={users.length < (userData?.meta.total || 0)}
            loader={
              <div className="flex items-center justify-center gap-2 text-center p-6 text-xs sm:text-sm text-gray-500 bg-gray-50">
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
        ) : (
          <ResizableBox
            direction="vertical"
            minSize={'100px'}
            initialSize={'300px'}
          >
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
                  keyboardNavigationEnabled={true}
                  enableColumnReordering={true}
                  enableSorting={true}
                />
              </div>

              {/* Pagination */}
              {(userData?.data?.length ?? 0) > 0 && (
                <Pagination
                  currentPage={filters.pagina || 1}
                  onPageChange={onPageChange}
                  totalData={userData?.meta.total || 1}
                  onShowRowsChange={onShowRowsChange}
                  showRows={filters.pagina_registros}
                />
              )}
            </div>
          </ResizableBox>
        )}
      </div>

      {/* Diálogos */}
      <DeleteUserDialog
        open={showDeleteDialog}
        onClose={() => {
          setShowDeleteDialog(false);
          setSelectedUser(null);
        }}
        onConfirm={handleConfirmDelete}
        isLoading={isDeleting}
      />
    </main>
  );
};

export default UserListScreen;
