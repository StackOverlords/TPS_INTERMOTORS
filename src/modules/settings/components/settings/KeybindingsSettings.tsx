import { Button } from "@/components/atoms/button";
import { Input } from "@/components/atoms/input";
import type { ImportValidationResult } from "@/database/schemas/keybindings.schema";
import type { ImportMode } from "@/keybindings";
import { CATEGORIES, detectConflicts, getUsedKeys, useKeybindingStore } from "@/keybindings";
import { cn } from "@/lib/utils";
import { FileDown, FileUp, RotateCcw, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import ImportKeybindingsModal from "../ImportKeybindingsModal";
import KeybindingRow from "../keyBindingRow";

const KeybindingsSettings = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importValidation, setImportValidation] = useState<ImportValidationResult | null>(null);
  const [importFileContent, setImportFileContent] = useState<string>("");
  const [importFileName, setImportFileName] = useState<string>("");

  // ✨ Obtener datos del store reactivo
  const keybindings = useKeybindingStore(state => state.keybindings);
  const loading = useKeybindingStore(state => state.loading);
  const initialized = useKeybindingStore(state => state.initialized);
  const load = useKeybindingStore(state => state.load);
  const save = useKeybindingStore(state => state.save);
  const reset = useKeybindingStore(state => state.reset);
  const resetAll = useKeybindingStore(state => state.resetAll);
  const exportKeybindings = useKeybindingStore(state => state.export);
  const importKeybindings = useKeybindingStore(state => state.import);

  // ✨ Cargar keybindings al montar el componente
  useEffect(() => {
    if (!initialized && !loading) {
      load();
    }
  }, [initialized, loading, load]);

  // Convertir Map a array para trabajar más fácil
  const allKeybindings = Array.from(keybindings.values());

  // Detectar conflictos
  const conflictsMap = detectConflicts(keybindings);

  // Filtrar keybindings según búsqueda
  const filteredKeybindings = allKeybindings.filter((kb) => {
    const query = searchQuery.toLowerCase();
    return (
      kb.description.toLowerCase().includes(query) ||
      kb.id.toLowerCase().includes(query) ||
      kb.keys.toLowerCase().includes(query) ||
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

  // Contar keybindings personalizados
  const customCount = allKeybindings.filter(kb => kb.isCustom).length;

  const handleEdit = async (id: string, keys: string) => {
    try {
      await save(id, keys);
      toast.success('Atajo actualizado correctamente');
    } catch (error) {
      toast.error('Error al guardar el atajo');
      console.error('Error saving keybinding:', error);
    }
  };

  const handleReset = async (id: string) => {
    try {
      await reset(id);
      toast.success('Atajo restablecido');
    } catch (error) {
      toast.error('Error al restablecer el atajo');
      console.error('Error resetting keybinding:', error);
    }
  };

  const handleResetAll = async () => {
    if (!confirm('¿Estás seguro de restablecer todos los atajos a sus valores predeterminados?')) {
      return;
    }

    try {
      await resetAll();
      toast.success('Todos los atajos han sido restablecidos');
    } catch (error) {
      toast.error('Error al restablecer los atajos');
      console.error('Error resetting all keybindings:', error);
    }
  };

  const handleExport = async () => {
    try {
      const json = await exportKeybindings();

      // Usar la API de Tauri para guardar archivos
      const { save } = await import('@tauri-apps/plugin-dialog');
      const { writeTextFile } = await import('@tauri-apps/plugin-fs');

      const fileName = `keybindings-${new Date().toISOString().split('T')[0]}.json`;

      // Mostrar diálogo para guardar archivo
      const filePath = await save({
        defaultPath: fileName,
        filters: [{
          name: 'JSON',
          extensions: ['json']
        }]
      });

      if (filePath) {
        await writeTextFile(filePath, json);

        toast.success('Atajos exportados correctamente', {
          description: `Archivo guardado en: ${filePath}`
        });
      }
    } catch (error) {
      console.error('Error en exportación:', error);
      toast.error('Error al exportar', {
        description: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  };

  const handleImportFileSelect = async () => {
    try {
      // Usar la API de Tauri para abrir archivos
      const { open } = await import('@tauri-apps/plugin-dialog');
      const { readTextFile } = await import('@tauri-apps/plugin-fs');

      // Mostrar diálogo para abrir archivo
      const filePath = await open({
        multiple: false,
        filters: [{
          name: 'JSON',
          extensions: ['json']
        }]
      });

      if (!filePath) return;

      // Leer el archivo
      const text = await readTextFile(filePath as string);

      // Validación básica
      try {
        const data = JSON.parse(text);
        const validation: ImportValidationResult = {
          valid: !!data.keybindings,
          errors: data.keybindings ? [] : ['Archivo inválido'],
          warnings: [],
          conflicts: [],
          summary: {
            total: data.keybindings ? Object.keys(data.keybindings).length : 0,
            new: 0,
            modified: 0,
            unchanged: 0
          }
        };

        // Guardar para usar después
        setImportFileContent(text);
        setImportFileName(typeof filePath === 'string' ? filePath.split(/[\\/]/).pop() || 'archivo.json' : 'archivo.json');
        setImportValidation(validation);

        // Mostrar modal de vista previa
        setImportModalOpen(true);
      } catch (parseError) {
        toast.error('Error al leer el archivo', {
          description: 'El archivo no contiene un JSON válido'
        });
      }
    } catch (error) {
      toast.error('Error al leer el archivo', {
        description: error instanceof Error ? error.message : 'El archivo no es válido'
      });
    }
  };

  const handleImportConfirm = async (mode: ImportMode) => {
    try {
      await importKeybindings(importFileContent, mode);

      setImportModalOpen(false);

      const modeText =
        mode === 'replace' ? 'reemplazados' :
        mode === 'add-only' ? 'agregados' :
        'combinados';

      toast.success('Atajos importados correctamente', {
        description: `Los atajos han sido ${modeText} exitosamente`
      });
    } catch (error) {
      toast.error('Error al importar', {
        description: error instanceof Error ? error.message : 'Error desconocido'
      });
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
          {customCount > 0 && (
            <span className="text-primary">{customCount} personalizados</span>
          )}
          {conflictsMap.size > 0 && (
            <span className="text-destructive">{conflictsMap.size} conflictos</span>
          )}
        </div>

        {/* Acciones */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleResetAll}
            title="Restablecer todo"
          >
            <RotateCcw className="w-3 h-3" />
            Reset
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleExport}
            title="Exportar configuración"
          >
            <FileDown className="w-3 h-3" />
            Exportar
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleImportFileSelect}
            title="Importar configuración"
          >
            <FileUp className="w-3 h-3" />
            Importar
          </Button>
        </div>
      </div>

      {/* Lista estilo tabla VSCode */}
      <div className="overflow-hidden">
        {Object.entries(groupedByCategory).map(([category, items], categoryIndex) => (
          <div key={category} className={cn(categoryIndex > 0 && "mt-0")}>
            {/* Header de categoría */}
            <div className="bg-muted/100 px-3 py-1.5 border-b border-border/50">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {CATEGORIES[category as keyof typeof CATEGORIES] || category}
              </h3>
            </div>

            {/* Rows */}
            <div>
              {items.map((kb) => {
                const hasConflict = conflictsMap.has(kb.id);
                const usedKeys = getUsedKeys(keybindings, kb.id);

                return (
                  <KeybindingRow
                    key={kb.id}
                    id={kb.id}
                    currentKeys={kb.keys}
                    description={kb.description}
                    isCustom={kb.isCustom}
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

      {/* Modal de importación */}
      <ImportKeybindingsModal
        open={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        onConfirm={handleImportConfirm}
        validation={importValidation}
        fileName={importFileName}
      />
    </div>
  );
};

export default KeybindingsSettings;
