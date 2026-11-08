import { useState, useEffect } from 'react';
import { pb, isRequestAbort } from '../lib/pb';
import { normalizeDeleted, searchFilter } from '../lib/data';
import type { ASVZUpdate, ASVZPrice, MarketplaceItem, MarketplaceDeletedItem, MarketplaceDeletedRecord } from '../types';

export function useUpdatesData(startDate?: string, endDate?: string) {
    const [data, setData] = useState<ASVZUpdate[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        const controller = new AbortController();

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
                    sort: 'timestamp,created,id',
                    filter: filter,
                    signal: controller.signal,
                });

                if (!controller.signal.aborted) setData(records);
            } catch (err) {
                if (controller.signal.aborted || isRequestAbort(err)) return;
                if (err instanceof Error) {
                    setError(err);
                } else {
                    setError(new Error('Unknown error fetching updates'));
                }
                console.error("Error fetching updates:", err);
            } finally {
                if (!controller.signal.aborted) setLoading(false);
            }
        }

        fetchData();
        return () => controller.abort();
    }, [startDate, endDate]);

    return { data, loading, error };
}

export function usePriceData(asvzId: string) {
    const [data, setData] = useState<ASVZPrice[]>([]);
    const [title, setTitle] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        if (!asvzId) return;

        const controller = new AbortController();

        async function fetchData() {
            setLoading(true);
            setError(null);
            try {
                const records = await pb.collection('asvz_price').getFullList<ASVZPrice>({
                    sort: 'timestamp',
                    filter: pb.filter('asvz_id = {:id}', { id: asvzId }),
                    signal: controller.signal,
                });
                if (controller.signal.aborted) return;

                // Fetch Title and Current/Final Price
                try {
                    const product = await pb.collection('asvz_marketplace').getFirstListItem(pb.filter('asvz_id = {:id}', { id: asvzId }), { signal: controller.signal });
                    if (controller.signal.aborted) return;
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
                } catch (err) {
                    if (controller.signal.aborted || isRequestAbort(err)) return;
                    // Try deleted items
                    try {
                        const deletedProduct = await pb.collection('asvz_marketplace_deleted').getFirstListItem(pb.filter('asvz_id = {:id}', { id: asvzId }), { signal: controller.signal });
                        if (controller.signal.aborted) return;
                        setTitle(deletedProduct.title);

                        // Add final price
                        if (typeof deletedProduct.price === 'number') {
                            records.push({
                                id: 'final',
                                asvz_id: asvzId,
                                price: deletedProduct.price,
                                timestamp: deletedProduct.removeTime || deletedProduct.updated || new Date().toISOString(),
                                title: deletedProduct.title
                            });
                        }
                    } catch (err) {
                        if (controller.signal.aborted || isRequestAbort(err)) return;
                        setTitle(null); // Not found
                    }
                }

                // Re-sort data to ensure chronological order after adding current/final price
                records.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

                setData(records);
            } catch (err) {
                if (controller.signal.aborted || isRequestAbort(err)) return;
                if (err instanceof Error) {
                    setError(err);
                } else {
                    setError(new Error('Unknown error fetching prices'));
                }
                console.error("Error fetching prices:", err);
            } finally {
                if (!controller.signal.aborted) setLoading(false);
            }
        }

        fetchData();
        return () => controller.abort();
    }, [asvzId]);

    return asvzId ? { data, title, loading, error } : { data: [], title: null, loading: false, error: null };
}

export function useMarketplaceItems() {
    const [data, setData] = useState<MarketplaceItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        const controller = new AbortController();

        async function fetchItems() {
            setLoading(true);
            setError(null);
            try {
                const records = await pb.collection('asvz_marketplace').getFullList<MarketplaceItem>({
                    sort: '-created',
                    signal: controller.signal,
                });
                if (!controller.signal.aborted) setData(records);
            } catch (err) {
                if (controller.signal.aborted || isRequestAbort(err)) return;
                if (err instanceof Error) setError(err);
                else setError(new Error('Error fetching marketplace items'));
            } finally {
                if (!controller.signal.aborted) setLoading(false);
            }
        }
        fetchItems();
        return () => controller.abort();
    }, []);

    return { data, loading, error };
}

export interface SearchQuery {
    title?: string;
    user?: string;
    id?: string;
}

export function useItemSearch(query: SearchQuery, includeDeleted: boolean) {
    const [data, setData] = useState<(MarketplaceItem | MarketplaceDeletedItem)[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        // If all fields are empty or too short, clear data
        const hasValidTitle = query.title && query.title.length >= 3;
        const hasValidUser = query.user && query.user.length >= 3;
        const hasValidId = query.id && query.id.length >= 3;

        if (!hasValidTitle && !hasValidUser && !hasValidId) return;

        const controller = new AbortController();

        async function search() {
            setLoading(true);
            setError(null);
            try {
                const filterExpression = searchFilter({ title: query.title, user: query.user, id: query.id }, pb.filter.bind(pb));

                // Search live items
                const liveResult = await pb.collection('asvz_marketplace').getFullList<MarketplaceItem>({
                    filter: filterExpression,
                    sort: '-created',
                    signal: controller.signal,
                });
                if (controller.signal.aborted) return;

                let allItems: (MarketplaceItem | MarketplaceDeletedItem)[] = [...liveResult];

                if (includeDeleted) {
                    const deletedResult = await pb.collection('asvz_marketplace_deleted').getFullList<MarketplaceDeletedRecord>({
                        filter: filterExpression,
                        sort: '-created',
                        signal: controller.signal,
                    });
                    if (controller.signal.aborted) return;

                    // Mark as deleted and ensure fields are present for UI
                    const mappedDeleted = deletedResult.map(normalizeDeleted);

                    allItems = [...allItems, ...mappedDeleted];
                }

                setData(allItems);
            } catch (err) {
                if (controller.signal.aborted || isRequestAbort(err)) return;
                if (err instanceof Error) setError(err);
                else setError(new Error('Error searching items'));
                console.error("Search error:", err);
            } finally {
                if (!controller.signal.aborted) setLoading(false);
            }
        }

        // Debounce
        const timeoutId = setTimeout(search, 500);
        return () => {
            clearTimeout(timeoutId);
            controller.abort();
        };

    }, [query.title, query.user, query.id, includeDeleted]);

    const valid = [query.title, query.user, query.id].some(value => value && value.length >= 3);
    return valid ? { data, loading, error } : { data: [], loading: false, error: null };
}
