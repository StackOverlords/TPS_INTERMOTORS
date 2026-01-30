import { Card, CardContent, CardHeader, CardTitle } from "@/components/atoms/card"
import { Separator } from "@/components/atoms/separator"
import { Skeleton } from "@/components/atoms/skeleton"

const ReturnEditSkeleton = () => {
    return (
        <main className="flex flex-col items-center">
            <div className="w-full space-y-2">
                {/* Header */}
                <header className="border-border border bg-card rounded-lg p-2 sm:p-3">
                    <div className="flex flex-wrap gap-2 items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Skeleton className="h-10 w-10 rounded-md" />
                            <div>
                                <Skeleton className="h-6 w-48 mb-2" />
                                <Skeleton className="h-4 w-32" />
                            </div>
                        </div>
                        <div className="flex items-center justify-end w-full sm:w-auto gap-2">
                            <Skeleton className="h-9 w-20 rounded-md" />
                            <Skeleton className="h-9 w-32 rounded-md" />
                        </div>
                    </div>
                </header>

                {/* Form Section */}
                <div className="grid md:grid-cols-3 gap-3">
                    {/* Main Form Card */}
                    <Card className="shadow-none h-full md:col-span-2">
                        <CardContent className="py-3">
                            <div className="grid sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-y-3 gap-x-2">
                                {Array.from({ length: 7 }).map((_, i) => (
                                    <div key={i}>
                                        <Skeleton className="h-4 w-20 mb-2" />
                                        <Skeleton className="h-10 w-full rounded-md" />
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Client Info Card */}
                    <Card className="shadow-none h-full">
                        <CardContent className="space-y-3 py-3">
                            <div className="grid sm:grid-cols-2 gap-y-3 gap-x-2">
                                {Array.from({ length: 2 }).map((_, i) => (
                                    <div key={i}>
                                        <Skeleton className="h-4 w-16 mb-2" />
                                        <Skeleton className="h-10 w-full rounded-md" />
                                    </div>
                                ))}
                                {/* Comments textarea */}
                                <div className="col-span-full">
                                    <Skeleton className="h-4 w-20 mb-2" />
                                    <Skeleton className="h-16 w-full rounded-md" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Products Section */}
                <Card className="border-0 shadow-sm">
                    <CardHeader className="pb-4">
                        <CardTitle>
                            <Skeleton className="h-10 w-40 rounded-md" />
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {/* Table Skeleton */}
                            <div className="w-full overflow-hidden border border-border rounded-lg">
                                {/* Table Header */}
                                <div className="bg-accent/30 border-b border-border px-4 py-3">
                                    <div className="grid grid-cols-12 gap-4 items-center">
                                        <div className="col-span-1">
                                            <Skeleton className="h-4 w-4" />
                                        </div>
                                        <div className="col-span-4">
                                            <Skeleton className="h-4 w-20" />
                                        </div>
                                        <div className="col-span-2">
                                            <Skeleton className="h-4 w-12" />
                                        </div>
                                        <div className="col-span-1">
                                            <Skeleton className="h-4 w-16" />
                                        </div>
                                        <div className="col-span-2">
                                            <Skeleton className="h-4 w-20" />
                                        </div>
                                        <div className="col-span-1">
                                            <Skeleton className="h-4 w-16" />
                                        </div>
                                        <div className="col-span-1">
                                            <Skeleton className="h-4 w-16" />
                                        </div>
                                    </div>
                                </div>

                                {/* Table Rows */}
                                <div className="divide-y divide-border">
                                    {Array.from({ length: 3 }).map((_, index) => (
                                        <div key={index} className="bg-card px-4 py-3">
                                            <div className="grid grid-cols-12 gap-4 items-center">
                                                <div className="col-span-1">
                                                    <Skeleton className="h-4 w-4" />
                                                </div>
                                                <div className="col-span-4">
                                                    <Skeleton className="h-9 w-full rounded-md" />
                                                </div>
                                                <div className="col-span-2">
                                                    <Skeleton className="h-9 w-full rounded-md" />
                                                </div>
                                                <div className="col-span-1">
                                                    <Skeleton className="h-9 w-full rounded-md" />
                                                </div>
                                                <div className="col-span-2">
                                                    <Skeleton className="h-9 w-full rounded-md" />
                                                </div>
                                                <div className="col-span-1">
                                                    <Skeleton className="h-9 w-full rounded-md" />
                                                </div>
                                                <div className="col-span-1 flex justify-center">
                                                    <Skeleton className="h-7 w-7 rounded-md" />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Totals Section */}
                <Card className="border shadow-none border-border pt-3">
                    <CardContent>
                        <div className="grid md:grid-cols-2 gap-3">
                            {/* Discount Section */}
                            <section className="space-y-2 bg-accent/30 p-3 rounded-lg">
                                <header className="flex items-center gap-2 mb-2">
                                    <Skeleton className="h-5 w-16" />
                                </header>
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <Skeleton className="h-3 w-20 mb-2" />
                                        <Skeleton className="h-10 w-full rounded-md" />
                                    </div>
                                    <div>
                                        <Skeleton className="h-3 w-16 mb-2" />
                                        <Skeleton className="h-10 w-full rounded-md" />
                                    </div>
                                </div>
                                <div className="flex gap-1">
                                    {[0, 1, 2, 3, 4].map((i) => (
                                        <Skeleton key={i} className="h-7 w-12 rounded-md" />
                                    ))}
                                </div>
                            </section>

                            {/* Totals Section */}
                            <section className="space-y-4">
                                <div className="space-y-2 bg-accent/30 p-3 rounded-lg">
                                    <div className="flex justify-between items-center">
                                        <Skeleton className="h-4 w-16" />
                                        <Skeleton className="h-5 w-20" />
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <Skeleton className="h-4 w-24" />
                                        <Skeleton className="h-5 w-20" />
                                    </div>

                                    <Separator className="my-2" />

                                    <div className="bg-card rounded-lg p-2 border border-emerald-200 dark:border-emerald-800">
                                        <div className="flex justify-between items-center">
                                            <Skeleton className="h-5 w-12" />
                                            <Skeleton className="h-6 w-24" />
                                        </div>
                                    </div>
                                </div>
                            </section>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </main>
    )
}

export default ReturnEditSkeleton
