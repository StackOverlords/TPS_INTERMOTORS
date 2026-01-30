import { Package } from "lucide-react";
interface NoDataProps {
    message?: string
    description?: string
}
const NoDataComponent: React.FC<NoDataProps> = ({
    message = "No se encontraron datos",
    description = "Actualmente no hay datos disponibles para mostrar."
}) => {
    return (
        <article className="flex flex-col items-center justify-center space-y-6 px-12 py-16 mx-auto bg-muted rounded-3xl border border-border">
            <div className="p-3 rounded-full bg-muted-foreground/10">
                <Package className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="space-y-3 text-center">
                <h3 className="text-lg font-semibold text-foreground">
                    {message}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                    {description}
                </p>
            </div>
        </article>
    );
}

export default NoDataComponent;