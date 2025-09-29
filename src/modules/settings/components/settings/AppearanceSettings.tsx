import { Monitor, Sun, Moon, Palette, Type, Layout, Paintbrush, Eye, Table, Zap, Plus, Package, Upload, Building2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/atoms/card";
import { Button } from "@/components/atoms/button";
import { Badge } from "@/components/atoms/badge";
import { Separator } from "@/components/atoms/separator";
import { Slider } from "@/components/atoms/slider";
import ThemeCard from "../ThemeCard";
import { useRef } from "react";

const AppearanceSettings = () => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    // const [customColor, setCustomColor] = useState('');

    const brandColors = [
        '#374151', '#059669', '#3B82F6', '#7C3AED',
        '#DC2626', '#DB2777', '#EA580C', '#CA8A04'
    ];

    const ColorPalette = ({ colors, selected, onSelect }: any) => (
        <div className="flex gap-2 flex-wrap">
            {colors.map((color: string) => (
                <div
                    key={color}
                    className={`w-8 h-8 rounded-full cursor-pointer border-2 ${selected === color ? 'border-foreground' : 'border-transparent'
                        } hover:scale-110 transition-transform`}
                    style={{ backgroundColor: color }}
                    onClick={() => onSelect(color)}
                />
            ))}
            <div
                className="w-8 h-8 rounded-full border-2 border-dashed border-muted-foreground flex items-center justify-center cursor-pointer hover:scale-110 transition-transform"
                onClick={() => {
                    const color = prompt('Ingresa un color en formato hex (ej: #FF5733)');
                    if (color && /^#[0-9A-F]{6}$/i.test(color)) {
                        onSelect(color);
                    }
                }}
            >
                <Plus className="w-4 h-4" />
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            {/* Company Logo */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Building2 className="h-5 w-5" />
                        Logo de la Empresa
                    </CardTitle>
                    <CardDescription>
                        Actualiza el logo de tu empresa
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-lg bg-primary/10 border-2 border-dashed border-primary/30 flex items-center justify-center relative overflow-hidden">
                            <Package className="w-8 h-8 text-primary" />
                            {/* {settings.logo ? (
                                <img
                                    src={settings.logo}
                                    alt="Company Logo"
                                    className="w-full h-full object-contain"
                                />
                            ) : (
                                <Package className="w-8 h-8 text-primary" />
                            )} */}
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                className="gap-2"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <Upload className="w-4 h-4" />
                                Subir Logo
                                {/* {settings.logo ? 'Cambiar logo' : 'Subir logo'} */}
                            </Button>
                            {/* {settings.logo && (
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => updateLogo(null)}
                                    className="text-destructive hover:text-destructive"
                                >
                                    <X className="w-4 h-4" />
                                </Button>
                            )} */}
                        </div>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            // onChange={handleLogoUpload}
                            className="hidden"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Brand Color */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Palette className="h-5 w-5" />
                        Color de Marca
                    </CardTitle>
                    <CardDescription>
                        Selecciona o personaliza tu color de marca
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <ColorPalette
                        colors={brandColors}
                    // selected={settings.brandColor}
                    // onSelect={updateBrandColor}
                    />
                    <div className="flex items-center gap-2">
                        <input
                            type="color"
                            // value={settings.brandColor}
                            // onChange={(e) => updateBrandColor(e.target.value)}
                            className="w-8 h-8 rounded border cursor-pointer"
                        />
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>{brandColors[0]}</span>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                        // onClick={() => updateBrandColor('#3B82F6')}
                        >
                            Restablecer
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Theme Selection */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Sun className="h-5 w-5" />
                        Tema
                    </CardTitle>
                    <CardDescription>
                        Selecciona el tema de la interfaz
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <div className="relative group cursor-pointer">
                                <div className="w-full h-20 sm:hidden rounded-lg border-2 border-primary bg-background flex items-center justify-center">
                                    <Sun className="h-6 w-6 text-foreground" />
                                </div>
                                <div className="w-full h-50 hidden sm:flex rounded-lg border-2 border-primary bg-gray-50 justify-center items-end overflow-hidden">
                                    {/* mockup dashboard */}
                                    <div className="w-11/12 h-11/12">
                                        <ThemeCard
                                            theme="light"
                                        />
                                    </div>
                                </div>

                                <Badge className="absolute -top-2 -right-2 bg-primary">Activo</Badge>
                            </div>
                            <p className="text-sm text-center">Claro</p>
                        </div>
                        <div className="space-y-2">
                            <div className="relative group cursor-pointer">
                                <div className="w-full sm:hidden h-20 rounded-lg border border-border bg-gray-900 flex items-center justify-center hover:border-primary transition-colors">
                                    <Moon className="h-6 w-6 text-white" />
                                </div>
                                <div className="w-full h-50 hidden sm:flex rounded-lg border-2 border-primary bg-gray-900 justify-center items-end overflow-hidden">
                                    {/* mockup dashboard */}
                                    <div className="w-11/12 h-11/12">
                                        <ThemeCard
                                            theme="dark"
                                        />
                                    </div>
                                </div>
                            </div>
                            <p className="text-sm text-center">Oscuro</p>
                        </div>
                        <div className="space-y-2">
                            <div className="relative group cursor-pointer">
                                <div className="w-full sm:hidden h-20 rounded-lg border border-border bg-gradient-to-b from-gray-200 to-gray-50 flex items-center justify-center hover:border-primary transition-colors">
                                    <Monitor className="h-6 w-6 text-foreground" />
                                </div>
                                <div className="w-full h-50 hidden sm:flex rounded-lg border-2 border-gray-200 bg-gradient-to-r from-gray-50 from-50% to-gray-900 to-50% justify-center items-end overflow-hidden">
                                    {/* mockup dashboard */}
                                    <div className="w-11/12 h-11/12">
                                        <ThemeCard
                                            theme="system"
                                        />
                                    </div>
                                </div>
                            </div>
                            <p className="text-sm text-center">Sistema</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Color Scheme */}
            {/* <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Palette className="h-5 w-5" />
                        Esquema de Colores
                    </CardTitle>
                    <CardDescription>
                        Personaliza los colores principales del sistema
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                            { name: "Azul", color: "bg-blue-500", active: true },
                            { name: "Verde", color: "bg-green-500", active: false },
                            { name: "Púrpura", color: "bg-purple-500", active: false },
                            { name: "Naranja", color: "bg-orange-500", active: false },
                        ].map((scheme) => (
                            <div key={scheme.name} className="space-y-2">
                                <div className="relative group cursor-pointer">
                                    <div className={`w-full h-16 rounded-lg ${scheme.color} ${scheme.active ? 'ring-2 ring-primary ring-offset-2' : ''} hover:scale-105 transition-transform`}>
                                    </div>
                                    {scheme.active && <Badge className="absolute -top-2 -right-2 bg-primary">Activo</Badge>}
                                </div>
                                <p className="text-sm text-center">{scheme.name}</p>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card> */}

            {/* Typography */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Type className="h-5 w-5" />
                        Tipografía
                    </CardTitle>
                    <CardDescription>
                        Ajusta el tamaño y tipo de fuente
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-sm">Tamaño de fuente</span>
                            <Badge variant="outline">Mediano</Badge>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm">Pequeño</Button>
                            <Button size="sm">Mediano</Button>
                            <Button variant="outline" size="sm">Grande</Button>
                        </div>
                    </div>
                    <Separator />
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-sm">Fuente del sistema</span>
                            <Badge variant="outline">Inter</Badge>
                        </div>
                        <div className="flex gap-2">
                            <Button size="sm">Inter</Button>
                            <Button variant="outline" size="sm">Roboto</Button>
                            <Button variant="outline" size="sm">Open Sans</Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Table Colors */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Table className="h-5 w-5" />
                        Colores de Tablas
                    </CardTitle>
                    <CardDescription>
                        Personaliza los colores de filas, encabezados y estados de las tablas
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium">Fila seleccionada</p>
                                <p className="text-sm text-muted-foreground">Color cuando una fila está seleccionada</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded bg-primary/20 border border-primary/30"></div>
                                <Button variant="outline" size="sm">Cambiar</Button>
                            </div>
                        </div>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium">Fila hover</p>
                                <p className="text-sm text-muted-foreground">Color al pasar el mouse sobre una fila</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded bg-muted border"></div>
                                <Button variant="outline" size="sm">Cambiar</Button>
                            </div>
                        </div>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium">Encabezado</p>
                                <p className="text-sm text-muted-foreground">Color de fondo del encabezado de tabla</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded bg-card border-2"></div>
                                <Button variant="outline" size="sm">Cambiar</Button>
                            </div>
                        </div>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium">Filas alternas</p>
                                <p className="text-sm text-muted-foreground">Color para filas intercaladas (zebra)</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded bg-muted/50 border"></div>
                                <Button variant="outline" size="sm">Cambiar</Button>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Interactive Elements */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Zap className="h-5 w-5" />
                        Elementos Interactivos
                    </CardTitle>
                    <CardDescription>
                        Colores para botones, enlaces y estados de elementos
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-3">
                            <h4 className="font-medium">Estados de Botones</h4>
                            <div className="space-y-2">
                                {[
                                    { name: "Principal", bg: "bg-primary", text: "Botón primario" },
                                    { name: "Secundario", bg: "bg-secondary", text: "Botón secundario" },
                                    { name: "Destructivo", bg: "bg-destructive", text: "Botón peligro" },
                                    { name: "Éxito", bg: "bg-green-500", text: "Botón éxito" },
                                ].map((btn) => (
                                    <div key={btn.name} className="flex items-center justify-between">
                                        <span className="text-sm">{btn.name}</span>
                                        <div className="flex items-center gap-2">
                                            <div className={`px-3 py-1 rounded text-xs text-white ${btn.bg}`}>
                                                {btn.text}
                                            </div>
                                            <Button variant="outline" size="sm">Editar</Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="space-y-3">
                            <h4 className="font-medium">Enlaces y Textos</h4>
                            <div className="space-y-2">
                                {[
                                    { name: "Enlace normal", color: "text-primary" },
                                    { name: "Enlace visitado", color: "text-purple-600" },
                                    { name: "Texto de error", color: "text-destructive" },
                                    { name: "Texto de éxito", color: "text-green-600" },
                                ].map((link) => (
                                    <div key={link.name} className="flex items-center justify-between">
                                        <span className="text-sm">{link.name}</span>
                                        <div className="flex items-center gap-2">
                                            <span className={`text-sm underline ${link.color}`}>Ejemplo</span>
                                            <Button variant="outline" size="sm">Editar</Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Accessibility */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Eye className="h-5 w-5" />
                        Accesibilidad
                    </CardTitle>
                    <CardDescription>
                        Configuraciones para mejorar la accesibilidad visual
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-4">
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium">Contraste alto</p>
                                    <p className="text-sm text-muted-foreground">Aumenta el contraste de colores</p>
                                </div>
                                <Button variant="outline" size="sm">Desactivado</Button>
                            </div>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium">Tamaño de focus</p>
                                    <p className="text-sm text-muted-foreground">Grosor del borde de enfoque</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Slider defaultValue={[2]} max={6} min={1} step={1} className="w-20" />
                                    <Badge variant="outline">2px</Badge>
                                </div>
                            </div>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium">Reducir animaciones</p>
                                    <p className="text-sm text-muted-foreground">Minimiza las transiciones y efectos</p>
                                </div>
                                <Button variant="outline" size="sm">Desactivado</Button>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Custom Colors */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Paintbrush className="h-5 w-5" />
                        Colores Personalizados
                    </CardTitle>
                    <CardDescription>
                        Crea tu propia paleta de colores personalizada
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
                        {[
                            "#3B82F6", "#EF4444", "#10B981", "#F59E0B",
                            "#8B5CF6", "#EC4899", "#14B8A6", "#F97316",
                        ].map((color, index) => (
                            <div key={index} className="space-y-2">
                                <div
                                    className="w-full h-12 rounded-lg border-2 border-border cursor-pointer hover:scale-105 transition-transform"
                                    style={{ backgroundColor: color }}
                                ></div>
                                <div className="text-xs text-center font-mono text-muted-foreground">
                                    {color}
                                </div>
                            </div>
                        ))}
                    </div>
                    <Separator />
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" className="gap-2">
                            <Plus className="h-4 w-4" />
                            Agregar Color
                        </Button>
                        <Button variant="outline" size="sm">Importar Paleta</Button>
                        <Button variant="outline" size="sm">Exportar</Button>
                    </div>
                </CardContent>
            </Card>

            {/* Layout */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Layout className="h-5 w-5" />
                        Diseño y Espaciado
                    </CardTitle>
                    <CardDescription>
                        Configuraciones de diseño, espaciado y disposición
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-4">
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Ancho del contenido</span>
                                <Badge variant="outline">Estándar</Badge>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm">Compacto</Button>
                                <Button size="sm">Estándar</Button>
                                <Button variant="outline" size="sm">Amplio</Button>
                            </div>
                        </div>
                        <Separator />
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium">Espaciado entre elementos</p>
                                    <p className="text-sm text-muted-foreground">Separación entre componentes</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Slider defaultValue={[16]} max={32} min={8} step={4} className="w-20" />
                                    <Badge variant="outline">16px</Badge>
                                </div>
                            </div>
                        </div>
                        <Separator />
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Radio de bordes</span>
                                <Badge variant="outline">Mediano</Badge>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm">Sin radio</Button>
                                <Button variant="outline" size="sm">Pequeño</Button>
                                <Button size="sm">Mediano</Button>
                                <Button variant="outline" size="sm">Grande</Button>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
export default AppearanceSettings;