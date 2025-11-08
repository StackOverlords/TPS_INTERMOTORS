import { Badge } from "@/components/atoms/badge";
import { ArrowLeftRight, ArrowRight, ArrowLeft } from "lucide-react";

interface TransferStatusBadgeProps {
    estado: string;
}

/**
 * Componente que muestra el estado de una transferencia con icono y color
 *
 * Tipos de transferencia:
 * - => : Transferencia de sucursal base (origen) hacia otro destino
 * - <= : Transferencia que llega de otro destino a la sucursal base
 * - <=> : Transferencia entre dos sucursales diferentes a la sucursal base
 *
 * Estados posibles:
 * - TRANSFERIDO => : Producto enviado desde sucursal base
 * - RECEPCIONADO <= : Producto recibido en sucursal base
 * - TRANSFERIDO <=> : Transferencia entre otras sucursales (solo visualización)
 */
const TransferStatusBadge: React.FC<TransferStatusBadgeProps> = ({ estado }) => {
    // Extraer el tipo de transferencia y el estado
    const getTransferInfo = (estado: string) => {
        // Normalizar el estado para quitar espacios extras
        const normalizedEstado = estado.trim();

        // Detectar el tipo de transferencia
        if (normalizedEstado.includes('<=>')) {
            const estadoText = normalizedEstado.replace('<=>', '').trim();
            return {
                type: '<=>',
                status: estadoText,
                icon: ArrowLeftRight,
                color: 'text-purple-600',
                bgColor: 'bg-purple-50',
                borderColor: 'border-purple-200',
                description: 'Entre otras sucursales'
            };
        } else if (normalizedEstado.includes('=>')) {
            const estadoText = normalizedEstado.replace('=>', '').trim();
            return {
                type: '=>',
                status: estadoText,
                icon: ArrowRight,
                color: 'text-blue-600',
                bgColor: 'bg-blue-50',
                borderColor: 'border-blue-200',
                description: 'Enviado desde esta sucursal'
            };
        } else if (normalizedEstado.includes('<=')) {
            const estadoText = normalizedEstado.replace('<=', '').trim();
            return {
                type: '<=',
                status: estadoText,
                icon: ArrowLeft,
                color: 'text-green-600',
                bgColor: 'bg-green-50',
                borderColor: 'border-green-200',
                description: 'Recibido en esta sucursal'
            };
        }

        // Estado sin tipo de transferencia (fallback)
        return {
            type: '',
            status: normalizedEstado,
            icon: ArrowLeftRight,
            color: 'text-gray-600',
            bgColor: 'bg-gray-50',
            borderColor: 'border-gray-200',
            description: 'Estado desconocido'
        };
    };

    const transferInfo = getTransferInfo(estado);
    const Icon = transferInfo.icon;

    // Determinar el color del badge según el estado
    const getStatusColor = (status: string) => {
        const upperStatus = status.toUpperCase();

        if (upperStatus.includes('RECEPCIONADO') || upperStatus.includes('RECIBIDO') || upperStatus.includes('RECIBIDA')) {
            return 'success';
        } else if (upperStatus.includes('RECHAZADO') || upperStatus.includes('RECHAZADA') || upperStatus.includes('CANCELADO')) {
            return 'destructive';
        } else if (upperStatus.includes('TRANSFERIDO') || upperStatus.includes('ENVIADO') || upperStatus.includes('PENDIENTE')) {
            return 'warning';
        }

        return 'default';
    };

    const badgeVariant = getStatusColor(transferInfo.status);

    return (
        <div className="flex flex-col gap-1.5">
            {/* Badge del estado */}
            <Badge variant={badgeVariant} className="text-xs w-max flex items-center gap-1.5">
                <Icon className="size-3" />
                {transferInfo.status}
            </Badge>

            {/* Indicador del tipo de transferencia */}
            {transferInfo.type && (
                <div
                    className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-medium w-max border ${transferInfo.bgColor} ${transferInfo.color} ${transferInfo.borderColor}`}
                    title={transferInfo.description}
                >
                    <span className="font-bold">{transferInfo.type}</span>
                    <span className="text-[9px] opacity-80">{transferInfo.description}</span>
                </div>
            )}
        </div>
    );
};

export default TransferStatusBadge;
