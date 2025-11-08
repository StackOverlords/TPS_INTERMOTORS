#!/bin/bash

echo "🔍 Buscando componentes que usan el sistema antiguo..."
echo ""

echo "📂 Hooks antiguos encontrados:"
find src/ -type f -name "*.ts" -o -name "*.tsx" | xargs grep -l "useBasicFormKeybindings\|useFormKeybindings\|useTableKeybindings\|useFilterNavigation\|useTopNavKeybindings\|useSidebarKeybindings\|useTabBarKeyBindings\|useKeyboardNavigation\|useModuleKeybindings" 2>/dev/null | grep -v "deprecated" | grep -v "node_modules"

echo ""
echo "📊 Estadísticas:"
echo "- Total de archivos con hooks antiguos: $(find src/ -type f \( -name "*.ts" -o -name "*.tsx" \) | xargs grep -l "useBasicFormKeybindings\|useFormKeybindings" 2>/dev/null | grep -v "deprecated" | grep -v "node_modules" | wc -l)"
echo "- Archivos ya migrados: $(find src/ -type f \( -name "*.ts" -o -name "*.tsx" \) | xargs grep -l "from '@/keybindings'" 2>/dev/null | wc -l)"

echo ""
echo "✅ Sistema nuevo implementado en:"
ls -la src/keybindings/

echo ""
echo "📝 Archivos de documentación:"
ls -lh src/keybindings/*.md 2>/dev/null || echo "No hay archivos .md"
