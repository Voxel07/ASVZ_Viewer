import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { pb, isRequestAbort } from '../lib/pb';
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
    const [refreshVersion, setRefreshVersion] = useState(0);

    // Initial fetch logic
    useEffect(() => {
        const controller = new AbortController();

        async function loadData() {
            setLoadingInitial(true);
            setError(null);
            try {
                // 1. Fetch first page (e.g., 50 items) for quick responsiveness
                const firstPage = await pb.collection('asvz_marketplace').getList<MarketplaceItem>(1, 50, {
                    sort: '-timestamp', // Assuming timestamp is the relevant sort field, or '-created'
                    signal: controller.signal,
                });
                if (controller.signal.aborted) return;

                setItems(firstPage.items);
                setLoadingInitial(false);

                // 2. Fetch the rest in the background
                setLoadingBackground(true);
                const allItems = await pb.collection('asvz_marketplace').getFullList<MarketplaceItem>({
                    sort: '-timestamp',
                    signal: controller.signal,
                });

                if (!controller.signal.aborted) setItems(allItems);
            } catch (err) {
                if (controller.signal.aborted || isRequestAbort(err)) return;
                if (err instanceof Error) {
                    setError(err);
                } else {
                    setError(new Error('Unknown error fetching marketplace items'));
                }
            } finally {
                if (!controller.signal.aborted) {
                    setLoadingInitial(false);
                    setLoadingBackground(false);
                }
            }
        }

        loadData();
        return () => controller.abort();
    }, [refreshVersion]);

    const refresh = async () => {
        setRefreshVersion(version => version + 1);
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
