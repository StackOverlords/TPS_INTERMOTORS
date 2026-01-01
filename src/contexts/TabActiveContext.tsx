import React, { createContext, useContext } from 'react';

interface TabActiveContextValue {
    isTabActive: boolean;
}

const TabActiveContext = createContext<TabActiveContextValue>({ isTabActive: true });

export const useTabActive = () => {
    return useContext(TabActiveContext);
};

export const TabActiveProvider: React.FC<{ isActive: boolean; children: React.ReactNode }> = ({
    isActive,
    children
}) => {
    return (
        <TabActiveContext.Provider value={{ isTabActive: isActive }}>
            {children}
        </TabActiveContext.Provider>
    );
};