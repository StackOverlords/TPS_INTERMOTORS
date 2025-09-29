// import { useHotkeys } from 'react-hotkeys-hook';
// import { useNavigate } from 'react-router-dom';
// import { useContextKeybindings, useKeybinding } from '../contexts/KeybindingContext';

// interface ModuleKeybindingOptions {
//   module: 'purchases' | 'sales' | 'inventory' | 'clients' | 'providers';
//   subContext?: string; // e.g., 'list', 'detail', 'edit', 'create'
//   onNew?: () => void;
//   onSearch?: () => void;
//   onPrint?: () => void;
//   onEdit?: () => void;
//   onDelete?: () => void;
//   customActions?: Record<string, () => void>;
// }

// export const useModuleKeybindings = (options: ModuleKeybindingOptions) => {
//   const {
//     module,
//     subContext = '',
//     onNew,
//     onSearch,
//     onPrint,
//     onEdit,
//     onDelete,
//     customActions = {}
//   } = options;

//   const { canExecuteAction } = useKeybinding();
//   const navigate = useNavigate();

//   // Build context string
//   const context = subContext ? `${module}-${subContext}` : module;

//   // Permission mapping based on module
//   const getPermission = (action: string) => {
//     const moduleCode = {
//       purchases: 'com',
//       sales: 'ven',
//       inventory: 'inv',
//       clients: 'cli',
//       providers: 'pro'
//     }[module];

//     const actionMap = {
//       create: `${moduleCode}-create`,
//       list: `${moduleCode}-list`,
//       edit: `${moduleCode}-edit`,
//       delete: `${moduleCode}-delete`,
//       view_print: `${moduleCode}-view_print`,
//       module: `${moduleCode}-module`
//     };

//     return actionMap[action as keyof typeof actionMap];
//   };

//   // Default module actions
//   const defaultActions = {
//     [`new_${module.slice(0, -1)}`]: onNew || (() => {
//       const routes = {
//         purchases: '/purchases/create',
//         sales: '/sales/create',
//         inventory: '/inventory',
//         clients: '/clients/create',
//         providers: '/providers/create'
//       };
//       navigate(routes[module]);
//     }),
//     [`search_${module}`]: onSearch || (() => {
//       // Focus search input if available
//       const searchInput = document.querySelector('input[type="search"], input[placeholder*="buscar"], input[placeholder*="Buscar"]') as HTMLInputElement;
//       if (searchInput) {
//         searchInput.focus();
//         searchInput.select();
//       }
//     }),
//     [`print_${module.slice(0, -1)}`]: onPrint || (() => {
//       if (canExecuteAction(`print_${module.slice(0, -1)}`)) {
//         window.print();
//       }
//     }),
//     [`edit_${module.slice(0, -1)}`]: onEdit,
//     [`delete_${module.slice(0, -1)}`]: onDelete,
//     ...customActions
//   };

//   // Register context and actions
//   useContextKeybindings(context, defaultActions, [
//     module,
//     subContext,
//     onNew,
//     onSearch,
//     onPrint,
//     onEdit,
//     onDelete,
//     customActions
//   ]);

//   // Ctrl+N for new
//   useHotkeys('ctrl+n', (e) => {
//     e.preventDefault();
//     const permission = getPermission('create');
//     if (canExecuteAction(`new_${module.slice(0, -1)}`) && permission) {
//       if (onNew) {
//         onNew();
//       } else {
//         const routes = {
//           purchases: '/purchases/create',
//           sales: '/sales/create',
//           inventory: '/inventory',
//           clients: '/clients/create',
//           providers: '/providers/create'
//         };
//         navigate(routes[module]);
//       }
//     }
//   }, {
//     enabled: !!getPermission('create')
//   });

//   // Ctrl+F for search
//   useHotkeys('ctrl+f', (e) => {
//     e.preventDefault();
//     const permission = getPermission('list');
//     if (canExecuteAction(`search_${module}`) && permission) {
//       if (onSearch) {
//         onSearch();
//       } else {
//         const searchInput = document.querySelector('input[type="search"], input[placeholder*="buscar"], input[placeholder*="Buscar"]') as HTMLInputElement;
//         if (searchInput) {
//           searchInput.focus();
//           searchInput.select();
//         }
//       }
//     }
//   }, {
//     enabled: !!getPermission('list')
//   });

//   // Ctrl+P for print
//   useHotkeys('ctrl+p', (e) => {
//     e.preventDefault();
//     const permission = getPermission('view_print');
//     if (canExecuteAction(`print_${module.slice(0, -1)}`) && permission) {
//       if (onPrint) {
//         onPrint();
//       } else {
//         window.print();
//       }
//     }
//   }, {
//     enabled: !!getPermission('view_print') && ['detail', 'edit'].includes(subContext)
//   });

//   // Ctrl+E for edit (only in detail view)
//   useHotkeys('ctrl+e', (e) => {
//     e.preventDefault();
//     const permission = getPermission('edit');
//     if (canExecuteAction(`edit_${module.slice(0, -1)}`) && permission && onEdit) {
//       onEdit();
//     }
//   }, {
//     enabled: !!getPermission('edit') && subContext === 'detail' && !!onEdit
//   });

//   // Delete key for delete (only in list view with selection)
//   useHotkeys('delete', (e) => {
//     e.preventDefault();
//     const permission = getPermission('delete');
//     if (canExecuteAction(`delete_${module.slice(0, -1)}`) && permission && onDelete) {
//       onDelete();
//     }
//   }, {
//     enabled: !!getPermission('delete') && subContext === 'list' && !!onDelete,
//     enableOnFormTags: false
//   });

//   return {
//     context,
//     canCreate: !!getPermission('create'),
//     canEdit: !!getPermission('edit'),
//     canDelete: !!getPermission('delete'),
//     canView: !!getPermission('list'),
//     canPrint: !!getPermission('view_print')
//   };
// };