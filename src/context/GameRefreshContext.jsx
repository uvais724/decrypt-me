import { createContext, useContext, useState } from 'react';

const GameRefreshContext = createContext();

export function GameRefreshProvider({ children }) {
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const triggerRefresh = () => {
        setRefreshTrigger(prev => prev + 1);
    };

    return (
        <GameRefreshContext.Provider value={{ refreshTrigger, triggerRefresh }}>
            {children}
        </GameRefreshContext.Provider>
    );
}

export function useGameRefresh() {
    const context = useContext(GameRefreshContext);
    if (!context) {
        throw new Error('useGameRefresh must be used within GameRefreshProvider');
    }
    return context;
}
