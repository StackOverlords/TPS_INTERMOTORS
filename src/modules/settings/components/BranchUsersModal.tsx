import { Badge } from '@/components/atoms/badge';
import { Button } from '@/components/atoms/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/atoms/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/atoms/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/atoms/select';
import ConfirmationModal from '@/components/common/confirmationModal';
import CustomizableTable from '@/components/common/CustomizableTable';
import { showSuccessToast } from '@/hooks/use-toast-enhanced';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { useUsersPaginated } from '@/modules/users/hooks/useUsersPaginated';
import { getCoreRowModel, useReactTable, type ColumnDef } from '@tanstack/react-table';
import { UserMinus, UserPlus, Users } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { useAddUserToBranch } from '../hooks/branch/useAddUserToBranch';
import { useGetBranchRoles } from '../hooks/branch/useGetBranchRoles';
import { useGetBranchUsers } from '../hooks/branch/useGetBranchUsers';
import { useRemoveUserFromBranch } from '../hooks/branch/useRemoveUserFromBranch';
import type { BranchUser } from '../types/branch.types';

interface BranchUsersModalProps {
    branchId: number;
    branchName: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export const BranchUsersModal = ({ branchId, branchName, open, onOpenChange }: BranchUsersModalProps) => {
    const { handleError } = useErrorHandler();
    const [selectedUserId, setSelectedUserId] = useState<string>("");
    const [selectedRole, setSelectedRole] = useState<string>("");
    const [userToRemove, setUserToRemove] = useState<{ id: number; name: string } | null>(null);

    const {
        data: branchUsersData,
        isLoading: isLoadingBranchUsers,
        isError: isErrorBranchUsers,
        isFetching: isFetchingBranchUsers,
        refetch: refetchBranchUsers
    } = useGetBranchUsers(branchId);

    const {
        data: rolesData,
    } = useGetBranchRoles();

    const {
        data: allUsersData,
    } = useUsersPaginated({
        pagina: 1,
        pagina_registros: 1000
    });

    const {
        mutate: addUser,
        isPending: isAddingUser
    } = useAddUserToBranch();

    const {
        mutate: removeUser,
        isPending: isRemovingUser
    } = useRemoveUserFromBranch();

    // Filtrar usuarios que no están en la sucursal
    const availableUsers = useMemo(() => {
        if (!allUsersData?.data || !branchUsersData?.data) return [];

        const branchUserIds = new Set(branchUsersData.data.map(u => u.id_usuario));
        return allUsersData.data.filter(user => !branchUserIds.has(user.id));
    }, [allUsersData, branchUsersData]);

    const handleAddUser = useCallback(() => {
        if (!selectedUserId || !selectedRole) {
            handleError({
                error: new Error('Selecciona un usuario y un rol'),
                customTitle: 'Error al agregar usuario'
            });
            return;
        }

        addUser(
            { branchId, data: { usuario_id: Number(selectedUserId), rol: selectedRole } },
            {
                onSuccess: () => {
                    showSuccessToast({
                        title: 'Usuario agregado',
                        description: 'El usuario se agregó exitosamente a la sucursal',
                        duration: 3000
                    });
                    setSelectedUserId("");
                    setSelectedRole("");
                    refetchBranchUsers();
                },
                onError: (error) => {
                    handleError({
                        error,
                        customTitle: 'Error al agregar usuario'
                    });
                }
            }
        );
    }, [selectedUserId, selectedRole, branchId, addUser, handleError, refetchBranchUsers]);

    const handleOpenRemoveConfirm = useCallback((userId: number, userName: string) => {
        setUserToRemove({ id: userId, name: userName });
    }, []);

    const handleConfirmRemove = useCallback(() => {
        if (!userToRemove) return;

        removeUser(
            { branchId, userId: userToRemove.id },
            {
                onSuccess: () => {
                    showSuccessToast({
                        title: 'Usuario removido',
                        description: 'El usuario se removió exitosamente de la sucursal',
                        duration: 3000
                    });
                    setUserToRemove(null);
                    refetchBranchUsers();
                },
                onError: (error) => {
                    handleError({
                        error,
                        customTitle: 'Error al remover usuario'
                    });
                    setUserToRemove(null);
                }
            }
        );
    }, [userToRemove, branchId, removeUser, handleError, refetchBranchUsers]);

    const columns = useMemo<ColumnDef<BranchUser>[]>(() => [
        {
            accessorKey: "id_usuario",
            header: "ID",
            size: 60,
            cell: ({ getValue }) => (
                <span className="font-medium font-mono text-gray-700 text-sm">
                    #{getValue<number>()}
                </span>
            )
        },
        {
            accessorKey: "usuario.data_empleado.nombre",
            header: "Nombre",
            cell: ({ row }) => (
                <div>
                    <p className="font-medium text-gray-900 text-sm">
                        {row?.original?.usuario?.data_empleado?.nombre}
                    </p>
                    <p className="text-xs text-gray-500">
                        @{row?.original?.usuario?.nickname}
                    </p>
                </div>
            )
        },
        {
            accessorKey: "rol_name",
            header: "Rol",
            size: 120,
            cell: ({ getValue }) => (
                <Badge variant="secondary" className="text-xs">
                    {getValue<string>()}
                </Badge>
            )
        },
        {
            id: "actions",
            header: "Acciones",
            size: 80,
            cell: ({ row }) => (
                <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => handleOpenRemoveConfirm(
                        row?.original.id_usuario as number,
                        row?.original?.usuario?.data_empleado?.nombre as string
                    )}
                >
                    <UserMinus className="size-4" />
                </Button>
            )
        }
    ], [handleOpenRemoveConfirm]);

