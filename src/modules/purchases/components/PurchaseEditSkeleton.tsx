import { Card, CardContent, CardHeader } from "@/components/atoms/card";
import { Skeleton } from "@/components/atoms/skeleton";

const PurchaseEditSkeleton = () => {
  return (
    <main className="p-2 h-full">
      <div className="h-full flex flex-col gap-2">
        {/* Header Skeleton */}
        <header className="border-border flex-shrink-0 border bg-background rounded-lg p-2 sm:px-3">
          <div className="flex flex-wrap gap-2 items-center justify-between">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-md" />
              <div className="space-y-2">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
          </div>
        </header>

        <div className="gap-2 flex-1 min-h-0">
          <div className="h-full flex flex-col gap-2">
            {/* Form Skeleton */}
            <Card className="flex-shrink-0">
              <CardContent className="p-3">
                <div className="flex items-center justify-between mb-3">
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-8 w-8 rounded-md" />
                </div>

                <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7">
                  {Array.from({ length: 7 }).map((_, i) => (
                    <div key={i} className="space-y-2">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                  ))}
                </div>

                <div className="mt-3 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-20 w-full" />
                </div>
              </CardContent>
            </Card>

            {/* Table Skeleton */}
            <Card className="flex-1 min-h-0">
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <Skeleton className="h-6 w-48" />
                  <div className="flex gap-2">
                    <Skeleton className="h-10 w-32" />
                    <Skeleton className="h-10 w-32" />
                    <Skeleton className="h-10 w-40" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Footer Skeleton */}
            <Card>
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-32" />
                  <div className="flex gap-2">
                    <Skeleton className="h-10 w-24" />
                    <Skeleton className="h-10 w-32" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
};

export default PurchaseEditSkeleton;
