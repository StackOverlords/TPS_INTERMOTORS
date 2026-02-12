import { Plus, Eye, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/atoms/card";
// import { Badge } from "@/components/atoms/badge";
import { Button } from "@/components/atoms/button";

interface ConfigCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  iconClassName: string;
  count: number;
  onView: () => void;
  onAdd: () => void;
}

const ConfigCard: React.FC<ConfigCardProps> = ({
  title,
  description,
  icon: Icon,
  iconClassName,
  count,
  onView,
  onAdd,
}) => {
  return (
    <Card
      className={cn(
        "cursor-pointer transition-color duration-200 bg-background hover:bg-background/60 flex flex-col justify-between"
      )}
      onClick={onView}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn("p-2 rounded-lg shadow-sm", iconClassName)}>
              <Icon className="size-4" />
            </div>
            <div>
              <CardTitle className="text-base">{title}</CardTitle>
              <CardDescription className="text-xs">
                {description}
              </CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex justify-center flex-col flex-wrap gap-2">
          {/* <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs font-medium">
                            {count} elemento{count !== 1 ? "s" : ""}
                        </Badge>
                    </div> */}
          <div className="grid gap-2 grid-cols-2">
            <Button
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                onView();
              }}
            >
              <Eye className="size-4 mr-1" />
              Ver
            </Button>
            <Button
              onClick={(e) => {
                e.stopPropagation();
                onAdd();
              }}
            >
              <Plus className="size-4 mr-1" />
              Agregar
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
export default ConfigCard;
