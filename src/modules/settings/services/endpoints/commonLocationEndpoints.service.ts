export const COMMON_LOCATION_ENDPOINTS_PROVIDERS = {
    countries: '/providers/commons/countries',
    states: (countryId: number) => `/providers/commons/states/${countryId}`,
    cities: (stateId: number) => `/providers/commons/cities/${stateId}`,
} as const;
export const COMMON_LOCATION_ENDPOINTS_CUSTOMERS = {
    countries: '/customers/commons/countries',
    states: (countryId: number) => `/customers/commons/states/${countryId}`,
    cities: (stateId: number) => `/customers/commons/cities/${stateId}`,
} as const;
