import { ApiService } from "@/lib/apiService";
import { Logger } from "@/lib/logger";
import type { MessagingUsersResponse } from "../types/MessagingUser.types";
import { MESSAGING_ENDPOINTS } from "./MessagingEndpoints.service";
import { messagingUsersResponseSchema } from "../schemas/MessagingUser.schema";

const MODULE_NAME = "MESSAGING_USER_SERVICE";

export interface GetMessagingUsersParams {
  sucursal_id?: number;
  buscar?: string;
}

export const messagingUserService = {
  async getAll(
    params?: GetMessagingUsersParams,
  ): Promise<MessagingUsersResponse> {
    Logger.info("Fetching messaging users", { params }, MODULE_NAME);

    // Limpiar params vacíos para no contaminar la query string
    const cleanParams = params
      ? Object.fromEntries(
          Object.entries(params).filter(([, v]) => v !== undefined && v !== ""),
        )
      : undefined;

    const response = await ApiService.get(
      MESSAGING_ENDPOINTS.users.all,
      messagingUsersResponseSchema,
      cleanParams ? { params: cleanParams } : undefined,
    );

    Logger.info(
      "Messaging users fetched",
      { groups: (response as MessagingUsersResponse).length },
      MODULE_NAME,
    );
    return response as MessagingUsersResponse;
  },
};
