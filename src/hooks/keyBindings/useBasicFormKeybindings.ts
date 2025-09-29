import { useRef } from 'react';
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

  useHotkeys(keyBindings.forms.save.keys, (e) => {
    e.preventDefault();
    if (onSave) {
      onSave();
    }
  }, {
    enableOnFormTags: false,
    enabled: !!onSave
  });

  // Alt+R para resetear los formularios
  useHotkeys(keyBindings.forms.cancel.keys, (e) => {
    e.preventDefault();
    if (onReset) {
      onReset();
    }
  }, {
    enableOnFormTags: false,
    enabled: !!onReset
  });

  // Escape vamos s usar para cancelar algo o cerrar algo
  useHotkeys(keyBindings.forms.cancel.keys, (e) => {
    e.preventDefault();
    if (onCancel) {
      onCancel();
    }
  }, {
    enableOnFormTags: true,
    enabled: !!onCancel
  });

  return {
    formRef
  };
};