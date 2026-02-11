import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/atoms/card";
import { Skeleton } from "@/components/atoms/skeleton";

const SaleDetailSkeleton = () => {
  return (
    <div className="h-full w-full flex flex-col p-2 items-center">
      <div className="max-w-7xl w-full space-y-2 justify-center">
        {/* Header */}
        <header className="border-border border bg-card rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <div>
                <Skeleton className="h-5 w-40 rounded" />
                <Skeleton className="h-4 w-28 mt-2 rounded" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-20 rounded-lg" />
              <Skeleton className="h-8 w-24 rounded-lg" />
            </div>
          </div>
        </header>

        {/* Información General */}
        <Card className="bg-card border border-border shadow-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Skeleton className="h-5 w-5 rounded" />
              <Skeleton className="h-5 w-40 rounded" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-24 rounded" />
                  <Skeleton className="h-5 w-32 rounded" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Cliente y Responsable */}
        <div className="grid md:grid-cols-2 gap-2">
          {[1, 2].map((i) => (
            <Card key={i} className="bg-card border border-border shadow-none">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Skeleton className="h-5 w-5 rounded" />
                  <Skeleton className="h-5 w-40 rounded" />
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Skeleton className="h-4 w-20 rounded" />
                  <Skeleton className="h-5 w-32 mt-1 rounded" />
                </div>
                <div>
                  <Skeleton className="h-4 w-20 rounded" />
                  <Skeleton className="h-5 w-44 mt-1 rounded" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Skeleton className="h-4 w-16 rounded" />
                    <Skeleton className="h-5 w-24 mt-1 rounded" />
                  </div>
                  <div>
                    <Skeleton className="h-4 w-16 rounded" />
                    <Skeleton className="h-5 w-24 mt-1 rounded" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Productos */}
        <Card className="bg-card border border-border shadow-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Skeleton className="h-5 w-5 rounded" />
              <Skeleton className="h-5 w-40 rounded" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
export default SaleDetailSkeleton;
