import { Package, ShoppingBag, Table2, Truck } from "lucide-react";
import type RouteType from "./RouteType";
import OrderListScreen from "@/modules/orders/screens/orderListScreen";
import OrderCreateScreen from "@/modules/orders/screens/orderCreateScreen";
import OrderEditScreen from "@/modules/orders/screens/orderEditScreen";
import OrderDetailScreen from "@/modules/orders/screens/orderDetailScreen";
import { ordersListViewConfig } from "@/modules/orders/config/order.config";

const ordersProtectedRoutes: RouteType[] = [
    {
        name: "Pedidos",
        type: "protected",
        isAdmin: false,
        role: ["admin"],
        icon: Truck,
        isHeader: true,
        showSidebar: true,
        subRoutes: [
            {
                path: "/dashboard/create-order",
                name: "Registrar pedido",
                type: "protected",
                element: OrderCreateScreen,
                isAdmin: true,
                role: ["admin"],
                icon: ShoppingBag,

                isHeader: false,
                showSidebar: true
            },
            {
                path: "/dashboard/orders",
                name: "Lista de pedidos",
                type: "protected",
                element: OrderListScreen,
                isAdmin: true,
                role: ["admin"],
                icon: Table2,
                viewConfig: ordersListViewConfig,
                isHeader: false,
                showSidebar: true
            },
            {
                path: "/dashboard/orders/:orderCod",
                name: "Detalle de Pedido",
                type: "protected",
                element: OrderDetailScreen,
                isAdmin: true,
                role: ["admin"],
                icon: Package,
                isHeader: false,
                showSidebar: false,
                showInCommandPalette: false
            },
            {
                path: "/dashboard/orders/:orderId/update",
                name: "Editar Pedido",
                type: "protected",
                element: OrderEditScreen,
                isAdmin: true,
                role: ["admin"],
                isHeader: false,
                showSidebar: false,
                showInCommandPalette: false
            },
        ]
    },
];

export default ordersProtectedRoutes;