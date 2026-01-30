import {
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  Circle,
} from "lucide-react";

interface TransferStatusBadgeProps {
  estado: string;
}

/**
 * Componente que muestra el estado de una transferencia de forma clara y minimalista
 *
 * Formato del estado desde el backend: "ESTADO <=> DIRECCION"
 * Ejemplos:
 * - "TRANSFERIDO => SUCURSAL DESTINO"
 * - "POR TRANSFERIR <=> PENDIENTE"
 * - "RECEPCIONADO <= SUCURSAL ORIGEN"
 */
const TransferStatusBadge: React.FC<TransferStatusBadgeProps> = ({
  estado,
}) => {
  // Parsear el estado para extraer la información relevante
  const parseEstado = (estado: string) => {
    const normalizedEstado = estado.trim();

    // Detectar dirección y extraer el estado principal
    let direccion: "salida" | "entrada" | "entre" | "ninguna" = "ninguna";
    let estadoPrincipal = normalizedEstado;

    if (normalizedEstado.includes("<=>")) {
      direccion = "entre";
      estadoPrincipal = normalizedEstado.split("<=>")[0].trim();
    } else if (normalizedEstado.includes("=>")) {
      direccion = "salida";
      estadoPrincipal = normalizedEstado.split("=>")[0].trim();
    } else if (normalizedEstado.includes("<=")) {
      direccion = "entrada";
      estadoPrincipal = normalizedEstado.split("<=")[0].trim();
    }

    // Determinar el icono y estilo según la dirección
    let Icon = Circle;
    let iconColor = "text-muted-foreground/50";
    let textoDireccion = "";

    if (direccion === "salida") {
      Icon = ArrowUpRight;
      iconColor = "text-blue-500 dark:text-blue-400";
      textoDireccion = "Salida";
    } else if (direccion === "entrada") {
      Icon = ArrowDownLeft;
      iconColor = "text-emerald-500 dark:text-emerald-400";
      textoDireccion = "Entrada";
    } else if (direccion === "entre") {
      Icon = ArrowLeftRight;
      iconColor = "text-purple-500 dark:text-purple-400";
      textoDireccion = "Entre sucursales";
    }

    // Determinar el color del texto según el estado
    let estadoColor = "text-foreground";
    const upperEstado = estadoPrincipal.toUpperCase();

    if (
      upperEstado.includes("RECEPCIONADO") ||
      upperEstado.includes("RECIBIDO")
    ) {
      estadoColor = "text-emerald-700 dark:text-emerald-400 font-semibold";
    } else if (
      upperEstado.includes("TRANSFERIDO") ||
      upperEstado.includes("ENVIADO")
    ) {
      estadoColor = "text-blue-700 dark:text-blue-400 font-semibold";
    } else if (
      upperEstado.includes("PENDIENTE") ||
      upperEstado.includes("POR")
    ) {
      estadoColor = "text-amber-700 dark:text-amber-400 font-medium";
    } else if (
      upperEstado.includes("CANCELADO") ||
      upperEstado.includes("RECHAZADO")
    ) {
      estadoColor = "text-destructive font-semibold";
    } else if (
      upperEstado.includes("SIN RECEPCIONAR") ||
      upperEstado.includes("SIN RECIBIR")
    ) {
      estadoColor = "text-purple-500 dark:text-purple-400 font-semibold";
    }

    return {
      estadoPrincipal,
      Icon,
      iconColor,
      estadoColor,
      textoDireccion,
      direccion,
    };
  };

  const info = parseEstado(estado);
  const Icon = info.Icon;

  return (
    <div className="flex items-center gap-2">
      {/* Icono de dirección */}
      <div className={`${info.iconColor} shrink-0`} title={info.textoDireccion}>
        <Icon className="size-4" />
      </div>

      {/* Estado principal */}
      <div className="flex flex-col">
        <span className={`text-sm ${info.estadoColor}`}>
          {info.estadoPrincipal}
        </span>
        {/* Texto de dirección sutil solo si es relevante */}
        {info.direccion !== "ninguna" && (
          <span className="text-xs text-muted-foreground">
            {info.textoDireccion}
          </span>
        )}
      </div>
    </div>
  );
};

export default TransferStatusBadge;
