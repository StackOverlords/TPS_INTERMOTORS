import { Clock, Globe, Settings } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/atoms/card";
import { Button } from "@/components/atoms/button";
// import { Input } from "@/components/atoms/input";
import { Label } from "@/components/atoms/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/atoms/select";
import { Switch } from "@/components/atoms/switch";
import { Separator } from "@/components/atoms/separator";

const SystemSettings = () => {
    return (
        <div className="space-y-6">
            {/* Account Information */}
            {/* <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <User className="h-5 w-5" />
                        Información de Cuenta
                    </CardTitle>
                    <CardDescription>
                        Gestiona tu información personal y de cuenta
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Nombre completo</Label>
                            <Input id="name" placeholder="Juan Pérez" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Correo electrónico</Label>
                            <Input id="email" type="email" placeholder="juan@intermotors.com" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phone">Teléfono</Label>
                            <Input id="phone" placeholder="+1 234 567 8900" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="role">Rol</Label>
                            <Select>
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar rol" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="admin">Administrador</SelectItem>
                                    <SelectItem value="manager">Gerente</SelectItem>
                                    <SelectItem value="user">Usuario</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <Button className="mt-4">Guardar cambios</Button>
                </CardContent>
            </Card> */}

            {/* Regional Settings */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Globe className="h-5 w-5" />
                        Configuración Regional
                    </CardTitle>
                    <CardDescription>
                        Ajusta el idioma, zona horaria y formato de datos
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Idioma</Label>
                            <Select>
                                <SelectTrigger>
                                    <SelectValue placeholder="Español" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="es">Español</SelectItem>
                                    <SelectItem value="en">English</SelectItem>
                                    <SelectItem value="pt">Português</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Zona horaria</Label>
                            <Select>
                                <SelectTrigger>
                                    <SelectValue placeholder="America/Mexico_City" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="america/mexico_city">America/Mexico_City</SelectItem>
                                    <SelectItem value="america/new_york">America/New_York</SelectItem>
                                    <SelectItem value="america/los_angeles">America/Los_Angeles</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Formato de fecha</Label>
                            <Select>
                                <SelectTrigger>
                                    <SelectValue placeholder="DD/MM/YYYY" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="dd/mm/yyyy">DD/MM/YYYY</SelectItem>
                                    <SelectItem value="mm/dd/yyyy">MM/DD/YYYY</SelectItem>
                                    <SelectItem value="yyyy-mm-dd">YYYY-MM-DD</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Moneda</Label>
                            <Select>
                                <SelectTrigger>
                                    <SelectValue placeholder="MXN ($)" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="mxn">MXN ($)</SelectItem>
                                    <SelectItem value="usd">USD ($)</SelectItem>
                                    <SelectItem value="eur">EUR (€)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* System Preferences */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Settings className="h-5 w-5" />
                        Preferencias del Sistema
                    </CardTitle>
                    <CardDescription>
                        Configuraciones generales del comportamiento del sistema
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Inicio de sesión automático</Label>
                                <p className="text-sm text-muted-foreground">Mantener sesión iniciada por 30 días</p>
                            </div>
                            <Switch />
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Confirmación de eliminación</Label>
                                <p className="text-sm text-muted-foreground">Mostrar confirmación antes de eliminar elementos</p>
                            </div>
                            <Switch defaultChecked />
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Autoguardado</Label>
                                <p className="text-sm text-muted-foreground">Guardar cambios automáticamente cada 5 minutos</p>
                            </div>
                            <Switch defaultChecked />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Session Management */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Clock className="h-5 w-5" />
                        Gestión de Sesiones
                    </CardTitle>
                    <CardDescription>
                        Controla el tiempo de sesión y accesos activos
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-sm">Tiempo de inactividad</span>
                            <Select>
                                <SelectTrigger className="w-32">
                                    <SelectValue placeholder="30 min" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="15">15 min</SelectItem>
                                    <SelectItem value="30">30 min</SelectItem>
                                    <SelectItem value="60">1 hora</SelectItem>
                                    <SelectItem value="120">2 horas</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <Separator />
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-sm">Sesiones activas</span>
                            <span className="text-sm text-muted-foreground">2 dispositivos</span>
                        </div>
                        <Button variant="outline" size="sm">Ver sesiones activas</Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
export default SystemSettings;