    const table = useReactTable<BranchUser>({
        data: branchUsersData?.data || [],
        columns,
        getCoreRowModel: getCoreRowModel(),
    });

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="max-w-3xl max-h-[85vh] overflow-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-lg">
                            <Users className="size-5" />
                            Gestionar usuarios - {branchName}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4">
                        {/* Formulario para agregar usuario */}
                        <Card className="shadow-none">
                            <CardHeader className="pb-3">
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <UserPlus className="size-4" />
                                    Agregar usuario
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex gap-2 items-end">
                                    <div className="flex-1">
                                        <Select
                                            value={selectedUserId}
                                            onValueChange={setSelectedUserId}
                                        >
                                            <SelectTrigger className="h-9">
                                                <SelectValue placeholder="Seleccionar usuario" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {availableUsers.length > 0 ? (
                                                    availableUsers.map((user) => (
                                                        <SelectItem key={user.id} value={user.id.toString()}>
                                                            {user.empleado?.nombre || user.nickname}
                                                        </SelectItem>
                                                    ))
                                                ) : (
                                                    <SelectItem value="none" disabled>
                                                        No hay usuarios disponibles
                                                    </SelectItem>
                                                )}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="flex-1">
                                        <Select
                                            value={selectedRole}
                                            onValueChange={setSelectedRole}
                                        >
                                            <SelectTrigger className="h-9">
                                                <SelectValue placeholder="Seleccionar rol" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {rolesData && Object.entries(rolesData).map(([key, value]) => (
                                                    <SelectItem key={key} value={key}>
                                                        {value}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <Button
                                        onClick={handleAddUser}
                                        disabled={!selectedUserId || !selectedRole || isAddingUser || availableUsers.length === 0}
                                        size="sm"
                                        className="h-9"
                                    >
                                        <UserPlus className="size-4" />
                                        {isAddingUser ? 'Agregando...' : 'Agregar'}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Tabla de usuarios */}
                        <Card className="shadow-none">
                            <CardHeader className="pb-3">
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <Users className="size-4" />
                                    Usuarios asignados ({branchUsersData?.data.length || 0})
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="border rounded-lg border-gray-200 min-h-[200px] max-h-[400px] overflow-auto">
                                    <CustomizableTable
                                        table={table}
                                        isLoading={isLoadingBranchUsers}
                                        isError={isErrorBranchUsers}
                                        isFetching={isFetchingBranchUsers}
                                        rows={10}
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </DialogContent>
            </Dialog>

            <ConfirmationModal
                isOpen={!!userToRemove}
                title="Remover usuario"
                message={`¿Estás seguro de que deseas remover a ${userToRemove?.name} de esta sucursal?`}
                onClose={() => setUserToRemove(null)}
                onConfirm={handleConfirmRemove}
                isLoading={isRemovingUser}
            />
        </>
    );
};
