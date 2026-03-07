import { Badge } from "@/components/atoms/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/atoms/card";
import { Label } from "@/components/atoms/label";
import { formatCell } from "@/utils/formatCell";
import { formatCurrency } from "@/utils/formaters";
import type { PurchaseDetail } from "../../types/PurchaseDetail";

interface PurchaseOverviewProps {
  purchase: PurchaseDetail | undefined;
  isLoading: boolean;
  isError: boolean;
}

const PurchaseOverview: React.FC<PurchaseOverviewProps> = ({
  purchase,
  isLoading,
  isError,
}) => {
  if (isLoading) {
    return (
      <div className="animate-pulse space-y-2">
        <div className="h-6 bg-muted rounded w-1/4"></div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="h-16 bg-muted rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (isError || !purchase) {
    return (
      <div className="text-center text-muted-foreground py-8">
        Error al cargar los datos de la compra
      </div>
    );
  }

  const formatDateShort = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("es-ES");
    } catch {
      return formatCell(dateString);
    }
  };

  const getContextColor = (tipo: string) => {
    if (tipo === "C") return "warning"; // Credito
    if (tipo === "P") return "success"; // Pagado
    return "secondary";
  };

  const getFormaCompraLabel = (forma: string) => {
    // if (forma === "MN") return "Moneda Nacional"
    // if (forma === "ME") return "Moneda Extranjera"
    if (forma === "MN") return "MN";
    if (forma === "ME") return "ME";
    return forma;
  };

  const getTipoCompraLabel = (tipo: string) => {
    if (tipo === "C") return "Crédito";
    if (tipo === "P") return "Contado";
    return tipo;
  };

  // Calcular el total de la compra
  const totalCompra = purchase.detalles.reduce((total, detalle) => {
    return total + parseFloat(detalle.costo) * parseFloat(detalle.cantidad);
  }, 0);

  return (
    <Card className="bg-background border border-border shadow-none flex-shrink-0">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold text-foreground">
          Información General
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
          {/* Fecha */}
          <div>
            <Label className="text-xs text-muted-foreground">Fecha</Label>
            <p className="text-sm font-medium">
              {formatDateShort(purchase.fecha)}
            </p>
          </div>

          {/* Total */}
          <div>
            <Label className="text-xs text-muted-foreground">Total</Label>
            <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
              {formatCurrency(totalCompra)}
            </p>
          </div>

          {/* Tipo de Compra */}
          <div>
            <Label className="text-xs text-muted-foreground">
              Tipo de Compra
            </Label>
            <br />
            <Badge
              variant={getContextColor(purchase.tipo_compra)}
              className="rounded w-max"
            >
              {getTipoCompraLabel(purchase.tipo_compra)}
            </Badge>
          </div>

          {/* Forma de Compra */}
          <div>
            <Label className="text-xs text-muted-foreground">
              Forma de Compra
            </Label>
            <br />
            <Badge variant="secondary" className="rounded w-max">
              {getFormaCompraLabel(purchase.forma_compra || "")}
            </Badge>
          </div>

          {/* Proveedor */}
          <div>
            <Label className="text-xs text-muted-foreground">Proveedor</Label>
            <p className="text-sm font-medium">
              {purchase.proveedor.proveedor}
            </p>
          </div>

          {/* NIT Proveedor */}
          {purchase.proveedor.nit && (
            <div>
              <Label className="text-xs text-muted-foreground">NIT</Label>
              <p className="text-sm font-medium">{purchase.proveedor.nit}</p>
            </div>
          )}

          {/* Contacto Proveedor */}
          {purchase.proveedor.contacto && (
            <div>
              <Label className="text-xs text-muted-foreground">Contacto</Label>
              <p className="text-sm font-medium">
                {purchase.proveedor.contacto}
              </p>
            </div>
          )}

          {/* Responsable */}
          {purchase.responsable && (
            <div>
              <Label className="text-xs text-muted-foreground">
                Responsable
              </Label>
              <p className="text-sm font-medium">
                {purchase.responsable.nombre}{" "}
                {purchase.responsable.apellido_paterno}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default PurchaseOverview;
