import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/atoms/card";
import { ShoppingCart } from "lucide-react";
import { RecentSalesFeed } from "./RecentSalesFeed";

export function RecentSalesCard() {
  return (
    <div className="col-span-3 min-h-0">
      <Card className="h-full flex flex-col overflow-hidden border-border/40">
        <CardHeader className="flex flex-row items-center justify-between py-2 px-3 pb-0 shrink-0">
          <CardTitle className="text-[11px] font-semibold flex items-center gap-1.5">
            <ShoppingCart className="size-5 text-emerald-500" />
            Últimas Ventas
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 p-1.5 pt-1 min-h-0">
          <RecentSalesFeed />
        </CardContent>
      </Card>
    </div>
  );
}
