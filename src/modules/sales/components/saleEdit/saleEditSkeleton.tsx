import { Card, CardContent, CardHeader } from "@/components/atoms/card";
import { Skeleton } from "@/components/atoms/skeleton";

const SaleEditSkeleton = () => {
  return (
    <main className="flex flex-col items-center ps-2">
      <div className="w-full space-y-2">
        {/* Header */}
        <header className="border-border border bg-background rounded-lg p-4 sm:p-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-lg" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-28" />
            </div>
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-9 w-20 rounded-lg" />
            <Skeleton className="h-9 w-32 rounded-lg" />
          </div>
        </header>

        {/* Formulario de datos */}
        <Card className="border-border shadow-none pt-4">
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-10 w-full rounded-lg" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Tabla de productos */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-4">
            <Skeleton className="h-9 w-40 rounded-lg" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <Skeleton className="h-10 w-10 rounded-lg" />
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-6 w-20" />
                  <Skeleton className="h-6 w-20" />
                  <Skeleton className="h-6 w-16" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Totales */}
        <Card className="border-0 shadow-sm pt-6">
          <CardContent>
            <div className="grid md:grid-cols-2 gap-3">
              <section className="space-y-2 bg-accent/30 p-3 rounded-lg">
                <Skeleton className="h-5 w-24" />
                <div className="grid grid-cols-2 gap-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <div className="flex gap-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-7 w-12 rounded-lg" />
                  ))}
                </div>
              </section>
              <section className="space-y-2 bg-accent/30 p-3 rounded-lg">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-12 w-full rounded-lg" />
              </section>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
};

export default SaleEditSkeleton;
