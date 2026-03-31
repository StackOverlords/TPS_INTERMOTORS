export interface ProductListItem {
  id: number;
  name: string;
  brand: string | null;
  quantity: number;
  price: number;
  subtotal: number;
}

export interface ProductListPayload {
  items: ProductListItem[];
  total: number;
}

export type MockMessage =
  | { id: string; from: "me" | "them"; time: string; type: "text"; text: string }
  | { id: string; from: "me" | "them"; time: string; type: "product-list"; payload: ProductListPayload };

export interface MockConversation {
  id: string;
  name: string;
  role: string;
  unread: number;
  lastMessage: string;
  lastTime: string;
  online: boolean;
}

export const MOCK_CONVERSATIONS: MockConversation[] = [
  {
    id: "1",
    name: "Marcos García",
    role: "Depósito",
    unread: 2,
    lastMessage: "Los repuestos ya están listos para despacho",
    lastTime: "10:32",
    online: true,
  },
  {
    id: "2",
    name: "Laura Rodríguez",
    role: "Ventas",
    unread: 0,
    lastMessage: "Ok, entendido. Lo proceso ahora",
    lastTime: "09:14",
    online: true,
  },
  {
    id: "3",
    name: "Carlos Méndez",
    role: "Administración",
    unread: 1,
    lastMessage: "¿Cuándo llega el pedido de Toyota?",
    lastTime: "Ayer",
    online: false,
  },
  {
    id: "4",
    name: "Sofía Herrera",
    role: "Caja",
    unread: 0,
    lastMessage: "El cierre de ayer quedó bien",
    lastTime: "Ayer",
    online: false,
  },
];

export const MOCK_MESSAGES: Record<string, MockMessage[]> = {
  "1": [
    {
      id: "1",
      from: "them",
      time: "10:05",
      type: "text",
      text: "Che, necesito que me mandes la lista de filtros para el Ford Ranger",
    },
    {
      id: "2",
      from: "me",
      time: "10:08",
      type: "text",
      text: "Ahora te la paso, espera un segundo",
    },
    {
      id: "3",
      from: "me",
      time: "10:15",
      type: "product-list",
      payload: {
        items: [
          { id: 1, name: "Filtro de aceite Ford Ranger", brand: "Bosch", quantity: 3, price: 450, subtotal: 1350 },
          { id: 2, name: "Pastillas de freno delanteras", brand: "Brembo", quantity: 1, price: 890, subtotal: 890 },
          { id: 3, name: "Aceite 10W40 sintético", brand: "Castrol", quantity: 2, price: 340, subtotal: 680 },
        ],
        total: 2920,
      },
    },
    {
      id: "4",
      from: "them",
      time: "10:32",
      type: "text",
      text: "Los repuestos ya están listos para despacho",
    },
  ],
  "2": [
    { id: "1", from: "me", time: "09:00", type: "text", text: "Laura, el cliente de las 11 viene por la revisión del Hilux" },
    { id: "2", from: "them", time: "09:14", type: "text", text: "Ok, entendido. Lo proceso ahora" },
  ],
  "3": [
    { id: "1", from: "them", time: "Ayer", type: "text", text: "¿Cuándo llega el pedido de Toyota?" },
  ],
  "4": [
    { id: "1", from: "them", time: "Ayer", type: "text", text: "El cierre de ayer quedó bien" },
  ],
};
