import { getAllViewConfigs } from "@/view-configs/viewConfigs";
import { useMemo } from "react";

export function useAllViewConfigs() {
    return useMemo(() => getAllViewConfigs(), []);
}