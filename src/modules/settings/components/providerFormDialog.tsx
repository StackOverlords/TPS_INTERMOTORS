import { Button } from '@/components/atoms/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/atoms/dialog';
import { Input } from '@/components/atoms/input';
import { Label } from '@/components/atoms/label';
import { ComboboxSelect } from '@/components/common/SelectCombobox';
import { showSuccessToast } from '@/hooks/use-toast-enhanced';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Plus, Save, ShieldAlert } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useGetCitiesProviders } from '../hooks/commonLocation/useGetCities';
import { useGetCountriesProviders } from '../hooks/commonLocation/useGetCountries';
import { useGetStatesProviders } from '../hooks/commonLocation/useGetStates';
import { useCreateProvider } from '../hooks/provider/useCreateProvider';
import { useGetProviderById } from '../hooks/provider/useGetProviderById';
import { useUpdateProvider } from '../hooks/provider/useUpdateProvider';
import { CreateProviderSchema, UpdateProviderSchema } from '../schemas/provider.schema';
import type { CreateProvider, UpdateProvider } from '../types/provider.types';
import { ProtectedAction } from '@/components/common/ProtectedAction';

interface ProviderFormDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    triggerButton?: React.ReactNode;
    isEditing?: boolean;
    editingId?: number | null;
}

