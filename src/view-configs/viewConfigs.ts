import { userDetailsConfig, userListConfig } from "@/modules/users/config/user.config";
import type { ViewConfiguration } from "./viewConfigTypes";
import { productsListViewConfig } from "@/modules/products/config/product.config";
import { salesListViewConfig } from "@/modules/sales/config/sale.config";
import { quotationsListViewConfig } from "@/modules/quotations/config/quotation.config";
import { returnsListViewConfig } from "@/modules/returns/config/return.config";
import { ordersListViewConfig } from "@/modules/orders/config/order.config";

export const viewConfigs: Record<string, ViewConfiguration> = {
    // Usuarios
    'users-list': userListConfig,
    'user-detail': userDetailsConfig,

    // Productos
    'products-list': productsListViewConfig,

    //ventas
    'sales-list': salesListViewConfig,

    //cotizaciones
    'quotations-list': quotationsListViewConfig,

    //devoluciones
    'returns-list': returnsListViewConfig,

    //pedidos
    'orders-list': ordersListViewConfig,
};

export const getAllViewConfigs = () => Object.values(viewConfigs);

export const getConfigsByModule = (module: string) =>
    Object.values(viewConfigs).filter((config) => config.module === module);

export const getConfigById = (id: string) => viewConfigs[id];