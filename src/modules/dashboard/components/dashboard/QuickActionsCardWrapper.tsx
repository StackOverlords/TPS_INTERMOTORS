import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/atoms/card";
import { Zap } from "lucide-react";

export function QuickActionsCardWrapper() {
  return (
    <div className="col-span-3 min-h-0">
      <Card className="h-full flex flex-col overflow-hidden border-border/40">
        <CardHeader className="py-2 px-3 pb-0 shrink-0">
          <CardTitle className="text-[11px] font-semibold flex items-center gap-1.5">
            <Zap className="h-3 w-3 text-amber-500" />
            Accesos Rápidos
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 p-2 pt-1.5 min-h-0 overflow-auto scrollbar-thin">
          {/* <QuickActionsCard /> */}
        </CardContent>
      </Card>
    </div>
  );
}
