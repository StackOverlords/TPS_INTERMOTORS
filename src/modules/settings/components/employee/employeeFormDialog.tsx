import { Button } from "@/components/atoms/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/atoms/dialog";
import { Input } from "@/components/atoms/input";
import { Label } from "@/components/atoms/label";
import { Checkbox } from "@/components/atoms/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/atoms/select";
import { showSuccessToast } from "@/hooks/use-toast-enhanced";
import { useErrorHandler } from "@/hooks/useErrorHandler";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus, Save } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { ProtectedAction } from "@/components/common/ProtectedAction";
import { useGetEmployeeById } from "../../hooks/employee/useGetEmployeeById";
import { useCreateEmployee } from "../../hooks/employee/useCreateEmployee";
import { useUpdateEmployee } from "../../hooks/employee/useUpdateEmployee";
import type {
  CreateEmployee,
  UpdateEmployee,
} from "../../types/employee.types";
import {
  CreateEmployeeSchema,
  UpdateEmployeeSchema,
} from "../../schemas/employee.schema";
import { useGenderTypes } from "@/modules/shared/hooks/useGenderTypes";
import { useDniTypes } from "@/modules/shared/hooks/useDniTypes";
import {
  formatDateForSubmission,
  formatDateForUpdate,
  getTodayDate,
  parseDateFromBackend,
} from "@/utils/dateFormatters";

interface EmployeeFormDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  triggerButton?: React.ReactNode;
  isEditing?: boolean;
  editingId?: number | null;
}

const buildEmptyValues = () => ({
  fecha_ingreso: getTodayDate(),
  nombre: "",
  apellido_p: "",
  apellido_m: "",
  sexo: "",
  dni: undefined as unknown as number,
  dni_comp: "",
  dni_tipo: "",
  telefono: "",
  celular: "",
  direccion: "",
  email: "",
  responsable_ventas: false,
  responsable_compras: false,
});

interface EmployeeFormInnerProps {
  isEditing: boolean;
  editingId?: number | null;
  onSuccess: () => void;
}

