import { Button } from "@/components/atoms/button";
import { Input } from "@/components/atoms/input";
import {
  exportKeybindings,
  getAllKeybindings,
  importKeybindings,
  resetAllKeybindings
} from "@/database/schemas/keybindings.schema";
import keyBindings from "@/hooks/keyBindings/global.keys";
import { cn } from "@/lib/utils";
import { clearKeybindingsCache } from "@/services/keybindingsService";
import { FileDown, FileUp, RotateCcw, Search } from "lucide-react";
import { useEffect, useState } from "react";
import KeybindingRow from "../keyBindingRow";

// Nombres amigables para categorías
const categoryNames: Record<string, string> = {
  forms: 'Formularios',
  navigation: 'Navegación',
  modal: 'Modales',
  tableAndFilters: 'Tablas y Filtros',
  actions: 'Acciones'
};

const KeybindingsSettings = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [keybindings, setKeybindings] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);

  // Estructura plana de todos los keybindings con sus defaults
  const allKeybindings = Object.entries(keyBindings).flatMap(([category, bindings]) =>
    Object.entries(bindings).map(([action, config]) => ({
      id: `${category}.${action}`,
      category,
      action,
      defaultKeys: config.keys,
      description: config.description,
    }))
  );

  // Cargar keybindings desde la DB
  const loadKeybindings = async () => {
    try {
      setLoading(true);
      const customBindings = await getAllKeybindings();
      const bindingsMap = new Map<string, string>();

      customBindings.forEach((kb) => {
        bindingsMap.set(kb.id, kb.keys);
      });

      setKeybindings(bindingsMap);
    } catch (error) {
      // console.error('Error loading keybindings:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadKeybindings();
  }, []);

  // Detectar conflictos
  const detectConflicts = () => {
    const conflicts = new Set<string>();
    const keysMap = new Map<string, string[]>();

    allKeybindings.forEach((kb) => {
      const keys = keybindings.get(kb.id) || kb.defaultKeys;
      const existing = keysMap.get(keys) || [];
      existing.push(kb.id);
      keysMap.set(keys, existing);
    });

    keysMap.forEach((ids) => {
      if (ids.length > 1) {
        ids.forEach(id => conflicts.add(id));
      }
    });

    return conflicts;
  };

  // Obtener todas las combinaciones de teclas usadas (excepto la del id actual)
  const getUsedKeys = (excludeId: string): string[] => {
    return allKeybindings
      .filter(kb => kb.id !== excludeId)
      .map(kb => keybindings.get(kb.id) || kb.defaultKeys);
  };

  const conflicts = detectConflicts();

  // Filtrar keybindings según búsqueda
  const filteredKeybindings = allKeybindings.filter((kb) => {
    const query = searchQuery.toLowerCase();
    const currentKeys = keybindings.get(kb.id) || kb.defaultKeys;
    return (
      kb.description.toLowerCase().includes(query) ||
      kb.id.toLowerCase().includes(query) ||
      currentKeys.toLowerCase().includes(query) ||
      kb.category.toLowerCase().includes(query)
    );
  });

  // Agrupar por categoría
  const groupedByCategory = filteredKeybindings.reduce((acc, kb) => {
    if (!acc[kb.category]) {
      acc[kb.category] = [];
    }
    acc[kb.category].push(kb);
    return acc;
  }, {} as Record<string, typeof allKeybindings>);

  const handleEdit = async (id: string, keys: string) => {
    const kb = allKeybindings.find(k => k.id === id);
    if (!kb) return;

    try {
      const { saveKeybinding } = await import("@/database/schemas/keybindings.schema");
      await saveKeybinding(id, keys, kb.defaultKeys);
      await clearKeybindingsCache(); // Notificar hooks activos
      await loadKeybindings(); // Recargar UI
    } catch (error) {
      // console.error('Error saving keybinding:', error);
    }
  };

  const handleReset = async (id: string) => {
    try {
      const { deleteKeybinding } = await import("@/database/schemas/keybindings.schema");
      await deleteKeybinding(id);
      await clearKeybindingsCache(); // Notificar hooks activos
      await loadKeybindings(); // Recargar UI
    } catch (error) {
      // console.error('Error resetting keybinding:', error);
    }
  };

  const handleResetAll = async () => {
    if (!confirm('¿Estás seguro de restablecer todos los atajos a sus valores predeterminados?')) {
      return;
    }

    try {
      await resetAllKeybindings();
      await clearKeybindingsCache(); // Notificar hooks activos
      await loadKeybindings(); // Recargar UI
    } catch (error) {
      // console.error('Error resetting all keybindings:', error);
    }
  };

  const handleExport = async () => {
    try {
      const json = await exportKeybindings();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `keybindings-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      // console.error('Error exporting keybindings:', error);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      await importKeybindings(text);
      await loadKeybindings();
    } catch (error) {
      // console.error('Error importing keybindings:', error);
      alert('Error al importar los atajos de teclado. Verifica el formato del archivo.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-sm text-muted-foreground">Cargando atajos de teclado...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar compacto */}
      <div className="flex items-center gap-2 pb-2">
        {/* Búsqueda */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Buscar atajos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-8 text-sm"
          />
        </div>

        {/* Stats */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground ml-auto">
          <span>{filteredKeybindings.length} atajos</span>
          {keybindings.size > 0 && (
            <span className="text-primary">{keybindings.size} personalizados</span>
          )}
          {conflicts.size > 0 && (
            <span className="text-destructive">{conflicts.size} conflictos</span>
          )}
        </div>

        {/* Acciones */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleResetAll}
            className="h-8 gap-1.5 text-xs"
            title="Restablecer todo"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleExport}
            className="h-8 gap-1.5 text-xs"
            title="Exportar configuración"
          >
            <FileDown className="w-3.5 h-3.5" />
            Exportar
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1.5 text-xs"
            onClick={() => document.getElementById('import-keybindings')?.click()}
            title="Importar configuración"
          >
            <FileUp className="w-3.5 h-3.5" />
            Importar
          </Button>
          <input
            id="import-keybindings"
            type="file"
            accept=".json"
            onChange={handleImport}
            className="hidden"
          />
        </div>
      </div>

      {/* Lista estilo tabla VSCode */}
      <div className="overflow-hidden">
        {Object.entries(groupedByCategory).map(([category, items], categoryIndex) => (
          <div key={category} className={cn(categoryIndex > 0 && "mt-0")}>
            {/* Header de categoría */}
            <div className="bg-muted/100 px-3 py-1.5 border-b border-border/50">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {categoryNames[category] || category}
              </h3>
            </div>

            {/* Rows */}
            <div>
              {items.map((kb) => {
                const currentKeys = keybindings.get(kb.id) || kb.defaultKeys;
                const isCustom = keybindings.has(kb.id);
                const hasConflict = conflicts.has(kb.id);
                const usedKeys = getUsedKeys(kb.id);

                return (
                  <KeybindingRow
                    key={kb.id}
                    id={kb.id}
                    currentKeys={currentKeys}
                    description={kb.description}
                    isCustom={isCustom}
                    hasConflict={hasConflict}
                    conflictsWith={usedKeys}
                    onEdit={handleEdit}
                    onReset={handleReset}
                  />
                );
              })}
            </div>
          </div>
        ))}

        {filteredKeybindings.length === 0 && (
          <div className="py-12 text-center text-sm text-muted-foreground">
            No se encontraron atajos
          </div>
        )}
      </div>
    </div>
  );
};

export default KeybindingsSettings;
