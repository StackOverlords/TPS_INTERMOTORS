import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import {
  type KeybindingAction,
  getKeybindingById,
  getKeybindingsByContext,
  hasPermission
} from '../config/keybindings.config';

interface KeybindingProviderState {
  // Current active context (e.g., 'forms', 'tables', 'purchases')
  activeContext: string;
  setActiveContext: (context: string) => void;

  // Register/unregister dynamic actions
  registerAction: (actionId: string, action: () => void) => void;
  unregisterAction: (actionId: string) => void;

  // Execute action by ID
  executeAction: (actionId: string, context?: any) => void;

  // Get available keybindings for current context
  getActiveKeybindings: () => KeybindingAction[];

  // Check if user has permission for specific action
  canExecuteAction: (actionId: string) => boolean;

  // Show shortcuts modal
  showShortcuts: boolean;
  setShowShortcuts: (show: boolean) => void;
}

const KeybindingContext = createContext<KeybindingProviderState | null>(null);

interface KeybindingProviderProps {
  children: React.ReactNode;
  initialContext?: string;
}

export const KeybindingProvider: React.FC<KeybindingProviderProps> = ({
  children,
  initialContext = 'global'
}) => {
  const [activeContext, setActiveContext] = useState<string>(initialContext);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [dynamicActions, setDynamicActions] = useState<Record<string, () => void>>({});

  // Register dynamic action
  const registerAction = useCallback((actionId: string, action: () => void) => {
    setDynamicActions(prev => ({
      ...prev,
      [actionId]: action
    }));
  }, []);

  // Unregister dynamic action
  const unregisterAction = useCallback((actionId: string) => {
    setDynamicActions(prev => {
      const { [actionId]: _, ...rest } = prev;
      return rest;
    });
  }, []);

  // Execute action by ID
  const executeAction = useCallback((actionId: string) => {
    // First check if it's a dynamic action
    const dynamicAction = dynamicActions[actionId];
    if (dynamicAction) {
      dynamicAction();
      return;
    }

    // Then check static keybindings
    const keybinding = getKeybindingById(actionId);
    if (keybinding && hasPermission(keybinding.permission)) {
      if (typeof keybinding.action === 'function') {
        keybinding.action();
      }
    }
  }, [dynamicActions]);

  // Check if user can execute action
  const canExecuteAction = useCallback((actionId: string) => {
    const keybinding = getKeybindingById(actionId);
    if (!keybinding) return false;
    return hasPermission(keybinding.permission);
  }, []);

  // Get active keybindings for current context
  const getActiveKeybindings = useCallback(() => {
    return getKeybindingsByContext(activeContext);
  }, [activeContext]);

  // Global keybindings that are always active
  useHotkeys('ctrl+k', (e) => {
    e.preventDefault();
    executeAction('open_command_palette');
  }, {
    enableOnFormTags: true,
    enabled: canExecuteAction('open_command_palette')
  });

  useHotkeys('escape', (e) => {
    e.preventDefault();
    if (showShortcuts) {
      setShowShortcuts(false);
    } else {
      executeAction('close_modal');
    }
  }, {
    enableOnFormTags: true
  });

  useHotkeys('ctrl+shift+?', (e) => {
    e.preventDefault();
    setShowShortcuts(true);
  }, {
    enableOnFormTags: true
  });

  const value: KeybindingProviderState = {
    activeContext,
    setActiveContext,
    registerAction,
    unregisterAction,
    executeAction,
    getActiveKeybindings,
    canExecuteAction,
    showShortcuts,
    setShowShortcuts
  };

  return (
    <KeybindingContext.Provider value={value}>
      {children}
      {showShortcuts && <ShortcutsModal />}
    </KeybindingContext.Provider>
  );
};

// Shortcuts modal component
const ShortcutsModal: React.FC = () => {
  const context = useContext(KeybindingContext);
  if (!context) return null;

  const { setShowShortcuts, getActiveKeybindings, activeContext } = context;

  const activeKeybindings = getActiveKeybindings();
  const groupedKeybindings = activeKeybindings.reduce((acc, kb) => {
    if (!acc[kb.category]) {
      acc[kb.category] = [];
    }
    acc[kb.category].push(kb);
    return acc;
  }, {} as Record<string, KeybindingAction[]>);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-semibold">
            Atajos de Teclado - {activeContext}
          </h2>
          <button
            onClick={() => setShowShortcuts(false)}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {Object.entries(groupedKeybindings).map(([category, keybindings]) => (
            <div key={category} className="mb-6">
              <h3 className="text-md font-medium text-gray-700 mb-3 capitalize">
                {category}
              </h3>
              <div className="space-y-2">
                {keybindings.map((kb) => (
                  <div key={kb.id} className="flex justify-between items-center">
                    <span className="text-gray-600">{kb.description}</span>
                    <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded text-sm font-mono">
                      {kb.keys}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {Object.keys(groupedKeybindings).length === 0 && (
            <p className="text-gray-500 text-center">
              No hay atajos disponibles para este contexto.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

// Hook to use keybinding context
export const useKeybinding = () => {
  const context = useContext(KeybindingContext);
  if (!context) {
    throw new Error('useKeybinding must be used within a KeybindingProvider');
  }
  return context;
};

// Simplified hook for components to register context-specific keybindings
export const useContextKeybindings = (
  contextName: string,
  actions: Record<string, () => void>,
  dependencies: React.DependencyList = []
) => {
  const context = useContext(KeybindingContext);
  if (!context) {
    throw new Error('useContextKeybindings must be used within a KeybindingProvider');
  }

  const { setActiveContext, registerAction, unregisterAction } = context;

  // Set context
  useEffect(() => {
    setActiveContext(contextName);
  }, [contextName, setActiveContext]);

  // Register/unregister actions
  useEffect(() => {
    Object.entries(actions).forEach(([actionId, action]) => {
      registerAction(actionId, action);
    });

    return () => {
      Object.keys(actions).forEach(actionId => {
        unregisterAction(actionId);
      });
    };
  }, [registerAction, unregisterAction, ...dependencies]);
};

export default KeybindingContext;