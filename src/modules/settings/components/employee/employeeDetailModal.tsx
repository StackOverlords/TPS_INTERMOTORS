import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/atoms/dialog";
import { Badge } from "@/components/atoms/badge";
import {
  CalendarDays,
  MapPin,
  Phone,
  Smartphone,
  CreditCard,
  ShoppingCart,
  Package,
  Users,
  X,
  Clock,
} from "lucide-react";
import { Button } from "@/components/atoms/button";
import { useGetEmployeeById } from "../../hooks/employee/useGetEmployeeById";
import { parseDateForUi, getUserTimezone } from "@/utils/dateFormatters";
import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";

// Cubre null | undefined | "" | "   "
const hasValue = (v: string | null | undefined): v is string =>
  v != null && v.trim() !== "";

const EmptyText = () => (
  <span className="text-muted-foreground/60 italic text-sm">
    Sin información
  </span>
);

interface EmployeeDetailModalProps {
  employeeId: number | null;
  isOpen: boolean;
  onClose: () => void;
}

const EmployeeDetailModal: React.FC<EmployeeDetailModalProps> = ({
  employeeId,
  isOpen,
  onClose,
}) => {
  const { data: employee, isLoading } = useGetEmployeeById(employeeId || 0);

  const persona = employee?.persona;

  const fullName = persona
    ? [persona.nombre, persona.apellido_paterno, persona.apellido_materno]
        .filter(hasValue)
        .join(" ")
    : "";

  const dniDisplay = persona
    ? [
        hasValue(persona.dni_tipo) ? persona.dni_tipo : null,
        persona.dni != null ? String(persona.dni) : null,
        hasValue(persona.dni_comp) ? `- ${persona.dni_comp}` : null,
      ]
        .filter(Boolean)
        .join(" ")
    : null;

  // Separa fecha y hora del campo fecha_ingreso que viene del backend
  const fechaIngreso = hasValue(employee?.fecha_ingreso)
    ? parseDateForUi(employee!.fecha_ingreso)
    : null;

  const horaIngreso = hasValue(employee?.fecha_ingreso)
    ? (() => {
        const tz = getUserTimezone();
        const zoned = toZonedTime(new Date(employee!.fecha_ingreso), tz);
        return format(zoned, "HH:mm:ss");
      })()
    : null;

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        className="sm:max-w-xl p-0 overflow-hidden max-h-[90vh] flex flex-col"
        showCloseButton={false}
      >
        {/* Header con color de fondo según estado */}
        <div
          className={`px-6 pt-6 pb-4 ${
            employee && !employee.activo
              ? "bg-muted/60"
              : "bg-primary/5 dark:bg-primary/10"
          }`}
        >
          <DialogHeader>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                {/* Avatar con inicial */}
                <div
                  className={`size-12 rounded-full flex items-center justify-center text-lg font-bold flex-shrink-0 ${
                    employee && !employee.activo
                      ? "bg-muted text-muted-foreground"
                      : "bg-primary/15 text-primary"
                  }`}
                >
                  {isLoading || !fullName
                    ? "?"
                    : fullName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <DialogTitle className="text-base leading-tight">
                    {isLoading ? (
                      <div className="h-4 w-36 rounded animate-pulse bg-muted" />
                    ) : (
                      fullName || "Sin nombre"
                    )}
                  </DialogTitle>
                  {isLoading ? (
                    <div className="h-3 w-20 rounded animate-pulse bg-muted mt-1" />
                  ) : (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {employee?.persona.correo}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Badge variant={"outline"} className="flex-shrink-0">
                  #{employeeId}
                </Badge>
                {!isLoading && employee && (
                  <Badge
                    variant={employee.activo ? "success" : "danger"}
                    className="flex-shrink-0"
                  >
                    {employee.activo ? "Activo" : "Inactivo"}
                  </Badge>
                )}
                <Button variant="ghost" className="w-8" onClick={onClose}>
                  <X className="size-4" />
                </Button>
              </div>
            </div>
          </DialogHeader>
        </div>

        {/* Cuerpo scrolleable */}
        <div className="overflow-y-auto flex-1 px-6 pb-6 pt-4 space-y-5">
          {isLoading || !employee ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, s) => (
                <div key={s} className="space-y-2">
                  <div className="h-3 w-24 rounded animate-pulse bg-muted" />
                  <div className="grid grid-cols-2 gap-3">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div
                        key={i}
                        className="h-14 rounded-lg animate-pulse bg-muted"
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <>
              {/* ── Identificación ─────────────────────────────────── */}
              <section>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Información
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <InfoTile
                    icon={CreditCard}
                    label="Documento"
                    value={hasValue(dniDisplay) ? dniDisplay : null}
                  />
                  <InfoTile
                    icon={CalendarDays}
                    label="Fecha de ingreso"
                    value={fechaIngreso}
                  />
                  <InfoTile
                    icon={Users}
                    label="Sexo"
                    value={
                      hasValue(persona?.sexo)
                        ? persona!.sexo === "M"
                          ? "Masculino"
                          : persona!.sexo === "F"
                            ? "Femenino"
                            : persona!.sexo === "/"
                              ? "Sin especificar"
                              : persona!.sexo
                        : null
                    }
                  />
                  <InfoTile
                    icon={Clock}
                    label="Hora de registro"
                    value={horaIngreso}
                  />
                </div>
              </section>

              {/* ── Contacto ───────────────────────────────────────── */}
              <section>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Contacto
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <InfoTile
                    icon={Smartphone}
                    label="Celular"
                    value={hasValue(persona?.celular) ? persona!.celular : null}
                  />
                  <InfoTile
                    icon={Phone}
                    label="Teléfono"
                    value={
                      hasValue(persona?.telefono) ? persona!.telefono : null
                    }
                  />
                  <div className="col-span-2">
                    <InfoTile
                      icon={MapPin}
                      label="Dirección"
                      value={
                        hasValue(persona?.direccion) ? persona!.direccion : null
                      }
                    />
                  </div>
                </div>
              </section>

              {/* ── Responsabilidades ──────────────────────────────── */}
              <section>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Responsabilidades
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <ResponsabilityTile
                    icon={ShoppingCart}
                    label="Ventas"
                    active={employee.responsable_ventas ?? false}
                  />
                  <ResponsabilityTile
                    icon={Package}
                    label="Compras"
                    active={employee.responsable_compras ?? false}
                  />
                </div>
              </section>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

// ── Sub-componentes ────────────────────────────────────────────────────────────

const InfoTile = ({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string | null | undefined;
}) => (
  <div className="rounded-lg border border-border bg-muted/30 px-3 py-2.5 flex flex-col gap-1 min-w-0">
    <div className="flex items-center gap-1.5">
      <Icon className="size-3 text-muted-foreground flex-shrink-0" />
      <span className="text-xs text-muted-foreground truncate">{label}</span>
    </div>
    <span className="text-sm font-medium leading-snug break-words">
      {hasValue(value) ? value : <EmptyText />}
    </span>
  </div>
);

const ResponsabilityTile = ({
  icon: Icon,
  label,
  active,
}: {
  icon: React.ElementType;
  label: string;
  active: boolean;
}) => (
  <div
    className={`rounded-lg border px-3 py-2.5 flex items-center gap-2.5 transition-colors ${
      active
        ? "border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/40"
        : "border-border bg-muted/20"
    }`}
  >
    <div
      className={`size-7 rounded-full flex items-center justify-center flex-shrink-0 ${
        active ? "bg-emerald-100 dark:bg-emerald-900/60" : "bg-muted"
      }`}
    >
      <Icon
        className={`size-3.5 ${
          active
            ? "text-emerald-600 dark:text-emerald-400"
            : "text-muted-foreground"
        }`}
      />
    </div>
    <div>
      <p className="text-xs text-muted-foreground leading-none mb-0.5">
        {label}
      </p>
      <p
        className={`text-sm font-medium leading-none ${
          active
            ? "text-emerald-700 dark:text-emerald-300"
            : "text-muted-foreground"
        }`}
      >
        {active ? "Responsable" : "No asignado"}
      </p>
    </div>
  </div>
);

export default EmployeeDetailModal;
