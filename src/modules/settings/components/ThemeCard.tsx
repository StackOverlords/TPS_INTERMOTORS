import { cn } from "@/lib/utils";

type Theme = 'light' | 'dark' | 'system';
interface ThemeCardProps {
    theme?: Theme;
    className?: string;
}

const renderSystemTheme = () => {

    return (
        <div className="w-full h-full grid grid-cols-2">
            {/* light */}
            <div className={cn(
                "h-full w-full border-l border-y bg-white border-gray-200 rounded-l-md shadow-sm overflow-hidden ",
            )}>
                <div className={cn(
                    "p-1 flex gap-1 border-b border-gray-200",
                )}>
                    <div className="w-2 h-2 rounded-full bg-red-400"></div>
                    <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
                    <div className="w-2 h-2 rounded-full bg-green-400"></div>
                </div>
                <div className="grid grid-cols-2 h-full">
                    {/* sidebar */}
                    <div className={cn(
                        "flex flex-col col-span-1 border-r border-gray-200 p-2",
                    )}>
                        <div className="flex gap-1 mb-2 items-center">
                            <div className={cn(
                                "rounded size-3 bg-gray-900",
                            )} />
                            <div className={cn(
                                "h-2 rounded w-2/3 bg-gray-200",
                            )} />
                        </div>
                        <div className="flex flex-col justify-between flex-grow">
                            <div className="space-y-1.5 mt-1">
                                {
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <div key={i} className="flex gap-1">
                                            <div className={cn(
                                                "h-1.5 rounded w-2/3 bg-gray-200",
                                                i === 0 && "bg-gray-900",
                                            )} />
                                        </div>
                                    ))
                                }
                            </div>
                            <div className="space-y-1.5 mt-1">
                                {
                                    Array.from({ length: 2 }).map((_, i) => (
                                        <div key={i} className="flex gap-1">
                                            <div className={cn(
                                                "h-1.5 bg-gray-200 rounded w-2/3",
                                                i === 1 && "bg-gray-900",
                                            )} />
                                        </div>
                                    ))
                                }
                            </div>
                        </div>
                    </div>
                    {/* main content */}
                    <div className="flex flex-col py-2 pl-2 space-y-1 h-full">
                        <div className="flex gap-1 mb-3 items-center justify-between">
                            <div className={cn(
                                "h-2 bg-gray-200 rounded w-full",
                            )} />
                        </div>
                        <div className={cn(
                            "h-1.5 bg-gray-200 rounded w-3/4",
                        )} />
                        <div className={cn(
                            "h-1.5 bg-gray-200 rounded-l w-full",
                        )} />
                        <div className={cn(
                            "bg-gradient-to-b from-gray-200 to-gray-50 rounded-l h-full",
                        )} />
                    </div>
                </div>
            </div>
            {/* dark */}
            <div className={cn(
                "h-full w-full border-r border-y bg-gray-800 border-gray-700 rounded-r-md shadow-sm overflow-hidden ",
            )}>
                <div className={cn(
                    "p-1 flex border-b border-gray-700",
                )}>
                    <div className="w-2 h-2" />
                </div>
                {/* main content */}
                <div className="flex flex-col col-span-3 py-2 pr-2 space-y-1 h-full">
                    <div className="flex gap-1 mb-3 items-center justify-end">
                        <div className="flex gap-1 items-center justify-end">
                            {
                                Array.from({ length: 3 }).map((_, i) => (
                                    <div key={i} className={cn(
                                        "rounded h-2 w-4 bg-gray-700",
                                        i === 2 && "bg-white",
                                    )} />
                                ))
                            }
                        </div>
                    </div>
                    <div className="h-1.5" />
                    <div className={cn(
                        "h-1.5 bg-gray-700 rounded-r w-1/4",
                    )} />
                    <div className={cn(
                        "bg-gradient-to-b from-gray-700 to-gray-800 rounded-r h-full",
                    )} />
                </div>
            </div>
        </div>
    )
}

