import { Skeleton } from "@/components/atoms/skeleton";
import type { FeedItem } from "../../types/dashboard.types";

interface RecentSalesFeedProps {
  items: FeedItem[];
  isLoading: boolean;
}

const avatarColors = [
  "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  "bg-blue-500/15 text-blue-600 dark:text-blue-400",
  "bg-violet-500/15 text-violet-600 dark:text-violet-400",
  "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  "bg-rose-500/15 text-rose-600 dark:text-rose-400",
  "bg-cyan-500/15 text-cyan-600 dark:text-cyan-400",
];

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2);
}

function SkeletonRows() {
  return (
    <div className="flex flex-col gap-1">
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-2 px-2 py-1.5 rounded-md"
        >
          <Skeleton className="w-6 h-6 rounded-full shrink-0" />
          <div className="flex-1 space-y-1">
            <div className="flex items-center justify-between gap-1">
              <Skeleton className="h-2.5 w-24" />
              <Skeleton className="h-2.5 w-14" />
            </div>
            <div className="flex items-center justify-between gap-1">
              <Skeleton className="h-2 w-16" />
              <Skeleton className="h-2 w-8" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function RecentSalesFeed({ items, isLoading }: RecentSalesFeedProps) {
  if (isLoading) {
    return (
      <div className="h-full overflow-hidden">
        <SkeletonRows />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-xs text-muted-foreground">Sin ventas hoy</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1 h-full overflow-auto scrollbar-thin">
      {items.map((item, i) => (
        <div
          key={`${item.nro}-${i}`}
          className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted/50 transition-colors group cursor-pointer"
        >
          <div
            className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0 ${avatarColors[i % avatarColors.length]}`}
          >
            {getInitials(item.cliente)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-1">
              <span className="text-[10px] font-semibold text-foreground truncate">
                {item.cliente}
              </span>
              <span className="text-[10px] font-bold text-foreground tabular-nums whitespace-nowrap">
                +Bs {item.total.toLocaleString("es-BO")}
              </span>
            </div>
            <div className="flex items-center justify-between gap-1">
              <span className="text-[9px] text-muted-foreground truncate">
                {item.nro} · {item.items} ítem{item.items !== 1 ? "s" : ""}
              </span>
              <span className="text-[8px] text-muted-foreground whitespace-nowrap">
                {item.hora}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
