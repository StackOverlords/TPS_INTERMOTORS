import { useForm } from 'react-hook-form';
import { Button } from '@/components/atoms/button';
import { ImageIcon, Loader2, Plus, Save, X } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/atoms/dialog';
import { Label } from '@/components/atoms/label';
import { Input } from '@/components/atoms/input';
import type { CreateBranch, UpdateBranch } from '../types/branch.types';
import { useGetBranchById } from '../hooks/branch/useGetBranchById';
import { useCreateBranch } from '../hooks/branch/useCreateBranch';
import { useUpdateBranch } from '../hooks/branch/useUpdateBranch';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreateBranchSchema, UpdateBranchSchema } from '../schemas/branch.schema';
import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { showErrorToast, showSuccessToast } from '@/hooks/use-toast-enhanced';

interface BranchFormDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    triggerButton?: React.ReactNode;
    isEditing?: boolean;
    editingId?: number | null;
}

const BranchFormDialog: React.FC<BranchFormDialogProps> = ({
    isOpen,
    onOpenChange,
    triggerButton,
    isEditing = false,
    editingId,
}) => {
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const {
        data: branchById,
        isLoading: isLoadingBranchById,
        isError: isErrorBranchById,
        error: errorBranchById,
    } = useGetBranchById(editingId || 0)

    const {
        mutate: handleCreateBranch,
        isPending: isCreating
    } = useCreateBranch()

    const {
        mutate: handleUpdateBranch,
        isPending: isUpdating
    } = useUpdateBranch()

    const { handleError } = useErrorHandler()

    // Forms
    const createForm = useForm<CreateBranch>({
        resolver: zodResolver(CreateBranchSchema),
        defaultValues: {
            nombre: '',
            sigla: '',
            nombre_comercial: '',
            direccion: '',
            telefono: '',
            celular: '',
            fax: '',
        },
    });

    const updateForm = useForm<UpdateBranch>({
        resolver: zodResolver(UpdateBranchSchema),
        defaultValues: {
            nombre: '',
            sigla: '',
            nombre_comercial: '',
            direccion: '',
            telefono: '',
            celular: '',
            fax: '',
        },
    });

    const currentForm = useMemo(() => isEditing ? updateForm : createForm, [isEditing, updateForm, createForm]);
    const isSaving = useMemo(() => isCreating || isUpdating, [isCreating, isUpdating]);

    useEffect(() => {
        if (!isEditing) {
            createForm.reset({
                nombre: '',
                sigla: '',
                nombre_comercial: '',
                direccion: '',
                telefono: '',
                celular: '',
                fax: '',
            });
            setImagePreview(null);
        }
        if (branchById && isEditing) {
            updateForm.reset({
                nombre: branchById.nombre,
                sigla: branchById.sigla,
                nombre_comercial: branchById.nombre_comercial || '',
                direccion: branchById.direccion || '',
                telefono: branchById.telefono || '',
                celular: branchById.celular || '',
                fax: branchById.fax || '',
            });
        }
    }, [branchById, isEditing, updateForm, createForm]);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (isEditing) {
                updateForm.setValue('imagen', file);
            } else {
                createForm.setValue('imagen', file);
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemoveImage = () => {
        if (isEditing) {
            updateForm.setValue('imagen', undefined);
        } else {
            createForm.setValue('imagen', undefined);
        }
        setImagePreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleCreateSubmit = useCallback(createForm.handleSubmit(async (data: CreateBranch) => {
        handleCreateBranch(data, {
            onSuccess: () => {
                showSuccessToast({
                    title: "Sucursal Agregada",
                    description: "Sucursal agregada exitosamente",
                    duration: 5000
                });
                handleDialogToggle(false);
            },
            onError: (error: unknown) => {
                handleError({ error, customTitle: "No se pudo agregar la sucursal" });
            }
        });
    }), [createForm, handleCreateBranch, handleError]);

    const handleUpdateSubmit = useCallback(updateForm.handleSubmit(async (data: UpdateBranch) => {
        if (!editingId) {
            showErrorToast({
                title: "Error al modificar sucursal",
                description: "No se pudo modificar la sucursal. Por favor, intenta nuevamente",
                duration: 5000
            });
            return;
        }

        handleUpdateBranch({ data, id: editingId }, {
            onSuccess: () => {
                showSuccessToast({
                    title: "Sucursal Modificada",
                    description: "Sucursal modificada exitosamente",
                    duration: 5000
                });
                handleDialogToggle(false);
            },
            onError: (error: unknown) => {
                handleError({ error, customTitle: "No se pudo modificar la sucursal" });
            }
        });
    }), [updateForm, editingId, handleUpdateBranch, handleError]);

    const onSubmit = useMemo(() => isEditing ? handleUpdateSubmit : handleCreateSubmit, [isEditing, handleUpdateSubmit, handleCreateSubmit])

    const handleDialogToggle = useCallback((open: boolean) => {
        onOpenChange(open)
        if (!open) {
            createForm.reset();
            updateForm.reset();
            setImagePreview(null);
        }
    }, [onOpenChange, createForm, updateForm]);

    useEffect(() => {
        if (!isErrorBranchById) return
        handleError({ error: errorBranchById, customTitle: "Ocurrió un error al cargar los datos" });
        handleDialogToggle(false)
    }, [isErrorBranchById, errorBranchById, handleError, handleDialogToggle])

    const defaultTrigger = (
        <Button className="w-full sm:w-auto">
            <Plus className="size-4" />
            Agregar Sucursal
        </Button>
    );

    return (
        <Dialog open={isOpen} onOpenChange={handleDialogToggle}>
            <DialogTrigger asChild>
                {triggerButton || defaultTrigger}
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {isEditing ? "Editar" : "Agregar"} Sucursal
                        {isEditing && editingId && (
                            <span className="text-gray-500 ml-2">
                                #{editingId}
                            </span>
                        )}
                    </DialogTitle>
                    <DialogDescription>
                        {isEditing ? "Modifica los datos de la" : "Agrega una nueva"} sucursal
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={onSubmit} className="space-y-4">
                    {/* Información Básica */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="nombre">Nombre *</Label>
                            {isEditing && isLoadingBranchById ? (
                                <div className="flex items-center justify-start px-2 h-10 gap-3 rounded-md animate-pulse bg-accent">
                                    <p className="text-sm text-gray-500">Cargando...</p>
                                </div>
                            ) : (
                                <>
                                    <Input
                                        id="nombre"
                                        {...(isEditing ? updateForm.register("nombre") : createForm.register("nombre"))}
                                        placeholder="Nombre de la sucursal"
                                        disabled={isLoadingBranchById || isSaving}
                                        autoFocus={true}
                                    />
                                    {currentForm.formState.errors.nombre && (
                                        <p className="text-xs text-red-500 mt-1">
                                            {currentForm.formState.errors.nombre.message}
                                        </p>
                                    )}
                                </>
                            )}
                        </div>

                        <div>
                            <Label htmlFor="sigla">Sigla *</Label>
                            {isEditing && isLoadingBranchById ? (
                                <div className="flex items-center justify-start px-2 h-10 gap-3 rounded-md animate-pulse bg-accent">
                                    <p className="text-sm text-gray-500">Cargando...</p>
                                </div>
                            ) : (
                                <>
                                    <Input
                                        id="sigla"
                                        {...(isEditing ? updateForm.register("sigla") : createForm.register("sigla"))}
                                        placeholder="Ej: T01, T02"
                                        disabled={isLoadingBranchById || isSaving}
                                    />
                                    {currentForm.formState.errors.sigla && (
                                        <p className="text-xs text-red-500 mt-1">
                                            {currentForm.formState.errors.sigla.message}
                                        </p>
                                    )}
                                </>
                            )}
                        </div>
                    </div>

                    <div>
                        <Label htmlFor="nombre_comercial">Nombre Comercial *</Label>
                        {isEditing && isLoadingBranchById ? (
                            <div className="flex items-center justify-start px-2 h-10 gap-3 rounded-md animate-pulse bg-accent">
                                <p className="text-sm text-gray-500">Cargando...</p>
                            </div>
                        ) : (
                            <>
                                <Input
                                    id="nombre_comercial"
                                    {...(isEditing ? updateForm.register("nombre_comercial") : createForm.register("nombre_comercial"))}
                                    placeholder="Nombre comercial"
                                    disabled={isLoadingBranchById || isSaving}
                                />
                                {currentForm.formState.errors.nombre_comercial && (
                                    <p className="text-xs text-red-500 mt-1">
                                        {currentForm.formState.errors.nombre_comercial.message}
                                    </p>
                                )}
                            </>
                        )}
                    </div>

                    {/* Información de Contacto */}
                    <div className="pt-2 border-t">
                        <h3 className="text-sm font-semibold text-gray-700 mb-3">Información de Contacto</h3>

                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="direccion">Dirección *</Label>
                                {isEditing && isLoadingBranchById ? (
                                    <div className="flex items-center justify-start px-2 h-10 gap-3 rounded-md animate-pulse bg-accent">
                                        <p className="text-sm text-gray-500">Cargando...</p>
                                    </div>
                                ) : (
                                    <>
                                        <Input
                                            id="direccion"
                                            {...(isEditing ? updateForm.register("direccion") : createForm.register("direccion"))}
                                            placeholder="Dirección de la sucursal"
                                            disabled={isLoadingBranchById || isSaving}
                                        />
                                        {currentForm.formState.errors.direccion && (
                                            <p className="text-xs text-red-500 mt-1">
                                                {currentForm.formState.errors.direccion.message}
                                            </p>
                                        )}
                                    </>
                                )}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div>
                                    <Label htmlFor="telefono">Teléfono *</Label>
                                    {isEditing && isLoadingBranchById ? (
                                        <div className="flex items-center justify-start px-2 h-10 gap-3 rounded-md animate-pulse bg-accent">
                                            <p className="text-sm text-gray-500">Cargando...</p>
                                        </div>
                                    ) : (
                                        <>
                                            <Input
                                                id="telefono"
                                                {...(isEditing ? updateForm.register("telefono") : createForm.register("telefono"))}
                                                placeholder="Teléfono"
                                                disabled={isLoadingBranchById || isSaving}
                                            />
                                            {currentForm.formState.errors.telefono && (
                                                <p className="text-xs text-red-500 mt-1">
                                                    {currentForm.formState.errors.telefono.message}
                                                </p>
                                            )}
                                        </>
                                    )}
                                </div>

                                <div>
                                    <Label htmlFor="celular">Celular</Label>
                                    {isEditing && isLoadingBranchById ? (
                                        <div className="flex items-center justify-start px-2 h-10 gap-3 rounded-md animate-pulse bg-accent">
                                            <p className="text-sm text-gray-500">Cargando...</p>
                                        </div>
                                    ) : (
                                        <Input
                                            id="celular"
                                            {...(isEditing ? updateForm.register("celular") : createForm.register("celular"))}
                                            placeholder="Celular (opcional)"
                                            disabled={isLoadingBranchById || isSaving}
                                        />
                                    )}
                                </div>

                                <div>
                                    <Label htmlFor="fax">Fax</Label>
                                    {isEditing && isLoadingBranchById ? (
                                        <div className="flex items-center justify-start px-2 h-10 gap-3 rounded-md animate-pulse bg-accent">
                                            <p className="text-sm text-gray-500">Cargando...</p>
                                        </div>
                                    ) : (
                                        <Input
                                            id="fax"
                                            {...(isEditing ? updateForm.register("fax") : createForm.register("fax"))}
                                            placeholder="Fax (opcional)"
                                            disabled={isLoadingBranchById || isSaving}
                                        />
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Imagen */}
                    {(
                        <div className="pt-2 border-t">
                            <h3 className="text-sm font-semibold text-gray-700 mb-3">Imagen</h3>
                            <div className="space-y-3">
                                <div>
                                    <Label htmlFor="imagen">Imagen de la sucursal (opcional)</Label>
                                    <Input
                                        ref={fileInputRef}
                                        id="imagen"
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageChange}
                                        disabled={isLoadingBranchById || isSaving}
                                        className="cursor-pointer"
                                    />
                                </div>

                                {imagePreview && (
                                    <div className="relative w-32 h-32 border rounded-lg overflow-hidden">
                                        <img
                                            src={imagePreview}
                                            alt="Preview"
                                            className="w-full h-full object-cover"
                                        />
                                        <Button
                                            type="button"
                                            variant="destructive"
                                            size="sm"
                                            className="absolute top-1 right-1 h-6 w-6 p-0"
                                            onClick={handleRemoveImage}
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                )}

                                {!imagePreview && (
                                    <div className="flex items-center justify-center w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg">
                                        <ImageIcon className="h-8 w-8 text-gray-400" />
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end gap-2 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => handleDialogToggle(false)}
                            disabled={isLoadingBranchById || isSaving}
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            className="bg-black hover:bg-gray-800"
                            disabled={isLoadingBranchById || isSaving}
                        >
                            {isSaving ? (
                                <>
                                    <Loader2 className='size-4 animate-spin' />
                                    Procesando...
                                </>
                            ) : (
                                <>
                                    <Save className='size-4' />
                                    {isEditing ? "Actualizar" : "Crear"}
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
export default BranchFormDialog;
