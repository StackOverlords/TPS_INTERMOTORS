/**
 * chatMockUsers.ts
 *
 * ⚠️  DATOS MOCK — Reemplazar con llamada real a:
 *     GET /users?activo=true   (o el endpoint que liste usuarios de la empresa)
 *
 * El hook useAvailableUsers() en components/NewConversationModal.tsx
 * ya tiene el comentario de dónde hacer el swap.
 */

export interface MockUser {
  id: number;
  nombre: string;
  email: string;
  initials: string;
  rol: string;
  sucursal: string;
  online: boolean;
}

export const MOCK_CURRENT_USER_ID = 1; // ⚠️ Reemplazar con el ID del usuario autenticado (authSDK.getUser().id)

export const MOCK_USERS: MockUser[] = [
  {
    id: 2,
    nombre: "Ana García",
    email: "ana@empresa.com",
    initials: "AG",
    rol: "Vendedora",
    sucursal: "Central",
    online: true,
  },
  {
    id: 3,
    nombre: "Carlos Méndez",
    email: "carlos@empresa.com",
    initials: "CM",
    rol: "Almacenero",
    sucursal: "Central",
    online: false,
  },
  {
    id: 4,
    nombre: "Lucía Torres",
    email: "lucia@empresa.com",
    initials: "LT",
    rol: "Administradora",
    sucursal: "Norte",
    online: true,
  },
  {
    id: 5,
    nombre: "Pedro Ramos",
    email: "pedro@empresa.com",
    initials: "PR",
    rol: "Vendedor",
    sucursal: "Norte",
    online: false,
  },
  {
    id: 6,
    nombre: "Sofía Vargas",
    email: "sofia@empresa.com",
    initials: "SV",
    rol: "Cajera",
    sucursal: "Sur",
    online: true,
  },
  {
    id: 7,
    nombre: "Miguel Flores",
    email: "miguel@empresa.com",
    initials: "MF",
    rol: "Almacenero",
    sucursal: "Sur",
    online: true,
  },
  {
    id: 8,
    nombre: "Isabel Chávez",
    email: "isabel@empresa.com",
    initials: "IC",
    rol: "Supervisora",
    sucursal: "Este",
    online: false,
  },
];

/** Retorna las iniciales de un nombre "Nombre Apellido" → "NA" */
export function getInitials(nombre: string): string {
  return nombre
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

/** Busca un mock user por ID */
export function getMockUser(id: number): MockUser | undefined {
  return MOCK_USERS.find((u) => u.id === id);
}
