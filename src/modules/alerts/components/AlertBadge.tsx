import { Badge } from "@/components/atoms/badge";
import type { Alert } from "../types/alert";

interface AlertBadgeProps {
    alert: Alert;
    className?: string;
}

/**
 * Badge de alerta individual.
 * - dias_restantes < 0  → "Vencida" (badge rojo)
 * - dias_restantes >= 0 → "Próx. {n} días" (badge amarillo)
 */
export const AlertBadge = ({ alert, className }: AlertBadgeProps) => {
    const isVencida = alert.dias_restantes < 0;

    return (
        <Badge
            variant={isVencida ? "danger" : "warning"}
            className={className}
        >
            {isVencida
                ? "Vencida"
                : `Próx. ${alert.dias_restantes} día${alert.dias_restantes !== 1 ? "s" : ""}`}
        </Badge>
    );
};

/**
 * Badge de conteo de alertas para la barra de navegación.
 * Muestra el número total de alertas no leídas.
 */
interface AlertCountBadgeProps {
    count: number;
    className?: string;
}

export const AlertCountBadge = ({ count, className }: AlertCountBadgeProps) => {
    if (count === 0) return null;
    return (
        <Badge variant="danger" className={className}>
            {count > 99 ? "99+" : count}
        </Badge>
    );
};
