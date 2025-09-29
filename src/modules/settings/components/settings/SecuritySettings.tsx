import { Shield, Key, Users, Eye, Lock, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/atoms/card";
import { Button } from "@/components/atoms/button";
import { Badge } from "@/components/atoms/badge";
import { Label } from "@/components/atoms/label";
import { Switch } from "@/components/atoms/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/atoms/select";
import { Separator } from "@/components/atoms/separator";

const SecuritySettings = () => {
    return (
        <div className="space-y-6">
            {/* Password Policy */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Lock className="h-5 w-5" />
                        Política de Contraseñas
                    </CardTitle>
                    <CardDescription>
                        Configura los requisitos de seguridad para contraseñas
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Longitud mínima</Label>
                                <p className="text-sm text-muted-foreground">Número mínimo de caracteres</p>
                            </div>
                            <Select>
                                <SelectTrigger className="w-20">
                                    <SelectValue placeholder="8" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="6">6</SelectItem>
                                    <SelectItem value="8">8</SelectItem>
                                    <SelectItem value="10">10</SelectItem>
                                    <SelectItem value="12">12</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <Separator />

                        <div className="space-y-3">
                            <Label>Requisitos obligatorios</Label>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm">Incluir mayúsculas</span>
                                    <Switch defaultChecked />
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm">Incluir minúsculas</span>
                                    <Switch defaultChecked />
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm">Incluir números</span>
                                    <Switch defaultChecked />
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm">Incluir caracteres especiales</span>
                                    <Switch />
                                </div>
                            </div>
                        </div>

                        <Separator />

                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Caducidad de contraseñas</Label>
                                <p className="text-sm text-muted-foreground">Días antes de requerir cambio</p>
                            </div>
                            <Select>
                                <SelectTrigger className="w-24">
                                    <SelectValue placeholder="90" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="30">30</SelectItem>
                                    <SelectItem value="60">60</SelectItem>
                                    <SelectItem value="90">90</SelectItem>
                                    <SelectItem value="never">Nunca</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Two-Factor Authentication */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Key className="h-5 w-5" />
                        Autenticación de Dos Factores
                    </CardTitle>
                    <CardDescription>
                        Aumenta la seguridad con verificación adicional
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-4 rounded-lg bg-muted">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-full bg-green-100">
                                <Shield className="h-4 w-4 text-green-600" />
                            </div>
                            <div>
                                <p className="font-medium">2FA Activado</p>
                                <p className="text-sm text-muted-foreground">Tu cuenta está protegida</p>
                            </div>
                        </div>
                        <Badge className="bg-green-100 text-green-800">Activo</Badge>
                    </div>

                    <div className="space-y-3">
                        <Label>Métodos de verificación</Label>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between p-3 rounded-lg border">
                                <div className="flex items-center gap-3">
                                    <div className="text-lg">📱</div>
                                    <div>
                                        <p className="font-medium">Aplicación Authenticator</p>
                                        <p className="text-sm text-muted-foreground">Google Authenticator, Authy</p>
                                    </div>
                                </div>
                                <Switch defaultChecked />
                            </div>

                            <div className="flex items-center justify-between p-3 rounded-lg border">
                                <div className="flex items-center gap-3">
                                    <div className="text-lg">📧</div>
                                    <div>
                                        <p className="font-medium">Código por email</p>
                                        <p className="text-sm text-muted-foreground">admin@intermotors.com</p>
                                    </div>
                                </div>
                                <Switch />
                            </div>

                            <div className="flex items-center justify-between p-3 rounded-lg border">
                                <div className="flex items-center gap-3">
                                    <div className="text-lg">📱</div>
                                    <div>
                                        <p className="font-medium">SMS</p>
                                        <p className="text-sm text-muted-foreground">+52 55 1234 5678</p>
                                    </div>
                                </div>
                                <Switch />
                            </div>
                        </div>
                    </div>

                    <Button variant="outline" className="w-full">
                        Configurar códigos de respaldo
                    </Button>
                </CardContent>
            </Card>

            {/* User Permissions */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Permisos de Usuario
                    </CardTitle>
                    <CardDescription>
                        Gestiona roles y permisos del sistema
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-4">
                        <div className="p-4 rounded-lg border">
                            <div className="flex items-center justify-between mb-3">
                                <div>
                                    <h4 className="font-medium">Administrador</h4>
                                    <p className="text-sm text-muted-foreground">Acceso completo al sistema</p>
                                </div>
                                <Badge>3 usuarios</Badge>
                            </div>
                            <div className="flex flex-wrap gap-2 text-xs">
                                <Badge variant="secondary">Crear</Badge>
                                <Badge variant="secondary">Leer</Badge>
                                <Badge variant="secondary">Actualizar</Badge>
                                <Badge variant="secondary">Eliminar</Badge>
                                <Badge variant="secondary">Configurar</Badge>
                            </div>
                        </div>

                        <div className="p-4 rounded-lg border">
                            <div className="flex items-center justify-between mb-3">
                                <div>
                                    <h4 className="font-medium">Gerente</h4>
                                    <p className="text-sm text-muted-foreground">Gestión operativa</p>
                                </div>
                                <Badge>5 usuarios</Badge>
                            </div>
                            <div className="flex flex-wrap gap-2 text-xs">
                                <Badge variant="secondary">Crear</Badge>
                                <Badge variant="secondary">Leer</Badge>
                                <Badge variant="secondary">Actualizar</Badge>
                                <Badge variant="outline">Eliminar</Badge>
                            </div>
                        </div>

                        <div className="p-4 rounded-lg border">
                            <div className="flex items-center justify-between mb-3">
                                <div>
                                    <h4 className="font-medium">Usuario</h4>
                                    <p className="text-sm text-muted-foreground">Acceso básico</p>
                                </div>
                                <Badge>12 usuarios</Badge>
                            </div>
                            <div className="flex flex-wrap gap-2 text-xs">
                                <Badge variant="outline">Crear</Badge>
                                <Badge variant="secondary">Leer</Badge>
                                <Badge variant="outline">Actualizar</Badge>
                                <Badge variant="outline">Eliminar</Badge>
                            </div>
                        </div>
                    </div>

                    <Button variant="outline" className="w-full">
                        Gestionar roles y permisos
                    </Button>
                </CardContent>
            </Card>

            {/* Access Control */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Eye className="h-5 w-5" />
                        Control de Acceso
                    </CardTitle>
                    <CardDescription>
                        Configuraciones de acceso y restricciones
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Restricción por IP</Label>
                                <p className="text-sm text-muted-foreground">Limitar acceso desde IPs específicas</p>
                            </div>
                            <Switch />
                        </div>

                        <Separator />

                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Horarios de acceso</Label>
                                <p className="text-sm text-muted-foreground">Restringir acceso fuera del horario laboral</p>
                            </div>
                            <Switch />
                        </div>

                        <Separator />

                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Máximo intentos de login</Label>
                                <p className="text-sm text-muted-foreground">Número de intentos antes de bloquear</p>
                            </div>
                            <Select>
                                <SelectTrigger className="w-16">
                                    <SelectValue placeholder="3" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="3">3</SelectItem>
                                    <SelectItem value="5">5</SelectItem>
                                    <SelectItem value="10">10</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <Separator />

                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Duración del bloqueo</Label>
                                <p className="text-sm text-muted-foreground">Tiempo de bloqueo tras intentos fallidos</p>
                            </div>
                            <Select>
                                <SelectTrigger className="w-24">
                                    <SelectValue placeholder="15m" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="5">5 min</SelectItem>
                                    <SelectItem value="15">15 min</SelectItem>
                                    <SelectItem value="30">30 min</SelectItem>
                                    <SelectItem value="60">1 hora</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Security Alerts */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5" />
                        Alertas de Seguridad
                    </CardTitle>
                    <CardDescription>
                        Actividad sospechosa y alertas recientes
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-3">
                        <div className="p-4 rounded-lg bg-yellow-50 border border-yellow-200">
                            <div className="flex items-start gap-3">
                                <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-medium text-yellow-800">Inicio de sesión desde nueva ubicación</p>
                                    <p className="text-sm text-yellow-600">Hace 2 horas - Ciudad de México, México</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 rounded-lg bg-green-50 border border-green-200">
                            <div className="flex items-start gap-3">
                                <Shield className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-medium text-green-800">Contraseña actualizada</p>
                                    <p className="text-sm text-green-600">Hace 1 día - Cambio exitoso</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <Button variant="outline" className="w-full">
                        Ver historial completo
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
};
export default SecuritySettings;