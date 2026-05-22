import { Shield, Users } from "lucide-react";
import { useNavigate } from "react-router";
import ConfigCard from "../configCard";

const securitySections = [
  {
    key: "permisos",
    href: "/dashboard/settings/permissions",
    title: "Permisos",
    description: "Asigna permisos a usuarios por sucursal",
    icon: Shield,
    iconClassName:
      "bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400",
  },
  {
    key: "usuarios",
    href: "/dashboard/users",
    title: "Usuarios",
    description: "Gestiona los usuarios del sistema",
    icon: Users,
    iconClassName:
      "bg-slate-100 text-slate-600 dark:bg-slate-900/30 dark:text-slate-400",
  },
];

const SecuritySettings = () => {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2">
      {securitySections.map((section) => (
        <ConfigCard
          key={section.key}
          title={section.title}
          description={section.description}
          icon={section.icon}
          iconClassName={section.iconClassName}
          count={0}
          onView={() => navigate(section.href)}
          onAdd={() => navigate(section.href)}
        />
      ))}
    </div>
  );
};

export default SecuritySettings;
