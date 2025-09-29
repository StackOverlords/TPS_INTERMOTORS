import { Card, CardContent } from "@/components/atoms/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/atoms/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/atoms/select";
import { Button } from "@/components/atoms/button";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/atoms/sidebar";
import { cn } from "@/lib/utils";

export type SettingsSection = {
    id: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    description: string;
    component: React.ComponentType;
};

interface SettingsNavigationProps {
    sections: SettingsSection[];
    activeSection: string;
    onSectionChange: (sectionId: string) => void;
}
type NavigationType = 'tabs' | 'sidebar' | 'dropdown' | 'grid' | 'list' | 'dashboard';
export const SettingsNavigation: React.FC<SettingsNavigationProps> = ({
    sections,
    activeSection,
    onSectionChange
}) => {
    const navigationType: NavigationType = "tabs" as NavigationType;

    const renderTabsNavigation = () => (
        <Tabs value={activeSection} onValueChange={onSectionChange} className="space-y-6">
            <div className="border-b border-border">
                <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8 bg-transparent h-auto p-0 space-x-0">
                    {sections.map((section) => {
                        const Icon = section.icon;
                        return (
                            <TabsTrigger
                                key={section.id}
                                value={section.id}
                                className={cn(
                                    "flex flex-col items-center gap-1 p-2 h-auto rounded-none border-b-2 border-transparent",
                                    "data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary",
                                    "hover:bg-muted/50 hover:text-foreground transition-all duration-200"
                                )}
                            >
                                <Icon className="size-4" />
                                <span className="text-xs font-medium hidden sm:block">{section.label}</span>
                            </TabsTrigger>
                        );
                    })}
                </TabsList>
            </div>
        </Tabs>
    );

    const renderSidebarNavigation = () => (
        <div className="flex">
            <Sidebar className="w-64 border-r">
                <SidebarContent>
                    <SidebarGroup>
                        <SidebarGroupLabel>Configuración</SidebarGroupLabel>
                        <SidebarGroupContent>
                            <SidebarMenu>
                                {sections.map((section) => {
                                    const Icon = section.icon;
                                    return (
                                        <SidebarMenuItem key={section.id}>
                                            <SidebarMenuButton
                                                onClick={() => onSectionChange(section.id)}
                                                className={cn(
                                                    "w-full justify-start",
                                                    activeSection === section.id && "bg-primary/10 text-primary"
                                                )}
                                            >
                                                <Icon className="h-4 w-4" />
                                                <span>{section.label}</span>
                                            </SidebarMenuButton>
                                        </SidebarMenuItem>
                                    );
                                })}
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>
                </SidebarContent>
            </Sidebar>
            <div className="flex-1 pl-6"></div>
        </div>
    );

    const renderDropdownNavigation = () => (
        <div className="mb-6">
            <Select value={activeSection} onValueChange={onSectionChange}>
                <SelectTrigger className="w-full max-w-xs">
                    <SelectValue placeholder="Seleccionar sección" />
                </SelectTrigger>
                <SelectContent>
                    {sections.map((section) => {
                        const Icon = section.icon;
                        return (
                            <SelectItem key={section.id} value={section.id}>
                                <div className="flex items-center gap-2">
                                    <Icon className="h-4 w-4" />
                                    <span>{section.label}</span>
                                </div>
                            </SelectItem>
                        );
                    })}
                </SelectContent>
            </Select>
        </div>
    );

    const renderGridNavigation = () => (
        <div className="mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sections.map((section) => {
                    const Icon = section.icon;
                    return (
                        <Card
                            key={section.id}
                            className={cn(
                                "cursor-pointer transition-all duration-200 hover:shadow-md",
                                activeSection === section.id
                                    ? "border-primary bg-primary/5"
                                    : "hover:border-primary/50"
                            )}
                            onClick={() => onSectionChange(section.id)}
                        >
                            <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className={cn(
                                        "p-2 rounded-lg",
                                        activeSection === section.id ? "bg-primary/10" : "bg-muted"
                                    )}>
                                        <Icon className={cn(
                                            "h-5 w-5",
                                            activeSection === section.id ? "text-primary" : "text-muted-foreground"
                                        )} />
                                    </div>
                                    <div>
                                        <h3 className="font-medium">{section.label}</h3>
                                        <p className="text-xs text-muted-foreground">{section.description}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </div>
    );

    const renderDashboardNavigation = () => (
        <div className="mb-6">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {sections.map((section) => {
                    const Icon = section.icon;
                    return (
                        <Button
                            key={section.id}
                            variant={activeSection === section.id ? "default" : "outline"}
                            className={cn(
                                "h-20 flex-col gap-2",
                                activeSection === section.id && "bg-primary text-primary-foreground"
                            )}
                            onClick={() => onSectionChange(section.id)}
                        >
                            <Icon className="h-6 w-6" />
                            <span className="text-xs">{section.label}</span>
                        </Button>
                    );
                })}
            </div>
        </div>
    );

    switch (navigationType) {
        case 'sidebar':
            return renderSidebarNavigation();
        case 'dropdown':
            return renderDropdownNavigation();
        case 'grid':
            return renderGridNavigation();
        case 'dashboard':
            return renderDashboardNavigation();
        case 'tabs':
        default:
            return renderTabsNavigation();
    }
};