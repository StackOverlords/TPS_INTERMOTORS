import type { Table } from "@tanstack/react-table";
import { Settings2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../atoms/dropdown-menu";
import { Button } from "../atoms/button";
import { Checkbox } from "../atoms/checkbox";

interface ColumnVisibilityDropdownProps<TData> {
    table: Table<TData>;
    label?: string;
    icon?: React.ReactNode;
}

export function ColumnVisibilityDropdown<TData>({
    table,
    label = "Columnas",
    icon = <Settings2 className="size-4" />,
}: ColumnVisibilityDropdownProps<TData>) {
    const columns = table.getAllColumns().filter((col) => col.getCanHide());

    if (columns.length === 0) return null;

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline">
                    {icon}
                    <span >{label}</span>
                </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
                align="end"
                className="w-56 max-h-96 overflow-y-auto border border-border"
            >
                {columns.map((column) => (
                    <DropdownMenuItem
                        key={column.id}
                        className="flex items-center space-x-2 cursor-pointer"
                        onSelect={(e) => e.preventDefault()}
                        onClick={() => column.toggleVisibility(!column.getIsVisible())}
                    >
                        <Checkbox
                            className="border border-gray-400"
                            checked={column.getIsVisible()}
                            onCheckedChange={(value) =>
                                column.toggleVisibility(!!value)
                            }
                        />
                        <span className="flex-1 truncate">
                            {typeof column.columnDef.header === "string"
                                ? column.columnDef.header
                                : column.id}
                        </span>
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}