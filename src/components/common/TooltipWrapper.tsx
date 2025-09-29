import type { TooltipContentProps } from "@radix-ui/react-tooltip";
import { Tooltip, TooltipContent, TooltipTrigger } from "../atoms/tooltip";

type TooltipWrapperProps = {
    tooltip: React.ReactNode;
    children: React.ReactNode;
    tooltipContentProps?: TooltipContentProps
};

export const TooltipWrapper: React.FC<TooltipWrapperProps> = ({ tooltip, children, tooltipContentProps }) => {
    return (
        <Tooltip>
            <TooltipTrigger asChild>
                {children}
            </TooltipTrigger>
            <TooltipContent {...tooltipContentProps}>
                <div className="flex items-center gap-1 text-xs text-gray-500">
                    {tooltip}
                </div>
            </TooltipContent>
        </Tooltip>
    );
};
