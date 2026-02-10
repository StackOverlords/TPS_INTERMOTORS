import { useParams } from "react-router";

export interface UseValidatedRouteParamConfig {
  paramName: string;
  minValidValue?: number;
  validator?: (value: number) => boolean;
}

export function useValidatedRouteParam({
  paramName,
  minValidValue = 1,
  validator,
}: UseValidatedRouteParamConfig) {
  const params = useParams();
  const paramValue = params[paramName];
  const numericValue = paramValue ? Number(paramValue) : null;

  const isValidNumber =
    numericValue !== null &&
    !isNaN(numericValue) &&
    numericValue >= minValidValue;

  const passesCustomValidator = validator ? validator(numericValue!) : true;

  const isValid = isValidNumber && passesCustomValidator;

  return {
    value: isValid ? numericValue : null,
    isValid,
    rawValue: paramValue,
  };
}
