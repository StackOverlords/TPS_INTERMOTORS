import { useMemo } from "react";

interface RecentSale {
  id: string;
  cliente: string;
  producto: string;
  total: number;
  hora: string;
  items: number;
}

const mockRecentSales: RecentSale[] = [
  {
    id: "V-1042",
    cliente: "Carlos Mendoza",
    producto: "Amortiguador Ford Explorer",
    total: 990,
    hora: "14:32",
    items: 2,
  },
  {
    id: "V-1041",
    cliente: "María López",
    producto: "Kit Embrague Toyota Hilux",
    total: 520,
    hora: "13:15",
    items: 1,
  },
  {
    id: "V-1040",
    cliente: "Jorge Quispe",
    producto: "Radiador Nissan Pathfinder",
    total: 760,
    hora: "12:48",
    items: 3,
  },
  {
    id: "V-1039",
    cliente: "Ana Torrez",
    producto: "Bomba Agua Hyundai Tucson",
    total: 210,
    hora: "11:20",
    items: 1,
  },
  {
    id: "V-1038",
    cliente: "Pedro Vargas",
    producto: "Filtro Aceite Toyota Hilux",
    total: 84,
    hora: "10:05",
    items: 3,
  },
  {
    id: "V-1037",
    cliente: "Luis Fernández",
    producto: "Pastilla Freno Honda Civic",
    total: 165,
    hora: "09:30",
    items: 2,
  },
];

const avatarColors = [
  "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  "bg-blue-500/15 text-blue-600 dark:text-blue-400",
  "bg-violet-500/15 text-violet-600 dark:text-violet-400",
  "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  "bg-rose-500/15 text-rose-600 dark:text-rose-400",
  "bg-cyan-500/15 text-cyan-600 dark:text-cyan-400",
];

export function RecentSalesFeed() {
  const sales = useMemo(() => mockRecentSales, []);

  return (
    <div className="flex flex-col gap-1 h-full overflow-auto scrollbar-thin">
      {sales.map((sale, i) => (
        <div
          key={sale.id}
          className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted/50 transition-colors group cursor-pointer"
        >
          <div
            className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0 ${avatarColors[i % avatarColors.length]}`}
          >
            {sale.cliente
              .split(" ")
              .map((n) => n[0])
              .join("")}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-1">
              <span className="text-[10px] font-semibold text-foreground truncate">
                {sale.cliente}
              </span>
              <span className="text-[10px] font-bold text-foreground tabular-nums whitespace-nowrap">
                +Bs {sale.total.toLocaleString("es-BO")}
              </span>
            </div>
            <div className="flex items-center justify-between gap-1">
              <span className="text-[9px] text-muted-foreground truncate">
                {sale.producto}
              </span>
              <span className="text-[8px] text-muted-foreground whitespace-nowrap">
                {sale.hora}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
