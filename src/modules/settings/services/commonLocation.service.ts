import { ApiService } from "@/lib/apiService";
import { Logger } from "@/lib/logger";
import { CitiesResponseSchema, CountriesResponseSchema, StatesResponseSchema } from "../schemas/commonLocation.schema";
import type { CitiesResponse, CountriesResponse, StatesResponse } from "../types/commonLocation.types";
import { COMMON_LOCATION_ENDPOINTS_CUSTOMERS, COMMON_LOCATION_ENDPOINTS_PROVIDERS } from "./endpoints/commonLocationEndpoints.service";

const MODULE_NAME = 'COMMON_LOCATION_SERVICE';

export const commonLocationService = {
  async getCountriesProviders(): Promise<CountriesResponse> {
    Logger.info('Fetching Countries', undefined, MODULE_NAME);

    const response = await ApiService.get(
      COMMON_LOCATION_ENDPOINTS_PROVIDERS.countries,
      CountriesResponseSchema
    );

    Logger.info('Countries fetched successfully', {
      count: response.data.length,
    }, MODULE_NAME);

    return response;
  },

  async getStatesProviders(countryId: number): Promise<StatesResponse> {
    Logger.info('Fetching States', { countryId }, MODULE_NAME);

    const response = await ApiService.get(
      COMMON_LOCATION_ENDPOINTS_PROVIDERS.states(countryId),
      StatesResponseSchema
    );

    Logger.info('States fetched successfully', {
      countryId,
      count: response.data.length,
    }, MODULE_NAME);

    return response;
  },

  async getCitiesPoviders(stateId: number): Promise<CitiesResponse> {
    Logger.info('Fetching Cities', { stateId }, MODULE_NAME);

    const response = await ApiService.get(
      COMMON_LOCATION_ENDPOINTS_PROVIDERS.cities(stateId),
      CitiesResponseSchema
    );

    Logger.info('Cities fetched successfully', {
      stateId,
      count: response.data.length,
    }, MODULE_NAME);

    return response;
  },


  async getCountriesCustomers(): Promise<CountriesResponse> {
    Logger.info('Fetching Countries', undefined, MODULE_NAME);

    const response = await ApiService.get(
      COMMON_LOCATION_ENDPOINTS_CUSTOMERS.countries,
      CountriesResponseSchema
    );

    Logger.info('Countries fetched successfully', {
      count: response.data.length,
    }, MODULE_NAME);

    return response;
  },

  async getStatesCustomers(countryId: number): Promise<StatesResponse> {
    Logger.info('Fetching States', { countryId }, MODULE_NAME);

    const response = await ApiService.get(
      COMMON_LOCATION_ENDPOINTS_CUSTOMERS.states(countryId),
      StatesResponseSchema
    );

    Logger.info('States fetched successfully', {
      countryId,
      count: response.data.length,
    }, MODULE_NAME);

    return response;
  },

  async getCitiesCustomers(stateId: number): Promise<CitiesResponse> {
    Logger.info('Fetching Cities', { stateId }, MODULE_NAME);

    const response = await ApiService.get(
      COMMON_LOCATION_ENDPOINTS_CUSTOMERS.cities(stateId),
      CitiesResponseSchema
    );

    Logger.info('Cities fetched successfully', {
      stateId,
      count: response.data.length,
    }, MODULE_NAME);

    return response;
  },
};
