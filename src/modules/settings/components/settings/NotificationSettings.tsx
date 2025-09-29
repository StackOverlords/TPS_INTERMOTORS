import { Bell, Mail, MessageSquare, Smartphone, Volume2, AlertCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/atoms/card";
import { Button } from "@/components/atoms/button";
import { Switch } from "@/components/atoms/switch";
import { Label } from "@/components/atoms/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/atoms/select";
import { Separator } from "@/components/atoms/separator";
import { Input } from "@/components/atoms/input";

const NotificationSettings = () => {
    return (
        <div className="space-y-6">
            {/* Email Notifications */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Mail className="h-5 w-5" />
                        Notificaciones por Email
                    </CardTitle>
                    <CardDescription>
                        Configura qué eventos te notificaremos por correo electrónico
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Resumen diario</Label>
                                <p className="text-sm text-muted-foreground">Estadísticas y actividades del día</p>
                            </div>
                            <Switch defaultChecked />
                        </div>

                        <Separator />

                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Nuevas ventas</Label>
                                <p className="text-sm text-muted-foreground">Cuando se registra una nueva venta</p>
                            </div>
                            <Switch defaultChecked />
                        </div>

                        <Separator />

                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Stock bajo</Label>
                                <p className="text-sm text-muted-foreground">Productos con inventario crítico</p>
                            </div>
                            <Switch defaultChecked />
                        </div>

                        <Separator />

                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Nuevos usuarios</Label>
                                <p className="text-sm text-muted-foreground">Registro de nuevos usuarios</p>
                            </div>
                            <Switch />
                        </div>

                        <Separator />

                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Reportes semanales</Label>
                                <p className="text-sm text-muted-foreground">Análisis semanal de rendimiento</p>
                            </div>
                            <Switch defaultChecked />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Horario de envío</Label>
                        <div className="grid grid-cols-2 gap-4">
                            <Select>
                                <SelectTrigger>
                                    <SelectValue placeholder="8:00 AM" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="06:00">6:00 AM</SelectItem>
                                    <SelectItem value="08:00">8:00 AM</SelectItem>
                                    <SelectItem value="10:00">10:00 AM</SelectItem>
                                    <SelectItem value="12:00">12:00 PM</SelectItem>
                                </SelectContent>
                            </Select>
                            <Select>
                                <SelectTrigger>
                                    <SelectValue placeholder="Zona horaria" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="mexico">México (GMT-6)</SelectItem>
                                    <SelectItem value="pacific">Pacífico (GMT-8)</SelectItem>
                                    <SelectItem value="eastern">Este (GMT-5)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Push Notifications */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Bell className="h-5 w-5" />
                        Notificaciones Push
                    </CardTitle>
                    <CardDescription>
                        Notificaciones instantáneas en el navegador
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="p-4 rounded-lg bg-muted">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="font-medium">Permiso requerido</p>
                                <p className="text-sm text-muted-foreground mb-3">
                                    Habilita las notificaciones del navegador para recibir alertas instantáneas.
                                </p>
                                <Button size="sm">Habilitar notificaciones</Button>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Ventas importantes</Label>
                                <p className="text-sm text-muted-foreground">Ventas superiores a $10,000</p>
                            </div>
                            <Switch />
                        </div>

                        <Separator />

                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Alertas del sistema</Label>
                                <p className="text-sm text-muted-foreground">Errores y problemas técnicos</p>
                            </div>
                            <Switch defaultChecked />
                        </div>

                        <Separator />

                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Mensajes urgentes</Label>
                                <p className="text-sm text-muted-foreground">Comunicaciones importantes</p>
                            </div>
                            <Switch defaultChecked />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* SMS Notifications */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Smartphone className="h-5 w-5" />
                        Notificaciones SMS
                    </CardTitle>
                    <CardDescription>
                        Alertas críticas por mensaje de texto
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="phone">Número de teléfono</Label>
                        <Input
                            id="phone"
                            placeholder="+52 55 1234 5678"
                            type="tel"
                        />
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Alertas de seguridad</Label>
                                <p className="text-sm text-muted-foreground">Intentos de acceso sospechosos</p>
                            </div>
                            <Switch defaultChecked />
                        </div>

                        <Separator />

                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Fallos del sistema</Label>
                                <p className="text-sm text-muted-foreground">Errores críticos del servidor</p>
                            </div>
                            <Switch defaultChecked />
                        </div>

                        <Separator />

                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Códigos de verificación</Label>
                                <p className="text-sm text-muted-foreground">2FA y verificaciones</p>
                            </div>
                            <Switch defaultChecked />
                        </div>
                    </div>

                    <Button variant="outline" className="w-full">
                        Verificar número de teléfono
                    </Button>
                </CardContent>
            </Card>

            {/* In-App Notifications */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <MessageSquare className="h-5 w-5" />
                        Notificaciones en la App
                    </CardTitle>
                    <CardDescription>
                        Configuraciones de notificaciones dentro del sistema
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Mostrar badge de notificaciones</Label>
                                <p className="text-sm text-muted-foreground">Contador en el icono de notificaciones</p>
                            </div>
                            <Switch defaultChecked />
                        </div>

                        <Separator />

                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Sonidos de notificación</Label>
                                <p className="text-sm text-muted-foreground">Reproducir sonido al recibir notificaciones</p>
                            </div>
                            <Switch />
                        </div>

                        <Separator />

                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Mostrar previews</Label>
                                <p className="text-sm text-muted-foreground">Vista previa del contenido de notificaciones</p>
                            </div>
                            <Switch defaultChecked />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Tiempo de permanencia</Label>
                        <Select>
                            <SelectTrigger>
                                <SelectValue placeholder="5 segundos" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="3">3 segundos</SelectItem>
                                <SelectItem value="5">5 segundos</SelectItem>
                                <SelectItem value="10">10 segundos</SelectItem>
                                <SelectItem value="manual">Manual</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Sound Settings */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Volume2 className="h-5 w-5" />
                        Configuración de Sonidos
                    </CardTitle>
                    <CardDescription>
                        Personaliza los sonidos de notificación
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-sm">Sonido para nuevas ventas</span>
                            <div className="flex gap-2">
                                <Select>
                                    <SelectTrigger className="w-32">
                                        <SelectValue placeholder="Campana" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="bell">Campana</SelectItem>
                                        <SelectItem value="chime">Carillón</SelectItem>
                                        <SelectItem value="ding">Ding</SelectItem>
                                        <SelectItem value="pop">Pop</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Button variant="outline" size="sm">
                                    ▶️
                                </Button>
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <span className="text-sm">Sonido para alertas</span>
                            <div className="flex gap-2">
                                <Select>
                                    <SelectTrigger className="w-32">
                                        <SelectValue placeholder="Alerta" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="alert">Alerta</SelectItem>
                                        <SelectItem value="warning">Advertencia</SelectItem>
                                        <SelectItem value="urgent">Urgente</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Button variant="outline" size="sm">
                                    ▶️
                                </Button>
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <span className="text-sm">Sonido para mensajes</span>
                            <div className="flex gap-2">
                                <Select>
                                    <SelectTrigger className="w-32">
                                        <SelectValue placeholder="Mensaje" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="message">Mensaje</SelectItem>
                                        <SelectItem value="notification">Notificación</SelectItem>
                                        <SelectItem value="subtle">Sutil</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Button variant="outline" size="sm">
                                    ▶️
                                </Button>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
export default NotificationSettings;