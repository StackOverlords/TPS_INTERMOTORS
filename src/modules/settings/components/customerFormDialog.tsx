import { Button } from '@/components/atoms/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/atoms/dialog';
import { Input } from '@/components/atoms/input';
import { Label } from '@/components/atoms/label';
import { ComboboxSelect } from '@/components/common/SelectCombobox';
import { showSuccessToast } from '@/hooks/use-toast-enhanced';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Plus, Save } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useGetCitiesCustomers } from '../hooks/commonLocation/useGetCities';
import { useGetCountriesCustomers } from '../hooks/commonLocation/useGetCountries';
import { useGetStatesCustomers } from '../hooks/commonLocation/useGetStates';
import { useCreateCustomer } from '../hooks/customer/useCreateCustomer';
import { useGetCustomerById } from '../hooks/customer/useGetCustomerById';
import { useUpdateCustomer } from '../hooks/customer/useUpdateCustomer';
import { CreateCustomerSchema, UpdateCustomerSchema } from '../schemas/customer.schema';
import type { CreateCustomer, UpdateCustomer } from '../types/customer.types';

interface CustomerFormDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    triggerButton?: React.ReactNode;
    isEditing?: boolean;
    editingId?: number | null;
}

const CustomerFormDialog: React.FC<CustomerFormDialogProps> = ({
    isOpen,
    onOpenChange,
    triggerButton,
    isEditing = false,
    editingId,
}) => {
    // Estados para cascada de ubicación
    const [selectedCountryId, setSelectedCountryId] = useState<number | undefined>(undefined);
    const [selectedStateId, setSelectedStateId] = useState<number | undefined>(undefined);

    const {
        data: customerById,
        isLoading: isLoadingCustomerById,
    } = useGetCustomerById(editingId || 0)

    const {
        mutate: handleCreateCustomer,
        isPending: isCreating
    } = useCreateCustomer()

    const {
        mutate: handleUpdateCustomer,
        isPending: isUpdating
    } = useUpdateCustomer()

    const { handleError } = useErrorHandler()

    // Hooks para datos de ubicación
    const { data: countriesData, isLoading: isLoadingCountries } = useGetCountriesCustomers();
    const { data: statesData, isLoading: isLoadingStates } = useGetStatesCustomers(selectedCountryId);
    const { data: citiesData, isLoading: isLoadingCities } = useGetCitiesCustomers(selectedStateId);

    // Forms
    const createForm = useForm<CreateCustomer>({
        resolver: zodResolver(CreateCustomerSchema),
        defaultValues: {
            nombre: '',
            direccion: '',
            nit: '',
            telefono: '',
            celular: '',
            contacto: '',
            dias_plazo: 0,
            pais_id: 1,
            provincia_departamento_id: 1,
            ciudad_id: 1,
        },
    });

    const updateForm = useForm<UpdateCustomer>({
        resolver: zodResolver(UpdateCustomerSchema),
        defaultValues: {
            nombre: '',
            direccion: '',
            nit: '',
            telefono: '',
            celular: '',
            contacto: '',
            dias_plazo: 0,
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
                dias_plazo: 0,
                pais_id: 1,
                provincia_departamento_id: 1,
                ciudad_id: 1,
            });
            // Inicializar estados de ubicación para crear
            setSelectedCountryId(1);
            setSelectedStateId(1);
        }
        if (customerById && isEditing) {
            updateForm.reset({
                nombre: customerById.cliente,
                direccion: customerById.direccion || '',
                nit: customerById.nit ? String(customerById.nit) : '',
                telefono: customerById.telefono || '',
                celular: customerById.celular || '',
                contacto: customerById.contacto || '',
                dias_plazo: customerById.dias_plazo,
                pais_id: customerById.pais_id,
                provincia_departamento_id: customerById.departamento_id || 1,
                ciudad_id: customerById.ciudad_id || 1,
            });
            // Inicializar estados de ubicación para editar
            setSelectedCountryId(customerById.pais_id);
            setSelectedStateId(customerById.departamento_id || undefined);
        }
    }, [customerById, isEditing, createForm, updateForm]);

    const handleDialogToggle = useCallback((open: boolean) => {
        onOpenChange(open);
    }, [onOpenChange]);

    const onSubmit = useCallback((e: React.FormEvent) => {
        e.preventDefault();

        const submitHandler = isEditing
            ? updateForm.handleSubmit((data) => {
                if (!editingId) return;

                handleUpdateCustomer({
                    id: editingId,
                    data
                }, {
                    onSuccess: () => {
                        showSuccessToast({
                            title: "Cliente actualizado",
                            description: "El cliente se actualizó exitosamente",
                            duration: 5000
                        });
                        handleDialogToggle(false);
                    },
                    onError: (error: unknown) => {
                        handleError({ error, customTitle: "No se pudo actualizar el cliente" });
                    }
                });
            })
            : createForm.handleSubmit((data) => {
                handleCreateCustomer(data, {
                    onSuccess: () => {
                        showSuccessToast({
                            title: "Cliente creado",
                            description: "El cliente se creó exitosamente",
                            duration: 5000
                        });
                        handleDialogToggle(false);
                        createForm.reset();
                    },
                    onError: (error: unknown) => {
                        handleError({ error, customTitle: "No se pudo crear el cliente" });
                    }
                });
            });

        submitHandler();
    }, [isEditing, editingId, updateForm, createForm, handleUpdateCustomer, handleCreateCustomer, handleDialogToggle, handleError]);

    const defaultTrigger = (
        <Button className="flex items-center gap-2">
            <Plus className="size-4" />
            Agregar Cliente
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
                        {isEditing ? "Editar" : "Agregar"} Cliente
                        {isEditing && editingId && (
                            <span className="text-gray-500 ml-2">
                                #{editingId}
                            </span>
                        )}
                    </DialogTitle>
                    <DialogDescription>
                        {isEditing ? "Modifica los datos del" : "Agrega un nuevo"} cliente
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={onSubmit} className="space-y-4">
                    {/* Información Básica */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="nombre">Nombre *</Label>
                            {isEditing && isLoadingCustomerById ? (
                                <div className="flex items-center justify-start px-2 h-10 gap-3 rounded-md animate-pulse bg-accent">
                                    <p className="text-sm text-gray-500">Cargando...</p>
                                </div>
                            ) : (
                                <>
                                    <Input
                                        id="nombre"
                                        {...(isEditing ? updateForm.register("nombre") : createForm.register("nombre"))}
                                        placeholder="Nombre del cliente"
                                        disabled={isLoadingCustomerById || isSaving}
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
                            {isEditing && isLoadingCustomerById ? (
                                <div className="flex items-center justify-start px-2 h-10 gap-3 rounded-md animate-pulse bg-accent">
                                    <p className="text-sm text-gray-500">Cargando...</p>
                                </div>
                            ) : (
                                <Input
                                    id="nit"
                                    {...(isEditing ? updateForm.register("nit") : createForm.register("nit"))}
                                    placeholder="NIT (opcional)"
                                    disabled={isLoadingCustomerById || isSaving}
                                />
                            )}
                        </div>
                    </div>

                    <div>
                        <Label htmlFor="direccion">Dirección</Label>
                        {isEditing && isLoadingCustomerById ? (
                            <div className="flex items-center justify-start px-2 h-10 gap-3 rounded-md animate-pulse bg-accent">
                                <p className="text-sm text-gray-500">Cargando...</p>
                            </div>
                        ) : (
                            <Input
                                id="direccion"
                                {...(isEditing ? updateForm.register("direccion") : createForm.register("direccion"))}
                                placeholder="Dirección (opcional)"
                                disabled={isLoadingCustomerById || isSaving}
                            />
                        )}
                    </div>

                    {/* Información de Contacto */}
                    <div className="pt-2">
                        <h3 className="text-sm font-semibold text-gray-700 mb-3">Información de Contacto</h3>

                        <div className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="telefono">Teléfono</Label>
                                    {isEditing && isLoadingCustomerById ? (
                                        <div className="flex items-center justify-start px-2 h-10 gap-3 rounded-md animate-pulse bg-accent">
                                            <p className="text-sm text-gray-500">Cargando...</p>
                                        </div>
                                    ) : (
                                        <Input
                                            id="telefono"
                                            {...(isEditing ? updateForm.register("telefono") : createForm.register("telefono"))}
                                            placeholder="Teléfono (opcional)"
                                            disabled={isLoadingCustomerById || isSaving}
                                        />
                                    )}
                                </div>

                                <div>
                                    <Label htmlFor="celular">Celular</Label>
                                    {isEditing && isLoadingCustomerById ? (
                                        <div className="flex items-center justify-start px-2 h-10 gap-3 rounded-md animate-pulse bg-accent">
                                            <p className="text-sm text-gray-500">Cargando...</p>
                                        </div>
                                    ) : (
                                        <Input
                                            id="celular"
                                            {...(isEditing ? updateForm.register("celular") : createForm.register("celular"))}
                                            placeholder="Celular (opcional)"
                                            disabled={isLoadingCustomerById || isSaving}
                                        />
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="contacto">Nombre de Contacto</Label>
                                    {isEditing && isLoadingCustomerById ? (
                                        <div className="flex items-center justify-start px-2 h-10 gap-3 rounded-md animate-pulse bg-accent">
                                            <p className="text-sm text-gray-500">Cargando...</p>
                                        </div>
                                    ) : (
                                        <Input
                                            id="contacto"
                                            {...(isEditing ? updateForm.register("contacto") : createForm.register("contacto"))}
                                            placeholder="Nombre de contacto (opcional)"
                                            disabled={isLoadingCustomerById || isSaving}
                                        />
                                    )}
                                </div>

                                <div>
                                    <Label htmlFor="dias_plazo">Días de Plazo</Label>
                                    {isEditing && isLoadingCustomerById ? (
                                        <div className="flex items-center justify-start px-2 h-10 gap-3 rounded-md animate-pulse bg-accent">
                                            <p className="text-sm text-gray-500">Cargando...</p>
                                        </div>
                                    ) : (
                                        <Input
                                            id="dias_plazo"
                                            type="number"
                                            {...(isEditing ? updateForm.register("dias_plazo", { valueAsNumber: true }) : createForm.register("dias_plazo", { valueAsNumber: true }))}
                                            placeholder="0"
                                            disabled={isLoadingCustomerById || isSaving}
                                        />
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Ubicación */}
                    <div className="pt-2">
                        <h3 className="text-sm font-semibold text-gray-700 mb-3">Ubicación</h3>

                        <div className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                {/* País */}
                                <div>
                                    <Label htmlFor="pais_id">País *</Label>
                                    {isEditing && isLoadingCustomerById ? (
                                        <div className="flex items-center justify-start px-2 h-10 gap-3 rounded-md animate-pulse bg-accent">
                                            <p className="text-sm text-gray-500">Cargando...</p>
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
                                                    disabled={isLoadingCustomerById || isSaving}
                                                />
                                            )}
                                        />
                                    )}
                                </div>

                                {/* Estado/Provincia */}
                                <div>
                                    <Label htmlFor="provincia_departamento_id">Estado/Provincia *</Label>
                                    {isEditing && isLoadingCustomerById ? (
                                        <div className="flex items-center justify-start px-2 h-10 gap-3 rounded-md animate-pulse bg-accent">
                                            <p className="text-sm text-gray-500">Cargando...</p>
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
                                                    disabled={!selectedCountryId || isLoadingCustomerById || isSaving}
                                                />
                                            )}
                                        />
                                    )}
                                </div>

                                {/* Ciudad */}
                                <div>
                                    <Label htmlFor="ciudad_id">Ciudad *</Label>
                                    {isEditing && isLoadingCustomerById ? (
                                        <div className="flex items-center justify-start px-2 h-10 gap-3 rounded-md animate-pulse bg-accent">
                                            <p className="text-sm text-gray-500">Cargando...</p>
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
                                                    disabled={!selectedStateId || isLoadingCustomerById || isSaving}
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
                            disabled={isLoadingCustomerById || isSaving}
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            className="bg-black hover:bg-gray-800"
                            disabled={isLoadingCustomerById || isSaving}
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
export default CustomerFormDialog;
