import React, { createContext, useContext, useLayoutEffect, useMemo, useRef } from 'react';

interface TabActiveContextValue {
    isTabActive: boolean;
}

const TabActiveContext = createContext<TabActiveContextValue>({ isTabActive: true });

/**
 * Lo mismo como ref estable: quien solo necesita saber si la pestaña está
 * activa EN EL MOMENTO de un evento (atajos de teclado) lo lee de acá y no se
 * re-renderiza cada vez que la pestaña se muestra u oculta.
 */
const TabActiveRefContext = createContext<{ readonly current: boolean }>({ current: true });

/** `true` dentro del contenido de una pestaña (TabContent); constante, no provoca renders. */
const InsideTabContext = createContext(false);

export const useTabActive = () => {
    return useContext(TabActiveContext);
};

export const useTabActiveRef = () => {
    return useContext(TabActiveRefContext);
};

export const useIsInsideTab = () => {
    return useContext(InsideTabContext);
};

export const TabActiveProvider: React.FC<{ isActive: boolean; children: React.ReactNode }> = ({
    isActive,
    children
}) => {
    const isActiveRef = useRef(isActive);
    useLayoutEffect(() => {
        isActiveRef.current = isActive;
    }, [isActive]);

    const value = useMemo(() => ({ isTabActive: isActive }), [isActive]);

    return (
        <InsideTabContext.Provider value={true}>
            <TabActiveRefContext.Provider value={isActiveRef}>
                <TabActiveContext.Provider value={value}>
                    {children}
                </TabActiveContext.Provider>
            </TabActiveRefContext.Provider>
        </InsideTabContext.Provider>
    );
};
