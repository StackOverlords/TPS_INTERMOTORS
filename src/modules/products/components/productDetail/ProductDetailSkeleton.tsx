import { Skeleton } from "@/components/atoms/skeleton";

const ProductDetailSkeleton = () => {
  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto space-y-4">
        {/* Header Simple - Solo nombre del producto */}
        <div className="bg-background border border-border rounded-lg p-6">
          <div className="flex items-center gap-6">
            <Skeleton className="size-10 rounded" />
            <div>
              <Skeleton className="h-8 w-96 rounded" />
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between">
            {/* TabsList */}
            <div className="bg-background border border-border gap-2 rounded-lg p-1 flex">
              <Skeleton className="h-10 w-28 rounded-lg" />
              <Skeleton className="h-10 w-32 rounded-lg" />
              <Skeleton className="h-10 w-24 rounded-lg" />
              <Skeleton className="h-10 w-28 rounded-lg" />
            </div>

            {/* Branch Selector */}
            <div className="flex items-center gap-2 bg-background rounded-md px-1 border border-border mt-4 lg:mt-0">
              <Skeleton className="h-4 w-4 rounded ml-2" />
              <Skeleton className="h-4 w-16 rounded" />
              <Skeleton className="h-8 w-12 rounded-lg" />
              <Skeleton className="h-8 w-12 rounded-lg" />
              <Skeleton className="h-8 w-12 rounded-lg" />
            </div>
          </div>

          {/* Overview Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Main Content - Full width when there's recent purchase */}
            <div className="lg:col-span-3 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {/* Compra más reciente Card */}
                <div className="bg-background border border-border rounded-lg col-span-3 xl:col-span-4">
                  {/* Card Header */}
                  <div className="p-6 border-b border-border">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-5 w-5 rounded" />
                      <Skeleton className="h-6 w-64 rounded" />
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="p-6">
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
                      <div>
                        <Skeleton className="h-4 w-16 rounded mb-2" />
                        <Skeleton className="h-6 w-8 rounded" />
                      </div>
                      <div>
                        <Skeleton className="h-4 w-12 rounded mb-2" />
                        <Skeleton className="h-6 w-24 rounded" />
                      </div>
                      <div>
                        <Skeleton className="h-4 w-12 rounded mb-2" />
                        <Skeleton className="h-6 w-16 rounded" />
                      </div>
                      <div>
                        <Skeleton className="h-4 w-28 rounded mb-2" />
                        <Skeleton className="h-6 w-16 rounded" />
                      </div>
                      <div>
                        <Skeleton className="h-4 w-32 rounded mb-2" />
                        <Skeleton className="h-6 w-16 rounded" />
                      </div>
                      <div>
                        <Skeleton className="h-4 w-32 rounded mb-2" />
                        <Skeleton className="h-6 w-24 rounded" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Product Image Placeholder */}
                <div className="aspect-square xl:aspect-auto bg-background rounded-xl flex items-center justify-center border-2 border-dashed border-border h-full col-span-2 xl:col-span-1">
                  <div className="text-center p-8">
                    <Skeleton className="h-16 w-16 rounded mx-auto mb-4" />
                    <Skeleton className="h-5 w-20 rounded mx-auto mb-2" />
                    <Skeleton className="h-4 w-32 rounded mx-auto" />
                  </div>
                </div>
              </div>

              {/* Compras Disponibles Card */}
              <div className="bg-background border border-border rounded-lg">
                {/* Card Header */}
                <div className="p-6 border-b border-border">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-5 w-5 rounded" />
                    <Skeleton className="h-6 w-40 rounded" />
                    <div className="ml-auto">
                      <Skeleton className="h-6 w-24 rounded" />
                    </div>
                  </div>
                </div>

                {/* Card Content - Table */}
                <div className="p-6">
                  <div className="overflow-x-auto">
                    {/* Table Header */}
                    <div className="hidden md:grid md:grid-cols-7 gap-4 pb-4 border-b border-border mb-4">
                      <Skeleton className="h-4 w-24 rounded" />
                      <Skeleton className="h-4 w-16 rounded" />
                      <Skeleton className="h-4 w-28 rounded" />
                      <Skeleton className="h-4 w-28 rounded" />
                      <Skeleton className="h-4 w-12 rounded" />
                      <Skeleton className="h-4 w-12 rounded" />
                      <Skeleton className="h-4 w-32 rounded" />
                    </div>

                    {/* Table Rows */}
                    {[1, 2, 3, 4].map((item) => (
                      <div
                        key={item}
                        className="border-b border-border last:border-b-0 py-4"
                      >
                        {/* Mobile layout */}
                        <div className="md:hidden space-y-3">
                          <div className="flex justify-between items-start">
                            <div className="space-y-1">
                              <Skeleton className="h-4 w-20 rounded" />
                              <Skeleton className="h-5 w-16 rounded" />
                            </div>
                            <div className="text-right space-y-1">
                              <Skeleton className="h-4 w-16 rounded" />
                              <Skeleton className="h-5 w-12 rounded" />
                            </div>
                          </div>
                          <div className="flex justify-between items-center">
                            <Skeleton className="h-6 w-12 rounded-full" />
                            <Skeleton className="h-5 w-8 rounded" />
                            <Skeleton className="h-4 w-20 rounded" />
                          </div>
                        </div>

                        {/* Desktop layout */}
                        <div className="hidden md:grid md:grid-cols-7 gap-4 items-center">
                          <div className="flex flex-col gap-1">
                            <Skeleton className="h-4 w-20 rounded" />
                          </div>
                          <Skeleton className="h-4 w-8 rounded" />
                          <Skeleton className="h-4 w-12 rounded" />
                          <Skeleton className="h-4 w-12 rounded" />
                          <div className="flex items-center justify-center">
                            <Skeleton className="h-6 w-12 rounded-full" />
                          </div>
                          <div className="flex items-center justify-center">
                            <Skeleton className="h-5 w-8 rounded" />
                          </div>
                          <Skeleton className="h-4 w-20 rounded" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailSkeleton;