const ThemeCard: React.FC<ThemeCardProps> = ({
    theme = 'light',
    className
}) => {

    if (theme === 'system') {
        return renderSystemTheme();
    }

    return (
        <div className={cn(
            "h-full w-full border rounded-md shadow-sm overflow-hidden",
            theme === 'dark' && "bg-gray-800 border-gray-700",
            theme === 'light' && "bg-white border-gray-200",
            className
        )}>
            <div className={cn(
                "p-1 flex gap-1 border-b border-gray-200",
                theme === 'dark' && "border-gray-700"
            )}>
                <div className="w-2 h-2 rounded-full bg-red-400"></div>
                <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
                <div className="w-2 h-2 rounded-full bg-green-400"></div>
            </div>
            <div className="grid grid-cols-4 h-full">
                {/* sidebar */}
                <div className={cn(
                    "flex flex-col col-span-1 border-r border-gray-200 p-2",
                    theme === 'dark' && "border-gray-700"
                )}>
                    <div className="flex gap-1 mb-2 items-center">
                        <div className={cn(
                            "rounded size-3 bg-gray-900",
                            theme === 'dark' && "bg-white",
                        )} />
                        <div className={cn(
                            "h-2 rounded w-2/3",
                            theme === 'light' ? "bg-gray-200" : "bg-gray-700"
                        )}></div>
                    </div>
                    <div className="flex flex-col justify-between flex-grow">
                        <div className="space-y-1.5 mt-1">
                            {
                                Array.from({ length: 5 }).map((_, i) => (
                                    <div key={i} className="flex gap-1">
                                        <div className={cn(
                                            "h-1.5 rounded w-2/3 bg-gray-200",
                                            i === 0 && theme === 'light' && "bg-gray-900",
                                            i === 0 && theme === 'dark' && "bg-white",
                                            i !== 0 && theme === 'dark' && "bg-gray-700",
                                        )} />
                                    </div>
                                ))
                            }
                        </div>
                        <div className="space-y-1.5 mt-1">
                            {
                                Array.from({ length: 2 }).map((_, i) => (
                                    <div key={i} className="flex gap-1">
                                        <div className={cn(
                                            "h-1.5 bg-gray-200 rounded w-2/3",
                                            i === 1 && theme === 'light' && "bg-gray-900",
                                            i === 1 && theme === 'dark' && "bg-white",
                                            i !== 1 && theme === 'dark' && "bg-gray-700",
                                        )} />
                                    </div>
                                ))
                            }
                        </div>
                    </div>
                </div>
                {/* main content */}
                <div className="flex flex-col col-span-3 p-2 space-y-1 h-full">
                    <div className="flex gap-1 mb-3 items-center justify-between">
                        <div className={cn(
                            "h-2 bg-gray-200 rounded w-1/3",
                            theme === 'dark' && "bg-gray-700"
                        )} />
                        <div className="flex gap-1 items-center">
                            {
                                Array.from({ length: 3 }).map((_, i) => (
                                    <div key={i} className={cn(
                                        "rounded h-2 w-4 bg-gray-200",
                                        i === 2 && theme === 'light' && "bg-gray-900",
                                        i === 2 && theme === 'dark' && "bg-white",
                                        i !== 2 && theme === 'dark' && "bg-gray-700",
                                    )} />
                                ))
                            }
                        </div>
                    </div>
                    <div className={cn(
                        "h-1.5 bg-gray-200 rounded w-1/4",
                        theme === 'dark' && "bg-gray-700"
                    )} />
                    <div className={cn(
                        "h-1.5 bg-gray-200 rounded w-1/2",
                        theme === 'dark' && "bg-gray-700"
                    )} />
                    <div className={cn(
                        "bg-gradient-to-b from-gray-200 to-gray-50 rounded h-full",
                        theme === 'dark' && "from-gray-700 to-gray-800"
                    )} />
                </div>
            </div>
        </div>
    );
}

export default ThemeCard;