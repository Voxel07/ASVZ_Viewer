import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { pb } from '../lib/pb';
import type { MarketplaceItem } from '../types';

interface MarketplaceContextType {
    items: MarketplaceItem[];
    loadingInitial: boolean;
    loadingBackground: boolean;
    error: Error | null;
    refresh: () => Promise<void>;
}

const MarketplaceContext = createContext<MarketplaceContextType | undefined>(undefined);

export function MarketplaceProvider({ children }: { children: ReactNode }) {
    const [items, setItems] = useState<MarketplaceItem[]>([]);
    const [loadingInitial, setLoadingInitial] = useState(false);
    const [loadingBackground, setLoadingBackground] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    // Initial fetch logic
    useEffect(() => {
        // If we already have items, don't refetch automatically on mount
        // This effectively implements caching across tab switches
        if (items.length > 0) return;

        async function loadData() {
            setLoadingInitial(true);
            setError(null);
            try {
                // 1. Fetch first page (e.g., 50 items) for quick responsiveness
                const firstPage = await pb.collection('asvz_marketplace').getList<MarketplaceItem>(1, 50, {
                    sort: '-timestamp', // Assuming timestamp is the relevant sort field, or '-created'
                });

                setItems(firstPage.items);
                setLoadingInitial(false);

                // 2. Fetch the rest in the background
                setLoadingBackground(true);
                const allItems = await pb.collection('asvz_marketplace').getFullList<MarketplaceItem>({
                    sort: '-timestamp',
                });

                setItems(allItems);
            } catch (err) {
                if (err instanceof Error) {
                    setError(err);
                } else {
                    setError(new Error('Unknown error fetching marketplace items'));
                }
            } finally {
                setLoadingInitial(false);
                setLoadingBackground(false);
            }
        }

        loadData();
    }, [items.length]);

    const refresh = async () => {
        setItems([]); // Clear items to trigger the effect or manually call loadData logic
        // Resetting state effectively triggers the effect because of the dependency check, 
        // OR we can just manually run the fetch logic again. 
        // A simpler way for manual refresh is to direct call the fetch logic, but clearing items is safe enough for now.
    };

    return (
        <MarketplaceContext.Provider value={{ items, loadingInitial, loadingBackground, error, refresh }}>
            {children}
        </MarketplaceContext.Provider>
    );
}

export function useMarketplaceContext() {
    const context = useContext(MarketplaceContext);
    if (context === undefined) {
        throw new Error('useMarketplaceContext must be used within a MarketplaceProvider');
    }
    return context;
}
