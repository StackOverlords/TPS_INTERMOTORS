/**
 * Obtiene el nombre del cliente a mostrar.
 * Si el cliente es "CLIENTES VARIOS" (sin importar mayúsculas/minúsculas),
 * usa el nombre alternativo proporcionado. De lo contrario, usa el nombre del cliente.
 *
 * @param clienteNombre - Nombre del cliente desde la base de datos
 * @param clienteNombreAlt - Nombre alternativo del cliente
 * @returns El nombre del cliente apropiado para mostrar
 *
 * @example
 * getDisplayClientName("CLIENTES VARIOS", "Juan Pérez") // "Juan Pérez"
 * getDisplayClientName("clientes varios", "María López") // "María López"
 * getDisplayClientName("Empresa ABC", "Pedro Gómez") // "Empresa ABC"
 */
export const getDisplayClientName = (
  clienteNombre: string | null | undefined,
  clienteNombreAlt: string | null | undefined
): string => {
  // Si no hay nombre de cliente, usar el alternativo o "Sin cliente"
  if (!clienteNombre) {
    return clienteNombreAlt || "Sin cliente";
  }

  // Normalizar y comparar (sin espacios extras, sin acentos, lowercase)
  const normalizedName = clienteNombre
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, ""); // Elimina acentos

  const isClientesVarios =
    normalizedName === "clientes varios" || normalizedName === "cliente varios";

  // Si es "clientes varios", usar el nombre alternativo
  if (isClientesVarios) {
    return clienteNombreAlt || clienteNombre;
  }

  // De lo contrario, usar el nombre del cliente normal
  return clienteNombre;
};

/**
 * Verifica si un nombre de cliente es "CLIENTES VARIOS"
 *
 * @param clienteNombre - Nombre del cliente
 * @returns true si es "clientes varios", false en caso contrario
 */
export const isClientesVarios = (
  clienteNombre: string | null | undefined
): boolean => {
  if (!clienteNombre) return false;

  const normalized = clienteNombre
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  return normalized === "clientes varios" || normalized === "cliente varios";
};
