import { useAppearanceStore } from '@/stores/appearanceStore'

export const useAppearance = () => {
  const store = useAppearanceStore()

  return {
    // Estado
    fontFamily: store.fontFamily,
    fontSize: store.fontSize,
    highContrast: store.highContrast,
    focusWidth: store.focusWidth,
    reduceAnimations: store.reduceAnimations,
    contentWidth: store.contentWidth,
    elementSpacing: store.elementSpacing,
    borderRadius: store.borderRadius,
    tableColors: store.tableColors,

    // Acciones
    setFontFamily: store.setFontFamily,
    setFontSize: store.setFontSize,
    setHighContrast: store.setHighContrast,
    setFocusWidth: store.setFocusWidth,
    setReduceAnimations: store.setReduceAnimations,
    setContentWidth: store.setContentWidth,
    setElementSpacing: store.setElementSpacing,
    setBorderRadius: store.setBorderRadius,
    setTableColor: store.setTableColor,
    resetToDefaults: store.resetToDefaults,
  }
}