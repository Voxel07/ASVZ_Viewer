import { createContext, useContext } from 'react';
import type { MarketplaceItem } from '../types';
interface MarketplaceContextType {
    items: MarketplaceItem[];
    loadingInitial: boolean;
    loadingBackground: boolean;
    error: Error | null;
    refresh: () => Promise<void>;
}

export const MarketplaceContext = createContext<MarketplaceContextType | undefined>(undefined);

export function useMarketplaceContext() {
    const context = useContext(MarketplaceContext);
    if (context === undefined) {
        throw new Error('useMarketplaceContext must be used within a MarketplaceProvider');
    }
    return context;
}
