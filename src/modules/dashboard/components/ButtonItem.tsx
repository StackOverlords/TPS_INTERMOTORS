import { cn } from "@/lib/utils";
import React from "react";

const ButtonItem = ({
  onClick,
  icon: Icon,
  children,
  className
}: {
  onClick: () => void;
  icon: any;
  children: React.ReactNode;
  className?: string
}) => {
  return (
    <div
      onClick={onClick}
      className={cn(
        "flex items-center p-2 text-sm rounded-md transition-colors text-foreground hover:bg-secondary hover:text-secondary-foreground cursor-pointer",
        className
      )}
    >
      <Icon className="h-4 w-4 mr-2 flex-shrink-0" />
      {children}
    </div>
  );
};

export default ButtonItem;
