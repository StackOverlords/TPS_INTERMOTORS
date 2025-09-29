import { useEffect, useRef, useState } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import { useContextKeybindings, useKeybinding } from '../../contexts/KeybindingContext';

interface TableKeybindingOptions {
  onRowSelect?: (rowIndex: number, rowData?: any) => void;
  onRowEdit?: (rowIndex: number, rowData?: any) => void;
  onRowDelete?: (rowIndex: number, rowData?: any) => void;
  onActivate?: () => void;
  onDeactivate?: () => void;
  multiSelect?: boolean;
  autoFocus?: boolean;
  rowSelector?: string; // CSS selector for rows
  customActions?: Record<string, (rowIndex: number, rowData?: any) => void>;
}

export const useTableKeybindings = (options: TableKeybindingOptions = {}) => {
  const {
    onRowSelect,
    onRowEdit,
    onRowDelete,
    onActivate,
    onDeactivate,
    multiSelect = false,
    autoFocus = true,
    rowSelector = 'tr[data-row], .table-row, [role="row"]',
    customActions = {}
  } = options;

  const { canExecuteAction } = useKeybinding();
  const tableRef = useRef<HTMLTableElement | HTMLDivElement>(null);
  const [isActive, setIsActive] = useState(false);
  const [selectedRow, setSelectedRow] = useState<number>(-1);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());

  // Get all rows
  const getRows = () => {
    if (!tableRef.current) return [];
    return Array.from(tableRef.current.querySelectorAll(rowSelector)) as HTMLElement[];
  };

  // Get row data
  const getRowData = (rowIndex: number) => {
    const rows = getRows();
    const row = rows[rowIndex];
    if (!row) return null;

    // Try to get data from various sources
    const dataset = row.dataset;
    const rowData = dataset.rowData ? JSON.parse(dataset.rowData) : null;

    return rowData || {
      index: rowIndex,
      element: row,
      dataset
    };
  };

  // Activate table navigation
  const activate = () => {
    if (!canExecuteAction('activate_table_nav')) return;

    setIsActive(true);
    const rows = getRows();
    if (rows.length > 0 && selectedRow === -1) {
      setSelectedRow(0);
      highlightRow(0);
    }
    onActivate?.();
  };

  // Deactivate table navigation
  const deactivate = () => {
    setIsActive(false);
    setSelectedRow(-1);
    setSelectedRows(new Set());
    clearHighlight();
    onDeactivate?.();
  };

  // Highlight row
  const highlightRow = (rowIndex: number) => {
    const rows = getRows();

    // Clear previous highlights
    clearHighlight();

    // Highlight selected row
    const row = rows[rowIndex];
    if (row) {
      row.classList.add('keyboard-selected');
      row.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  };

  // Clear highlights
  const clearHighlight = () => {
    const rows = getRows();
    rows.forEach(row => {
      row.classList.remove('keyboard-selected', 'keyboard-multi-selected');
    });
  };

  // Navigate up
  const navigateUp = () => {
    if (!isActive) return;
    const rows = getRows();
    const newIndex = Math.max(0, selectedRow - 1);
    setSelectedRow(newIndex);
    highlightRow(newIndex);
  };

  // Navigate down
  const navigateDown = () => {
    if (!isActive) return;
    const rows = getRows();
    const newIndex = Math.min(rows.length - 1, selectedRow + 1);
    setSelectedRow(newIndex);
    highlightRow(newIndex);
  };

  // Navigate to first row
  const navigateFirst = () => {
    if (!isActive) return;
    setSelectedRow(0);
    highlightRow(0);
  };

  // Navigate to last row
  const navigateLast = () => {
    if (!isActive) return;
    const rows = getRows();
    const lastIndex = rows.length - 1;
    setSelectedRow(lastIndex);
    highlightRow(lastIndex);
  };

  // Select current row
  const selectRow = () => {
    if (!isActive || selectedRow === -1) return;

    if (multiSelect) {
      const newSelected = new Set(selectedRows);
      if (newSelected.has(selectedRow)) {
        newSelected.delete(selectedRow);
      } else {
        newSelected.add(selectedRow);
      }
      setSelectedRows(newSelected);

      // Update visual selection
      const rows = getRows();
      rows.forEach((row, index) => {
        if (newSelected.has(index)) {
          row.classList.add('keyboard-multi-selected');
        } else {
          row.classList.remove('keyboard-multi-selected');
        }
      });
    }

    const rowData = getRowData(selectedRow);
    onRowSelect?.(selectedRow, rowData);
  };

  // Edit current row
  const editRow = () => {
    if (!isActive || selectedRow === -1 || !canExecuteAction('edit_row')) return;

    const rowData = getRowData(selectedRow);
    onRowEdit?.(selectedRow, rowData);
  };

  // Delete current row
  const deleteRow = () => {
    if (!isActive || selectedRow === -1 || !canExecuteAction('delete_row')) return;

    const rowData = getRowData(selectedRow);
    onRowDelete?.(selectedRow, rowData);
  };

  // Default table actions
  const defaultActions = {
    activate_table_nav: activate,
    deactivate_table_nav: deactivate,
    select_row: selectRow,
    edit_row: editRow,
    delete_row: deleteRow,
    navigate_up: navigateUp,
    navigate_down: navigateDown,
    navigate_first: navigateFirst,
    navigate_last: navigateLast,
    ...Object.keys(customActions).reduce((acc, key) => {
      acc[key] = () => customActions[key](selectedRow, getRowData(selectedRow));
      return acc;
    }, {} as Record<string, () => void>)
  };

  // Register context and actions
  useContextKeybindings('tables', defaultActions, [
    onRowSelect,
    onRowEdit,
    onRowDelete,
    onActivate,
    onDeactivate,
    multiSelect,
    selectedRow,
    customActions
  ]);

  // Alt+T to activate/deactivate
  useHotkeys('alt+t', (e) => {
    e.preventDefault();
    if (isActive) {
      deactivate();
    } else {
      activate();
    }
  }, {
    enabled: canExecuteAction('activate_table_nav')
  });

  // Arrow key navigation (only when active)
  useHotkeys('arrowup', (e) => {
    e.preventDefault();
    navigateUp();
  }, {
    enabled: isActive,
    enableOnFormTags: false
  });

  useHotkeys('arrowdown', (e) => {
    e.preventDefault();
    navigateDown();
  }, {
    enabled: isActive,
    enableOnFormTags: false
  });

  useHotkeys('home', (e) => {
    e.preventDefault();
    navigateFirst();
  }, {
    enabled: isActive,
    enableOnFormTags: false
  });

  useHotkeys('end', (e) => {
    e.preventDefault();
    navigateLast();
  }, {
    enabled: isActive,
    enableOnFormTags: false
  });

  // Space to select
  useHotkeys('space', (e) => {
    e.preventDefault();
    selectRow();
  }, {
    enabled: isActive && canExecuteAction('select_row'),
    enableOnFormTags: false
  });

  // Enter to edit
  useHotkeys('enter', (e) => {
    e.preventDefault();
    editRow();
  }, {
    enabled: isActive && canExecuteAction('edit_row'),
    enableOnFormTags: false
  });

  // Delete key to delete
  useHotkeys('delete', (e) => {
    e.preventDefault();
    deleteRow();
  }, {
    enabled: isActive && canExecuteAction('delete_row'),
    enableOnFormTags: false
  });

  // Escape to deactivate
  useHotkeys('escape', (e) => {
    e.preventDefault();
    deactivate();
  }, {
    enabled: isActive,
    enableOnFormTags: true
  });

  // Auto-focus on mount if enabled
  useEffect(() => {
    if (autoFocus && tableRef.current) {
      const rows = getRows();
      if (rows.length > 0) {
        activate();
      }
    }
  }, [autoFocus]);

  // Add CSS for keyboard navigation
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .keyboard-selected {
        background-color: #3b82f6 !important;
        color: white !important;
        outline: 2px solid #1d4ed8;
      }

      .keyboard-multi-selected {
        background-color: #dbeafe !important;
        outline: 1px solid #3b82f6;
      }

      .keyboard-navigation-active {
        user-select: none;
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Add/remove navigation class
  useEffect(() => {
    if (tableRef.current) {
      if (isActive) {
        tableRef.current.classList.add('keyboard-navigation-active');
      } else {
        tableRef.current.classList.remove('keyboard-navigation-active');
      }
    }
  }, [isActive]);

  return {
    tableRef,
    isActive,
    selectedRow,
    selectedRows: Array.from(selectedRows),
    activate,
    deactivate,
    navigateUp,
    navigateDown,
    navigateFirst,
    navigateLast,
    selectRow,
    editRow,
    deleteRow,
    getRowData,
    getRows
  };
};