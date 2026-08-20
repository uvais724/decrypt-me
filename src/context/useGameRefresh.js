import { useContext } from 'react';
import { GameRefreshContext } from './gameRefreshContextValue';

export function useGameRefresh() {
    const context = useContext(GameRefreshContext);
    if (!context) {
        throw new Error('useGameRefresh must be used within GameRefreshProvider');
    }
    return context;
}
