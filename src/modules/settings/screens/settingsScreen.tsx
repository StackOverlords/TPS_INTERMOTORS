import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/atoms/card";
import { Bell, Code, Database, HardDrive, Link, Palette, Settings2, Settings as SettingsIcon, Shield, RefreshCw } from "lucide-react";
import { useState } from "react";
import AdvancedSettings from "../components/settings/AdvancedSettings";
import AppearanceSettings from "../components/settings/AppearanceSettings";
import BackupSettings from "../components/settings/BackupSettings";
import IntegrationSettings from "../components/settings/IntegrationSettings";
import MasterDataSettings from "../components/settings/MasterDataSettings";
import NotificationSettings from "../components/settings/NotificationSettings";
import SecuritySettings from "../components/settings/SecuritySettings";
import { SettingsNavigation } from "../components/settings/SettingsNavigation";
import SystemSettings from "../components/settings/SystemSettings";
import UpdateSettings from "../components/settings/UpdateSettings";

export type SettingsSection = {
    id: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    description: string;
    component: React.ComponentType;
};

const settingsSections: SettingsSection[] = [
    // {
    //     id: "navigation",
    //     label: "Navegación",
    //     icon: Database,
    //     description: "Configura el estilo de navegación",
    //     component: NavigationSettings,
    // },
    {
        id: "master-data",
        label: "Datos Maestros",
        icon: Database,
        description: "Gestiona los datos maestros del sistema",
        component: MasterDataSettings,
    },
    {
        id: "appearance",
        label: "Apariencia",
        icon: Palette,
        description: "Personaliza el tema y colores",
        component: AppearanceSettings,
    },
    {
        id: "system",
        label: "Sistema",
        icon: SettingsIcon,
        description: "Configuraciones de cuenta y sistema",
        component: SystemSettings,
    },
    {
        id: "backups",
        label: "Respaldos",
        icon: HardDrive,
        description: "Gestiona copias de seguridad",
        component: BackupSettings,
    },
    {
        id: "integrations",
        label: "Integraciones",
        icon: Link,
        description: "APIs y conexiones externas",
        component: IntegrationSettings,
    },
    {
        id: "security",
        label: "Seguridad",
        icon: Shield,
        description: "Permisos y control de acceso",
        component: SecuritySettings,
    },
    {
        id: "notifications",
        label: "Notificaciones",
        icon: Bell,
        description: "Alertas y notificaciones",
        component: NotificationSettings,
    },
    {
        id: "advanced",
        label: "Avanzado",
        icon: Code,
        description: "Configuraciones avanzadas",
        component: AdvancedSettings,
    },
    {
        id: "updates",
        label: "Actualizaciones",
        icon: RefreshCw,
        description: "Gestiona las actualizaciones de la aplicación",
        component: UpdateSettings,
    },
];

const SettingsScreen = () => {
    const [activeSection, setActiveSection] = useState('master-data');

    const currentSection = settingsSections.find(section => section.id === activeSection);
    const CurrentComponent = currentSection?.component || MasterDataSettings;
    return (
        <main className="max-w-7xl mx-auto space-y-2">
            {/* Header */}
            <header className="border-gray-200 border bg-white rounded-lg p-2 sm:p-3">
                <div className="flex flex-wrap gap-2 items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Settings2 className="h-6 w-6 lg:h-8 lg:w-8 text-gray-700" />
                        <div>
                            <h1 className="text-lg lg:text-xl font-bold text-gray-900 leading-tight">
                                Configuración
                            </h1>
                            <p className="text-sm text-gray-500">Gestiona la configuración del sistema</p>
                        </div>
                    </div >
                </div >
            </header >

            <div className="flex flex-col space-y-4">
                <SettingsNavigation
                    sections={settingsSections}
                    activeSection={activeSection}
                    onSectionChange={setActiveSection}
                />
                
                {/* Current Section Content */}
                <Card className="shadow-none">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            {currentSection && <currentSection.icon className="size-4" />}
                            {currentSection?.label}
                        </CardTitle>
                        <CardDescription className="">
                            {currentSection?.description}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <CurrentComponent />
                    </CardContent>
                </Card>
            </div>
        </main>
    )
}
export default SettingsScreen