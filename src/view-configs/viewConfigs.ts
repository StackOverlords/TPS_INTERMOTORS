import { userDetailsConfig, userListConfig } from "@/modules/users/config/user.config";
import type { ViewConfiguration } from "./viewConfigTypes";
import { productsListViewConfig } from "@/modules/products/config/product.config";
import { salesListViewConfig } from "@/modules/sales/config/sale.config";

export const viewConfigs: Record<string, ViewConfiguration> = {
    // Usuarios
    'users-list': userListConfig,
    'user-detail': userDetailsConfig,

    // Productos
    'products-list': productsListViewConfig,

    //ventas
    'sales-list': salesListViewConfig
};

export const getAllViewConfigs = () => Object.values(viewConfigs);

export const getConfigsByModule = (module: string) =>
    Object.values(viewConfigs).filter((config) => config.module === module);

export const getConfigById = (id: string) => viewConfigs[id];