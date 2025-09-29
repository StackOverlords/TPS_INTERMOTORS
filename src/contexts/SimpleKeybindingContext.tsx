// import React, { createContext, useContext, useState } from 'react';

// interface SimpleKeybindingContextType {
//   activeContext: string;
//   setActiveContext: (context: string) => void;
// }

// const SimpleKeybindingContext = createContext<SimpleKeybindingContextType | null>(null);

// interface SimpleKeybindingProviderProps {
//   children: React.ReactNode;
// }

// export const SimpleKeybindingProvider: React.FC<SimpleKeybindingProviderProps> = ({ children }) => {
//   const [activeContext, setActiveContext] = useState('global');

//   const value = {
//     activeContext,
//     setActiveContext
//   };

//   return (
//     <SimpleKeybindingContext.Provider value={value}>
//       {children}
//     </SimpleKeybindingContext.Provider>
//   );
// };

// export const useSimpleKeybinding = () => {
//   const context = useContext(SimpleKeybindingContext);
//   if (!context) {
//     throw new Error('useSimpleKeybinding must be used within a SimpleKeybindingProvider');
//   }
//   return context;
// };