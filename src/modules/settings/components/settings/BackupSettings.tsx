import { Download, Upload, RefreshCw, HardDrive, Calendar, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/atoms/card";
import { Button } from "@/components/atoms/button";
import { Badge } from "@/components/atoms/badge";
import { Progress } from "@/components/atoms/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/atoms/select";
import { Switch } from "@/components/atoms/switch";
import { Label } from "@/components/atoms/label";
import { Separator } from "@/components/atoms/separator";

const BackupSettings = () => {
    return (
        <div className="space-y-6">
            {/* Backup Status */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <HardDrive className="h-5 w-5" />
                        Estado de Respaldos
                    </CardTitle>
                    <CardDescription>
                        Información sobre el último respaldo y estado actual
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-4 rounded-lg bg-green-50 border border-green-200">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-full bg-green-100">
                                <HardDrive className="h-4 w-4 text-green-600" />
                            </div>
                            <div>
                                <p className="font-medium text-green-800">Último respaldo exitoso</p>
                                <p className="text-sm text-green-600">Hoy a las 3:00 AM</p>
                            </div>
                        </div>
                        <Badge className="bg-green-100 text-green-800">Completo</Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="text-center p-4 rounded-lg border">
                            <div className="text-2xl font-bold text-primary">156 MB</div>
                            <p className="text-sm text-muted-foreground">Tamaño total</p>
                        </div>
                        <div className="text-center p-4 rounded-lg border">
                            <div className="text-2xl font-bold text-primary">247</div>
                            <p className="text-sm text-muted-foreground">Archivos respaldados</p>
                        </div>
                        <div className="text-center p-4 rounded-lg border">
                            <div className="text-2xl font-bold text-primary">99.8%</div>
                            <p className="text-sm text-muted-foreground">Tasa de éxito</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Automatic Backups */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <RefreshCw className="h-5 w-5" />
                        Respaldos Automáticos
                    </CardTitle>
                    <CardDescription>
                        Configura la frecuencia y tipo de respaldos automáticos
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label>Respaldos automáticos</Label>
                            <p className="text-sm text-muted-foreground">Crear respaldos de forma automática</p>
                        </div>
                        <Switch defaultChecked />
                    </div>

                    <Separator />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Frecuencia</Label>
                            <Select>
                                <SelectTrigger>
                                    <SelectValue placeholder="Diario" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="hourly">Cada hora</SelectItem>
                                    <SelectItem value="daily">Diario</SelectItem>
                                    <SelectItem value="weekly">Semanal</SelectItem>
                                    <SelectItem value="monthly">Mensual</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Hora programada</Label>
                            <Select>
                                <SelectTrigger>
                                    <SelectValue placeholder="3:00 AM" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="01:00">1:00 AM</SelectItem>
                                    <SelectItem value="02:00">2:00 AM</SelectItem>
                                    <SelectItem value="03:00">3:00 AM</SelectItem>
                                    <SelectItem value="04:00">4:00 AM</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <Label>Retención de respaldos</Label>
                        <Select>
                            <SelectTrigger>
                                <SelectValue placeholder="Mantener por 30 días" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="7">7 días</SelectItem>
                                <SelectItem value="30">30 días</SelectItem>
                                <SelectItem value="90">90 días</SelectItem>
                                <SelectItem value="365">1 año</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Manual Backup */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Download className="h-5 w-5" />
                        Respaldo Manual
                    </CardTitle>
                    <CardDescription>
                        Crear un respaldo inmediato de tus datos
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex flex-col sm:flex-row gap-3">
                        <Button className="flex-1 gap-2">
                            <Download className="h-4 w-4" />
                            Crear respaldo completo
                        </Button>
                        <Button variant="outline" className="flex-1 gap-2">
                            <Download className="h-4 w-4" />
                            Respaldo incremental
                        </Button>
                    </div>

                    <div className="p-4 rounded-lg bg-muted">
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="h-5 w-5 text-orange-500 flex-shrink-0 mt-0.5" />
                            <div className="text-sm">
                                <p className="font-medium">Importante</p>
                                <p className="text-muted-foreground">
                                    El respaldo completo puede tomar varios minutos dependiendo del tamaño de tus datos.
                                </p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Restore Options */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Upload className="h-5 w-5" />
                        Restaurar Datos
                    </CardTitle>
                    <CardDescription>
                        Restaura tus datos desde un respaldo anterior
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-4">
                        <div className="p-4 rounded-lg border">
                            <div className="flex items-center justify-between mb-2">
                                <span className="font-medium">Respaldo del 25 Sep 2024</span>
                                <Badge variant="outline">156 MB</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-3">3:00 AM - Respaldo completo</p>
                            <Button size="sm" variant="outline">Restaurar</Button>
                        </div>

                        <div className="p-4 rounded-lg border">
                            <div className="flex items-center justify-between mb-2">
                                <span className="font-medium">Respaldo del 24 Sep 2024</span>
                                <Badge variant="outline">154 MB</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-3">3:00 AM - Respaldo completo</p>
                            <Button size="sm" variant="outline">Restaurar</Button>
                        </div>

                        <div className="p-4 rounded-lg border">
                            <div className="flex items-center justify-between mb-2">
                                <span className="font-medium">Respaldo del 23 Sep 2024</span>
                                <Badge variant="outline">152 MB</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-3">3:00 AM - Respaldo completo</p>
                            <Button size="sm" variant="outline">Restaurar</Button>
                        </div>
                    </div>

                    <Button variant="outline" className="w-full gap-2">
                        <Calendar className="h-4 w-4" />
                        Ver todos los respaldos
                    </Button>
                </CardContent>
            </Card>

            {/* Storage Usage */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <HardDrive className="h-5 w-5" />
                        Uso de Almacenamiento
                    </CardTitle>
                    <CardDescription>
                        Espacio utilizado para respaldos
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span>Almacenamiento utilizado</span>
                            <span>1.2 GB de 10 GB</span>
                        </div>
                        <Progress value={12} className="h-2" />
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-center">
                        <div className="p-3 rounded-lg bg-muted">
                            <div className="text-lg font-semibold">1.2 GB</div>
                            <p className="text-xs text-muted-foreground">Utilizado</p>
                        </div>
                        <div className="p-3 rounded-lg bg-muted">
                            <div className="text-lg font-semibold">8.8 GB</div>
                            <p className="text-xs text-muted-foreground">Disponible</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
export default BackupSettings;