import { Skeleton } from "@/components/atoms/skeleton";

const PurchaseDetailSkeleton = () => {
  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto space-y-4">
        {/* Header Skeleton */}
        <div className="bg-background border border-border rounded-lg p-6">
          <div className="flex items-center gap-3">
            <Skeleton className="w-10 h-10"></Skeleton>
            <div className="space-y-2">
              <Skeleton className="h-6 w-64"></Skeleton>
            </div>
          </div>
        </div>

        {/* Tabs Skeleton */}
        <div className="flex flex-wrap-reverse gap-2 justify-between">
          <div className="bg-background border border-border rounded-lg p-2 flex gap-2">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-8 w-24"></Skeleton>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-10 w-32"></Skeleton>
            <Skeleton className="h-10 w-40"></Skeleton>
          </div>
        </div>

        {/* Content Skeleton */}
        <div className="space-y-6">
          {/* Main Info Card */}
          <div className="bg-background border border-border rounded-lg p-6">
            <Skeleton className="h-6 w-48 mb-6"></Skeleton>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-24"></Skeleton>
                  <Skeleton className="h-6 w-32"></Skeleton>
                </div>
              ))}
            </div>
          </div>

          {/* Two Column Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="bg-background border border-border rounded-lg p-6"
              >
                <Skeleton className="h-6 w-32 mb-4"></Skeleton>
                <div className="space-y-3">
                  {[1, 2, 3].map((j) => (
                    <div key={j} className="space-y-2">
                      <Skeleton className="h-4 w-20"></Skeleton>
                      <Skeleton className="h-5 w-40"></Skeleton>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Comments Card */}
          <div className="bg-background border border-border rounded-lg p-6">
            <Skeleton className="h-6 w-32 mb-4"></Skeleton>
            <div className="space-y-2">
              <Skeleton className="h-4 w-full"></Skeleton>
              <Skeleton className="h-4 w-3/4"></Skeleton>
              <Skeleton className="h-4 w-1/2"></Skeleton>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PurchaseDetailSkeleton;
