import { useEffect, useRef } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import { useContextKeybindings, useKeybinding } from '../../contexts/KeybindingContext';

interface FormKeybindingOptions {
  onSave?: () => void;
  onReset?: () => void;
  onCancel?: () => void;
  enableFieldNavigation?: boolean;
  customActions?: Record<string, () => void>;
}

export const useFormKeybindings = (options: FormKeybindingOptions = {}) => {
  const {
    onSave,
    onReset,
    onCancel,
    enableFieldNavigation = true,
    customActions = {}
  } = options;

  const { canExecuteAction } = useKeybinding();
  const formRef = useRef<HTMLFormElement>(null);

  // Get all form inputs
  const getFormInputs = () => {
    if (!formRef.current) return [];

    return Array.from(
      formRef.current.querySelectorAll(
        'input:not([type="hidden"]):not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled])'
      )
    ) as HTMLElement[];
  };

  // Focus next field
  const focusNextField = () => {
    const inputs = getFormInputs();
    const currentIndex = inputs.findIndex(input => input === document.activeElement);
    const nextIndex = (currentIndex + 1) % inputs.length;
    inputs[nextIndex]?.focus();
  };

  // Focus previous field
  const focusPrevField = () => {
    const inputs = getFormInputs();
    const currentIndex = inputs.findIndex(input => input === document.activeElement);
    const prevIndex = currentIndex <= 0 ? inputs.length - 1 : currentIndex - 1;
    inputs[prevIndex]?.focus();
  };

  // Default form actions
  const defaultActions = {
    save_form: onSave || (() => {}),
    reset_form: onReset || (() => {}),
    cancel_form: onCancel || (() => {}),
    next_field: enableFieldNavigation ? focusNextField : () => {},
    prev_field: enableFieldNavigation ? focusPrevField : () => {},
    ...customActions
  };

  // Register context and actions
  useContextKeybindings('forms', defaultActions, [
    onSave,
    onReset,
    onCancel,
    enableFieldNavigation,
    customActions
  ]);

  // Alt+S for save
  useHotkeys('alt+s', (e) => {
    e.preventDefault();
    if (canExecuteAction('save_form') && onSave) {
      onSave();
    }
  }, {
    enableOnFormTags: false,
    enabled: !!onSave && canExecuteAction('save_form')
  });

  // Ctrl+R for reset
  useHotkeys('ctrl+r', (e) => {
    e.preventDefault();
    if (canExecuteAction('reset_form') && onReset) {
      onReset();
    }
  }, {
    enableOnFormTags: false,
    enabled: !!onReset && canExecuteAction('reset_form')
  });

  // Escape for cancel
  useHotkeys('escape', (e) => {
    e.preventDefault();
    if (canExecuteAction('cancel_form') && onCancel) {
      onCancel();
    }
  }, {
    enableOnFormTags: true,
    enabled: !!onCancel && canExecuteAction('cancel_form')
  });

  // Ctrl+Tab for next field
  useHotkeys('ctrl+tab', (e) => {
    e.preventDefault();
    if (enableFieldNavigation && canExecuteAction('next_field')) {
      focusNextField();
    }
  }, {
    enableOnFormTags: true,
    enabled: enableFieldNavigation && canExecuteAction('next_field')
  });

  // Ctrl+Shift+Tab for previous field
  useHotkeys('ctrl+shift+tab', (e) => {
    e.preventDefault();
    if (enableFieldNavigation && canExecuteAction('prev_field')) {
      focusPrevField();
    }
  }, {
    enableOnFormTags: true,
    enabled: enableFieldNavigation && canExecuteAction('prev_field')
  });

  // Handle Enter key for field navigation
  useEffect(() => {
    if (!enableFieldNavigation || !formRef.current) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && e.target !== document.querySelector('button[type="submit"]')) {
        e.preventDefault();
        focusNextField();
      }
    };

    const form = formRef.current;
    form.addEventListener('keydown', handleKeyDown);

    return () => {
      form.removeEventListener('keydown', handleKeyDown);
    };
  }, [enableFieldNavigation]);

  return {
    formRef,
    focusNextField,
    focusPrevField,
    getFormInputs
  };
};