import apiClient from "@/services/axios";
import { UserSchema } from "../screens/schemas/user.schema";
import type { Permission, User, UserFilters, UserListResponse, UserPermissionsRequest } from "../types/User";
import type { UserCreate, UserCreateResponse } from "../types/UserCreate.types";
import type { UserUpdate, UserUpdateResponse } from "../types/UserUpdate.types";
import { USER_ENDPOINTS } from "./endpoints";

export const fetchUsers = async (filters: UserFilters): Promise<UserListResponse> => {
  const params: any = {
    pagina: filters.pagina || 1,
    pagina_registros: filters.pagina_registros || 20,
  };

  // console.log("Parámetros enviados para usuarios:", params);

  const response = await apiClient.get(USER_ENDPOINTS.all, { params });
  // console.log("Respuesta recibida usuarios:", response.data);

  // const result = UserListResponseSchema.safeParse(response.data);
  // if (response.status !== 200) {
  //   throw new Error("Respuesta inválida del servidor.");
  // }
  // console.log(response.data)
  return response.data;
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

  // Temporalmente sin validación estricta para permitir edición
  const userData = response.data.data || response.data;

  // Intentar validar pero no fallar si no pasa
  const result = UserSchema.safeParse(userData);
  if (!result.success) {
    console.warn("Zod validation warning en fetchUserById:", result.error.format());
    // Retornar los datos sin validar para permitir la edición
    return userData as User;
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
  await apiClient.put(USER_ENDPOINTS.updatePermissions, userPermissionsData);
};

/**
 * Crear un nuevo usuario
 * @param data - Datos del usuario a crear
 */
export const createUser = async (data: UserCreate): Promise<UserCreateResponse> => {
  // NO eliminar clave_acceso_confirmation - el backend lo necesita para validar
  // Limpiar campos vacíos/null para evitar problemas con el backend
  const cleanedData = Object.fromEntries(
    Object.entries(data).filter(([_, value]) => {
      // Mantener el valor si es: número (incluso 0), boolean, o string no vacío
      if (typeof value === 'number') return true;
      if (typeof value === 'boolean') return true;
      if (typeof value === 'string' && value.trim() !== '') return true;
      return false;
    })
  );

  console.log('🔵 Datos a enviar al crear usuario:', cleanedData);

  try {
    const response = await apiClient.post(USER_ENDPOINTS.create, cleanedData);
    console.log('✅ Usuario creado exitosamente:', response.data);
    return response.data.data;
  } catch (error: any) {
    console.error('❌ Error al crear usuario:', error.response?.data);
    throw error;
  }
};

/**
 * Actualizar un usuario existente
 * @param id - ID del usuario
 * @param data - Datos a actualizar
 */
export const updateUser = async (
  id: number,
  data: UserUpdate
): Promise<UserUpdateResponse> => {
  const response = await apiClient.post(USER_ENDPOINTS.update(id), data);
  return response.data.data;
};

/**
 * Eliminar un usuario
 * @param id - ID del usuario a eliminar
 */
export const deleteUser = async (id: number): Promise<void> => {
  console.log('🗑️ Eliminando usuario con ID:', id);

  try {
    await apiClient.delete(USER_ENDPOINTS.delete(id));
    console.log('✅ Usuario eliminado exitosamente');
  } catch (error: any) {
    console.error('❌ Error al eliminar usuario:', error.response?.data);
    throw error;
  }
};

// Exportar objeto de servicio
export const userService = {
  create: createUser,
  update: updateUser,
  delete: deleteUser,
};
