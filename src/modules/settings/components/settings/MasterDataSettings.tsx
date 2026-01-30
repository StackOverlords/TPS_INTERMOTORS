import {
  Car,
  FolderOpen,
  GitBranchIcon,
  // Layers,
  MapPin,
  Ruler,
  Tag,
  Truck,
  Users,
} from "lucide-react";
import { useNavigate } from "react-router";
import ConfigCard from "../configCard";

const configSections = [
  {
    key: "sucursales",
    href: "/dashboard/settings/branches",
    title: "Sucursales",
    description: "Gestiona las sucursales de la aplicación",
    icon: GitBranchIcon,
    iconClassName: "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400",
  },
  {
    key: "categorias",
    href: "/dashboard/settings/categories",
    title: "Divisiónes",
    description: "Divisiónes principales",
    icon: FolderOpen,
    iconClassName: "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400",
  },
  // {
  //   key: 'subcategorias',
  //   href: '/dashboard/settings/subcategories',
  //   title: 'Subcategorías',
  //   description: 'Subcategorías por categoría',
  //   icon: Layers,
  //   iconClassName: 'bg-orange-100 text-orange-600',
  // },
  {
    key: "procedencias",
    href: "/dashboard/settings/origins",
    title: "Procedencias",
    description: "Origen de los productos",
    icon: MapPin,
    iconClassName: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
  },
  {
    key: "marcas",
    href: "/dashboard/settings/brands",
    title: "Marcas",
    description: "Marcas de productos",
    icon: Tag,
    iconClassName: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400",
  },
  {
    key: "marcasVehiculo",
    href: "/dashboard/settings/vehicle-brands",
    title: "Marcas de Vehículo",
    description: "Marcas de vehículos",
    icon: Car,
    iconClassName: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
  },
  {
    key: "medidas",
    href: "/dashboard/settings/measurements",
    title: "Medidas",
    description: "Medidas de productos",
    icon: Ruler,
    iconClassName: "bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400",
  },
  {
    key: "proveedores",
    href: "/dashboard/settings/providers",
    title: "Proveedores",
    description: "Proveedores de productos",
    icon: Truck,
    iconClassName: "bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400",
  },
  {
    key: "clientes",
    href: "/dashboard/settings/customers",
    title: "Clientes",
    description: "Gestiona los clientes",
    icon: Users,
    iconClassName: "bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400",
  },
];

const MasterDataSettings = () => {
  const navigate = useNavigate();

  const handleOnView = (href: string) => {
    navigate(href);
  };

  const handleOnAdd = (href: string) => {
    navigate(href, {
      state: {
        openModal: true,
      },
    });
  };
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2">
      {configSections.map((section) => {
        return (
          <ConfigCard
            key={section.key}
            title={section.title}
            description={section.description}
            icon={section.icon}
            iconClassName={section.iconClassName}
            count={5}
            onView={() => {
              handleOnView(section.href);
            }}
            onAdd={() => {
              handleOnAdd(section.href);
            }}
          />
        );
      })}
    </div>
  );
};

export default MasterDataSettings;
