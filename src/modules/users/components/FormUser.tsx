import { Input } from "@/components/atoms/input";
import { Label } from "@/components/atoms/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/atoms/select";
import PopoverDatePicker from "@/components/common/PopoverDatePicker";
import ShortcutKey from "@/components/common/ShortcutKey";
import TooltipButton from "@/components/common/TooltipButton";
import { TooltipWrapper } from "@/components/common/TooltipWrapper";
import { showSuccessToast } from "@/hooks/use-toast-enhanced";
import { useErrorHandler } from "@/hooks/useErrorHandler";
import { useFormEnterNavigation } from "@/hooks/useFormEnterNavigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { HelpCircle, Loader2, Save, UserPlus } from "lucide-react";
import { useRef } from "react";
import { Controller, useForm } from "react-hook-form";
import { useHotkeys } from "react-hotkeys-hook";
import { useNavigate } from "react-router";
import { useCreateUser } from "../hooks/mutations/useCreateUser";
import { useUpdateUser } from "../hooks/mutations/useUpdateUser";
import {
  DNI_TIPO_VALUES,
  SEXO_VALUES,
  UserCreateSchema,
} from "../schemas/userCreate.schema";
import { UserUpdateSchema } from "../schemas/userUpdate.schema";
import type { UserCreate } from "../types/UserCreate.types";
import type { UserUpdate } from "../types/UserUpdate.types";

interface FormUserProps {
  mode: "create" | "edit";
  userId?: number;
  defaultValues?: Partial<UserUpdate>;
}

