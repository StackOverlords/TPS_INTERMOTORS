import apiClient from "@/services/axios";
import { UserListResponseSchema, UserSchema } from "../screens/schemas/user.schema";
import type { Permission, User, UserFilters, UserListResponse, UserPermissionsRequest } from "../types/User";
import { USER_ENDPOINTS } from "./endpoints";

export const fetchUsers = async (filters: UserFilters): Promise<UserListResponse> => {
  const params: any = {
    pagina: filters.pagina || 1,
    pagina_registros: filters.pagina_registros || 20,
  };

  // console.log("Parámetros enviados para usuarios:", params);

  const response = await apiClient.get(USER_ENDPOINTS.all, { params });
  // console.log("Respuesta recibida usuarios:", response.data);

  const result = UserListResponseSchema.safeParse(response.data);
  if (!result.success) {
    console.error("Zod error en fetchUsers:", result.error.format());
    throw new Error("Respuesta inválida del servidor.");
  }
  return result.data;
};

export const fetchUserByNickName = async (nickname: string): Promise<User> => {
  const response = await apiClient.get(USER_ENDPOINTS.byNickName(nickname));
  const result = UserSchema.safeParse(response.data.data[0] || response.data[0]);
  if (!result.success) {
    console.error("Zod error en fetchUserById:", result.error.format());
    throw new Error("Respuesta inválida del servidor.");
  }
  return result.data;
};
export const fetchPermissionsByUserId = async (id: number): Promise<User> => {
  // console.log("in service nickname:", id);
  const response = await apiClient.get(USER_ENDPOINTS.byId(id));
  // console.log("Respuesta usuario por NICKNAME:", response.data);

  const result = UserSchema.safeParse(response.data.data || response.data);
  if (!result.success) {
    console.error("Zod error en fetchUserById:", result.error.format());
    throw new Error("Respuesta inválida del servidor.");
  }
  return result.data;
};


//SEPARATOR
export const fetchPermissions = async (): Promise<any> => {
  const response = await apiClient.get(USER_ENDPOINTS.permissions);
  if (response.status !== 200) {
    throw new Error("Respuesta inválida del servidor.");
  }
  return response.data;
};

export const fetchUserPermissions = async (userId: number): Promise<Permission[]> => {
  const response = await apiClient.get(USER_ENDPOINTS.userPermissions(userId));
  // console.log("Respuesta permisos de usuario:", response.data);

  // Asumiendo que la respuesta es un array de permisos
  // Ajustar según la estructura real de tu API
  const permissions = response.data.data || response.data || [];

  return permissions;
};

export const updateUserPermissions = async (userPermissionsData: UserPermissionsRequest): Promise<void> => {
  try {
    console.log('🚀 Enviando permisos de usuario al servidor:', userPermissionsData);
    const response = await apiClient.put(USER_ENDPOINTS.updatePermissions, userPermissionsData);
    console.log('✅ Respuesta del servidor (permisos):', response.data);
  } catch (error: any) {
    console.error("❌ Error al actualizar permisos de usuario:", error);

    if (error.response?.status === 422 && error.response?.data?.error?.validation_errors) {
      console.group('🔍 Errores de validación:');
      error.response.data.error.validation_errors.forEach((validationError: any, index: number) => {
        console.log(`${index + 1}. Campo: ${validationError.field} - ${validationError.message}`);
      });
      console.groupEnd();
    }

    throw new Error("Error al actualizar los permisos del usuario");
  }
};
