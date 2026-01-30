import { Skeleton } from "@/components/atoms/skeleton"
import { Package, Wand2 } from "lucide-react"

const ProductEditSkeleton = () => {
    return (
        <main>
            <div className="space-y-3">
                {/* Header */}
                <header className="border-border border bg-card rounded-lg p-2 sm:p-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Skeleton className="h-8 w-8 rounded-lg" />
                            <div className="space-y-2">
                                <Skeleton className="h-5 w-40" />
                                <Skeleton className="h-4 w-28" />
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Skeleton className="h-8 w-20 rounded-lg" />
                            <Skeleton className="h-8 w-32 rounded-lg" />
                        </div>
                    </div>
                </header>

                {/* Información principal */}
                <section className="p-3 bg-white border border-gray-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-3">
                        <Package className="w-4 h-4 text-gray-400" />
                        <Skeleton className="h-4 w-40" />
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="space-y-2">
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-8 w-full rounded-md" />
                            </div>
                        ))}
                    </div>
                </section>

                {/* Especificaciones del vehículo */}
                <section className="p-3 bg-white border border-gray-200 rounded-lg">
                    <Skeleton className="h-4 w-40 mb-3" />
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="space-y-2">
                                <Skeleton className="h-4 w-28" />
                                <Skeleton className="h-8 w-full rounded-md" />
                            </div>
                        ))}
                    </div>
                </section>

                {/* Descripción Auto-generada */}
                <section className="p-3 bg-white border border-gray-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                        <Wand2 className="w-4 h-4 text-gray-400" />
                        <Skeleton className="h-4 w-40" />
                    </div>
                    <Skeleton className="h-10 w-full rounded-md" />
                </section>

                {/* Información adicional */}
                <section className="p-3 bg-white border border-gray-200 rounded-lg">
                    <Skeleton className="h-4 w-40 mb-3" />
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="space-y-2">
                                <Skeleton className="h-4 w-28" />
                                <Skeleton className="h-8 w-full rounded-md" />
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </main>
    )
}

export default ProductEditSkeleton
