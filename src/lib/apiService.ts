import apiClient from "@/services/axios";
import type { AxiosError, AxiosRequestConfig, AxiosResponse } from "axios";
import { z } from "zod";
import { Validator } from "./validator";
import logger from "@/utils/logger";

interface ApiOptions {
  unwrapData?: boolean;
}

export class ApiService {
  private static logRequest(method: string, url: string, data?: unknown) {
    logger.info(
      `API Request: ${method.toUpperCase()} ${url}`,
      {
        method,
        url,
        data: data ? "included" : "none",
      },
      "API",
    );
  }

  private static logResponse(
    method: string,
    url: string,
    response: AxiosResponse,
  ) {
    logger.info(
      `API Response: ${method.toUpperCase()} ${url}`,
      {
        status: response.status,
        dataSize: JSON.stringify(response.data).length,
      },
      "API",
    );
  }

  private static logError(method: string, url: string, error: AxiosError) {
    logger.error(
      `API Error: ${method.toUpperCase()} ${url}`,
      {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      },
      "API",
    );
  }

  static async get<T>(
    url: string,
    schema?: z.ZodSchema<T>,
    config?: AxiosRequestConfig,
    options: ApiOptions = { unwrapData: false },
    applySchema: boolean = true,
  ): Promise<T> {
    this.logRequest("GET", url);

    try {
      const response = await apiClient.get(url, config);
      this.logResponse("GET", url, response);

      const payload = options.unwrapData ? response.data.data : response.data;

      if (schema && applySchema) {
        return Validator.validate(schema, payload, `GET ${url}`);
      }

      return payload;
    } catch (error) {
      const axiosError = error as AxiosError;
      this.logError("GET", url, axiosError);
      throw error;
    }
  }

  static async post<T>(
    url: string,
    data?: unknown,
    schema?: z.ZodSchema<T>,
    config?: AxiosRequestConfig,
    options: ApiOptions = { unwrapData: false },
  ): Promise<T> {
    this.logRequest("POST", url, data);

    try {
      const response = await apiClient.post(url, data, config);
      this.logResponse("POST", url, response);

      const payload = options.unwrapData ? response.data.data : response.data;

      if (schema) {
        return Validator.validate(schema, payload, `POST ${url}`);
      }

      return payload;
    } catch (error) {
      const axiosError = error as AxiosError;
      this.logError("POST", url, axiosError);
      throw error;
    }
  }

  static async put<T>(
    url: string,
    data?: unknown,
    schema?: z.ZodSchema<T>,
    config?: AxiosRequestConfig,
    options: ApiOptions = { unwrapData: false },
  ): Promise<T> {
    this.logRequest("PUT", url, data);

    try {
      const response = await apiClient.put(url, data, config);
      this.logResponse("PUT", url, response);

      const payload = options.unwrapData ? response.data.data : response.data;

      if (schema) {
        return Validator.validate(schema, payload, `PUT ${url}`);
      }

      return payload;
    } catch (error) {
      const axiosError = error as AxiosError;
      this.logError("PUT", url, axiosError);
      throw error;
    }
  }

  static async delete<T>(
    url: string,
    schema?: z.ZodSchema<T>,
    config?: AxiosRequestConfig,
    options: ApiOptions = { unwrapData: false },
  ): Promise<T> {
    this.logRequest("DELETE", url);

    try {
      const response = await apiClient.delete(url, config);
      this.logResponse("DELETE", url, response);

      const payload = options.unwrapData ? response.data.data : response.data;

      if (schema) {
        return Validator.validate(schema, payload, `DELETE ${url}`);
      }

      return payload;
    } catch (error) {
      const axiosError = error as AxiosError;
      this.logError("DELETE", url, axiosError);
      throw error;
    }
  }

  static async patch<T>(
    url: string,
    data?: unknown,
    schema?: z.ZodSchema<T>,
    config?: AxiosRequestConfig,
    options: ApiOptions = { unwrapData: false },
  ): Promise<T> {
    this.logRequest("PATCH", url, data);
    try {
      const response = await apiClient.patch(url, data, config);
      this.logResponse("PATCH", url, response);
      const payload = options.unwrapData ? response.data.data : response.data;
      if (schema) return Validator.validate(schema, payload, `PATCH ${url}`);
      return payload;
    } catch (error) {
      this.logError("PATCH", url, error as AxiosError);
      throw error;
    }
  }
}
