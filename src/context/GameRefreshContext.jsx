import { useState } from 'react';
import { GameRefreshContext } from './gameRefreshContextValue';

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
