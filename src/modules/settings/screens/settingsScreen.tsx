import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/atoms/card";
import {
  // Bell,
  Code,
  Database,
  Eye,
  HardDrive,
  Keyboard,
  // Link,
  Package,
  Palette,
  RefreshCw,
  Settings,
  // Settings as SettingsIcon,
  Shield,
} from "lucide-react";
import { useState } from "react";
import AdvancedSettings from '../components/settings/AdvancedSettings';
import AppearanceSettings from "../components/settings/AppearanceSettings";
import BackupSettings from "../components/settings/BackupSettings";
// import IntegrationSettings from '../components/settings/IntegrationSettings';
import KeybindingsSettings from "../components/settings/KeybindingsSettings";
import MasterDataSettings from "../components/settings/MasterDataSettings";
// import NotificationSettings from '../components/settings/NotificationSettings';
import PluginSettings from "../components/settings/PluginSettings";
import SecuritySettings from '../components/settings/SecuritySettings';
import { SettingsNavigation } from "../components/settings/SettingsNavigation";
// import SystemSettings from '../components/settings/SystemSettings';
import UpdateSettings from "../components/settings/UpdateSettings";
import ViewSettings from "../components/settings/ViewSettings";
import { cn } from "@/lib/utils";

export type SettingsSection = {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  component: React.ComponentType;
  stickyHeader?: boolean;
};

const settingsSections: SettingsSection[] = [
  {
    id: "master-data",
    label: "Datos Maestros",
    icon: Database,
    description: "Gestiona los datos maestros del sistema",
    component: MasterDataSettings,
    stickyHeader: false,
  },
  {
    id: "views",
    label: "Vistas",
    icon: Eye,
    description: "Personaliza la funcionalidad de cada vista",
    component: ViewSettings,
    stickyHeader: true,
  },
  {
    id: "appearance",
    label: "Apariencia",
    icon: Palette,
    description: "Personaliza el tema y colores",
    component: AppearanceSettings,
    stickyHeader: false,
  },
  {
    id: "keybindings",
    label: "Atajos",
    icon: Keyboard,
    description: "Personaliza los atajos de teclado",
    component: KeybindingsSettings,
    stickyHeader: false,
  },
  // {
  //   id: 'system',
  //   label: 'Sistema',
  //   icon: SettingsIcon,
  //   description: 'Configuraciones de cuenta y sistema',
  //   component: SystemSettings,
  //   stickyHeader: false,
  // },
  {
    id: "backups",
    label: "Respaldos",
    icon: HardDrive,
    description: "Gestiona copias de seguridad",
    component: BackupSettings,
    stickyHeader: false,
  },
  // {
  //   id: 'integrations',
  //   label: 'Integraciones',
  //   icon: Link,
  //   description: 'APIs y conexiones externas',
  //   component: IntegrationSettings,
  //   stickyHeader: false,
  // },
  {
    id: 'security',
    label: 'Seguridad',
    icon: Shield,
    description: 'Permisos y control de acceso',
    component: SecuritySettings,
    stickyHeader: false,
  },
  // {
  //   id: 'notifications',
  //   label: 'Notificaciones',
  //   icon: Bell,
  //   description: 'Alertas y notificaciones',
  //   component: NotificationSettings,
  //   stickyHeader: false,
  // },
  {
    id: 'advanced',
    label: 'Avanzado',
    icon: Code,
    description: 'Configuraciones avanzadas del sistema',
    component: AdvancedSettings,
    stickyHeader: false,
  },
  {
    id: 'plugins',
    label: 'Plugins',
    icon: Package,
    description: 'Gestiona los plugins instalados en el sistema',
    component: PluginSettings,
    stickyHeader: false,
  },
  {
    id: "updates",
    label: "Actualizaciones",
    icon: RefreshCw,
    description: "Gestiona las actualizaciones de la aplicación",
    component: UpdateSettings,
    stickyHeader: true,
  },
];

const SettingsScreen = () => {
  const [activeSection, setActiveSection] = useState("master-data");

  const currentSection = settingsSections.find(
    (section) => section.id === activeSection
  );
  const CurrentComponent = currentSection?.component || MasterDataSettings;

  // Hook para ventana de configuración de vistas
  // const viewWindow = useViewConfigRoutesWindowConfig({
  //   context: 'settings',
  // });

  const handleChangeSection = (section: string) => {
    // if (section === 'views') {
    //   // Abrir ventana de Tauri para ViewSettings
    //   if (!viewWindow.isOpen) {
    //     viewWindow.open();
    //   }
    //   return;
    // }
    // setActiveSection(section);
    // // Cerrar ventana de vistas si está abierta y cambiar sección
    // if (viewWindow.isOpen) {
    //   viewWindow.close();
    // }
    setActiveSection(section);
  };
  return (
    <main className="max-w-7xl mx-auto space-y-2 p-2 flex flex-col h-full overflow-hidden">
      {/* Header */}
      <header className="border-border border bg-background rounded-lg p-2 sm:px-3 sm:py-2 flex-shrink-0">
        <div className="flex flex-wrap gap-2 items-center justify-between">
          <div className="flex items-center gap-3">
            <Settings className="size-5 lg:size-7 text-foreground" />
            <div>
              <h1 className="text-lg lg:text-xl font-bold text-foreground leading-tight">
                Configuración
              </h1>
              <p className="text-xs text-muted-foreground">
                Gestiona la configuración del sistema
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 min-h-0">
        <div className="flex flex-col space-y-2 h-full">
          <SettingsNavigation
            sections={settingsSections}
            activeSection={activeSection}
            onSectionChange={handleChangeSection}
          />

          {/* Current Section Content */}
          <Card className="shadow-none min-h-0 flex-1 overflow-auto bg-transparent border-none">
            <div className="h-full flex flex-col">
              <CardHeader
                className={cn(
                  "space-y-0.5 px-0 pt-0",
                  currentSection?.stickyHeader && "flex-shrink-0"
                )}
              >
                <CardTitle className="flex items-center gap-2 text-base">
                  {currentSection && <currentSection.icon className="size-4" />}
                  {currentSection?.label}
                </CardTitle>
                <CardDescription className="text-xs">
                  {currentSection?.description}
                </CardDescription>
              </CardHeader>
              <CardContent
                className={cn(
                  "p-0",
                  currentSection?.stickyHeader && "flex-1 min-h-0 overflow-auto"
                )}
              >
                <CurrentComponent />
              </CardContent>
            </div>
          </Card>
        </div>
      </div>
    </main>
  );
};
export default SettingsScreen;