const FormUser: React.FC<FormUserProps> = ({ mode, userId, defaultValues }) => {
  const navigate = useNavigate();
  const { handleError } = useErrorHandler();
  const isCreateMode = mode === "create";

  const {
    control,
    handleSubmit,
    reset,
    register,
    formState: { errors, isSubmitting },
  } = useForm<UserCreate | UserUpdate>({
    resolver: zodResolver(isCreateMode ? UserCreateSchema : UserUpdateSchema),
    defaultValues: isCreateMode
      ? {
          nombre: "",
          apellido_p: "",
          apellido_m: "",
          sexo: "M",
          dni: 0,
          dni_comp: "",
          dni_tipo: "DNI",
          telefono: "",
          celular: "",
          direccion: "",
          fecha_ingreso: "",
          email: "",
          nombre_usuario: "",
          clave_acceso: "",
          clave_acceso_confirmation: "",
        }
      : {
          ...defaultValues,
        },
    mode: "onChange",
  });

  const { mutate: handleCreateUser, isPending: isCreating } = useCreateUser();
  const { mutate: handleUpdateUser, isPending: isUpdating } = useUpdateUser();

  const isPending = isCreating || isUpdating;

  const onSubmit = (data: UserCreate | UserUpdate) => {
    if (isCreateMode) {
      handleCreateUser(data as UserCreate, {
        onSuccess: (res) => {
          showSuccessToast({
            title: "Usuario creado",
            description: `Usuario ${res.nickname} creado exitosamente. ID: #${res.id}`,
            duration: 5000,
          });
          reset();
          navigate("/dashboard/user");
        },
        onError: (error: unknown) => {
          handleError({ error, customTitle: "No se pudo crear el usuario" });
        },
      });
    } else {
      if (!userId) return;
      handleUpdateUser(
        { id: userId, data: data as UserUpdate },
        {
          onSuccess: (res) => {
            showSuccessToast({
              title: "Usuario actualizado",
              description: `Usuario ${res.nickname} actualizado exitosamente.`,
              duration: 5000,
            });
            // alert(JSON.stringify(res));
            navigate(`/dashboard/user/${res.nickname}`);
          },
          onError: (error: unknown) => {
            handleError({
              error,
              customTitle: "No se pudo actualizar el usuario",
            });
          },
        }
      );
    }
  };

  const getInputClassName = (fieldName: string): string => {
    const baseClass = "";
    const hasError = errors[fieldName as keyof (UserCreate | UserUpdate)];
    return hasError
      ? `${baseClass} border-destructive focus:border-destructive focus:ring-destructive`
      : baseClass;
  };

  // Shortcuts
  useHotkeys("alt+s", (e) => {
    e.preventDefault();
    const submitButton = document.querySelector(
      'button[type="submit"]'
    ) as HTMLButtonElement;
    if (submitButton && !isPending && !isSubmitting) {
      submitButton.click();
    }
  });

  const refForm = useRef<HTMLFormElement>(null);
  useFormEnterNavigation({
    containerRef: refForm,
    submitOnLastField: false,
    excludeSelectors: [".popover-date-picker"],
  });

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="w-full space-y-2"
      ref={refForm}
    >
      {/* Información Personal */}
      <div className="p-3 bg-background border border-border rounded-lg">
        <div className="flex items-center justify-between mb-3">
          <h2 className="flex items-center gap-2 text-base font-bold text-foreground">
            <UserPlus className="w-4 h-4" />
            Información Personal
          </h2>
          <TooltipWrapper
            tooltipContentProps={{ align: "end", className: "max-w-xs" }}
            tooltip={
              <div className="flex flex-col space-y-3">
                <div className="text-sm font-semibold text-foreground border-b border-border pb-2">
                  Atajos de teclado
                </div>
                <div className="space-y-1.5">
                  <h4 className="text-xs font-medium text-foreground tracking-wide">
                    Navegación
                  </h4>
                  <div className="space-y-1 text-muted-foreground text-xs">
                    <p>
                      <ShortcutKey combo={"Tab"} /> Siguiente campo
                    </p>
                    <p>
                      <ShortcutKey combo={"Shift + Tab"} /> Campo anterior
                    </p>
                    <p>
                      <ShortcutKey combo={"Alt + S"} /> Guardar usuario
                    </p>
                  </div>
                </div>
              </div>
            }
          >
            <span className="border-border border h-8 w-8 px-1 rounded-md flex items-center justify-center cursor-help hover:bg-accent">
              <HelpCircle className="w-4 h-4" />
            </span>
          </TooltipWrapper>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {/* Nombre */}
          <div>
            <Label>Nombre *</Label>
            <Input
              {...register("nombre")}
              placeholder="Nombre"
              className={getInputClassName("nombre")}
            />
            <div className="mt-1">
              {errors.nombre && (
                <p className="text-xs text-destructive truncate">
                  {errors.nombre.message}
                </p>
              )}
            </div>
          </div>

          {/* Apellido Paterno */}
          <div>
            <Label>Apellido Paterno *</Label>
            <Input
              {...register("apellido_p")}
              placeholder="Apellido Paterno"
              className={getInputClassName("apellido_p")}
            />
            <div className="mt-1">
              {errors.apellido_p && (
                <p className="text-xs text-destructive truncate">
                  {errors.apellido_p.message}
                </p>
              )}
            </div>
          </div>

          {/* Apellido Materno */}
          <div>
            <Label>Apellido Materno</Label>
            <Input
              {...register("apellido_m")}
              placeholder="Apellido Materno (Opcional)"
              className={getInputClassName("apellido_m")}
            />
            <div className="mt-1">
              {errors.apellido_m && (
                <p className="text-xs text-destructive truncate">
                  {errors.apellido_m.message}
                </p>
              )}
            </div>
          </div>

          {/* Sexo */}
          <div>
            <Label>Sexo *</Label>
            <Controller
              name="sexo"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger className={getInputClassName("sexo")}>
                    <SelectValue placeholder="Seleccionar sexo" />
                  </SelectTrigger>
                  <SelectContent>
                    {SEXO_VALUES.map((sexo) => (
                      <SelectItem key={sexo} value={sexo}>
                        {sexo === "M" ? "Masculino" : "Femenino"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            <div className="mt-1">
              {errors.sexo && (
                <p className="text-xs text-destructive truncate">
                  {errors.sexo.message}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Documentación */}
      <div className="p-3 bg-background border border-border rounded-lg">
        <h2 className="text-base font-bold text-foreground mb-3">
          Documentación
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {/* DNI */}
          <div>
            <Label>DNI *</Label>
            <Controller
              name="dni"
              control={control}
              render={({ field }) => (
                <Input
                  type="number"
                  autoSelectOnFocus={true}
                  {...field}
                  onChange={(e) =>
                    field.onChange(parseInt(e.target.value) || 0)
                  }
                  placeholder="12345678"
                  className={getInputClassName("dni")}
                />
              )}
            />
            <div className="mt-1">
              {errors.dni && (
                <p className="text-xs text-destructive truncate">
                  {errors.dni.message}
                </p>
              )}
            </div>
          </div>

          {/* Tipo DNI */}
          <div>
            <Label>Tipo DNI *</Label>
            <Controller
              name="dni_tipo"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger className={getInputClassName("dni_tipo")}>
                    <SelectValue placeholder="Tipo de DNI" />
                  </SelectTrigger>
                  <SelectContent>
                    {DNI_TIPO_VALUES.map((tipo) => (
                      <SelectItem key={tipo} value={tipo}>
                        {tipo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            <div className="mt-1">
              {errors.dni_tipo && (
                <p className="text-xs text-destructive truncate">
                  {errors.dni_tipo.message}
                </p>
              )}
            </div>
          </div>

          {/* DNI Complemento */}
          <div>
            <Label>Complemento DNI</Label>
            <Input
              {...register("dni_comp")}
              placeholder="Complemento (Opcional)"
              className={getInputClassName("dni_comp")}
            />
            <div className="mt-1">
              {errors.dni_comp && (
                <p className="text-xs text-destructive truncate">
                  {errors.dni_comp.message}
                </p>
              )}
            </div>
          </div>

          {/* Fecha Ingreso */}
          <div>
            <Label>Fecha de Ingreso</Label>
            <Controller
              name="fecha_ingreso"
              control={control}
              render={({ field }) => (
                <PopoverDatePicker
                  value={field.value ? new Date(field.value) : null}
                  onChange={(date) => {
                    if (date) {
                      const isoString = date.toISOString().split("T")[0];
                      field.onChange(isoString);
                    } else {
                      field.onChange("");
                    }
                  }}
                  placeholder="Seleccionar fecha"
                  hasError={errors.fecha_ingreso?.message}
                  className="popover-date-picker"
                />
              )}
            />
            <div className="mt-1">
              {errors.fecha_ingreso && (
                <p className="text-xs text-destructive truncate">
                  {errors.fecha_ingreso.message}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Información de Contacto */}
      <div className="p-3 bg-background border border-border rounded-lg">
        <h2 className="text-base font-bold text-foreground mb-3">
          Información de Contacto
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
          {/* Teléfono */}
          <div>
            <Label>Teléfono</Label>
            <Input
              {...register("telefono")}
              placeholder="Teléfono (Opcional)"
              className={getInputClassName("telefono")}
            />
            <div className="mt-1">
              {errors.telefono && (
                <p className="text-xs text-destructive truncate">
                  {errors.telefono.message}
                </p>
              )}
            </div>
          </div>

          {/* Celular */}
          <div>
            <Label>Celular</Label>
            <Input
              {...register("celular")}
              placeholder="Celular (Opcional)"
              className={getInputClassName("celular")}
            />
            <div className="mt-1">
              {errors.celular && (
                <p className="text-xs text-destructive truncate">
                  {errors.celular.message}
                </p>
              )}
            </div>
          </div>

          {/* Email */}
          <div>
            <Label>Email *</Label>
            <Input
              {...register("email")}
              type="email"
              placeholder="email@ejemplo.com"
              className={getInputClassName("email")}
            />
            <div className="mt-1">
              {errors.email && (
                <p className="text-xs text-destructive truncate">
                  {errors.email.message}
                </p>
              )}
            </div>
          </div>

          {/* Dirección */}
          <div className="sm:col-span-2 md:col-span-3">
            <Label>Dirección</Label>
            <Input
              {...register("direccion")}
              placeholder="Dirección completa (Opcional)"
              className={getInputClassName("direccion")}
            />
            <div className="mt-1">
              {errors.direccion && (
                <p className="text-xs text-destructive truncate">
                  {errors.direccion.message}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Credenciales de Acceso */}
      <div className="p-3 bg-background border border-border rounded-lg">
        <h2 className="text-base font-bold text-foreground mb-3">
          Credenciales de Acceso
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
          {/* Nombre de Usuario */}
          <div>
            <Label>Nombre de Usuario *</Label>
            <Input
              {...register("nombre_usuario")}
              placeholder="usuario123"
              className={getInputClassName("nombre_usuario")}
            />
            <div className="mt-1">
              {errors.nombre_usuario && (
                <p className="text-xs text-destructive truncate">
                  {errors.nombre_usuario.message}
                </p>
              )}
            </div>
          </div>

          {/* Contraseñas - Solo en modo creación */}
          {isCreateMode && (
            <>
              <div>
                <Label>Contraseña *</Label>
                <Input
                  {...register("clave_acceso" as any)}
                  type="password"
                  placeholder="Mínimo 8 caracteres"
                  className={getInputClassName("clave_acceso")}
                />
                <div className="mt-1">
                  {(errors as any).clave_acceso && (
                    <p className="text-xs text-destructive truncate">
                      {(errors as any).clave_acceso.message}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <Label>Confirmar Contraseña *</Label>
                <Input
                  {...register("clave_acceso_confirmation" as any)}
                  type="password"
                  placeholder="Repetir contraseña"
                  className={getInputClassName("clave_acceso_confirmation")}
                />
                <div className="mt-1">
                  {(errors as any).clave_acceso_confirmation && (
                    <p className="text-xs text-destructive truncate">
                      {(errors as any).clave_acceso_confirmation.message}
                    </p>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Botones de acción */}
      <div className="p-3 bg-background border border-border rounded-lg">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-xs text-muted-foreground">
            * Campos requeridos
          </span>
          <TooltipButton
            buttonProps={{
              type: "submit",
              disabled: isPending || isSubmitting,
              variant: "default",
              className: "w-full sm:w-auto",
            }}
            tooltip={
              <span className="flex items-center gap-1">
                {isCreateMode ? "Crear usuario" : "Actualizar usuario"}{" "}
                <ShortcutKey combo="alt+s" />
              </span>
            }
          >
            {isPending || isSubmitting ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="mr-2 size-4" />
                {isCreateMode ? "Crear Usuario" : "Actualizar Usuario"}
              </>
            )}
          </TooltipButton>
        </div>
      </div>
    </form>
  );
};

export default FormUser;