const EmployeeFormInner: React.FC<EmployeeFormInnerProps> = ({
  isEditing,
  editingId,
  onSuccess,
}) => {
  const { data: employeeById, isLoading: isLoadingEmployeeById } =
    useGetEmployeeById(editingId || 0);

  const { mutate: handleCreateEmployee, isPending: isCreating } =
    useCreateEmployee();
  const { mutate: handleUpdateEmployee, isPending: isUpdating } =
    useUpdateEmployee();

  const { data: genderTypes = [] } = useGenderTypes();
  const { data: dniTypes = [] } = useDniTypes();

  const { handleError } = useErrorHandler();

  // En crear arranca true (no hay datos que esperar).
  // En editar arranca false: los Selects no montan hasta que el reset
  // con los datos reales haya corrido, evitando que Radix se inicialice con "".
  const [isFormReady, setIsFormReady] = useState(!isEditing);

  const createForm = useForm<CreateEmployee>({
    resolver: zodResolver(CreateEmployeeSchema),
    defaultValues: buildEmptyValues(),
  });

  const updateForm = useForm<UpdateEmployee>({
    resolver: zodResolver(UpdateEmployeeSchema),
    defaultValues: buildEmptyValues(),
  });

  const currentForm = useMemo(
    () => (isEditing ? updateForm : createForm),
    [isEditing, updateForm, createForm]
  );

  const isSaving = useMemo(
    () => isCreating || isUpdating,
    [isCreating, isUpdating]
  );

  // ─── CREAR: aplicar defaults de catálogos cuando lleguen ─────────────────────
  useEffect(() => {
    if (isEditing) return;
    if (!genderTypes.length || !dniTypes.length) return;
    createForm.reset({
      ...buildEmptyValues(),
      sexo: genderTypes[0]?.code ?? "",
      dni_tipo: dniTypes[0]?.code ?? "",
    });
  }, [genderTypes, dniTypes]);

  // ─── EDITAR: poblar cuando lleguen los datos del empleado ────────────────────
  // Después del reset, marcamos isFormReady=true para que los Selects monten
  // ya con el valor correcto en su estado inicial y no con "".
  useEffect(() => {
    if (!isEditing || !employeeById) return;

    const p = employeeById.persona;

    updateForm.reset({
      fecha_ingreso: parseDateFromBackend(employeeById.fecha_ingreso),
      nombre: p.nombre ?? "",
      apellido_p: p.apellido_paterno ?? "",
      apellido_m: p.apellido_materno ?? "",
      sexo: p.sexo ?? "",
      dni: p.dni ?? 0,
      dni_comp: p.dni_comp ?? "",
      dni_tipo: p.dni_tipo ?? "",
      telefono: p.telefono ?? "",
      celular: p.celular ?? "",
      direccion: p.direccion ?? "",
      email: p.correo ?? "",
      responsable_ventas: employeeById.responsable_ventas ?? false,
      responsable_compras: employeeById.responsable_compras ?? false,
    });

    setIsFormReady(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employeeById]);

  const onSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();

      const submitHandler = isEditing
        ? updateForm.handleSubmit((data) => {
            if (!editingId) return;

            const fechaFormateada = formatDateForUpdate(
              data.fecha_ingreso,
              employeeById?.fecha_ingreso ?? data.fecha_ingreso
            );

            handleUpdateEmployee(
              {
                id: editingId,
                data: { ...data, fecha_ingreso: fechaFormateada },
              },
              {
                onSuccess: () => {
                  showSuccessToast({
                    title: "Responsable actualizado",
                    description: "El Responsable se actualizó exitosamente",
                    duration: 5000,
                  });
                  onSuccess();
                },
                onError: (error: unknown) => {
                  handleError({
                    error,
                    customTitle: "No se pudo actualizar el Responsable",
                  });
                },
              }
            );
          })
        : createForm.handleSubmit((data) => {
            const fechaFormateada = formatDateForSubmission(data.fecha_ingreso);

            handleCreateEmployee(
              { ...data, fecha_ingreso: fechaFormateada },
              {
                onSuccess: () => {
                  showSuccessToast({
                    title: "Responsable creado",
                    description: "El Responsable se creó exitosamente",
                    duration: 5000,
                  });
                  onSuccess();
                },
                onError: (error: unknown) => {
                  handleError({
                    error,
                    customTitle: "No se pudo crear el Responsable",
                  });
                },
              }
            );
          });

      submitHandler();
    },
    [
      isEditing,
      editingId,
      employeeById,
      updateForm,
      createForm,
      handleUpdateEmployee,
      handleCreateEmployee,
      onSuccess,
      handleError,
    ]
  );

  const LoadingField = () => (
    <div className="flex items-center justify-start px-2 h-8 gap-3 rounded-md animate-pulse bg-accent">
      <p className="text-sm">Cargando...</p>
    </div>
  );

  // isLoadingEdit ahora cubre tanto la carga de datos como el reset pendiente.
  // Los Selects no montarán hasta que isFormReady sea true.
  const isLoadingEdit = isEditing && (!isFormReady || isLoadingEmployeeById);

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {/* Datos personales */}
      <div>
        <h3 className="text-sm font-semibold mb-3">Datos Personales</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Nombre */}
          <div>
            <Label htmlFor="nombre">Nombre *</Label>
            {isLoadingEdit ? (
              <LoadingField />
            ) : (
              <>
                <Input
                  id="nombre"
                  {...(isEditing
                    ? updateForm.register("nombre")
                    : createForm.register("nombre"))}
                  placeholder="Nombre"
                  disabled={isLoadingEdit || isSaving}
                  autoFocus
                />
                {currentForm.formState.errors.nombre && (
                  <p className="text-xs text-red-500 mt-1">
                    {currentForm.formState.errors.nombre.message}
                  </p>
                )}
              </>
            )}
          </div>

          {/* Apellido paterno */}
          <div>
            <Label htmlFor="apellido_p">Apellido Paterno *</Label>
            {isLoadingEdit ? (
              <LoadingField />
            ) : (
              <>
                <Input
                  id="apellido_p"
                  {...(isEditing
                    ? updateForm.register("apellido_p")
                    : createForm.register("apellido_p"))}
                  placeholder="Apellido paterno"
                  disabled={isLoadingEdit || isSaving}
                />
                {currentForm.formState.errors.apellido_p && (
                  <p className="text-xs text-red-500 mt-1">
                    {currentForm.formState.errors.apellido_p.message}
                  </p>
                )}
              </>
            )}
          </div>

          {/* Apellido materno */}
          <div>
            <Label htmlFor="apellido_m">Apellido Materno</Label>
            {isLoadingEdit ? (
              <LoadingField />
            ) : (
              <Input
                id="apellido_m"
                {...(isEditing
                  ? updateForm.register("apellido_m")
                  : createForm.register("apellido_m"))}
                placeholder="Apellido materno (opcional)"
                disabled={isLoadingEdit || isSaving}
              />
            )}
          </div>

          {/* Sexo */}
          <div>
            <Label htmlFor="sexo">Sexo *</Label>
            {isLoadingEdit ? (
              <LoadingField />
            ) : (
              <>
                <Controller
                  name="sexo"
                  control={currentForm.control}
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={isSaving}
                    >
                      <SelectTrigger id="sexo">
                        <SelectValue placeholder="Seleccionar..." />
                      </SelectTrigger>
                      <SelectContent>
                        {genderTypes.map((g) => (
                          <SelectItem key={g.code} value={g.code}>
                            {g.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {currentForm.formState.errors.sexo && (
                  <p className="text-xs text-red-500 mt-1">
                    {currentForm.formState.errors.sexo.message}
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Documento de identidad */}
      <div>
        <h3 className="text-sm font-semibold mb-3">Documento de Identidad</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Tipo DNI */}
          <div>
            <Label htmlFor="dni_tipo">Tipo *</Label>
            {isLoadingEdit ? (
              <LoadingField />
            ) : (
              <>
                <Controller
                  name="dni_tipo"
                  control={currentForm.control}
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={isSaving}
                    >
                      <SelectTrigger id="dni_tipo">
                        <SelectValue placeholder="Tipo..." />
                      </SelectTrigger>
                      <SelectContent>
                        {dniTypes.map((d) => (
                          <SelectItem key={d.code} value={d.code}>
                            {d.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {currentForm.formState.errors.dni_tipo && (
                  <p className="text-xs text-red-500 mt-1">
                    {currentForm.formState.errors.dni_tipo.message}
                  </p>
                )}
              </>
            )}
          </div>

          {/* DNI */}
          <div>
            <Label htmlFor="dni">DNI *</Label>
            {isLoadingEdit ? (
              <LoadingField />
            ) : (
              <>
                <Input
                  id="dni"
                  type="number"
                  {...(isEditing
                    ? updateForm.register("dni", {
                        setValueAs: (v) => (v === "" ? undefined : Number(v)),
                      })
                    : createForm.register("dni", {
                        setValueAs: (v) => (v === "" ? undefined : Number(v)),
                      }))}
                  placeholder="Número de documento"
                  disabled={isLoadingEdit || isSaving}
                />
                {currentForm.formState.errors.dni && (
                  <p className="text-xs text-red-500 mt-1">
                    {currentForm.formState.errors.dni.message}
                  </p>
                )}
              </>
            )}
          </div>

          {/* DNI complemento */}
          <div>
            <Label htmlFor="dni_comp">Complemento</Label>
            {isLoadingEdit ? (
              <LoadingField />
            ) : (
              <Input
                id="dni_comp"
                {...(isEditing
                  ? updateForm.register("dni_comp")
                  : createForm.register("dni_comp"))}
                placeholder="1A (opcional)"
                disabled={isLoadingEdit || isSaving}
              />
            )}
          </div>
        </div>
      </div>

      {/* Contacto */}
      <div>
        <h3 className="text-sm font-semibold mb-3">Contacto</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="email">Email *</Label>
            {isLoadingEdit ? (
              <LoadingField />
            ) : (
              <>
                <Input
                  id="email"
                  type="email"
                  {...(isEditing
                    ? updateForm.register("email")
                    : createForm.register("email"))}
                  placeholder="correo@ejemplo.com"
                  disabled={isLoadingEdit || isSaving}
                />
                {currentForm.formState.errors.email && (
                  <p className="text-xs text-red-500 mt-1">
                    {currentForm.formState.errors.email.message}
                  </p>
                )}
              </>
            )}
          </div>

          <div>
            <Label htmlFor="celular">Celular</Label>
            {isLoadingEdit ? (
              <LoadingField />
            ) : (
              <Input
                id="celular"
                {...(isEditing
                  ? updateForm.register("celular")
                  : createForm.register("celular"))}
                placeholder="Celular (opcional)"
                disabled={isLoadingEdit || isSaving}
              />
            )}
          </div>

          <div>
            <Label htmlFor="telefono">Teléfono</Label>
            {isLoadingEdit ? (
              <LoadingField />
            ) : (
              <Input
                id="telefono"
                {...(isEditing
                  ? updateForm.register("telefono")
                  : createForm.register("telefono"))}
                placeholder="Teléfono (opcional)"
                disabled={isLoadingEdit || isSaving}
              />
            )}
          </div>

          <div>
            <Label htmlFor="direccion">Dirección</Label>
            {isLoadingEdit ? (
              <LoadingField />
            ) : (
              <Input
                id="direccion"
                {...(isEditing
                  ? updateForm.register("direccion")
                  : createForm.register("direccion"))}
                placeholder="Dirección (opcional)"
                disabled={isLoadingEdit || isSaving}
              />
            )}
          </div>
        </div>
      </div>

      {/* Fecha de ingreso */}
      <div>
        <Label htmlFor="fecha_ingreso">Fecha de Ingreso *</Label>
        {isLoadingEdit ? (
          <LoadingField />
        ) : (
          <>
            <Input
              id="fecha_ingreso"
              type="date"
              {...(isEditing
                ? updateForm.register("fecha_ingreso")
                : createForm.register("fecha_ingreso"))}
              disabled={isLoadingEdit || isSaving}
            />
            {currentForm.formState.errors.fecha_ingreso && (
              <p className="text-xs text-red-500 mt-1">
                {currentForm.formState.errors.fecha_ingreso.message}
              </p>
            )}
          </>
        )}
      </div>

      {/* Responsabilidades */}
      <div>
        <h3 className="text-sm font-semibold mb-3">Responsabilidades</h3>
        <div className="flex flex-col gap-3">
          <Controller
            name="responsable_ventas"
            control={currentForm.control as any}
            render={({ field }) => (
              <div className="flex items-center gap-2">
                <Checkbox
                  id="responsable_ventas"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  disabled={isLoadingEdit || isSaving}
                />
                <Label
                  htmlFor="responsable_ventas"
                  className="cursor-pointer font-normal"
                >
                  Responsable de Ventas
                </Label>
              </div>
            )}
          />
          <Controller
            name="responsable_compras"
            control={currentForm.control as any}
            render={({ field }) => (
              <div className="flex items-center gap-2">
                <Checkbox
                  id="responsable_compras"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  disabled={isLoadingEdit || isSaving}
                />
                <Label
                  htmlFor="responsable_compras"
                  className="cursor-pointer font-normal"
                >
                  Responsable de Compras
                </Label>
              </div>
            )}
          />
        </div>
      </div>

      {/* Botones */}
      <div className="flex justify-end gap-2 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => onSuccess()}
          disabled={isLoadingEdit || isSaving}
        >
          Cancelar
        </Button>
        <ProtectedAction
          permission={isEditing ? "emp-edit" : "emp-create"}
          roles={["Super Admin", "Administrador"]}
          fallback={
            <Button type="submit" disabled>
              {isEditing ? "Actualizar" : "Crear"}
            </Button>
          }
        >
          <Button type="submit" disabled={isLoadingEdit || isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Procesando...
              </>
            ) : (
              <>
                <Save className="size-4" />
                {isEditing ? "Actualizar" : "Crear"}
              </>
            )}
          </Button>
        </ProtectedAction>
      </div>
    </form>
  );
};

// ─── Shell del Dialog ─────────────────────────────────────────────────────────
const EmployeeFormDialog: React.FC<EmployeeFormDialogProps> = ({
  isOpen,
  onOpenChange,
  triggerButton,
  isEditing = false,
  editingId,
}) => {
  const handleDialogToggle = useCallback(
    (open: boolean) => onOpenChange(open),
    [onOpenChange]
  );

  const formKey = isOpen
    ? isEditing
      ? `edit-${editingId}`
      : "create"
    : "closed";

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogToggle}>
      <ProtectedAction
        permission="emp-create"
        roles={["Super Admin", "Administrador"]}
        fallback={
          <Button disabled className="flex items-center gap-2">
            <Plus className="size-4" />
            Agregar Responsable
          </Button>
        }
      >
        <DialogTrigger asChild>
          {triggerButton || (
            <Button className="flex items-center gap-2">
              <Plus className="size-4" />
              Agregar Responsable
            </Button>
          )}
        </DialogTrigger>
      </ProtectedAction>

      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar" : "Agregar"} Responsable
            {isEditing && editingId && (
              <span className="ml-2">#{editingId}</span>
            )}
          </DialogTitle>
          <DialogDescription>
            {isEditing ? "Modifica los datos del" : "Agrega un nuevo"}{" "}
            Responsable
          </DialogDescription>
        </DialogHeader>

        <EmployeeFormInner
          key={formKey}
          isEditing={isEditing}
          editingId={editingId}
          onSuccess={() => handleDialogToggle(false)}
        />
      </DialogContent>
    </Dialog>
  );
};

export default EmployeeFormDialog;
