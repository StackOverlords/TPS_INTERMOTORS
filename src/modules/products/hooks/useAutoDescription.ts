import { useMemo } from "react";
import { generateDescription, singularizeWord } from "../utils/stringUtils";

interface UseAutoDescriptionProps {
    categoryName?: string;
    vehicleBrandName?: string;
    motorNumber?: string | null;
    measurement?: string | null;
    model?: string | null;
    altDescription?: string | null;
}

export const useAutoDescription = ({
    categoryName,
    vehicleBrandName,
    motorNumber,
    measurement,
    model,
    altDescription
}: UseAutoDescriptionProps) => {
    return useMemo(() => {
        const parts = [
            categoryName ? singularizeWord(categoryName) : '',
            vehicleBrandName,
            motorNumber,
            measurement,
            model,
            altDescription
        ];

        return generateDescription(parts);
    }, [categoryName, vehicleBrandName, motorNumber, measurement, model, altDescription]);
};