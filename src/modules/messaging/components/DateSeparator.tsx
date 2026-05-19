import { Badge } from "@/components/atoms/badge";
import { formatDateSeparator } from "../utils/chatTime";

export function DateSeparator({ date }: { date: string | Date }) {
  return (
    <div className="flex items-center justify-center py-4">
      <Badge
        variant={"secondary"}
        className="text-[11px] text-muted-foreground font-medium bg-muted/60"
      >
        {formatDateSeparator(date)}
      </Badge>
    </div>
  );
}
