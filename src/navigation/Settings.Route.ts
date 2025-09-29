import OriginsScreen from "@/modules/settings/screens/OriginsScreen";
import BrandsScreen from "@/modules/settings/screens/brandsScreen";
import CategoriesScreen from "@/modules/settings/screens/categoriesScreen";
import MeasurementsScreen from "@/modules/settings/screens/measurementScreen";
import SettingsScreen from "@/modules/settings/screens/settingsScreen";
import SubcategoriesScreen from "@/modules/settings/screens/subcategoriesScreen";
import VehicleBrandsScreen from "@/modules/settings/screens/vehicleBrandScreen";
import { Car, FolderOpen, Layers, MapPin, Ruler, Settings, Tag } from "lucide-react";
import type RouteType from "./RouteType";

const settingsProtectedRoutes: RouteType[] = [ 
  {
    path: "/dashboard/settings",
    name: "Configuración",
    type: "protected",
    element: SettingsScreen,
    isAdmin: true,
    role: ["admin"],
    isHeader: false,
    showSidebar: false,
    showInCommandPalette: true,
    icon: Settings,
    subRoutes: [
      {
        path: "/dashboard/settings/origins",
        name: "Procedencias",
        type: "protected",
        element: OriginsScreen,
        isAdmin: true,
        role: ["admin"],
        isHeader: false,
        showSidebar: false,
        showInCommandPalette: true,
        icon: MapPin
      },
      {
        path: "/dashboard/settings/brands",
        name: "Marcas",
        type: "protected",
        element: BrandsScreen,
        isAdmin: true,
        role: ["admin"],
        isHeader: false,
        showSidebar: false,
        showInCommandPalette: true,
        icon: Tag
      },
      {
        path: "/dashboard/settings/vehicle-brands",
        name: "Marcas de Vehículo",
        type: "protected",
        element: VehicleBrandsScreen,
        isAdmin: true,
        role: ["admin"],
        isHeader: false,
        showSidebar: false,
        showInCommandPalette: true,
        icon: Car
      },
      {
        path: "/dashboard/settings/measurements",
        name: "Medidas",
        type: "protected",
        element: MeasurementsScreen,
        isAdmin: true,
        role: ["admin"],
        isHeader: false,
        showSidebar: false,
        showInCommandPalette: true,
        icon: Ruler
      },
      {
        path: "/dashboard/settings/subcategories",
        name: "Subcategorías",
        type: "protected",
        element: SubcategoriesScreen,
        isAdmin: true,
        role: ["admin"],
        isHeader: false,
        showSidebar: false,
        showInCommandPalette: true,
        icon: Layers
      },
      {
        path: "/dashboard/settings/categories",
        name: "Categorías",
        type: "protected",
        element: CategoriesScreen,
        isAdmin: true,
        role: ["admin"],
        isHeader: false,
        showSidebar: false,
        showInCommandPalette: true,
        icon: FolderOpen
      },
    ]
  },
];

export default settingsProtectedRoutes;