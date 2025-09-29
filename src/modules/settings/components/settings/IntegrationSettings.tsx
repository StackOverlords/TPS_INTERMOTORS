import { Link, Key, Globe, Zap, CheckCircle, XCircle, Settings } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/atoms/card";
import { Button } from "@/components/atoms/button";
import { Badge } from "@/components/atoms/badge";
import { Input } from "@/components/atoms/input";
import { Label } from "@/components/atoms/label";
import { Switch } from "@/components/atoms/switch";
import { Separator } from "@/components/atoms/separator";

type Integration = {
    id: string;
    name: string;
    description: string;
    status: "connected" | "disconnected" | "error";
    icon: string;
    color: string;
};

const integrations: Integration[] = [
    {
        id: "api",
        name: "API REST",
        description: "Conexión con sistemas externos vía API",
        status: "connected",
        icon: "🔗",
        color: "bg-blue-500",
    },
    {
        id: "webhook",
        name: "Webhooks",
        description: "Notificaciones automáticas de eventos",
        status: "connected",
        icon: "⚡",
        color: "bg-yellow-500",
    },
    {
        id: "sap",
        name: "SAP",
        description: "Integración con sistema SAP",
        status: "disconnected",
        icon: "💼",
        color: "bg-gray-500",
    },
    {
        id: "email",
        name: "Servicio de Email",
        description: "SMTP para envío de correos",
        status: "connected",
        icon: "📧",
        color: "bg-green-500",
    },
    {
        id: "sms",
        name: "SMS Gateway",
        description: "Envío de mensajes SMS",
        status: "error",
        icon: "📱",
        color: "bg-red-500",
    },
];

const IntegrationSettings = () => {
    return (
        <div className="space-y-6">
            {/* API Configuration */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Key className="h-5 w-5" />
                        Configuración de API
                    </CardTitle>
                    <CardDescription>
                        Gestiona las claves API y configuraciones de acceso
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="api-key">Clave API Principal</Label>
                            <div className="flex gap-2">
                                <Input
                                    id="api-key"
                                    type="password"
                                    placeholder="sk-1234567890abcdef..."
                                    className="flex-1"
                                />
                                <Button variant="outline">Regenerar</Button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="base-url">URL Base</Label>
                            <Input
                                id="base-url"
                                placeholder="https://api.intermotors.com"
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Logs de API</Label>
                                <p className="text-sm text-muted-foreground">Registrar todas las llamadas a la API</p>
                            </div>
                            <Switch defaultChecked />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Active Integrations */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Link className="h-5 w-5" />
                        Integraciones Activas
                    </CardTitle>
                    <CardDescription>
                        Estado y configuración de las integraciones conectadas
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {integrations.map((integration) => (
                        <div key={integration.id} className="flex items-center justify-between p-4 rounded-lg border">
                            <div className="flex items-center gap-3">
                                <div className="text-2xl">{integration.icon}</div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h4 className="font-medium">{integration.name}</h4>
                                        {integration.status === "connected" && (
                                            <Badge className="bg-green-100 text-green-800">
                                                <CheckCircle className="h-3 w-3 mr-1" />
                                                Conectado
                                            </Badge>
                                        )}
                                        {integration.status === "disconnected" && (
                                            <Badge variant="secondary">
                                                <XCircle className="h-3 w-3 mr-1" />
                                                Desconectado
                                            </Badge>
                                        )}
                                        {integration.status === "error" && (
                                            <Badge className="bg-red-100 text-red-800">
                                                <XCircle className="h-3 w-3 mr-1" />
                                                Error
                                            </Badge>
                                        )}
                                    </div>
                                    <p className="text-sm text-muted-foreground">{integration.description}</p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm">
                                    <Settings className="h-4 w-4 mr-1" />
                                    Configurar
                                </Button>
                                {integration.status === "disconnected" ? (
                                    <Button size="sm">Conectar</Button>
                                ) : (
                                    <Button variant="outline" size="sm">Desconectar</Button>
                                )}
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>

            {/* Webhook Configuration */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Zap className="h-5 w-5" />
                        Configuración de Webhooks
                    </CardTitle>
                    <CardDescription>
                        URLs de webhook para notificaciones automáticas
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="webhook-url">URL de Webhook</Label>
                            <Input
                                id="webhook-url"
                                placeholder="https://tu-servidor.com/webhook"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="webhook-secret">Secreto de Webhook</Label>
                            <Input
                                id="webhook-secret"
                                type="password"
                                placeholder="whsec_..."
                            />
                        </div>

                        <Separator />

                        <div className="space-y-3">
                            <Label>Eventos a notificar</Label>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm">Nuevo producto creado</span>
                                    <Switch defaultChecked />
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm">Actualización de inventario</span>
                                    <Switch defaultChecked />
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm">Nueva venta</span>
                                    <Switch />
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm">Cambio de precios</span>
                                    <Switch />
                                </div>
                            </div>
                        </div>

                        <Button className="w-full">Probar Webhook</Button>
                    </div>
                </CardContent>
            </Card>

            {/* External Services */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Globe className="h-5 w-5" />
                        Servicios Externos
                    </CardTitle>
                    <CardDescription>
                        Configuración de servicios de terceros
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-4">
                        <div className="p-4 rounded-lg border">
                            <div className="flex items-center justify-between mb-3">
                                <div>
                                    <h4 className="font-medium">Google Analytics</h4>
                                    <p className="text-sm text-muted-foreground">Seguimiento y análisis web</p>
                                </div>
                                <Switch />
                            </div>
                            <Input placeholder="GA-XXXXXXXXX" />
                        </div>

                        <div className="p-4 rounded-lg border">
                            <div className="flex items-center justify-between mb-3">
                                <div>
                                    <h4 className="font-medium">Google Maps</h4>
                                    <p className="text-sm text-muted-foreground">Integración de mapas y geolocalización</p>
                                </div>
                                <Switch defaultChecked />
                            </div>
                            <Input placeholder="AIzaSyC..." />
                        </div>

                        <div className="p-4 rounded-lg border">
                            <div className="flex items-center justify-between mb-3">
                                <div>
                                    <h4 className="font-medium">PayPal</h4>
                                    <p className="text-sm text-muted-foreground">Procesamiento de pagos</p>
                                </div>
                                <Switch />
                            </div>
                            <Input placeholder="Client ID" />
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
export default IntegrationSettings;