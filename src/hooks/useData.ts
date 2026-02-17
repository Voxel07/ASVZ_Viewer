import { useState, useEffect } from 'react';
import { pb } from '../lib/pb';
import { formatDistanceStrict } from 'date-fns';
import type { ASVZUpdate, ASVZPrice, MarketplaceItem, MarketplaceDeletedItem } from '../types';

export function useUpdatesData(startDate?: string, endDate?: string) {
    const [data, setData] = useState<ASVZUpdate[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        async function fetchData() {
            setLoading(true);
            setError(null);
            try {
                let filter = '';
                // Since inputs are already ISO-like strings from datetime-local or similar
                // or we can enforce ISO format.
                if (startDate) {
                    const startISO = new Date(startDate).toISOString();
                    filter += `timestamp >= "${startISO}"`;
                }
                if (endDate) {
                    const endISO = new Date(endDate).toISOString();
                    if (filter) filter += ' && ';
                    filter += `timestamp <= "${endISO}"`;
                }

                // Fetch all matching records sorted by timestamp
                const records = await pb.collection('asvz_updates').getFullList<ASVZUpdate>({
                    sort: 'timestamp',
                    filter: filter,
                    // Add request cancellation handling if needed, but the stable dependency 
                    // should fix the infinite loop.
                });

                setData(records);
            } catch (err) {
                if (err instanceof Error) {
                    // Ignore auto-cancellation errors to avoid state noise
                    if (err.name !== 'AbortError' && !err.message.includes('autocancelled')) {
                        setError(err);
                    }
                } else {
                    setError(new Error('Unknown error fetching updates'));
                }
                console.error("Error fetching updates:", err);
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, [startDate, endDate]);

    return { data, loading, error };
}

export function usePriceData(asvzId: string) {
    const [data, setData] = useState<ASVZPrice[]>([]);
    const [title, setTitle] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        if (!asvzId) {
            setData([]);
            setTitle(null);
            return;
        }

        async function fetchData() {
            setLoading(true);
            setError(null);
            try {
                const records = await pb.collection('asvz_price').getFullList<ASVZPrice>({
                    sort: 'timestamp',
                    filter: `asvz_id = "${asvzId}"`,
                });
                setData(records);

                // Fetch Title and Current/Final Price
                try {
                    const product = await pb.collection('asvz_marketplace').getFirstListItem(`asvz_id="${asvzId}"`);
                    setTitle(product.title);

                    // Add current price as the latest data point
                    if (typeof product.price === 'number') {
                        records.push({
                            id: 'current',
                            asvz_id: asvzId,
                            price: product.price,
                            timestamp: product.updated || new Date().toISOString(),
                            title: product.title
                        });
                    }
                } catch (e) {
                    // Try deleted items
                    try {
                        const deletedProduct = await pb.collection('asvz_marketplace_deleted').getFirstListItem(`asvz_id="${asvzId}"`);
                        setTitle(deletedProduct.title);

                        // Add final price
                        if (typeof deletedProduct.price === 'number') {
                            records.push({
                                id: 'final',
                                asvz_id: asvzId,
                                price: deletedProduct.price,
                                timestamp: deletedProduct.updated || new Date().toISOString(),
                                title: deletedProduct.title
                            });
                        }
                    } catch (e2) {
                        setTitle(null); // Not found
                    }
                }

                // Re-sort data to ensure chronological order after adding current/final price
                records.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

                setData(records);
            } catch (err) {
                if (err instanceof Error) {
                    setError(err);
                } else {
                    setError(new Error('Unknown error fetching prices'));
                }
                console.error("Error fetching prices:", err);
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, [asvzId]);

    return { data, title, loading, error };
}

export function useMarketplaceItems() {
    const [data, setData] = useState<MarketplaceItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        async function fetchItems() {
            setLoading(true);
            try {
                const records = await pb.collection('asvz_marketplace').getFullList<MarketplaceItem>({
                    sort: '-created',
                });
                setData(records);
            } catch (err) {
                if (err instanceof Error) setError(err);
                else setError(new Error('Error fetching marketplace items'));
            } finally {
                setLoading(false);
            }
        }
        fetchItems();
    }, []);

    return { data, loading, error };
}

export type SearchField = 'title' | 'id' | 'user' | 'all';

export function useItemSearch(query: string, includeDeleted: boolean, searchField: SearchField = 'title') {
    const [data, setData] = useState<(MarketplaceItem | MarketplaceDeletedItem)[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        if (!query || query.length < 3) {
            setData([]);
            return;
        }

        async function search() {
            setLoading(true);
            setError(null);
            try {
                let filterExpression = '';

                switch (searchField) {
                    case 'title':
                        filterExpression = `title ~ "${query}"`;
                        break;
                    case 'id':
                        filterExpression = `asvz_id ~ "${query}"`;
                        break;
                    case 'user':
                        filterExpression = `user ~ "${query}"`;
                        break;
                    case 'all':
                    default:
                        filterExpression = `(title ~ "${query}" || asvz_id ~ "${query}" || user ~ "${query}")`;
                        break;
                }

                // Search live items
                const liveItems = await pb.collection('asvz_marketplace').getFullList<MarketplaceItem>({
                    filter: filterExpression,
                    sort: '-created',
                });

                let allItems: (MarketplaceItem | MarketplaceDeletedItem)[] = [...liveItems];

                if (includeDeleted) {
                    const deletedItems = await pb.collection('asvz_marketplace_deleted').getFullList<MarketplaceDeletedItem>({
                        filter: filterExpression,
                        sort: '-created',
                    });

                    // Mark as deleted and ensure fields are present for UI
                    const mappedDeleted = deletedItems.map(item => {
                        const delTime = item.removeTime || item.updated || item.addTime;

                        let duration = '-';
                        if (item.removeTime && item.addTime) {
                            try {
                                duration = formatDistanceStrict(new Date(item.addTime), new Date(item.removeTime));
                            } catch (e) {
                                console.error("Error calculating duration", e);
                            }
                        }

                        return {
                            ...item,
                            // Ensure deleted_date is populated (fallback to updated or created)
                            deleted_date: delTime,
                            last_available: delTime, // Map for UI column
                            duration_online: duration,
                            // Explicit flag for UI check
                            _isDeleted: true
                        };
                    });

                    allItems = [...allItems, ...mappedDeleted];
                }

                setData(allItems);
            } catch (err) {
                if (err instanceof Error) setError(err);
                else setError(new Error('Error searching items'));
                console.error("Search error:", err);
            } finally {
                setLoading(false);
            }
        }

        // Debounce
        const timeoutId = setTimeout(search, 500);
        return () => clearTimeout(timeoutId);

    }, [query, includeDeleted, searchField]);

    return { data, loading, error };
}