const ProviderFormDialog: React.FC<ProviderFormDialogProps> = ({
    isOpen,
    onOpenChange,
    triggerButton,
    isEditing = false,
    editingId,
}) => {
    const {
        data: providerById,
        isLoading: isLoadingProviderById,
    } = useGetProviderById(editingId || 0)

    const {
        mutate: handleCreateProvider,
        isPending: isCreating
    } = useCreateProvider()

    const {
        mutate: handleUpdateProvider,
        isPending: isUpdating
    } = useUpdateProvider()

    const { handleError } = useErrorHandler()

    // Estados para selects en cascada
    const [selectedCountryId, setSelectedCountryId] = useState<number | undefined>(undefined);
    const [selectedStateId, setSelectedStateId] = useState<number | undefined>(undefined);

    // Hooks para cargar locations
    const { data: countriesData, isLoading: isLoadingCountries } = useGetCountriesProviders();
    const { data: statesData, isLoading: isLoadingStates } = useGetStatesProviders(selectedCountryId);
    const { data: citiesData, isLoading: isLoadingCities } = useGetCitiesProviders(selectedStateId);

    // Forms
    const createForm = useForm<CreateProvider>({
        resolver: zodResolver(CreateProviderSchema),
        defaultValues: {
            nombre: '',
            direccion: '',
            nit: '',
            telefono: '',
            celular: '',
            contacto: '',
            pais_id: 1,
            provincia_departamento_id: 1,
            ciudad_id: 1,
        },
    });

    const updateForm = useForm<UpdateProvider>({
        resolver: zodResolver(UpdateProviderSchema),
        defaultValues: {
            nombre: '',
            direccion: '',
            nit: '',
            telefono: '',
            celular: '',
            contacto: '',
            pais_id: 1,
            provincia_departamento_id: 1,
            ciudad_id: 1,
        },
    });

    const currentForm = useMemo(() => isEditing ? updateForm : createForm, [isEditing, updateForm, createForm]);
    const isSaving = useMemo(() => isCreating || isUpdating, [isCreating, isUpdating]);

    useEffect(() => {
        if (!isEditing) {
            createForm.reset({
                nombre: '',
                direccion: '',
                nit: '',
                telefono: '',
                celular: '',
                contacto: '',
                pais_id: 1,
                provincia_departamento_id: 1,
                ciudad_id: 1,
            });
            setSelectedCountryId(1);
            setSelectedStateId(1);
        }
        if (providerById && isEditing) {
            updateForm.reset({
                nombre: providerById.cliente,
                direccion: providerById.direccion || '',
                nit: providerById.nit || '',
                telefono: providerById.telefono || '',
                celular: providerById.celular || '',
                contacto: providerById.contacto || '',
                pais_id: providerById.pais_id,
                provincia_departamento_id: providerById.departamento_id || 1,
                ciudad_id: providerById.ciudad_id || 1,
            });
            // Inicializar selects con los valores del proveedor
            setSelectedCountryId(providerById.pais_id);
            setSelectedStateId(providerById.departamento_id || undefined);
        }
    }, [providerById, isEditing, createForm, updateForm]);

    const handleDialogToggle = useCallback((open: boolean) => {
        onOpenChange(open);
    }, [onOpenChange]);

    const onSubmit = useCallback((e: React.FormEvent) => {
        e.preventDefault();

        const submitHandler = isEditing
            ? updateForm.handleSubmit((data) => {
                if (!editingId) return;

                handleUpdateProvider({
                    id: editingId,
                    data
                }, {
                    onSuccess: () => {
                        showSuccessToast({
                            title: "Proveedor actualizado",
                            description: "El proveedor se actualizó exitosamente",
                            duration: 5000
                        });
                        handleDialogToggle(false);
                    },
                    onError: (error: unknown) => {
                        handleError({ error, customTitle: "No se pudo actualizar el proveedor" });
                    }
                });
            })
            : createForm.handleSubmit((data: any) => {
                handleCreateProvider(data, {
                    onSuccess: () => {
                        showSuccessToast({
                            title: "Proveedor creado",
                            description: "El proveedor se creó exitosamente",
                            duration: 5000
                        });
                        handleDialogToggle(false);
                        createForm.reset();
                    },
                    onError: (error: unknown) => {
                        handleError({ error, customTitle: "No se pudo crear el proveedor" });
                    }
                });
            });

        submitHandler();
    }, [isEditing, editingId, updateForm, createForm, handleUpdateProvider, handleCreateProvider, handleDialogToggle, handleError]);

    const defaultTrigger = (
        <Button className="flex items-center gap-2">
            <Plus className="size-4" />
            Agregar Proveedor
        </Button>
    );

    return (
        <Dialog open={isOpen} onOpenChange={handleDialogToggle}>
            <ProtectedAction
                permission='pro-create'
                roles={["Super Admin", "Administrador", "Vendedor"]}
                fallback={
                    <Button disabled variant={"destructive"} className="flex items-center gap-2">
                        <ShieldAlert className="size-4" />
                        Sin permiso para crear
                    </Button>}
            >
                <DialogTrigger asChild>
                    {triggerButton || defaultTrigger}
                </DialogTrigger>
            </ProtectedAction>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {isEditing ? "Editar" : "Agregar"} Proveedor
                        {isEditing && editingId && (
                            <span className=" ml-2">
                                #{editingId}
                            </span>
                        )}
                    </DialogTitle>
                    <DialogDescription>
                        {isEditing ? "Modifica los datos del" : "Agrega un nuevo"} proveedor
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={onSubmit} className="space-y-4">
                    {/* Información Básica */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="nombre">Nombre *</Label>
                            {isEditing && isLoadingProviderById ? (
                                <div className="flex items-center justify-start px-2 h-10 gap-3 rounded-md animate-pulse bg-accent">
                                    <p className="text-sm ">Cargando...</p>
                                </div>
                            ) : (
                                <>
                                    <Input
                                        id="nombre"
                                        {...(isEditing ? updateForm.register("nombre") : createForm.register("nombre"))}
                                        placeholder="Nombre del proveedor"
                                        disabled={isLoadingProviderById || isSaving}
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
                            <Label htmlFor="nit">NIT</Label>
                            {isEditing && isLoadingProviderById ? (
                                <div className="flex items-center justify-start px-2 h-10 gap-3 rounded-md animate-pulse bg-accent">
                                    <p className="text-sm ">Cargando...</p>
                                </div>
                            ) : (
                                <Input
                                    id="nit"
                                    {...(isEditing ? updateForm.register("nit") : createForm.register("nit"))}
                                    placeholder="NIT (opcional)"
                                    disabled={isLoadingProviderById || isSaving}
                                />
                            )}
                        </div>
                    </div>

                    <div>
                        <Label htmlFor="direccion">Dirección</Label>
                        {isEditing && isLoadingProviderById ? (
                            <div className="flex items-center justify-start px-2 h-10 gap-3 rounded-md animate-pulse bg-accent">
                                <p className="text-sm ">Cargando...</p>
                            </div>
                        ) : (
                            <Input
                                id="direccion"
                                {...(isEditing ? updateForm.register("direccion") : createForm.register("direccion"))}
                                placeholder="Dirección (opcional)"
                                disabled={isLoadingProviderById || isSaving}
                            />
                        )}
                    </div>

                    {/* Información de Contacto */}
                    <div className="pt-2 ">
                        <h3 className="text-sm font-semibold  mb-3">Información de Contacto</h3>

                        <div className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="telefono">Teléfono</Label>
                                    {isEditing && isLoadingProviderById ? (
                                        <div className="flex items-center justify-start px-2 h-10 gap-3 rounded-md animate-pulse bg-accent">
                                            <p className="text-sm ">Cargando...</p>
                                        </div>
                                    ) : (
                                        <Input
                                            id="telefono"
                                            {...(isEditing ? updateForm.register("telefono") : createForm.register("telefono"))}
                                            placeholder="Teléfono (opcional)"
                                            disabled={isLoadingProviderById || isSaving}
                                        />
                                    )}
                                </div>

                                <div>
                                    <Label htmlFor="celular">Celular</Label>
                                    {isEditing && isLoadingProviderById ? (
                                        <div className="flex items-center justify-start px-2 h-10 gap-3 rounded-md animate-pulse bg-accent">
                                            <p className="text-sm ">Cargando...</p>
                                        </div>
                                    ) : (
                                        <Input
                                            id="celular"
                                            {...(isEditing ? updateForm.register("celular") : createForm.register("celular"))}
                                            placeholder="Celular (opcional)"
                                            disabled={isLoadingProviderById || isSaving}
                                        />
                                    )}
                                </div>
                            </div>

                            <div>
                                <Label htmlFor="contacto">Nombre de Contacto</Label>
                                {isEditing && isLoadingProviderById ? (
                                    <div className="flex items-center justify-start px-2 h-10 gap-3 rounded-md animate-pulse bg-accent">
                                        <p className="text-sm ">Cargando...</p>
                                    </div>
                                ) : (
                                    <Input
                                        id="contacto"
                                        {...(isEditing ? updateForm.register("contacto") : createForm.register("contacto"))}
                                        placeholder="Nombre de contacto (opcional)"
                                        disabled={isLoadingProviderById || isSaving}
                                    />
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Ubicación */}
                    <div className="pt-2 ">
                        <h3 className="text-sm font-semibold  mb-3">Ubicación</h3>

                        <div className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                {/* País */}
                                <div>
                                    <Label htmlFor="pais_id">País *</Label>
                                    {isEditing && isLoadingProviderById ? (
                                        <div className="flex items-center justify-start px-2 h-10 gap-3 rounded-md animate-pulse bg-accent">
                                            <p className="text-sm ">Cargando...</p>
                                        </div>
                                    ) : (
                                        <Controller
                                            name="pais_id"
                                            control={currentForm.control as any}
                                            render={({ field }) => (
                                                <ComboboxSelect
                                                    value={field.value}
                                                    onChange={(value) => {
                                                        const numValue = Number(value);
                                                        field.onChange(numValue);
                                                        setSelectedCountryId(numValue);
                                                        // Reset estado y ciudad cuando cambia el país
                                                        setSelectedStateId(undefined);
                                                    }}
                                                    options={countriesData?.data.map(country => ({
                                                        id: country.id,
                                                        nombre: country.nombre,
                                                    })) || []}
                                                    optionTag="nombre"
                                                    placeholder="Seleccionar país..."
                                                    searchPlaceholder="Buscar país..."
                                                    isLoadingData={isLoadingCountries}
                                                    disabled={isLoadingProviderById || isSaving}
                                                />
                                            )}
                                        />
                                    )}
                                </div>

                                {/* Estado/Provincia */}
                                <div>
                                    <Label htmlFor="provincia_departamento_id">Estado/Provincia *</Label>
                                    {isEditing && isLoadingProviderById ? (
                                        <div className="flex items-center justify-start px-2 h-10 gap-3 rounded-md animate-pulse bg-accent">
                                            <p className="text-sm ">Cargando...</p>
                                        </div>
                                    ) : (
                                        <Controller
                                            name="provincia_departamento_id"
                                            control={currentForm.control as any}
                                            render={({ field }) => (
                                                <ComboboxSelect
                                                    value={field.value}
                                                    onChange={(value) => {
                                                        const numValue = Number(value);
                                                        field.onChange(numValue);
                                                        setSelectedStateId(numValue);
                                                    }}
                                                    options={statesData?.data.map(state => ({
                                                        id: state.id,
                                                        nombre: state.nombre,
                                                    })) || []}
                                                    optionTag="nombre"
                                                    placeholder="Seleccionar estado..."
                                                    searchPlaceholder="Buscar estado..."
                                                    isLoadingData={isLoadingStates}
                                                    disabled={!selectedCountryId || isLoadingProviderById || isSaving}
                                                />
                                            )}
                                        />
                                    )}
                                </div>

                                {/* Ciudad */}
                                <div>
                                    <Label htmlFor="ciudad_id">Ciudad *</Label>
                                    {isEditing && isLoadingProviderById ? (
                                        <div className="flex items-center justify-start px-2 h-10 gap-3 rounded-md animate-pulse bg-accent">
                                            <p className="text-sm ">Cargando...</p>
                                        </div>
                                    ) : (
                                        <Controller
                                            name="ciudad_id"
                                            control={currentForm.control as any}
                                            render={({ field }) => (
                                                <ComboboxSelect
                                                    value={field.value}
                                                    onChange={(value) => field.onChange(Number(value))}
                                                    options={citiesData?.data.map(city => ({
                                                        id: city.id,
                                                        nombre: city.nombre,
                                                    })) || []}
                                                    optionTag="nombre"
                                                    placeholder="Seleccionar ciudad..."
                                                    searchPlaceholder="Buscar ciudad..."
                                                    isLoadingData={isLoadingCities}
                                                    disabled={!selectedStateId || isLoadingProviderById || isSaving}
                                                />
                                            )}
                                        />
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => handleDialogToggle(false)}
                            disabled={isLoadingProviderById || isSaving}
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            className="bg-black hover:bg-gray-800"
                            disabled={isLoadingProviderById || isSaving}
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
export default ProviderFormDialog;
