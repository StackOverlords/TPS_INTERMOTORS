import { Badge } from "@/components/atoms/badge";
import { Button } from "@/components/atoms/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/atoms/card";
import { Input } from "@/components/atoms/input";
import { Label } from "@/components/atoms/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/atoms/select";
import { Separator } from "@/components/atoms/separator";
import { Switch } from "@/components/atoms/switch";
import { Textarea } from "@/components/atoms/textarea";
import { Code, Database, Zap, FileText, Settings, Trash2, Download, AlertTriangle } from "lucide-react";

const AdvancedSettings = () => {
    return (
        <div className="space-y-6">
            {/* Developer Settings */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Code className="h-5 w-5" />
                        Configuraciones de Desarrollo
                    </CardTitle>
                    <CardDescription>
                        Opciones avanzadas para desarrolladores y administradores
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Modo debug</Label>
                                <p className="text-sm text-muted-foreground">Mostrar información de depuración en la consola</p>
                            </div>
                            <Switch />
                        </div>

                        <Separator />

                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Logs detallados</Label>
                                <p className="text-sm text-muted-foreground">Registrar todas las operaciones del sistema</p>
                            </div>
                            <Switch defaultChecked />
                        </div>

                        <Separator />

                        <div className="space-y-2">
                            <Label>Nivel de logging</Label>
                            <Select>
                                <SelectTrigger>
                                    <SelectValue placeholder="INFO" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="debug">DEBUG</SelectItem>
                                    <SelectItem value="info">INFO</SelectItem>
                                    <SelectItem value="warn">WARN</SelectItem>
                                    <SelectItem value="error">ERROR</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <Separator />

                        <div className="space-y-2">
                            <Label htmlFor="api-timeout">Timeout de API (segundos)</Label>
                            <Input
                                id="api-timeout"
                                type="number"
                                placeholder="30"
                                className="w-32"
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Database Settings */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Database className="h-5 w-5" />
                        Configuración de Base de Datos
                    </CardTitle>
                    <CardDescription>
                        Optimización y mantenimiento de la base de datos
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="text-center p-4 rounded-lg border">
                            <div className="text-2xl font-bold text-primary">2.1 GB</div>
                            <p className="text-sm text-muted-foreground">Tamaño de BD</p>
                        </div>
                        <div className="text-center p-4 rounded-lg border">
                            <div className="text-2xl font-bold text-primary">15,847</div>
                            <p className="text-sm text-muted-foreground">Total registros</p>
                        </div>
                        <div className="text-center p-4 rounded-lg border">
                            <div className="text-2xl font-bold text-primary">12 ms</div>
                            <p className="text-sm text-muted-foreground">Tiempo resp. prom.</p>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-sm">Optimización automática</span>
                            <Switch defaultChecked />
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm">Limpieza de logs antiguos</span>
                            <Switch defaultChecked />
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm">Compresión de datos</span>
                            <Switch />
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                            Optimizar BD
                        </Button>
                        <Button variant="outline" size="sm">
                            Analizar índices
                        </Button>
                        <Button variant="outline" size="sm">
                            Limpiar caché
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Performance Settings */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Zap className="h-5 w-5" />
                        Optimización de Rendimiento
                    </CardTitle>
                    <CardDescription>
                        Configuraciones para mejorar el rendimiento del sistema
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Tamaño de caché (MB)</Label>
                            <Input type="number" placeholder="512" className="w-32" />
                        </div>

                        <div className="space-y-2">
                            <Label>Tiempo de vida de caché (minutos)</Label>
                            <Select>
                                <SelectTrigger>
                                    <SelectValue placeholder="15" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="5">5 minutos</SelectItem>
                                    <SelectItem value="15">15 minutos</SelectItem>
                                    <SelectItem value="30">30 minutos</SelectItem>
                                    <SelectItem value="60">1 hora</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <Separator />

                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Compresión de respuestas</Label>
                                <p className="text-sm text-muted-foreground">Comprimir datos enviados al cliente</p>
                            </div>
                            <Switch defaultChecked />
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Lazy loading</Label>
                                <p className="text-sm text-muted-foreground">Cargar contenido bajo demanda</p>
                            </div>
                            <Switch defaultChecked />
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Precarga de datos</Label>
                                <p className="text-sm text-muted-foreground">Cargar datos frecuentes en segundo plano</p>
                            </div>
                            <Switch />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* System Logs */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Logs del Sistema
                    </CardTitle>
                    <CardDescription>
                        Acceso y gestión de logs del sistema
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="text-center p-3 rounded-lg border">
                            <Badge className="bg-blue-100 text-blue-800 mb-2">INFO</Badge>
                            <div className="text-lg font-semibold">1,247</div>
                            <p className="text-xs text-muted-foreground">Hoy</p>
                        </div>
                        <div className="text-center p-3 rounded-lg border">
                            <Badge className="bg-yellow-100 text-yellow-800 mb-2">WARN</Badge>
                            <div className="text-lg font-semibold">23</div>
                            <p className="text-xs text-muted-foreground">Hoy</p>
                        </div>
                        <div className="text-center p-3 rounded-lg border">
                            <Badge className="bg-red-100 text-red-800 mb-2">ERROR</Badge>
                            <div className="text-lg font-semibold">3</div>
                            <p className="text-xs text-muted-foreground">Hoy</p>
                        </div>
                        <div className="text-center p-3 rounded-lg border">
                            <Badge className="bg-gray-100 text-gray-800 mb-2">DEBUG</Badge>
                            <div className="text-lg font-semibold">456</div>
                            <p className="text-xs text-muted-foreground">Hoy</p>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                            <Download className="h-4 w-4 mr-1" />
                            Descargar logs
                        </Button>
                        <Button variant="outline" size="sm">
                            Ver logs en vivo
                        </Button>
                        <Button variant="outline" size="sm">
                            Configurar alertas
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Maintenance Mode */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Settings className="h-5 w-5" />
                        Modo Mantenimiento
                    </CardTitle>
                    <CardDescription>
                        Configurar el sistema para tareas de mantenimiento
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="p-4 rounded-lg bg-yellow-50 border border-yellow-200">
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="font-medium text-yellow-800">Modo mantenimiento desactivado</p>
                                <p className="text-sm text-yellow-600 mb-3">
                                    El sistema está operando normalmente.
                                </p>
                                <Button size="sm" variant="outline">
                                    Activar modo mantenimiento
                                </Button>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <Label htmlFor="maintenance-message">Mensaje personalizado</Label>
                        <Textarea
                            id="maintenance-message"
                            placeholder="El sistema está en mantenimiento. Volveremos pronto."
                            rows={3}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Duración estimada</Label>
                        <Select>
                            <SelectTrigger>
                                <SelectValue placeholder="2 horas" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="30min">30 minutos</SelectItem>
                                <SelectItem value="1h">1 hora</SelectItem>
                                <SelectItem value="2h">2 horas</SelectItem>
                                <SelectItem value="4h">4 horas</SelectItem>
                                <SelectItem value="indefinite">Indefinido</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Danger Zone */}
            <Card className="border-red-200">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-red-600">
                        <Trash2 className="h-5 w-5" />
                        Zona Peligrosa
                    </CardTitle>
                    <CardDescription>
                        Acciones irreversibles que pueden afectar el sistema
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-3">
                        <Button variant="outline" className="w-full justify-start text-red-600 border-red-200 hover:bg-red-50">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Limpiar todos los logs
                        </Button>

                        <Button variant="outline" className="w-full justify-start text-red-600 border-red-200 hover:bg-red-50">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Resetear configuraciones
                        </Button>

                        <Button variant="outline" className="w-full justify-start text-red-600 border-red-200 hover:bg-red-50">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Eliminar caché completo
                        </Button>
                    </div>

                    <div className="p-4 rounded-lg bg-red-50 border border-red-200">
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="font-medium text-red-800">¡Precaución!</p>
                                <p className="text-sm text-red-600">
                                    Estas acciones no se pueden deshacer y pueden afectar el funcionamiento del sistema.
                                </p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
export default AdvancedSettings;