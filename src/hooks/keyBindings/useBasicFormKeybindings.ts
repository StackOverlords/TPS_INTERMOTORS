import { getKeysSync, subscribeToKeybindingsChanges } from '@/services/keybindingsService';
import { useEffect, useRef, useState } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import keyBindings from './global.keys';

interface BasicFormKeybindingOptions {
  onSave?: () => void;
  onReset?: () => void;
  onCancel?: () => void;
}

export const useBasicFormKeybindings = (options: BasicFormKeybindingOptions = {}) => {
  const { onSave, onReset, onCancel } = options;
  const formRef = useRef<HTMLFormElement>(null);

  // Estado reactivo para las teclas (se actualiza cuando cambian)
  const [saveKeys, setSaveKeys] = useState(() => getKeysSync('forms.save') || keyBindings.forms.save.keys);
  const [resetKeys, setResetKeys] = useState(() => getKeysSync('forms.resetForm') || keyBindings.forms.resetForm.keys);
  const [cancelKeys, setCancelKeys] = useState(() => getKeysSync('forms.cancel') || keyBindings.forms.cancel.keys);

  // Suscribirse a cambios en keybindings
  useEffect(() => {
    console.log('🎯 useBasicFormKeybindings montado con teclas:', { saveKeys, resetKeys, cancelKeys });

    const unsubscribe = subscribeToKeybindingsChanges(() => {
      // Cuando cambian los keybindings, actualizar las teclas
      const newSaveKeys = getKeysSync('forms.save') || keyBindings.forms.save.keys;
      const newResetKeys = getKeysSync('forms.resetForm') || keyBindings.forms.resetForm.keys;
      const newCancelKeys = getKeysSync('forms.cancel') || keyBindings.forms.cancel.keys;

      console.log('🔄 Keybindings actualizados:', {
        save: `${saveKeys} → ${newSaveKeys}`,
        reset: `${resetKeys} → ${newResetKeys}`,
        cancel: `${cancelKeys} → ${newCancelKeys}`
      });

      setSaveKeys(newSaveKeys);
      setResetKeys(newResetKeys);
      setCancelKeys(newCancelKeys);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    console.log('🔑 SaveKeys cambió a:', saveKeys);
  }, [saveKeys]);

  useHotkeys(saveKeys, (e) => {
    console.log('💾 Save hotkey presionado:', saveKeys);
    e.preventDefault();
    if (onSave) {
      onSave();
    }
  }, {
    enableOnFormTags: false,
    enabled: !!onSave
  }, [saveKeys, onSave]); // Agregar saveKeys como dependencia

  // Resetear formularios
  useHotkeys(resetKeys, (e) => {
    console.log(resetKeys);
    e.preventDefault();
    if (onReset) { 
      onReset();
    }
  }, {
    enableOnFormTags: false,
    enabled: !!onReset
  }, [resetKeys, onReset]); // Agregar resetKeys como dependencia

  // Escape para cancelar
  useHotkeys(cancelKeys, (e) => {
    e.preventDefault();
    if (onCancel) {
      onCancel();
    }
  }, {
    enableOnFormTags: true,
    enabled: !!onCancel
  }, [cancelKeys, onCancel]); // Agregar cancelKeys como dependencia

  return {
    formRef
  };
};
